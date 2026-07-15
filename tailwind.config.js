/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#2C0F1A',
        panel: '#37131e',
        panel2: '#3f1622',
        cream: '#EDE0C7',
        cream2: '#f6efdd',
        gold: '#C9A24B',
        goldBright: '#F2C94C',
        brownInk: '#9a5a2e',
        brownInk2: '#8a5a1e',
        correct: '#4CC15A',
        correctDark: '#1f5f2a',
        wrong: '#E24A4A',
        wrongBtn: '#D64545',
        wrongDark: '#5c1f22',
        mapDim: '#5a2b38',
        placeholder: '#6b3a45',
        shadow: '#1a0910',
      },
      fontFamily: {
        pixel: ["'Press Start 2P'", 'monospace'],
        body: ["'VT323'", 'monospace'],
      },
    },
  },
  plugins: [],
};
