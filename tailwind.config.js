/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#fffde7',
          100: '#fff9c4',
          200: '#fff176',
          300: '#ffe740',
          400: '#FFD200',
          500: '#FFD200',
          600: '#FFB000',
          700: '#e09000',
          800: '#b87000',
          900: '#7a4a00',
          950: '#3d2500',
        },
        thunder: {
          yellow:       '#FFD200',
          'yellow-dark':'#FFB000',
          'yellow-light':'#fff9c4',
          dark:         '#0B0B0B',
          'dark-2':     '#1F1F1F',
          'dark-3':     '#3A3A3A',
          gold:         '#FFD200',
          'gold-light': '#fff9c4',
          white:        '#FFFFFF',
          silver:       '#CFCFCF',
        },
      },
      fontFamily: {
        display: ['var(--font-syne)', 'sans-serif'],
        body:    ['var(--font-dm-sans)', 'sans-serif'],
        sans:    ['var(--font-dm-sans)', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-thunder': 'linear-gradient(135deg, #0B0B0B 0%, #1F1F1F 100%)',
        'gradient-gold':    'linear-gradient(135deg, #FFD200 0%, #FFB000 100%)',
      },
      boxShadow: {
        'thunder':    '0 4px 24px 0 rgba(255,210,0,0.15)',
        'thunder-lg': '0 8px 48px 0 rgba(255,210,0,0.25)',
      },
      borderRadius: {
        'xl2': '1.25rem',
        'xl3': '1.5rem',
      },
      animation: {
        'fade-in':    'fadeIn 0.4s ease-out',
        'slide-up':   'slideUp 0.4s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn:    { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        slideUp:   { '0%': { transform: 'translateY(16px)', opacity: 0 }, '100%': { transform: 'translateY(0)', opacity: 1 } },
        slideDown: { '0%': { transform: 'translateY(-16px)', opacity: 0 }, '100%': { transform: 'translateY(0)', opacity: 1 } },
      },
    },
  },
  plugins: [],
}
