/**
 * Tailwind CSS 配置文件
 * 使用 ES Module 格式 - 统一现代标准
 * 
 * 参考: https://tailwindcss.com/docs/configuration
 */

import typography from '@tailwindcss/typography'

export default {
  // 扫描的源文件路径
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],

  // 主题扩展配置
  theme: {
    extend: {
      // 字体配置
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },

      // 品牌色彩系统
      colors: {
        brand: {
          DEFAULT: '#3366FF',      // 主色
          light: '#4D7AFF',        // 浅色
          dark: '#254EDB',         // 深色
          surface: '#F5F8FF',      // 表面色
          border: '#D6E0FF',       // 边框色
          navy: '#1E2E55',         // 海军蓝
          heading: '#2E3A59',      // 标题色
        },
        border: '#D6E0FF',
      },

      // 自定义阴影
      boxShadow: {
        soft: '0 35px 80px -45px rgba(37, 78, 219, 0.35), 0 25px 60px -40px rgba(15, 23, 42, 0.25)',
      },
    },
  },

  // 插件
  plugins: [
    typography,
  ],
}
