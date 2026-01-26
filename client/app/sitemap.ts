import { MetadataRoute } from "next"
import { BLOG_POSTS } from "@/lib/blog-data"

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = "https://devinbook.devinsol.com"

    // Base routes
    const routes = ["", "/blog"].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date().toISOString().split("T")[0],
        changeFrequency: "weekly" as const,
        priority: route === "" ? 1.0 : 0.8,
    }))

    // Blog post routes
    const blogRoutes = BLOG_POSTS.map((post) => ({
        url: `${baseUrl}/blog/${post.slug}`,
        lastModified: new Date(post.date).toISOString().split("T")[0],
        changeFrequency: "monthly" as const,
        priority: 0.7,
    }))

    return [...routes, ...blogRoutes]
}
