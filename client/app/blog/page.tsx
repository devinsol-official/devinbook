"use client"

import React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowLeft, Clock, User, ChevronRight, Search } from "lucide-react"
import { BLOG_POSTS } from "@/lib/blog-data"
import { Button } from "@/components/ui/button"

export default function BlogPage() {
    return (
        <div className="min-h-screen bg-white">
            {/* Header/Nav */}
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 py-4">
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 group">
                        <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:text-black transition-colors" />
                        <span className="text-sm font-bold text-slate-600 group-hover:text-black transition-colors">Back to Home</span>
                    </Link>
                    <Link href="/" className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2.5">
                        <img src="/logo.svg" alt="DevinBook" className="w-8 h-8 object-contain" />
                        <span className="text-lg font-bold tracking-tight text-black">DevinBook Blog</span>
                    </Link>
                    <div className="w-24" /> {/* Spacer */}
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-6 py-20">
                <header className="max-w-3xl mb-20">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h1 className="text-5xl md:text-7xl font-bold tracking-[-0.04em] text-black leading-[0.95] mb-8">
                            Financial <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8B5CF6] to-[#D946EF]">Intelligence</span> Hub
                        </h1>
                        <p className="text-xl text-slate-500 font-medium leading-relaxed">
                            Expert insights on personal finance, business bookkeeping, and digital security to help you master your wealth.
                        </p>
                    </motion.div>
                </header>

                {/* Featured Post */}
                <section className="mb-24">
                    {BLOG_POSTS.slice(0, 1).map((post) => (
                        <Link key={post.slug} href={`/blog/${post.slug}`}>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="group relative grid lg:grid-cols-2 gap-12 items-center bg-slate-50/50 rounded-[40px] p-8 md:p-12 overflow-hidden hover:bg-slate-50 transition-colors"
                            >
                                <div className="relative aspect-[16/10] rounded-[32px] overflow-hidden shadow-2xl">
                                    <img
                                        src={post.image}
                                        alt={post.title}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                                </div>
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <span className="px-4 py-1.5 rounded-full bg-[#8B5CF6]/10 text-[#8B5CF6] text-[10px] font-black uppercase tracking-widest leading-none">
                                            Featured • {post.category}
                                        </span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{post.readTime}</span>
                                    </div>
                                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 leading-tight group-hover:text-[#8B5CF6] transition-colors line-clamp-3">
                                        {post.title}
                                    </h2>
                                    <p className="text-slate-600 text-lg leading-relaxed line-clamp-3">
                                        {post.description}
                                    </p>
                                    <div className="flex items-center gap-4 pt-4">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center border border-slate-200">
                                            <User className="w-5 h-5 text-slate-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900">{post.author}</p>
                                            <p className="text-xs font-medium text-slate-500">{post.date}</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </Link>
                    ))}
                </section>

                {/* Blog Grid */}
                <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {BLOG_POSTS.slice(1).map((post, idx) => (
                        <Link key={post.slug} href={`/blog/${post.slug}`}>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 * idx }}
                                className="group flex flex-col h-full bg-white rounded-[32px] border border-slate-100 p-5 hover:border-[#8B5CF6]/20 hover:shadow-xl hover:shadow-[#8B5CF6]/5 transition-all duration-300"
                            >
                                <div className="relative aspect-[16/10] rounded-[24px] overflow-hidden mb-6">
                                    <img
                                        src={post.image}
                                        alt={post.title}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                    <div className="absolute top-4 left-4">
                                        <span className="px-3 py-1.5 rounded-lg bg-white/90 backdrop-blur-sm shadow-sm text-[9px] font-black uppercase tracking-widest text-slate-900 border border-slate-100">
                                            {post.category}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex-1 flex flex-col px-2">
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{post.date}</span>
                                        <div className="w-1 h-1 rounded-full bg-slate-200" />
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{post.readTime}</span>
                                    </div>
                                    <h3 className="text-xl font-bold tracking-tight text-black leading-tight group-hover:text-[#8B5CF6] transition-colors mb-4 flex-1 line-clamp-3">
                                        {post.title}
                                    </h3>
                                    <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
                                                <User className="w-3 h-3 text-slate-400" />
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{post.author}</span>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#8B5CF6] group-hover:translate-x-1 transition-all" />
                                    </div>
                                </div>
                            </motion.div>
                        </Link>
                    ))}
                </section>

                {/* Newsletter / CTA */}
                <section className="mt-32 relative overflow-hidden bg-slate-900 rounded-[60px] p-12 md:p-24 text-center">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#8B5CF6]/20 to-[#D946EF]/20 opacity-50" />
                    <div className="relative z-10 max-w-2xl mx-auto space-y-8">
                        <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-white leading-tight">
                            Ready to take control?
                        </h2>
                        <p className="text-slate-400 text-lg md:text-xl font-medium">
                            Join 5,000+ users mastering their daily ledger with the most premium expense tracker on the market.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                            <Button asChild className="h-16 px-10 rounded-2xl bg-gradient-to-r from-[#8B5CF6] to-[#D946EF] border-none text-white font-bold text-lg hover:opacity-90 shadow-2xl">
                                <Link href="/dashboard">Try Now</Link>
                            </Button>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="py-20 border-t border-slate-50 flex flex-col items-center gap-10 bg-white">
                <div className="flex items-center gap-10 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                    <Link href="/" className="hover:text-black transition-colors">Home</Link>
                    <Link href="/dashboard" className="hover:text-black transition-colors">Go to App</Link>
                    <Link href="#" className="hover:text-black transition-colors">Contact</Link>
                    <Link href="#" className="hover:text-black transition-colors">Legal</Link>
                </div>
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">© 2026 DevinBook by Devinsol</p>
            </footer>
        </div>
    )
}
