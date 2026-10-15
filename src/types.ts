import type { TransactionCategory, TransactionSource } from './data/transactionOptions'

export type TransactionType = 'income' | 'expense'

export type TransactionStatus = 'recorded' | 'pending' | 'cancelled' | 'refunded'

export type StatusBadgeConfig = {
  label: string
  tone: 'success' | 'warning' | 'neutral'
}

export const TRANSACTION_STATUS_BADGE: Record<TransactionStatus, StatusBadgeConfig> = {
  recorded: { label: 'Tercatat', tone: 'success' },
  pending: { label: 'Menunggu', tone: 'warning' },
  cancelled: { label: 'Dibatalkan', tone: 'neutral' },
  refunded: { label: 'Dikembalikan', tone: 'neutral' },
}

// Transaction dates are local ISO timestamps without a timezone suffix; switch conventions before persisting UTC data.
export type Transaction = {
  id: string
  name: string
  category: TransactionCategory
  source: TransactionSource
  type: TransactionType
  status: TransactionStatus
  amount: number
  date: string
  note?: string
}

export type NewTransaction = Omit<Transaction, 'id'>

export type CashFlowPoint = {
  date: string
  dayLabel: string
  cumulativeIncome: number
  cumulativeExpense: number
}

export type CashFlowTrendData = {
  periodLabel: string
  points: CashFlowPoint[]
  netCashFlow: number
}

export type CalendarDayData = {
  day: number
  dateString: string
  isCurrentMonth: boolean
  isSelected: boolean
  isToday: boolean
  income: number
  expense: number
  hasTransactions: boolean
}

export type CalendarMonthSummary = {
  monthName: string
  year: number
  days: (CalendarDayData | null)[]
  monthlyIncome: number
  monthlyExpense: number
  monthlyNet: number
  selectedDate: string
  selectedDayIncome: number
  selectedDayExpense: number
  selectedDayNet: number
}

export type DashboardSummary = {
  balance: number
  openingBalance: number
  periodIncome: number
  periodExpenses: number
  periodNetFlow: number
  todayIncome: number
  todayExpenses: number
  netFlowToday: number
  expenseRate: number
}
