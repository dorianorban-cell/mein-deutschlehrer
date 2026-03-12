import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        neon: "#4ade80",
        "neon-dark": "#16a34a",
        "app-bg": "#060a06",
        "card-bg": "#0d150d",
        "border-neon": "rgba(74,222,128,0.18)",
      },
    },
  },
  plugins: [],
};
export default config;
