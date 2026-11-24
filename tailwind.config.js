/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./dist/**/*.html', './src/assets/js/**/*.js', './src/build.js'],
  theme: {
    extend: {
      colors: {
        // One accent colour (green). "signal" is kept as an alias of green so no red appears outside the logo.
        ink: { DEFAULT: '#0E1A14', 2: '#2A3530', 3: '#45514B' },
        muted: '#5F6B66',
        line: '#E7EBE9',
        tint: { DEFAULT: '#F3F8F5', 2: '#F7F9F8' },
        brand: { 50: '#E9F6EE', 100: '#D3EEDD', 200: '#A9DDBD', 300: '#6DDD99', 400: '#34B26E', 500: '#0C9A4F', 600: '#0A8443', 700: '#087A3E', 800: '#065C2F' },
        signal: { 50: '#E9F6EE', 100: '#D3EEDD', 400: '#34B26E', 500: '#0C9A4F', 600: '#0A8443', 700: '#087A3E' },
      },
      fontFamily: {
        sans: ['"Inter"', '"IBM Plex Sans Arabic"', 'system-ui', 'sans-serif'],
        head: ['"Inter"', '"IBM Plex Sans Arabic"', 'system-ui', 'sans-serif'],
        arabic: ['"IBM Plex Sans Arabic"', 'system-ui', 'sans-serif'],
      },
      maxWidth: { site: '78rem' },
      boxShadow: {
        card: '0 1px 2px rgba(14,26,20,.04), 0 12px 32px -18px rgba(14,26,20,.16)',
        soft: '0 2px 4px rgba(14,26,20,.04), 0 24px 48px -22px rgba(14,26,20,.24)',
        glow: '0 2px 4px rgba(14,26,20,.04), 0 24px 48px -22px rgba(14,26,20,.24)',
        float: '0 1px 2px rgba(14,26,20,.04), 0 12px 32px -18px rgba(14,26,20,.16)',
        brand: '0 1px 2px rgba(14,26,20,.04), 0 12px 32px -18px rgba(14,26,20,.16)',
      },
    },
  },
  plugins: [],
};
