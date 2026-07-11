"use client";

import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { api } from "@/lib/api";
import { ArrowLeft, Clock, CreditCard, Crown, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface SubscriptionLog {
  _id: string;
  action: string;
  newExpiryDate: string | null;
  details: string;
  createdAt: string;
}

export default function AccountPage() {
  const { isPro, daysRemaining, planExpiresAt, planActivatedAt, showUpgradeModal } = useSubscription();
  const [logs, setLogs] = useState<SubscriptionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchLogs() {
      try {
        const history = await api.getSubscriptionHistory();
        setLogs(history);
      } catch (err) {
        console.error("Failed to load subscription history:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, []);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <ProtectedRoute>
      <div className="flex flex-col min-h-screen bg-background p-4 space-y-8 pb-32">
        <div className="flex items-center gap-3 mb-2 pt-2">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-10 w-10 rounded-full hover:bg-muted shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-extrabold tracking-tight">Account</h1>
        </div>

        {/* Current Plan Section */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground px-2">Current Plan</h3>
          <div className="bg-card border rounded-[32px] p-6 shadow-xl relative overflow-hidden">
            {isPro && (
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-2xl rounded-full pointer-events-none" />
            )}
            
            <div className="flex items-center gap-4 mb-6 relative z-10">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${
                isPro ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white" : "bg-muted text-muted-foreground"
              }`}>
                {isPro ? <Crown className="h-7 w-7 text-white drop-shadow-md" /> : <Wallet className="h-7 w-7" />}
              </div>
              <div>
                <h2 className="text-2xl font-black">{isPro ? "DevinBook Pro" : "Free Plan"}</h2>
                <p className="text-sm font-medium text-muted-foreground">
                  {isPro ? "Active Subscription" : "Basic Access"}
                </p>
              </div>
            </div>

            {isPro ? (
              <div className="space-y-4 relative z-10">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-background rounded-2xl p-4 border border-border/50">
                    <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Activated</p>
                    <p className="text-sm font-bold">{planActivatedAt ? planActivatedAt.toLocaleDateString() : "—"}</p>
                  </div>
                  <div className="bg-background rounded-2xl p-4 border border-border/50">
                    <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Expires</p>
                    <p className="text-sm font-bold text-amber-500">{planExpiresAt ? planExpiresAt.toLocaleDateString() : "—"}</p>
                  </div>
                </div>

                {daysRemaining !== null && (
                  <div className="bg-background rounded-2xl p-4 border border-border/50">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-[10px] font-black uppercase text-muted-foreground">Time Remaining</p>
                      <span className={`text-xs font-black ${daysRemaining <= 3 ? "text-rose-500" : daysRemaining <= 7 ? "text-amber-500" : "text-emerald-500"}`}>
                        {daysRemaining === 0 ? "Expires today" : `${daysRemaining} days`}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${daysRemaining <= 3 ? "bg-rose-500" : daysRemaining <= 7 ? "bg-amber-500" : "bg-emerald-500"}`}
                        style={{ width: `${Math.min(100, Math.round((daysRemaining / 30) * 100))}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="relative z-10">
                <p className="text-sm text-muted-foreground mb-4">You are currently on the free plan. Upgrade to unlock unlimited accounts, categories, and advanced reporting.</p>
                <Button 
                  onClick={() => showUpgradeModal()}
                  className="w-full h-12 rounded-xl font-black bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg hover:opacity-90"
                >
                  <Crown className="h-4 w-4 mr-2" /> Upgrade to Pro
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* History Section */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground px-2">Billing History</h3>
          <div className="bg-card border rounded-[32px] overflow-hidden">
            {loading ? (
              <div className="p-8 flex justify-center">
                <div className="w-8 h-8 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
              </div>
            ) : logs.length === 0 ? (
              <div className="p-10 text-center flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold text-sm">No History</p>
                  <p className="text-xs text-muted-foreground">You don't have any past subscriptions or payments.</p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {logs.map((log) => (
                  <div key={log._id} className="p-5 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          log.action.includes('Activated') || log.action.includes('Renewed') || log.action.includes('Applied') ? 'bg-emerald-500' :
                          log.action.includes('Cancelled') || log.action.includes('Expired') ? 'bg-rose-500' : 'bg-blue-500'
                        }`} />
                        <span className="font-bold text-sm">{log.action}</span>
                      </div>
                      <span className="text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        {formatDate(log.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground pl-4 mb-2">{log.details}</p>
                    {log.newExpiryDate && (
                      <div className="pl-4">
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-500/10 px-2 py-1 rounded-lg">
                          <Clock className="h-3 w-3" />
                          Valid until {new Date(log.newExpiryDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
