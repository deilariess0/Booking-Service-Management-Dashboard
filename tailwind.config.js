/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6', 
        sidebar: '#0f172a', 
        'sidebar-hover': '#1e293b',
      }
    },
  },
  plugins: [],
}