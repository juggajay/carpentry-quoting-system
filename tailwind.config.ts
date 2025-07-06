import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./features/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // Primary Colors
        'deep-charcoal': '#1A1A1A',
        'pure-black': '#000000',
        'clean-white': '#FFFFFF',
        
        // Accent Colors
        'electric-magenta': '#FF1744',
        'vibrant-cyan': '#00E5FF',
        'lime-green': '#76FF03',
        'royal-blue': '#2962FF',
        
        // System Colors
        'critical-red': '#F44336',
        'warning-orange': '#FF9800',
        'success-green': '#4CAF50',
        'info-blue': '#2196F3',
        
        // Dark Mode Surfaces
        'dark-surface': '#121212',
        'dark-elevated': '#1E1E1E',
        'dark-navy': '#0A1929',
      },
      fontFamily: {
        'sans': ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        'code': ['Fira Code', 'JetBrains Mono', 'Consolas', 'monospace'],
      },
      spacing: {
        'micro': '4px',
        'xsmall': '8px',
        'small': '12px',
        'default': '16px',
        'medium': '24px',
        'large': '32px',
        'xlarge': '48px',
        'xxlarge': '64px',
      },
      borderRadius: {
        'small': '4px',
        'default': '6px',
        'medium': '8px',
        'large': '12px',
        'xlarge': '16px',
      },
      boxShadow: {
        'small': '0px 1px 2px rgba(0, 0, 0, 0.05)',
        'default': '0px 2px 4px rgba(0, 0, 0, 0.06), 0px 4px 12px rgba(0, 0, 0, 0.04)',
        'medium': '0px 4px 8px rgba(0, 0, 0, 0.08), 0px 8px 24px rgba(0, 0, 0, 0.06)',
        'large': '0px 4px 16px rgba(0, 0, 0, 0.12), 0px 8px 32px rgba(0, 0, 0, 0.08)',
        'xlarge': '0px 8px 24px rgba(0, 0, 0, 0.15), 0px 16px 48px rgba(0, 0, 0, 0.10)',
      },
      animation: {
        'spin': 'spin 1s linear infinite',
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'modalEnter': 'modalEnter 400ms cubic-bezier(0.4, 0.0, 0.2, 1)',
      },
      keyframes: {
        modalEnter: {
          from: {
            opacity: '0',
            transform: 'scale(0.95) translateY(10px)',
          },
          to: {
            opacity: '1',
            transform: 'scale(1) translateY(0)',
          },
        },
      },
    },
  },
  safelist: [
    'bg-electric-magenta',
    'bg-vibrant-cyan',
    'bg-lime-green',
    'bg-royal-blue',
    'bg-dark-elevated',
    'bg-dark-surface',
    'bg-critical-red',
    'bg-success-green',
    'bg-warning-orange',
    'bg-info-blue',
    'text-electric-magenta',
    'text-vibrant-cyan',
    'text-lime-green',
    'text-royal-blue',
    'text-critical-red',
    'text-success-green',
    'border-electric-magenta',
    'border-royal-blue',
    'border-critical-red',
    'hover:bg-electric-magenta',
    'hover:bg-royal-blue',
    'focus:ring-electric-magenta',
    'focus:ring-royal-blue',
  ],
  plugins: [],
};

export default config;