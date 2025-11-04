export interface SnippetRBAC {
  roles?: string[]
  environments?: string[]
}

export function canAccessSnippet(rbac: SnippetRBAC | undefined, context: {
  role: string
  env: string
}) {
  if (!rbac) return true
  if (rbac.roles && !rbac.roles.includes(context.role)) return false
  if (rbac.environments && !rbac.environments.includes(context.env)) return false
  return true
}
