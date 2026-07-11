"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

interface CurrencyContextType {
  currency: string;
  setCurrency: (currency: string) => void;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

export const CURRENCIES = [
  { symbol: "Rs", label: "PKR" },
  { symbol: "$", label: "USD" },
  { symbol: "₹", label: "INR" },
  { symbol: "€", label: "EUR" },
  { symbol: "£", label: "GBP" },
]

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<string>("Rs");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const storedCurrency = localStorage.getItem("currency");
    if (storedCurrency) {
      setCurrencyState(storedCurrency);
    }
  }, []);

  const setCurrency = (newCurrency: string) => {
    setCurrencyState(newCurrency);
    if (typeof window !== "undefined") {
      localStorage.setItem("currency", newCurrency);
    }
  }

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider")
  }
  return context
}
