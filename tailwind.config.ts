import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Clinical ops — ink navy / slate, warm paper cream, muted teal accent
        brand: {
          50: "#f2f5f8",
          100: "#e3e9f0",
          200: "#c5d0de",
          300: "#97a9c0",
          400: "#6783a3",
          500: "#476487",
          600: "#2f4d6f",
          700: "#1e3a56",
          800: "#152a40",
          900: "#0e1c2c",
          950: "#08121c",
        },
        ink: {
          DEFAULT: "#0e1c2c",
          muted: "#4a5568",
          faint: "#718096",
        },
        paper: {
          DEFAULT: "#f6f1ea",
          raised: "#fffcf7",
          rule: "#e2d9ce",
        },
        accent: {
          DEFAULT: "#0f6b6b",
          soft: "#e6f2f2",
          muted: "#2a8a8a",
          deep: "#0a4f4f",
        },
        clinical: {
          ok: "#1a6b4a",
          warn: "#8a5b12",
          danger: "#9b2c2c",
          info: "#1e4a6e",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "ui-serif", "Georgia", "serif"],
        mono: ["var(--font-mono)", "ui-monospace", "Menlo", "monospace"],
      },
      boxShadow: {
        card: "0 1px 0 0 rgb(14 28 44 / 0.06)",
        soft: "0 2px 10px -3px rgb(14 28 44 / 0.08)",
      },
      borderRadius: {
        DEFAULT: "4px",
      },
      letterSpacing: {
        clinical: "0.04em",
      },
    },
  },
  plugins: [],
};
export default config;
