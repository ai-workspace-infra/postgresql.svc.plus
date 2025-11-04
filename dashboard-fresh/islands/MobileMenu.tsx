/**
 * Mobile Menu Island - Fresh + Preact
 *
 * Client-side interactive mobile menu
 */

import { useSignal } from '@preact/signals'

interface MenuItem {
  label: string
  href: string
}

interface MobileMenuProps {
  language: 'zh' | 'en'
  items: MenuItem[]
}

export default function MobileMenu({ language, items }: MobileMenuProps) {
  const isOpen = useSignal(false)

  const toggleMenu = () => {
    isOpen.value = !isOpen.value
  }

  const closeMenu = () => {
    isOpen.value = false
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={toggleMenu}
        class="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-purple-500"
        aria-expanded={isOpen.value}
        aria-label="Toggle menu"
      >
        <span class="sr-only">Open main menu</span>
        {/* Hamburger Icon */}
        {!isOpen.value ? (
          <svg class="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        ) : (
          <svg class="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </button>

      {/* Mobile Menu Panel */}
      {isOpen.value && (
        <>
          {/* Backdrop */}
          <div
            class="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
            onClick={closeMenu}
          />

          {/* Menu Panel */}
          <div class="fixed top-16 left-0 right-0 z-50 bg-white border-b border-gray-200 md:hidden">
            <div class="px-4 pt-2 pb-3 space-y-1">
              {items.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  class="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  onClick={closeMenu}
                >
                  {item.label}
                </a>
              ))}

              {/* Language Toggle in Mobile Menu */}
              <div class="border-t border-gray-200 pt-3 mt-3">
                <a
                  href={language === 'zh' ? '/?lang=en' : '/?lang=zh'}
                  class="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                >
                  {language === 'zh' ? 'English' : '中文'}
                </a>
              </div>

              {/* Auth Links in Mobile Menu */}
              <div class="border-t border-gray-200 pt-3 mt-3 space-y-1">
                <a
                  href="/login"
                  class="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  onClick={closeMenu}
                >
                  {language === 'zh' ? '登录' : 'Login'}
                </a>
                <a
                  href="/register"
                  class="block px-3 py-2 rounded-md text-base font-medium text-white bg-purple-600 hover:bg-purple-700"
                  onClick={closeMenu}
                >
                  {language === 'zh' ? '注册' : 'Register'}
                </a>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
