/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
extend: {
  typography: {
    DEFAULT: {
      css: {
        // reset code/pre as you already have
        'code': {
          color: 'inherit',
          backgroundColor: 'transparent',
          padding: 0,
          borderRadius: 0,
        },
        'pre': {
          backgroundColor: 'transparent',
        },

        // Add rehype-pretty-code token styles:
        '.token.comment': { color: '#6b7280', fontStyle: 'italic' }, // gray-500
        '.token.keyword': { color: '#d946ef', fontWeight: 'bold' },  // pink-600
        '.token.function': { color: '#2563eb' },                     // blue-600
        '.token.variable': { color: '#10b981' },                     // green-500
        '.token.string': { color: '#ec4899' },                       // pink-500
        '.token.operator': { color: '#f59e0b' },                     // yellow-500
        '.token.number': { color: '#3b82f6' },                       // blue-500
        '.token.boolean': { color: '#f97316' },                      // orange-500
        '.token.class-name': { color: '#14b8a6' },                   // teal-500
        '.token.tag': { color: '#f87171' },                          // red-400
        '.token.attr-name': { color: '#fbbf24' },                    // amber-400
        // Add more tokens if you want
      }
    }
  }
},
},
  plugins: [
    require('@tailwindcss/typography'),
    function({ addUtilities }) {
      addUtilities({
        '.links-new-tab': {
          '& a[href^="http"]:not([target])': {
            target: '_blank',
            rel: 'noopener noreferrer'
          }
        }
      })
    }
  ],
}
