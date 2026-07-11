"use client"

import { useState, useEffect } from "react"
import useSWR from "swr"
import dynamic from "next/dynamic"
import { useAuth } from "@/contexts/AuthContext"
import { useSubscription } from "@/contexts/SubscriptionContext"
import { useCurrency } from "@/contexts/CurrencyContext"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  DollarSign,
  Share2,
  Calendar,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Download,
  Tag,
  Crown,
  Lock,
  Settings2,
  Wallet
} from "lucide-react"
import { RecentTransactions } from "./RecentTransactions"
import { InitialSetup } from "./InitialSetup"
import { AddTransaction } from "./AddTransaction"
import { EditTransactionModal } from "./EditTransactionModal"
import { EditCategoryModal } from "./EditCategoryModal"
import { ShareReportModal } from "./ShareReportModal"
import { categoryIcons } from "@/lib/categoryIcons"
import { DashboardSkeleton } from "./SkeletonLoader"
import { useToast } from "@/hooks/use-toast"
import { DailyLogModal } from "./DailyLogModal"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useSearchParams } from "next/navigation"
import { SwipeableDailyLogCard } from "./SwipeableDailyLogCard"

const CategoryPieChart = dynamic(
  () => import("./CategoryPieChart").then((mod) => mod.CategoryPieChart),
  { ssr: false, loading: () => <div className="h-64 flex items-center justify-center text-slate-400">Loading chart...</div> }
)

interface Stats {
  balance: number
  income: number
  expenses: number
}

interface ChartData {
  month: number
  year: number
  balance: number
  income: number
  expenses: number
}

const CHART_COLORS = [
  "#ef4444", "#22c55e", "#3b82f6", "#f59e0b", "#8b5cf6",
  "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1"
]



export function Dashboard() {
  const { toast } = useToast()
  const { currency } = useCurrency()
  const [isDailyModalOpen, setIsDailyModalOpen] = useState(false)
  const [dailyLogDate, setDailyLogDate] = useState("")
  const [selectedAccountIdForLog, setSelectedAccountIdForLog] = useState("")
  const [selectedLogForEditing, setSelectedLogForEditing] = useState<any>(null)

  // Use current local date formatted as YYYY-MM
  const currentMonthStr = new Date().toISOString().split("T")[0].substring(0, 7)
  const { data: dailyLogs, mutate: mutateDailyLogs } = useSWR(`daily-logs-${currentMonthStr}`, () => api.getDailyLogs(undefined, currentMonthStr))

  const todayStr = new Date().toISOString().split("T")[0]

  const handleQuickLog = async (acc: any) => {
    if (!acc.defaultItems || acc.defaultItems.length === 0) {
      toast({
        title: "Configuration Required",
        description: `Please set up items for ${acc.name} in account settings first.`,
        variant: "destructive"
      })
      return
    }
    try {
      await api.createOrUpdateDailyLog({
        date: todayStr,
        accountId: acc.id,
        items: acc.defaultItems
      })
      toast({ title: "Success", description: `Daily deliveries logged for ${acc.name}!` })
      mutateDailyLogs()
      loadDashboardData()
    } catch (err: any) {
      toast({ title: "Failed to log", description: err.message, variant: "destructive" })
    }
  }
  const searchParams = useSearchParams()
  const { isPro, showUpgradeModal } = useSubscription()
  const [filter, setFilter] = useState("month")
  const [isAdding, setIsAdding] = useState(false)
  const [addType, setAddType] = useState<"income" | "expense" | "transfer">("expense")
  const [viewType, setViewType] = useState<"income" | "expense">("expense")
  const [editingTransaction, setEditingTransaction] = useState<any | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<any | null>(null)
  const [isEditCategoryModalOpen, setIsEditCategoryModalOpen] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  const { data: categories } = useSWR('categories', () => api.getCategories())
  const { data: statsResponse, mutate: mutateStats } = useSWR('dashboard-stats', () => api.getDashboardStats())
  const { data: transactionsData, mutate: mutateTransactions } = useSWR('dashboard-transactions', () => api.getTransactions(undefined, 1, 50))
  const { data: accountsResponse, mutate: mutateAccounts } = useSWR('accounts', () => api.getAccounts())

  const loading = !categories || !statsResponse || !transactionsData || !accountsResponse
  const needsSetup = categories?.length === 0

  const allTransactions = transactionsData?.data || transactionsData || [] // Fallback for old cache
  const accounts = accountsResponse || []
  const stats = statsResponse
  const recentTransactions = allTransactions.slice(0, 5)

  useEffect(() => {
    if (searchParams.get("action") === "add") {
      setIsAdding(true)
    }
  }, [searchParams])

  const loadDashboardData = async () => {
    // Revalidate data after mutations
    mutateStats()
    mutateTransactions()
    mutateAccounts()
  }

  const getFilteredStats = () => {
    if (!stats) return { income: 0, expenses: 0, balance: 0 }

    switch (filter) {
      case "week": return stats.weekly || { income: 0, expenses: 0, balance: 0 }
      case "month": return stats.monthly || { income: 0, expenses: 0, balance: 0 }
      default:
        const monthsToLookBack = filter === "3months" ? 3 : filter === "6months" ? 6 : 12
        const periodData = stats.monthWise?.slice(-monthsToLookBack) || []
        const income = periodData.reduce((sum: number, d: any) => sum + (d.income || 0), 0)
        const expenses = periodData.reduce((sum: number, d: any) => sum + (d.expenses || 0), 0)
        return { income, expenses, balance: income - expenses }
    }
  }

  const handleShareReport = () => {
    if (!isPro) {
      showUpgradeModal("Share Report")
      return
    }
    setIsShareModalOpen(true)
  }

  const handleDownloadPDF = async () => {
    if (!isPro) {
      showUpgradeModal("PDF Export")
      return
    }
    const { generateFinancialReport } = await import("@/lib/pdfReportGenerator")
    const currentStats = getFilteredStats()
    const periodLabel = filter === "month" ? "THIS MONTH" : filter === "week" ? "THIS WEEK" : filter.toUpperCase()
    await generateFinancialReport(allTransactions, currentStats, periodLabel)
    toast({
      title: "Report Generated",
      description: "Your high-class statement is ready.",
    })
  }


  const getCategoryStats = () => {
    const transactions = allTransactions.filter((t: any) => t.type === viewType)
    const groups: Record<string, { total: number; transactions: any[]; category: any }> = {}

    transactions.forEach((t: any) => {
      const catId = (t.categoryId?._id || t.categoryId?.id || (typeof t.categoryId === 'string' ? t.categoryId : "unassigned")) as string
      if (!groups[catId]) {
        groups[catId] = {
          total: 0,
          transactions: [],
          category: t.categoryId && typeof t.categoryId === 'object' ? t.categoryId : { name: "Other", icon: "Tag" }
        }
      }
      groups[catId].total += t.amount
      groups[catId].transactions.push(t)
    })

    return Object.entries(groups)
      .map(([id, data], index) => ({
        id,
        name: data.category.name,
        value: data.total,
        icon: data.category.icon,
        color: CHART_COLORS[index % CHART_COLORS.length],
        transactions: data.transactions
      }))
      .sort((a, b) => b.value - a.value)
  }

  const renderIcon = (iconName?: string) => {
    const IconComponent = iconName && categoryIcons[iconName] ? categoryIcons[iconName] : Tag
    return <IconComponent className="h-5 w-5" />
  }

  const handleTransactionClick = (transaction: any) => {
    const catId = transaction.categoryId?._id || transaction.categoryId?.id || transaction.categoryId
    const accId = transaction.accountId?._id || transaction.accountId?.id || transaction.accountId
    setEditingTransaction({
      ...transaction,
      id: transaction.id || transaction._id,
      categoryId: catId ? String(catId) : "",
      accountId: accId ? String(accId) : ""
    })
    setIsEditModalOpen(true)
  }

  const handleDeleteTransaction = async (transaction: any) => {
    if (!confirm("Are you sure you want to delete this transaction?")) return

    const txId = transaction.id || transaction._id;
    const currentTxList = Array.isArray(transactionsData) ? transactionsData : transactionsData?.data || [];
    const updatedTxList = currentTxList.filter((t: any) => (t.id || t._id) !== txId);

    // Optimistically update the UI cache
    if (Array.isArray(transactionsData)) {
      mutateTransactions(updatedTxList, { revalidate: false });
    } else if (transactionsData && typeof transactionsData === "object") {
      mutateTransactions({ ...transactionsData, data: updatedTxList }, { revalidate: false });
    }

    try {
      await api.deleteTransaction(txId);
      toast({ title: "Success", description: "Deleted successfully" });
      loadDashboardData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      loadDashboardData(); // Rollback/Refetch
    }
  }

  if (loading) return <DashboardSkeleton />
  if (needsSetup) return <InitialSetup onComplete={loadDashboardData} />

  if (isAdding) {
    return (
      <AddTransaction
        onBack={() => setIsAdding(false)}
        onSuccess={() => {
          setIsAdding(false)
          loadDashboardData()
        }}
        initialType={addType}
      />
    )
  }

  const currentStats = getFilteredStats()
  const categoryStats = getCategoryStats()

  return (
    <div className="flex flex-col min-h-screen pb-24 relative">
      {/* Background orbs */}
      <div className="fixed top-[-80px] right-[-60px] w-72 h-72 rounded-full opacity-20 dark:opacity-10 pointer-events-none" style={{background:'radial-gradient(circle, #a78bfa, transparent 70%)', filter:'blur(50px)'}} />
      <div className="fixed bottom-24 left-[-80px] w-64 h-64 rounded-full opacity-15 dark:opacity-10 pointer-events-none" style={{background:'radial-gradient(circle, #34d399, transparent 70%)', filter:'blur(50px)'}} />
      <div className="relative z-10 p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Overview</h1>
            <p className="text-muted-foreground text-sm font-medium">Insights into your finances</p>
          </div>
          <Button
            variant="outline"
            size="icon"
            className="rounded-2xl relative"
            onClick={handleShareReport}
          >
            <Share2 className="h-5 w-5" />
            {!isPro && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center">
                <Crown className="h-2.5 w-2.5 text-white" />
              </span>
            )}
          </Button>
        </div>

        {/* Daily Tracking Banners */}
        {accounts.filter((a: any) => a.type === "regular billing" && a.isFeatured).map((acc: any) => {
          const accountLogs = dailyLogs?.filter((l: any) => l.accountId === acc.id) || []
          const todayLog = accountLogs.find((l: any) => l.date && l.date.split("T")[0] === todayStr)
          
          return (
            <SwipeableDailyLogCard
              key={acc.id}
              isLogged={!!todayLog}
              onModify={() => {
                setDailyLogDate(todayStr)
                setSelectedAccountIdForLog(acc.id)
                setSelectedLogForEditing(todayLog || null)
                setIsDailyModalOpen(true)
              }}
              onClick={() => {
                if (todayLog) {
                  toast({
                    title: "Already Logged",
                    description: "Deliveries for today are already recorded. Slide left to edit.",
                  })
                } else {
                  handleQuickLog(acc)
                }
              }}
            >
              <div className="glass bg-slate-900/60 rounded-[32px] p-6 border border-slate-800 shadow-xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center shrink-0">
                    <span className="text-2xl">🥛</span>
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-black text-sm uppercase tracking-wide text-white">{acc.name}</h4>
                    <p className="text-xs text-slate-400 font-medium">
                      {todayLog 
                        ? `Logged: ${todayLog.items.map((i: any) => `${i.name} (${i.quantity}${i.unit})`).join(", ")} (${todayLog.totalAmount} ${currency})`
                        : `Have you received your daily items? Tap to confirm.`
                      }
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {todayLog ? (
                    <div className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Received
                    </div>
                  ) : (
                    <div className="text-xs font-bold text-slate-400 bg-slate-800/40 border border-slate-800/60 px-3 py-1.5 rounded-xl">
                      Tap to Log
                    </div>
                  )}
                </div>
              </div>
            </SwipeableDailyLogCard>
          )
        })}

        {/* Filter Selection */}
        <div className="flex items-center gap-3">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px] h-10 rounded-xl border-none bg-muted/50 font-bold focus:ring-0">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-none shadow-2xl">
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="year">Last Year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-4">
          <Card className="rounded-[40px] border-none overflow-hidden relative glass-dark text-white shadow-2xl">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <DollarSign className="w-24 h-24" />
            </div>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-1">
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Total Balance</p>
                <h2 className="text-5xl font-black tracking-tighter">
                  {(accounts.reduce((sum: number, acc: any) => sum + acc.balance, 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}
                </h2>
              </div>

              {/* Featured Accounts */}
              {accounts.some((a: any) => a.isFeatured) && (
                <div className="flex flex-wrap gap-4 py-2 border-y border-white/5">
                  {accounts.filter((a: any) => a.isFeatured).map((acc: any) => (
                    <div key={acc.id} className="space-y-0.5">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">{acc.name}</p>
                      <p className="font-black text-sm">{(acc.balance || 0).toLocaleString()} {currency}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-6 pt-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                    <ArrowUpRight className="h-4 w-4 text-green-400" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Income</p>
                    <p className="font-bold text-sm text-green-400">+{(currentStats?.income || 0).toLocaleString()} {currency}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                    <ArrowDownLeft className="h-4 w-4 text-red-400" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Spent</p>
                    <p className="font-bold text-sm text-red-400">-{(currentStats?.expenses || 0).toLocaleString()} {currency}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* New Transaction Buttons */}
          <div className="flex gap-4">
            <Button
              onClick={() => { setAddType("income"); setIsAdding(true); }}
              className="w-16 h-16 rounded-3xl bg-green-600 text-white hover:bg-green-700 transition-all active:scale-95 flex items-center justify-center shadow-xl shadow-green-600/20"
              title="Add Income"
            >
              <ArrowDownLeft className="h-7 w-7" />
            </Button>
            <Button
              onClick={() => { setAddType("expense"); setIsAdding(true); }}
              className="flex-1 h-16 rounded-3xl bg-red-600 text-white hover:bg-red-700 transition-all active:scale-95 flex items-center justify-center gap-3 shadow-xl shadow-red-600/20"
            >
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                <ArrowUpRight className="h-4 w-4" />
              </div>
              <span className="font-black text-lg">Add Spent</span>
            </Button>
            <Button
              onClick={() => {
                const standardAccounts = accounts.filter((a: any) => a.type !== "regular billing");
                if (standardAccounts.length < 2) {
                  toast({
                    title: "Unable to transfer",
                    description: "You need more than one standard account to transfer funds.",
                    className: "bg-background border-2 border-red-500/20 text-foreground font-medium shadow-xl shadow-red-500/10",
                  });
                  return;
                }
                setAddType("transfer");
                setIsAdding(true);
              }}
              className="w-16 h-16 rounded-3xl bg-blue-600 text-white hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center shadow-xl shadow-blue-600/20"
              title="Transfer Funds"
            >
              <Wallet className="h-6 w-6" />
            </Button>
          </div>
        </div>

        {/* Analytics Section */}
        <div className="space-y-6 pt-2">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xl font-black tracking-tight">Category Distribution</h3>
            <div className="bg-muted/50 p-1 rounded-xl flex gap-1">
              <button
                onClick={() => setViewType("expense")}
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${viewType === "expense" ? "bg-red-600 text-white shadow-lg shadow-red-600/20" : "text-muted-foreground"
                  }`}
              >
                Spent
              </button>
              <button
                onClick={() => setViewType("income")}
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${viewType === "income" ? "bg-green-600 text-white shadow-lg shadow-green-600/20" : "text-muted-foreground"
                  }`}
              >
                Income
              </button>
            </div>
          </div>

          <div className="glass rounded-[32px] p-4">
            <CategoryPieChart data={categoryStats} />
          </div>
        </div>

        {/* Group Breakdown */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xl font-black tracking-tight">Top {viewType === 'expense' ? 'Spending' : 'Sources'}</h3>
          </div>

          {!isPro ? (
            // Blurred premium breakdown for free users
            <div className="relative rounded-[32px] overflow-hidden">
              {/* Blurred fake items behind overlay */}
              <div className="space-y-3 select-none pointer-events-none" style={{ filter: "blur(6px)", opacity: 0.5 }}>
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white dark:bg-slate-950 rounded-[28px] border shadow-sm p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl" style={{ backgroundColor: ["#ef4444","#3b82f6","#f59e0b"][i] }} />
                      <div className="space-y-1.5">
                        <div className="h-3 w-24 bg-muted rounded-full" />
                        <div className="h-2 w-16 bg-muted/60 rounded-full" />
                      </div>
                    </div>
                    <div className="h-4 w-20 bg-muted rounded-full" />
                  </div>
                ))}
              </div>

              {/* Frosted overlay */}
              <div
                className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-[32px]"
                style={{ background: "linear-gradient(to bottom, transparent 0%, rgba(128,128,128,0.05) 30%, rgba(255,255,255,0.88) 60%)" }}
              >
                <div className="text-center space-y-3 px-6">
                  <div className="w-14 h-14 rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/30">
                    <Crown className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <p className="font-black text-base">Upgrade to see breakdown</p>
                    <p className="text-muted-foreground text-xs font-medium mt-1">Category-wise analysis is a Pro feature</p>
                  </div>
                  <Button
                    onClick={() => showUpgradeModal("Category Breakdown")}
                    className="h-11 px-6 rounded-2xl font-black text-sm shadow-lg shadow-indigo-500/20"
                    style={{ background: "linear-gradient(135deg, #6366f1, #a855f7)" }}
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    Upgrade to Pro
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
            {categoryStats.length === 0 ? (
              <div className="bg-muted/10 rounded-[32px] p-8 text-center text-muted-foreground italic font-medium">
                No entries found for this type.
              </div>
            ) : (
              categoryStats.map((cat) => (
                <div key={cat.id} className="glass rounded-[28px] overflow-hidden transition-all">
                  <div
                    onClick={() => setExpandedCategory(expandedCategory === cat.id ? null : cat.id)}
                    className="p-5 flex items-center justify-between cursor-pointer group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: cat.color }}>
                        {renderIcon(cat.icon)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-black text-sm uppercase tracking-wide">{cat.name}</p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-full sm:opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingCategory({
                                id: cat.id,
                                name: cat.name,
                                icon: cat.icon,
                                type: viewType
                              });
                              setIsEditCategoryModalOpen(true);
                            }}
                          >
                            <Settings2 className="h-3 w-3 text-muted-foreground" />
                          </Button>
                        </div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                          {((cat.value / (viewType === 'expense' ? currentStats.expenses : currentStats.income)) * 100).toFixed(0)}% of total
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-black text-lg">{cat.value.toLocaleString()} {currency}</p>
                      </div>
                      <div className="flex items-center">
                        {expandedCategory === cat.id ? (
                          <ChevronUp className="h-5 w-5 text-muted-foreground/30" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                        )}
                      </div>
                    </div>
                  </div>

                  {expandedCategory === cat.id && (
                    <div className="px-5 pb-5 pt-0 space-y-3 border-t bg-muted/5">
                      <div className="pt-4 space-y-3">
                        {cat.transactions.map((tx: any) => (
                          <div
                            key={tx.id}
                            onClick={() => handleTransactionClick(tx)}
                            className="flex items-center justify-between py-2 border-b border-dashed last:border-0 border-muted-foreground/10 cursor-pointer hover:bg-muted/50 -mx-2 px-2 rounded-xl active:scale-[0.98] transition-all"
                          >
                            <div>
                              <p className="font-bold text-xs">{tx.description || "No description"}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {new Date(tx.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                              </p>
                            </div>
                            <p className="font-black text-sm">{tx.amount.toLocaleString()} {currency}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
            </div>
          )}
        </div>

        {/* Global Recent Activity */}
        <div className="space-y-6 pt-2">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xl font-black tracking-tight">Recent Activity</h3>
            <Button variant="link" className="text-muted-foreground font-bold flex items-center gap-1" onClick={() => window.location.href = '/transactions'}>
              View All <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="glass rounded-[32px] p-2">
            <RecentTransactions
              transactions={recentTransactions}
              onTransactionClick={handleTransactionClick}
              onDeleteTransaction={handleDeleteTransaction}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 pb-8 space-y-6">
          <Button
            onClick={handleDownloadPDF}
            className={cn(
              "w-full h-16 rounded-[24px] text-lg font-black flex items-center justify-center gap-3 relative",
              isPro
                ? "bg-[#5a4cf1] hover:bg-[#4a3ce1] shadow-xl shadow-indigo-500/20"
                : "bg-muted text-muted-foreground cursor-pointer hover:bg-muted/80"
            )}
          >
            {isPro ? (
              <Download className="h-6 w-6" />
            ) : (
              <Crown className="h-6 w-6 text-amber-500" />
            )}
            Download Detailed PDF
            {!isPro && (
              <span className="absolute right-5 top-1/2 -translate-y-1/2 bg-amber-500/20 text-amber-600 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border border-amber-500/30">
                PRO
              </span>
            )}
          </Button>

        </div>
      </div>

      <EditTransactionModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setEditingTransaction(null)
        }}
        transaction={editingTransaction}
        onSuccess={loadDashboardData}
      />

      <EditCategoryModal
        isOpen={isEditCategoryModalOpen}
        onClose={() => {
          setIsEditCategoryModalOpen(false)
          setEditingCategory(null)
        }}
        category={editingCategory}
        onSuccess={loadDashboardData}
      />

      <ShareReportModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />

      {isDailyModalOpen && selectedAccountIdForLog && (
        <DailyLogModal
          isOpen={isDailyModalOpen}
          onClose={() => {
            setIsDailyModalOpen(false)
            setSelectedAccountIdForLog("")
            setSelectedLogForEditing(null)
          }}
          accountId={selectedAccountIdForLog}
          defaultItems={
            (accounts.find((a: any) => a.id === selectedAccountIdForLog)?.defaultItems || [])
          }
          date={dailyLogDate}
          existingLog={selectedLogForEditing}
          onSuccess={() => {
            mutateDailyLogs()
            loadDashboardData()
          }}
        />
      )}
    </div>
  )
}
