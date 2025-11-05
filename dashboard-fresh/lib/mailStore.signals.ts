/**
 * Mail Store - Signals Implementation (Deno + Fresh)
 *
 * Migration from: Zustand
 * Migration to: Preact Signals
 */

import { signal, computed } from '@preact/signals'

// ========== Types ==========

export interface MailState {
  tenantId: string | null
  selectedMessageId: string | null
  label: string | null
  search: string
  pageSize: number
  cursor: string | null
}

// ========== Default State ==========

const DEFAULT_STATE: Omit<MailState, keyof MailState> = {
  tenantId: null,
  selectedMessageId: null,
  label: null,
  search: '',
  pageSize: 25,
  cursor: null,
}

// ========== Signals ==========

const tenantId = signal<string | null>(DEFAULT_STATE.tenantId)
const selectedMessageId = signal<string | null>(DEFAULT_STATE.selectedMessageId)
const label = signal<string | null>(DEFAULT_STATE.label)
const search = signal<string>(DEFAULT_STATE.search)
const pageSize = signal<number>(DEFAULT_STATE.pageSize)
const cursor = signal<string | null>(DEFAULT_STATE.cursor)

// ========== Computed Values ==========

// Computed can be added here if needed for complex derivations
// Example: const filteredMessages = computed(() => ...)

// ========== Actions ==========

/**
 * Set tenant and reset related state
 */
function setTenant(newTenantId: string): void {
  // Reset to default state, preserve search
  tenantId.value = newTenantId
  selectedMessageId.value = DEFAULT_STATE.selectedMessageId
  label.value = DEFAULT_STATE.label
  cursor.value = DEFAULT_STATE.cursor
}

/**
 * Set selected message ID
 */
function setSelectedMessageId(id: string | null): void {
  selectedMessageId.value = id
}

/**
 * Set label and reset pagination
 */
function setLabel(newLabel: string | null): void {
  label.value = newLabel
  cursor.value = DEFAULT_STATE.cursor
  // Preserve selectedMessageId
}

/**
 * Set search term and reset pagination
 */
function setSearch(term: string): void {
  search.value = term
  cursor.value = DEFAULT_STATE.cursor
  // Preserve selectedMessageId
}

/**
 * Set pagination cursor
 */
function setCursor(newCursor: string | null): void {
  cursor.value = newCursor
}

/**
 * Set page size
 */
function setPageSize(size: number): void {
  pageSize.value = size
  cursor.value = DEFAULT_STATE.cursor
}

/**
 * Reset to default state
 */
function reset(): void {
  tenantId.value = DEFAULT_STATE.tenantId
  selectedMessageId.value = DEFAULT_STATE.selectedMessageId
  label.value = DEFAULT_STATE.label
  search.value = DEFAULT_STATE.search
  pageSize.value = DEFAULT_STATE.pageSize
  cursor.value = DEFAULT_STATE.cursor
}

// ========== Store Object ==========

/**
 * Mail store using Preact Signals
 * Migration from: Zustand store with selectors and actions
 *
 * Usage:
 *   import { mailStore } from './mailStore.signals'
 *
 *   // Access state directly
 *   console.log(mailStore.tenantId.value)
 *
 *   // Update state
 *   mailStore.setTenant('tenant-123')
 *
 *   // In components (Preact)
 *   function MyComponent() {
 *     const tenantId = mailStore.tenantId
 *     return <div>{tenantId.value}</div>
 *   }
 */
export const mailStore = {
  // State
  tenantId,
  selectedMessageId,
  label,
  search,
  pageSize,
  cursor,

  // Actions
  setTenant,
  setSelectedMessageId,
  setLabel,
  setSearch,
  setCursor,
  setPageSize,
  reset,
}

// ========== Individual Exports (for easier migration) ==========

// Export signals for direct import
export {
  tenantId,
  selectedMessageId,
  label,
  search,
  pageSize,
  cursor,
}

// Export actions
export {
  setTenant,
  setSelectedMessageId,
  setLabel,
  setSearch,
  setCursor,
  setPageSize,
  reset,
}

// ========== Default Export ==========

export default mailStore
