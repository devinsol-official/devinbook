"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback, useEffect, useMemo } from "react"
import { useAuth } from "./AuthContext"

interface SubscriptionContextType {
  isPro: boolean
  isExpired: boolean
  daysRemaining: number | null      // null = no subscription ever
  planExpiresAt: Date | null
  planActivatedAt: Date | null
  showUpgradeModal: (featureName?: string) => void
  hideUpgradeModal: () => void
  upgradeModalOpen: boolean
  upgradeFeatureName: string | undefined
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined)

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false)
  const [upgradeFeatureName, setUpgradeFeatureName] = useState<string | undefined>(undefined)

  const planExpiresAt = useMemo(
    () => (user?.planExpiresAt ? new Date(user.planExpiresAt) : null),
    [user?.planExpiresAt]
  )
  const planActivatedAt = useMemo(
    () => (user?.planActivatedAt ? new Date(user.planActivatedAt) : null),
    [user?.planActivatedAt]
  )

  // Compute time-remaining live (updates every minute)
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  const isExpired = planExpiresAt ? planExpiresAt < now : false
  const isPro = user?.plan === "pro" && !isExpired

  const daysRemaining: number | null = planExpiresAt
    ? Math.max(0, Math.ceil((planExpiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : null

  const showUpgradeModal = useCallback((featureName?: string) => {
    setUpgradeFeatureName(featureName)
    setUpgradeModalOpen(true)
  }, [])

  const hideUpgradeModal = useCallback(() => {
    setUpgradeModalOpen(false)
    setUpgradeFeatureName(undefined)
  }, [])

  return (
    <SubscriptionContext.Provider value={{
      isPro,
      isExpired,
      daysRemaining,
      planExpiresAt,
      planActivatedAt,
      showUpgradeModal,
      hideUpgradeModal,
      upgradeModalOpen,
      upgradeFeatureName,
    }}>
      {children}
    </SubscriptionContext.Provider>
  )
}

export function useSubscription() {
  const context = useContext(SubscriptionContext)
  if (context === undefined) {
    throw new Error("useSubscription must be used within a SubscriptionProvider")
  }
  return context
}
