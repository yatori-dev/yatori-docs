import { defaultTheme } from '@vuepress/theme-default'
import { defineUserConfig } from 'vuepress/cli'
import { viteBundler } from '@vuepress/bundler-vite'

export default defineUserConfig({
  lang: 'en-US',

  title: 'Yatori',
  // description: 'This is a new generation of course management software.',
  description: '这是一个新一代在线课程管理系统',
  base: '/yatori-docs/',
  theme: defaultTheme({
    logo: 'https://github.com/Changbaiqi/yatori/blob/main/README/images/1710254379397-modified.png?raw=true',

    navbar: ['/', '/get-started'],
  }),

  bundler: viteBundler(),
})
