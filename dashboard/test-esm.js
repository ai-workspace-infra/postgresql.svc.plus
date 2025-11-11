#!/usr/bin/env node

/**
 * ES Module 验证脚本
 * 验证所有配置文件都能正确加载
 */

console.log('🔍 验证 ES Module 配置...\n')

// 测试 1: 验证 package.json
try {
  const pkg = JSON.parse(await fs.readFile('package.json', 'utf8'))
  if (pkg.type === 'module') {
    console.log('✅ package.json: "type": "module" 已设置')
  } else {
    console.log('⚠️  package.json: 缺少 "type": "module"')
  }
} catch (e) {
  console.log('❌ package.json: 读取失败', e.message)
}

// 测试 2: 验证 Tailwind 配置
try {
  const tailwind = await import('./tailwind.config.mjs')
  console.log('✅ tailwind.config.mjs: 加载成功')
} catch (e) {
  console.log('❌ tailwind.config.mjs: 加载失败', e.message)
}

// 测试 3: 验证 PostCSS 配置
try {
  const postcss = await import('./postcss.config.mjs')
  console.log('✅ postcss.config.mjs: 加载成功')
} catch (e) {
  console.log('❌ postcss.config.mjs: 加载失败', e.message)
}

// 测试 4: 验证 Next.js 配置
try {
  const next = await import('./next.config.mjs')
  console.log('✅ next.config.mjs: 加载成功')
} catch (e) {
  console.log('❌ next.config.mjs: 加载失败', e.message)
}

console.log('\n✨ 验证完成!')
