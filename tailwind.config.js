/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        abismo: "#0B1D2A",
        mare: "#14465A",
        coral: "#E07A5F",
        lanterna: "#F2CC8F",
        espuma: "#EAF4F4",
        alga: "#3D8B7A",
      },
      fontFamily: {
        narrativa: ["Spectral", "Georgia", "serif"],
        ui: ["Atkinson Hyperlegible", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
