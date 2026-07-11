"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { initializePaddle, Paddle, PricePreviewParams } from "@paddle/paddle-js";
import { PRICING_TIERS, Tier } from "@/lib/pricing-tiers";
import { Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface PricingClientProps {
  initialCountry?: string;
}

export function PricingClient({ initialCountry }: PricingClientProps) {
  const [paddle, setPaddle] = useState<Paddle | null>(null);
  const [billingCycle, setBillingCycle] = useState<"month" | "year">("month");
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    let isMounted = true;

    async function initPaddle() {
      const clientToken = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
      const environment = process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT;

      if (!clientToken || !environment) {
        console.error("Missing Paddle environment variables. Must define NEXT_PUBLIC_PADDLE_CLIENT_TOKEN and NEXT_PUBLIC_PADDLE_ENVIRONMENT.");
        if (isMounted) setIsLoading(false);
        return;
      }

      if (environment !== "sandbox") {
        console.error("This pricing page is configured to run exclusively in the sandbox environment, but the environment is set to:", environment);
      }

      try {
        const paddleInstance = await initializePaddle({
          environment: environment as "sandbox" | "production",
          token: clientToken,
          eventCallback: function(event: any) {
            if (event.name === "checkout.completed") {
              const ptxn = event.data.transaction_id;
              if (ptxn) {
                setIsLoading(true);
                fetch('/api/paddle/verify-transaction', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    ...(typeof window !== "undefined" && localStorage.getItem("token") 
                          ? { Authorization: `Bearer ${localStorage.getItem("token")}` } 
                          : {})
                  },
                  body: JSON.stringify({ ptxn })
                })
                .then(res => res.json())
                .then(data => {
                  if (data.success && data.user) {
                    toast({ title: "Success!", description: "Subscription activated successfully." });
                    setTimeout(() => window.location.reload(), 1500);
                  } else {
                    console.error("Verification failed:", data);
                    toast({ title: "Verification Failed", description: data.message || "Could not verify subscription.", variant: "destructive" });
                  }
                })
                .catch(console.error)
                .finally(() => setIsLoading(false));
              }
            }
          }
        });

        if (paddleInstance && isMounted) {
          setPaddle(paddleInstance);
          fetchPrices(paddleInstance);
        }
      } catch (err) {
        console.error("Failed to initialize Paddle:", err);
        if (isMounted) setIsLoading(false);
      }
    }

    async function fetchPrices(paddleInstance: Paddle) {
      try {
        const allPriceIds = PRICING_TIERS.flatMap((tier) => 
          tier.priceId ? [tier.priceId.month, tier.priceId.year] : []
        ).filter(id => id && !id.includes("placeholder"));

        if (allPriceIds.length === 0) {
          setIsLoading(false);
          return;
        }

        const items = allPriceIds.map(id => ({ priceId: id, quantity: 1 }));

        const requestParams: PricePreviewParams = {
          items,
        };

        if (initialCountry) {
          requestParams.customerIpAddress = initialCountry; // Actually, for country it's usually customerAddress: { countryCode } but let's check. Wait, PricePreview takes address.countryCode. 
          // Note: The paddle-js docs for price preview say: customerIpAddress or address.countryCode
          requestParams.address = { countryCode: initialCountry as any };
        }

        const preview = await paddleInstance.PricePreview(requestParams);
        
        const newPrices: Record<string, string> = {};
        preview.data.details.lineItems.forEach((item) => {
          newPrices[item.price.id] = item.formattedTotals.total;
        });

        if (isMounted) {
          setPrices(newPrices);
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Failed to fetch price preview:", err);
        if (isMounted) setIsLoading(false);
      }
    }

    initPaddle();

    return () => {
      isMounted = false;
    };
  }, [initialCountry]);
  const router = useRouter();

  const searchParams = useSearchParams();

  useEffect(() => {
    const ptxn = searchParams.get('_ptxn');
    if (ptxn) {
      setIsLoading(true);
      fetch('/api/paddle/verify-transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(typeof window !== "undefined" && localStorage.getItem("token") 
                ? { Authorization: `Bearer ${localStorage.getItem("token")}` } 
                : {})
        },
        body: JSON.stringify({ ptxn })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.user) {
          toast({ title: "Success!", description: "Subscription activated successfully." });
          // Optional: we could update the local user context here, but reloading ensures fresh state
          setTimeout(() => window.location.reload(), 1500);
        } else {
          console.error("Verification failed:", data);
          toast({ title: "Verification Failed", description: data.message || "Could not verify subscription. It might take a minute.", variant: "destructive" });
        }
      })
      .catch(console.error)
      .finally(() => {
        router.replace('/pricing');
        setIsLoading(false);
      });
    }
  }, [router, toast]);
  const handleSubscribe = (tier: Tier) => {
    if (tier.isFree) {
      window.location.href = "/dashboard";
      return;
    }

    if (!paddle) {
      toast({ title: "Error", description: "Paddle is not initialized. Please check your environment variables.", variant: "destructive" });
      return;
    }

    const priceId = tier.priceId?.[billingCycle];
    if (!priceId || priceId.includes("placeholder")) {
      toast({ title: "Configuration Error", description: "Price ID is missing or invalid. Please update lib/pricing-tiers.ts.", variant: "destructive" });
      return;
    }

    paddle.Checkout.open({
      items: [{ priceId, quantity: 1 }],
      customData: {
        user_id: user?.id,
        subscription_type: tier.id
      },
      customer: {
        email: user?.email || '',
      }
    });
  };

  if (!process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || !process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT) {
    return (
      <div className="text-center p-12 bg-red-500/10 border border-red-500/20 rounded-3xl max-w-2xl mx-auto">
        <h2 className="text-xl font-bold text-red-500 mb-2">Configuration Error</h2>
        <p className="text-red-400">
          Missing Paddle environment variables. You must configure <code>NEXT_PUBLIC_PADDLE_CLIENT_TOKEN</code> and <code>NEXT_PUBLIC_PADDLE_ENVIRONMENT</code>.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Toggle */}
      <div className="flex justify-center">
        <div className="bg-slate-900 p-1.5 rounded-full border border-slate-800 flex items-center">
          <button
            onClick={() => setBillingCycle("month")}
            className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
              billingCycle === "month"
                ? "bg-indigo-600 text-white shadow-lg"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle("year")}
            className={`relative px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
              billingCycle === "year"
                ? "bg-indigo-600 text-white shadow-lg"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Yearly
            <span className="absolute -top-2.5 -right-2 px-2 py-0.5 bg-green-500 text-white text-[9px] font-black uppercase tracking-wider rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.4)]">
              Save 20%
            </span>
          </button>
        </div>
      </div>

      {/* Tiers */}
      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {PRICING_TIERS.map((tier) => {
          const currentPriceId = tier.priceId ? tier.priceId[billingCycle] : "";
          const displayPrice = tier.isFree ? "$0" : prices[currentPriceId];

          return (
            <div
              key={tier.name}
              className={`relative flex flex-col p-8 bg-slate-900 rounded-3xl border ${
                tier.name === "Pro"
                  ? "border-indigo-500 shadow-2xl shadow-indigo-500/20"
                  : "border-slate-800"
              }`}
            >
              {tier.name === "Pro" && (
                <div className="absolute -top-4 left-0 right-0 flex justify-center">
                  <span className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-wider">
                    Most Popular
                  </span>
                </div>
              )}
              {user && tier.name.toLowerCase() === user.plan && (
                <div className="absolute -top-10 left-0 right-0 flex justify-center">
                  <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    Current Plan
                  </span>
                </div>
              )}

              <div className="space-y-4 mb-8">
                <h3 className="text-2xl font-black text-white">{tier.name}</h3>
                <p className="text-slate-400 text-sm h-10">{tier.description}</p>
              </div>

              <div className="mb-8">
                {!tier.isFree && isLoading ? (
                  <div className="h-12 flex items-end animate-pulse bg-slate-800 rounded-lg w-32" />
                ) : (
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-black text-white">
                      {displayPrice || "$--"}
                    </span>
                    {!tier.isFree && (
                      <span className="text-slate-500 font-bold mb-1">
                        /{billingCycle === "month" ? "mo" : "yr"}
                      </span>
                    )}
                    {tier.isFree && (
                      <span className="text-slate-500 font-bold mb-1">
                        / forever
                      </span>
                    )}
                  </div>
                )}
              </div>

              <ul className="space-y-4 mb-8 flex-1">
                {tier.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-emerald-500 font-bold" />
                    </div>
                    <span className="text-slate-300 text-sm font-medium">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handleSubscribe(tier)}
                disabled={
                  (user && tier.name.toLowerCase() === user.plan) ||
                  (!tier.isFree && isLoading)
                }
                className={`w-full h-12 rounded-xl font-bold text-base transition-all ${
                  tier.name === "Pro"
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/25"
                    : "bg-slate-800 hover:bg-slate-700 text-white"
                }`}
              >
                {tier.isFree
                  ? "Get Started for Free"
                  : user && tier.name.toLowerCase() === user.plan
                  ? "Your Plan"
                  : !tier.isFree && isLoading
                  ? "Loading..."
                  : "Upgrade to Pro"}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
