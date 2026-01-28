/** @type {import('tailwindcss').Config} */
const config = {
    content: [
      "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
      "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
      extend: {
        colors: {
          primary: {
            50: "oklch(0.96 0.03 145)",
            100: "oklch(0.92 0.06 145)",
            200: "oklch(0.84 0.10 145)",
            300: "oklch(0.76 0.14 145)",
            400: "oklch(0.70 0.16 145)",
            500: "oklch(0.64 0.17 145)",
            600: "oklch(0.54 0.15 145)",
            700: "oklch(0.46 0.13 145)",
            800: "oklch(0.38 0.10 145)",
            900: "oklch(0.30 0.08 145)",
            950: "oklch(0.22 0.05 145)",
          },
          secondary: {
            50: "oklch(0.98 0.01 130)",
            100: "oklch(0.96 0.02 130)",
            200: "oklch(0.92 0.03 130)",
            300: "oklch(0.86 0.05 130)",
            400: "oklch(0.78 0.07 130)",
            500: "oklch(0.68 0.09 130)",
            600: "oklch(0.58 0.08 130)",
            700: "oklch(0.48 0.07 130)",
            800: "oklch(0.38 0.05 130)",
            900: "oklch(0.28 0.04 130)",
            950: "oklch(0.20 0.03 130)",
          },
          info: {
            50: "oklch(0.97 0.02 260)",
            100: "oklch(0.93 0.05 260)",
            200: "oklch(0.86 0.10 260)",
            300: "oklch(0.76 0.14 260)",
            400: "oklch(0.68 0.17 260)",
            500: "oklch(0.62 0.19 260)",
            600: "oklch(0.54 0.18 260)",
            700: "oklch(0.46 0.16 260)",
            800: "oklch(0.38 0.12 260)",
            900: "oklch(0.30 0.08 260)",
            950: "oklch(0.22 0.05 260)",
          },
          success: {
            50: "oklch(0.97 0.03 145)",
            100: "oklch(0.93 0.07 145)",
            200: "oklch(0.87 0.12 145)",
            300: "oklch(0.82 0.16 145)",
            400: "oklch(0.79 0.19 145)",
            500: "oklch(0.72 0.18 145)",
            600: "oklch(0.62 0.16 145)",
            700: "oklch(0.52 0.14 145)",
            800: "oklch(0.42 0.11 145)",
            900: "oklch(0.32 0.08 145)",
            950: "oklch(0.22 0.05 145)",
          },
          warning: {
            50: "oklch(0.98 0.03 85)",
            100: "oklch(0.94 0.08 85)",
            200: "oklch(0.88 0.12 85)",
            300: "oklch(0.82 0.16 85)",
            400: "oklch(0.78 0.18 80)",
            500: "oklch(0.75 0.18 70)",
            600: "oklch(0.65 0.17 65)",
            700: "oklch(0.55 0.15 60)",
            800: "oklch(0.45 0.12 55)",
            900: "oklch(0.35 0.08 50)",
            950: "oklch(0.25 0.05 50)",
          },
          error: {
            50: "oklch(0.97 0.02 25)",
            100: "oklch(0.93 0.06 25)",
            200: "oklch(0.86 0.12 25)",
            300: "oklch(0.76 0.17 27)",
            400: "oklch(0.68 0.20 27)",
            500: "oklch(0.63 0.22 27)",
            600: "oklch(0.54 0.20 27)",
            700: "oklch(0.45 0.18 27)",
            800: "oklch(0.38 0.14 27)",
            900: "oklch(0.30 0.10 27)",
            950: "oklch(0.22 0.06 27)",
          },
          // Neutral
          neutral: {
            50: "oklch(0.98 0 0)",
            100: "oklch(0.94 0 0)",
            200: "oklch(0.90 0 0)",
            300: "oklch(0.82 0 0)",
            400: "oklch(0.70 0.005 240)",
            500: "oklch(0.62 0.005 240)",
            600: "oklch(0.50 0.005 240)",
            700: "oklch(0.40 0.008 240)",
            800: "oklch(0.27 0.01 240)",
            900: "oklch(0.18 0.01 240)",
            950: "oklch(0.17 0.005 240)",
          },
          // Surface
          surface: {
            DEFAULT: "oklch(1 0 0)", // #fff
            dim: "oklch(0.98 0 0)",
            dark: "oklch(0.17 0.005 240)", // #151718
          },
        },
        fontFamily: {
          sans: ["var(--font-prompt)", "Prompt", "ui-sans-serif", "system-ui", "sans-serif"],
          mono: ["ui-monospace", "monospace"],
        },
        borderRadius: {
          sm: "0.25rem",
          md: "0.5rem",
          lg: "0.75rem",
          xl: "1rem",
          "2xl": "1.5rem",
          full: "9999px",
        },
        boxShadow: {
          sm: "0 1px 2px 0 oklch(0 0 0 / 0.05)",
          md: "0 4px 6px -1px oklch(0 0 0 / 0.1), 0 2px 4px -2px oklch(0 0 0 / 0.1)",
          lg: "0 10px 15px -3px oklch(0 0 0 / 0.1), 0 4px 6px -4px oklch(0 0 0 / 0.1)",
          xl: "0 20px 25px -5px oklch(0 0 0 / 0.1), 0 8px 10px -6px oklch(0 0 0 / 0.1)",
        },
      },
    },
    plugins: [],
  };
  
  export default config;
  
  