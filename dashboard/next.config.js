/**
 * 功能控制的树形结构，每个节点都可以通过 enabled 控制是否启用。
 * - children 支持精确路径、动态段([param])、以及通配符(*)。
 * - 当某个节点 enabled 为 false 时，其所有子级都会默认关闭。
 */
const path = require('path')

const featureToggles = require('./config/feature-toggles.json')

const normalizeSegments = (pathname = '') =>
  pathname
    .replace(/^\/+|\/+$/g, '')
    .split('/')
    .filter(Boolean)

const findDynamicChildKey = (children = {}) =>
  Object.keys(children).find((key) => /^\[(\.\.\.)?.+\]$/.test(key))

const resolveToggle = (node, segments) => {
  if (!node) return true
  const isEnabled = node.enabled !== false
  if (!isEnabled) return false
  if (!segments.length) return isEnabled

  const children = node.children || {}
  const [current, ...rest] = segments
  const exactChild = children[current]
  const dynamicChildKey = findDynamicChildKey(children)
  const wildcardChild = children['*']
  const nextNode =
    exactChild ?? (dynamicChildKey ? children[dynamicChildKey] : undefined) ?? wildcardChild

  if (!nextNode) return isEnabled
  return resolveToggle(nextNode, rest)
}

const isFeatureEnabled = (section, pathname) => {
  const tree = featureToggles[section]
  if (!tree) return true
  const segments = normalizeSegments(pathname)
  return resolveToggle(tree, segments)
}

// Static exports are incompatible with dynamic route handlers used for auth.
// Allow opting-in explicitly to avoid breaking the default production build.
const shouldUseStaticExport = process.env.NEXT_SHOULD_EXPORT === 'true'

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(shouldUseStaticExport ? { output: 'export' } : {}),
  trailingSlash: false,
  reactStrictMode: true,
  compress: false, // 压缩交给 Nginx，省 Node CPU
  images: { unoptimized: true }, // 关闭服务端图片处理
  webpack(config) {
    config.module.rules.push({
      test: /\.ya?ml$/i,
      type: 'asset/source',
    })

    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      '@cms': path.join(__dirname, 'cms'),
      '@components': path.join(__dirname, 'components'),
      '@i18n': path.join(__dirname, 'i18n'),
      '@lib': path.join(__dirname, 'lib'),
      '@types': path.join(__dirname, 'types'),
      '@server': path.join(__dirname, 'server'),
      '@theme': path.join(__dirname, 'src', 'theme'),
      '@templates': path.join(__dirname, 'src', 'templates'),
      '@src': path.join(__dirname, 'src'),
    }
    return config
  },
}
module.exports = nextConfig
