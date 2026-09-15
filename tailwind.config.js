/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Near-black premium surface palette
        ink: {
          950: '#0a0a0c',
          900: '#0f0f13',
          800: '#16161c',
          700: '#1e1e26',
          600: '#2a2a35',
        },
        accent: {
          DEFAULT: '#7c6bff',
          soft: '#9d90ff',
          dim: '#5a4fd6',
        },
      },
      boxShadow: {
        glass: '0 8px 40px -12px rgba(0, 0, 0, 0.6)',
        glow: '0 0 40px -8px rgba(124, 107, 255, 0.45)',
      },
      borderRadius: {
        '2xl': '1.25rem',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.35s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
      },
    },
  },
  plugins: [],
}
