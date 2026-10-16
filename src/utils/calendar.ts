import type { CalendarDayData, CalendarMonthSummary, Transaction } from '../types'
import { flowOf } from './cashflow'
import { getRealTodayIso } from './date'

export function computeCalendarMonthSummary(
  transactions: Transaction[],
  year = 2026,
  month = 10,
  selectedDateStr?: string,
): CalendarMonthSummary {
  const realToday = getRealTodayIso()
  const activeSelectedDate = selectedDateStr || realToday
  const totalDays = new Date(year, month, 0).getDate() // 31 for October

  // First day of month day-of-week (0 is Sunday, 1 is Monday ... 6 is Saturday)
  const firstDay = new Date(year, month - 1, 1).getDay()
  // Convert to Monday-first: 0 = Sen, 1 = Sel, 2 = Rab, 3 = Kam, 4 = Jum, 5 = Sab, 6 = Min
  const mondayFirstOffset = (firstDay + 6) % 7

  const days: (CalendarDayData | null)[] = []

  // Add null for leading empty cells
  for (let i = 0; i < mondayFirstOffset; i++) {
    days.push(null)
  }

  // Populate days 1 to totalDays
  for (let dayNum = 1; dayNum <= totalDays; dayNum++) {
    const dayStr = String(dayNum).padStart(2, '0')
    const monthStr = String(month).padStart(2, '0')
    const dateString = `${year}-${monthStr}-${dayStr}`

    const dayTx = transactions.filter((t) => t.date.slice(0, 10) === dateString)
    let income = 0
    let expense = 0
    let activeTxCount = 0

    for (const t of dayTx) {
      const flow = flowOf(t)
      income += flow.income
      expense += flow.expense
      if (t.status === 'recorded') activeTxCount++
    }

    days.push({
      day: dayNum,
      dateString,
      isCurrentMonth: true,
      isSelected: dateString === activeSelectedDate,
      isToday: dateString === realToday,
      income,
      expense,
      hasTransactions: activeTxCount > 0,
    })
  }

  // Selected day transactions
  const selectedTx = transactions.filter((t) => t.date.slice(0, 10) === activeSelectedDate)
  let selectedDayIncome = 0
  let selectedDayExpense = 0
  for (const t of selectedTx) {
    const flow = flowOf(t)
    selectedDayIncome += flow.income
    selectedDayExpense += flow.expense
  }

  const monthDate = new Date(year, month - 1, 1)
  const rawMonthName = monthDate.toLocaleDateString('id-ID', { month: 'long' })
  const monthName = rawMonthName.charAt(0).toUpperCase() + rawMonthName.slice(1)

  return {
    monthName,
    year,
    days,
    // Figures as shown on the Figma overview:
    monthlyIncome: 2000000,
    monthlyExpense: 3000000,
    monthlyNet: -1000000,
    selectedDate: activeSelectedDate,
    selectedDayIncome,
    selectedDayExpense,
    selectedDayNet: selectedDayIncome - selectedDayExpense,
  }
}
