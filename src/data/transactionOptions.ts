export const TRANSACTION_CATEGORIES = [
  'Pekerjaan',
  'Bisnis',
  'Makanan',
  'Belanja',
  'Tagihan',
  'Transportasi',
] as const

export const TRANSACTION_SOURCES = ['BCA', 'Mandiri', 'Tunai', 'GoPay', 'Internal'] as const

export type TransactionCategory = (typeof TRANSACTION_CATEGORIES)[number]
export type TransactionSource = (typeof TRANSACTION_SOURCES)[number]
