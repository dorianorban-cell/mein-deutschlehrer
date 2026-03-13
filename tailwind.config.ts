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
        // Warm parchment design system
        forest: "#1A3A2A",
        parchment: "#F5F0E8",
        cream: "#FFFDF7",
        gold: "#C8A96E",
        "correction-red": "#B5341C",
        "border-warm": "#E0D4BE",
        "muted-brown": "#9C8B7A",
      },
      fontFamily: {
        playfair: ["var(--font-playfair)", "Georgia", "serif"],
        "source-serif": ["var(--font-source-serif)", "Georgia", "serif"],
        jetbrains: ["var(--font-jetbrains)", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
