"use client"

import React, { useState, useEffect } from "react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Plus, Trash2, Edit } from "lucide-react"
import { useCurrency } from "@/contexts/CurrencyContext"

interface DailyItem {
  name: string
  quantity: number
  unit: string
  pricePerUnit: number
}

interface DailyLogModalProps {
  isOpen: boolean
  onClose: () => void
  accountId: string
  defaultItems: DailyItem[]
  date: string // YYYY-MM-DD
  existingLog?: any
  onSuccess: () => void
}

export function DailyLogModal({
  isOpen,
  onClose,
  accountId,
  defaultItems,
  date,
  existingLog,
  onSuccess
}: DailyLogModalProps) {
  const { toast } = useToast()
  const { currency } = useCurrency()
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<DailyItem[]>([])

  useEffect(() => {
    if (isOpen) {
      if (existingLog && existingLog.items) {
        setItems(existingLog.items.map((i: any) => ({
          name: i.name,
          quantity: i.quantity,
          unit: i.unit || "kg",
          pricePerUnit: i.pricePerUnit
        })))
      } else {
        setItems(defaultItems.map(i => ({ ...i })))
      }
    }
  }, [isOpen, existingLog, defaultItems])

  const handleQtyChange = (index: number, val: number) => {
    const newItems = [...items]
    newItems[index].quantity = Math.max(0, Math.round(val * 100) / 100)
    setItems(newItems)
  }

  const handlePriceChange = (index: number, val: number) => {
    const newItems = [...items]
    newItems[index].pricePerUnit = Math.max(0, val)
    setItems(newItems)
  }

  const handleItemNameChange = (index: number, name: string) => {
    const newItems = [...items]
    newItems[index].name = name
    setItems(newItems)
  }

  const handleItemUnitChange = (index: number, unit: string) => {
    const newItems = [...items]
    newItems[index].unit = unit
    setItems(newItems)
  }

  const handleAddItem = () => {
    setItems([...items, { name: "New Item", quantity: 1, unit: "kg", pricePerUnit: 100 }])
  }

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    if (items.length === 0) {
      toast({
        title: "Error",
        description: "Please include at least one item",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      await api.createOrUpdateDailyLog({
        date,
        accountId,
        items
      })
      toast({
        title: "Success",
        description: existingLog ? "Daily deliveries updated" : "Daily deliveries logged successfully"
      })
      onSuccess()
      onClose()
    } catch (err: any) {
      toast({
        title: "Failed to save",
        description: err.message,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!existingLog || !existingLog.id) return
    if (!confirm("Are you sure you want to delete this log?")) return

    setLoading(true)
    try {
      await api.deleteDailyLog(existingLog.id)
      toast({
        title: "Success",
        description: "Daily deliveries log deleted"
      })
      onSuccess()
      onClose()
    } catch (err: any) {
      toast({
        title: "Failed to delete",
        description: err.message,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.pricePerUnit), 0)

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md bg-slate-900 border-slate-800 text-white rounded-3xl p-6 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-center flex items-center justify-between">
            <span>{existingLog ? "Modify Daily Log" : "Add Daily Deliveries"}</span>
            <span className="text-xs bg-slate-800 text-slate-400 px-3 py-1 rounded-xl font-bold">
              {new Date(date).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
            </span>
          </DialogTitle>
          <DialogDescription className="text-slate-400 text-xs">
            Review and adjust quantities or prices for this delivery day.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 max-h-[300px] overflow-y-auto pr-1">
          {items.map((item, index) => (
            <div key={index} className="glass-subtle bg-slate-950/40 p-4 rounded-2xl border border-slate-800 space-y-3 relative group">

              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-white">{item.name}</span>
                <span className="text-[10px] bg-slate-800 text-slate-400 font-black px-2 py-0.5 rounded uppercase tracking-wider">{item.unit}</span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1 flex-1">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Quantity</label>
                  <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-2 py-1">
                    <button
                      type="button"
                      onClick={() => handleQtyChange(index, item.quantity - (item.unit === "kg" ? 0.5 : 1))}
                      className="text-slate-400 hover:text-white font-bold w-6 h-6 flex items-center justify-center rounded-lg bg-slate-900 active:scale-90"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      step={item.unit === "kg" ? "0.1" : "1"}
                      value={item.quantity}
                      onChange={(e) => handleQtyChange(index, parseFloat(e.target.value) || 0)}
                      className="bg-transparent text-center text-xs font-black text-white w-12 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleQtyChange(index, item.quantity + (item.unit === "kg" ? 0.5 : 1))}
                      className="text-slate-400 hover:text-white font-bold w-6 h-6 flex items-center justify-center rounded-lg bg-slate-900 active:scale-90"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="space-y-1 flex-1">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Price ({item.unit})</label>
                  <div className="flex items-center bg-slate-950/20 border border-slate-800/40 rounded-xl px-3 h-8 text-slate-400 text-xs font-bold">
                    <span>{item.pricePerUnit} {currency}</span>
                  </div>
                </div>

                <div className="text-right shrink-0 min-w-[70px]">
                  <p className="text-[9px] font-black uppercase text-slate-500">Total</p>
                  <p className="text-sm font-black text-emerald-400">{(item.quantity * item.pricePerUnit).toLocaleString()} {currency}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end items-center py-2 border-t border-slate-800/60 mt-2">
          <div className="text-right">
            <p className="text-[10px] font-black uppercase text-slate-400">Billing Sum</p>
            <p className="text-xl font-black text-white">{totalAmount.toLocaleString()} {currency}</p>
          </div>
        </div>

        <div className="flex gap-3 pt-3">
          {existingLog && (
            <Button
              onClick={handleDelete}
              disabled={loading}
              variant="destructive"
              className="flex-1 h-12 bg-red-600/10 border border-red-500/20 hover:bg-red-600 text-red-400 hover:text-white font-bold rounded-2xl transition-all"
            >
              Delete Log
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={loading}
            className="flex-[2] h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg glow-indigo"
          >
            {loading ? "Saving..." : existingLog ? "Update Log" : "Confirm Delivery"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
