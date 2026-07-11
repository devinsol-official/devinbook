"use client"

import { useSubscription } from "@/contexts/SubscriptionContext"
import { Crown, Zap, BarChart3, Wallet, FileText, X, Lock, CreditCard, Link2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { usePaddleCheckout } from "@/hooks/usePaddleCheckout"
import { useToast } from "@/hooks/use-toast"

const PRO_FEATURES = [
  {
    icon: <Wallet className="h-4 w-4" />,
    title: "Unlimited Accounts",
    description: "Create & manage multiple accounts",
    color: "text-blue-400",
    bg: "bg-blue-500/10"
  },
  {
    icon: <Zap className="h-4 w-4" />,
    title: "Unlimited Categories",
    description: "No limits on expense & income categories",
    color: "text-amber-400",
    bg: "bg-amber-500/10"
  },
  {
    icon: <BarChart3 className="h-4 w-4" />,
    title: "Detailed Breakdown",
    description: "Full category-wise spending insights",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10"
  },
  {
    icon: <FileText className="h-4 w-4" />,
    title: "Reports & PDF Export",
    description: "Download detailed financial statements",
    color: "text-purple-400",
    bg: "bg-purple-500/10"
  },
]

export function UpgradeModal() {
  const { upgradeModalOpen, hideUpgradeModal, upgradeFeatureName } = useSubscription()
  const { openCheckout, isLoading, getPaymentLink } = usePaddleCheckout()
  const { toast } = useToast()

  if (!upgradeModalOpen) return null

  const handleUpgrade = async (usePaymentLink = false) => {
    const priceId = process.env.NEXT_PUBLIC_PADDLE_PRO_PRICE_ID || ""

    if (usePaymentLink) {
      try {
        const paymentLink = await getPaymentLink(priceId)
        if (paymentLink) {
          window.open(paymentLink, "_blank")
          hideUpgradeModal()
        } else {
          toast({ title: "Could not get payment link", description: "Please try the checkout button instead", variant: "destructive" })
        }
      } catch (err) {
        toast({ title: "Error", description: "Failed to get payment link", variant: "destructive" })
      }
    } else {
      await openCheckout({
        priceId,
        onSuccess: () => {
          toast({ title: "Success!", description: "Subscription activated. Page will refresh." })
          setTimeout(() => window.location.reload(), 2000)
        }
      })
      hideUpgradeModal()
    }
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end justify-center"
      onClick={hideUpgradeModal}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-[500px] max-h-[90vh] flex flex-col mx-auto rounded-t-[40px] sm:rounded-[40px] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "linear-gradient(160deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)"
        }}
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-indigo-500/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-48 h-48 bg-purple-500/10 blur-3xl pointer-events-none" />

        <div className="mx-auto w-12 h-1.5 bg-white/10 rounded-full mt-4 flex-shrink-0 relative z-10" />

        <button
          onClick={hideUpgradeModal}
          className="absolute top-5 right-6 z-20 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
        >
          <X className="h-4 w-4 text-white/60" />
        </button>

        <div className="px-6 pt-4 pb-10 space-y-6 overflow-y-auto flex-1 z-10 relative">
          <div className="text-center space-y-3 pt-2">
            <div className="relative inline-flex">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-2xl shadow-amber-500/30">
                <Crown className="h-8 w-8 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                <Lock className="h-2.5 w-2.5 text-white" />
              </div>
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-black text-white tracking-tight">Upgrade to Pro</h2>
              <p className="text-slate-400 text-sm font-medium">Unlock the full power of DevinBook</p>
            </div>

            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-full px-4 py-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-amber-400 text-xs font-black uppercase tracking-widest">Pro Plan</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 py-2">
            <div className="flex-1 h-px" style={{ background: "linear-gradient(to right, transparent, rgba(255,255,255,0.08))" }} />
            <div className="text-center">
              <div className="flex items-end justify-center gap-1">
                <span className="text-slate-500 text-sm font-bold">$</span>
                <span className="text-4xl font-black text-white tracking-tighter">7</span>
                <div className="pb-1 space-y-0">
                  <span className="text-slate-400 text-xs font-black block leading-none">/mo</span>
                </div>
              </div>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-0.5">per month · billed monthly</p>
            </div>
            <div className="flex-1 h-px" style={{ background: "linear-gradient(to left, transparent, rgba(255,255,255,0.08))" }} />
          </div>

          <div className="space-y-2">
            {PRO_FEATURES.map((feature, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-2xl bg-white/5 border border-white/5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${feature.bg} ${feature.color}`}>
                  {feature.icon}
                </div>
                <div>
                  <p className="text-white font-black text-sm">{feature.title}</p>
                  <p className="text-slate-400 text-xs font-medium">{feature.description}</p>
                </div>
                <div className="ml-auto">
                  <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-3 pt-2">
            <Button
              onClick={() => handleUpgrade(false)}
              disabled={isLoading}
              className="w-full h-14 rounded-2xl font-black text-base shadow-2xl shadow-indigo-500/20 flex items-center justify-center gap-3"
              style={{
                background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)"
              }}
            >
              <Crown className="h-5 w-5" />
              Get Pro — $7/month
              <CreditCard className="h-4 w-4 opacity-60" />
            </Button>

            <Button
              onClick={() => handleUpgrade(true)}
              disabled={isLoading}
              variant="outline"
              className="w-full h-12 rounded-2xl font-black text-sm border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 flex items-center justify-center gap-2"
            >
              <Link2 className="h-4 w-4" />
              Pay with Link
            </Button>

            <p className="text-center text-slate-500 text-xs font-medium">
              Secure checkout powered by Paddle
            </p>

            <button
              onClick={hideUpgradeModal}
              className="w-full py-3 text-slate-500 text-sm font-bold hover:text-slate-400 transition-colors"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}