/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        royalMaroon: '#722F37',
        royalMaroonDark: '#4A1D24',
        champagneGold: '#D4AF37',
        champagneGoldLight: '#F3E5AB',
        slateNavy: '#1E293B',
        slateLight: '#F8FAFC',
        creamIvory: '#FFFDF9',
        emeraldSuccess: '#10B981',
        rubyDanger: '#EF4444',
      },
    },
  },
  plugins: [],
}
