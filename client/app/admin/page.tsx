"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Users, Crown, Settings2 } from "lucide-react"

export default function AdminDashboard() {
  const [adminSecret, setAdminSecret] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const savedSecret = localStorage.getItem("adminSecret")
    if (savedSecret) {
      setAdminSecret(savedSecret)
      api.adminListUsers(savedSecret).then(data => {
        setUsers(data)
        setIsAuthenticated(true)
      }).catch(() => {
        localStorage.removeItem("adminSecret")
      })
    }
  }, [])

  const [email, setEmail] = useState("")
  const [months, setMonths] = useState("1")

  const handleLogin = async () => {
    if (!adminSecret) return
    setLoading(true)
    try {
      const data = await api.adminListUsers(adminSecret)
      setUsers(data)
      setIsAuthenticated(true)
      localStorage.setItem("adminSecret", adminSecret)
      toast({ title: "Authenticated successfully" })
    } catch (err: any) {
      toast({ title: "Failed to authenticate", description: err.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const data = await api.adminListUsers(adminSecret)
      setUsers(data)
    } catch (err: any) {
      toast({ title: "Failed to refresh", description: err.message, variant: "destructive" })
    }
  }

  const handleActivate = async () => {
    if (!email) return
    try {
      await api.adminActivateSubscription(email, parseInt(months), adminSecret)
      toast({ title: "Success", description: `Activated Pro for ${email}` })
      fetchUsers()
      setEmail("")
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    }
  }

  const handleDeactivate = async () => {
    if (!email) return
    try {
      await api.adminDeactivateSubscription(email, adminSecret)
      toast({ title: "Success", description: `Deactivated Pro for ${email}` })
      fetchUsers()
      setEmail("")
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-900 border-slate-800 text-white">
          <CardHeader>
            <CardTitle className="text-2xl font-black text-center flex items-center justify-center gap-2">
              <Settings2 className="w-6 h-6 text-indigo-500" />
              Admin Portal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Admin Secret</label>
              <input 
                type="password"
                value={adminSecret}
                onChange={(e) => setAdminSecret(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 transition-colors"
                placeholder="Enter secret key..."
              />
            </div>
            <Button 
              onClick={handleLogin} 
              disabled={loading || !adminSecret}
              className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl"
            >
              {loading ? "Authenticating..." : "Login"}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8 space-y-8 animate-in fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black text-white flex items-center gap-3">
          <Settings2 className="w-8 h-8 text-indigo-500" />
          Admin Dashboard
        </h1>
        <Button variant="outline" onClick={fetchUsers} className="border-slate-700 text-slate-300 hover:text-white">
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-500" />
                Manage Subscription
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">User Email</label>
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 transition-colors text-white"
                  placeholder="user@example.com"
                />
              </div>
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
              <div className="flex gap-3 pt-2">
                <Button onClick={handleActivate} className="flex-1 bg-amber-500 hover:bg-amber-600 text-black font-bold">
                  Activate Pro
                </Button>
                <Button onClick={handleDeactivate} variant="destructive" className="flex-1 font-bold bg-red-600 hover:bg-red-700 text-white">
                  Deactivate
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-6">
               <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-400">Total Users</p>
                    <p className="text-3xl font-black text-white">{users.length}</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                    <Users className="w-6 h-6 text-indigo-500" />
                  </div>
               </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                Registered Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-400 uppercase bg-slate-950/50">
                    <tr>
                      <th className="px-4 py-3 rounded-tl-xl">Name</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Plan</th>
                      <th className="px-4 py-3 rounded-tr-xl">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u, idx) => (
                      <tr 
                        key={idx} 
                        onClick={() => router.push(`/admin/user/${u.id}`)}
                        className="border-b border-slate-800 last:border-0 hover:bg-slate-800/50 transition-colors cursor-pointer"
                      >
                        <td className="px-4 py-4 font-bold text-white">{u.name}</td>
                        <td className="px-4 py-4 text-slate-400">{u.email}</td>
                        <td className="px-4 py-4">
                          {u.plan === "pro" ? (
                            <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-1 rounded-md text-xs font-black uppercase">Pro</span>
                          ) : (
                            <span className="bg-slate-800 text-slate-400 px-2 py-1 rounded-md text-xs font-black uppercase">Free</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          {u.plan === "pro" && (
                            <span className="text-xs font-medium text-slate-400">
                              {u.isExpired ? (
                                <span className="text-red-400">Expired</span>
                              ) : (
                                <span>{u.daysRemaining} days left</span>
                              )}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
