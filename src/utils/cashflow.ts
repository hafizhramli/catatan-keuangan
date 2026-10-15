import type { CashFlowPoint, CashFlowTrendData, Transaction } from '../types'

export type CashFlowImpact = {
  income: number
  expense: number
  net: number
}

/**
 * Aturan hitung terpusat:
 * - tercatat ('recorded'): menambah sisi asalnya
 * - dikembalikan ('refunded'): membalik efeknya
 * - menunggu ('pending') & dibatalkan ('cancelled'): tidak dihitung
 */
export function flowOf(transaction: Transaction): CashFlowImpact {
  if (transaction.status === 'recorded') {
    if (transaction.type === 'income') {
      return { income: transaction.amount, expense: 0, net: transaction.amount }
    }
    return { income: 0, expense: transaction.amount, net: -transaction.amount }
  }

  if (transaction.status === 'refunded') {
    if (transaction.type === 'income') {
      return { income: -transaction.amount, expense: 0, net: -transaction.amount }
    }
    return { income: 0, expense: -transaction.amount, net: transaction.amount }
  }

  return { income: 0, expense: 0, net: 0 }
}

export function computeCashFlowTrend(
  transactions: Transaction[],
  startDateStr = '2026-10-01',
  endDateStr = '2026-10-08',
): CashFlowTrendData {
  const points: CashFlowPoint[] = []
  const start = new Date(`${startDateStr}T00:00:00`)
  const end = new Date(`${endDateStr}T00:00:00`)

  let cumIncome = 0
  let cumExpense = 0

  const current = new Date(start)
  while (current <= end) {
    const year = current.getFullYear()
    const month = String(current.getMonth() + 1).padStart(2, '0')
    const day = String(current.getDate()).padStart(2, '0')
    const dayIso = `${year}-${month}-${day}`
    const dayNum = current.getDate()

    const dayTransactions = transactions.filter((t) => t.date.slice(0, 10) === dayIso)
    let dayIncome = 0
    let dayExpense = 0

    for (const t of dayTransactions) {
      const flow = flowOf(t)
      dayIncome += flow.income
      dayExpense += flow.expense
    }

    cumIncome += dayIncome
    cumExpense += dayExpense

    const monthShort = current.toLocaleDateString('id-ID', { month: 'short' })
    points.push({
      date: dayIso,
      dayLabel: `${dayNum} ${monthShort}`,
      cumulativeIncome: cumIncome,
      cumulativeExpense: cumExpense,
    })

    current.setDate(current.getDate() + 1)
  }

  const netCashFlow = cumIncome - cumExpense
  const startFmt = start.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
  const endFmt = end.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })

  return {
    periodLabel: `Akumulasi transaksi · ${startFmt} – ${endFmt}`,
    points,
    netCashFlow,
  }
}
