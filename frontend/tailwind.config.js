/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0B0F19',
        surface: '#111827',
        'surface-card': '#161F30',
        'surface-border': '#1F2E45',
        primary: {
          50: '#EEF2FF',
          500: '#4F46E5',
          600: '#4338CA',
          700: '#3730A3'
        },
        decision: {
          allow: '#10B981',
          'allow-bg': 'rgba(16, 185, 129, 0.12)',
          review: '#F59E0B',
          'review-bg': 'rgba(245, 158, 11, 0.12)',
          block: '#EF4444',
          'block-bg': 'rgba(239, 68, 68, 0.12)'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      }
    },
  },
  plugins: [],
}
