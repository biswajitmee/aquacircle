import type { Config } from "tailwindcss";
export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        teal: "#123F3B",
        ink: "#073B43",
        aqua: "#42D5CF",
        mist: "#DCEFE9",
        paper: "#F6F7F2",
        gold: "#A78452",
      },
      fontFamily: { sans: ["var(--font-manrope)", "sans-serif"] },
    },
  },
  plugins: [],
} satisfies Config;
