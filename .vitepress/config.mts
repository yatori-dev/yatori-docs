import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  lang: 'zh-CN',
  title: 'Yatori-Docs',
  description: 'Yatori 系列使用文档与开发文档',
  base: '/yatori-docs/',
  head: [
    ['link', { rel: 'icon', href: '/yatori-docs/img/logo.png' }]
  ],
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: '首页', link: '/' },
      { text: '控制台', link: '/yatori-go-console/docs' },
      {
        text: 'Core V3',
        activeMatch: '/yatori-go-core/',
        items: [
          { text: '使用教程', link: '/yatori-go-core/docs' },
          { text: '开发手册', link: '/yatori-go-core/dev/' }
        ]
      },
      {
        text: '其他',
        items: [
          { text: 'Yatori-go-quesbank Docs', link: '/yatori-go-quesbank/docs' },
          { text: '题库对接文档', link: '/bank-interface-api/docs' }
        ]
      }
    ],
    sidebar: {
      '/yatori-go-core/': [
        {
          text: '开始使用',
          items: [
            { text: '教程目录', link: '/yatori-go-core/v3/' },
            { text: 'V3 总览', link: '/yatori-go-core/docs' },
            { text: '快速开始', link: '/yatori-go-core/v3/getting-started' }
          ]
        },
        {
          text: '核心概念',
          items: [
            { text: 'Client API', link: '/yatori-go-core/v3/client-api' },
            { text: '数据模型', link: '/yatori-go-core/v3/models' },
            { text: '能力与错误', link: '/yatori-go-core/v3/capabilities' },
            { text: '会话与持久化', link: '/yatori-go-core/v3/session' }
          ]
        },
        {
          text: '平台',
          items: [
            { text: '平台说明', link: '/yatori-go-core/v3/platforms' }
          ]
        },
        {
          text: '进阶',
          items: [
            { text: 'AI 与题库', link: '/yatori-go-core/v3/ai-and-question-bank' },
            { text: '动态调用', link: '/yatori-go-core/v3/dynamic-call' },
            { text: '完整示例', link: '/yatori-go-core/v3/examples' },
            { text: 'V2 迁移 V3', link: '/yatori-go-core/v3/migration-v2-to-v3' },
            { text: '常见问题', link: '/yatori-go-core/v3/faq' }
          ]
        },
        {
          text: '开发手册',
          items: [
            { text: '开发手册总览', link: '/yatori-go-core/dev/' },
            { text: '架构与分层', link: '/yatori-go-core/dev/architecture' },
            { text: '新增平台教程', link: '/yatori-go-core/dev/new-platform' },
            { text: 'Adapter API 规范', link: '/yatori-go-core/dev/adapter-api' },
            { text: '数据映射规范', link: '/yatori-go-core/dev/data-mapping' },
            { text: '错误与能力位', link: '/yatori-go-core/dev/errors-and-capabilities' },
            { text: '测试与验收', link: '/yatori-go-core/dev/testing' },
            { text: '代码风格与 PR', link: '/yatori-go-core/dev/style-and-pr' },
            { text: '开发常见坑', link: '/yatori-go-core/dev/faq' }
          ]
        }
      ]
      // 控制台文档侧边栏暂不启用，保留原有单页入口
      // '/yatori-go-console/': []
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/yatori-dev' }
    ],
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2022-present ChangBaiQi'
    }
  }
})
