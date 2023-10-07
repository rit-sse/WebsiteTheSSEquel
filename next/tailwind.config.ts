import type { Config } from 'tailwindcss'
const defaultTheme = require('tailwindcss/defaultTheme');

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  variants: {
    extend: {
      animation: ['group-hover', 'group-focus'],
    },
  },
  theme: {
    extend: {
      transitionProperty: {
        'height': 'height',
      },
      keyframes: {
        wiggle: {
          '0%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(-3deg)' },
          '75%': { transform: 'rotate(3deg)' },
          '100%': { transform: 'rotate(0deg)' },
        },
        shake: {
          '0%': {
            transform: 'translateX(0)',
          },
          '6.5%': {
            transform: 'translateX(-6px) rotateY(-9deg)',
          },
          '18.5%': {
            transform: 'translateX(5px) rotateY(7deg)',
          },
          '31.5%': {
            transform: 'translateX(-3px) rotateY(-5deg)',
          },
          '43.5%': {
            transform: 'translateX(2px) rotateY(3deg)',
          },
          '50%': {
            transform: 'translateX(0)',
          },
        },
        heartBeat: {
          '0%': {
            transform: 'scale(1)',
          },
          '14%': {
            transform: 'scale(1.2)',
          },
          '28%': {
            transform: 'scale(1)',
          },
          '42%': {
            transform: 'scale(1.2)',
          },
          '70%': {
            transform: 'scale(1)',
          },
        },
      },
      animation: {
        wiggle: 'wiggle 1s linear infinite',
        shake: 'shake 1s ease-in-out infinite',
        heartBeat: 'heartBeat 1s ease-in-out infinite',
      },
      colors: {
        'emerald-750': '#047857',
        'slate-750': '#293548',
        'slate-850': '#172033',
        'slate-1000': '#000004',
      },
      boxShadow: {
        'radial-sm': '0 0 5px 1px rgba(0, 0, 0, 0.2)',
        'radial-md': '0 0 10px 2px rgba(0, 0, 0, 0.2)',
        'radial-lg': '0 0 15px 3px rgba(0, 0, 0, 0.2)',
        'radial-xl': '0 0 20px 5px rgba(0, 0, 0, 0.2)',
        'radial-2xl': '0 0 25px 5px rgba(0, 0, 0, 0.2)',
        'radial-3xl': '0 0 30px 5px rgba(0, 0, 0, 0.2)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'), // https://tailwindcss.com/docs/typography-plugin
    require('@tailwindcss/forms'), // https://github.com/tailwindlabs/tailwindcss-forms
    require('@tailwindcss/aspect-ratio'), // https://github.com/tailwindlabs/tailwindcss-aspect-ratio
    require('daisyui'), // tailwindcss components and theming: https://daisyui.com/
  ],
}
export default config
