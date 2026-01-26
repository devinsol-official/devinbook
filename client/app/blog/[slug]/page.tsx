"use client"

import React, { use } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowLeft, Clock, User, Share2, Tag, ChevronRight } from "lucide-react"
import { BLOG_POSTS } from "@/lib/blog-data"
import { Button } from "@/components/ui/button"

export default function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params)
    const post = BLOG_POSTS.find((p) => p.slug === slug)

    if (!post) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
                <h1 className="text-4xl font-bold mb-4">Post not found</h1>
                <Button asChild>
                    <Link href="/blog">Back to Blog</Link>
                </Button>
            </div>
        )
    }

    // Related posts (excluding current)
    const relatedPosts = BLOG_POSTS.filter(p => p.slug !== slug).slice(0, 2)

    return (
        <div className="min-h-screen bg-white">
            {/* Dynamic SEO Tags Simulation */}
            <title>{`${post.title} | DevinBook Blog`}</title>
            <meta name="description" content={post.description} />
            <meta name="keywords" content={post.keywords.join(", ")} />

            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-200/50 py-4">
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                    <Link href="/blog" className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        <span className="text-sm font-bold">Back to Blog</span>
                    </Link>
                    <Link href="/" className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2.5">
                        <img src="/logo.svg" alt="DevinBook" className="w-7 h-7 object-contain" />
                        <span className="text-lg font-bold tracking-tight text-slate-900 hidden sm:block">DevinBook</span>
                    </Link>
                    <Button asChild variant="ghost" size="sm" className="rounded-xl font-bold text-[#8B5CF6] hover:text-[#8B5CF6] hover:bg-[#8B5CF6]/5">
                        <Link href="/dashboard">Go to App</Link>
                    </Button>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="pt-32 pb-16 px-6">
                <div className="max-w-4xl mx-auto text-center space-y-8">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center justify-center gap-4"
                    >
                        <span className="px-4 py-1.5 rounded-full bg-[#8B5CF6]/10 text-[#8B5CF6] text-[10px] font-black uppercase tracking-widest">
                            {post.category}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                            <Clock className="w-3 h-3" /> {post.readTime}
                        </span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-6xl font-black tracking-tight text-slate-900 leading-[1.1]"
                    >
                        {post.title}
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-xl text-slate-600 font-medium leading-relaxed"
                    >
                        {post.subtitle}
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex items-center justify-center gap-4 pt-4"
                    >
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                            <User className="w-6 h-6 text-slate-400" />
                        </div>
                        <div className="text-left">
                            <p className="font-bold text-slate-900 leading-none mb-1">{post.author}</p>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{post.date}</p>
                        </div>
                    </motion.div>
                </div>
            </header>

            {/* Cover Image */}
            <div className="max-w-6xl mx-auto px-6 mb-20">
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="relative aspect-[21/9] rounded-[48px] overflow-hidden shadow-2xl"
                >
                    <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </motion.div>
            </div>

            {/* Article Content */}
            <main className="max-w-4xl mx-auto px-6 relative">
                <article
                    className="
                        text-slate-700 text-lg md:text-xl leading-relaxed font-medium
                        [&_h2]:text-3xl [&_h2]:md:text-4xl [&_h2]:font-black [&_h2]:tracking-tight [&_h2]:text-slate-900 [&_h2]:mt-16 [&_h2]:mb-6
                        [&_h3]:text-xl [&_h3]:md:text-2xl [&_h3]:font-black [&_h3]:tracking-tight [&_h3]:text-slate-900 [&_h3]:mt-12 [&_h3]:mb-4
                        [&_p]:mb-8
                        [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-8 [&_ul]:space-y-3
                        [&_li]:text-slate-700
                        [&_blockquote]:border-l-4 [&_blockquote]:border-[#8B5CF6] [&_blockquote]:bg-slate-50 [&_blockquote]:p-8 [&_blockquote]:my-12 [&_blockquote]:rounded-r-3xl [&_blockquote]:italic [&_blockquote]:font-bold [&_blockquote]:text-slate-900
                        [&_strong]:text-slate-900 [&_strong]:font-black
                        pb-20
                    "
                    dangerouslySetInnerHTML={{ __html: post.content }}
                />

                {/* Tags */}
                <div className="py-12 border-t border-slate-100 flex flex-wrap gap-2">
                    {post.keywords.map(tag => (
                        <span key={tag} className="px-4 py-2 rounded-xl bg-slate-50 text-slate-600 text-[10px] font-black uppercase tracking-widest border border-slate-200">
                            #{tag.replace(/\s+/g, '')}
                        </span>
                    ))}
                </div>

                {/* Author Bio Card */}
                <div className="my-16 bg-slate-50 rounded-[40px] p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 border border-slate-100">
                    <div className="w-24 h-24 rounded-full bg-white shadow-xl flex items-center justify-center shrink-0 border-4 border-white">
                        <User className="w-12 h-12 text-slate-300" />
                    </div>
                    <div className="text-center md:text-left space-y-3">
                        <p className="text-xs font-black uppercase tracking-widest text-[#8B5CF6]">Author</p>
                        <h4 className="text-2xl font-black text-slate-900">{post.author}</h4>
                        <p className="text-slate-600 font-medium">Focused on empowering individuals and small businesses with intelligent financial tools and transparent reporting strategies through the Devinsol ecosystem.</p>
                    </div>
                </div>

                {/* Share Section */}
                <div className="py-12 border-t border-slate-100 flex flex-col items-center gap-6">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Share this wisdom</p>
                    <div className="flex gap-4">
                        <button className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-[#8B5CF6] hover:bg-white hover:shadow-xl transition-all">
                            <Share2 className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            </main>

            {/* Related Posts */}
            <section className="bg-slate-50 py-32 mt-32">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="flex items-center justify-between mb-16">
                        <h2 className="text-3xl font-black tracking-tight text-slate-900">Recommended Reading</h2>
                        <Link href="/blog" className="text-xs font-black uppercase tracking-widest text-[#8B5CF6] hover:opacity-70 transition-opacity flex items-center gap-2">
                            View All <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>

                    <div className="grid md:grid-cols-2 gap-10">
                        {relatedPosts.map(post => (
                            <Link key={post.slug} href={`/blog/${post.slug}`} className="group h-full">
                                <div className="bg-white rounded-[40px] p-4 h-full border border-slate-100 shadow-sm group-hover:shadow-2xl group-hover:shadow-[#8B5CF6]/10 transition-all duration-500">
                                    <div className="aspect-[16/9] rounded-[32px] overflow-hidden mb-6">
                                        <img src={post.image} alt={post.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                    </div>
                                    <div className="px-4 pb-4 space-y-4">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-[#8B5CF6]">{post.category}</span>
                                        <h3 className="text-2xl font-black leading-tight text-slate-900 group-hover:text-[#8B5CF6] transition-colors">{post.title}</h3>
                                        <p className="text-slate-500 font-medium line-clamp-2">{post.description}</p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Final Newsletter */}
            <section className="py-32 px-6 text-center max-w-4xl mx-auto">
                <h2 className="text-4xl md:text-6xl font-black tracking-tight text-slate-900 mb-8 leading-[1.1]">
                    Stop Tracking. <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8B5CF6] to-[#D946EF]">Start Mastering.</span>
                </h2>
                <Button asChild className="h-16 px-12 rounded-2xl bg-black text-white hover:bg-slate-900 font-black text-lg transition-all active:scale-95 shadow-2xl">
                    <Link href="/dashboard">Try Now</Link>
                </Button>
            </section>

            <footer className="py-20 border-t border-slate-100 flex flex-col items-center gap-10 bg-white">
                <div className="flex items-center gap-10 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                    <Link href="/" className="hover:text-slate-900 transition-colors">Home</Link>
                    <Link href="/blog" className="hover:text-slate-900 transition-colors">Blog Hub</Link>
                    <Link href="/dashboard" className="hover:text-slate-900 transition-colors font-sans">Go to App</Link>
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">© 2026 DevinBook by Devinsol</p>
            </footer>
        </div>
    )
}
