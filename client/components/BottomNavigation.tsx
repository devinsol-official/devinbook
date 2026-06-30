"use client"

import { Home, Receipt, Settings, LayoutGrid } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"

export function BottomNavigation() {
  const pathname = usePathname()
  const { user } = useAuth()

  const tabs = [
    { id: "dashboard", label: "Home", icon: Home, href: "/dashboard" },
    { id: "transactions", label: "Transactions", icon: Receipt, href: "/transactions" },
    { id: "manage", label: "Manage", icon: LayoutGrid, href: "/manage" },
    { id: "profile", label: "Settings", isLogo: true, icon: "https://devinsol.com/wp-content/uploads/2025/07/devinsol-favicon.png", href: "/profile" },
  ]

  // Hide navigation if user is not logged in or on the landing page
  if (!user || pathname === "/") return null

  return (
    <div className="fixed bottom-6 left-4 right-4 max-w-[calc(450px-32px)] mx-auto liquid-glass border border-white/30 dark:border-white/10 px-2 py-2.5 rounded-[24px] shadow-2xl z-50 transition-all">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href)

          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={`flex flex-col items-center gap-1 py-1 px-3 min-w-[64px] transition-all hover:scale-105 active:scale-95 ${isActive ? "text-primary bg-primary/5 rounded-xl" : "text-muted-foreground hover:text-foreground"
                }`}
            >
              {tab.isLogo ? (
                <img
                  src={tab.icon as string}
                  alt={tab.label}
                  className={`h-5 w-5 object-contain transition-all ${isActive ? "" : "grayscale opacity-70"}`}
                />
              ) : (
                <tab.icon className={`h-5 w-5 ${isActive ? "fill-current" : ""}`} />
              )}
              <span className="text-[10px] uppercase tracking-wider font-bold">{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
