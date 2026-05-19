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
          { text: '批量策略（速查）', link: '/pages/core/service/batch' },
          { text: 'WriteMode 与方言', link: '/pages/core/service/write-mode' }
        ]
      }
    ]
  },
  {
    text: '条件构造器',
    items: [
      {
        text: 'where',
        link: '/pages/core/wrapper/where',
        collapsed: true,
        items: [
          { text: '基础比较（eq/ne/gt...）', link: '/pages/core/wrapper/where#basic-compare' },
          { text: '模糊匹配（like）', link: '/pages/core/wrapper/where#like' },
          { text: '空值判断（isNull）', link: '/pages/core/wrapper/where#null' },
          { text: '范围（in / between）', link: '/pages/core/wrapper/where#in-between' },
          { text: '正则匹配', link: '/pages/core/wrapper/where#regexp' },
          { text: '列与列比较', link: '/pages/core/wrapper/where#column-compare' },
          { text: '逗号分隔值搜索', link: '/pages/core/wrapper/where#contain-any' },
          { text: '永真条件', link: '/pages/core/wrapper/where#true' },
          { text: '条件开关', link: '/pages/core/wrapper/where#condition-switch' },
          { text: '与或非嵌套', link: '/pages/core/wrapper/where#and-or-not' },
          { text: '子查询', link: '/pages/core/wrapper/where#sub-query' },
          { text: '函数版 WHERE', link: '/pages/core/wrapper/where#func-where' }
        ]
      },
      {
        text: 'select',
        link: '/pages/core/wrapper/select',
        collapsed: true,
        items: [
          { text: '单字段简写', link: '/pages/core/wrapper/select#single-field' },
          { text: '字段重命名映射', link: '/pages/core/wrapper/select#rename-map' },
          { text: 'selectAll 全字段', link: '/pages/core/wrapper/select#select-all' },
          { text: 'selectAuto 多表优先级 ⚠️', link: '/pages/core/wrapper/select#select-auto' },
          { text: 'selectFunc 函数列', link: '/pages/core/wrapper/select#select-func' },
          { text: 'selectSubSql 子查询列', link: '/pages/core/wrapper/select#select-sub-sql' },
          { text: 'selectCase CASE 列', link: '/pages/core/wrapper/select#select-case' },
          { text: 'JOIN 表别名', link: '/pages/core/wrapper/select#table-alias' }
        ]
      },
      {
        text: 'join',
        link: '/pages/core/wrapper/join',
        collapsed: true,
        items: [
          { text: '四种 JOIN 类型', link: '/pages/core/wrapper/join#join-types' },
          { text: '基础关联 + DTO', link: '/pages/core/wrapper/join#basic' },
          { text: '排序 + 限制', link: '/pages/core/wrapper/join#order-limit' },
          { text: '表别名', link: '/pages/core/wrapper/join#table-alias' },
          { text: '自定义 ON 条件', link: '/pages/core/wrapper/join#custom-on' },
          { text: '子查询作为右表', link: '/pages/core/wrapper/join#sub-query-join' },
          { text: '关联取值', link: '/pages/core/wrapper/join#values' },
          { text: '关联更新', link: '/pages/core/wrapper/join#update' },
          { text: '关联分页', link: '/pages/core/wrapper/join#page' }
        ]
      },
      {
        text: 'group',
        link: '/pages/core/wrapper/group',
        collapsed: true,
        items: [
          { text: 'toMapCount 最常用', link: '/pages/core/wrapper/group#to-map-count' },
          { text: '多列分组聚合', link: '/pages/core/wrapper/group#multi-column' },
          { text: '排序 + 限制', link: '/pages/core/wrapper/group#order-limit' },
          { text: 'HAVING 子句', link: '/pages/core/wrapper/group#having' },
          { text: '按函数分组', link: '/pages/core/wrapper/group#group-by-func' },
          { text: '关联分组', link: '/pages/core/wrapper/group#join-group' },
          { text: '分组分页', link: '/pages/core/wrapper/group#page-group' }
        ]
      },
      {
        text: 'order',
        link: '/pages/core/wrapper/order',
        collapsed: true,
        items: [
          { text: '升序 / 降序', link: '/pages/core/wrapper/order#asc' },
          { text: '多字段排序', link: '/pages/core/wrapper/order#multi' },
          { text: '随机排序', link: '/pages/core/wrapper/order#random' },
          { text: '按函数排序', link: '/pages/core/wrapper/order#by-func' }
        ]
      },
      {
        text: '函数表达式',
        link: '/pages/core/wrapper/functions',
        collapsed: true,
        items: [
          { text: '聚合函数（COUNT/SUM/AVG/MAX/MIN）', link: '/pages/core/wrapper/functions#aggregate' },
          { text: 'GROUP_CONCAT', link: '/pages/core/wrapper/functions#group-concat' },
          { text: '条件计数', link: '/pages/core/wrapper/functions#count-predicate' },
          { text: '组内第一个', link: '/pages/core/wrapper/functions#group-first' },
          { text: '算术运算', link: '/pages/core/wrapper/functions#arithmetic' },
          { text: '字符串函数', link: '/pages/core/wrapper/functions#string' },
          { text: '条件函数（IF / IFNULL）', link: '/pages/core/wrapper/functions#conditional' },
          { text: '日期函数', link: '/pages/core/wrapper/functions#date' },
          { text: '数学函数', link: '/pages/core/wrapper/functions#math' },
          { text: '类型转换（CAST）', link: '/pages/core/wrapper/functions#cast' },
          { text: '位运算', link: '/pages/core/wrapper/functions#bitwise' }
        ]
      },
      {
        text: '子查询',
        link: '/pages/core/wrapper/sub-query',
        collapsed: true,
        items: [
          { text: 'WHERE IN', link: '/pages/core/wrapper/sub-query#in' },
          { text: 'WHERE NOT IN', link: '/pages/core/wrapper/sub-query#not-in' },
          { text: 'WHERE EXISTS', link: '/pages/core/wrapper/sub-query#exists' },
          { text: 'WHERE NOT EXISTS', link: '/pages/core/wrapper/sub-query#not-exists' },
          { text: 'SELECT 标量子查询', link: '/pages/core/wrapper/sub-query#scalar-select' },
          { text: 'LEFT JOIN 衍生表', link: '/pages/core/wrapper/sub-query#join-derived' }
        ]
      },
      { text: '逻辑删除', link: '/pages/core/wrapper/soft-delete' }
    ]
  },
  {
    text: 'Stream API',
    items: [
      { text: 'stream()', link: '/pages/core/stream/stream' },
      { text: 'executableStream()', link: '/pages/core/stream/executable' },
      { text: '收集器（toMap / groupingBy / toMapCount...）', link: '/pages/core/stream/collectors' }
    ]
  },
  {
    text: '多方言支持',
    items: [
      { text: 'PostgreSQL / 达梦 DM', link: '/pages/core/dialect/dialect' }
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
    ['meta', { name: 'author', content: 'kamioj' }],
    ['meta', { name: 'baidu-site-verification', content: 'codeva-UlKBtXyDpT' }]
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
