/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Display',
          'SF Pro Text',
          'Inter',
          'system-ui',
          'sans-serif',
        ],
      },
      colors: {
        // Apple-like light surfaces
        canvas: '#f5f5f7',
        surface: '#ffffff',
        line: '#d2d2d7',
        // Neutral text scale (Apple greys)
        ink: {
          900: '#1d1d1f',
          800: '#2a2a2c',
          700: '#424245',
          600: '#535357',
          500: '#6e6e73',
          400: '#86868b',
          300: '#a1a1a6',
        },
        accent: {
          DEFAULT: '#0071e3',
          soft: '#0077ed',
          dim: '#0058b0',
        },
      },
      boxShadow: {
        // Soft layered shadows in the Apple style
        soft: '0 1px 2px rgba(0, 0, 0, 0.04)',
        card: '0 1px 2px rgba(0, 0, 0, 0.04), 0 12px 32px -18px rgba(0, 0, 0, 0.22)',
        lift: '0 2px 6px rgba(0, 0, 0, 0.06), 0 24px 48px -24px rgba(0, 0, 0, 0.28)',
        glow: '0 8px 22px -8px rgba(0, 113, 227, 0.5)',
      },
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.97)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
        'scale-in': 'scale-in 0.22s cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
}
