"use client"

import { useState, useEffect } from "react"

import { useAuth } from "@/contexts/AuthContext"
import { useSubscription } from "@/contexts/SubscriptionContext"
import { useCurrency, CURRENCIES } from "@/contexts/CurrencyContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { api } from "@/lib/api"
import { startRegistration } from "@simplewebauthn/browser"
import {
  Moon,
  Sun,
  LogOut,
  ChevronRight,
  Shield,
  Bell,
  CircleHelp,
  Info,
  Crown,
  Zap,
  Copy,
  Check,
  Eye,
  EyeOff,
  Plus,
  Lock,
  CreditCard,
  ArrowRight,
} from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"
import packageInfo from "../package.json"
import { usePaddleCheckout } from "@/hooks/usePaddleCheckout"

export function Settings() {
  const { user, logout, updateUser } = useAuth()
  const { isPro, showUpgradeModal, daysRemaining, planExpiresAt } = useSubscription()
  const { currency, setCurrency } = useCurrency()
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()
  const router = useRouter()
  const { openCheckout, openBillingPortal, isLoading } = usePaddleCheckout()

  const [couponCode, setCouponCode] = useState("")
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false)

  const [isShortcutModalOpen, setIsShortcutModalOpen] = useState(false)
  const [shortcutApiKey, setShortcutApiKey] = useState("")
  const [isApiKeyVisible, setIsApiKeyVisible] = useState(false)
  const [shortcutStep, setShortcutStep] = useState(1)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [apiUrl, setApiUrl] = useState("")

  const handleUpgradeClick = () => {
    if (isPro) {
      openBillingPortal();
    } else {
      openCheckout({
        priceId: process.env.NEXT_PUBLIC_PADDLE_PRO_PRICE_ID || "",
        onSuccess: () => {
          toast({ title: "Success!", description: "Subscription activated. Page will refresh." });
          setTimeout(() => window.location.reload(), 2000);
        }
      });
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const base = process.env.NEXT_PUBLIC_API_URL || `${window.location.origin}/api`;
      setApiUrl(`${base}/external/transaction`);
    }
  }, [])

  const handleCopy = async (text: string, fieldId: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopiedField(fieldId);
      toast({ title: "Copied!", description: "Value copied to clipboard" });
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      toast({ title: "Failed to copy", description: "Please copy it manually", variant: "destructive" });
    }
  }

  const formatDate = (d: Date | null) =>
    d ? d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }) : "—"

  const handleLogout = () => {
    logout()
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    })
    router.push("/login")
  }

  const handleThemeChange = async (checked: boolean) => {
    const newTheme = checked ? "dark" : "light"
    setTheme(newTheme)
    try {
      await api.updateMe({ theme: newTheme })
      if (user) {
        updateUser({ ...user, theme: newTheme })
      }
    } catch (err) {
      console.error("Failed to save theme to DB", err)
    }
  }

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsApplyingCoupon(true);
    try {
      const res = await api.applyCoupon(couponCode.trim());
      updateUser(res.user);
      toast({ title: "Success", description: res.message });
      setCouponCode("");
    } catch (error: any) {
      toast({ title: "Failed", description: error.message || "Failed to apply coupon", variant: "destructive" });
    } finally {
      setIsApplyingCoupon(false);
    }
  }

  const [biometricsEnabled, setBiometricsEnabled] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)

  // Fetch initial biometrics status
  useEffect(() => {
    api.getWebAuthnStatus()
      .then(res => setBiometricsEnabled(res.enabled))
      .catch(console.error)
  }, [])

  const handleToggleBiometrics = async (checked: boolean) => {
    if (checked) {
      try {
        setIsRegistering(true)
        // 1. Get options from server
        const options = await api.getWebAuthnRegistrationOptions()
        
        // 2. Pass options to browser to trigger native biometric prompt
        const attResp = await startRegistration(options)
        
        // 3. Send result back to server
        const verification = await api.verifyWebAuthnRegistration(attResp)
        
        if (verification.verified) {
          setBiometricsEnabled(true)
          toast({ title: "Success", description: "Face ID / Fingerprint enabled" })
        } else {
          throw new Error("Verification failed")
        }
      } catch (error: any) {
        toast({ title: "Failed", description: error.message || "Failed to set up biometrics", variant: "destructive" })
      } finally {
        setIsRegistering(false)
      }
    } else {
      try {
        setIsRegistering(true)
        await api.removeWebAuthnCredentials()
        setBiometricsEnabled(false)
        toast({ title: "Success", description: "Biometrics disabled" })
      } catch (error) {
        toast({ title: "Error", description: "Failed to disable biometrics", variant: "destructive" })
      } finally {
        setIsRegistering(false)
      }
    }
  }

  const menuItems = [
    { icon: <CircleHelp className="h-5 w-5 text-orange-500" />, label: "Help Center", value: null, onClick: () => showUpgradeModal() },
    { icon: <Info className="h-5 w-5 text-slate-500" />, label: "About App", value: `v${packageInfo.version}`, href: "https://devinbook.devinsol.com" },
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* User Card */}
      <Card className="rounded-[32px] border-none bg-slate-900 text-white shadow-2xl overflow-hidden relative">
        <CardContent className="p-8 flex items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-slate-800 border-4 border-slate-700 flex items-center justify-center text-3xl font-black">
            {user?.name?.[0].toUpperCase()}
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-black tracking-tight">{user?.name}</h2>
            <p className="text-slate-400 text-sm font-medium">{user?.email}</p>
            <div className="pt-2 flex items-center gap-2">
              {isPro ? (
                <span className="bg-gradient-to-r from-amber-400 to-orange-400 text-black text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                  <Crown className="h-2.5 w-2.5" /> Pro Member
                </span>
              ) : (
                <>
                  <span className="bg-white/10 text-white/60 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">Free Plan</span>
                  <button
                    onClick={() => showUpgradeModal()}
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 hover:opacity-90 transition-opacity"
                  >
                    <Zap className="h-2.5 w-2.5" /> Upgrade
                  </button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Plan Row */}
      <div className="space-y-4">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground px-2">Subscription</h3>
        <div
          onClick={() => !isPro && showUpgradeModal()}
          className={`bg-card border rounded-[32px] p-6 ${
            !isPro ? "cursor-pointer hover:bg-muted/30 transition-colors" : ""
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                isPro ? "bg-gradient-to-br from-amber-400 to-orange-400" : "bg-muted"
              }`}>
                <Crown className={`h-5 w-5 ${isPro ? "text-black" : "text-muted-foreground"}`} />
              </div>
              <div>
                <p className="font-black text-sm">{isPro ? "Pro Plan" : "Free Plan"}</p>
                <p className="text-[10px] uppercase font-bold text-muted-foreground">
                  {isPro ? `Expires ${formatDate(planExpiresAt)}` : "Tap to upgrade · devinsol.com"}
                </p>
              </div>
            </div>
            {!isPro ? (
              <span className="text-[10px] font-black uppercase bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-500 px-2.5 py-1 rounded-xl border border-indigo-500/20">
                Upgrade
              </span>
            ) : (
              <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-xl border ${
                daysRemaining !== null && daysRemaining <= 7
                  ? "bg-rose-500/10 text-rose-600 border-rose-500/20"
                  : "bg-amber-500/10 text-amber-600 border-amber-500/20"
              }`}>
                Active
              </span>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-border/50">
            <Button
              variant="outline"
              onClick={(e) => { e.stopPropagation(); router.push('/account'); }}
              className="w-full h-10 rounded-xl text-xs font-bold bg-background hover:bg-muted"
            >
              Manage Account & Billing History
            </Button>
          </div>

          {/* Days remaining bar — only for Pro users */}
          {isPro && daysRemaining !== null && (
            <div className="mt-4 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Time Remaining</span>
                <span className={`text-[11px] font-black ${
                  daysRemaining <= 3 ? "text-rose-500" :
                  daysRemaining <= 7 ? "text-amber-500" :
                  "text-emerald-500"
                }`}>
                  {daysRemaining === 0 ? "Expires today" : `${daysRemaining} day${daysRemaining !== 1 ? "s" : ""} left`}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    daysRemaining <= 3 ? "bg-rose-500" :
                    daysRemaining <= 7 ? "bg-amber-500" :
                    "bg-emerald-500"
                  }`}
                  style={{
                    width: `${Math.min(100, Math.round((daysRemaining / 30) * 100))}%`
                  }}
                />
              </div>
            </div>
          )}

          {!isPro && (
            <div className="mt-4 pt-4 border-t flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
              <label className="text-[10px] font-black uppercase tracking-[0.1em] text-muted-foreground">Have a Coupon?</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Enter code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="flex-1 bg-background border rounded-xl px-3 py-2 text-sm uppercase outline-none focus:border-indigo-500 transition-colors"
                />
                <Button 
                  disabled={isApplyingCoupon || !couponCode.trim()} 
                  onClick={handleApplyCoupon}
                  size="sm" 
                  className="rounded-xl font-bold bg-indigo-500 hover:bg-indigo-600 text-white"
                >
                  {isApplyingCoupon ? "Applying..." : "Apply"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Preferences */}
      <div className="space-y-4">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground px-2">System</h3>
        <div className="bg-card border rounded-[32px] overflow-hidden">
          <div className="p-6 flex items-center justify-between border-b">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center">
                {theme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              </div>
              <div>
                <p className="font-black text-sm">Dark Mode</p>
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Adjust appearance</p>
              </div>
            </div>
            <Switch
              checked={theme === "dark"}
              onCheckedChange={handleThemeChange}
            />
          </div>

          <div className="p-6 flex items-center justify-between border-b">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-indigo-500" />
              </div>
              <div>
                <p className="font-black text-sm">Currency</p>
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Select your primary currency</p>
              </div>
            </div>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="w-[120px] rounded-xl font-bold bg-background border border-border">
                <SelectValue placeholder="Currency" />
              </SelectTrigger>
              <SelectContent className="rounded-xl font-bold">
                {CURRENCIES.map((curr) => (
                  <SelectItem key={curr.symbol} value={curr.symbol} className="rounded-lg cursor-pointer">
                    {curr.symbol} - {curr.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="p-6 flex items-center justify-between border-b">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center">
                <Shield className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="font-black text-sm">Face ID / Fingerprint</p>
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Sign in without password</p>
              </div>
            </div>
            <Switch
              checked={biometricsEnabled}
              disabled={isRegistering}
              onCheckedChange={handleToggleBiometrics}
            />
          </div>

          {menuItems.map((item, idx) => (
            <div 
              key={idx} 
              onClick={() => item.onClick ? item.onClick() : item.href ? window.open(item.href, '_blank') : null}
              className={`p-6 flex items-center justify-between hover:bg-muted/30 cursor-pointer transition-colors ${idx !== menuItems.length - 1 ? 'border-b' : ''}`}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center">
                  {item.icon}
                </div>
                <div>
                  <p className="font-black text-sm">{item.label}</p>
                  {item.value && <p className="text-[10px] uppercase font-bold text-muted-foreground">{item.value}</p>}
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/30" />
            </div>
          ))}
        </div>
      </div>

      {/* Apple Shortcuts Integration (Pro Only) */}
      <div className="space-y-4">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground px-2">Integrations</h3>
        <div className="bg-card border rounded-[32px] overflow-hidden p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                <Zap className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="font-black text-sm">Apple Shortcuts</p>
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Log transactions instantly</p>
              </div>
            </div>
            {isPro && (
              <span className="text-[10px] font-black uppercase bg-gradient-to-r from-amber-400 to-orange-400 text-black px-2.5 py-1 rounded-xl">
                Pro Feature
              </span>
            )}
          </div>
          
          {isPro ? (
            <div className="space-y-3">
              <Button 
                onClick={async () => {
                  try {
                    const res = await api.generateApiKey();
                    setShortcutApiKey(res.apiKey);
                    
                    const icloudUrl = process.env.NEXT_PUBLIC_SHORTCUT_ICLOUD_URL;
                    if (icloudUrl) {
                      if (navigator.clipboard && navigator.clipboard.writeText) {
                        await navigator.clipboard.writeText(res.apiKey);
                      }
                      toast({ title: "API Key Copied!", description: "Opening pre-configured Shortcut..." });
                      window.location.href = icloudUrl;
                      return;
                    }
                  } catch (err: any) {
                    toast({ title: "Failed to generate key", description: err.message || "Could not generate API key", variant: "destructive" });
                    return;
                  }
                  setShortcutStep(1);
                  setIsShortcutModalOpen(true);
                }}
                className="w-full rounded-[16px] h-12 font-bold bg-blue-600 hover:bg-blue-700 text-white border-none"
              >
                Add to iOS Shortcuts
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Configure a custom iOS Shortcut to log transactions instantly using our API key.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-medium text-slate-500">
                Integrate with Apple Shortcuts to log transactions with a single tap from your home screen.
              </p>
              <Button 
                onClick={() => showUpgradeModal()}
                className="w-full rounded-[16px] h-12 font-bold bg-gradient-to-r from-indigo-500 to-purple-500 hover:opacity-90 text-white border-none"
              >
                Upgrade to Pro to Unlock
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Apple Shortcuts Guided Setup Modal */}
      <Dialog open={isShortcutModalOpen} onOpenChange={setIsShortcutModalOpen}>
        <DialogContent className="rounded-[32px] sm:max-w-lg border bg-card/95 backdrop-blur-xl max-h-[90vh] flex flex-col p-6 overflow-hidden">
          <DialogHeader className="pb-2">
            <DialogTitle className="font-black text-xl flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-500" />
              iOS Shortcut Setup
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Configure your iOS device to log transactions with a single tap.
            </DialogDescription>
          </DialogHeader>

          {/* Stepper */}
          <div className="flex items-center justify-between px-2 py-4 border-b border-muted">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <button
                  type="button"
                  onClick={() => {
                    if (shortcutApiKey || step === 1) {
                      setShortcutStep(step);
                    }
                  }}
                  disabled={step > 1 && !shortcutApiKey}
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs transition-all ${
                    shortcutStep === step
                      ? "bg-blue-600 text-white ring-4 ring-blue-500/25 scale-105"
                      : shortcutStep > step
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  }`}
                >
                  {shortcutStep > step ? <Check className="h-3.5 w-3.5" /> : step}
                </button>
                {step < 3 && (
                  <div
                    className={`h-[2px] w-12 sm:w-20 mx-2 rounded-full transition-all ${
                      shortcutStep > step ? "bg-emerald-500/50" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto py-4 space-y-4">
            {/* Step 1: API Key */}
            {shortcutStep === 1 && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h4 className="text-xs font-black uppercase tracking-wider text-foreground">Step 1: Your API Key</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    This key authenticates your iOS device securely. Keep it secret.
                  </p>
                </div>

                <div className="bg-muted/30 border rounded-2xl p-4 space-y-3 relative overflow-hidden">
                  {shortcutApiKey ? (
                    <div className="space-y-3">
                      <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">API Key</label>
                      <div className="flex items-center gap-2 bg-background border rounded-xl px-3 py-2.5 relative">
                        <span className="font-mono text-xs overflow-x-auto select-all pr-20 whitespace-nowrap block scrollbar-none w-full text-foreground">
                          {isApiKeyVisible ? shortcutApiKey : "••••••••••••••••••••••••••••••••"}
                        </span>
                        <div className="absolute right-2 top-1.5 flex items-center gap-1 bg-background pl-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-muted"
                            onClick={() => setIsApiKeyVisible(!isApiKeyVisible)}
                          >
                            {isApiKeyVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-muted"
                            onClick={() => handleCopy(shortcutApiKey, 'key')}
                          >
                            {copiedField === 'key' ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                          </Button>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-[11px] rounded-lg h-7 font-bold px-2.5"
                          onClick={async () => {
                            try {
                              const res = await api.generateApiKey();
                              setShortcutApiKey(res.apiKey);
                              toast({ title: "New Key Generated", description: "API Key has been regenerated and copied." });
                            } catch (err: any) {
                              toast({ title: "Failed to generate key", description: err.message, variant: "destructive" });
                            }
                          }}
                        >
                          Regenerate Key
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-4 space-y-3 text-center">
                      <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                        <Lock className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-foreground">No API key active</p>
                        <p className="text-[10px] text-muted-foreground max-w-[240px]">
                          Generate an API key to enable verification for the iOS Shortcuts.
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        className="rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={async () => {
                          try {
                            const res = await api.generateApiKey();
                            setShortcutApiKey(res.apiKey);
                            toast({ title: "API Key Generated!", description: "API Key copied to clipboard." });
                          } catch (err: any) {
                            toast({ title: "Failed", description: err.message || "Failed to generate key", variant: "destructive" });
                          }
                        }}
                      >
                        Generate API Key
                      </Button>
                    </div>
                  )}
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 text-[11px] text-muted-foreground leading-relaxed">
                  <span className="font-bold text-blue-400 block mb-1">💡 Developer Note</span>
                  You can bypass this manual setup for all users by setting the <code className="font-mono bg-background border px-1 rounded text-foreground">NEXT_PUBLIC_SHORTCUT_ICLOUD_URL</code> environment variable in <code className="font-mono bg-background border px-1 rounded text-foreground">.env.local</code> with a pre-configured iCloud Shortcut link.
                </div>
              </div>
            )}

            {/* Step 2: Shortcuts app configuration instructions */}
            {shortcutStep === 2 && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h4 className="text-xs font-black uppercase tracking-wider text-foreground">Step 2: Collect User Inputs</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Open the built-in Apple **Shortcuts** app on iOS, tap <span className="font-bold text-blue-500"><Plus className="h-3 w-3 inline mx-0.5" /></span> to create a new shortcut, and add these input actions:
                  </p>
                </div>

                <div className="bg-muted/30 border rounded-2xl p-4 space-y-3 max-h-[220px] overflow-y-auto">
                  <div className="flex gap-3">
                    <div className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">1</div>
                    <div>
                      <p className="text-xs font-bold text-foreground">Add "Ask for Input" (Amount)</p>
                      <p className="text-[11px] text-muted-foreground">Prompt: <span className="font-mono bg-background border px-1 rounded text-foreground">Amount</span>, Input Type: <span className="font-semibold text-foreground">Number</span></p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">2</div>
                    <div>
                      <p className="text-xs font-bold text-foreground">Add "Choose from Menu" (Type)</p>
                      <p className="text-[11px] text-muted-foreground">Prompt: <span className="font-mono bg-background border px-1 rounded text-foreground">Type</span>. Add options: <span className="font-semibold text-rose-500">expense</span> and <span className="font-semibold text-emerald-500">income</span></p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">3</div>
                    <div>
                      <p className="text-xs font-bold text-foreground">Add "Ask for Input" (Category)</p>
                      <p className="text-[11px] text-muted-foreground">Prompt: <span className="font-mono bg-background border px-1 rounded text-foreground">Category</span>, Type: <span className="font-semibold text-foreground">Text</span></p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">4</div>
                    <div>
                      <p className="text-xs font-bold text-foreground">Add "Ask for Input" (Account)</p>
                      <p className="text-[11px] text-muted-foreground">Prompt: <span className="font-mono bg-background border px-1 rounded text-foreground">Account</span>, Type: <span className="font-semibold text-foreground">Text</span></p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">5</div>
                    <div>
                      <p className="text-xs font-bold text-foreground">Add "Ask for Input" (Description)</p>
                      <p className="text-[11px] text-muted-foreground">Prompt: <span className="font-mono bg-background border px-1 rounded text-foreground">Description</span>, Type: <span className="font-semibold text-foreground">Text</span> (Optional)</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: API Request parameters */}
            {shortcutStep === 3 && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h4 className="text-xs font-black uppercase tracking-wider text-foreground">Step 3: Call DevinBook API</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Add the **"Get Contents of URL"** action in Shortcuts and configure it with these settings:
                  </p>
                </div>

                <div className="bg-muted/30 border rounded-2xl p-4 space-y-4 max-h-[260px] overflow-y-auto">
                  {/* URL Endpoint */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">URL Endpoint</label>
                      <span className="text-[9px] font-black text-blue-500 uppercase bg-blue-500/10 px-1.5 py-0.5 rounded">POST</span>
                    </div>
                    <div className="flex items-center gap-2 bg-background border rounded-xl px-3 py-2 relative">
                      <span className="font-mono text-[10px] overflow-x-auto select-all pr-12 whitespace-nowrap block scrollbar-none w-full text-foreground">
                        {apiUrl}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 absolute right-1.5 hover:bg-muted shrink-0"
                        onClick={() => handleCopy(apiUrl, 'url')}
                      >
                        {copiedField === 'url' ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                      </Button>
                    </div>
                  </div>

                  {/* Headers */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Headers</label>
                    <div className="bg-background border rounded-xl p-3 space-y-2.5 font-mono text-[10px]">
                      <div className="flex items-center justify-between border-b border-muted pb-2">
                        <span className="text-foreground font-semibold">x-api-key</span>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground max-w-[120px] truncate">{shortcutApiKey || "YOUR_API_KEY"}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 hover:bg-muted shrink-0"
                            onClick={() => handleCopy(shortcutApiKey, 'hdr_key')}
                          >
                            {copiedField === 'hdr_key' ? <Check className="h-2.5 w-2.5 text-emerald-500" /> : <Copy className="h-2.5 w-2.5" />}
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-foreground font-semibold">Content-Type</span>
                        <span className="text-muted-foreground">application/json</span>
                      </div>
                    </div>
                  </div>

                  {/* Request Body JSON */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">JSON Body</label>
                      <span className="text-[9px] text-muted-foreground italic">Insert gathered inputs as values</span>
                    </div>
                    <div className="relative">
                      <pre className="bg-background border rounded-xl p-3 font-mono text-[9px] text-foreground leading-relaxed overflow-x-auto text-left">
{`{
  "amount": Amount,
  "type": Chosen Item (Type),
  "category_name": Category,
  "account_name": Account,
  "description": Description
}`}
                      </pre>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 absolute right-2 top-2 hover:bg-muted shrink-0"
                        onClick={() => handleCopy(`{\n  "amount": 0,\n  "type": "expense",\n  "category_name": "Food",\n  "account_name": "Main Wallet",\n  "description": "My transaction"\n}`, 'body')}
                      >
                        {copiedField === 'body' ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Dialog Footer Actions */}
          <div className="flex items-center justify-between border-t border-muted pt-4">
            <Button
              type="button"
              variant="ghost"
              className="rounded-xl font-bold h-10 px-4 hover:bg-muted"
              disabled={shortcutStep === 1}
              onClick={() => setShortcutStep((prev) => prev - 1)}
            >
              Back
            </Button>
            {shortcutStep < 3 ? (
              <Button
                type="button"
                className="rounded-xl font-bold h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white"
                disabled={!shortcutApiKey}
                onClick={() => setShortcutStep((prev) => prev + 1)}
              >
                Next
              </Button>
            ) : (
              <Button
                type="button"
                className="rounded-xl font-bold h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => setIsShortcutModalOpen(false)}
              >
                Done
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Logout */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            className="w-full h-16 rounded-[24px] text-red-500 hover:text-red-600 hover:bg-red-50 flex items-center justify-center gap-3 font-black"
          >
            <LogOut className="h-6 w-6" />
            Sign Out
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="rounded-[32px] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-black text-2xl">Sign Out</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 font-medium text-base">
              Are you sure you want to sign out? You will need to enter your credentials or use Face ID to log back in.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 gap-3 sm:gap-0">
            <AlertDialogCancel className="rounded-[16px] h-12 font-bold text-sm">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout} className="rounded-[16px] h-12 font-bold text-sm bg-red-500 text-white hover:bg-red-600 border-none">
              Sign Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Devinsol Branding Footer */}
      <div className="flex flex-col items-center justify-center gap-3 pt-4 pb-12 opacity-60">
        <div className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all cursor-pointer" onClick={() => window.open('https://devinsol.com', '_blank')}>
          <img src="https://devinsol.com/wp-content/uploads/2025/07/devinsol-favicon.png" alt="Devinsol Icon" className="w-5 h-5 object-contain" />
          <img src="https://devinsol.com/wp-content/uploads/2025/08/Devinsol-e1754743293456.png" alt="Devinsol Logo" className="h-4 object-contain dark:invert opacity-90" />
        </div>
        <div className="space-y-1 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Designed by Devinsol</p>
          <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/40">Version {packageInfo.version} • Build {new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  )
}
