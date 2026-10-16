import { useEffect, useState } from 'react'

import type { CalendarMonthSummary, CashFlowTrendData, NewTransaction, Transaction } from '../types'
import { transactionRepository } from '../repositories/transactionRepository'
import { getRangeStart, getRealTodayIso, getToday, type DateRange, type DateRangeValue } from '../utils/date'
import { flowOf, computeCashFlowTrend } from '../utils/cashflow'
import { computeCalendarMonthSummary } from '../utils/calendar'
import { summarizeExpenseCategories } from '../utils/summary'
import { formatRupiah } from '../utils/format'

const OPENING_BALANCE = 2500000

const isSameDay = (iso: string, day: string) => iso.slice(0, 10) === day

export default function useTransactions(range: DateRange | DateRangeValue = 'month') {
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

  const demoToday = getToday()
  const realToday = getRealTodayIso()

  let rangeStart: string
  let rangeEnd: string

  if (typeof range === 'object' && range !== null) {
    rangeStart = range.startDate
    rangeEnd = range.endDate
  } else {
    rangeStart = getRangeStart(range)
    rangeEnd = demoToday
  }

  // Hitung pemasukan, pengeluaran, dan neto periode menggunakan flowOf
  let periodIncome = 0
  let periodExpenses = 0
  const periodTransactions: Transaction[] = []

  for (const t of transactions) {
    const tDay = t.date.slice(0, 10)
    if (tDay >= rangeStart && tDay <= rangeEnd) {
      periodTransactions.push(t)
      const flow = flowOf(t)
      periodIncome += flow.income
      periodExpenses += flow.expense
    }
  }

  const periodNetFlow = periodIncome - periodExpenses
  const periodOpeningBalance = OPENING_BALANCE

  // Hitung transaksi hari ini menggunakan flowOf (gunakan realToday jika ada transaksi, atau fallback ke demoToday)
  const isTodayTransactionsAvailable = transactions.some((t) => isSameDay(t.date, realToday))
  const activeTodayDate = isTodayTransactionsAvailable ? realToday : demoToday

  let todayIncome = 0
  let todayExpenses = 0
  let todayRecordedCount = 0

  for (const t of transactions) {
    if (isSameDay(t.date, activeTodayDate)) {
      const flow = flowOf(t)
      todayIncome += flow.income
      todayExpenses += flow.expense
      if (t.status === 'recorded') {
        todayRecordedCount++
      }
    }
  }

  const netFlowToday = todayIncome - todayExpenses

  // Hitung saldo: saldo awal + akumulasi bersih hingga rentang tanggal
  let totalCumulativeIncome = 0
  let totalCumulativeExpenses = 0

  for (const t of transactions) {
    if (t.date.slice(0, 10) <= rangeEnd) {
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
  const todayTransactions = transactions.filter((t) => isSameDay(t.date, activeTodayDate))
  const newestTodayTransactions = [...todayTransactions].sort((a, b) => b.date.localeCompare(a.date))

  // Tren Arus Kas berdasarkan rentang tanggal
  const cashFlowTrend: CashFlowTrendData = computeCashFlowTrend(
    transactions,
    rangeStart,
    rangeEnd,
  )

  // Ringkasan Kalender menggunakan tanggal sekarang (realtime)
  const realTodayParts = realToday.split('-')
  const currentYear = Number(realTodayParts[0]) || 2026
  const currentMonth = Number(realTodayParts[1]) || 10
  const calendarSummary: CalendarMonthSummary = computeCalendarMonthSummary(
    transactions,
    currentYear,
    currentMonth,
    realToday,
  )

  // Footer status bar dinamis
  let updateTime = '14.20'
  if (newestTodayTransactions.length > 0) {
    const latestDate = new Date(newestTodayTransactions[0].date)
    if (!isNaN(latestDate.getTime())) {
      updateTime = `${String(latestDate.getHours()).padStart(2, '0')}.${String(latestDate.getMinutes()).padStart(2, '0')}`
    }
  } else {
    const now = new Date()
    updateTime = `${String(now.getHours()).padStart(2, '0')}.${String(now.getMinutes()).padStart(2, '0')}`
  }

  const footerData = {
    lastUpdatedText: `Semua catatan tersimpan · diperbarui pukul ${updateTime} WIB`,
    equationText: `Saldo = ${formatRupiah(periodOpeningBalance)} + ${formatRupiah(totalCumulativeIncome)} – ${formatRupiah(totalCumulativeExpenses)}`,
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
