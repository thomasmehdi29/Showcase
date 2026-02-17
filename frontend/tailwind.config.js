/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#f1f6f0",
        ink: "#102a24",
        moss: "#2d6a4f",
        ember: "#d87324",
        ocean: "#2f6690",
        berry: "#8f2d56",
      },
      boxShadow: {
        soft: "0 16px 36px rgba(16, 42, 36, 0.18)",
      },
      animation: {
        rise: "rise 600ms ease-out",
      },
      keyframes: {
        rise: {
          "0%": { opacity: 0, transform: "translateY(12px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
