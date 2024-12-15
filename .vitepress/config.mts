import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Yatori-Docs",
  description: "This is a yatori-docs",
  base: '/yatori-docs/',
  head: [
    ['link',{rel:'icon',href:'/img/logo.png'}]
  ],
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Yatori-go-console Docs', link: '/yatori-go-console/docs' },
      { text: 'Yatori-go-core Docs', link: '/yatori-go-core/docs' }
    ],
    sidebar: {
      '/yatori-go-console/': [
        // {
        //   text: 'Yatori-go-console',
        //   items: [
        //     {text: '关于', link: '/yatori-go-console/about'},
        //     {text: '配置文件说明', link: '/yatori-go-console/configexplain'}
        //   ]
        // }
      ]
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/yatori-dev' }
    ],
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2019-present ChangBaiQi'
    }
  }
})
