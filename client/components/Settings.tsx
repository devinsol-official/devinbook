"use client"

import { useState, useEffect } from "react"

import { useAuth } from "@/contexts/AuthContext"
import { useSubscription } from "@/contexts/SubscriptionContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
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
  Zap
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
import { useToast } from "@/hooks/use-toast"
import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"
import packageInfo from "../package.json"

export function Settings() {
  const { user, logout, updateUser } = useAuth()
  const { isPro, showUpgradeModal, daysRemaining, planExpiresAt } = useSubscription()
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()
  const router = useRouter()

  const [couponCode, setCouponCode] = useState("")
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false)

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
    { icon: <CircleHelp className="h-5 w-5 text-orange-500" />, label: "Help Center", value: null, href: "https://devinsol.com/contact-us/" },
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
              onClick={() => item.href ? window.open(item.href, '_blank') : null}
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
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                      await navigator.clipboard.writeText(res.apiKey);
                      toast({ title: "API Key Copied!", description: "Opening Shortcuts app..." });
                    } else {
                      prompt("Your API Key (Copy this before proceeding):", res.apiKey);
                    }
                    // Provide a generic iCloud shortcut link here
                    window.location.href = "https://www.icloud.com/shortcuts/";
                  } catch (err: any) {
                    toast({ title: "Failed", description: err.message || "Failed to generate key", variant: "destructive" });
                  }
                }}
                className="w-full rounded-[16px] h-12 font-bold bg-blue-600 hover:bg-blue-700 text-white border-none"
              >
                Add to iOS Shortcuts
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Clicking this will generate your API key, copy it to your clipboard, and open the Shortcuts app where you can paste it.
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
          <img src="https://devinsol.com/wp-content/uploads/2025/08/Devinsol-e1754743293456.png" alt="Devinsol Logo" className="h-4 object-contain" />
        </div>
        <div className="space-y-1 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Designed by Devinsol</p>
          <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/40">Version {packageInfo.version} • Build {new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  )
}
