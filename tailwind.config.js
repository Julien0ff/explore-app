/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  safelist: [
    {
      pattern: /(bg|text|border)-(blue|purple|green|orange|pink|red)-(400|500|600|700)/,
      variants: ['hover', 'focus', 'group-hover'],
    },
    {
      pattern: /(bg|text|border)-(blue|purple|green|orange|pink|red)-(50|400|500)\/(10|20|30|50)/,
      variants: ['hover'],
    },
    {
      pattern: /(bg|text|border)-(blue|purple|green|orange|pink|red)-50/,
      variants: ['hover'],
    }
  ],
  plugins: [],
}
