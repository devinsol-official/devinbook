"use client"

import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Plus, Edit, Trash2, Wallet, Landmark, User, CreditCard, Download, ArrowLeft, History, ChevronRight, Crown, FileText } from "lucide-react"
import { SwipeableTransactionItem } from "./SwipeableTransactionItem"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { AddTransaction } from "./AddTransaction"
import { AddAccountModal } from "./AddAccountModal"
import { EditAccountModal } from "./EditAccountModal"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from "@/components/ui/drawer"
import { format } from "date-fns"
import { useSubscription } from "@/contexts/SubscriptionContext"
import { useCurrency } from "@/contexts/CurrencyContext"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { ChevronLeft, Calendar } from "lucide-react"
import { DailyLogModal } from "./DailyLogModal"

interface Account {
    id: string
    name: string
    type: string
    isDefault: boolean
    isFeatured?: boolean
    balance?: number
    defaultItems?: any[]
    autoLog?: boolean
}

const ACCOUNT_TYPE_ICONS: Record<string, any> = {
    cash: Wallet,
    bank: Landmark,
    person: User,
    "regular billing": History,
    other: CreditCard,
}

const ACCOUNT_TYPE_COLORS: Record<string, string> = {
    cash: "text-blue-500 bg-blue-500/10",
    bank: "text-emerald-500 bg-emerald-500/10",
    person: "text-amber-500 bg-amber-500/10",
    "regular billing": "text-indigo-500 bg-indigo-500/10",
    other: "text-slate-500 bg-slate-500/10",
}

export function Accounts() {
    const { toast } = useToast()
    const { isPro, showUpgradeModal } = useSubscription()
    const { currency } = useCurrency()
    const [accounts, setAccounts] = useState<Account[]>([])
    const [loading, setLoading] = useState(true)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [editingAccount, setEditingAccount] = useState<Account | null>(null)
    const [selectedAccountForDetails, setSelectedAccountForDetails] = useState<Account | null>(null)
    const [accountTransactions, setAccountTransactions] = useState<any[]>([])
    const [loadingTransactions, setLoadingTransactions] = useState(false)

    const [dailyLogs, setDailyLogs] = useState<any[]>([])
    const [loadingLogs, setLoadingLogs] = useState(false)
    const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().substring(0, 7))
    const [dailySettings, setDailySettings] = useState<any>(null)
    const [isDailyLogModalOpen, setIsDailyLogModalOpen] = useState(false)
    const [selectedDateForLog, setSelectedDateForLog] = useState("")
    const [selectedLogForEditing, setSelectedLogForEditing] = useState<any | null>(null)
    const [isAddingTransaction, setIsAddingTransaction] = useState(false)
    const [addTransactionType, setAddTransactionType] = useState<"income" | "expense" | "transfer">("expense")
    const [activeTab, setActiveTab] = useState<"standard" | "regular">("standard")

    // For Record Payment
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
    const [paymentAmount, setPaymentAmount] = useState("")
    const [recordingPayment, setRecordingPayment] = useState(false)

    useEffect(() => {
        loadAccounts()
        loadDailySettings()
    }, [])

    const loadDailySettings = async () => {
        try {
            const settings = await api.getDailySettings()
            setDailySettings(settings)
        } catch (error) {
            console.error("Failed to load daily settings", error)
        }
    }

    const loadDailyLogs = async (accountId: string, month: string) => {
        try {
            setLoadingLogs(true)
            const data = await api.getDailyLogs(accountId, month)
            setDailyLogs(data)
        } catch (error) {
            console.error("Failed to load daily logs", error)
        } finally {
            setLoadingLogs(false)
        }
    }

    const handlePrevMonth = (accountId: string) => {
        const [year, month] = currentMonth.split("-").map(Number)
        const prev = new Date(year, month - 2, 1)
        const newMonth = prev.toISOString().substring(0, 7)
        setCurrentMonth(newMonth)
        loadDailyLogs(accountId, newMonth)
    }

    const handleNextMonth = (accountId: string) => {
        const [year, month] = currentMonth.split("-").map(Number)
        const next = new Date(year, month, 1)
        const newMonth = next.toISOString().substring(0, 7)
        setCurrentMonth(newMonth)
        loadDailyLogs(accountId, newMonth)
    }

    const handleRecordPayment = async (accountId: string) => {
        if (!paymentAmount || Number(paymentAmount) <= 0) {
            toast({ title: "Error", description: "Please enter a valid amount", variant: "destructive" })
            return
        }
        setRecordingPayment(true)
        try {
            const categories = await api.getCategories()
            const catId = categories[0]?.id;
            await api.createTransaction({
                amount: Number(paymentAmount),
                type: "income",
                categoryId: catId,
                accountId,
                description: `Payment Settlement - ${format(new Date(), "MMMM yyyy")}`,
                date: new Date().toISOString().split("T")[0]
            })
            toast({ title: "Success", description: "Payment recorded successfully" })
            setIsPaymentModalOpen(false)
            setPaymentAmount("")
            loadAccounts()
            if (selectedAccountForDetails) {
                const updatedAccs = await api.getAccounts()
                const updatedAcc = updatedAccs.find((a: any) => a.id === selectedAccountForDetails.id)
                if (updatedAcc) setSelectedAccountForDetails(updatedAcc)
                loadAccountTransactions(selectedAccountForDetails.id)
                loadDailyLogs(selectedAccountForDetails.id, currentMonth)
            }
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to record payment", variant: "destructive" })
        } finally {
            setRecordingPayment(false)
        }
    }

    const getDaysInMonth = (monthStr: string) => {
        const [year, month] = monthStr.split("-").map(Number)
        const date = new Date(year, month - 1, 1)
        const days = []
        while (date.getMonth() === month - 1) {
            days.push(new Date(date))
            date.setDate(date.getDate() + 1)
        }
        return days
    }

    const loadAccounts = async () => {
        try {
            setLoading(true)
            const data = await api.getAccounts()
            setAccounts(data)
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to load accounts",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    const loadAccountTransactions = async (accountId: string) => {
        try {
            setLoadingTransactions(true)
            const data = await api.getTransactions(accountId)
            setAccountTransactions(data)
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to load transactions",
                variant: "destructive",
            })
        } finally {
            setLoadingTransactions(false)
        }
    }

    const handleDownloadCSV = (account: Account) => {
        if (accountTransactions.length === 0) {
            toast({ title: "No Data", description: "This account has no transactions to download." })
            return
        }

        const headers = ["Date", "Type", "Category", "Amount", "Description"]
        const rows = accountTransactions.map(t => [
            format(new Date(t.date), "yyyy-MM-dd"),
            t.type.toUpperCase(),
            t.categoryId?.name || "Uncategorized",
            t.amount,
            t.description || ""
        ])

        const csvContent = [
            headers.join(","),
            ...rows.map(r => r.join(","))
        ].join("\n")

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        const link = document.createElement("a")
        const url = URL.createObjectURL(blob)
        link.setAttribute("href", url)
        link.setAttribute("download", `${account.name}_Transactions_${format(new Date(), "yyyyMMdd")}.csv`)
        link.style.visibility = "hidden"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const handleDownloadPDF = async (account: Account) => {
        try {
            const { generateDailyDeliveriesReport } = await import("@/lib/pdfReportGenerator")
            const days = getDaysInMonth(currentMonth)
            await generateDailyDeliveriesReport(
                account,
                dailyLogs,
                accountTransactions,
                currentMonth,
                days
            )
            toast({ title: "Success", description: "PDF report downloaded successfully" })
        } catch (error: any) {
            toast({ title: "Error", description: "Failed to generate PDF: " + error.message, variant: "destructive" })
        }
    }

    const handleDeleteAccount = async (account: Account) => {
        if (!confirm(`Are you sure you want to delete "${account.name}"?`)) return

        try {
            await api.deleteAccount(account.id)
            toast({ title: "Success", description: "Account deleted" })
            loadAccounts()
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to delete account",
                variant: "destructive",
            })
        }
    }

    if (loading) return (
        <div className="flex items-center justify-center p-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    )

    if (isAddingTransaction) {
        return (
            <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
                <AddTransaction
                    onBack={() => setIsAddingTransaction(false)}
                    onSuccess={() => {
                        setIsAddingTransaction(false)
                        loadAccounts()
                        if (selectedAccountForDetails) {
                            loadAccountTransactions(selectedAccountForDetails.id)
                        }
                    }}
                    initialType={addTransactionType}
                    initialAccountId={selectedAccountForDetails?.id}
                />
            </div>
        )
    }

    return (
        <div className="space-y-12 pb-20">
            <div className="flex items-center justify-between px-2">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">List of Accounts</p>
                <Button
                    onClick={() => {
                        if (!isPro) {
                            showUpgradeModal("Account Management")
                            return
                        }
                        setIsAddModalOpen(true)
                    }}
                    size="sm"
                    className="rounded-xl font-bold bg-primary/10 text-primary hover:bg-primary/20 flex items-center gap-1.5"
                >
                    {!isPro ? (
                        <Crown className="h-3.5 w-3.5 text-amber-500" />
                    ) : (
                        <Plus className="h-4 w-4" />
                    )}
                    Add Account
                    {!isPro && (
                        <Badge className="ml-1 text-[8px] font-black uppercase bg-amber-500/20 text-amber-600 border-none px-1 py-0 rounded-md">PRO</Badge>
                    )}
                </Button>
            </div>

            <div className="flex bg-muted/40 p-1.5 rounded-[22px] border border-muted/20 mt-4">
                <button
                    onClick={() => setActiveTab("standard")}
                    className={cn(
                        "flex-1 py-3 text-center text-xs font-black uppercase tracking-wider rounded-[18px] transition-all",
                        activeTab === "standard"
                            ? "bg-white dark:bg-slate-900 shadow-sm text-foreground scale-[1.02]"
                            : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    Standard Accounts
                </button>
                <button
                    onClick={() => setActiveTab("regular")}
                    className={cn(
                        "flex-1 py-3 text-center text-xs font-black uppercase tracking-wider rounded-[18px] transition-all flex items-center justify-center gap-1.5",
                        activeTab === "regular"
                            ? "bg-white dark:bg-slate-900 shadow-sm text-foreground scale-[1.02]"
                            : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    Regular Billing
                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-black">
                        {accounts.filter(a => a.type === "regular billing").length}
                    </span>
                </button>
            </div>

            <div className="space-y-3">
                {(() => {
                    const filteredAccounts = accounts.filter(a => 
                        activeTab === "regular" ? a.type === "regular billing" : a.type !== "regular billing"
                    )

                    if (filteredAccounts.length === 0) {
                        return (
                            <div className="bg-white dark:bg-slate-900 border rounded-[32px] p-12 text-center text-muted-foreground shadow-sm">
                                <Wallet className="h-8 w-8 mx-auto opacity-20 mb-2" />
                                <p className="text-xs font-bold">
                                    {activeTab === "regular" 
                                        ? "No regular billing accounts found. Create one to track Milk, Yogurt, or subscriptions."
                                        : "No standard accounts found"
                                    }
                                </p>
                            </div>
                        )
                    }

                    const renderAccountList = (list: any[], title: string) => {
                        if (list.length === 0) return null;
                        return (
                            <div className="space-y-3 mb-6">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-2">{title}</h3>
                                {list.map((account) => (
                                    <SwipeableTransactionItem
                                        key={account.id}
                                        onDelete={() => handleDeleteAccount(account)}
                                        onEdit={() => {
                                            if (!isPro) {
                                                showUpgradeModal("Account Management")
                                                return
                                            }
                                            setEditingAccount(account)
                                        }}
                                        onClick={() => {
                                            setSelectedAccountForDetails(account)
                                            if (account.type === "regular billing") {
                                                loadDailyLogs(account.id, currentMonth)
                                            } else {
                                                loadAccountTransactions(account.id)
                                            }
                                        }}
                                        canDelete={!account.isDefault}
                                    >
                                        <AccountItem account={account} />
                                    </SwipeableTransactionItem>
                                ))}
                            </div>
                        );
                    };

                    if (activeTab === "regular") {
                        return renderAccountList(filteredAccounts, "Regular Billing");
                    }

                    const cashBank = filteredAccounts.filter(a => a.type === "cash" || a.type === "bank");
                    const persons = filteredAccounts.filter(a => a.type === "person");
                    const others = filteredAccounts.filter(a => a.type !== "cash" && a.type !== "bank" && a.type !== "person");

                    return (
                        <>
                            {renderAccountList(cashBank, "Cash & Bank")}
                            {renderAccountList(persons, "Persons")}
                            {renderAccountList(others, "Other Accounts")}
                        </>
                    )
                })()}
            </div>

            <AddAccountModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={loadAccounts}
            />

            <EditAccountModal
                isOpen={!!editingAccount}
                onClose={() => setEditingAccount(null)}
                onSuccess={loadAccounts}
                account={editingAccount}
            />

            {/* Account Details Drawer */}
            <Drawer
                open={!!selectedAccountForDetails}
                onOpenChange={(open) => !open && setSelectedAccountForDetails(null)}
            >
                <DrawerContent className="max-w-[500px] mx-auto rounded-t-[40px] border-none shadow-2xl bg-white dark:bg-slate-900 border-t h-[85vh]">
                    <div className="mx-auto w-12 h-1.5 bg-muted/30 rounded-full mt-4 mb-4" />

                    {selectedAccountForDetails && (
                        <div className="flex flex-col h-full overflow-hidden">
                            <DrawerHeader className="px-8 flex flex-row items-center justify-between">
                                <div>
                                    <DrawerTitle className="text-2xl font-black">{selectedAccountForDetails.name}</DrawerTitle>
                                    <DrawerDescription className="text-xs font-bold uppercase tracking-widest mt-1">
                                        {selectedAccountForDetails.type} Account
                                    </DrawerDescription>
                                </div>
                                <div className="text-right">
                                    <p className={cn(
                                        "text-2xl font-black",
                                        (selectedAccountForDetails.balance || 0) >= 0 ? "text-emerald-500" : "text-rose-500"
                                    )}>
                                        {currency} {selectedAccountForDetails.balance?.toLocaleString()}
                                    </p>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Current Balance</p>
                                </div>
                            </DrawerHeader>

                            {selectedAccountForDetails.type === "regular billing" ? (
                                <>
                                    {/* Action row with Month and Record Payment */}
                                    <div className="flex flex-col gap-3 px-8 my-2">
                                        <div className="flex items-center justify-between bg-muted/30 p-2.5 rounded-2xl">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 rounded-lg"
                                                onClick={() => handlePrevMonth(selectedAccountForDetails.id)}
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                            </Button>
                                            <span className="font-black text-xs uppercase tracking-wider text-primary">
                                                {format(new Date(`${currentMonth}-02`), "MMMM yyyy")}
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 rounded-lg"
                                                onClick={() => handleNextMonth(selectedAccountForDetails.id)}
                                            >
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Button
                                                onClick={() => {
                                                    setPaymentAmount(Math.abs(selectedAccountForDetails.balance || 0).toString())
                                                    setIsPaymentModalOpen(true)
                                                }}
                                                className="flex-1 h-12 rounded-2xl font-black bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                                            >
                                                Record Payment
                                            </Button>
                                            <Button
                                                onClick={() => handleDownloadCSV(selectedAccountForDetails)}
                                                variant="outline"
                                                title="Download CSV Statement"
                                                className="h-12 w-12 rounded-2xl border-2 flex items-center justify-center shrink-0 border-muted-foreground/20 text-muted-foreground hover:text-foreground"
                                            >
                                                <Download className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                onClick={() => handleDownloadPDF(selectedAccountForDetails)}
                                                variant="outline"
                                                title="Download PDF Ledger"
                                                className="h-12 w-12 rounded-2xl border-2 flex items-center justify-center shrink-0 border-rose-500/20 text-rose-500 hover:bg-rose-500/5 hover:text-rose-600"
                                            >
                                                <FileText className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Scrollable calendar view */}
                                    <div className="flex-1 overflow-y-auto px-6 pb-20 mt-2">
                                        <div className="space-y-4">
                                            <h4 className="px-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                                <Calendar className="h-3 w-3" /> Monthly Delivery Log
                                            </h4>

                                            {loadingLogs ? (
                                                <div className="flex items-center justify-center py-20">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                                </div>
                                            ) : (
                                                <div className="space-y-2.5">
                                                    {(() => {
                                                        const days = getDaysInMonth(currentMonth)
                                                        const todayStr = new Date().toISOString().split("T")[0]
                                                        
                                                        return days.map(day => {
                                                            const dateStr = day.toISOString().split("T")[0]
                                                            const log = dailyLogs.find(l => l.date && l.date.split("T")[0] === dateStr)
                                                            const isFuture = dateStr > todayStr
                                                            const isToday = dateStr === todayStr

                                                            return (
                                                                <div 
                                                                    key={dateStr}
                                                                    onClick={() => {
                                                                        if (isFuture) return
                                                                        setSelectedDateForLog(dateStr)
                                                                        setSelectedLogForEditing(log || null)
                                                                        setIsDailyLogModalOpen(true)
                                                                    }}
                                                                    className={cn(
                                                                        "p-3 rounded-2xl flex items-center justify-between transition-all",
                                                                        isFuture 
                                                                            ? "bg-slate-50 dark:bg-slate-900/40 opacity-40 cursor-not-allowed border border-dashed border-slate-200 dark:border-slate-800"
                                                                            : log 
                                                                                ? "bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/10 cursor-pointer hover:bg-emerald-500/10"
                                                                                : "bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/10 cursor-pointer hover:bg-rose-500/10"
                                                                    )}
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <div className={cn(
                                                                            "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0",
                                                                            isFuture 
                                                                                ? "bg-slate-200 dark:bg-slate-800 text-slate-500"
                                                                                : log 
                                                                                    ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/20" 
                                                                                    : "bg-rose-500 text-white shadow-sm shadow-rose-500/20"
                                                                        )}>
                                                                            {format(day, "d")}
                                                                        </div>
                                                                        <div>
                                                                            <p className="font-bold text-xs flex items-center gap-1.5">
                                                                                {format(day, "eee, MMM d")}
                                                                                {isToday && (
                                                                                    <span className="text-[8px] bg-indigo-500 text-white px-1.5 py-0.5 rounded-full uppercase tracking-wider font-bold">Today</span>
                                                                                )}
                                                                            </p>
                                                                            <p className="text-[10px] text-muted-foreground font-semibold mt-0.5 max-w-[240px] truncate">
                                                                                {isFuture 
                                                                                    ? "Scheduled" 
                                                                                    : log 
                                                                                        ? log.items.map((i: any) => `${i.name} (${i.quantity}${i.unit})`).join(", ") 
                                                                                        : "Missing - Tap to Log"
                                                                                }
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    {!isFuture && (
                                                                        <div className="text-right">
                                                                            <p className={cn(
                                                                                "font-black text-xs",
                                                                                log ? "text-emerald-500" : "text-rose-500"
                                                                            )}>
                                                                                {log ? `${log.totalAmount.toLocaleString()} ${currency}` : `0 ${currency}`}
                                                                            </p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )
                                                        })
                                                    })()}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="grid grid-cols-3 gap-3 px-8 my-4">
                                        <Button
                                            onClick={() => {
                                                setAddTransactionType("expense")
                                                setIsAddingTransaction(true)
                                            }}
                                            className="h-12 rounded-2xl font-black bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/20"
                                        >
                                            Expense
                                        </Button>
                                        <Button
                                            onClick={() => {
                                                setAddTransactionType("income")
                                                setIsAddingTransaction(true)
                                            }}
                                            className="h-12 rounded-2xl font-black bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                                        >
                                            Income
                                        </Button>
                                        <Button
                                            onClick={() => {
                                                const standardAccounts = accounts.filter(a => a.type !== "regular billing");
                                                if (standardAccounts.length < 2) {
                                                    toast({
                                                        title: "Unable to transfer",
                                                        description: "You need more than one standard account to transfer funds.",
                                                        className: "bg-background border-2 border-red-500/20 text-foreground font-medium shadow-xl shadow-red-500/10",
                                                    });
                                                    return;
                                                }
                                                setAddTransactionType("transfer")
                                                setIsAddingTransaction(true)
                                            }}
                                            className="h-12 rounded-2xl font-black bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                                        >
                                            Transfer
                                        </Button>
                                    </div>
                                    <div className="flex items-center gap-3 px-8 mb-4">
                                        <Button
                                            onClick={() => handleDownloadCSV(selectedAccountForDetails)}
                                            className="flex-1 h-12 rounded-2xl font-black bg-primary/10 text-primary hover:bg-primary/20"
                                        >
                                            <Download className="h-4 w-4 mr-2" /> Export CSV
                                        </Button>
                                    </div>

                                    <div className="flex-1 overflow-y-auto px-6 pb-20">
                                        <div className="space-y-4">
                                            <h4 className="px-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                                <History className="h-3 w-3" /> Recent History
                                            </h4>

                                            {loadingTransactions ? (
                                                <div className="flex items-center justify-center py-20">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                                </div>
                                            ) : accountTransactions.length === 0 ? (
                                                <div className="p-12 text-center text-muted-foreground bg-muted/20 rounded-3xl border border-dashed">
                                                    <p className="text-xs font-bold">No transactions for this account</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {accountTransactions.map((t) => (
                                                        <div key={t.id} className="p-4 bg-muted/30 rounded-3xl flex items-center justify-between group hover:bg-muted/50 transition-colors">
                                                            <div className="flex items-center gap-4">
                                                                <div className={cn(
                                                                    "w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-lg",
                                                                    t.type === "income" ? "bg-emerald-500 shadow-emerald-500/20" : "bg-rose-500 shadow-rose-500/20"
                                                                )}>
                                                                    {t.type === "income" ? <Plus className="h-5 w-5" /> : <div className="w-4 h-1 bg-white rounded-full" />}
                                                                </div>
                                                                <div>
                                                                    <p className="font-black text-sm">{t.description || t.categoryId?.name || "Transaction"}</p>
                                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">
                                                                        {format(new Date(t.date), "MMM dd, yyyy")}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <p className={cn(
                                                                "font-black",
                                                                t.type === "income" ? "text-emerald-500" : "text-rose-500"
                                                            )}>
                                                                {t.type === "income" ? "+" : "-"} {t.amount}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}

                            <DrawerFooter className="px-8 pb-10">
                                <Button onClick={() => setSelectedAccountForDetails(null)} variant="outline" className="h-14 rounded-2xl font-black border-2">
                                    CLOSE
                                </Button>
                            </DrawerFooter>
                        </div>
                    )}
                </DrawerContent>
            </Drawer>

            {selectedAccountForDetails && (
                <DailyLogModal
                    isOpen={isDailyLogModalOpen}
                    onClose={() => setIsDailyLogModalOpen(false)}
                    accountId={selectedAccountForDetails.id}
                    defaultItems={selectedAccountForDetails.defaultItems || []}
                    date={selectedDateForLog}
                    existingLog={selectedLogForEditing}
                    onSuccess={() => {
                        loadDailyLogs(selectedAccountForDetails.id, currentMonth)
                        loadAccounts()
                    }}
                />
            )}

            <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
                <DialogContent className="max-w-md bg-slate-900 border-slate-800 text-white rounded-3xl p-6 shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black">Record Payment</DialogTitle>
                        <DialogDescription className="text-slate-400 text-xs">
                            Record a settlement payment to reduce/clear outstanding dues.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-1">
                            <Label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Payment Amount</Label>
                            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-2xl px-4 h-14">
                                <input
                                    type="number"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                    placeholder="Enter amount"
                                    className="bg-transparent text-lg font-black text-white w-full outline-none"
                                />
                                <span className="text-sm font-black text-slate-400">{currency}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-3 pt-3">
                        <Button
                            variant="outline"
                            onClick={() => setIsPaymentModalOpen(false)}
                            className="flex-1 h-12 rounded-2xl font-bold border-slate-800 text-slate-300 hover:text-white"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={() => selectedAccountForDetails && handleRecordPayment(selectedAccountForDetails.id)}
                            disabled={recordingPayment}
                            className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg glow-emerald"
                        >
                            {recordingPayment ? "Saving..." : "Confirm Payment"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

function AccountItem({ account }: { account: Account }) {
    const Icon = ACCOUNT_TYPE_ICONS[account.type] || ACCOUNT_TYPE_ICONS.other
    const colorClass = ACCOUNT_TYPE_COLORS[account.type] || ACCOUNT_TYPE_COLORS.other

    return (
        <div className="glass rounded-[28px] p-5 flex items-center justify-between group transition-all hover:shadow-lg">
            <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform ${colorClass}`}>
                    <Icon className="h-6 w-6" />
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <p className="font-black text-sm">{account.name}</p>
                        {account.isDefault && (
                            <Badge variant="secondary" className="text-[8px] uppercase font-black px-1.5 py-0 rounded-md bg-primary/10 text-primary border-none">
                                Default
                            </Badge>
                        )}
                        {account.isFeatured && (
                            <Badge variant="secondary" className="text-[8px] uppercase font-black px-1.5 py-0 rounded-md bg-amber-500/10 text-amber-600 border-none">
                                Featured
                            </Badge>
                        )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest leading-none">
                            {account.type}
                        </p>
                        <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                        <p className={cn(
                            "text-[10px] font-black tracking-tight",
                            (account.balance || 0) >= 0 ? "text-emerald-500" : "text-rose-500"
                        )}>
                            RS {account.balance?.toLocaleString() || 0}
                        </p>
                    </div>
                </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground/20" />
        </div>
    )
}
