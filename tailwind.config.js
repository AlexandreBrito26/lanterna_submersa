/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        abismo: "#0A1A1F",
        mare: "#1F3A40",
        coral: "#E07A5F",
        lanterna: "#FFBF00",
        espuma: "#F2E6D6",
        alga: "#3D8B7A",
        latao: "#A67C52",
        cobre: "#BF9B30",
        ouro: "#E0AC69",
      },
      fontFamily: {
        narrativa: ["Spectral", "Georgia", "serif"],
        ui: ["Atkinson Hyperlegible", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
