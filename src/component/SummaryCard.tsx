import type { ReactNode } from 'react'

import Card from './Card'
import { formatRupiah } from '../utils/format'

import './SummaryCard.css'

export type SummaryCardVariant = 'balance' | 'income' | 'expense' | 'neutral'

type SummaryCardProps = {
  title: string
  amount: number
  footnote: string
  variant: SummaryCardVariant
  icon?: ReactNode
  signed?: boolean
  className?: string
  valueClassName?: string
}

function SummaryCard({
  title,
  amount,
  footnote,
  variant,
  icon,
  signed = false,
  className = '',
  valueClassName = '',
}: SummaryCardProps) {
  return (
    <Card className={['summary-card', `summary-card--${variant}`, className].filter(Boolean).join(' ')}>
      <div className="summary-card__header">
        <span className="summary-label">{title}</span>
        {icon ? (
          <span className="summary-icon" aria-hidden="true">
            {icon}
          </span>
        ) : null}
      </div>
      <strong className={['summary-value', valueClassName].filter(Boolean).join(' ')}>
        {formatRupiah(amount, { signed })}
      </strong>
      <span className="summary-footnote">{footnote}</span>
    </Card>
  )
}

export default SummaryCard