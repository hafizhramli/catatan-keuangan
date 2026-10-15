import { useId } from 'react'
import type { ComponentProps, ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'

import './Input.css'

export type InputProps = ComponentProps<'input'> & {
  label?: string
  error?: string
  hint?: string
  leadingIcon?: ReactNode
}

function Input({ label, error, hint, leadingIcon, id, className = '', ...props }: InputProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const errorId = `${inputId}-error`
  const hintId = `${inputId}-hint`
  const describedBy = error ? errorId : hint ? hintId : undefined

  return (
    <div className="input-field">
      {label ? (
        <label className="input-label" htmlFor={inputId}>
          {label}
        </label>
      ) : null}

      <div
        className={[
          'input-control',
          leadingIcon ? 'input-control--with-icon' : '',
          error ? 'input-control--with-error' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {leadingIcon ? (
          <span className="input-leading-icon" aria-hidden="true">
            {leadingIcon}
          </span>
        ) : null}
        <input
          {...props}
          id={inputId}
          className={['input', error ? 'input--error' : '', className].filter(Boolean).join(' ')}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
        />
        {error ? (
          <span className="input-trailing-icon" aria-hidden="true">
            <AlertCircle size={18} />
          </span>
        ) : null}
      </div>

      {error ? (
        <p id={errorId} className="input-error" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="input-hint">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

export default Input
