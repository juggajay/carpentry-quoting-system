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
        // Primary brand color
        primary: "#22C55E", // Green for CTAs
        "primary-hover": "#16A34A",
        
        // Background colors - using your exact design system
        "bg-primary": "#0A0A0B",
        "bg-secondary": "#121214", 
        "bg-tertiary": "#1A1A1D",
        "bg-hover": "#2A2A2E",
        
        // Text colors
        "text-primary": "#FAFAFA",
        "text-secondary": "#A1A1AA",
        "text-tertiary": "#71717A",
        
        // Border colors
        border: "#2A2A2E",
        "border-hover": "#3A3A3F",
        
        // Status colors
        success: "#10B981",
        warning: "#F59E0B",
        error: "#EF4444",
        info: "#3B82F6",
      },
      // Rest of your config remains the same...
    },
  },
  plugins: [],
};

export default config;