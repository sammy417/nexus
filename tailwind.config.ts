import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        rise: "#F04452",
        fall: "#3182F6",
        surface: {
          DEFAULT: "#F7F8FA",
          dark: "#0D0F13",
        },
        card: {
          DEFAULT: "#FFFFFF",
          dark: "#161A20",
        },
        border: {
          DEFAULT: "#EEF0F3",
          dark: "#262B33",
        },
      },
      fontFamily: {
        sans: [
          "Pretendard Variable",
          "Pretendard",
          "-apple-system",
          "BlinkMacSystemFont",
          "system-ui",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
