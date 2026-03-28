/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    fontFamily: {
      sans: ['"DM Sans"', 'sans-serif'],
      display: ['Oxanium', 'sans-serif'],
      mono: ['"DM Mono"', 'monospace']
    },
    extend: {
      fontSize: {
        'theme-sm': ['14px', '20px'],
        'theme-xs': ['12px', '18px']
      },
      colors: {
        brand: {
          25: '#FEFEF0',
          50: '#FAFDE8',
          100: '#F0F8B0',
          200: '#DDEF6A',
          300: '#C8F04A',
          400: '#A8D63A',
          500: '#6A9A22',
          600: '#558018',
          700: '#436612',
          800: '#314C0D',
          900: '#1E3208',
          950: '#121F04'
        },
        gray: {
          25: '#f5f4ef',
          50: '#ececea',
          100: '#e4e3de',
          200: '#d5d4cf',
          300: '#b0afa8',
          400: '#9a9992',
          500: '#888882',
          600: '#5c5c57',
          700: '#1e1e22',
          800: '#18181c',
          900: '#111113',
          950: '#0a0a0b'
        },
        success: {
          50: '#ECFDF3',
          100: '#D1FADF',
          400: '#4ade80',
          500: '#16a34a',
          600: '#039855',
          700: '#027A48'
        },
        error: {
          50: '#FEF3F2',
          100: '#FEE4E2',
          400: '#ff5e5e',
          500: '#F04438',
          600: '#D92D20',
          700: '#B42318'
        },
        warning: {
          50: '#FFFAEB',
          400: '#fbbf24',
          500: '#d97706'
        },
        orange: {
          400: '#FD853A',
          500: '#FB6514'
        }
      },
      boxShadow: {
        'theme-md': '0px 4px 8px -2px rgba(16, 24, 40, 0.10), 0px 2px 4px -2px rgba(16, 24, 40, 0.06)',
        'theme-sm': '0px 1px 3px 0px rgba(16, 24, 40, 0.10), 0px 1px 2px 0px rgba(16, 24, 40, 0.06)',
        'theme-xs': '0px 1px 2px 0px rgba(16, 24, 40, 0.05)'
      },
      zIndex: {
        99999: '99999',
        9999: '9999',
        999: '999',
        99: '99'
      }
    }
  },
  plugins: [require('@tailwindcss/forms')]
}
