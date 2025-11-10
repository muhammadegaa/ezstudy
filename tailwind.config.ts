import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#F2F2F2',
        surface: '#EAE4D5',
        accent: '#B6B09F',
        text: '#000000',
      },
    },
  },
  plugins: [],
}
export default config

