module.exports = {
  title: 'Peacock',
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
    search: true,
    searchMaxSuggestions: 10,
    sidebar: 'auto',
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/' },
      { text: 'About', link: '/about/' },
      { text: 'ChangeLog', link: '/changelog/' },
      { text: '@john_papa', link: 'https://twitter.com/john_papa' },
    ],
    logo: '/assets/peacock-icon-small.png',
    // Assumes GitHub. Can also be a full GitLab url.
    repo: 'johnpapa/vscode-peacock',
    // Customising the header label
    // Defaults to "GitHub"/"GitLab"/"Bitbucket" depending on `themeConfig.repo`
    repoLabel: 'GitHub',

    // Optional options for generating "Edit this page" link

    // if your docs are in a different repo from your main project:
    docsRepo: 'johnpapa/vscode-peacock',
    // if your docs are not at the root of the repo:
    docsDir: 'docs',
    // if your docs are in a specific branch (defaults to 'master'):
    docsBranch: 'feature/vuepress',
    // defaults to false, set to true to enable
    editLinks: true,
    // custom text for edit link. Defaults to "Edit this page"
    editLinkText: 'Help us improve this page!',
  },
};
