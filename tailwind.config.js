/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./dist/**/*.html', './src/assets/js/**/*.js', './src/build.js'],
  theme: {
    extend: {
      colors: {
        // Forest #04241A · Signage Green #0FA958 · Neon #3BE477 · Signage Red #E0262F
        ink: { DEFAULT: '#0D1512', 2: '#26302C', 3: '#3A4541' },
        muted: '#66716C',
        line: '#E6EAE8',
        tint: { DEFAULT: '#F4F6F5', 2: '#F7F8F7' },
        brand: {
          50: '#EBFBF1', 100: '#D1F6DF', 200: '#A5ECC0', 300: '#6DDD99', 400: '#3BE477',
          500: '#0C9A4F', 600: '#0A8443', 700: '#086C37', 800: '#06502B',
        },
        signal: { 50: '#FFF1F1', 100: '#FFDFE0', 400: '#F2525A', 500: '#E0262F', 600: '#B5161F', 700: '#8F121A' },
      },
      fontFamily: {
        sans: ['"Inter"', '"IBM Plex Sans Arabic"', 'system-ui', 'sans-serif'],
        arabic: ['"IBM Plex Sans Arabic"', 'system-ui', 'sans-serif'],
      },
      maxWidth: { site: '82rem' },
      boxShadow: {
        soft: '0 20px 40px -15px rgba(4,36,26,.18)',
        card: '0 10px 30px -12px rgba(4,36,26,.12)',
        float: '0 20px 40px -15px rgba(4,36,26,.3)',
        brand: '0 10px 22px -12px rgba(13,21,18,.25)',
        glow: '0 2px 4px rgba(13,21,18,.04), 0 28px 56px -24px rgba(13,21,18,.22)',
      },
    },
  },
  plugins: [],
};
