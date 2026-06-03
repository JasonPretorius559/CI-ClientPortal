/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#FAFAFA",
          100: "#F4F4F5",
          200: "#E4E4E7",
          300: "#D4D4D8",
          400: "#A1A1AA",
          500: "#71717A",
          600: "#52525B",
          700: "#3F3F46",
          800: "#27272A",
          900: "#18181B",
          950: "#0A0A0A",
        },
      },
      boxShadow: {
        soft: "0 1px 2px rgba(10, 10, 10, 0.05), 0 18px 48px rgba(10, 10, 10, 0.06)",
      },
    },
  },
  plugins: [],
};
