const DEMO_TODAY = '2026-10-08'
export type DateRange = 'week' | 'month' | 'year'

export function getToday(): string {
  return DEMO_TODAY
}

export function getLocalTime(date = new Date()): string {
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${hours}:${minutes}`
}

export function getRangeStart(range: DateRange): string {
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
