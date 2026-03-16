/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    fontFamily: {
      outfit: ['Outfit', 'sans-serif']
    },
    extend: {
      fontSize: {
        'theme-sm': ['14px', '20px'],
        'theme-xs': ['12px', '18px']
      },
      colors: {
        brand: {
          25: '#F0FDF4',
          50: '#DCFCE7',
          100: '#BBF7D0',
          200: '#86EFAC',
          300: '#4ADE80',
          400: '#22C55E',
          500: '#16A34A',
          600: '#15803D',
          700: '#166534',
          800: '#14532D',
          900: '#052E16',
          950: '#022C22'
        },
        gray: {
          dark: '#1A2231',
          25: '#FCFCFD',
          50: '#F9FAFB',
          100: '#F2F4F7',
          200: '#E4E7EC',
          300: '#D0D5DD',
          400: '#98A2B3',
          500: '#667085',
          600: '#475467',
          700: '#344054',
          800: '#1D2939',
          900: '#101828',
          950: '#0C111D'
        },
        success: {
          50: '#ECFDF3',
          100: '#D1FADF',
          400: '#32D583',
          500: '#12B76A',
          600: '#039855',
          700: '#027A48'
        },
        error: {
          50: '#FEF3F2',
          100: '#FEE4E2',
          400: '#F97066',
          500: '#F04438',
          600: '#D92D20',
          700: '#B42318'
        },
        warning: {
          50: '#FFFAEB',
          400: '#FDB022',
          500: '#F79009'
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
