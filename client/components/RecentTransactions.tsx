"use client"

import { useState } from "react"
import { ArrowUpRight, ArrowDownLeft, ChevronRight, Edit2, Trash2 } from "lucide-react"
import { SwipeableTransactionItem } from "./SwipeableTransactionItem"
import { useCurrency } from "@/contexts/CurrencyContext"

interface Transaction {
  id: string
  amount: number
  type: "income" | "expense"
  categoryId: any
  accountId?: any
  itemId: any
  description?: string
  date: string
  createdAt: string
}

interface RecentTransactionsProps {
  transactions: Transaction[]
  onTransactionUpdate?: () => void
  onTransactionClick?: (transaction: Transaction) => void
  onDeleteTransaction?: (transaction: Transaction) => void
}

export function RecentTransactions({ transactions, onTransactionUpdate, onTransactionClick, onDeleteTransaction }: RecentTransactionsProps) {
  const { currency } = useCurrency()

  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-[32px]">
        <p className="font-bold">No activity yet</p>
        <p className="text-sm">Your transactions will appear here</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-2">
      {transactions.map((transaction) => (
        <SwipeableTransactionItem
          key={transaction.id}
          onEdit={() => onTransactionClick?.(transaction)}
          onDelete={() => onDeleteTransaction?.(transaction)}
          onClick={() => onTransactionClick?.(transaction)}
        >
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center ${transaction.type === "income"
                  ? "bg-green-100 text-green-600 dark:bg-green-500/10"
                  : "bg-red-100 text-red-600 dark:bg-red-500/10"
                  }`}
              >
                {transaction.type === "income" ? (
                  <ArrowDownLeft className="h-5 w-5" />
                ) : (
                  <ArrowUpRight className="h-5 w-5" />
                )}
              </div>
              <div className="space-y-0.5">
                <p className="font-black text-sm">{transaction.description || transaction.categoryId?.name || "Untitled Entry"}</p>
                <div className="flex items-center gap-2">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest leading-none">
                    {new Date(transaction.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                  </p>
                  {transaction.accountId && transaction.accountId.name !== "Main Wallet" && (
                    <>
                      <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                      <p className="text-[10px] uppercase font-black text-primary/60 tracking-tighter leading-none">
                        {transaction.accountId.name}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <p className={`font-black tracking-tight ${transaction.type === "income" ? "text-green-600" : "text-slate-900 dark:text-white"}`}>
                {transaction.type === "income" ? "+" : "-"}{transaction.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}
              </p>
              <ChevronRight className="h-4 w-4 text-muted-foreground/10" />
            </div>
          </div>
        </SwipeableTransactionItem>
      ))}
    </div>
  )
}
