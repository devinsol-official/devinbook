import { headers } from "next/headers";
import { PricingClient } from "@/components/PricingClient";
import { PricingHeader } from "@/components/PricingHeader";
import { BottomNavigation } from "@/components/BottomNavigation";

export const metadata = {
  title: "Pricing | DevinBook",
  description: "Choose the perfect plan for your financial needs.",
};

export default async function PricingPage() {
  const headersList = await headers();
  // Vercel sets this header. If absent, pass undefined.
  const countryHeader = headersList.get("x-vercel-ip-country") || undefined;
  
  // We explicitly do not pass internal unknown sentinels like 'OTHERS' to Paddle.
  const country = countryHeader && countryHeader !== 'OTHERS' ? countryHeader : undefined;

  return (
    <main className="mx-auto min-h-screen max-w-[450px] relative overflow-x-hidden border-x border-white/20 dark:border-white/5 pb-20 shadow-2xl bg-slate-950" style={{background: 'var(--bg-gradient)'}}>
      <PricingHeader />
      <div className="space-y-8 relative z-10 pt-20 px-4">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-black text-white tracking-tight">
            Simple, transparent pricing
          </h1>
          <p className="text-sm text-slate-400 max-w-sm mx-auto font-medium">
            Choose the plan that best fits your needs. 14-day money-back guarantee.
          </p>
        </div>

        <PricingClient initialCountry={country} />
      </div>
      <BottomNavigation />
    </main>
  );
}
