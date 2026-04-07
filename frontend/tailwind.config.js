/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#1a3c5e',
          light:   '#e8f0f7',
          mid:     '#2d6a9f',
        },
        accent: {
          DEFAULT: '#e67e22',
          light:   '#fdf0e0',
        },
      },
      fontFamily: {
        sans: ['Segoe UI', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '14px',
      },
      boxShadow: {
        sm: '0 1px 3px rgba(0,0,0,.08)',
        md: '0 4px 12px rgba(0,0,0,.10)',
        lg: '0 8px 28px rgba(0,0,0,.13)',
      },
    },
  },
  plugins: [],
}
