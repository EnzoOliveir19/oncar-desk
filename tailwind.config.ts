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
        // Fundo global (near-black, viés levemente frio — filosofia Linear/Vercel)
        canvas: "#0B0C10",
        // Chão do escritório — cores interpoladas em tempo real via SVG
        floor: {
          cold: "#14151C",
          neutral: "#181924",
          warm: "#241C15",
        },
        // Paredes do fundo (N e W)
        wall: {
          DEFAULT: "#101118",
          side: "#0A0B10",
        },
        // Mesas, cadeiras, planos elevados
        surface: {
          DEFAULT: "#262731",
          dark: "#1E1F27",
          darker: "#16171E",
        },
        // Bordas — sempre com opacity, nunca chapadas
        hairline: {
          DEFAULT: "rgba(255,255,255,0.05)",
          strong: "rgba(255,255,255,0.09)",
          bright: "rgba(255,255,255,0.14)",
        },
        // Texto — hierarquia por opacidade do branco
        text: {
          primary: "#E6E6ED",
          secondary: "#9095A3",
          muted: "#545866",
        },
        // Accent Oncar — usar cirurgicamente (CTA primário, "sua reserva", foco)
        accent: {
          DEFAULT: "#3E5EE8",
          glow: "#7A93F5",
          soft: "#B0C1FF",
        },
        // Warm accent (porta, luminária)
        warm: "#E8A05B",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      keyframes: {
        haloPulse: {
          "0%, 100%": { opacity: "0.55", transform: "scale(1)" },
          "50%": { opacity: "0.95", transform: "scale(1.10)" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideUpFade: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        haloPulse: "haloPulse 1.6s ease-in-out infinite",
        fadeIn: "fadeIn 400ms ease-out",
        slideUpFade: "slideUpFade 400ms cubic-bezier(.2,.9,.3,1)",
      },
      backdropBlur: {
        // Reforço explícito porque browsers antigos ignoram sem
        xs: "8px",
      },
    },
  },
  plugins: [],
};

export default config;
