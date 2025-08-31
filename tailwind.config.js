/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: { brand: "#2563eb" },
      borderRadius: { xl: "1rem", "2xl": "1.5rem" },
      boxShadow: { glass: "0 4px 30px rgba(0,0,0,0.08)" },
    },
  },
  plugins: [],
};
