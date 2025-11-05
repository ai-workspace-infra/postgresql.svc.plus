# 状态管理使用指南

## 📦 更新完成

### 已完成的迁移
- ✅ `lib/userStore.tsx` 已更新为 Signals 版本
- ✅ 移除了 Zustand 依赖 (`deno.jsonc`)
- ✅ 集成了 Mail Store 到 `userStore.tsx`
- ✅ 更新了相关文件的 React → Preact hooks

### 移除的依赖
```diff
- "zustand": "https://esm.sh/zustand@4.5.0",
- "zustand/vanilla": "https://esm.sh/zustand@4.5.0/vanilla",
- "zustand/middleware": "https://esm.sh/zustand@4.5.0/middleware",
```

---

## 🚀 使用指南

### 1. User Store - 用户状态管理

#### 基本使用

```typescript
import { useUser, UserProvider } from '@lib/userStore'

// 1. 在应用根级别包装 UserProvider
export default function App({ Component }: PageProps) {
  return (
    <UserProvider>
      <Component />
    </UserProvider>
  )
}

// 2. 在组件中使用 useUser
function MyComponent() {
  const { user, isLoading, login, logout, refresh } = useUser()

  if (isLoading) return <div>Loading...</div>
  if (!user) return <div>Please login</div>

  return (
    <div>
      Welcome, {user.name || user.email}
      <button onClick={logout}>Logout</button>
    </div>
  )
}
```

#### 高级使用 - 直接访问信号

```typescript
import { user } from '@lib/userStore'

// 在 Preact 组件中直接使用信号（自动追踪更新）
function UserDisplay() {
  return <div>User: {user.value?.name || 'Guest'}</div>
}

// 手动刷新
async function refreshUser() {
  const { refresh } = useUser()
  await refresh()
}
```

### 2. Mail Store - 邮件状态管理

Mail Store 现在集成在 `userStore.tsx` 中，提供向后兼容的 API。

#### 使用方式 1: Zustand 兼容模式（推荐）

```typescript
import { useMailStore } from '@lib/userStore'

function MailComponent() {
  // 获取完整状态和 actions
  const {
    tenantId,
    selectedMessageId,
    label,
    search,
    pageSize,
    cursor,
    setTenant,
    setSelectedMessageId,
    setLabel,
    setSearch,
    setCursor,
    setPageSize,
    reset,
  } = useMailStore()

  return (
    <div>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <select value={tenantId || ''} onChange={(e) => setTenant(e.target.value)}>
        {/* ... */}
      </select>
    </div>
  )
}
```

#### 使用方式 2: Selector 模式

```typescript
function MailComponent() {
  // 使用 selector 获取特定字段
  const search = useMailStore((s) => s.search)
  const tenantId = useMailStore((s) => s.tenantId)

  return <div>Search: {search}</div>
}
```

#### 使用方式 3: 直接信号访问

```typescript
import {
  mailSearch,
  mailTenantId,
  setMailSearch,
} from '@lib/userStore'

function MailComponent() {
  return (
    <input
      value={mailSearch.value}
      onChange={(e) => setMailSearch(e.target.value)}
    />
  )
}
```

---

## 📊 API 对比

### User Store

| 旧版本 (Zustand) | 新版本 (Signals) | 说明 |
|------------------|------------------|------|
| `sessionStore((s) => s.user)` | `user.value` | 直接访问 |
| `sessionStore((s) => s.setUser)` | 内部函数 | 通过 actions |
| SWR `useSWR` | `refresh()` | 手动刷新 |
| Provider 自动加载 | ✅ | 保持不变 |

### Mail Store

| 旧版本 | 新版本 | 说明 |
|--------|--------|------|
| `useMailStore((s) => s.search)` | `useMailStore((s) => s.search)` | ✅ 向后兼容 |
| `useMailStore.getState()` | 信号直接访问 | 更高效 |
| `setState()` | `setSearch()` | Actions |

---

## ⚙️ 集成位置

### UserProvider 应该在哪儿使用？

由于 Fresh 的架构，UserProvider 应该在以下位置之一：

#### 选项 1: 特定页面（当前推荐）
```typescript
// routes/panel/index.tsx 等 panel 页面
export default function PanelPage({ data }: PageProps<PanelPageData>) {
  return (
    <UserProvider>
      <PanelLayout user={data.user} currentPath={data.pathname}>
        {/* 页面内容 */}
      </PanelLayout>
    </UserProvider>
  )
}
```

#### 选项 2: 全局布局
```typescript
// routes/_app.tsx
import { UserProvider } from '@lib/userStore'

export default function App({ Component }: PageProps) {
  return (
    <UserProvider>
      <Component />
    </UserProvider>
  )
}
```

#### 选项 3: 特定组件
```typescript
// 在需要用户状态的组件中
function RequireAuth({ children }) {
  const { user, isLoading } = useUser()

  if (isLoading) return <Spinner />
  if (!user) return <LoginPrompt />

  return <>{children}</>
}
```

---

## 🔧 迁移检查清单

### ✅ 已完成
- [x] 更新 `lib/userStore.tsx` 为 Signals
- [x] 移除 `deno.jsonc` 中的 Zustand 依赖
- [x] 更新 `lib/accessControl.ts` 使用 preact/hooks
- [x] 更新 `lib/mail/auth.ts` 使用 preact/hooks
- [x] 集成 Mail Store 到 userStore.tsx

### 🔄 可能需要更新（如果使用）
- [ ] `islands/UserMenu.tsx` - 如果使用 useUser
- [ ] `components/*` - 检查是否需要 UserProvider
- [ ] 其他自定义组件

### 📝 使用建议

1. **对于新的组件**：直接使用 Signals API（`user.value`）
2. **对于现有组件**：继续使用 `useUser()` 和 `useMailStore()`
3. **对于性能关键代码**：直接访问信号（`user.value`）而不是使用 selector

---

## 🐛 故障排除

### 问题 1: `useUser must be used within a UserProvider`

**解决方案**：确保组件在 UserProvider 内部：

```typescript
<UserProvider>
  <MyComponent /> {/* 这里可以使用 useUser */}
</UserProvider>
```

### 问题 2: `user.value` 为 null

**原因**：用户未登录或数据尚未加载

**解决方案**：
```typescript
const { user, isLoading } = useUser()

if (isLoading) return <Spinner />
if (!user) return <LoginPrompt />

return <div>{user.value.name}</div>
```

### 问题 3: 更新邮件状态不生效

**检查**：
```typescript
// 确保使用正确的 API
✅ setMailSearch('term')        // 直接函数
✅ useMailStore((s) => s.search) // selector
❌ mailSearch.value = 'term'      // 不要直接修改
```

---

## 📚 延伸资源

- [Preact Signals 文档](https://preactjs.com/guide/v10/signals/)
- [状态管理迁移报告](./state-migration-report.md)
- [迁移示例对比](./state-migration-examples.md)

---

## ✨ 总结

新的状态管理系统：
- ✅ 更轻量（无 Zustand 依赖）
- ✅ 更高性能（无 selector 开销）
- ✅ 更灵活（信号 + computed）
- ✅ Deno 原生（无 Node.js 依赖）
- ✅ 向后兼容（useUser 和 useMailStore API 保持不变）
