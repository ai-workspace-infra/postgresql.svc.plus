/**
 * Counter Island - Example Interactive Component
 *
 * Islands in Fresh are interactive components that run on the client.
 * This is a simple example demonstrating:
 * - Preact hooks (useState)
 * - Zustand state management integration
 * - Client-side interactivity
 */

import { useState } from 'preact/hooks'
import { useUIStore } from '../stores/index.ts'

interface CounterProps {
  initialCount?: number
}

export default function Counter({ initialCount = 0 }: CounterProps) {
  const [count, setCount] = useState(initialCount)
  const { theme } = useUIStore()

  const increment = () => setCount(count + 1)
  const decrement = () => setCount(count - 1)
  const reset = () => setCount(initialCount)

  const isDark = theme === 'dark' || (theme === 'auto' &&
    globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches)

  return (
    <div
      class={`p-6 rounded-lg border ${
        isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}
    >
      <h3 class="text-xl font-semibold mb-4">Interactive Counter</h3>
      <div class="flex items-center gap-4">
        <button
          onClick={decrement}
          class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
        >
          -
        </button>
        <span class="text-2xl font-bold min-w-[3rem] text-center">
          {count}
        </span>
        <button
          onClick={increment}
          class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
        >
          +
        </button>
        <button
          onClick={reset}
          class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition"
        >
          Reset
        </button>
      </div>
      <p class="mt-4 text-sm text-gray-500">
        Current theme: {theme}
      </p>
    </div>
  )
}
