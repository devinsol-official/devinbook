"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { initializePaddle, getPaddleInstance, Paddle } from "@paddle/paddle-js";

function getAuthHeader() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token && token !== "undefined" ? { Authorization: `Bearer ${token}` } : {};
}

interface PaddleContextType {
  paddle: Paddle | null;
  initializePaddle: (clientToken?: string) => Promise<void>;
  openCheckout: (priceId: string, userId: string) => Promise<void>;
  openBillingPortal: () => Promise<void>;
}

const PaddleContext = createContext<PaddleContextType | undefined>(undefined);

export function PaddleProvider({ children }: { children: React.ReactNode }) {
  const [paddle, setPaddle] = useState<Paddle | null>(null);

  const initializePaddleInstance = useCallback(async (clientToken?: string) => {
    if (typeof window === "undefined") return;

    try {
      const vendorId = process.env.NEXT_PUBLIC_PADDLE_VENDOR_ID;
      const environment = (process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT as "production" | "sandbox") || "sandbox";
      
      const token = clientToken || process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
      
      if (vendorId && !token) {
        await initializePaddle({
          seller: parseInt(vendorId, 10),
          environment,
          version: "v1",
        });
      } else if (token) {
        await initializePaddle({
          token,
          environment,
          version: "v1",
        });
      }
      
      const instance = getPaddleInstance();
      if (instance) {
        setPaddle(instance);
      }
    } catch (err) {
      console.error("Failed to initialize Paddle:", err);
    }
  }, []);

  useEffect(() => {
    initializePaddleInstance();
  }, [initializePaddleInstance]);

  const openCheckout = useCallback(
    async (priceId: string, userId: string) => {
      if (!paddle) return;

      try {
        const authHeader = getAuthHeader();
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (authHeader.Authorization) {
          headers.Authorization = authHeader.Authorization;
        }
        const response = await fetch("/api/paddle/create-checkout", {
          method: "POST",
          headers,
          body: JSON.stringify({ priceId, userId }),
          credentials: "include",
        });

        const data = await response.json();
        if (data.checkoutUrl) {
          paddle.Checkout.open({ 
            items: [{ priceId }],
            settings: {
              displayMode: "overlay",
              theme: "dark",
            }
          });
        }
      } catch (err) {
        console.error("Failed to open checkout:", err);
      }
    },
    [paddle]
  );

  const openBillingPortal = useCallback(async () => {
    if (!paddle) return;

    try {
      const authHeader = getAuthHeader();
      const headers: Record<string, string> = {};
      if (authHeader.Authorization) {
        headers.Authorization = authHeader.Authorization;
      }
      const response = await fetch("/api/paddle/create-portal", {
        method: "POST",
        headers,
        credentials: "include",
      });

      const data = await response.json();
      if (data.portalUrl) {
        window.location.href = data.portalUrl;
      }
    } catch (err) {
      console.error("Failed to open billing portal:", err);
    }
  }, [paddle]);

  return (
    <PaddleContext.Provider value={{ paddle, initializePaddle: initializePaddleInstance, openCheckout, openBillingPortal }}>
      {children}
    </PaddleContext.Provider>
  );
}

export function usePaddle() {
  const context = useContext(PaddleContext);
  if (!context) {
    throw new Error("usePaddle must be used within a PaddleProvider");
  }
  return context;
}