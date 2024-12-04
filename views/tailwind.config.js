module.exports = {
  content: [`./views/*.ejs`,
    "./public/**/*.html",
    './src/**/*.js',
  ], // all .ejs files
  theme: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('daisyui'),
  ],

  daisyui: {
    themes: ['cupcake'], 
  },
}
