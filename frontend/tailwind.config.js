/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "var(--ink)",
        "ink-soft": "var(--ink-soft)",
        "ink-muted": "var(--ink-muted)",
        surface: "var(--surface)",
        card: "var(--card)",
        line: "var(--line)",
        brick: "var(--brick)",
        "brick-dark": "var(--brick-dark)",
        "brick-tint": "var(--brick-tint)",
        turmeric: "var(--turmeric)",
        "turmeric-tint": "var(--turmeric-tint)",
        banyan: "var(--banyan)",
        "banyan-tint": "var(--banyan-tint)",
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        body: ["IBM Plex Sans", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
