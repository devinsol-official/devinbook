"use client";

import Link from "next/link";
import { ArrowLeft, Wallet } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function PricingHeader() {
  const { user } = useAuth();

  return (
    <header className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between z-10 max-w-6xl mx-auto">
      <Link href="/" className="flex items-center gap-2 group">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
          <Wallet className="h-5 w-5 text-white" />
        </div>
        <span className="font-black text-xl text-white tracking-tight">
          DevinBook
        </span>
      </Link>

      <Link
        href={user ? "/dashboard" : "/login"}
        className="flex items-center gap-2 text-sm font-bold text-slate-300 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full border border-white/10"
      >
        <ArrowLeft className="h-4 w-4" />
        {user ? "Back to Dashboard" : "Sign In"}
      </Link>
    </header>
  );
}
