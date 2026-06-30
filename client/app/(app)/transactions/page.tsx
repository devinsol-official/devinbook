"use client"

import { useState, useEffect } from "react"
import useSWR from "swr"
import useSWRInfinite from "swr/infinite"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { api } from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import {
    Plus,
    ArrowUpRight,
    ArrowDownLeft,
    Search,
    Wallet,
    ChevronRight,
    Tag,
    Download
} from "lucide-react"
import { generateFinancialReport } from "@/lib/pdfReportGenerator"
import { useToast } from "@/hooks/use-toast"
import { AddTransaction } from "@/components/AddTransaction"
import { EditTransactionModal } from "@/components/EditTransactionModal"
import { SwipeableTransactionItem } from "@/components/SwipeableTransactionItem"
import * as Icons from "lucide-react"

interface Transaction {
    id: string
    amount: number
    type: "income" | "expense"
    categoryId: any
    accountId?: any
    description?: string
    date: string
    createdAt: string
}

export default function TransactionsPage() {
    const { user } = useAuth()
    const { toast } = useToast()
    const [isAdding, setIsAdding] = useState(false)
    const [addType, setAddType] = useState<"income" | "expense">("expense")
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [selectedAccountId, setSelectedAccountId] = useState<string>("all")

    const getKey = (pageIndex: number, previousPageData: any) => {
        if (previousPageData && !previousPageData.data?.length) return null // reached the end
        return `transactions?accountId=${selectedAccountId}&page=${pageIndex + 1}&limit=50`
    }

    const { data, error, size, setSize, mutate: mutateTransactions, isValidating } = useSWRInfinite(
        getKey,
        async (key) => {
            const url = new URL(`http://localhost/${key}`)
            const acc = url.searchParams.get("accountId")
            const page = Number(url.searchParams.get("page"))
            const limit = Number(url.searchParams.get("limit"))
            return await api.getTransactions(acc === "all" || acc === null ? undefined : acc, page, limit)
        }
    )

    const { data: accountsResponse } = useSWR('accounts', () => api.getAccounts())

    const accounts = accountsResponse || []
    const transactions = data ? data.flatMap(pageData => pageData.data) : []
    
    const loading = !data && !error
    const isLoadingMore = loading || (size > 0 && data && typeof data[size - 1] === "undefined")
    const isEmpty = data?.[0]?.data?.length === 0
    const isReachingEnd = isEmpty || (data && data[data.length - 1]?.data?.length < 50)

    let totalBalance = 0;
    if (selectedAccountId === "all") {
        totalBalance = accounts.reduce((sum: number, acc: any) => sum + acc.balance, 0)
    } else {
        const selected = accounts.find((a: any) => a.id === selectedAccountId)
        totalBalance = selected ? selected.balance : 0
    }

    const handleTransactionClick = (transaction: Transaction) => {
        const catId = transaction.categoryId?._id || transaction.categoryId?.id || transaction.categoryId
        const accId = transaction.accountId?._id || transaction.accountId?.id || transaction.accountId
        setEditingTransaction({
            ...transaction,
            id: transaction.id || (transaction as any)._id,
            categoryId: catId ? String(catId) : "",
            accountId: accId ? String(accId) : ""
        })
        setIsEditModalOpen(true)
    }

    const handleDeleteTransaction = async (transaction: Transaction) => {
        if (!confirm("Are you sure you want to delete this transaction?")) return
        try {
            await api.deleteTransaction(transaction.id || (transaction as any)._id)
            toast({ title: "Success", description: "Deleted successfully" })
            mutateTransactions()
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" })
        }
    }

    const handleDownloadPDF = async () => {
        const income = transactions.reduce((sum, t) => sum + (t.type === 'income' ? t.amount : 0), 0);
        const expenses = transactions.reduce((sum, t) => sum + (t.type === 'expense' ? t.amount : 0), 0);
        
        let accountName = "ALL ACCOUNTS";
        if (selectedAccountId !== "all") {
            const selected = accounts.find((a: any) => a.id === selectedAccountId);
            if (selected) accountName = selected.name.toUpperCase();
        }

        await generateFinancialReport(transactions, { income, expenses, balance: totalBalance }, accountName, accountName.replace(/\s+/g, '_'));
        toast({
            title: "Report Generated",
            description: "Your high-class statement is ready.",
        })
    }

    const groupTransactionsByDate = (txs: Transaction[]) => {
        const groups: Record<string, Transaction[]> = {}
        txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).forEach(tx => {
            const date = new Date(tx.date).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long'
            })
            if (!groups[date]) groups[date] = []
            groups[date].push(tx)
        })
        return groups
    }

    const renderCategoryIcon = (category: any) => {
        if (!category?.icon) return <Tag className="h-5 w-5 text-muted-foreground" />
        const IconComponent = (Icons as any)[category.icon] || Tag
        return <IconComponent className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
    }

    if (isAdding) {
        return (
            <ProtectedRoute>
                <AddTransaction
                    onBack={() => setIsAdding(false)}
                    onSuccess={() => {
                        setIsAdding(false)
                        mutateTransactions()
                    }}
                    initialType={addType}
                />
            </ProtectedRoute>
        )
    }

    const grouped = groupTransactionsByDate(transactions)

    return (
        <ProtectedRoute>
            <div className="flex flex-col min-h-screen pb-24 relative">
                {/* Background orbs */}
                <div className="fixed top-[-60px] left-[-60px] w-64 h-64 rounded-full opacity-20 dark:opacity-10 pointer-events-none" style={{background:'radial-gradient(circle, #818cf8, transparent 70%)', filter:'blur(60px)'}} />
                <div className="fixed top-32 right-[-50px] w-56 h-56 rounded-full opacity-15 dark:opacity-10 pointer-events-none" style={{background:'radial-gradient(circle, #f472b6, transparent 70%)', filter:'blur(55px)'}} />
                {/* Account Balance Header */}
                <div className="relative z-10 p-6 pt-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-6 px-6">
                            <button
                                onClick={() => setSelectedAccountId("all")}
                                className={`flex-shrink-0 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedAccountId === "all" ? "bg-primary text-primary-foreground shadow-lg glow-indigo" : "glass-subtle text-muted-foreground hover:text-foreground"}`}
                            >
                                All Accounts
                            </button>
                            {accounts.map((acc: any) => (
                                <button
                                    key={acc.id}
                                    onClick={() => setSelectedAccountId(acc.id)}
                                    className={`flex-shrink-0 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedAccountId === acc.id ? "bg-primary text-primary-foreground shadow-lg glow-indigo" : "glass-subtle text-muted-foreground hover:text-foreground"}`}
                                >
                                    {acc.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-1">
                        <p className="text-muted-foreground text-sm font-medium">
                            {selectedAccountId === "all" ? "Total Balance" : "Account Balance"}
                        </p>
                        <h1 className="text-4xl font-black tracking-tight">{(totalBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} Rs</h1>
                    </div>

                    <div className="flex gap-4">
                        <Button
                            onClick={() => { setAddType("income"); setIsAdding(true); }}
                            className="w-14 h-14 rounded-2xl bg-green-600 text-white hover:bg-green-700 transition-all active:scale-95 flex items-center justify-center shadow-lg shadow-green-600/20"
                            title="Add Income"
                        >
                            <ArrowDownLeft className="h-6 w-6" />
                        </Button>
                        <Button
                            onClick={() => { setAddType("expense"); setIsAdding(true); }}
                            className="flex-1 h-14 rounded-2xl bg-red-600 text-white hover:bg-red-700 transition-all active:scale-95 flex items-center justify-center gap-3 shadow-lg shadow-red-600/20"
                        >
                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                                <ArrowUpRight className="h-4 w-4" />
                            </div>
                            <span className="font-bold">Add Spent</span>
                        </Button>
                        <Button
                            onClick={handleDownloadPDF}
                            className="w-14 h-14 rounded-2xl bg-slate-800 text-white hover:bg-slate-900 transition-all active:scale-95 flex items-center justify-center shadow-lg shadow-slate-900/20"
                            title="Download PDF Report"
                        >
                            <Download className="h-5 w-5" />
                        </Button>
                    </div>
                </div>

                <div className="relative z-10 flex-1 glass rounded-t-[40px] shadow-2xl border-t border-white/30 dark:border-white/10 p-6 pb-20 space-y-8 min-h-[500px]">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="text-center py-20 text-muted-foreground">
                            <p className="font-bold">No transactions yet</p>
                            <p className="text-sm">Start managing your money today</p>
                        </div>
                    ) : (
                        Object.entries(grouped).map(([date, items]) => (
                            <div key={date} className="space-y-4">
                                <h3 className="text-muted-foreground font-bold text-sm tracking-tight">{date}</h3>
                                <div className="space-y-4">
                                    {items.map((tx) => (
                                        <SwipeableTransactionItem
                                            key={tx.id}
                                            onEdit={() => handleTransactionClick(tx)}
                                            onDelete={() => handleDeleteTransaction(tx)}
                                            onClick={() => handleTransactionClick(tx)}
                                        >
                                            <div
                                                className="flex items-center justify-between group cursor-pointer p-4"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                                        {renderCategoryIcon(tx.categoryId)}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-sm">{tx.description || tx.categoryId?.name || "Untitled"}</p>
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                                                                {tx.type === 'expense' ? 'Spending' : 'Income'} • {tx.categoryId?.name || 'General'}
                                                            </p>
                                                            {(tx as any).accountId && (tx as any).accountId.name !== "Main Wallet" && (
                                                                <>
                                                                    <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                                                                    <p className="text-[10px] uppercase font-black text-primary/60 tracking-tighter">
                                                                        {(tx as any).accountId.name}
                                                                    </p>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="text-right">
                                                        <p className={`font-black ${tx.type === 'income' ? 'text-green-500' : 'text-slate-900 dark:text-white'}`}>
                                                            {tx.type === 'income' ? '+' : '-'}{(tx.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} Rs
                                                        </p>
                                                        <div className={`ml-auto w-4 h-4 rounded-full flex items-center justify-center ${tx.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                                                            {tx.type === 'income' ? <ArrowDownLeft className="h-2 w-2" /> : <ArrowUpRight className="h-2 w-2" />}
                                                        </div>
                                                    </div>
                                                    <ChevronRight className="h-4 w-4 text-muted-foreground/10" />
                                                </div>
                                            </div>
                                        </SwipeableTransactionItem>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                    
                    {/* Load More Button */}
                    {!isEmpty && !isReachingEnd && (
                        <div className="flex justify-center pt-6 pb-2">
                            <Button 
                                variant="outline" 
                                onClick={() => setSize(size + 1)} 
                                disabled={isLoadingMore}
                                className="rounded-2xl font-bold h-12 px-8"
                            >
                                {isLoadingMore ? "Loading..." : "Load More"}
                            </Button>
                        </div>
                    )}
                </div>

            </div>

            <EditTransactionModal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false)
                    setEditingTransaction(null)
                }}
                transaction={editingTransaction}
                onSuccess={() => mutateTransactions()}
            />
        </ProtectedRoute>
    )
}
