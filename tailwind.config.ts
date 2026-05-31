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
        navy: {
          DEFAULT: '#0D1F6E',
          50:  '#EEF1FC',
          100: '#C7D0E8',
          600: '#0A1A5C',
          700: '#07124A',
        },
        royal: {
          DEFAULT: '#2B5CE6',
          50:  '#EEF3FF',
          100: '#DDEAFF',
          600: '#1D48CC',
        },
        success: {
          bg:     '#D1FAE5',
          text:   '#059669',
          border: '#A7F3D0',
        },
        warning: {
          bg:     '#FEF3C7',
          text:   '#B45309',
          border: '#FDE68A',
        },
        danger: {
          bg:     '#FEE2E2',
          text:   '#DC2626',
          border: '#FECACA',
        },
        surface: {
          page:   '#F0F2F7',
          card:   '#FFFFFF',
          subtle: '#F8F9FC',
          border: '#E2E6EF',
          muted:  '#E8ECF4',
        },
      },
    },
  },
  plugins: [],
}

export default config