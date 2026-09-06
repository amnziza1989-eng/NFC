/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        surface: {
          0: '#ffffff', // pure white background
          1: '#f8fafc', // cool light gray/blue surface
          2: '#f1f5f9', // elevated panels / table headers
          3: '#e2e8f0', // borders / light hover states
          4: '#cbd5e1', // prominent borders
        },
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#2563eb', // TapNow Primary Blue
          600: '#1d4ed8', // TapNow Deep Blue
          700: '#1e40af',
          800: '#1e3a8a',
          900: '#172554',
        },
        accent: {
          blue: '#3b82f6',
          cyan: '#0284c7',
          emerald: '#10b981',
          amber: '#f59e0b',
          rose: '#ef4444',
        }
      },
      fontFamily: {
        sans: ['Vazirmatn', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 10px 25px -5px rgba(37, 99, 235, 0.08), 0 8px 10px -6px rgba(37, 99, 235, 0.04)',
        'glow-blue': '0 0 20px -3px rgba(37, 99, 235, 0.2)',
      }
    },
  },
  plugins: [],
}
