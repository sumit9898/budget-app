import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './pages/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Use RGB CSS variables so Tailwind's `/opacity` modifiers work
        bg: 'rgb(var(--bg) / <alpha-value>)',
        fg: 'rgb(var(--fg) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        card: 'rgb(var(--card) / <alpha-value>)',
        border: 'rgb(var(--border) / <alpha-value>)',
        brand: {
          DEFAULT: '#007aff',
          dark: '#0a84ff',
        },
        danger: '#ff3b30',
        success: '#34c759',
        warning: '#ffcc00',
      },
      boxShadow: {
        soft: '0 4px 20px rgba(0,0,0,0.05)',
      },
      borderRadius: {
        xl: '1rem',
      },
    },
  },
  plugins: [],
}

export default config
