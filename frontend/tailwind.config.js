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
        // Light mode (original clean theme)
        'mac-bg': '#FFFFFF',
        'mac-surface': '#F5F5F7',
        'mac-surface-hover': '#E8E8ED',
        'mac-border': '#D2D2D7',
        'mac-text': '#000000',
        'mac-text-secondary': '#86868B',
      },
      fontFamily: {
        'sans': ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'mac': '0 2px 16px rgba(0, 0, 0, 0.08)',
        'mac-lg': '0 4px 32px rgba(0, 0, 0, 0.12)',
      },
      borderRadius: {
        'mac': '12px',
      },
      backdropBlur: {
        'mac': '20px',
      },
    },
  },
  plugins: [],
}
