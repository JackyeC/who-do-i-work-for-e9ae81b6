import { useRef, useEffect, useCallback, useState } from "react";

const SITE_KEY = "0x4AAAAAACwUKaSXORtxl_tu";
const DOMAIN_NOT_AUTHORIZED = "110200";
const TOKEN_TIMEOUT_MS = 5000;

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string | undefined;
      execute: (widgetId: string) => void;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

export function useTurnstile() {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const tokenRef = useRef<string | null>(null);
  const resolveRef = useRef<((token: string) => void) | null>(null);
  const disabledRef = useRef(false);
  const isMountedRef = useRef(true);
  const [isAvailable, setIsAvailable] = useState(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {}
        widgetIdRef.current = null;
      }
    };
  }, []);

  const handleError = useCallback((code?: string) => {
    if (code === DOMAIN_NOT_AUTHORIZED) {
      disabledRef.current = true;
      if (isMountedRef.current) setIsAvailable(false);
      console.warn("[Turnstile] Domain is not authorized for the current site key.");
    }
    resolveRef.current?.("");
    resolveRef.current = null;
  }, []);

  const ensureWidget = useCallback(async (): Promise<boolean> => {
    if (disabledRef.current || widgetIdRef.current) return !!widgetIdRef.current;
    if (typeof window === "undefined" || !containerRef.current) return false;

    const mount = () => {
      if (!containerRef.current || !window.turnstile || widgetIdRef.current || disabledRef.current) return false;
      const result = window.turnstile.render(containerRef.current, {
        sitekey: SITE_KEY,
        size: "invisible",
        callback: (token: string) => {
          tokenRef.current = token;
          resolveRef.current?.(token);
          resolveRef.current = null;
        },
        "error-callback": (code?: string) => handleError(code),
      });
      // Guard: render may return undefined/null in some edge cases
      if (typeof result === "string" && result) {
        widgetIdRef.current = result;
        return true;
      }
      return false;
    };

    if (window.turnstile) return mount();

    return await new Promise<boolean>((resolve) => {
      let attempts = 0;
      const interval = window.setInterval(() => {
        attempts += 1;
        if (window.turnstile) {
          clearInterval(interval);
          resolve(mount());
          return;
        }
        if (attempts >= 25) {
          clearInterval(interval);
          resolve(false);
        }
      }, 200);
    });
  }, [handleError]);

  const getToken = useCallback(async (): Promise<string> => {
    if (tokenRef.current) return tokenRef.current;

    const mounted = await ensureWidget();
    if (!mounted || disabledRef.current || !widgetIdRef.current || !window.turnstile) {
      return "";
    }

    // Guard: ensure execute is actually a function
    if (typeof window.turnstile.execute !== "function") {
      console.warn("[Turnstile] execute is not a function, skipping verification");
      return "";
    }

    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        console.warn("[Turnstile] Token request timed out");
        resolveRef.current = null;
        resolve("");
      }, TOKEN_TIMEOUT_MS);

      resolveRef.current = (token: string) => {
        clearTimeout(timer);
        resolve(token);
      };

      try {
        window.turnstile?.execute(widgetIdRef.current!);
      } catch (err) {
        clearTimeout(timer);
        console.warn("[Turnstile] execute threw:", err);
        resolveRef.current = null;
        resolve("");
      }
    });
  }, [ensureWidget]);

  const resetToken = useCallback(() => {
    tokenRef.current = null;
    if (disabledRef.current) return;
    if (widgetIdRef.current && window.turnstile) {
      try {
        window.turnstile.reset(widgetIdRef.current);
      } catch {}
    }
  }, []);

  return { containerRef, getToken, resetToken, isAvailable };
}
