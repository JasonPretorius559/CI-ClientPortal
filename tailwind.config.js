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
          50: "#F6F6F6",
          100: "#E7E7E7",
          200: "#D1D1D1",
          300: "#B0B0B0",
          400: "#888888",
          500: "#666666",
          600: "#4D4D4D",
          700: "#333333",
          800: "#1A1A1A",
          900: "#000000",
          950: "#000000",
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
          canvas: "#F5F5F5",
          base: "#FFFFFF",
          muted: "#FAFAFA",
          sunken: "#F1F1F1",
          line: "#E5E5E5",
        },
      },
      borderRadius: {
        lg: "0.875rem",
        xl: "0.875rem",
        "2xl": "1.25rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(0, 0, 0, 0.04), 0 10px 28px rgba(0, 0, 0, 0.05)",
        panel: "0 1px 2px rgba(0, 0, 0, 0.03), 0 16px 36px rgba(0, 0, 0, 0.06)",
        float: "0 12px 40px rgba(0, 0, 0, 0.08)",
      },
    },
  },
  plugins: [],
};
