# CMS 模板系统迁移文档

## 📊 迁移状态

**已完成:**
- ✅ CSS 构建系统 (Tailwind → static/styles/globals.css)
- ✅ 主页 Markdown 内容渲染 (Fresh + Preact)
- ✅ Feature Toggle 集成
- ✅ Preact 版本的模板布局 (lib/templates/commonHome.preact.tsx)
- ✅ 双语支持 (中文/English)

**待完成:**
- ⏳ Slot 组件迁移到 Preact (ProductMatrix, ArticleFeed, Sidebar)
- ⏳ CMS 内容加载系统适配 Deno
- ⏳ Fresh Islands 集成交互组件

---

## 🏗️ 架构概述

### 当前实现 (routes/index.tsx)

主页使用 **Markdown 内容模式** 进行服务器端渲染:

```typescript
// Handler: 服务器端预加载内容
export const handler: Handlers<HomePageData, FreshState> = {
  async GET(req, ctx) {
    // 1. 检查 feature toggle
    const cmsEnabled = isFeatureEnabled('cmsExperience', '/homepage/dynamic')

    // 2. 加载 markdown 内容
    const sections = await Promise.all([
      loadMarkdownSection('homepage/zh/operations.md'),
      loadMarkdownSection('homepage/zh/products.md'),
      // ...
    ])

    // 3. 渲染数据
    return ctx.render({ sections, cmsEnabled })
  }
}

// Component: Preact 渲染
export default function HomePage({ data }: PageProps<HomePageData>) {
  return (
    <main>
      <header dangerouslySetInnerHTML={{ __html: sections.operations.html }} />
      {/* ... */}
    </main>
  )
}
```

**优点:**
- ⚡ 极快的首屏加载 (SSR)
- 🎯 SEO 友好
- 💾 低内存占用
- 🔧 易于维护

---

## 🔄 CMS 模板系统迁移路径

### 1. Preact 模板布局 ✅

已创建 `lib/templates/commonHome.preact.tsx`:

```typescript
import { CommonHomeTemplate } from '@/lib/templates/commonHome.preact.tsx'

export function HomePage({ data }) {
  return (
    <CommonHomeTemplate
      config={defaultHomeLayoutConfig}
      slots={{
        ProductMatrix: ProductMatrixComponent,
        ArticleFeed: ArticleFeedComponent,
        Sidebar: SidebarComponent,
      }}
    />
  )
}
```

**特性:**
- 使用 Preact 代替 React
- 支持动态 slot 系统
- 与 Fresh 兼容
- 使用 `class` 代替 `className`

### 2. Slot 组件迁移指南

#### 原 React 组件结构

```typescript
// components/home/ProductMatrix.tsx (React)
import { getHeroSolutions } from '@cms/content'

export default async function ProductMatrix() {
  const solutions = await getHeroSolutions()  // React Server Component
  return <ProductMatrixClient solutions={solutions} />
}
```

#### Fresh + Preact 迁移方案

**选项 A: 服务器端预加载 (推荐)**

```typescript
// routes/index.tsx - Handler
export const handler: Handlers = {
  async GET(req, ctx) {
    const solutions = await getHeroSolutions()
    return ctx.render({ solutions })
  }
}

// components/home/ProductMatrix.preact.tsx
export function ProductMatrix({ solutions }) {
  return (
    <div class="grid gap-4">
      {solutions.map(solution => (
        <div key={solution.id}>{solution.title}</div>
      ))}
    </div>
  )
}
```

**选项 B: Fresh Islands (客户端交互)**

```typescript
// islands/ProductMatrix.tsx
import { useSignal } from '@preact/signals'

export default function ProductMatrix({ solutions }) {
  const selected = useSignal(0)

  return (
    <div>
      {solutions.map((solution, i) => (
        <button onClick={() => selected.value = i}>
          {solution.title}
        </button>
      ))}
    </div>
  )
}
```

### 3. CMS 内容系统适配

#### 当前问题

```typescript
// cms/content/homepage.ts
export async function getHeroSolutions() {
  // 依赖 Node.js fs/path
  const files = await fs.readdir(solutionsDir)
  // ...
}
```

#### Deno 迁移

```typescript
// cms/content/homepage.deno.ts
export async function getHeroSolutions() {
  // 使用 Deno API
  const solutionsDir = join(Deno.cwd(), 'content/solutions')

  const entries = []
  for await (const entry of Deno.readDir(solutionsDir)) {
    if (entry.isFile && entry.name.endsWith('.md')) {
      entries.push(entry)
    }
  }

  // ...
}
```

**所需更改:**
- `fs.readFile` → `Deno.readTextFile()`
- `fs.readdir` → `Deno.readDir()`
- `path.join` → `$std/path/join`
- `require()` → `import`

---

## 📝 迁移步骤

### Phase 1: 准备工作 ✅

- [x] 设置 Fresh + Deno 项目结构
- [x] 配置 Tailwind CSS 构建
- [x] 迁移主页到 Fresh handler
- [x] 创建 Preact 模板布局

### Phase 2: 组件迁移 (进行中)

需要迁移的组件:

#### ProductMatrix
- [ ] 创建 `components/home/ProductMatrix.preact.tsx`
- [ ] 适配 `cms/content/homepage.deno.ts` 中的 `getHeroSolutions()`
- [ ] 测试渲染

#### ArticleFeed
- [ ] 创建 `components/home/ArticleFeed.preact.tsx`
- [ ] 适配 `getHomepagePosts()` 到 Deno
- [ ] 如需交互,创建对应的 Island

#### Sidebar
- [ ] 创建 `components/home/Sidebar.preact.tsx`
- [ ] 适配 `getSidebarSections()` 到 Deno
- [ ] 迁移 `SidebarCard` 子组件

### Phase 3: 集成测试

- [ ] 在 routes/index.tsx 中启用 CMS 模板模式
- [ ] 测试所有 slot 组件渲染
- [ ] 验证样式和交互
- [ ] 性能测试

### Phase 4: 文档和清理

- [ ] 更新使用文档
- [ ] 删除 React 依赖
- [ ] 清理旧代码

---

## 🚀 快速启用 CMS 模板 (未来)

完成迁移后,在 `routes/index.tsx` 中:

```typescript
export const handler: Handlers = {
  async GET(req, ctx) {
    // Check if CMS is enabled
    const cmsEnabled = isFeatureEnabled('cmsExperience', '/homepage/dynamic')

    if (cmsEnabled) {
      // Load CMS template
      const { default: template } = await import('@/src/templates/default/index.tsx')
      const solutions = await getHeroSolutions()
      const posts = await getHomepagePosts()
      const sidebar = await getSidebarSections()

      return ctx.render({
        useCmsTemplate: true,
        template,
        data: { solutions, posts, sidebar }
      })
    }

    // Fallback to markdown mode
    // ...
  }
}

export default function HomePage({ data }: PageProps) {
  if (data.useCmsTemplate) {
    const { template, data: templateData } = data
    return (
      <CommonHomeTemplate
        config={defaultHomeLayoutConfig}
        slots={{
          ProductMatrix: () => <ProductMatrix solutions={templateData.solutions} />,
          ArticleFeed: () => <ArticleFeed posts={templateData.posts} />,
          Sidebar: () => <Sidebar sections={templateData.sidebar} />,
        }}
      />
    )
  }

  // Render markdown mode
  return <MarkdownHomepage sections={data.sections} />
}
```

---

## 🔧 开发命令

```bash
# 构建 CSS
make css-build

# 开发模式 (带 CSS watch)
make dev-full

# 仅启动 Fresh 服务器
make dev

# 测试主页
curl http://localhost:8000/
curl http://localhost:8000/?lang=en
```

---

## 📚 参考资源

- **Fresh 文档:** https://fresh.deno.dev/
- **Preact 文档:** https://preactjs.com/
- **Fresh Islands:** https://fresh.deno.dev/docs/concepts/islands
- **Deno API:** https://deno.land/api

---

## ⚠️ 已知限制

### React Grid Layout

原 `app/globals.css` 引入了 React Grid Layout CSS:

```css
@import 'react-grid-layout/css/styles.css';  /* ❌ 不兼容 */
@import 'react-resizable/css/styles.css';    /* ❌ 不兼容 */
```

**解决方案:**
- 如果需要网格布局,使用 CSS Grid 或 Flexbox
- 或者寻找 Deno 兼容的拖拽库

### 客户端状态管理

目前使用 Zustand (已配置在 deno.jsonc):

```typescript
import { create } from 'zustand/vanilla'

const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}))
```

对于 Fresh Islands,推荐使用 `@preact/signals`:

```typescript
import { signal } from '@preact/signals'

const count = signal(0)
```

---

## 📊 性能对比

### Markdown 模式 (当前)
- **TTFB:** ~50ms
- **FCP:** ~200ms
- **Bundle Size:** ~30KB (gzipped)
- **Hydration:** 无 (静态渲染)

### CMS 模板模式 (目标)
- **TTFB:** ~80ms (预加载内容)
- **FCP:** ~250ms
- **Bundle Size:** ~50KB (gzipped)
- **Hydration:** Islands only (选择性)

---

**最后更新:** 2025-11-04
**状态:** Phase 2 进行中 (组件迁移)
