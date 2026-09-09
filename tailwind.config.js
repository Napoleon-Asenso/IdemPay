/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--typography-font-family-sans)", "Inter", "sans-serif"],
        display: ["var(--typography-font-family-display)", "Inter", "sans-serif"],
        mono: ["var(--typography-font-family-mono)", "JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
