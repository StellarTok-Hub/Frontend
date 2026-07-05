import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/app/**/*.{ts,tsx}', './src/components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#7D00FF',
          light: '#A855F7',
          dark: '#4C0099',
        },
        ink: {
          950: '#0A0A0F',
          900: '#111116',
          800: '#1A1A22',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'alert-in': {
          '0%': { transform: 'translateY(16px) scale(0.95)', opacity: '0' },
          '100%': { transform: 'translateY(0) scale(1)', opacity: '1' },
        },
      },
      animation: {
        'alert-in': 'alert-in 0.25s ease-out',
      },
    },
  },
  plugins: [],
};

export default config;
