import type { HTMLAttributes, ReactNode } from 'react'

import './Badge.css'

export type BadgeTone = 'success' | 'warning' | 'neutral'

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone
  children: ReactNode
}

function Badge({ tone = 'success', className = '', children, ...props }: BadgeProps) {
  return (
    <span {...props} className={['badge', `badge--${tone}`, className].filter(Boolean).join(' ')}>
      {children}
    </span>
  )
}

export default Badge