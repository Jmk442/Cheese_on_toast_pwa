/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Unbounded", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "monospace"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        surface: "#18181B",
        ink: "#09090B",
        brand: {
          primary: "#FACC15",
          danger: "#EF4444",
          toxic: "#84CC16",
          perfect: "#3B82F6",
        },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
      boxShadow: {
        brut: "6px 6px 0px #FACC15",
        "brut-sm": "3px 3px 0px #FACC15",
        "brut-white": "6px 6px 0px #FAFAFA",
        "brut-danger": "6px 6px 0px #EF4444",
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
        "shake-hard": {
          "0%,100%": { transform: "translate(0,0) rotate(0deg)" },
          "20%": { transform: "translate(-3px,2px) rotate(-1deg)" },
          "40%": { transform: "translate(3px,-2px) rotate(1deg)" },
          "60%": { transform: "translate(-2px,-3px) rotate(-1deg)" },
          "80%": { transform: "translate(2px,3px) rotate(1deg)" },
        },
        "scan-line": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        "blink": {
          "0%,100%": { opacity: "1" },
          "50%": { opacity: "0.25" },
        },
        "rise": {
          "0%": { transform: "translateY(40px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "pop-out": {
          "0%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-25%)" },
          "100%": { transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "shake-hard": "shake-hard 0.4s infinite",
        "scan-line": "scan-line 2.5s linear infinite",
        "blink": "blink 0.7s infinite",
        "rise": "rise 0.6s ease-out",
        "pop-out": "pop-out 0.7s ease-in-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
