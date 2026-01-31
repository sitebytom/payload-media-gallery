import type React from 'react'

export const MasonryIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <title>Masonry View</title>
    <rect x="4" y="4" width="5" height="7" rx="1" />
    <rect x="4" y="13" width="5" height="3" rx="1" />
    <rect x="11" y="4" width="5" height="4" rx="1" />
    <rect x="11" y="10" width="5" height="6" rx="1" />
  </svg>
)
