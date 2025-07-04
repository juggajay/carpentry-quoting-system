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
        // Primary Colors
        primary: {
          light: "#9333EA", // Purple
          DEFAULT: "#7C3AED", // Darker Purple
          dark: "#0A0A0B", // Primary Dark Background
        },
        // Secondary Colors
        secondary: {
          light: "#F3F4F6",
          DEFAULT: "#E5E7EB",
          dark: "#9CA3AF",
        },
        // Status Colors
        success: "#10B981",
        warning: "#F59E0B",
        error: "#EF4444",
        info: "#3B82F6",
        // Background Colors
        background: {
          primary: "#0A0A0B",
          secondary: "#0F0F0F",
          card: "#18181B",
          hover: "#27272A",
        },
        // Border Colors
        border: {
          DEFAULT: "#27272A",
          light: "#3F3F46",
        },
        // Text Colors
        text: {
          primary: "#FAFAFA",
          secondary: "#A1A1AA",
          muted: "#71717A",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1rem" }],
        sm: ["0.875rem", { lineHeight: "1.25rem" }],
        base: ["1rem", { lineHeight: "1.5rem" }],
        lg: ["1.125rem", { lineHeight: "1.75rem" }],
        xl: ["1.25rem", { lineHeight: "1.75rem" }],
        "2xl": ["1.5rem", { lineHeight: "2rem" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
        "4xl": ["2.25rem", { lineHeight: "2.5rem" }],
      },
      spacing: {
        "72": "18rem",
        "84": "21rem",
        "96": "24rem",
      },
      borderRadius: {
        DEFAULT: "0.5rem",
        sm: "0.375rem",
        lg: "0.75rem",
        xl: "1rem",
      },
      boxShadow: {
        "purple-glow": "0 0 20px rgba(147, 51, 234, 0.5)",
        "card-hover": "0 10px 30px rgba(0, 0, 0, 0.5)",
      },
      // Animation Keyframes
      keyframes: {
        // Fade In
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        // Slide Up
        "slide-up": {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        // Pulse
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        // Gradient Shift
        "gradient-shift": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        // Scale In
        "scale-in": {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        // Spinner
        spin: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        // Sidebar Expand
        "sidebar-expand": {
          "0%": { width: "4rem" },
          "100%": { width: "16rem" },
        },
        // Sidebar Collapse
        "sidebar-collapse": {
          "0%": { width: "16rem" },
          "100%": { width: "4rem" },
        },
      },
      // Animation Classes
      animation: {
        "fade-in": "fade-in 0.3s ease-out",
        "slide-up": "slide-up 0.3s ease-out",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "gradient-shift": "gradient-shift 3s ease infinite",
        "scale-in": "scale-in 0.2s ease-out",
        spin: "spin 1s linear infinite",
        "sidebar-expand": "sidebar-expand 0.3s ease-in-out",
        "sidebar-collapse": "sidebar-collapse 0.3s ease-in-out",
      },
      // Transition Properties
      transitionProperty: {
        width: "width",
        height: "height",
        spacing: "margin, padding",
      },
      // Scale Transforms
      scale: {
        "98": "0.98",
        "102": "1.02",
      },
      // Brightness Filters
      brightness: {
        "110": "1.1",
      },
    },
  },
  plugins: [],
};

export default config;