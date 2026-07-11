"use client"

import { useState } from "react"
import { api } from "@/lib/api"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Wallet, Landmark, User, Plus, History, Trash2, ChevronDown } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

interface AddAccountModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}

const ACCOUNT_TYPES = [
    { id: "cash", label: "Cash / Wallet", icon: Wallet, color: "bg-blue-500" },
    { id: "bank", label: "Bank Account", icon: Landmark, color: "bg-emerald-500" },
    { id: "person", label: "Person", icon: User, color: "bg-amber-500" },
    { id: "regular billing", label: "Regular Billing (Milk Guy, etc.)", icon: History, color: "bg-indigo-500" },
    { id: "other", label: "Other", icon: Plus, color: "bg-slate-500" },
]

export function AddAccountModal({ isOpen, onClose, onSuccess }: AddAccountModalProps) {
    const { toast } = useToast()
    const [name, setName] = useState("")
    const [type, setType] = useState("cash")
    const [isDefault, setIsDefault] = useState(false)
    const [isFeatured, setIsFeatured] = useState(false)
    const [loading, setLoading] = useState(false)
    const [defaultItems, setDefaultItems] = useState<any[]>([
        { name: "Milk", quantity: 2, unit: "kg", pricePerUnit: 150 },
        { name: "Yogurt", quantity: 0.5, unit: "kg", pricePerUnit: 200 }
    ])
    const [autoLog, setAutoLog] = useState(false)
    const [isTypeExpanded, setIsTypeExpanded] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) return

        try {
            setLoading(true)
            await api.createAccount(name, type, isDefault, isFeatured, type === "regular billing" ? defaultItems : undefined, type === "regular billing" ? autoLog : undefined)
            toast({ title: "Success", description: "Account created successfully" })
            onSuccess()
            onClose()
            setName("")
            setType("cash")
            setIsDefault(false)
            setIsFeatured(false)
            setAutoLog(false)
            setDefaultItems([
                { name: "Milk", quantity: 2, unit: "kg", pricePerUnit: 150 },
                { name: "Yogurt", quantity: 0.5, unit: "kg", pricePerUnit: 200 }
            ])
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to create account",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] rounded-[32px] overflow-y-auto max-h-[90vh] border-none shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black">Add Account</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-8 py-4">
                    <div className="space-y-3">
                        <Label htmlFor="name" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Account Name</Label>
                        <Input
                            id="name"
                            placeholder="e.g. My Wallet, HDFC Savings"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="rounded-2xl h-14 bg-muted/50 border-none text-base font-bold"
                            required
                        />
                    </div>

                    <div className="space-y-3">
                        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Account Type</Label>
                        <div className="border border-muted/20 rounded-2xl overflow-hidden bg-muted/20">
                            {/* Header (active option) */}
                            <button
                                type="button"
                                onClick={() => setIsTypeExpanded(!isTypeExpanded)}
                                className="w-full flex items-center justify-between p-4 bg-muted/40 hover:bg-muted/60 transition-colors"
                            >
                                {(() => {
                                    const activeType = ACCOUNT_TYPES.find(t => t.id === type) || ACCOUNT_TYPES[ACCOUNT_TYPES.length - 1]
                                    return (
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-xl ${activeType.color} text-white shrink-0`}>
                                                <activeType.icon className="h-4 w-4" />
                                            </div>
                                            <span className="text-sm font-bold text-foreground">{activeType.label}</span>
                                        </div>
                                    )
                                })()}
                                <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", isTypeExpanded && "transform rotate-180")} />
                            </button>

                            {/* Options List */}
                            {isTypeExpanded && (
                                <div className="border-t border-muted/10 p-2 space-y-1 bg-muted/10 divide-y divide-muted/5">
                                    {ACCOUNT_TYPES.map((t) => (
                                        <button
                                            key={t.id}
                                            type="button"
                                            onClick={() => {
                                                setType(t.id)
                                                setIsTypeExpanded(false)
                                            }}
                                            className={cn(
                                                "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left",
                                                type === t.id 
                                                    ? "bg-primary/10 text-primary font-black" 
                                                    : "hover:bg-muted/40 text-muted-foreground hover:text-foreground font-semibold"
                                            )}
                                        >
                                            <div className={cn("p-1.5 rounded-lg text-white shrink-0", t.color)}>
                                                <t.icon className="h-3.5 w-3.5" />
                                            </div>
                                            <span className="text-xs">{t.label}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-2xl">
                        <div className="space-y-0.5">
                            <Label htmlFor="isDefault" className="text-sm font-black">Set as Default</Label>
                            <p className="text-xs font-medium text-muted-foreground">Pre-selected for transactions</p>
                        </div>
                        <Switch
                            id="isDefault"
                            checked={isDefault}
                            onCheckedChange={setIsDefault}
                        />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-2xl">
                        <div className="space-y-0.5">
                            <Label htmlFor="isFeatured" className="text-sm font-black">Feature on Dashboard</Label>
                            <p className="text-xs font-medium text-muted-foreground">Show balance prominently on Overview</p>
                        </div>
                        <Switch
                            id="isFeatured"
                            checked={isFeatured}
                            onCheckedChange={setIsFeatured}
                        />
                    </div>

                    {type === "regular billing" && (
                        <div className="space-y-4 border-t pt-4 border-dashed border-muted-foreground/20">
                            <div className="flex items-center justify-between p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10">
                                <div className="space-y-0.5">
                                    <Label htmlFor="autoLog" className="text-sm font-black text-indigo-400">Auto Mode</Label>
                                    <p className="text-xs font-medium text-slate-400">Automatically log standard items every day</p>
                                </div>
                                <Switch
                                    id="autoLog"
                                    checked={autoLog}
                                    onCheckedChange={setAutoLog}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Items Template</Label>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setDefaultItems([...defaultItems, { name: "", quantity: 1, unit: "kg", pricePerUnit: 100 }])}
                                    className="text-xs font-bold text-primary hover:bg-primary/10 flex items-center gap-1 h-8 rounded-lg"
                                >
                                    <Plus className="h-3 w-3" /> Add Item
                                </Button>
                            </div>
                            <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1">
                                {defaultItems.map((item, index) => (
                                    <div key={index} className="bg-muted/30 p-3 rounded-2xl border border-muted/20 space-y-2 relative group">
                                        <button
                                            type="button"
                                            onClick={() => setDefaultItems(defaultItems.filter((_, i) => i !== index))}
                                            className="absolute top-2 right-2 text-muted-foreground hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                        <div className="flex gap-2">
                                            <div className="flex-1">
                                                <input
                                                    type="text"
                                                    value={item.name}
                                                    onChange={(e) => {
                                                        const copy = [...defaultItems]
                                                        copy[index].name = e.target.value
                                                        setDefaultItems(copy)
                                                    }}
                                                    className="bg-transparent font-bold text-xs outline-none border-b border-transparent focus:border-primary w-full"
                                                    placeholder="Item name (e.g. Milk)"
                                                    required
                                                />
                                            </div>
                                            <div className="w-16">
                                                <input
                                                    type="text"
                                                    value={item.unit}
                                                    onChange={(e) => {
                                                        const copy = [...defaultItems]
                                                        copy[index].unit = e.target.value
                                                        setDefaultItems(copy)
                                                    }}
                                                    className="bg-transparent text-[10px] text-muted-foreground font-bold outline-none border-b border-transparent focus:border-primary w-full text-right uppercase"
                                                    placeholder="kg"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex gap-4">
                                            <div className="flex-1 space-y-0.5">
                                                <label className="text-[9px] font-black uppercase text-muted-foreground">Default Qty</label>
                                                <input
                                                    type="number"
                                                    step="any"
                                                    value={item.quantity}
                                                    onChange={(e) => {
                                                        const copy = [...defaultItems]
                                                        copy[index].quantity = parseFloat(e.target.value) || 0
                                                        setDefaultItems(copy)
                                                    }}
                                                    className="bg-muted/80 px-2 py-1 rounded-lg text-xs font-bold outline-none w-full"
                                                    required
                                                />
                                            </div>
                                            <div className="flex-1 space-y-0.5">
                                                <label className="text-[9px] font-black uppercase text-muted-foreground">Price per unit</label>
                                                <input
                                                    type="number"
                                                    value={item.pricePerUnit}
                                                    onChange={(e) => {
                                                        const copy = [...defaultItems]
                                                        copy[index].pricePerUnit = parseFloat(e.target.value) || 0
                                                        setDefaultItems(copy)
                                                    }}
                                                    className="bg-muted/80 px-2 py-1 rounded-lg text-xs font-bold outline-none w-full"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-14 rounded-2xl font-black text-lg bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                        >
                            {loading ? "Creating..." : "Create Account"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
