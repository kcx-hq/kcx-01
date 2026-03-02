/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        // === YOUR TAILWIND SPECIFIC PALETTE ===
        // 1. PRIMARY: Emerald (Savings, Success, CTAs)
        primary: {
          50: '#ecfdf5', 
          100: '#d1fae5',
          200: '#a7f3d0', 
          500: '#23a282', 
          600: '#23a282', // Main Green
          700: '#047857', 
        },
        
        // 2. SECONDARY: Deep Ocean Navy
        secondary: {
          50: '#eff6ff', 
          100: '#dbeafe',
          200: '#bfdbfe',
          600: '#2563eb', 
          800: '#1e40af', 
          900: '#1e3a8a', 
          950: '#172554', 
        },

        // 3. NEUTRALS
        dark: {
          900: '#0f172a', 
          600: '#475569', 
          200: '#e2e8f0', 
          100: '#f1f5f9', 
        },

        // === YOUR CSS VARIABLE MAPPING ===
        // This allows you to use your CSS variables via Tailwind classes
        // Example: class="bg-brand-primary" or class="text-bg-dark"
        brand: {
          primary: 'var(--brand-primary)',
          'primary-hover': 'var(--brand-primary-hover)',
          'primary-soft': 'var(--brand-primary-soft)',
          secondary: 'var(--brand-secondary)',
        },
        bg: {
          main: 'var(--bg-main)',
          surface: 'var(--bg-surface)',
          soft: 'var(--bg-soft)',
          dark: 'var(--bg-dark)',
        },
        highlight: {
          green: 'var(--highlight-green)',
          blue: 'var(--highlight-blue)',
          mint: 'var(--highlight-mint)',
          yellow: 'var(--highlight-yellow)',
        }
      },
      boxShadow: {
        'glow': '0 0 20px rgba(5, 150, 105, 0.35)', 
        'card': '0 4px 6px -1px rgba(15, 23, 42, 0.05)', 
        // Preserved from your CSS variables logic
        'sm-custom': 'var(--shadow-sm)',
        'md-custom': 'var(--shadow-md)',
      },
      borderRadius: {
        'sm-custom': 'var(--radius-sm)',
        'md-custom': 'var(--radius-md)',
        'lg-custom': 'var(--radius-lg)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'tooltip-in': 'tooltipFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'bridge-in': 'bridgeFadeIn 0.3s ease-out forwards',
      },
      keyframes: {
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'tooltipFadeIn': {
          'from': { opacity: '0', transform: 'translateX(-15px) translateY(-50%) scale(0.96)' },
          'to': { opacity: '1', transform: 'translateX(0) translateY(-50%) scale(1)' }
        },
        'bridgeFadeIn': {
          'from': { opacity: '0', width: '0' },
          'to': { opacity: '1', width: '12px' }
        }
      },
    },
  },
  plugins: [],
}
