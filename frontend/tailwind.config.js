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
        // EventHub theme (applied app-wide)
        'mac-bg': '#FFFFFF',
        'mac-surface': '#F7F8FA',
        'mac-surface-hover': '#EEF0F3',
        'mac-border': '#ECECEC',
        'mac-text': '#16213E',
        'mac-text-secondary': '#556070',
        'mac-accent': '#FF7448',
        'mac-accent-hover': '#e85f38',
        // EventHub landing palette
        'eh-ink': '#16213E',
        'eh-muted': '#556070',
        'eh-orange': '#FF7448',
        'eh-orange-dark': '#e85f38',
        'eh-cyan': '#24D2D4',
        'eh-gray': '#F7F8FA',
        'eh-border': '#ECECEC',
        'eh-navy': '#16213E',
      },
      fontFamily: {
        'sans': ['Poppins', '-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'Segoe UI', 'Roboto', 'sans-serif'],
        'poppins': ['Poppins', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
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
