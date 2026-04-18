/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'bebas': ['"Bebas Neue"', 'cursive'],
        'anton': ['Anton', 'sans-serif'],
        'oswald': ['Oswald', 'sans-serif'],
      },
      colors: {
        'dark-bg': '#0f172a',
        'dark-card': 'rgba(30, 41, 59, 0.7)',
        'neon-blue': '#3b82f6',
        'neon-green': '#22c55e',
        'neon-cyan': '#06b6d4',
        'neon-rose': '#f43f5e',
        'primary': '#22c55e',
        'secondary': '#f59e0b',
        gold: '#fbbf24',
        indigo: {
          50: '#f5f7ff',
          100: '#ebf0ff',
          400: '#3b82f6',
          500: '#3b82f6',
          600: '#3b82f6',
          700: '#3b82f6',
          900: '#1e1b4b',
        },
      },
      boxShadow: {
        'glow-blue': '0 0 20px rgba(59, 130, 246, 0.5)',
        'glow-green': '0 0 20px rgba(34, 197, 94, 0.5)',
        'glow-rose': '0 0 20px rgba(244, 63, 94, 0.5)',
        'glow-amber': '0 0 20px rgba(245, 158, 11, 0.5)',
        'glow-orange': '0 0 20px rgba(249, 115, 22, 0.5)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-in-bottom': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease-out forwards',
        'slide-in-bottom': 'slide-in-bottom 0.5s ease-out forwards',
        'slide-in-right': 'slide-in-right 0.5s ease-out forwards',
        'float': 'float 6s ease-in-out infinite',
      }
    },
  },
  plugins: [
    function({ addUtilities }) {
      addUtilities({
        '.animate-in': {
          'animation-fill-mode': 'both',
          'animation-duration': '0.5s',
        },
        '.fade-in': {
          'animation-name': 'fade-in',
        },
        '.slide-in-from-bottom-4': {
          'animation-name': 'slide-in-bottom',
        },
        '.slide-in-from-bottom-8': {
          'animation-name': 'slide-in-bottom',
        },
        '.slide-in-from-right-4': {
          'animation-name': 'slide-in-right',
        },
        '.slide-in-from-right-8': {
          'animation-name': 'slide-in-right',
        },
        '.zoom-in': {
           'transform': 'scale(0.95)',
           'animation-name': 'fade-in', // Simplificado para evitar conflicto
        }
      })
    }
  ],
}
