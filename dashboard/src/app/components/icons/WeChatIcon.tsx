import type { SVGProps } from 'react'

export function WeChatIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      role="img"
      aria-hidden="true"
      focusable="false"
      className={className}
      {...props}
    >
      <path
        fill="currentColor"
        d="M14 2.75c-4.418 0-8 2.996-8 6.7 0 1.71.78 3.28 2.07 4.51L7 16.4l2.64-1.5c1.38.6 2.94.95 4.54.95 4.418 0 8-2.996 8-6.7s-3.582-6.4-8-6.4Z"
      />
      <path
        fill="currentColor"
        opacity="0.85"
        d="M6.25 10.5C3.35 10.5 1 12.61 1 15.17c0 1.26.56 2.43 1.52 3.33L1 22l3.36-1.9c.65.18 1.34.27 2.07.27 2.9 0 5.26-2.11 5.26-4.67S9.15 10.5 6.25 10.5Z"
      />
      <circle cx="11.4" cy="9.4" r="0.9" fill="#fff" />
      <circle cx="15.6" cy="9.4" r="0.9" fill="#fff" />
      <circle cx="5.3" cy="15.1" r="0.75" fill="#fff" />
      <circle cx="7.8" cy="15.1" r="0.75" fill="#fff" />
    </svg>
  )
}
