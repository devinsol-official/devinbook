"use client"

import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Plus, Check, Search, X, Tag, Calendar as CalendarIcon, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { AddCategoryModal } from "./AddCategoryModal"
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { categoryIcons } from "@/lib/categoryIcons"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { useCurrency } from "@/contexts/CurrencyContext"

interface Category {
  id: string
  name: string
  type: "income" | "expense"
  icon?: string
}

interface Account {
  id: string
  name: string
  type: string
  isDefault: boolean
}

interface AddTransactionProps {
  onBack: () => void
  onSuccess: () => void
  initialType?: "income" | "expense" | "transfer"
  initialAccountId?: string
}

export function AddTransaction({ onBack, onSuccess, initialType = "expense", initialAccountId }: AddTransactionProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([])

  // Theme colors
  const isIncome = initialType === "income"
  const isTransfer = initialType === "transfer"
  const activeColor = isIncome ? "bg-green-600" : isTransfer ? "bg-blue-600" : "bg-red-600"
  const activeText = isIncome ? "text-green-600" : isTransfer ? "text-blue-600" : "text-red-600"
  const activeShadow = isIncome ? "shadow-green-600/30" : isTransfer ? "shadow-blue-600/30" : "shadow-red-600/30"
  const activeBorder = isIncome ? "border-green-600" : isTransfer ? "border-blue-600" : "border-red-600"
  const activeBgLight = isIncome ? "bg-green-50" : isTransfer ? "bg-blue-50" : "bg-red-50"

  // Form state
  const { currency } = useCurrency()
  const [amount, setAmount] = useState("")
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null)
  const [toAccountId, setToAccountId] = useState<string | null>(null)
  const [description, setDescription] = useState("")
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isAmountPopupOpen, setIsAmountPopupOpen] = useState(false)
  const [pendingCategory, setPendingCategory] = useState<Category | null>(null)
  const [date, setDate] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
  })
  const [time, setTime] = useState(() => {
    const d = new Date()
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
  })

  useEffect(() => {
    loadData()
    if (initialType === "transfer") {
      setIsAmountPopupOpen(true)
    }
  }, [initialType])

  useEffect(() => {
    if (isTransfer && accounts.length > 0) {
      const standardAccounts = accounts.filter(a => a.type !== "regular billing");
      if (standardAccounts.length < 2) {
        toast({
          title: "Unable to transfer",
          description: "You need more than one standard account to transfer funds.",
          className: "bg-background border-2 border-red-500/20 text-foreground font-medium shadow-xl shadow-red-500/10",
        })
        if (onBack) onBack(); // close or fallback
      }
    }
  }, [isTransfer, accounts, onBack, toast])

  useEffect(() => {
    if (isTransfer && toAccountId === selectedAccountId) {
      setToAccountId(null)
    }
  }, [selectedAccountId, isTransfer])

  useEffect(() => {
    let filtered = categories.filter(c => c.type === initialType)
    if (searchQuery.trim()) {
      filtered = filtered.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    }
    setFilteredCategories(filtered)
  }, [categories, initialType, searchQuery])

  const loadData = async () => {
    try {
      const [categoriesData, accountsData] = await Promise.all([
        api.getCategories(),
        api.getAccounts()
      ])
      setCategories(categoriesData)
      setAccounts(accountsData)

      const defaultAcc = accountsData.find((a: Account) => a.isDefault)
      if (initialAccountId) {
        setSelectedAccountId(initialAccountId)
      } else if (defaultAcc) {
        setSelectedAccountId(defaultAcc.id)
      } else if (accountsData.length > 0) {
        setSelectedAccountId(accountsData[0].id)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load data",
        className: "bg-background border-2 border-red-500/20 text-foreground font-medium shadow-xl shadow-red-500/10",
      })
    }
  }

  const handleAddCategorySuccess = async (newCategoryId?: string) => {
    setIsAddCategoryOpen(false)
    const data = await api.getCategories()
    setCategories(data)
    if (newCategoryId) {
      const newCat = data.find((c: Category) => c.id === newCategoryId)
      if (newCat) {
        setPendingCategory(newCat)
        setSelectedCategoryId(newCategoryId)
        setIsAmountPopupOpen(true)
      }
    }
  }

  const handleSubmit = async () => {
    if (!amount || Number(amount) <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        className: "bg-background border-2 border-red-500/20 text-foreground font-medium shadow-xl shadow-red-500/10",
      })
      return
    }

    if (!isTransfer && !selectedCategoryId) {
      toast({
        title: "Error",
        description: "Please select a group",
        className: "bg-background border-2 border-red-500/20 text-foreground font-medium shadow-xl shadow-red-500/10",
      })
      return
    }

    if (isTransfer && (!selectedAccountId || !toAccountId)) {
      toast({
        title: "Error",
        description: "Please select source and destination accounts",
        className: "bg-background border-2 border-red-500/20 text-foreground font-medium shadow-xl shadow-red-500/10",
      })
      return
    }

    if (isTransfer && selectedAccountId === toAccountId) {
      toast({
        title: "Error",
        description: "Source and destination accounts must be different",
        className: "bg-background border-2 border-red-500/20 text-foreground font-medium shadow-xl shadow-red-500/10",
      })
      return
    }

    setLoading(true)
    try {
      const combinedDate = new Date(`${date}T${time}:00`)
      await api.createTransaction({
        amount: Number(amount),
        categoryId: isTransfer ? undefined : selectedCategoryId,
        accountId: selectedAccountId,
        toAccountId: isTransfer ? toAccountId : undefined,
        type: initialType,
        description,
        date: combinedDate.toISOString(),
      })

      toast({
        title: "Success",
        description: "Added successfully",
      })
      setIsAmountPopupOpen(false)
      onSuccess()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add",
        className: "bg-background border-2 border-red-500/20 text-foreground font-medium shadow-xl shadow-red-500/10",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCategoryClick = (cat: Category) => {
    setPendingCategory(cat)
    setSelectedCategoryId(cat.id)
    setIsAmountPopupOpen(true)
    setAmount("") // Reset amount on new selection
    const d = new Date()
    setDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`)
    setTime(`${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`)
  }

  const handleDateSelect = (d: Date | undefined) => {
    if (!d) return
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, "0")
    const dd = String(d.getDate()).padStart(2, "0")
    setDate(`${yyyy}-${mm}-${dd}`)
  }

  const renderIcon = (iconName?: string) => {
    if (!iconName) return <Tag className="h-6 w-6" />
    const IconComponent = categoryIcons[iconName] || Tag
    return <IconComponent className="h-6 w-6" />
  }

  return (
    <div className="flex flex-col min-h-screen bg-background p-6 space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={onBack} className="rounded-2xl bg-muted/50">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className={`text-xl font-black uppercase tracking-[0.2em] ${activeText}`}>
          {isIncome ? "Add Income" : "Add Expense"}
        </h1>
        <div className="w-10" />
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search categories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-14 pl-11 rounded-3xl bg-muted/30 border-none font-bold placeholder:font-medium focus-visible:ring-primary/20"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-muted/50 flex items-center justify-center hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Category Grid */}
      <div className="flex-1 overflow-y-auto pb-20">
        <div className="grid grid-cols-4 gap-y-8 gap-x-4">
          {filteredCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat)}
              className="flex flex-col items-center gap-2 group transition-all"
            >
              <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center transition-all relative ${selectedCategoryId === cat.id
                ? `${activeColor} text-white shadow-xl ${activeShadow} scale-110`
                : "bg-muted text-muted-foreground hover:bg-muted/80 shadow-sm"
                }`}>
                {renderIcon(cat.icon)}
              </div>
              <span className={`text-[10px] font-black uppercase truncate w-16 text-center ${selectedCategoryId === cat.id ? activeText : "text-muted-foreground"
                }`}>
                {cat.name}
              </span>
            </button>
          ))}

          <button
            onClick={() => setIsAddCategoryOpen(true)}
            className="flex flex-col items-center gap-2 group"
          >
            <div className={`w-16 h-16 rounded-[24px] bg-muted/30 border-2 border-dashed border-muted-foreground/20 flex items-center justify-center text-muted-foreground hover:${activeBorder}/50 hover:${activeBgLight} transition-all`}>
              <Plus className="h-8 w-8" />
            </div>
            <span className="text-[10px] font-black uppercase text-muted-foreground">Add New</span>
          </button>
        </div>
      </div>

      {/* Simple Native-style Bottom Drawer */}
      <Drawer open={isAmountPopupOpen} onOpenChange={setIsAmountPopupOpen}>
        <DrawerContent className="max-w-[450px] mx-auto rounded-t-[40px] border-none shadow-2xl bg-white dark:bg-slate-900 border-t overflow-hidden max-h-[96vh]">
          <div className="mx-auto w-12 h-1.5 bg-muted/30 rounded-full mt-4 mb-2 shrink-0" />
          <DrawerHeader className="sr-only">
            <DrawerTitle>{isTransfer ? "Transfer Funds" : `Add ${initialType === "income" ? "Income" : "Expense"}`}</DrawerTitle>
            <DrawerDescription>Enter the amount and a note for this transaction</DrawerDescription>
          </DrawerHeader>
          <div className="overflow-y-auto w-full px-6 pt-2 pb-10">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSubmit()
              }}
              className="space-y-6"
            >
              {/* Category Icon + Amount Row */}
              <div className="flex items-center justify-between gap-4 mt-2 px-2">
                {!isTransfer && (
                  <div className="flex flex-col items-center shrink-0">
                    <div className={`w-14 h-14 rounded-[20px] ${activeColor} text-white flex items-center justify-center shadow-lg ${activeShadow}`}>
                      {renderIcon(pendingCategory?.icon)}
                    </div>
                    <p className={`text-[9px] font-black uppercase tracking-[0.1em] mt-1.5 ${activeText}`}>
                      {pendingCategory?.name}
                    </p>
                  </div>
                )}

                <div className="flex-1 relative flex items-center justify-end h-16">
                  <input
                    type="number"
                    inputMode="decimal"
                    enterKeyHint="done"
                    placeholder="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className={`border-none bg-transparent text-right pr-2 text-5xl font-black h-full w-full focus:outline-none placeholder:text-muted-foreground/5 ${activeText} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none p-0 leading-none`}
                    autoFocus
                  />
                  <span className={`text-xl font-black ${activeText} mt-1 ml-1 opacity-20`}>{currency}</span>
                </div>
              </div>

              {/* Account Selection */}
              <div className="space-y-3 pt-2">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground text-center">
                  {isTransfer ? "From Account (Source)" : "Select Account"}
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {accounts.filter(a => a.type !== "regular billing").map((acc) => (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => setSelectedAccountId(acc.id)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-[10px] font-black transition-all border-2",
                        selectedAccountId === acc.id
                          ? `${activeBorder} ${activeBgLight} ${activeText}`
                          : "bg-muted/50 border-transparent text-muted-foreground"
                      )}
                    >
                      {acc.name.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {isTransfer && (
                <div className="space-y-3 pt-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground text-center">To Account (Destination)</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {accounts.filter(a => a.type !== "regular billing" && a.id !== selectedAccountId).map((acc) => (
                      <button
                        key={`to-${acc.id}`}
                        type="button"
                        onClick={() => setToAccountId(acc.id)}
                        className={cn(
                          "px-4 py-2 rounded-xl text-[10px] font-black transition-all border-2",
                          toAccountId === acc.id
                            ? `${activeBorder} ${activeBgLight} ${activeText}`
                            : "bg-muted/50 border-transparent text-muted-foreground"
                        )}
                      >
                        {acc.name.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Note Field in Popup */}
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground text-center">Note (Optional)</p>
                <Input
                  placeholder="What was this for?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="h-14 rounded-2xl bg-muted/50 border-none px-6 font-bold placeholder:font-medium text-center focus-visible:ring-primary/20"
                />
              </div>

              {/* Date & Time Selectors */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 flex flex-col items-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground text-center">Date</p>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          "w-full h-14 rounded-2xl bg-muted/50 border-none font-bold text-sm text-foreground flex items-center justify-center gap-2 hover:bg-muted/80"
                        )}
                      >
                        <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span>{format(new Date(`${date}T12:00:00`), "PP")}</span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-3xl border-none shadow-2xl bg-white dark:bg-slate-900" align="center">
                      <Calendar
                        mode="single"
                        selected={new Date(`${date}T12:00:00`)}
                        onSelect={handleDateSelect}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2 flex flex-col items-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground text-center">Time</p>
                  <div className="relative w-full flex items-center">
                    <Clock className="absolute left-4 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="h-14 w-full rounded-2xl bg-muted/50 border-none pl-11 pr-4 font-bold text-center focus-visible:ring-primary/20"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={loading || !amount}
                  className={`w-full h-16 rounded-[24px] text-lg font-black shadow-2xl transition-all active:scale-95 ${activeColor} text-white hover:opacity-90 ${activeShadow}`}
                >
                  {loading ? "Processing..." : isTransfer ? "Transfer Funds" : `Add ${initialType === 'income' ? 'Income' : 'Spending'}`}
                </Button>
              </div>
            </form>
          </div>
        </DrawerContent>
      </Drawer>

      <AddCategoryModal
        isOpen={isAddCategoryOpen}
        onClose={() => setIsAddCategoryOpen(false)}
        onSuccess={handleAddCategorySuccess}
        initialType={initialType === 'transfer' ? 'expense' : initialType}
      />
    </div>
  )
}
