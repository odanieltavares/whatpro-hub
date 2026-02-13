import type { Config } from 'tailwindcss';
import tailwindcssAnimate from 'tailwindcss-animate';
import { slateDark, tealDark } from '@radix-ui/colors';

const config: Config = {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'system-ui',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
      },
      colors: {
        // Radix Colors - Slate (text & backgrounds)
        'n-slate-1': slateDark.slate1,
        'n-slate-2': slateDark.slate2,
        'n-slate-3': slateDark.slate3,
        'n-slate-6': slateDark.slate6,
        'n-slate-10': slateDark.slate10,
        'n-slate-11': slateDark.slate11,
        'n-slate-12': slateDark.slate12,
        
        // Radix Colors - Teal (brand)
        'n-teal-9': tealDark.teal9,
        'n-teal-10': tealDark.teal10,
        
        // Alpha colors for overlays
        'n-alpha-1': 'rgba(0, 0, 0, 0.05)',
        'n-alpha-3': 'rgba(0, 0, 0, 0.1)',
        
        // Brand color alias
        'n-brand': tealDark.teal9,
        
        // Border color
        'n-weak': slateDark.slate6,
        
        // Keep existing shadcn colors
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
      },
      fontSize: {
        xxs: '0.625rem', // 10px
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(0.5rem)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'card-select': {
          '0%, 100%': { transform: 'translateX(0)' },
          '50%': { transform: 'translateX(1px)' },
        },
        'loader-pulse': {
          '0%': { opacity: '0.4' },
          '50%': { opacity: '1' },
          '100%': { opacity: '0.4' },
        },
        wiggle: {
          '0%': { transform: 'translateX(0)' },
          '15%': { transform: 'translateX(0.375rem)' },
          '30%': { transform: 'translateX(-0.375rem)' },
          '45%': { transform: 'translateX(0.375rem)' },
          '60%': { transform: 'translateX(-0.375rem)' },
          '75%': { transform: 'translateX(0.375rem)' },
          '90%': { transform: 'translateX(-0.375rem)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.3s ease-out',
        'card-select': 'card-select 0.25s ease-in-out',
        'loader-pulse': 'loader-pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        wiggle: 'wiggle 0.5s ease-in-out',
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;

