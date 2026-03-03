import { defineConfig } from 'vitepress'

const sidebar = [
  {
    text: '快速入门',
    items: [
      { text: '介绍', link: '/pages/quickstart/introduce' },
      { text: '快速开始', link: '/pages/quickstart/quickstart' },
      { text: '安装', link: '/pages/quickstart/install' }
    ]
  },
  {
    text: 'IMysqlServiceBase',
    items: [
      {
        text: '查询方法',
        collapsed: false,
        items: [
          { text: 'get', link: '/pages/core/service/get' },
          { text: 'list', link: '/pages/core/service/list' },
          { text: 'getValue / listValues', link: '/pages/core/service/get-value' },
          { text: 'count / exist', link: '/pages/core/service/count-exist' },
          { text: 'page', link: '/pages/core/service/page' }
        ]
      },
      {
        text: '写入方法',
        collapsed: false,
        items: [
          { text: 'save', link: '/pages/core/service/save' },
          { text: 'update', link: '/pages/core/service/update' },
          { text: 'remove', link: '/pages/core/service/remove' },
          { text: '批量策略', link: '/pages/core/service/batch' }
        ]
      }
    ]
  },
  {
    text: '条件构造器',
    items: [
      { text: 'where', link: '/pages/core/wrapper/where' },
      { text: 'select', link: '/pages/core/wrapper/select' },
      { text: 'join', link: '/pages/core/wrapper/join' },
      { text: 'group', link: '/pages/core/wrapper/group' },
      { text: 'order', link: '/pages/core/wrapper/order' },
      { text: '函数表达式', link: '/pages/core/wrapper/functions' },
      { text: '逻辑删除', link: '/pages/core/wrapper/soft-delete' }
    ]
  },
  {
    text: 'Stream API',
    items: [
      { text: 'stream()', link: '/pages/core/stream/stream' },
      { text: 'executableStream()', link: '/pages/core/stream/executable' }
    ]
  },
  {
    text: '实战案例',
    items: [
      { text: '动态条件查询', link: '/pages/examples/dynamic-query' },
      { text: '统计报表', link: '/pages/examples/statistics' },
      { text: '多表关联', link: '/pages/examples/multi-table' },
      { text: '批量操作', link: '/pages/examples/batch-ops' },
      { text: '流式处理', link: '/pages/examples/stream-processing' },
      { text: '事务与并发', link: '/pages/examples/transaction' },
      { text: '软删除实战', link: '/pages/examples/soft-delete-practice' },
      { text: '子查询', link: '/pages/examples/subquery' },
      { text: '数据导出', link: '/pages/examples/data-export' }
    ]
  },
  {
    text: '参考',
    items: [
      { text: 'DTO 设计规范', link: '/pages/reference/dto' },
      { text: '常见问题', link: '/pages/reference/faq' }
    ]
  }
]

export default defineConfig({
  title: 'MyBatis-Plus Stream',
  description: 'MyBatis-Plus 流式增强框架 —— 让数据库操作像写 Java Stream 一样优雅',
  lang: 'zh-CN',
  base: process.env.VITEPRESS_BASE || '/mybatis-plus-stream-docs/',
  sitemap: {
    hostname: 'https://mybatis-plus-stream-docs.545329844.workers.dev'
  },
  head: [
    ['link', { rel: 'icon', href: (process.env.VITEPRESS_BASE || '/mybatis-plus-stream-docs/') + 'favicon.ico' }],
    ['meta', { name: 'keywords', content: 'MyBatis-Plus,Stream,流式查询,Lambda,连表查询,MyBatis增强,Java,Spring Boot' }],
    ['meta', { name: 'author', content: 'kamioj' }]
  ],
  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '文档', link: '/pages/quickstart/introduce' },
      { text: '常见问题', link: '/pages/reference/faq' },
      { text: 'GitHub', link: 'https://github.com/kamioj/mybatis-plus-stream-boot-starter' }
    ],
    sidebar: {
      '/pages/': sidebar
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/kamioj/mybatis-plus-stream-boot-starter' }
    ],
    footer: {
      message: '基于 MIT 许可发布',
      copyright: 'Copyright © 2024-present'
    },
    search: {
      provider: 'local'
    },
    outline: {
      label: '页面导航',
      level: [2, 3]
    },
    docFooter: {
      prev: '上一页',
      next: '下一页'
    },
    lastUpdated: {
      text: '最后更新于'
    },
    returnToTopLabel: '回到顶部',
    sidebarMenuLabel: '菜单',
    darkModeSwitchLabel: '主题',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式'
  }
})
