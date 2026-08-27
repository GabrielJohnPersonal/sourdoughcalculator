/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#efe8db',
        card: '#fffdf7',
        linen: '#f7efe0',
        oat: '#fbf7ee',
        ink: '#33302a',
        muted: '#8a7d68',
        faint: '#a89a80',
        disabled: '#b0a48c',
        onDark: '#fbf2e9',
        terracotta: '#b45c3f',
        olive: '#6f7048',
        warning: '#c98a3c',
        danger: '#a2472c',
        'border-card': '#e7dcc6',
        'border-field': '#e2d6bf',
        'border-leader': '#cdbfa2',
        surface: '#fff9ef',
      },
      fontFamily: {
        serif: ['Spectral', 'Georgia', 'serif'],
        sans: ['Hanken Grotesk', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['Space Mono', 'monospace'],
      },
      borderRadius: {
        card: '20px',
        field: '11px',
        btn: '16px',
        chip: '100px',
      },
      boxShadow: {
        card: '0 1px 0 rgba(255,255,255,.8) inset, 0 8px 20px -14px rgba(80,60,30,.6)',
        btnInk: '0 10px 22px -10px rgba(51,48,42,.7)',
        btnTerracotta: '0 10px 22px -10px rgba(180,92,63,.8)',
      },
    },
  },
  plugins: [],
};
