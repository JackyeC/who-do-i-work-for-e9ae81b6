import { useRef, useEffect, useCallback } from "react";

const SITE_KEY = "0x4AAAAAACwUKaSXORtxl_tu";

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string;
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

  useEffect(() => {
    const mount = () => {
      if (!containerRef.current || !window.turnstile || widgetIdRef.current) return;
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: SITE_KEY,
        size: "invisible",
        callback: (token: string) => {
          tokenRef.current = token;
          resolveRef.current?.(token);
          resolveRef.current = null;
        },
        "error-callback": () => {
          resolveRef.current?.("");
          resolveRef.current = null;
        },
      });
    };

    if (window.turnstile) {
      mount();
    } else {
      const interval = setInterval(() => {
        if (window.turnstile) {
          clearInterval(interval);
          mount();
        }
      }, 200);
      return () => clearInterval(interval);
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try { window.turnstile.remove(widgetIdRef.current); } catch {}
        widgetIdRef.current = null;
      }
    };
  }, []);

  const getToken = useCallback((): Promise<string> => {
    return new Promise((resolve) => {
      if (tokenRef.current) {
        resolve(tokenRef.current);
        return;
      }
      resolveRef.current = resolve;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.execute(widgetIdRef.current);
      } else {
        resolve("");
      }
    });
  }, []);

  const resetToken = useCallback(() => {
    tokenRef.current = null;
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
    }
  }, []);

  return { containerRef, getToken, resetToken };
}
