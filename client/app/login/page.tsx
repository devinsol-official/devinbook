"use client"

import { AuthForm } from "@/components/AuthForm"
import { useTheme } from "next-themes"
import { useEffect } from "react"

import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"

export default function LoginPage() {
    const { setTheme } = useTheme()
    const { user, loading } = useAuth()
    const router = useRouter()
    const searchParams = useSearchParams()
    const isOauth = !!searchParams.get("client_id")

    useEffect(() => {
        // Force light theme for login page as requested
        setTheme("light")
    }, [setTheme])

    useEffect(() => {
        if (!loading && user) {
            if (isOauth) {
                // Do the oauth flow automatically
                const handleOauth = async () => {
                    try {
                        const token = localStorage.getItem('token');
                        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
                        const res = await fetch(`${apiUrl}/oauth/authorize`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Accept': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({
                                client_id: searchParams.get('client_id'),
                                redirect_uri: searchParams.get('redirect_uri'),
                                state: searchParams.get('state')
                            })
                        });
                        const data = await res.json();
                        if (data.redirect_url) {
                            window.location.href = data.redirect_url;
                        }
                    } catch (err) {
                        console.error("OAuth auto-authorize error:", err);
                    }
                }
                handleOauth();
            } else {
                router.push("/dashboard")
            }
        }
    }, [user, loading, router, isOauth, searchParams])

    if (loading) return null

    return <AuthForm isOauth={isOauth} />
}
