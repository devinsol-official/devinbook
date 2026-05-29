"use client"

import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Plus, Edit, Trash2, Tag, ChevronRight, Crown } from "lucide-react"
import { SwipeableTransactionItem } from "./SwipeableTransactionItem"
import { AddCategoryModal } from "./AddCategoryModal"
import { EditCategoryModal } from "./EditCategoryModal"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import * as Icons from "lucide-react"
import { useSubscription } from "@/contexts/SubscriptionContext"

interface Category {
  id: string
  name: string
  type: "income" | "expense"
  icon?: string
  createdAt: string
  isDefault?: boolean
}

export function Categories() {
  const { toast } = useToast()
  const { isPro, showUpgradeModal } = useSubscription()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [addCategoryType, setAddCategoryType] = useState<"income" | "expense">("expense")

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      setLoading(true)
      const data = await api.getCategories()
      setCategories(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load categories",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCategory = async (category: Category) => {
    if (!confirm(`Are you sure you want to delete "${category.name}"?`)) return

    try {
      const id = category.id || (category as any)._id
      await api.deleteCategory(id)
      toast({ title: "Success", description: "Category deleted" })
      loadCategories()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete category",
        variant: "destructive",
      })
    }
  }

  const renderIcon = (iconName?: string) => {
    if (!iconName) return <Tag className="h-6 w-6 text-muted-foreground" />
    const IconComponent = (Icons as any)[iconName] || Tag
    return <IconComponent className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
  }

  if (loading) return (
    <div className="flex items-center justify-center p-20">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  )

  const incomeCategories = categories.filter(c => c.type === "income")
  const expenseCategories = categories.filter(c => c.type === "expense")

  // Custom (non-default) counts for limit display
  const customExpenseCount = expenseCategories.filter(c => !c.isDefault).length
  const customIncomeCount = incomeCategories.filter(c => !c.isDefault).length
  const FREE_LIMIT = 5

  const handleAddCategory = (type: "income" | "expense") => {
    const count = type === "expense" ? customExpenseCount : customIncomeCount
    if (!isPro && count >= FREE_LIMIT) {
      showUpgradeModal("More Categories")
      return
    }
    setAddCategoryType(type)
    setIsAddModalOpen(true)
  }

  return (
    <div className="space-y-12 pb-20">
      <div className="flex items-center justify-between px-2">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">CATEGORIES</p>
        <Button
          onClick={() => handleAddCategory("expense")}
          size="sm"
          className="rounded-xl font-bold bg-primary/10 text-primary hover:bg-primary/20 flex items-center gap-1.5"
        >
          {!isPro ? <Crown className="h-3.5 w-3.5 text-amber-500" /> : <Plus className="h-4 w-4" />}
          Add Category
        </Button>
      </div>

      {/* Expense Categories */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-4">
          <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Spending
          </h3>
          <div className="flex items-center gap-2">
            {!isPro && (
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                customExpenseCount >= FREE_LIMIT
                  ? "bg-amber-500/20 text-amber-600"
                  : "bg-muted text-muted-foreground"
              }`}>
                {customExpenseCount}/{FREE_LIMIT}
              </span>
            )}
            <button
              onClick={() => handleAddCategory("expense")}
              className="w-7 h-7 rounded-xl bg-muted/50 hover:bg-primary/10 flex items-center justify-center transition-colors"
            >
              {!isPro && customExpenseCount >= FREE_LIMIT
                ? <Crown className="h-3.5 w-3.5 text-amber-500" />
                : <Plus className="h-3.5 w-3.5 text-muted-foreground" />
              }
            </button>
          </div>
        </div>
        <div className="space-y-3">
          {expenseCategories.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border rounded-[32px] p-12 text-center text-muted-foreground shadow-sm">
              <Tag className="h-8 w-8 mx-auto opacity-20 mb-2" />
              <p className="text-xs font-bold">No spending categories</p>
            </div>
          ) : (
            expenseCategories.map((category) => (
              <SwipeableTransactionItem
                key={category.id}
                onEdit={() => { setEditingCategory(category); setIsEditModalOpen(true); }}
                onDelete={() => handleDeleteCategory(category)}
                onClick={() => { setEditingCategory(category); setIsEditModalOpen(true); }}
                canDelete={!category.isDefault}
              >
                <CategoryItem
                  category={category}
                  renderIcon={renderIcon}
                />
              </SwipeableTransactionItem>
            ))
          )}
        </div>
      </div>

      {/* Income Categories */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-4">
          <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Income
          </h3>
          <div className="flex items-center gap-2">
            {!isPro && (
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                customIncomeCount >= FREE_LIMIT
                  ? "bg-amber-500/20 text-amber-600"
                  : "bg-muted text-muted-foreground"
              }`}>
                {customIncomeCount}/{FREE_LIMIT}
              </span>
            )}
            <button
              onClick={() => handleAddCategory("income")}
              className="w-7 h-7 rounded-xl bg-muted/50 hover:bg-primary/10 flex items-center justify-center transition-colors"
            >
              {!isPro && customIncomeCount >= FREE_LIMIT
                ? <Crown className="h-3.5 w-3.5 text-amber-500" />
                : <Plus className="h-3.5 w-3.5 text-muted-foreground" />
              }
            </button>
          </div>
        </div>
        <div className="space-y-3">
          {incomeCategories.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border rounded-[32px] p-12 text-center text-muted-foreground shadow-sm">
              <Plus className="h-8 w-8 mx-auto opacity-20 mb-2" />
              <p className="text-xs font-bold">No income categories</p>
            </div>
          ) : (
            incomeCategories.map((category) => (
              <SwipeableTransactionItem
                key={category.id}
                onEdit={() => { setEditingCategory(category); setIsEditModalOpen(true); }}
                onDelete={() => handleDeleteCategory(category)}
                onClick={() => { setEditingCategory(category); setIsEditModalOpen(true); }}
                canDelete={!category.isDefault}
              >
                <CategoryItem
                  category={category}
                  renderIcon={renderIcon}
                />
              </SwipeableTransactionItem>
            ))
          )}
        </div>
      </div>

      <AddCategoryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={loadCategories}
        initialType={addCategoryType}
      />

      <EditCategoryModal
        category={editingCategory}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setEditingCategory(null)
        }}
        onSuccess={loadCategories}
      />
    </div>
  )
}

function CategoryItem({ category, renderIcon }: any) {
  return (
    <div className="p-5 flex items-center justify-between group transition-colors">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
          {renderIcon(category.icon)}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-black text-sm">{category.name}</p>
            {category.isDefault && (
              <Badge variant="secondary" className="text-[8px] uppercase font-black px-1.5 py-0 rounded-md bg-primary/10 text-primary border-none">
                Default
              </Badge>
            )}
          </div>
          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">{category.type}</p>
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground/20" />
    </div>
  )
}
