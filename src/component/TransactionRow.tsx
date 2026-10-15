import { createElement } from 'react'
import type { Transaction } from '../types'
import { TRANSACTION_STATUS_BADGE } from '../types'
import { formatDate, formatRupiah } from '../utils/format'
import { getCategoryIcon } from '../data/categoryIcons'
import Badge from './Badge'
import RowMenu from './RowMenu'

import './TransactionRow.css'

type TransactionRowProps = {
  transaction: Transaction
  onEdit?: (transaction: Transaction) => void
  onRemove: (id: string) => Promise<void>
}

function TransactionRow({ transaction, onEdit, onRemove }: TransactionRowProps) {
  const isRefunded = transaction.status === 'refunded'
  const icon = getCategoryIcon(transaction.category)
  const statusConfig = TRANSACTION_STATUS_BADGE[transaction.status] ?? {
    label: transaction.status,
    tone: 'neutral' as const,
  }

  const displayAmount = isRefunded || transaction.type === 'expense' ? -transaction.amount : transaction.amount
  const amountTypeClass = isRefunded || transaction.type === 'expense' ? 'expense' : 'income'

  return (
    <tr className="transaction-row">
      <td className="transaction-cell--name">
        <div className="transaction-item">
          <div
            className={`transaction-icon-tile transaction-icon-tile--${transaction.type}`}
            aria-hidden="true"
          >
            {createElement(icon, { size: 18 })}
          </div>
          <div className="transaction-name">
            <span className="transaction-name__title">{transaction.name}</span>
            <span className="transaction-name__date">{formatDate(transaction.date)}</span>
          </div>
        </div>
      </td>
      <td className="transaction-cell">{transaction.category}</td>
      <td className="transaction-cell">{transaction.source}</td>
      <td>
        <Badge tone={statusConfig.tone}>{statusConfig.label}</Badge>
      </td>
      <td className={`transaction-amount transaction-amount--${amountTypeClass}`}>
        {formatRupiah(displayAmount, { signed: true })}
      </td>
      <td className="transaction-actions-cell">
        <RowMenu
          label={`Aksi transaksi ${transaction.name}`}
          onEdit={onEdit ? () => onEdit(transaction) : undefined}
          onRemove={() => onRemove(transaction.id)}
        />
      </td>
    </tr>
  )
}

export default TransactionRow
