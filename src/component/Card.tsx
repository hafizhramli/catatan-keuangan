import type { HTMLAttributes, ReactNode } from 'react'

import './Card.css'

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
}

function Card({ className = '', children, ...props }: CardProps) {
  const classes = ['card', className].filter(Boolean).join(' ')

  return (
    <div {...props} className={classes}>
      {children}
    </div>
  )
}

export default Card
