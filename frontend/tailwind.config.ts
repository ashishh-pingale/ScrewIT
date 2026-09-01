import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17202a",
        steel: "#42667a",
        safety: "#f0a202",
      },
    },
  },
  plugins: [],
};

export default config;
