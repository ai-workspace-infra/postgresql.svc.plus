# 🔄 CommonJS → ES Module 迁移指南

## 📊 迁移概览

### 转换前 (CommonJS)
```javascript
// tailwind.config.js
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [require('@tailwindcss/typography')]
}
```

### 转换后 (ES Module)
```javascript
// tailwind.config.mjs
import typography from '@tailwindcss/typography'

export default {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: { extend: {} },
  plugins: [typography]
}
```

## ✅ 迁移文件清单

| 文件 | 原格式 → 新格式 | 状态 |
|------|----------------|------|
| `package.json` | 添加 `"type": "module"` | 📋 需手动 |
| `tailwind.config.js` | → `tailwind.config.mjs` | ✅ 完成 |
| `postcss.config.js` | → `postcss.config.mjs` | ✅ 完成 |
| `next.config.mjs` | 已是 ES Module | ✅ 保持 |

## 🚀 执行迁移

```bash
# 1. 备份原文件
cp package.json package.json.bak
cp tailwind.config.js tailwind.config.js.bak
cp postcss.config.js postcss.config.js.bak

# 2. 添加 type: "module" 到 package.json
# 在 "private": true 后添加

# 3. 替换配置文件
mv tailwind.config.mjs tailwind.config.js
mv postcss.config.mjs postcss.config.js

# 4. 验证
npm run build
```

## 🎯 ES Module 优势

1. **统一标准**: import/export 语法
2. **更好 Tree Shaking**: 消除未使用代码
3. **静态分析**: IDE 支持更好
4. **未来兼容**: ECMAScript 标准
5. **性能提升**: 更好的模块加载

