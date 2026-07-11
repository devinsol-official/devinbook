export interface Tier {
  name: "Standard" | "Pro";
  description: string;
  features: string[];
  priceId?: { month: string; year: string };
  isFree?: boolean;
}

export const PRICING_TIERS: Tier[] = [
  {
    name: "Standard",
    description: "Perfect for getting your daily flow in order.",
    isFree: true,
    features: [
      "Up to 5 transaction categories",
      "Basic daily burn analysis",
      "Cloud-synced database",
      "Standard Email/Password entry",
      "Mobile-optimized interface"
    ]
  },
  {
    name: "Pro",
    description: "Unlock your financial data's true potential.",
    features: [
      "Unlimited transaction categories",
      "Biometric Face ID / Touch ID entry",
      "Institutional-grade PDF Reports",
      "Advanced deep analytics panels",
      "Priority feature access"
    ],
    priceId: {
      month: process.env.NEXT_PUBLIC_PADDLE_PRO_MONTH_PRICE_ID || "pri_pro_monthly_placeholder",
      year: process.env.NEXT_PUBLIC_PADDLE_PRO_YEAR_PRICE_ID || "pri_pro_yearly_placeholder",
    },
  }
];
