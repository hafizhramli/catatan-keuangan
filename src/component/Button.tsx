import type { ComponentProps, ReactNode } from 'react'

import './Button.css'

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'ghost-destructive'
  | 'destructive'

export type ButtonProps = ComponentProps<'button'> & {
  variant?: ButtonVariant
  children: ReactNode
}

function Button({
  variant = 'primary',
  type = 'button',
  className = '',
  children,
  ...props
}: ButtonProps) {
  const classes = ['button', `button--${variant}`, className].filter(Boolean).join(' ')

  return (
    <button {...props} type={type} className={classes}>
      {children}
    </button>
  )
}

export default Button
