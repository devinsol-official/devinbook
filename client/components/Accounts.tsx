"use client"

import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Plus, Edit, Trash2, Wallet, Landmark, User, CreditCard, Download, ArrowLeft, History, ChevronRight, Crown } from "lucide-react"
import { SwipeableTransactionItem } from "./SwipeableTransactionItem"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { AddAccountModal } from "./AddAccountModal"
import { EditAccountModal } from "./EditAccountModal"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from "@/components/ui/drawer"
import { format } from "date-fns"
import { useSubscription } from "@/contexts/SubscriptionContext"

interface Account {
    id: string
    name: string
    type: string
    isDefault: boolean
    isFeatured?: boolean
    balance?: number
}

const ACCOUNT_TYPE_ICONS: Record<string, any> = {
    cash: Wallet,
    bank: Landmark,
    person: User,
    other: CreditCard,
}

const ACCOUNT_TYPE_COLORS: Record<string, string> = {
    cash: "text-blue-500 bg-blue-500/10",
    bank: "text-emerald-500 bg-emerald-500/10",
    person: "text-amber-500 bg-amber-500/10",
    other: "text-slate-500 bg-slate-500/10",
}

export function Accounts() {
    const { toast } = useToast()
    const { isPro, showUpgradeModal } = useSubscription()
    const [accounts, setAccounts] = useState<Account[]>([])
    const [loading, setLoading] = useState(true)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [editingAccount, setEditingAccount] = useState<Account | null>(null)
    const [selectedAccountForDetails, setSelectedAccountForDetails] = useState<Account | null>(null)
    const [accountTransactions, setAccountTransactions] = useState<any[]>([])
    const [loadingTransactions, setLoadingTransactions] = useState(false)

    useEffect(() => {
        loadAccounts()
    }, [])

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

            <div className="space-y-3">
                {accounts.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 border rounded-[32px] p-12 text-center text-muted-foreground shadow-sm">
                        <Wallet className="h-8 w-8 mx-auto opacity-20 mb-2" />
                        <p className="text-xs font-bold">No accounts found</p>
                    </div>
                ) : (
                    accounts.map((account) => (
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
                                loadAccountTransactions(account.id)
                            }}
                            canDelete={!account.isDefault}
                        >
                            <AccountItem
                                account={account}
                            />
                        </SwipeableTransactionItem>
                    ))
                )}
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
                                        Rs {selectedAccountForDetails.balance?.toLocaleString()}
                                    </p>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Current Balance</p>
                                </div>
                            </DrawerHeader>

                            <div className="flex items-center gap-3 px-8 my-4">
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
                                                            <p className="font-black text-sm">{t.categoryId?.name || "Transaction"}</p>
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

                            <DrawerFooter className="px-8 pb-10">
                                <Button onClick={() => setSelectedAccountForDetails(null)} variant="outline" className="h-14 rounded-2xl font-black border-2">
                                    CLOSE
                                </Button>
                            </DrawerFooter>
                        </div>
                    )}
                </DrawerContent>
            </Drawer>
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
