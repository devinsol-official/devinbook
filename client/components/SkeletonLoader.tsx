"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col min-h-screen bg-background pb-24 animate-pulse">
      {/* Account Balance Header Skeleton */}
      <div className="p-6 pt-12 space-y-8">
        <div className="flex gap-2">
          <div className="h-8 w-24 bg-muted/60 rounded-2xl" />
          <div className="h-8 w-24 bg-muted/60 rounded-2xl" />
          <div className="h-8 w-24 bg-muted/60 rounded-2xl" />
        </div>

        <div className="space-y-3">
          <div className="h-4 w-32 bg-muted/60 rounded" />
          <div className="h-10 w-48 bg-muted/60 rounded-xl" />
        </div>

        <div className="flex gap-4">
          <div className="w-14 h-14 rounded-2xl bg-muted/60" />
          <div className="flex-1 h-14 rounded-2xl bg-muted/60" />
        </div>
      </div>

      {/* Main Content Area Skeleton */}
      <div className="flex-1 bg-slate-50/50 dark:bg-slate-950 rounded-t-[40px] shadow-2xl border-t p-6 pb-20 space-y-8 min-h-[500px]">
        {/* Chart Area */}
        <div className="h-[200px] bg-muted/40 rounded-3xl" />
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="h-24 bg-muted/40 rounded-3xl" />
          <div className="h-24 bg-muted/40 rounded-3xl" />
        </div>

        {/* Categories */}
        <div className="space-y-4">
          <div className="h-6 w-32 bg-muted/40 rounded" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 p-2">
                <div className="w-12 h-12 rounded-2xl bg-muted/40" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 bg-muted/40 rounded" />
                  <div className="h-3 w-32 bg-muted/40 rounded" />
                </div>
                <div className="h-4 w-16 bg-muted/40 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function TransactionsSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-muted rounded-full animate-pulse" />
            <div className="space-y-1">
              <div className="h-4 w-24 bg-muted rounded animate-pulse" />
              <div className="h-3 w-16 bg-muted rounded animate-pulse" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-5 w-16 bg-muted rounded animate-pulse" />
            <div className="h-8 w-8 bg-muted rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function CategoriesSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-muted rounded-full animate-pulse" />
                <div className="space-y-1">
                  <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-16 bg-muted rounded animate-pulse" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-muted rounded animate-pulse" />
                <div className="h-8 w-8 bg-muted rounded animate-pulse" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
