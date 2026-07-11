"use client";

import { useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

function getAuthHeader() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token && token !== "undefined" ? { Authorization: `Bearer ${token}` } : {};
}

function buildHeaders(includeContentType = true) {
  const authHeader = getAuthHeader();
  const headers: Record<string, string> = {};
  if (includeContentType) {
    headers["Content-Type"] = "application/json";
  }
  if (authHeader.Authorization) {
    headers.Authorization = authHeader.Authorization;
  }
  return headers;
}

export function usePaddleCheckout() {
  const { toast } = useToast();

  const openCheckout = useCallback(
    async (options: {
      priceId: string;
      onSuccess?: () => void;
      onCancel?: () => void;
    }) => {
      try {
        const response = await fetch("/api/paddle/create-checkout", {
          method: "POST",
          headers: buildHeaders(true),
          credentials: "include",
          body: JSON.stringify({ priceId: options.priceId }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to create checkout session");
        }

        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
        }
      } catch (err) {
        console.error("Paddle checkout error:", err);
        toast({
          title: "Checkout Failed",
          description: err instanceof Error ? err.message : "Unable to start checkout",
          variant: "destructive",
        });
        options.onCancel?.();
      }
    },
    [toast]
  );

  const getPaymentLink = useCallback(
    async (priceId: string): Promise<string | null> => {
      try {
        const response = await fetch("/api/paddle/create-checkout", {
          method: "POST",
          headers: buildHeaders(true),
          credentials: "include",
          body: JSON.stringify({ priceId }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to create checkout session");
        }

        return data.checkoutUrl || null;
      } catch (err) {
        console.error("Paddle payment link error:", err);
        toast({
          title: "Failed to get payment link",
          description: err instanceof Error ? err.message : "Unable to create payment link",
          variant: "destructive",
        });
        return null;
      }
    },
    [toast]
  );

  const openBillingPortal = useCallback(async () => {
    try {
      const response = await fetch("/api/paddle/create-portal", {
        method: "POST",
        headers: buildHeaders(false),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create portal session");
      }

      if (data.portalUrl) {
        window.location.href = data.portalUrl;
      }
    } catch (err) {
      console.error("Paddle portal error:", err);
      toast({
        title: "Portal Access Failed",
        description: err instanceof Error ? err.message : "Unable to open billing portal",
        variant: "destructive",
      });
    }
  }, [toast]);

  return { openCheckout, getPaymentLink, openBillingPortal, isLoading: false };
}