/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        wine: {
          50:  '#fdf4f5',
          100: '#fbe8ea',
          200: '#f5d0d5',
          300: '#eeaab3',
          400: '#e27686',
          500: '#d24e62',
          600: '#b83249',
          700: '#9b263c',
          800: '#812337',
          900: '#6e2134',
          950: '#3d0d18',
        },
        oak: {
          50:  '#faf7f2',
          100: '#f0e9dc',
          200: '#e1d0ba',
          300: '#cdb290',
          400: '#b88f65',
          500: '#ab7a50',
          600: '#966445',
          700: '#7d4f3a',
          800: '#674234',
          900: '#55382e',
          950: '#2e1c16',
        },
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: '72ch',
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
