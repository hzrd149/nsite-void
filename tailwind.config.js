/** @type {import('tailwindcss').Config} */
export default {
  // Scope all tailwind classes to the #void element
  important: "#void",
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {},
  },
};
