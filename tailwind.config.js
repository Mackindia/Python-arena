/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./lib/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ["var(--font-sora)", "sans-serif"],
        body: ["var(--font-nunito)", "sans-serif"],
      },
      colors: {
        ink: {
          950: "#050505",
          900: "#080808",
          800: "#111111",
          700: "#1c1c1c",
          600: "#252525",
          500: "#303030",
          400: "#464646",
          300: "#676767",
          200: "#999999",
          100: "#c8c8c8",
          50: "#efefef",
        },
        neon: {
          DEFAULT: "#00ffd0",
          400: "#00ffd0",
          500: "#00e2b8",
          600: "#00c5a1",
          dim: "rgba(0,255,208,0.1)",
        },
      },
      boxShadow: {
        neon: "0 0 24px rgba(0,255,208,0.4), 0 0 60px rgba(0,255,208,0.12)",
        "neon-sm": "0 0 12px rgba(0,255,208,0.3)",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        marquee: "marquee 26s linear infinite",
      },
    },
  },
  plugins: [],
};
