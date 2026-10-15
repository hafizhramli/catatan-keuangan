import { useEffect, useState } from 'react'

import type { CalendarMonthSummary, CashFlowTrendData, NewTransaction, Transaction } from '../types'
import { transactionRepository } from '../repositories/transactionRepository'
import { getRangeStart, getToday, type DateRange } from '../utils/date'
import { flowOf, computeCashFlowTrend } from '../utils/cashflow'
import { computeCalendarMonthSummary } from '../utils/calendar'
import { summarizeExpenseCategories } from '../utils/summary'
import { formatRupiah } from '../utils/format'

const OPENING_BALANCE = 2500000

const isSameDay = (iso: string, day: string) => iso.slice(0, 10) === day

export default function useTransactions(range: DateRange = 'month') {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [loadAttempt, setLoadAttempt] = useState(0)

  useEffect(() => {
    setStatus('loading')
    const unsubscribe = transactionRepository.subscribe(
      (loadedTransactions) => {
        setTransactions(loadedTransactions)
        setStatus('ready')
      },
      (error) => {
        console.error('Subscription error in useTransactions:', error)
        setStatus('error')
      },
    )

    return () => {
      unsubscribe()
    }
  }, [loadAttempt])

  function retryLoad() {
    setStatus('loading')
    setLoadAttempt((attempt) => attempt + 1)
  }

  async function addTransaction(input: NewTransaction) {
    await transactionRepository.add(input)
  }

  async function updateTransaction(id: string, input: Partial<NewTransaction>) {
    await transactionRepository.update(id, input)
  }

  async function removeTransaction(id: string) {
    await transactionRepository.remove(id)
  }

  const today = getToday()
  const rangeStart = getRangeStart(range)

  // Hitung pemasukan, pengeluaran, dan neto periode menggunakan flowOf
  let periodIncome = 0
  let periodExpenses = 0
  const periodTransactions: Transaction[] = []

  for (const t of transactions) {
    const tDay = t.date.slice(0, 10)
    if (tDay >= rangeStart && tDay <= today) {
      periodTransactions.push(t)
      const flow = flowOf(t)
      periodIncome += flow.income
      periodExpenses += flow.expense
    }
  }

  const periodNetFlow = periodIncome - periodExpenses
  const periodOpeningBalance = OPENING_BALANCE

  // Hitung transaksi hari ini menggunakan flowOf
  let todayIncome = 0
  let todayExpenses = 0
  let todayRecordedCount = 0

  for (const t of transactions) {
    if (isSameDay(t.date, today)) {
      const flow = flowOf(t)
      todayIncome += flow.income
      todayExpenses += flow.expense
      if (t.status === 'recorded') {
        todayRecordedCount++
      }
    }
  }

  const netFlowToday = todayIncome - todayExpenses

  // Hitung saldo: saldo awal + akumulasi bersih hingga hari ini
  let totalCumulativeIncome = 0
  let totalCumulativeExpenses = 0

  for (const t of transactions) {
    if (t.date.slice(0, 10) <= today) {
      const flow = flowOf(t)
      totalCumulativeIncome += flow.income
      totalCumulativeExpenses += flow.expense
    }
  }

  const balance = OPENING_BALANCE + totalCumulativeIncome - totalCumulativeExpenses
  const expenseRate = periodIncome === 0 ? 0 : Math.round((periodExpenses / periodIncome) * 100)

  // Ringkasan kategori
  const categorySummary = summarizeExpenseCategories(periodTransactions)

  // Transaksi hari ini untuk tabel (tampilkan semua status, urutkan terbaru)
  const todayTransactions = transactions.filter((t) => isSameDay(t.date, today))
  const newestTodayTransactions = [...todayTransactions].sort((a, b) => b.date.localeCompare(a.date))

  // Tren Arus Kas berdasarkan rentang tanggal
  const cashFlowTrend: CashFlowTrendData = computeCashFlowTrend(
    transactions,
    rangeStart,
    today,
  )

  // Ringkasan Kalender
  const todayParts = today.split('-')
  const currentYear = Number(todayParts[0]) || 2026
  const currentMonth = Number(todayParts[1]) || 10
  const calendarSummary: CalendarMonthSummary = computeCalendarMonthSummary(
    transactions,
    currentYear,
    currentMonth,
    today,
  )

  // Footer status bar dinamis
  const now = new Date()
  const timeStr = `${String(now.getHours()).padStart(2, '0')}.${String(now.getMinutes()).padStart(2, '0')}`
  const footerData = {
    lastUpdatedText: `Semua catatan tersimpan di cloud · diperbarui pukul ${timeStr} WIB`,
    equationText: `Saldo = ${formatRupiah(periodOpeningBalance)} + ${formatRupiah(totalCumulativeIncome)} − ${formatRupiah(totalCumulativeExpenses)}`,
  }

  return {
    status,
    retryLoad,
    transactions,
    addTransaction,
    updateTransaction,
    removeTransaction,
    todayIncome,
    todayExpenses,
    netFlowToday,
    todayRecordedCount,
    periodIncome,
    periodExpenses,
    periodNetFlow,
    periodOpeningBalance,
    expenseRate,
    openingBalance: OPENING_BALANCE,
    balance,
    categorySummary,
    periodTransactions,
    todayTransactions,
    newestTodayTransactions,
    cashFlowTrend,
    calendarSummary,
    footerData,
  }
}
