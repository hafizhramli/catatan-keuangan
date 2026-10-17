const DEMO_TODAY = '2026-10-08'

export type DateRangeValue = {
  startDate: string // 'YYYY-MM-DD'
  endDate: string   // 'YYYY-MM-DD'
  label: string     // e.g. '1–16 Oktober 2026'
  note?: string     // e.g. 'Bulan ini, hingga hari ini'
  preset?: string   // 'this-month-to-date' | 'last-7-days' | 'last-30-days' | 'this-month-full' | 'last-month' | 'this-year' | 'custom'
}

export type DateRange = 'week' | 'month' | 'year' | DateRangeValue

export function getToday(): string {
  return DEMO_TODAY
}

export function getRealTodayIso(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function getLocalTime(date = new Date()): string {
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${hours}:${minutes}`
}

export function formatCurrentDate(date = new Date()): string {
  const formatted = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)

  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

export function getRangeStart(range: DateRange): string {
  if (typeof range === 'object' && range !== null) {
    return range.startDate
  }

  const date = new Date(`${getToday()}T00:00:00`)

  if (range === 'week') {
    date.setDate(date.getDate() - 6)
  } else if (range === 'month') {
    date.setDate(1)
  } else {
    date.setMonth(0, 1)
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function formatDateRangeLabel(startDateStr: string, endDateStr: string): string {
  if (!startDateStr || !endDateStr) return ''
  const [sy, sm, sd] = startDateStr.split('-').map(Number)
  const [ey, em, ed] = endDateStr.split('-').map(Number)

  const sDate = new Date(sy, sm - 1, sd)
  const eDate = new Date(ey, em - 1, ed)

  if (startDateStr === endDateStr) {
    return sDate.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  // Sama bulan & tahun: "1–16 Oktober 2026"
  if (sy === ey && sm === em) {
    const monthYear = eDate.toLocaleDateString('id-ID', {
      month: 'long',
      year: 'numeric',
    })
    return `${sd}–${ed} ${monthYear}`
  }

  // Tahun sama, bulan beda: "25 Sep – 10 Okt 2026"
  if (sy === ey) {
    const sMonth = sDate.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })
    const eMonthYear = eDate.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
    return `${sMonth} – ${eMonthYear}`
  }

  // Tahun berbeda: "20 Des 2025 – 10 Jan 2026"
  const sFull = sDate.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  const eFull = eDate.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  return `${sFull} – ${eFull}`
}

export function getDefaultDateRange(now = new Date()): DateRangeValue {
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = now.getDate()
  const dayStr = String(day).padStart(2, '0')

  const startDate = `${year}-${month}-01`
  const endDate = `${year}-${month}-${dayStr}`
  const monthName = now.toLocaleDateString('id-ID', { month: 'long' })
  const label = day === 1 ? `1 ${monthName} ${year}` : `1–${day} ${monthName} ${year}`

  return {
    startDate,
    endDate,
    label,
    preset: 'this-month-to-date',
    note: 'Bulan ini, hingga hari ini',
  }
}

export function getDateRangePresets(now = new Date()) {
  const year = now.getFullYear()
  const month = now.getMonth() // 0-based
  const day = now.getDate()

  const pad = (n: number) => String(n).padStart(2, '0')

  // 1. Bulan ini (hingga hari ini) - DEFAULT REALTIME
  const thisMonthStart = `${year}-${pad(month + 1)}-01`
  const todayIso = `${year}-${pad(month + 1)}-${pad(day)}`
  const monthName = now.toLocaleDateString('id-ID', { month: 'long' })

  // 2. Bulan ini (penuh)
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate()
  const thisMonthEnd = `${year}-${pad(month + 1)}-${pad(lastDayOfMonth)}`

  // 3. 7 hari terakhir
  const d7 = new Date(now)
  d7.setDate(d7.getDate() - 6)
  const last7DaysStart = `${d7.getFullYear()}-${pad(d7.getMonth() + 1)}-${pad(d7.getDate())}`

  // 4. 30 hari terakhir
  const d30 = new Date(now)
  d30.setDate(d30.getDate() - 29)
  const last30DaysStart = `${d30.getFullYear()}-${pad(d30.getMonth() + 1)}-${pad(d30.getDate())}`

  // 5. Bulan lalu
  const lastMonthDate = new Date(year, month - 1, 1)
  const lmYear = lastMonthDate.getFullYear()
  const lmMonth = lastMonthDate.getMonth()
  const lmEndDay = new Date(lmYear, lmMonth + 1, 0).getDate()
  const lastMonthStart = `${lmYear}-${pad(lmMonth + 1)}-01`
  const lastMonthEnd = `${lmYear}-${pad(lmMonth + 1)}-${pad(lmEndDay)}`
  const lmMonthName = lastMonthDate.toLocaleDateString('id-ID', { month: 'long' })

  // 6. Tahun ini
  const thisYearStart = `${year}-01-01`

  return [
    {
      id: 'this-month-to-date',
      name: 'Bulan ini (hingga hari ini)',
      startDate: thisMonthStart,
      endDate: todayIso,
      label: day === 1 ? `1 ${monthName} ${year}` : `1–${day} ${monthName} ${year}`,
      note: 'Bulan ini, hingga hari ini',
    },
    {
      id: 'last-7-days',
      name: '7 hari terakhir',
      startDate: last7DaysStart,
      endDate: todayIso,
      label: formatDateRangeLabel(last7DaysStart, todayIso),
      note: '7 hari terakhir',
    },
    {
      id: 'last-30-days',
      name: '30 hari terakhir',
      startDate: last30DaysStart,
      endDate: todayIso,
      label: formatDateRangeLabel(last30DaysStart, todayIso),
      note: '30 hari terakhir',
    },
    {
      id: 'this-month-full',
      name: 'Bulan ini (penuh)',
      startDate: thisMonthStart,
      endDate: thisMonthEnd,
      label: `1–${lastDayOfMonth} ${monthName} ${year}`,
      note: `1–${lastDayOfMonth} ${monthName}`,
    },
    {
      id: 'last-month',
      name: 'Bulan lalu',
      startDate: lastMonthStart,
      endDate: lastMonthEnd,
      label: `1–${lmEndDay} ${lmMonthName} ${lmYear}`,
      note: `Bulan ${lmMonthName}`,
    },
    {
      id: 'this-year',
      name: 'Tahun ini',
      startDate: thisYearStart,
      endDate: todayIso,
      label: `1 Jan – ${day} ${now.toLocaleDateString('id-ID', { month: 'short' })} ${year}`,
      note: `Tahun ${year}`,
    },
  ]
}
