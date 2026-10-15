type FormatOptions = { signed?: boolean }
const rupiahFormatter = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 })

export function formatRupiah(amount: number, { signed = false }: FormatOptions = {}): string {
  const sign = amount < 0 ? '−' : amount > 0 && signed ? '+' : ''
  return `${sign}Rp${rupiahFormatter.format(Math.abs(amount))}`
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)

  if (Number.isNaN(date.getTime())) {
    return '-'
  }

  const formattedDate = date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  const formattedTime = date.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  })

  return `${formattedDate} · ${formattedTime}`
}

export function formatShortRupiah(amount: number): string {
  const abs = Math.abs(amount)
  if (abs >= 1_000_000) {
    const val = abs / 1_000_000
    return `${val % 1 === 0 ? val : val.toFixed(1)}jt`
  }
  if (abs >= 1_000) {
    const val = abs / 1_000
    return `${val % 1 === 0 ? val : val.toFixed(0)}rb`
  }
  return String(abs)
}
