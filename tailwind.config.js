/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx,css}"],
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
        brand: {
          50: "#F8F4FF",
          100: "#EFE6FF",
          200: "#DEC9FF",
          300: "#C49BFF",
          400: "#A563FF",
          500: "#8434F5",
          600: "#6D19D7",
          700: "#5712AC",
          800: "#48118B",
          900: "#3C106F",
          950: "#240642",
        },
        success: {
          50: "#EEF9F3",
          100: "#D7F0E1",
          500: "#4A8B67",
          700: "#2E5D43",
        },
        warning: {
          50: "#FFF7EA",
          100: "#FCEBD0",
          500: "#BE8A39",
          700: "#80581D",
        },
        danger: {
          50: "#FFF1F1",
          100: "#FEE0E0",
          500: "#C96A6A",
          700: "#8A4141",
        },
        surface: {
          canvas: "#F6F5F8",
          base: "#FFFFFF",
          muted: "#FAF9FC",
          sunken: "#F0EEF4",
          line: "#E6E2EB",
        },
      },
      borderRadius: {
        lg: "0.875rem",
        xl: "0.875rem",
        "2xl": "1.25rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(24, 24, 27, 0.035), 0 12px 30px rgba(36, 6, 66, 0.045)",
        panel: "0 1px 2px rgba(24, 24, 27, 0.03), 0 22px 48px rgba(36, 6, 66, 0.06)",
        float: "0 18px 54px rgba(36, 6, 66, 0.13)",
      },
    },
  },
  plugins: [],
};
