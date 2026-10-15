import type { Transaction, TransactionType } from '../types'
import { flowOf } from './cashflow'

export type CategorySummary = {
  name: string
  amount: number
  percent: number
}

export function sumTransactions(transactions: Transaction[], type: TransactionType): number {
  return transactions
    .filter((entry) => entry.type === type)
    .reduce((total, entry) => total + entry.amount, 0)
}

export function summarizeExpenseCategories(transactions: Transaction[]): CategorySummary[] {
  const expenseTotals: Record<string, number> = {}

  for (const entry of transactions) {
    const expense = flowOf(entry).expense
    if (expense > 0) {
      expenseTotals[entry.category] = (expenseTotals[entry.category] ?? 0) + expense
    }
  }

  const totalExpenses = Object.values(expenseTotals).reduce((total, amount) => total + amount, 0)

  return Object.entries(expenseTotals)
    .map(([name, amount]) => ({
      name,
      amount,
      percent: totalExpenses === 0 ? 0 : Math.round((amount / totalExpenses) * 100),
    }))
    .sort((left, right) => right.amount - left.amount)
}
