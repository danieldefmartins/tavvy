import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        display: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      fontSize: {
        // MUVO Font Scale (Google Maps Readability)
        'page-title': ['var(--text-page-title)', { lineHeight: 'var(--leading-tight)', fontWeight: 'var(--font-semibold)' }],
        'place-name': ['var(--text-place-name)', { lineHeight: 'var(--leading-tight)', fontWeight: 'var(--font-semibold)' }],
        'input': ['var(--text-input)', { lineHeight: 'var(--leading-normal)', fontWeight: 'var(--font-normal)' }],
        'secondary': ['var(--text-secondary)', { lineHeight: 'var(--leading-normal)', fontWeight: 'var(--font-normal)' }],
        'chip': ['var(--text-chip)', { lineHeight: 'var(--leading-normal)', fontWeight: 'var(--font-medium)' }],
        'min': ['var(--text-min)', { lineHeight: 'var(--leading-normal)', fontWeight: 'var(--font-normal)' }],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          pressed: "hsl(var(--primary-pressed))",
          tint: "hsl(var(--primary-tint))",
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
        success: "hsl(var(--success))",
        warning: "hsl(var(--warning))",
        trust: "hsl(var(--trust))",
        // Category colors for pins/chips/badges
        category: {
          campground: "hsl(var(--cat-rv-campground))",
          resort: "hsl(var(--cat-rv-resort))",
          boondocking: "hsl(var(--cat-boondocking))",
          parking: "hsl(var(--cat-overnight-parking))",
          dump: "hsl(var(--cat-dump-station))",
          water: "hsl(var(--cat-fresh-water))",
          hookups: "hsl(var(--cat-hookups))",
          restarea: "hsl(var(--cat-rest-area))",
          scenic: "hsl(var(--cat-scenic))",
          trailhead: "hsl(var(--cat-trailhead))",
          gas: "hsl(var(--cat-gas))",
          service: "hsl(var(--cat-service))",
          groceries: "hsl(var(--cat-groceries))",
          laundry: "hsl(var(--cat-laundry))",
          wifi: "hsl(var(--cat-wifi))",
          pet: "hsl(var(--cat-pet-friendly))",
          caution: "hsl(var(--cat-caution))",
          default: "hsl(var(--cat-default))",
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
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
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
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          from: { opacity: "0", transform: "translateX(-8px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.4s ease-out forwards",
        "slide-in": "slide-in 0.3s ease-out forwards",
        "scale-in": "scale-in 0.3s ease-out forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
