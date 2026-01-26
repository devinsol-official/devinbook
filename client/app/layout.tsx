import type { Metadata, Viewport } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Outfit } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/AuthContext"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
})

export const metadata: Metadata = {
  title: "DevinBook | Daily Spending Mastered & Burn Rate Engine",
  description: "DevinBook is a high-performance personal finance PWA by Devinsol. Track daily expenditures, monitor real-time burn rates, and command your wealth with military-grade precision.",
  keywords: [
    "Daily Expense Tracker",
    "Personal Finance App",
    "Fintech",
    "Burn Rate Analysis",
    "Expenditure Management",
    "DevinBook",
    "Devinsol",
    "Digital Ledger",
    "Wealth Management",
    "Professional Budgeting",
    "Expense Logging PWA",
    "Ledger Reports",
    "WhatsApp Financial Reporting",
    "Budget Category Optimization",
    "Private Bookkeeping App",
    "Fintech Blog",
    "Small Business Expense Tracker"
  ],
  authors: [{ name: "Team Devinsol", url: "https://devinsol.com" }],
  publisher: "Devinsol",
  robots: "index, follow",
  openGraph: {
    type: "website",
    url: "https://devinbook.devinsol.com",
    title: "DevinBook | Daily Spending Mastered",
    description: "Absorb absolute clarity over every transaction. Log, map, and command your daily budget instantly in any currency.",
    siteName: "DevinBook",
    images: [{
      url: "/logo.svg",
      width: 1200,
      height: 630,
      alt: "DevinBook - Professional Financial Engine",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "DevinBook | Daily Spending Mastered",
    description: "Track daily expenditures and monitor real-time burn rates with precision.",
    images: ["/logo.svg"],
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon.png", type: "image/png", sizes: "96x96" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "DevinBook",
  },
}

export const viewport: Viewport = {
  themeColor: "#8B5CF6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={outfit.variable} suppressHydrationWarning>
      <head>
        <style>{`
html {
  font-family: var(--font-outfit), ${GeistSans.style.fontFamily};
  --font-sans: var(--font-outfit), ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
