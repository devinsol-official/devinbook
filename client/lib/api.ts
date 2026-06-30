class ApiClient {
  private baseURL = process.env.NEXT_PUBLIC_API_URL || "https://api-devinbook.vercel.app/api"

  private getAuthHeaders() {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
    return {
      "Content-Type": "application/json",
      ...(token && token !== "undefined" && { Authorization: `Bearer ${token}` }),
    }
  }

  private onUnauthorized: (() => void) | null = null

  setUnauthorizedHandler(handler: () => void) {
    this.onUnauthorized = handler
  }

  async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseURL}${endpoint}`

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getAuthHeaders(),
          ...options.headers,
        },
      })

      if (response.status === 401) {
        if (this.onUnauthorized) {
          this.onUnauthorized()
        }
        throw new Error("Session expired. Please login again.")
      }

      let data: any = null
      const contentType = response.headers.get("content-type")
      if (contentType && contentType.includes("application/json")) {
        data = await response.json()
      }

      if (!response.ok) {
        const errorMessage = data?.message || data?.error || response.statusText || "Unknown API Error"
        throw new Error(errorMessage)
      }

      return data
    } catch (error) {
      if (error instanceof Error) {
        // If it's a fetch error (like connection refused)
        if (error.name === "TypeError" && error.message === "Failed to fetch") {
          throw new Error("Server is not responding. Please check your connection.")
        }
        throw error
      }
      throw new Error("An unexpected error occurred")
    }
  }

  // Auth endpoints
  async generateApiKey() {
    return this.request("/auth/generate-api-key", {
      method: "POST",
    })
  }

  async getMe() {
    return this.request("/auth/me")
  }

  async updateMe(data: { name?: string, theme?: string }) {
    return this.request("/auth/me", {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async login(email: string, password: string) {
    return this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })
  }

  async register(name: string, email: string, password: string) {
    return this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    })
  }

  async forgotPassword(email: string) {
    return this.request("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    })
  }

  async resetPassword(token: string, password: string) {
    return this.request("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, password }),
    })
  }

  // Categories
  async getCategories() {
    return this.request("/categories")
  }

  async createCategory(name: string, type: "income" | "expense" = "expense", icon?: string) {
    return this.request("/categories", {
      method: "POST",
      body: JSON.stringify({ name, type, icon }),
    })
  }

  async updateCategory(id: string, name: string) {
    return this.request(`/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify({ name }),
    })
  }

  async deleteCategory(id: string) {
    return this.request(`/categories/${id}`, {
      method: "DELETE",
    })
  }

  // Items
  async getItems() {
    return this.request("/items")
  }

  async createItem(name: string, categoryId: string) {
    return this.request("/items", {
      method: "POST",
      body: JSON.stringify({ name, categoryId }),
    })
  }

  async updateItem(id: string, name: string, categoryId: string) {
    return this.request(`/items/${id}`, {
      method: "PUT",
      body: JSON.stringify({ name, categoryId }),
    })
  }

  async deleteItem(id: string) {
    return this.request(`/items/${id}`, {
      method: "DELETE",
    })
  }

  // Transactions
  async getTransactions(accountId?: string, page?: number, limit?: number) {
    const params = new URLSearchParams()
    if (accountId && accountId !== "all") params.append("accountId", accountId)
    if (page) params.append("page", page.toString())
    if (limit) params.append("limit", limit.toString())
    const query = params.toString() ? `?${params.toString()}` : ""
    return this.request(`/transactions${query}`)
  }

  async createTransaction(transaction: {
    amount: number
    type: "income" | "expense"
    categoryId: string
    accountId?: string
    itemId?: string
    description?: string
    date: string
  }) {
    return this.request("/transactions", {
      method: "POST",
      body: JSON.stringify(transaction),
    })
  }

  async updateTransaction(
    id: string,
    transaction: {
      amount: number
      type: "income" | "expense"
      categoryId: string
      accountId?: string
      itemId?: string
      description?: string
      date: string
    },
  ) {
    return this.request(`/transactions/${id}`, {
      method: "PUT",
      body: JSON.stringify(transaction),
    })
  }

  async deleteTransaction(id: string) {
    return this.request(`/transactions/${id}`, {
      method: "DELETE",
    })
  }

  // Accounts
  async getAccounts() {
    return this.request("/accounts")
  }

  async createAccount(name: string, type: string, isDefault: boolean = false, isFeatured: boolean = false) {
    return this.request("/accounts", {
      method: "POST",
      body: JSON.stringify({ name, type, isDefault, isFeatured }),
    })
  }

  async updateAccount(id: string, data: { name?: string; type?: string; isDefault?: boolean; isFeatured?: boolean }) {
    return this.request(`/accounts/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async deleteAccount(id: string) {
    return this.request(`/accounts/${id}`, {
      method: "DELETE",
    })
  }

  async markReportSent(id: string) {
    return this.request(`/accounts/${id}/mark-report-sent`, {
      method: "POST",
    })
  }

  // Stats
  async getDashboardStats() {
    return this.request("/dashboard/stats")
  }

  async getDailyStats() {
    return this.request("/dashboard/daily")
  }

  async getWeeklyStats() {
    return this.request("/dashboard/weekly")
  }

  async getMonthlyStats() {
    return this.request("/dashboard/monthly")
  }

  async getMonthWiseStats() {
    return this.request("/dashboard/month-wise")
  }

  // Admin – Subscription Management (requires x-admin-secret header)
  async adminActivateSubscription(email: string, months: number = 1, adminSecret: string) {
    return this.request("/admin/subscription/activate", {
      method: "POST",
      headers: { "x-admin-secret": adminSecret },
      body: JSON.stringify({ email, months }),
    })
  }

  async adminDeactivateSubscription(email: string, adminSecret: string) {
    return this.request("/admin/subscription/deactivate", {
      method: "POST",
      headers: { "x-admin-secret": adminSecret },
      body: JSON.stringify({ email }),
    })
  }

  async adminGetSubscriptionStatus(email: string, adminSecret: string) {
    return this.request(`/admin/subscription/status?email=${encodeURIComponent(email)}`, {
      headers: { "x-admin-secret": adminSecret },
    })
  }

  async adminListSubscriptions(adminSecret: string) {
    return this.request("/admin/subscriptions/list", {
      headers: { "x-admin-secret": adminSecret },
    })
  }

  async adminListUsers(adminSecret: string) {
    return this.request("/admin/users/list", {
      headers: { "x-admin-secret": adminSecret },
    })
  }

  async adminGetUserDetails(userId: string, adminSecret: string) {
    return this.request(`/admin/users/${userId}`, {
      headers: { "x-admin-secret": adminSecret },
    })
  }

  // Subscription (User)
  async applyCoupon(couponCode: string) {
    return this.request("/subscription/apply-coupon", {
      method: "POST",
      body: JSON.stringify({ couponCode }),
    })
  }

  // WebAuthn / Passkeys
  async getWebAuthnRegistrationOptions() {
    return this.request("/webauthn/generate-registration-options")
  }

  async verifyWebAuthnRegistration(response: any) {
    return this.request("/webauthn/verify-registration", {
      method: "POST",
      body: JSON.stringify(response),
    })
  }

  async getWebAuthnAuthenticationOptions(email?: string) {
    return this.request("/webauthn/generate-authentication-options", {
      method: "POST",
      body: JSON.stringify({ email: email || undefined }),
    })
  }

  async verifyWebAuthnAuthentication(response: any, email?: string) {
    return this.request("/webauthn/verify-authentication", {
      method: "POST",
      body: JSON.stringify({ email: email || undefined, response }),
    })
  }

  async removeWebAuthnCredentials() {
    return this.request("/webauthn/remove-credentials", {
      method: "DELETE",
    })
  }

  async getWebAuthnStatus() {
    return this.request("/webauthn/status")
  }
}

export const api = new ApiClient()
