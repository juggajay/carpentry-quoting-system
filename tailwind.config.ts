import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./features/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary Brand Colors
        primary: {
          DEFAULT: "#22C55E", // Vibrant green for CTAs
          hover: "#16A34A", // Darker green on hover
        },
        
        // Secondary Actions
        secondary: {
          DEFAULT: "#3B82F6", // Blue for secondary actions
          hover: "#2563EB",
        },
        
        // Semantic Colors
        success: {
          DEFAULT: "#10B981", // Emerald for success states
          light: "#34D399",
          dark: "#059669",
        },
        warning: {
          DEFAULT: "#F59E0B", // Amber for warnings
          light: "#FCD34D",
          dark: "#D97706",
        },
        error: {
          DEFAULT: "#EF4444", // Red for destructive actions
          light: "#F87171",
          dark: "#DC2626",
        },
        danger: {
          DEFAULT: "#EF4444",
          hover: "#DC2626",
        },
        
        // Background Colors
        bg: {
          primary: "#0A0A0B", // Deep charcoal black
          secondary: "#121214", // Elevated surface
          tertiary: "#1A1A1D", // Card backgrounds
          elevated: "#1F1F23", // Hover states
          overlay: "rgba(0, 0, 0, 0.8)", // Modal overlays with blur
        },
        
        // Border Colors
        border: {
          DEFAULT: "#2A2A2E", // Subtle borders
          hover: "#3A3A3F", // Interactive borders
          light: "#3A3A3F",
          focus: "#22C55E", // Focus borders using primary
        },
        
        // Text Colors
        text: {
          primary: "#FAFAFA", // High contrast white
          secondary: "#A1A1AA", // Muted gray
          tertiary: "#71717A", // Subtle text
          muted: "#71717A",
          disabled: "#52525B",
          inverse: "#0A0A0B", // For light backgrounds
        },
        
        // Status Pill Colors (20% opacity backgrounds)
        status: {
          draft: {
            bg: "rgba(113, 113, 122, 0.2)", // #71717A at 20%
            text: "#71717A",
          },
          pending: {
            bg: "rgba(245, 158, 11, 0.2)", // #F59E0B at 20%
            text: "#F59E0B",
          },
          approved: {
            bg: "rgba(34, 197, 94, 0.2)", // #22C55E at 20%
            text: "#22C55E",
          },
          rejected: {
            bg: "rgba(239, 68, 68, 0.2)", // #EF4444 at 20%
            text: "#EF4444",
          },
        },
        
        // Chart/Visualization Colors
        chart: {
          grid: "rgba(255, 255, 255, 0.06)",
          tooltip: "#1A1A1D",
        },
      },
      
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
      },
      
      fontSize: {
        // Typography Scale
        "display": ["48px", { lineHeight: "1.1", fontWeight: "700" }], // Hero sections only
        "h1": ["36px", { lineHeight: "1.2", fontWeight: "600" }], // Page titles
        "h2": ["28px", { lineHeight: "1.3", fontWeight: "600" }], // Section headers
        "h3": ["22px", { lineHeight: "1.4", fontWeight: "500" }], // Card titles
        "body-lg": ["18px", { lineHeight: "1.6", fontWeight: "400" }], // Important content
        "body": ["16px", { lineHeight: "1.6", fontWeight: "400" }], // Default text
        "body-sm": ["14px", { lineHeight: "1.5", fontWeight: "400" }], // Secondary info
        "caption": ["12px", { lineHeight: "1.4", fontWeight: "400" }], // Metadata
      },
      
      spacing: {
        // Extended spacing based on 8px unit
        "xs": "4px",
        "sm": "8px",
        "md": "16px",
        "lg": "24px",
        "xl": "32px",
        "2xl": "48px",
        "3xl": "64px",
      },
      
      borderRadius: {
        DEFAULT: "8px",
        sm: "6px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        "2xl": "24px",
      },
      
      boxShadow: {
        // Updated shadows for dark theme
        "sm": "0 1px 2px 0 rgba(0, 0, 0, 0.4)",
        "md": "0 4px 6px -1px rgba(0, 0, 0, 0.4)",
        "lg": "0 10px 15px -3px rgba(0, 0, 0, 0.4)",
        "xl": "0 20px 25px -5px rgba(0, 0, 0, 0.4)",
        "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
        "card": "0 4px 6px -1px rgba(0, 0, 0, 0.4)",
        "card-hover": "0 10px 30px rgba(0, 0, 0, 0.5)",
        "focus": "0 0 0 3px rgba(34, 197, 94, 0.1)", // Primary color glow
        "inner": "inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)",
      },
      
      // Animation Keyframes
      keyframes: {
        // Shimmer for loading states
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        // Fade In
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        // Slide Up
        "slide-up": {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        // Scale animations
        "scale-in": {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        // Spinner
        spin: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
      },
      
      // Animation Classes
      animation: {
        shimmer: "shimmer 2s linear infinite",
        "fade-in": "fade-in 0.2s ease-out",
        "slide-up": "slide-up 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        "scale-in": "scale-in 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        spin: "spin 1s linear infinite",
      },
      
      // Transition Properties
      transitionDuration: {
        "200": "200ms",
        "300": "300ms",
      },
      
      transitionTimingFunction: {
        "default": "cubic-bezier(0.4, 0, 0.2, 1)",
      },
      
      // Scale Transforms for interactions
      scale: {
        "98": "0.98", // Button press
        "101": "1.01", // Card hover
      },
      
      // Backdrop filters
      backdropBlur: {
        "xs": "2px",
        "sm": "4px",
        "md": "8px",
        "lg": "12px",
        "xl": "16px",
      },
      
      // Ring colors for focus states
      ringColor: (theme: any) => ({
        ...theme('colors'),
      }),
    },
  },
  plugins: [],
};

export default config;