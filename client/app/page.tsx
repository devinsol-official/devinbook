"use client"

import React, { useState, useEffect } from "react"
import packageInfo from "../../package.json"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion"
import {
  Shield,
  Zap,
  ArrowRight,
  PieChart,
  Apple,
  Play,
  Activity,
  Globe,
  Lock,
  Target,
  Sparkles,
  Cpu,
  BarChart3,
  Wallet,
  CheckCircle2,
  TrendingUp,
  Fingerprint,
  Download,
  Share2,
  PlusCircle,
  LayoutDashboard,
  ArrowUpRight,
  ChevronRight
} from "lucide-react"

// Premium Button Component
const PremiumButton = ({ children, href, variant = "primary", className = "", size = "md" }: any) => {
  const isPrimary = variant === "primary"

  return (
    <motion.div
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      <Button asChild className={`
        relative overflow-hidden font-bold tracking-tight transition-all duration-300 group
        ${size === "lg" ? "h-14 px-10 text-base rounded-[18px]" : "h-11 px-7 text-sm rounded-[14px]"}
        ${isPrimary
          ? "bg-gradient-to-r from-[#8B5CF6] to-[#D946EF] !text-white hover:opacity-90 shadow-[0_8px_25px_-5px_rgba(139,92,246,0.3)] hover:shadow-[0_15px_35px_-10px_rgba(139,92,246,0.4)] border-none"
          : "bg-white !text-black border border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-sm"}
        ${className}
      `}>
        <Link href={href || "#"}>
          {/* Shine Effect */}
          {isPrimary && (
            <div className="absolute inset-0 w-1/2 h-full bg-white/20 skew-x-[-25deg] -translate-x-full group-hover:animate-shine transition-none pointer-events-none" />
          )}
          <span className="relative z-10 flex items-center gap-2">
            {children}
            {isPrimary && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform !text-white" />}
          </span>
        </Link>
      </Button>
    </motion.div>
  )
}

const Nav = () => {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? "bg-white/80 backdrop-blur-xl border-b border-slate-200/50 py-2.5" : "bg-transparent py-5"
      }`}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 relative">
            <img src="/logo.svg" alt="DevinBook" className="w-full h-full object-contain relative z-10" />
            <div className="absolute inset-0 bg-[#8B5CF6]/10 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <span className="text-lg font-bold tracking-tight text-black font-sans">DevinBook</span>
        </Link>

        <div className="hidden lg:flex items-center gap-8">
          {['Features', 'Intelligence', 'Security', 'Reports', 'Blog'].map((item) => (
            <Link
              key={item}
              href={item === 'Blog' ? '/blog' : `#${item.toLowerCase()}`}
              className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 hover:text-[#8B5CF6] transition-colors font-sans"
            >
              {item}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400 hover:text-black px-3 transition-colors font-sans hidden sm:block">
            Go to App
          </Link>
          <PremiumButton href="/dashboard" size="sm">
            Try Now
          </PremiumButton>
        </div>
      </div>
    </nav>
  )
}

const FinancialNodeDiagram = () => {
  return (
    <div className="relative w-full h-full min-h-[400px] flex items-center justify-center bg-slate-50 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.02)_1px,transparent_0)] bg-[size:24px_24px]" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-[360px] p-6 bg-white rounded-[32px] shadow-[0_20px_80px_rgba(0,10,50,0.08)] border border-white"
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#8B5CF6]/60">Real-Time Distribution</p>
              <h4 className="text-xl font-bold tracking-tight text-black">Wealth Mapping</h4>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#8B5CF6]/10 flex items-center justify-center text-[#8B5CF6]">
              <Activity className="w-5 h-5" />
            </div>
          </div>

          <div className="relative flex items-center justify-center py-6">
            <svg className="w-40 h-40 -rotate-90">
              <circle cx="80" cy="80" r="64" fill="transparent" stroke="#f8fafc" strokeWidth="16" />
              <motion.circle
                cx="80" cy="80" r="64" fill="transparent" stroke="#8B5CF6" strokeWidth="16" strokeDasharray="402"
                initial={{ strokeDashoffset: 402 }}
                whileInView={{ strokeDashoffset: 120 }}
                transition={{ duration: 2, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold tracking-tighter text-black">72%</span>
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Cap Reached</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Growth</p>
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                <span className="text-xs font-bold text-black">+14.2%</span>
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Status</p>
              <div className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-[#8B5CF6]" />
                <span className="text-xs font-bold text-black">Optimal</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[10%] right-[10%] p-3 bg-white/80 backdrop-blur-md rounded-xl shadow-lg border border-white flex items-center gap-2 z-20"
      >
        <div className="w-6 h-6 rounded-lg bg-green-500/10 flex items-center justify-center text-green-600">
          <LayoutDashboard className="w-3 h-3" />
        </div>
        <p className="text-[9px] font-bold text-black">Analytics Active</p>
      </motion.div>
    </div>
  )
}

export default function LandingPage() {
  const { scrollY } = useScroll()
  const yHero = useTransform(scrollY, [0, 500], [0, 40])

  return (
    <div className="relative min-h-screen bg-white text-black overflow-x-hidden font-sans selection:bg-indigo-100 tracking-[-0.01em]">
      <Nav />

      <main className="relative min-h-screen">
        {/* Dynamic Background Decor */}
        <div className="absolute top-0 left-0 w-full h-[100vh] pointer-events-none -z-10 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.05),transparent_60%),radial-gradient(circle_at_bottom_left,rgba(255,59,48,0.03),transparent_60%)]" />

        {/* Hero Section */}
        <section aria-label="Introduction" className="relative pt-24 lg:pt-32 pb-12 px-6 max-w-7xl mx-auto overflow-hidden">
          {/* Background Grid Accent */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] -z-10" />

          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-4 relative">
            {/* Decorative Floating Nodes - Moved further out for neatness */}
            <motion.div
              animate={{ y: [0, -8, 0], rotate: [0, 1, 0] }}
              transition={{ duration: 5, repeat: Infinity }}
              className="absolute top-0 -left-40 p-2.5 bg-white/80 backdrop-blur-md shadow-lg rounded-xl border border-slate-100 hidden xl:flex items-center gap-2 z-0 opacity-40 hover:opacity-100 transition-opacity"
            >
              <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center text-green-600 text-[9px] font-bold">+</div>
              <span className="text-[9px] font-bold text-slate-500">Lunch Logged</span>
            </motion.div>

            <motion.div
              animate={{ y: [0, 8, 0], rotate: [0, -1, 0] }}
              transition={{ duration: 6, repeat: Infinity, delay: 1 }}
              className="absolute top-44 -left-48 p-2.5 bg-white/80 backdrop-blur-md shadow-lg rounded-xl border border-slate-100 hidden xl:flex items-center gap-2 z-0 opacity-40 hover:opacity-100 transition-opacity"
            >
              <div className="w-5 h-5 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-600 text-[9px]">💰</div>
              <span className="text-[9px] font-bold text-slate-500">Daily Goal Reached</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="lg:w-[40%] flex flex-col items-center lg:items-start text-center lg:text-left space-y-4 lg:space-y-3 relative z-10"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-100 text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400 shadow-sm font-sans mb-1">
                <Sparkles className="w-2.5 h-2.5 text-indigo-500" />
                DevinBook v{packageInfo.version}
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-6xl xl:text-7xl font-black tracking-[-0.04em] leading-[0.95] text-black font-sans">
                Daily Spending <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8B5CF6] via-[#A855F7] to-[#D946EF] bg-[length:300%_auto] animate-gradient">Mastered.</span>
              </h1>

              <p className="text-slate-500 text-base md:text-lg lg:text-xl font-medium max-w-md mx-auto lg:mx-0 leading-relaxed font-sans opacity-90">
                Absorb absolute clarity over every transaction. Log daily expenses in seconds, map your burn rate instantly, and command your budget with precision.
              </p>

              <div className="flex flex-col items-center lg:items-start gap-6 pt-2">
                <div className="flex flex-col sm:flex-row items-center gap-4 lg:gap-6 justify-center lg:justify-start">
                  <PremiumButton href="/dashboard" size="lg" aria-label="Get Started with DevinBook">
                    Setup Your Vault
                  </PremiumButton>
                </div>

                <div className="flex items-center gap-6 opacity-60">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 overflow-hidden">
                        <img src={`https://i.pravatar.cc/100?u=${i + 10}`} alt="Active User Avatar" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                  <div className="text-[11px] font-bold text-slate-500 leading-tight">
                    <span className="text-black">Trusted by 5,000+</span> <br />
                    users managing daily flow
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.98, x: 20 }}
              animate={{
                opacity: 1,
                scale: 1,
                x: 0,
                y: [0, -12, 0]
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
                opacity: { duration: 0.8 },
                scale: { duration: 0.8 },
                x: { duration: 0.8 }
              }}
              className="lg:w-[60%] relative py-4"
            >
              <div className="relative z-10 w-full max-w-[690px] mx-auto flex items-center gap-8 group">
                {/* Structural Vertical Divider */}
                <div className="absolute left-1/2 -ml-4 top-1/4 bottom-1/4 w-px bg-slate-100 hidden xl:block" />

                {/* Main Mockup Chassis */}
                <div className="relative flex-1">
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.03, 0.08, 0.03],
                    }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="absolute inset-0 bg-[#8B5CF6]/20 blur-[120px] rounded-full scale-125 pointer-events-none" />

                  <motion.img
                    whileHover={{ scale: 1.02, rotate: -0.5 }}
                    draggable={false}
                    src="/mockups/hero-alpha.png"
                    alt="DevinBook Financial Dashboard Showcase"
                    className="w-full h-auto relative z-10 transition-all duration-700 pointer-events-none"
                  />
                </div>

                {/* Structural Widget Panel - Fills the 'Right' void */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="hidden xl:flex flex-col gap-4 w-48 shrink-0 relative z-20"
                >
                  <div className="p-4 bg-white/60 backdrop-blur-md rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Live Ledger</p>
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    </div>
                    <div className="space-y-2">
                      {[
                        { label: 'Groceries', val: '-450 Rs', type: 'neg' },
                        { label: 'Fuel Log', val: '-2,200 Rs', type: 'neg' },
                        { label: 'Refund', val: '+120 Rs', type: 'pos' }
                      ].map((item, id) => (
                        <div key={id} className="flex items-center justify-between gap-3 py-1.5 border-b border-slate-50 last:border-0">
                          <span className="text-[10px] font-bold text-black truncate">{item.label}</span>
                          <span className={`text-[10px] font-black ${item.type === 'pos' ? 'text-green-500' : 'text-red-400'}`}>{item.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-[#8B5CF6] to-[#D946EF] rounded-[22px] shadow-2xl shadow-purple-200/50 space-y-2">
                    <p className="text-[9px] font-black uppercase tracking-widest text-white/50">Daily Burn</p>
                    <div className="flex items-center gap-3">
                      <div className="h-1.5 flex-1 bg-white/20 rounded-full overflow-hidden">
                        <motion.div
                          animate={{ width: ['0%', '72%', '72%'] }}
                          transition={{ duration: 2, times: [0, 0.5, 1] }}
                          className="h-full bg-white" />
                      </div>
                      <span className="text-[10px] font-black text-white">72%</span>
                    </div>
                    <p className="text-[8px] font-bold text-white/60">Within budget threshold</p>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Intelligence Section */}
        <section id="intelligence" className="py-12 px-6 max-w-7xl mx-auto overflow-visible scroll-mt-24">
          <div id="security" className="absolute -top-24" />
          <div className="bg-slate-950 rounded-[48px] overflow-hidden flex flex-col lg:flex-row items-stretch shadow-xl border border-white/5 relative">
            <div className="p-10 lg:p-16 space-y-8 flex-1 flex flex-col justify-center">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2.5 text-red-500 font-bold uppercase text-[9px] tracking-[0.25em] bg-white/5 py-1.5 px-4 rounded-full w-fit">
                  <Cpu className="w-3.5 h-3.5" />
                  Neural Ledger Alpha
                </div>
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white leading-[1.05] font-sans">
                  Intelligence Behind <br /> your daily flow.
                </h2>
                <p className="text-slate-400 text-base font-medium leading-relaxed max-w-md font-sans opacity-80">
                  Our engine builds a predictive layer over your daily expenditures, mapping outflow categories with surgical accuracy.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-x-6 gap-y-6 pt-2">
                {[
                  { label: 'Category Donut', desc: 'Distribution view.', icon: PieChart },
                  { label: 'Cloud-Sync', desc: 'Secure database.', icon: Globe },
                  { label: 'Report Vault', icon: Download, desc: 'Institutional PDF.' },
                  { label: 'Privacy Core', icon: Lock, desc: 'Zero tracking.' }
                ].map((item, i) => (
                  <div key={i} className="space-y-2 group cursor-default">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40 group-hover:text-white group-hover:bg-[#8B5CF6] transition-all">
                      <item.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white tracking-tight">{item.label}</p>
                      <p className="text-[9px] text-white/40 font-medium">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-1 bg-white relative">
              <FinancialNodeDiagram />
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section id="features" className="py-20 px-6 max-w-7xl mx-auto relative overflow-hidden bg-slate-50/50 rounded-[64px] my-12 scroll-mt-24">
          <div id="reports" className="absolute -top-24" />
          {/* Connection Background Element */}
          <div className="absolute top-1/2 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#8B5CF6]/10 to-transparent -z-10" />
          <svg className="absolute top-1/2 left-0 w-full h-32 -translate-y-1/2 -z-10 opacity-[0.05] pointer-events-none" preserveAspectRatio="none">
            <motion.path
              d="M 0 64 Q 300 10, 600 64 T 1200 64"
              fill="transparent"
              stroke="url(#flowGradient)"
              strokeWidth="2"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            />
            <defs>
              <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0" />
                <stop offset="50%" stopColor="#D946EF" />
                <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>

          <div className="flex flex-col lg:flex-row items-center justify-between mb-10 gap-6 text-center lg:text-left relative z-10">
            <div className="space-y-3">
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-black leading-[1.1] font-sans">
                Engineered for the <span className="text-[#A855F7]">modern era.</span>
              </h2>
              <p className="text-slate-500 text-lg font-medium max-w-xl font-sans opacity-80">
                Military-grade security with consumer-grade simplicity.
              </p>
            </div>
            <Link href="/dashboard" className="group flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-[#8B5CF6] hover:text-[#D946EF] transition-colors">
              Explore All Functions <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 relative z-10">
            {[
              { title: 'The "Add Spent" Engine', desc: 'The heart of DevinBook. High-speed daily entry system with category auto-mapping.', icon: Zap },
              { title: 'Daily Burn Analysis', desc: 'Convert raw logs into branded financial summaries of your daily spending habits.', icon: Download },
              { title: 'Real-Time Expense Ledger', desc: 'A secure, cloud-synced database protecting every transaction record you log.', icon: Activity }
            ].map((item, i) => (
              <div key={i} className="group relative">
                <div className="absolute inset-0 bg-[#8B5CF6]/0 group-hover:bg-[#8B5CF6]/5 blur-3xl rounded-[40px] transition-all duration-500" />
                <div className="relative space-y-7 p-10 rounded-[40px] bg-white border border-slate-200/80 shadow-[0_15px_45px_-10px_rgba(0,0,0,0.06)] hover:shadow-[0_30px_60px_-15px_rgba(139,92,246,0.15)] group-hover:border-[#8B5CF6]/40 transition-all duration-500 h-full flex flex-col">
                  <motion.div
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 4, repeat: Infinity, delay: i * 0.4 }}
                    className="w-14 h-14 rounded-[20px] bg-slate-50 border border-slate-100 flex items-center justify-center text-[#8B5CF6] group-hover:scale-110 group-hover:bg-[#8B5CF6] group-hover:text-white transition-all duration-500 shadow-sm">
                    <item.icon className="w-6 h-6" />
                  </motion.div>
                  <div className="space-y-3">
                    <h4 className="text-xl font-bold text-black tracking-tight font-sans">{item.title}</h4>
                    <p className="text-[14px] text-slate-500 leading-relaxed font-medium font-sans opacity-95">{item.desc}</p>
                  </div>
                  <div className="pt-2 mt-auto">
                    <div className="w-8 h-1 bg-slate-100 rounded-full group-hover:w-full group-hover:bg-gradient-to-r from-[#8B5CF6] to-[#D946EF] transition-all duration-500" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Latest from the Blog */}
        <section className="py-24 px-6 bg-slate-50/50 rounded-[60px] mx-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-6">
              <div className="space-y-4 max-w-2xl">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#8B5CF6]">Financial Intelligence</span>
                <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900 leading-[1.1]">
                  Master your wealth with <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8B5CF6] to-[#D946EF]">expert insights.</span>
                </h2>
              </div>
              <Link href="/blog" className="group flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 hover:text-[#8B5CF6] transition-colors mb-2">
                Visit Blog Hub <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  slug: "master-personal-finances-devinbook",
                  title: "Master Your Personal Finances: The Modern Guide",
                  tag: "Finance Strategy",
                  img: "/blogs/finance-mastery.png"
                },
                {
                  slug: "whatsapp-ledger-reports-business",
                  title: "Why WhatsApp Ledger Reports are Changing the Game",
                  tag: "Small Business",
                  img: "/blogs/whatsapp-ledger.png"
                },
                {
                  slug: "strategic-budgeting-category-distribution",
                  title: "Strategic Budgeting: Spotting Spending Leaks",
                  tag: "Savings Expert",
                  img: "/blogs/budget-categories.png"
                }
              ].map((post, i) => (
                <Link key={post.slug} href={`/blog/${post.slug}`} className="group">
                  <div className="bg-white rounded-[32px] p-4 border border-slate-100 h-full hover:shadow-2xl hover:shadow-[#8B5CF6]/10 transition-all duration-500">
                    <div className="aspect-[16/10] rounded-[24px] overflow-hidden mb-6">
                      <img src={post.img} alt={post.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    </div>
                    <div className="space-y-3 px-2 pb-2">
                      <span className="text-[9px] font-black uppercase tracking-[0.15em] text-[#8B5CF6]">{post.tag}</span>
                      <h3 className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-[#8B5CF6] transition-colors leading-tight line-clamp-2">
                        {post.title}
                      </h3>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section aria-label="Call to Action" className="py-24 px-6 text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="space-y-10"
          >
            <h2 className="text-5xl md:text-8xl font-bold tracking-[-0.04em] text-black leading-[0.9] font-sans">
              Start free. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8B5CF6] to-[#D946EF] tracking-tight">Finish first.</span>
            </h2>
            <p className="text-slate-500 font-medium text-lg md:text-xl max-w-xl mx-auto leading-relaxed font-sans">
              Stop losing track of your operational flow. Join thousands mastering their wealth with DevinBook.
            </p>

            <div className="flex flex-col md:flex-row items-center justify-center gap-6 pt-4">
              <PremiumButton href="/dashboard" size="lg" className="h-20 px-16 text-xl" aria-label="Go to App">
                Try Now
              </PremiumButton>
              <PremiumButton href="https://devinsol.com/contact-us/?query-type=Product%20Inquiry&product=Devinbook" variant="outline" size="lg" className="h-16 px-10" aria-label="Inquire about building a similar application">
                Project Inquiry
              </PremiumButton>
            </div>
          </motion.div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-20 border-t border-slate-50 flex flex-col items-center gap-10 bg-white">
        <div className="flex items-center gap-10 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
          {['App', 'Ledger', 'Intelligence', 'Blog', 'Legal'].map(f => (
            <Link key={f} href={f === 'Blog' ? '/blog' : f === 'App' ? '/dashboard' : '#'} className="hover:text-black transition-colors font-sans">{f}</Link>
          ))}
        </div>

        <div className="flex flex-col items-center gap-4">
          <Link
            href="https://devinsol.com/contact-us/?query-type=Product%20Inquiry&product=Devinbook"
            target="_blank"
            className="group flex items-center gap-2.5 transition-all duration-300"
          >
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none">
              Designed by <span className="text-slate-600 group-hover:text-[#8B5CF6] transition-colors">Devinsol</span>
            </span>
            <div className="w-5 h-5 relative flex items-center justify-center grayscale group-hover:grayscale-0 transition-all duration-500">
              <img
                src="https://devinsol.com/wp-content/uploads/2025/07/devinsol-favicon.png"
                alt="Devinsol"
                className="w-4 h-4 object-contain"
              />
            </div>
          </Link>
          <div className="h-px w-6 bg-slate-100" />
        </div>
      </footer>
    </div>
  )
}
