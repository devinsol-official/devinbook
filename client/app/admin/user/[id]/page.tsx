"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, User as UserIcon, Calendar, Activity, Info, Crown, XCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function UserDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [months, setMonths] = useState("1")
  const { toast } = useToast()

  const fetchDetails = async () => {
    const secret = localStorage.getItem("adminSecret")
    if (!secret) return
    try {
      const result = await api.adminGetUserDetails(id as string, secret)
      setData(result)
    } catch (err) {
      console.error(err)
      router.push("/admin")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const secret = localStorage.getItem("adminSecret")
    if (!secret) {
      router.push("/admin")
      return
    }
    fetchDetails()
  }, [id, router])

  const handleActivate = async () => {
    if (!data?.user?.email) return
    setActionLoading(true)
    try {
      await api.adminActivateSubscription(data.user.email, parseInt(months), localStorage.getItem("adminSecret")!)
      toast({ title: "Success", description: "Subscription updated!" })
      fetchDetails()
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeactivate = async () => {
    if (!data?.user?.email) return
    if (!confirm("Are you sure you want to cancel this subscription?")) return;
    setActionLoading(true)
    try {
      await api.adminDeactivateSubscription(data.user.email, localStorage.getItem("adminSecret")!)
      toast({ title: "Success", description: "Subscription cancelled!" })
      fetchDetails()
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white font-bold">Loading User Details...</div>
  }

  if (!data || !data.user) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white font-bold">User not found</div>
  }

  const { user, history } = data
  const isPro = user.plan === "pro"

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8 space-y-8 animate-in fade-in">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => router.push("/admin")} className="border-slate-800 text-slate-300 hover:text-white bg-transparent">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </Button>
        <h1 className="text-3xl font-black text-white flex items-center gap-3">
          User Details
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-indigo-400" />
                Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs font-bold uppercase text-slate-500">Name</p>
                <p className="text-lg font-medium text-white">{user.name}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-slate-500">Email</p>
                <p className="text-lg font-medium text-white">{user.email}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-slate-500">Theme</p>
                <p className="text-lg font-medium text-white capitalize">{user.theme || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-slate-500">Registered On</p>
                <p className="text-lg font-medium text-white">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-500" />
                Manage Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Duration (Months)</label>
                <input 
                  type="number"
                  min="1"
                  value={months}
                  onChange={(e) => setMonths(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 transition-colors text-white"
                />
              </div>
              <div className="flex gap-3 pt-2 flex-col">
                <Button 
                  onClick={handleActivate} 
                  disabled={actionLoading}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold h-12 rounded-xl"
                >
                  {isPro ? "Extend / Renew Pro" : "Activate Pro"}
                </Button>
                {isPro && (
                  <Button 
                    onClick={handleDeactivate} 
                    disabled={actionLoading}
                    variant="destructive" 
                    className="w-full font-bold bg-red-600 hover:bg-red-700 text-white h-12 rounded-xl"
                  >
                    <XCircle className="w-4 h-4 mr-2" /> Cancel Subscription
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-amber-500" />
                Current Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs font-bold uppercase text-slate-500">Status</p>
                <div className="mt-1">
                  {user.plan === "pro" ? (
                    <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-3 py-1.5 rounded-md text-sm font-black uppercase inline-block">Pro</span>
                  ) : (
                    <span className="bg-slate-800 text-slate-400 px-3 py-1.5 rounded-md text-sm font-black uppercase inline-block">Free</span>
                  )}
                </div>
              </div>
              
              {user.plan === "pro" && (
                <div className="flex flex-wrap gap-12">
                  <div>
                    <p className="text-xs font-bold uppercase text-slate-500">Expires At</p>
                    <p className="text-lg font-medium text-white">
                      {new Date(user.planExpiresAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase text-slate-500">Days Remaining</p>
                    <p className={`text-lg font-medium ${user.isExpired ? "text-red-400" : "text-emerald-400"}`}>
                      {user.isExpired ? "Expired" : `${user.daysRemaining} Days`}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800 min-h-[400px]">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-400" />
                Subscription History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {history && history.length > 0 ? (
                <div className="space-y-3">
                  {history.map((log: any, idx: number) => (
                    <div key={idx} className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className={`font-black text-sm uppercase tracking-wider ${
                            log.action === "Activated" ? "text-emerald-400" : 
                            log.action === "Renewed" ? "text-blue-400" :
                            log.action === "Deactivated" ? "text-red-400" : "text-amber-400"
                          }`}>
                            {log.action}
                          </span>
                          <span className="text-xs font-medium text-slate-500">
                            {new Date(log.createdAt).toLocaleString()}
                          </span>
                        </div>
                        {log.details && (
                          <p className="text-slate-300 text-sm">{log.details}</p>
                        )}
                      </div>
                      {log.newExpiryDate && (
                        <div className="mt-3 md:mt-0 text-left md:text-right">
                          <p className="text-xs font-bold uppercase text-slate-500">New Expiry</p>
                          <p className="text-sm font-medium text-slate-300">{new Date(log.newExpiryDate).toLocaleDateString()}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <Info className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>No subscription history found for this user.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
