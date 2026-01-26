import { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
    const baseUrl = "https://devinbook.devinsol.com"

    return {
        rules: {
            userAgent: "*",
            allow: "/",
            disallow: [
                "/dashboard/",
                "/manage/",
                "/profile/",
            ],
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    }
}
