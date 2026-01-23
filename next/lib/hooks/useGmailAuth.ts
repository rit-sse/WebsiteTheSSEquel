"use client";

import { useState, useCallback } from "react";

export interface GmailAuthState {
  needsAuth: boolean;
  returnUrl: string;
  message?: string;
}

/**
 * Hook for handling Gmail authorization flow.
 * 
 * Usage:
 * 1. When making API calls that might need Gmail auth, check the response for needsGmailAuth
 * 2. Call setNeedsGmailAuth with the return URL if auth is needed
 * 3. Render the GmailAuthModal component with the state from this hook
 */
export function useGmailAuth() {
  const [authState, setAuthState] = useState<GmailAuthState>({
    needsAuth: false,
    returnUrl: "",
    message: undefined,
  });
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Check if an API response indicates Gmail authorization is needed
   */
  const checkResponse = useCallback(async (
    response: Response,
    returnUrl?: string
  ): Promise<{ needsAuth: boolean; data?: unknown }> => {
    if (response.status === 403) {
      try {
        const data = await response.json();
        if (data.needsGmailAuth) {
          setAuthState({
            needsAuth: true,
            returnUrl: returnUrl || window.location.pathname,
            message: data.message,
          });
          return { needsAuth: true, data };
        }
      } catch {
        // Not JSON or doesn't have needsGmailAuth
      }
    }
    return { needsAuth: false };
  }, []);

  /**
   * Manually trigger the Gmail auth state (useful when you've already parsed the response)
   */
  const setNeedsGmailAuth = useCallback((
    returnUrl: string,
    message?: string
  ) => {
    setAuthState({
      needsAuth: true,
      returnUrl,
      message,
    });
  }, []);

  /**
   * Clear the Gmail auth state
   */
  const clearAuthState = useCallback(() => {
    setAuthState({
      needsAuth: false,
      returnUrl: "",
      message: undefined,
    });
  }, []);

  /**
   * Initiate the Gmail authorization flow
   */
  const startGmailAuth = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/auth/gmail-scope?returnUrl=${encodeURIComponent(authState.returnUrl)}`
      );
      
      if (response.ok) {
        const { authUrl } = await response.json();
        // Redirect to Google OAuth
        window.location.href = authUrl;
      } else {
        const error = await response.json();
        console.error("Failed to get Gmail auth URL:", error);
        throw new Error(error.error || "Failed to get authorization URL");
      }
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  }, [authState.returnUrl]);

  return {
    needsAuth: authState.needsAuth,
    returnUrl: authState.returnUrl,
    message: authState.message,
    isLoading,
    checkResponse,
    setNeedsGmailAuth,
    clearAuthState,
    startGmailAuth,
  };
}
