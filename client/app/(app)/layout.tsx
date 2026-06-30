import { BottomNavigation } from "@/components/BottomNavigation"
import { DesktopGuard } from "@/components/DesktopGuard"

export default function AppLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        // <DesktopGuard>
        <main className="mx-auto min-h-screen max-w-[450px] relative overflow-x-hidden border-x border-white/20 dark:border-white/5 pb-20 shadow-2xl" style={{background: 'var(--bg-gradient)'}}>
            {children}
            <BottomNavigation />
        </main>
        // </DesktopGuard>
    )
}
