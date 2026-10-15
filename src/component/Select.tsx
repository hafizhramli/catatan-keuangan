import { useId } from 'react'
import type { ComponentProps } from 'react'

import './Select.css'

export type SelectOption = {
  label: string
  value: string
}

export type SelectProps = Omit<ComponentProps<'select'>, 'size'> & {
  label?: string
  error?: string
  options: SelectOption[]
  size?: 'default' | 'small'
}

function Select({ label, error, id, options, size = 'default', className = '', ...props }: SelectProps) {
  const generatedId = useId()
  const selectId = id ?? generatedId
  const errorId = `${selectId}-error`

  return (
    <div className="select-field">
      {label ? (
        <label className="select-label" htmlFor={selectId}>
          {label}
        </label>
      ) : null}

      <select
        {...props}
        id={selectId}
        className={[
          'select',
          size === 'small' ? 'select--small' : '',
          error ? 'select--error' : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {error ? (
        <p id={errorId} className="select-error">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export default Select
