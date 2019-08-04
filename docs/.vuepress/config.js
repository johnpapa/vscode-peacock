module.exports = {
  title: 'Peacock for Visual Studio Code',
  description: 'Coloring the World, One VS Code at a Time',
  ga: 'your-ga-id',
  markdown: {
    lineNumbers: true,
  },
  plugins: [
    // require('@vuepress/plugin-google-analytics'),
    // {
    //   ga: 'your-ga-id',
    // },
  ],
  themeConfig: {
    sidebar: 'auto',
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/' },
      { text: 'About', link: '/about/' },
      { text: '@john_papa', link: 'https://twitter.com/john_papa' },
    ],
  },
};
