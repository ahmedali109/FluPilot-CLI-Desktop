import { Config } from 'tailwindcss';

export default {
  content: [
    './flutter_explorer.html',
    './styles/**/*.css',
  ],
  theme: {
    extend: {
      colors: {
        'dark-bg': '#1a1b26',
        'dark-surface': '#24283b',
        'code-bg': '#1f2335',
        accent: '#7aa2f7',
      },
    },
  },
  plugins: [],
};
