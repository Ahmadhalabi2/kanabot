/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      colors: {
        /* Brand: Indigo — used as btn-primary, nav-active, focus rings */
        brand: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        /* Primary: alias for brand (used in BacklogPage / FilterSelect) */
        primary: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        /* Surface: dark mode layers */
        surface: {
          900: '#0f0f14',
          850: '#111118',
          800: '#13131b',
          750: '#16161f',
          700: '#1a1a27',
          600: '#22223a',
          500: '#2a2a45',
          400: '#3a3a5c',
        },
        /* Ink: alias for surface (used in BacklogPage / FilterSelect) */
        ink: {
          950: '#0a0a0f',
          900: '#0f0f14',
          850: '#121218',
          800: '#15151d',
          750: '#1a1a25',
          700: '#1e1e2d',
          600: '#252536',
          500: '#2e2e45',
          400: '#3d3d5c',
          300: '#6b6b8a',
          200: '#9494aa',
        },
      },
      boxShadow: {
        'glow-sm':     '0 0 12px 0 rgba(99,102,241,0.25)',
        'glow':        '0 0 20px 0 rgba(99,102,241,0.35)',
        'card':        '0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.04)',
        'btn-primary': '0 1px 3px 0 rgba(99,102,241,0.3)',
      },
    },
  },
  plugins: [],
};
