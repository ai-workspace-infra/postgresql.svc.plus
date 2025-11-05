/**
 * LogoutHandler Island - Client-side logout logic
 *
 * Handles automatic redirect after logout
 */

import { useEffect } from 'preact/hooks'

export default function LogoutHandler() {
  useEffect(() => {
    // Clear any client-side storage
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('user')
        localStorage.removeItem('auth_token')
        sessionStorage.clear()
      } catch (error) {
        console.warn('Failed to clear storage:', error)
      }

      // Redirect to home after a short delay
      const timer = setTimeout(() => {
        window.location.href = '/'
      }, 1500)

      return () => clearTimeout(timer)
    }
  }, [])

  return null
}
