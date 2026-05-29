"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { api } from "../lib/api"

interface User {
  id: string
  name: string
  email: string
  plan: "free" | "pro"
  planActivatedAt: string | null
  planExpiresAt: string | null
  theme: "light" | "dark"
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  forgotPassword: (email: string) => Promise<void>
  resetPassword: (token: string, password: string) => Promise<void>
  logout: () => void
  updateUser: (user: User) => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Register global unauthorized handler
    api.setUnauthorizedHandler(() => {
      logout()
    })

    const verifySession = async () => {
      const storedToken = localStorage.getItem("token")
      const storedUser = localStorage.getItem("user")

      if (!storedToken || !storedUser ||
        storedToken === "undefined" ||
        storedUser === "undefined" ||
        storedUser === "[object Object]") {
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        setLoading(false)
        return
      }

      try {
        // First set what we have to avoid flicker if it's actually valid
        setToken(storedToken)
        setUser(JSON.parse(storedUser))

        // Then verify with server
        const userData = await api.getMe()
        setUser(userData)
        localStorage.setItem("user", JSON.stringify(userData))
        if (userData.theme) {
          localStorage.setItem("theme", userData.theme)
        }
      } catch (error) {
        console.error("Session verification failed:", error)
        logout()
      } finally {
        setLoading(false)
      }
    }

    verifySession()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const data = await api.login(email, password)

      if (data.token && data.user) {
        localStorage.setItem("token", data.token)
        localStorage.setItem("user", JSON.stringify(data.user))
        if (data.user.theme) {
          localStorage.setItem("theme", data.user.theme)
        }
        setToken(data.token)
        setUser(data.user)
      } else {
        throw new Error("Invalid response from server")
      }
    } catch (error) {
      console.error("Login Error:", error)
      throw error
    }
  }

  const register = async (name: string, email: string, password: string) => {
    try {
      const data = await api.register(name, email, password)

      if (data.token && data.user) {
        localStorage.setItem("token", data.token)
        localStorage.setItem("user", JSON.stringify(data.user))
        setToken(data.token)
        setUser(data.user)
      } else {
        throw new Error("Invalid response from server")
      }
    } catch (error) {
      console.error("Registration Error:", error)
      throw error
    }
  }

  const forgotPassword = async (email: string) => {
    try {
      await api.forgotPassword(email)
    } catch (error) {
      console.error("Forgot Password Error:", error)
      throw error
    }
  }

  const resetPassword = async (token: string, password: string) => {
    try {
      await api.resetPassword(token, password)
    } catch (error) {
      console.error("Reset Password Error:", error)
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    setToken(null)
    setUser(null)
  }

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser)
    localStorage.setItem("user", JSON.stringify(updatedUser))
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, forgotPassword, resetPassword, logout, updateUser, loading }}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
