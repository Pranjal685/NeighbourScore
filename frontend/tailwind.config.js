/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        'bg-page':    '#0D1117',
        'bg-card':    '#161B22',
        'bg-raised':  '#1C2330',
        'border-default': 'rgba(240,246,252,0.1)',
        'accent':     '#E6A817',
        'secondary':  '#3FB950',
        'score-green': '#3FB950',
        'score-amber': '#E6A817',
        'score-red':   '#F85149',
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        heading: ['Fraunces', 'serif'],
      }
    }
  },
  plugins: []
}
