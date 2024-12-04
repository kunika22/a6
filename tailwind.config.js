/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [`./views/**/*.ejs`], 
  daisyui: {
    themes: ['cupcake'],
  },
  plugins: [require('@tailwindcss/typography'), require('daisyui')],
}

