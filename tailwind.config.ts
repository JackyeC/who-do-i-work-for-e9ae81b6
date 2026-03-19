import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1.5rem",
        sm: "2rem",
        lg: "2.5rem",
        xl: "3.5rem",
      },
      screens: {
        "2xl": "1200px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        civic: {
          red: "hsl(var(--civic-red))",
          yellow: "hsl(var(--civic-yellow))",
          green: "hsl(var(--civic-green))",
          blue: "hsl(var(--civic-blue))",
          navy: "hsl(var(--civic-navy))",
          slate: "hsl(var(--civic-slate))",
          surface: "hsl(var(--civic-surface))",
          gold: "hsl(var(--civic-gold))",
          "gold-muted": "hsl(var(--civic-gold-muted))",
          "gold-light": "hsl(var(--civic-gold-light))",
        },
        surface: {
          "2": "hsl(var(--surface-2))",
          elevated: "hsl(var(--surface-elevated))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      fontFamily: {
        display: ["'DM Sans'", "system-ui", "sans-serif"],
        serif: ["'DM Sans'", "system-ui", "sans-serif"],
        sans: ["'DM Sans'", "system-ui", "sans-serif"],
        mono: ["'DM Mono'", "'Courier New'", "monospace"],
      },
      fontSize: {
        "hero": ["clamp(36px, 6vw, 64px)", { lineHeight: "1.1", fontWeight: "700" }],
        "display": ["clamp(28px, 4vw, 44px)", { lineHeight: "1.15", fontWeight: "700" }],
        "heading-2": ["clamp(22px, 3vw, 32px)", { lineHeight: "1.2", fontWeight: "600" }],
        "heading-3": ["clamp(16px, 2vw, 20px)", { lineHeight: "1.3", fontWeight: "600" }],
        "body-lg": ["clamp(16px, 1.5vw, 18px)", { lineHeight: "1.75", fontWeight: "400" }],
        "body": ["clamp(14px, 1.2vw, 16px)", { lineHeight: "1.7", fontWeight: "400" }],
        "label": ["13px", { lineHeight: "1.4", fontWeight: "500" }],
        "caption": ["12px", { lineHeight: "1.5", fontWeight: "400" }],
        "eyebrow": ["11px", { lineHeight: "1.4", fontWeight: "600", letterSpacing: "0.15em" }],
        "micro": ["11px", { lineHeight: "1.4", fontWeight: "500", letterSpacing: "0.15em" }],
        "nav": ["14px", { lineHeight: "1.4", fontWeight: "500" }],
        "btn": ["14px", { lineHeight: "1.4", fontWeight: "600", letterSpacing: "0.01em" }],
        "ticker": ["13px", { lineHeight: "1.4", fontWeight: "500" }],
        "score": ["clamp(32px, 5vw, 52px)", { lineHeight: "1", fontWeight: "700" }],
      },
      borderRadius: {
        lg: "16px",
        md: "12px",
        sm: "8px",
        xl: "24px",
        "2xl": "24px",
        "3xl": "24px",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.5s cubic-bezier(0.25, 0.1, 0.25, 1)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
