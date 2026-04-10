/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts,scss}"
  ],
  theme: {
    extend: {
      colors: {
        'brand': {
          50:  '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a8a',
        },
        'source': {
          'vnexpress': '#009BE2',
          'tuoitre':   '#E81C23',
          'thanhnien': '#003882',
          'dantri':    '#E42127',
          'kenh14':    '#FF5500',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif'],
        heading: ['Playfair Display', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false, // disabled to avoid conflict with PrimeNG
  }
};
