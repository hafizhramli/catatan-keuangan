import { useEffect, useState } from 'react'

import type {
  CalendarMonthSummary,
  CashFlowTrendData,
  DashboardSummary,
  NewTransaction,
  Transaction,
} from '../types'
import { transactionRepository } from '../repositories/transactionRepository'
import { computeCashFlowTrend } from '../utils/cashflow'
import { computeCalendarMonthSummary } from '../utils/calendar'
import { getRangeStart, getToday, type DateRange } from '../utils/date'
import { sumTransactions, summarizeExpenseCategories, type CategorySummary } from '../utils/summary'

const OPENING_BALANCE = 2500000

const isSameDay = (iso: string, day: string) => iso.slice(0, 10) === day

export function useDashboardViewModel() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [loadAttempt, setLoadAttempt] = useState(0)

  // Filters & UI States
  const [dateRange, setDateRange] = useState<DateRange>('month')
  const [selectedDate, setSelectedDate] = useState<string>('2026-10-08')
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  useEffect(() => {
    let isActive = true

    transactionRepository
      .getAll()
      .then((loaded) => {
        if (isActive) {
          setTransactions(loaded)
          setStatus('ready')
        }
      })
      .catch(() => {
        if (isActive) setStatus('error')
      })

    return () => {
      isActive = false
    }
  }, [loadAttempt])

  function retryLoad() {
    setStatus('loading')
    setLoadAttempt((a) => a + 1)
  }

  async function addTransaction(input: NewTransaction) {
    const newTx = await transactionRepository.add(input)
    setTransactions((prev) => [...prev, newTx])
  }

  async function removeTransaction(id: string) {
    await transactionRepository.remove(id)
    setTransactions((prev) => prev.filter((tx) => tx.id !== id))
  }

  function openAddDialog() {
    setIsAddDialogOpen(true)
  }

  function closeAddDialog() {
    setIsAddDialogOpen(false)
  }

  // --- DERIVASI MODEL KE PRESENTATION (VIEWMODEL LOGIC) ---
  const today = getToday() // '2026-10-08'
  const rangeStart = getRangeStart(dateRange)

  // Aturan hitung terpusat: hanya transaksi sah berstatus 'recorded'
  const counted = transactions.filter((t) => t.status === 'recorded')

  // Transaksi periode
  const periodTransactions = counted.filter((t) => {
    const day = t.date.slice(0, 10)
    return day >= rangeStart && day <= today
  })

  // Transaksi saldo (sampai hari ini)
  const balanceTransactions = counted.filter((t) => t.date.slice(0, 10) <= today)

  // Transaksi hari ini yang dihitung
  const countedTodayTransactions = counted.filter((t) => isSameDay(t.date, today))

  const periodIncome = sumTransactions(periodTransactions, 'income')
  const periodExpenses = sumTransactions(periodTransactions, 'expense')
  const periodNetFlow = periodIncome - periodExpenses

  const todayIncome = sumTransactions(countedTodayTransactions, 'income')
  const todayExpenses = sumTransactions(countedTodayTransactions, 'expense')
  const netFlowToday = todayIncome - todayExpenses

  const expenseRate = periodIncome === 0 ? 0 : Math.round((periodExpenses / periodIncome) * 100)

  const balance =
    OPENING_BALANCE +
    sumTransactions(balanceTransactions, 'income') -
    sumTransactions(balanceTransactions, 'expense')

  const summary: DashboardSummary = {
    balance,
    openingBalance: OPENING_BALANCE,
    periodIncome,
    periodExpenses,
    periodNetFlow,
    todayIncome,
    todayExpenses,
    netFlowToday,
    expenseRate,
  }

  // Tren arus kas
  const cashFlowTrend: CashFlowTrendData = computeCashFlowTrend(
    transactions,
    '2026-10-01',
    '2026-10-08',
  )

  // Kategori pengeluaran
  const categorySummary: CategorySummary[] = summarizeExpenseCategories(periodTransactions)

  // Transaksi hari ini (untuk tabel)
  const allTodayTransactions = transactions.filter((t) => isSameDay(t.date, today))
  const filteredTodayTransactions = allTodayTransactions
    .filter((tx) => {
      const query = searchQuery.trim().toLocaleLowerCase('id-ID')
      const matchesQuery = !query || tx.name.toLocaleLowerCase('id-ID').includes(query)
      const matchesCategory = categoryFilter === 'all' || tx.category === categoryFilter
      return matchesQuery && matchesCategory
    })
    .sort((a, b) => b.date.localeCompare(a.date))

  const todayRecordedCount = countedTodayTransactions.length

  // Kalender Oktober 2026
  const calendarSummary: CalendarMonthSummary = computeCalendarMonthSummary(
    transactions,
    2026,
    10,
    selectedDate,
  )

  // Footer data
  const footerData = {
    lastUpdatedText: 'Semua catatan tersimpan · diperbarui pukul 14.20 WIB',
    equationText: `Saldo = Rp2.500.000 + Rp8.000.000 − Rp2.400.000`,
  }

  return {
    status,
    retryLoad,
    dateRange,
    setDateRange,
    selectedDate,
    setSelectedDate,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    isAddDialogOpen,
    openAddDialog,
    closeAddDialog,
    addTransaction,
    removeTransaction,
    // Prepared presentation models
    summary,
    cashFlowTrend,
    categorySummary,
    todayTransactions: filteredTodayTransactions,
    todayRecordedCount,
    calendarSummary,
    footerData,
  }
}
