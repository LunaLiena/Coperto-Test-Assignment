import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './features/**/*.{ts,tsx}',
    './shared/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#F6F3EE',
        ink: '#171512',
        accent: {
          DEFAULT: '#C6462F',
          hover: '#AC3A26',
          soft: '#F3DAD3',
        },
        line: '#E4DED3',
        muted: '#8A8377',
        surface: '#FFFFFF',
        success: '#3F7D52',
        successSoft: '#DCEBE0',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'sans-serif'],
      },
      boxShadow: {
        panel: '0 12px 32px -12px rgba(23, 21, 18, 0.28)',
      },
      keyframes: {
        spin: {
          to: { transform: 'rotate(360deg)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
