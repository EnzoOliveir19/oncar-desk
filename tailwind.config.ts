import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas:   "#1F1F29",  // fundo fora do escritório
        floor:    "#2B2B37",  // chão do escritório
        wall:     "#333340",  // paredes (copa)
        surface:  "#3A3A48",  // mesas, cards
        border:   { DEFAULT: "#48485A", strong: "#5C5C70" },
        text:     {
          primary:   "#D8D8E0",
          secondary: "#8A8A98",
          muted:     "#6A6A78",
        },
        accent:   {
          DEFAULT: "#3E5EE8",   // royal blue
          light:   "#7A93F5",   // stroke/highlight
          bloom:   "#3E5EE8",   // glow (usa opacity via /XX)
        },
        warm:     "#F5A623",    // porta/aviso
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
