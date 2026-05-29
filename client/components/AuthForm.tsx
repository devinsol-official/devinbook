"use client"

import type React from "react"
import { useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Mail, Lock, User, ArrowRight, Loader2, Sparkles, Eye, EyeOff } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useTheme } from "next-themes"
import { api } from "@/lib/api"
import { startAuthentication } from "@simplewebauthn/browser"

export function AuthForm() {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [isForgot, setIsForgot] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login, register, forgotPassword } = useAuth()
  const { toast } = useToast()
  const { setTheme } = useTheme()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isForgot) {
        await forgotPassword(email)
        toast({
          title: "Email Sent",
          description: "Check your inbox for password reset instructions.",
        })
        setIsForgot(false)
        setIsLogin(true)
      } else if (isLogin) {
        await login(email, password)
        const userStr = localStorage.getItem("user")
        if (userStr) {
          try {
            const loggedInUser = JSON.parse(userStr)
            if (loggedInUser.theme) {
              setTheme(loggedInUser.theme)
            }
          } catch (e) {}
        }
        toast({
          title: "Welcome back!",
          description: "Accessing your financial dashboard...",
        })
        router.push("/dashboard")
      } else {
        await register(name, email, password)
        toast({
          title: "Account created!",
          description: "Your journey to financial freedom starts now.",
        })
        router.push("/dashboard")
      }
    } catch (error) {
      toast({
        title: "Authentication Failed",
        description: error instanceof Error ? error.message : "Please check your credentials",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleBiometricLogin = async () => {
    setLoading(true)
    try {
      // 1. Get options from server (no email passed)
      const options = await api.getWebAuthnAuthenticationOptions(email || undefined)
      
      // 2. Pass options to browser to trigger native biometric prompt
      const attResp = await startAuthentication(options)
      
      // 3. Send result back to server
      const verification = await api.verifyWebAuthnAuthentication(attResp, email || undefined)
      
      if (verification.verified && verification.token && verification.user) {
        localStorage.setItem("token", verification.token)
        localStorage.setItem("user", JSON.stringify(verification.user))
        // Force page reload to update context
        window.location.href = "/dashboard"
      } else {
        throw new Error("Verification failed")
      }
    } catch (error: any) {
      toast({ title: "Face ID Failed", description: error.message || "Failed to sign in with biometrics", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-background relative overflow-hidden transition-colors duration-500">
      {/* Background Ambience */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/5 dark:bg-blue-600/10 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/5 dark:bg-purple-600/10 blur-[120px]" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8 space-y-2 animate-in slide-in-from-bottom-4 fade-in duration-700">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-black/5 dark:bg-white/5 backdrop-blur-sm p-2 ring-1 ring-black/5 dark:ring-white/10 shadow-xl mb-4">
            <img
              src="/logo.svg"
              alt="DevinBook Logo"
              className="w-full h-full object-contain drop-shadow-lg"
            />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">
            {isForgot ? "Reset Password" : "DevinBook"}
          </h1>
          <p className="text-muted-foreground text-sm font-medium">
            {isForgot ? "Enter your email to receive recovery instructions." : "Next-generation financial management app."}
          </p>
        </div>

        <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-black/5 dark:border-white/10 rounded-[32px] p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-500">
          {!isForgot && (
            <div className="relative flex p-1 bg-muted/50 dark:bg-muted/20 rounded-xl mb-8">
              <div
                className="absolute inset-y-1 w-[calc(50%-4px)] bg-background dark:bg-primary rounded-lg transition-all duration-300 ease-out shadow-sm"
                style={{
                  transform: `translateX(${isLogin ? "0%" : "100%"})`,
                  left: isLogin ? "4px" : "0px"
                }}
              />
              <button
                type="button"
                onClick={() => setIsLogin(true)}
                className={cn(
                  "flex-1 relative z-10 py-2.5 text-sm font-bold text-center transition-colors duration-200",
                  isLogin ? "text-foreground dark:text-primary-foreground" : "text-muted-foreground hover:text-foreground dark:hover:text-white"
                )}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => setIsLogin(false)}
                className={cn(
                  "flex-1 relative z-10 py-2.5 text-sm font-bold text-center transition-colors duration-200",
                  !isLogin ? "text-foreground dark:text-primary-foreground" : "text-muted-foreground hover:text-foreground dark:hover:text-white"
                )}
              >
                Register
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className={cn(
              "space-y-4 transition-all duration-500",
              isForgot ? "h-[80px]" : (isLogin ? "h-[180px]" : "h-[250px]")
            )}>
              {!isForgot && (
                <div className={cn(
                  "space-y-2 transition-all duration-300 overflow-hidden",
                  !isLogin ? "opacity-100 max-h-20 scale-100" : "opacity-0 max-h-0 scale-95"
                )}>
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Full Name</Label>
                  <div className="relative group">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10 h-10 rounded-xl bg-black/5 dark:bg-black/20 border-black/5 dark:border-white/10 focus:border-primary/50 focus:ring-primary/20 hover:border-black/10 dark:hover:border-white/20 transition-all font-medium"
                      required={!isLogin && !isForgot}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Email Address</Label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-10 rounded-xl bg-black/5 dark:bg-black/20 border-black/5 dark:border-white/10 focus:border-primary/50 focus:ring-primary/20 hover:border-black/10 dark:hover:border-white/20 transition-all font-medium"
                    required
                  />
                </div>
              </div>

              {!isForgot && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center ml-1">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Password</Label>
                    {isLogin && (
                      <button
                        type="button"
                        onClick={() => setIsForgot(true)}
                        className="text-[10px] font-bold text-primary hover:text-primary/80 transition-colors"
                      >
                        Forgot?
                      </button>
                    )}
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 h-10 rounded-xl bg-black/5 dark:bg-black/20 border-black/5 dark:border-white/10 focus:border-primary/50 focus:ring-primary/20 hover:border-black/10 dark:hover:border-white/20 transition-all font-medium"
                      required={!isForgot}
                    />
                    <div
                      className="absolute right-3 top-3 cursor-pointer text-muted-foreground hover:text-primary transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 font-bold text-md shadow-lg shadow-primary/25 mt-2 group text-primary-foreground"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <>
                  {isForgot ? "Send Reset Link" : (isLogin ? "Sign In" : "Create Account")}
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
            
            {isLogin && !isForgot && (
              <Button
                type="button"
                variant="outline"
                onClick={handleBiometricLogin}
                className="w-full h-11 rounded-xl font-bold text-md shadow-sm mt-3 group"
                disabled={loading}
              >
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12Z"/><path d="M12 16.5C14.4853 16.5 16.5 14.4853 16.5 12C16.5 9.51472 14.4853 7.5 12 7.5C9.51472 7.5 7.5 9.51472 7.5 12C7.5 14.4853 9.51472 16.5 12 16.5Z"/><path d="M12 11.5V12.5"/><path d="M11.5 12H12.5"/></svg>
                  Face ID / Fingerprint
                </div>
              </Button>
            )}

            {isForgot && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsForgot(false)}
                className="w-full h-10 rounded-xl font-bold text-sm text-muted-foreground hover:text-foreground mt-2"
              >
                Back to Login
              </Button>
            )}
          </form>

          <div className="flex flex-col items-center justify-center gap-6 pt-8">
            <div className="text-center space-y-2">
              <p className="text-xs text-muted-foreground">
                By continuing, you agree to our{" "}
                <Link href="/terms" className="text-primary font-bold hover:underline underline-offset-4">Terms of Service</Link>
                {" "}and{" "}
                <Link href="/privacy" className="text-primary font-bold hover:underline underline-offset-4">Privacy Policy</Link>
              </p>
            </div>

            {/* Devinsol Branding Footer */}
            <div className="flex flex-col items-center justify-center gap-3 pt-6 opacity-80 border-t w-full border-dashed border-border/50">
              <div className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all cursor-pointer transform hover:scale-105 duration-300" onClick={() => window.open('https://devinsol.com', '_blank')}>
              </div>
              <div className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all cursor-pointer" onClick={() => window.open('https://devinsol.com', '_blank')}>
                <img src="https://devinsol.com/wp-content/uploads/2025/07/devinsol-favicon.png" alt="Devinsol Icon" className="w-5 h-5 object-contain" />
                <img src="https://devinsol.com/wp-content/uploads/2025/08/Devinsol-e1754743293456.png" alt="Devinsol Logo" className="h-4 object-contain" />
              </div>
              <div className="space-y-1 text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Designed by Devinsol</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
