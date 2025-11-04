# API Migration Guide - Next.js to Fresh + Deno

This document tracks the migration of Next.js API routes to Fresh handlers with Deno runtime.

## Migration Status

### ✅ Completed

#### Core Infrastructure
- [x] `middleware.ts` - Fresh middleware for authentication and session management
- [x] `lib/authGateway.deno.ts` - Cookie management with Web APIs
- [x] `server/serviceConfig.deno.ts` - Service URL configuration

#### API Routes Migrated
- [x] `/api/ping` → `routes/api/ping.ts`
- [x] `/api/auth/login` → `routes/api/auth/login.ts`
- [x] `/api/auth/session` → `routes/api/auth/session.ts`
- [x] `/api/render-markdown` → `routes/api/render-markdown.ts`
- [x] `/api/content-meta` → `routes/api/content-meta.ts`

### 🚧 In Progress
- [ ] Authentication routes (register, verify-email, MFA)
- [ ] Protected API routes (users, admin, mail, etc.)
- [ ] Dynamic routes ([...segments])

### 📋 Pending
The following Next.js API routes need to be migrated:

#### Auth Routes
- `app/api/auth/register/route.ts`
- `app/api/auth/register/verify/route.ts`
- `app/api/auth/register/send/route.ts`
- `app/api/auth/verify-email/route.ts`
- `app/api/auth/verify-email/send/route.ts`
- `app/api/auth/mfa/setup/route.ts`
- `app/api/auth/mfa/verify/route.ts`
- `app/api/auth/mfa/status/route.ts`
- `app/api/auth/mfa/disable/route.ts`

#### Protected API Routes
- `app/api/users/route.ts`
- `app/api/admin/settings/route.ts`
- `app/api/admin/users/metrics/route.ts`
- `app/api/admin/users/[userId]/role/route.ts`

#### Mail API Routes
- `app/api/mail/inbox/route.ts`
- `app/api/mail/send/route.ts`
- `app/api/mail/namespace/route.ts`
- `app/api/mail/message/[id]/route.ts`
- `app/api/mail/ai/summarize/route.ts`
- `app/api/mail/ai/reply-suggest/route.ts`
- `app/api/mail/ai/classify/route.ts`

#### AI & Task Routes
- `app/api/askai/route.ts`
- `app/api/rag/query/route.ts`
- `app/api/task/[...segments]/route.ts`
- `app/api/agent/[...segments]/route.ts`

## Migration Patterns

### 1. Basic API Handler

**Next.js Pattern:**
```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return NextResponse.json({ data: 'value' })
}
```

**Fresh Pattern:**
```typescript
import { Handlers } from '$fresh/server.ts'

export const handler: Handlers = {
  GET(_req, _ctx) {
    return new Response(JSON.stringify({ data: 'value' }), {
      headers: { 'Content-Type': 'application/json' },
    })
  },
}
```

### 2. Cookie Management

**Next.js Pattern:**
```typescript
import { cookies } from 'next/headers'

const token = cookies().get('session')?.value
const res = NextResponse.json({ ... })
res.cookies.set('session', token, { httpOnly: true })
```

**Fresh Pattern:**
```typescript
import { getSessionToken, applySessionCookie } from '@/lib/authGateway.deno.ts'

const token = getSessionToken(req)
const headers = new Headers({ 'Content-Type': 'application/json' })
applySessionCookie(headers, token)
return new Response(JSON.stringify({ ... }), { headers })
```

### 3. Query Parameters

**Next.js Pattern:**
```typescript
const path = request.nextUrl.searchParams.get('path')
```

**Fresh Pattern:**
```typescript
const url = new URL(req.url)
const path = url.searchParams.get('path')
```

### 4. Request Body

**Next.js Pattern:**
```typescript
const body = await request.json()
```

**Fresh Pattern:**
```typescript
const body = await req.json()
```

### 5. Dynamic Routes

**Next.js Pattern:**
```typescript
// app/api/mail/message/[id]/route.ts
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params
}
```

**Fresh Pattern:**
```typescript
// routes/api/mail/message/[id].ts
import { Handlers } from '$fresh/server.ts'

export const handler: Handlers = {
  GET(_req, ctx) {
    const { id } = ctx.params
  },
}
```

### 6. Catch-all Routes

**Next.js Pattern:**
```typescript
// app/api/task/[...segments]/route.ts
export async function POST(request: NextRequest, { params }: { params: { segments: string[] } }) {
  const { segments } = params
}
```

**Fresh Pattern:**
```typescript
// routes/api/task/[...segments].ts
import { Handlers } from '$fresh/server.ts'

export const handler: Handlers = {
  POST(_req, ctx) {
    const segments = ctx.params.segments.split('/')
  },
}
```

### 7. Middleware State Access

**Fresh Pattern:**
```typescript
import { Handlers } from '$fresh/server.ts'
import { FreshState } from '@/middleware.ts'

export const handler: Handlers<unknown, FreshState> = {
  GET(_req, ctx) {
    const user = ctx.state.user
    const isAuthenticated = ctx.state.isAuthenticated
    // ...
  },
}
```

### 8. Environment Variables

**Next.js Pattern:**
```typescript
const apiUrl = process.env.API_BASE_URL
```

**Fresh Pattern:**
```typescript
const apiUrl = Deno.env.get('API_BASE_URL')
```

## Key Differences

### Response Construction

**Next.js:** Uses `NextResponse` helper
```typescript
NextResponse.json(data, { status: 200 })
```

**Fresh:** Uses standard `Response` API
```typescript
new Response(JSON.stringify(data), {
  status: 200,
  headers: { 'Content-Type': 'application/json' },
})
```

### Cookie Handling

**Next.js:** Built-in cookie API with `cookies()` from `next/headers`

**Fresh:** Manual cookie parsing and `Set-Cookie` header management
- Use `getCookies(req)` to parse request cookies
- Use helper functions to set cookies in response headers
- See `lib/authGateway.deno.ts` for implementation

### File System Access

**Next.js:** Uses Node.js `fs` module
```typescript
import { readFile } from 'fs/promises'
const content = await readFile(path, 'utf-8')
```

**Fresh/Deno:** Uses Deno APIs
```typescript
const content = await Deno.readTextFile(path)
const stats = await Deno.stat(path)
```

### Subprocess Execution

**Next.js:** Uses Node.js `child_process`
```typescript
import { execFile } from 'child_process'
execFile('git', ['log'], callback)
```

**Fresh/Deno:** Uses `Deno.Command`
```typescript
const command = new Deno.Command('git', {
  args: ['log'],
  stdout: 'piped',
})
const { stdout } = await command.output()
```

## Authentication Flow

### Middleware (`middleware.ts`)
1. Parses session and MFA cookies from request
2. For protected routes: validates session token against Account Service
3. Injects user context into `ctx.state`
4. Returns 401 for unauthenticated API requests
5. Redirects to login for unauthenticated page requests

### Login Flow (`routes/api/auth/login.ts`)
1. Validates credentials with Account Service
2. On success: sets session cookie with token
3. On MFA required: sets MFA challenge cookie
4. Clears cookies on failure

### Session Flow (`routes/api/auth/session.ts`)
1. Gets session token from cookie
2. Validates with Account Service
3. Returns normalized user data
4. DELETE method clears session (logout)

## Testing Checklist

When migrating an API route, verify:
- [ ] Request parsing works (query params, body, headers)
- [ ] Response format matches original (status, headers, body)
- [ ] Error handling preserves status codes
- [ ] Cookie handling works correctly
- [ ] Authentication/authorization is enforced
- [ ] Deno permissions are sufficient (--allow-net, --allow-read, etc.)
- [ ] Environment variables are read correctly
- [ ] External service calls have timeouts
- [ ] Type safety is maintained

## Next Steps

1. Migrate authentication routes (register, verify-email, MFA)
2. Migrate protected API routes with user context
3. Migrate dynamic and catch-all routes
4. Create integration tests for migrated routes
5. Update frontend to use new API endpoints
6. Remove Next.js route handlers from app/ directory
