function createSpacing() {
  const spacing = {}
  for (let i = 1; i <= 750; i += 1) {
    spacing[i] = `${(i * 0.01).toFixed(2)}rem`
  }
  return spacing
}

function createBorderRadius() {
  const borderRadius = {}
  for (let i = 1; i <= 20; i += 1) {
    borderRadius[i] = `${i * 0.02}rem`
  }
  return borderRadius
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
  ],
  theme: {
    fontSize: {
      '12': ['0.12em', '0.22rem'],
      '14': ['0.14rem', '0.22rem'],
      '16': ['0.16rem', '0.24rem'],
      '18': ['0.18rem', '0.24rem'],
      '20': ['0.2rem', '0.28rem'],
      '22': ['0.2rem', '0.28rem'],
      '24': ['0.24rem', '0.32rem'],
      '26': ['0.24rem', '0.32rem'],
      '28': ['0.24rem', '0.32rem'],
      '30': ['0.3rem', '0.38rem'],
      '38': ['0.38rem', '0.46rem'],
      '46': ['0.46rem', '0.54rem'],
      '56': ['0.56rem', '0.64rem'],
      '68': ['0.68rem', '0.76rem'],
    },
    // 1 = 0.01rem
    // spacing: {
    //   '0': '0px',
    //   'px': '1px',
    //   ...createSpacing(),
    // },
    extend: {
      colors: {
        primary: '#348379'
      },
      borderRadius: {
        // rounded-1 = 0.02rem
        // ...createBorderRadius(),
      },
    },
  },
  plugins: [],
}
