/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: "#f4f7fb",
          100: "#e7eef7",
          500: "#3b6fb6",
          600: "#2f5998",
          700: "#254778",
        },
      },
    },
  },
  plugins: [],
};
