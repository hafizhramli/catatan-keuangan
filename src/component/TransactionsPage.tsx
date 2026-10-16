import { useMemo, useState } from 'react'
import {
  ArrowDownLeft,
  ArrowUpDown,
  ArrowUpRight,
  CheckCircle2,
  Plus,
  Search,
  Upload,
  Wallet,
  X,
} from 'lucide-react'
import type { Transaction } from '../types'
import { TRANSACTION_STATUS_BADGE } from '../types'
import { TRANSACTION_CATEGORIES, TRANSACTION_SOURCES } from '../data/transactionOptions'
import { getCategoryIcon } from '../data/categoryIcons'
import { flowOf } from '../utils/cashflow'
import { formatRupiah } from '../utils/format'
import Card from './Card'
import Button from './Button'
import Badge from './Badge'
import Select from './Select'
import SummaryCard from './SummaryCard'
import TransactionRow from './TransactionRow'

import './TransactionsPage.css'

export type TransactionsPageProps = {
  transactions: Transaction[]
  onAddTransaction: () => void
  onEditTransaction: (transaction: Transaction) => void
  onRemoveTransaction: (id: string) => Promise<void>
  disabled?: boolean
}

function formatFullIndonesianDate(dateString: string): string {
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return dateString
  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatShortIndonesianDate(dateString: string): string {
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return dateString
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatTime(dateString: string): string {
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return '-'
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}.${minutes}`
}

function exportToCSV(transactions: Transaction[]) {
  const headers = ['ID', 'Nama', 'Kategori', 'Sumber', 'Tipe', 'Status', 'Nominal', 'Tanggal', 'Catatan']
  const rows = transactions.map((t) => [
    t.id,
    `"${t.name.replace(/"/g, '""')}"`,
    t.category,
    t.source,
    t.type,
    t.status,
    t.amount,
    t.date,
    `"${(t.note || '').replace(/"/g, '""')}"`,
  ])
  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `transaksi-${new Date().toISOString().slice(0, 10)}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

function TransactionsPage({
  transactions,
  onAddTransaction,
  onEditTransaction,
  onRemoveTransaction,
  disabled = false,
}: TransactionsPageProps) {
  // Extract unique dates available in dataset
  const uniqueDates = useMemo(() => {
    const dates = new Set<string>()
    for (const t of transactions) {
      if (t.date) {
        dates.add(t.date.slice(0, 10))
      }
    }
    return Array.from(dates).sort((a, b) => b.localeCompare(a))
  }, [transactions])

  // Default to '2026-10-08' if present, otherwise first available date or 'all'
  const defaultDate = useMemo(() => {
    if (uniqueDates.includes('2026-10-08')) return '2026-10-08'
    return uniqueDates[0] || 'all'
  }, [uniqueDates])

  const [dateFilter, setDateFilter] = useState<string>(() => defaultDate)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')

  // Filter by active period (Tanggal) for summary calculations
  const activePeriodTransactions = useMemo(() => {
    if (dateFilter === 'all') return transactions
    return transactions.filter((t) => t.date.slice(0, 10) === dateFilter)
  }, [transactions, dateFilter])

  // Summary stats based on active period
  const { summaryIncome, summaryExpense, summaryNet, incomeCount, expenseCount } = useMemo(() => {
    let income = 0
    let expense = 0
    let inCount = 0
    let exCount = 0

    for (const t of activePeriodTransactions) {
      const flow = flowOf(t)
      income += flow.income
      expense += flow.expense
      if (flow.income > 0) inCount++
      if (flow.expense > 0) exCount++
    }

    return {
      summaryIncome: income,
      summaryExpense: expense,
      summaryNet: income - expense,
      incomeCount: inCount,
      expenseCount: exCount,
    }
  }, [activePeriodTransactions])

  // Multi-filtered transactions for table
  const filteredTransactions = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase('id-ID')
    const list = activePeriodTransactions.filter((transaction) => {
      const matchesSearch =
        !query ||
        transaction.name.toLocaleLowerCase('id-ID').includes(query) ||
        transaction.category.toLocaleLowerCase('id-ID').includes(query) ||
        transaction.source.toLocaleLowerCase('id-ID').includes(query)
      const matchesType = typeFilter === 'all' || transaction.type === typeFilter
      const matchesCategory = categoryFilter === 'all' || transaction.category === categoryFilter
      const matchesSource = sourceFilter === 'all' || transaction.source === sourceFilter
      const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter

      return matchesSearch && matchesType && matchesCategory && matchesSource && matchesStatus
    })

    return list.sort((a, b) => {
      if (sortOrder === 'newest') return b.date.localeCompare(a.date)
      return a.date.localeCompare(b.date)
    })
  }, [
    activePeriodTransactions,
    searchQuery,
    typeFilter,
    categoryFilter,
    sourceFilter,
    statusFilter,
    sortOrder,
  ])

  // Selected transaction for right-side detail panel
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null)

  const selectedTransaction = useMemo(() => {
    if (selectedTransactionId) {
      const found = transactions.find((t) => t.id === selectedTransactionId)
      if (found) return found
    }
    // Default selection to "Proyek desain lepas" or first filtered transaction
    const target =
      filteredTransactions.find((t) => t.name.toLowerCase().includes('proyek desain lepas')) ||
      filteredTransactions[0] ||
      null
    return target
  }, [selectedTransactionId, transactions, filteredTransactions])

  // Indonesian date labels
  const selectedDateLabel = useMemo(() => {
    if (dateFilter === 'all') return 'Semua Periode'
    return formatFullIndonesianDate(`${dateFilter}T12:00:00`)
  }, [dateFilter])

  const selectedDateShort = useMemo(() => {
    if (dateFilter === 'all') return 'Semua tanggal'
    return formatShortIndonesianDate(`${dateFilter}T12:00:00`)
  }, [dateFilter])

  function toggleSortOrder() {
    setSortOrder((prev) => (prev === 'newest' ? 'oldest' : 'newest'))
  }

  const SelectedCategoryIcon = selectedTransaction ? getCategoryIcon(selectedTransaction.category) : null

  return (
    <div className="transactions-page">
      {/* 1. Header Halaman */}
      <header className="transactions-header">
        <div className="transactions-header__titles">
          <span className="transactions-header__kicker">Keuangan pribadi</span>
          <h1 className="transactions-header__title">Transaksi</h1>
          <p className="transactions-header__subtitle">
            Semua pemasukan dan pengeluaran, dalam satu catatan rapi.
          </p>
        </div>

        <div className="transactions-header__actions">
          <Button
            className="transactions-export-btn"
            variant="secondary"
            type="button"
            onClick={() => exportToCSV(filteredTransactions)}
            aria-label="Ekspor data transaksi ke CSV"
          >
            <Upload size={16} aria-hidden="true" />
            <span>Ekspor</span>
          </Button>

          <Button
            className="transactions-add-btn"
            variant="primary"
            type="button"
            disabled={disabled}
            onClick={onAddTransaction}
          >
            <Plus size={18} strokeWidth={2.2} aria-hidden="true" />
            <span>Tambah transaksi</span>
          </Button>
        </div>
      </header>

      {/* 2. Subheader Tanggal & Jumlah Transaksi */}
      <div className="transactions-subheader">
        <h2 className="transactions-subheader__date">{selectedDateLabel}</h2>
        <span className="transactions-subheader__count">
          {activePeriodTransactions.length} transaksi tercatat
        </span>
      </div>

      {/* 3. Tiga Kartu Ringkasan (Summary Cards) */}
      <section className="transactions-summary-grid" aria-label="Ringkasan transaksi periode ini">
        <SummaryCard
          title="Dana masuk"
          amount={summaryIncome}
          footnote={`${incomeCount} transaksi pemasukan · ${selectedDateShort}`}
          variant="income"
          valueClassName="summary-value--neutral"
          icon={<ArrowDownLeft size={20} strokeWidth={2.2} aria-hidden="true" />}
        />
        <SummaryCard
          title="Dana keluar"
          amount={summaryExpense}
          footnote={`${expenseCount} transaksi pengeluaran · ${selectedDateShort}`}
          variant="expense"
          icon={<ArrowUpRight size={20} strokeWidth={2.2} aria-hidden="true" />}
        />
        <SummaryCard
          title="Selisih periode"
          amount={summaryNet}
          footnote={`Dana masuk – dana keluar · ${selectedDateShort}`}
          variant="balance"
          signed={true}
          icon={<Wallet size={18} aria-hidden="true" />}
        />
      </section>

      {/* 4. Kartu Pencarian & Multi-Filter */}
      <Card className="transactions-filter-card">
        {/* Baris Pencarian */}
        <div className="transactions-search-row">
          <div className="transactions-search-input-wrap">
            <Search size={18} className="transactions-search-icon" aria-hidden="true" />
            <input
              type="search"
              className="transactions-search-input"
              placeholder="Cari nama transaksi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Cari nama transaksi"
            />
          </div>
          <span className="transactions-search-hint">Cari dalam periode aktif</span>
        </div>

        {/* Baris 5 Dropdown Filter */}
        <div className="transactions-dropdowns-grid">
          {/* Filter Tanggal */}
          <div className="filter-item">
            <Select
              label="Tanggal"
              size="small"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              options={[
                ...uniqueDates.map((d) => ({
                  label: formatShortIndonesianDate(`${d}T12:00:00`),
                  value: d,
                })),
                { label: 'Semua tanggal', value: 'all' },
              ]}
            />
          </div>

          {/* Filter Jenis */}
          <div className="filter-item">
            <Select
              label="Jenis"
              size="small"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              options={[
                { label: 'Semua jenis', value: 'all' },
                { label: 'Pemasukan', value: 'income' },
                { label: 'Pengeluaran', value: 'expense' },
              ]}
            />
          </div>

          {/* Filter Kategori */}
          <div className="filter-item">
            <Select
              label="Kategori"
              size="small"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              options={[
                { label: 'Semua kategori', value: 'all' },
                ...TRANSACTION_CATEGORIES.map((c) => ({ label: c, value: c })),
              ]}
            />
          </div>

          {/* Filter Sumber dana */}
          <div className="filter-item">
            <Select
              label="Sumber dana"
              size="small"
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              options={[
                { label: 'Semua sumber', value: 'all' },
                ...TRANSACTION_SOURCES.map((s) => ({ label: s, value: s })),
              ]}
            />
          </div>

          {/* Filter Status */}
          <div className="filter-item">
            <Select
              label="Status"
              size="small"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { label: 'Semua status', value: 'all' },
                { label: 'Tercatat', value: 'recorded' },
                { label: 'Menunggu', value: 'pending' },
                { label: 'Dibatalkan', value: 'cancelled' },
                { label: 'Dikembalikan', value: 'refunded' },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* 5. Layout Dua Kolom: Tabel Daftar Transaksi (Kiri) & Rincian Transaksi (Kanan) */}
      <div className="transactions-content-columns">
        {/* Kolom Kiri: Tabel Transaksi */}
        <div className="transactions-table-column">
          <Card className="transactions-table-card">
            {/* Header Tabel */}
            <div className="transactions-table-card__header">
              <div className="transactions-table-card__titles">
                <h3 className="transactions-table-card__title">Daftar transaksi</h3>
                <p className="transactions-table-card__subtitle">
                  {selectedDateShort} · {activePeriodTransactions.length} transaksi
                </p>
              </div>

              <button
                type="button"
                className="transactions-sort-btn"
                onClick={toggleSortOrder}
                aria-label="Ubah urutan transaksi"
              >
                <ArrowUpDown size={14} aria-hidden="true" />
                <span>{sortOrder === 'newest' ? 'Terbaru dahulu' : 'Terlama dahulu'}</span>
              </button>
            </div>

            {/* Scrollable Table */}
            <div className="transactions-table-scroll">
              <table className="transactions-table">
                <thead>
                  <tr>
                    <th scope="col">Transaksi / tanggal & waktu</th>
                    <th scope="col">Kategori</th>
                    <th scope="col">Sumber</th>
                    <th scope="col">Status</th>
                    <th scope="col" className="transactions-amount-header">
                      Nominal
                    </th>
                    <th scope="col" className="transactions-actions-header" aria-label="Aksi"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.length > 0 ? (
                    filteredTransactions.map((transaction) => (
                      <TransactionRow
                        key={transaction.id}
                        transaction={transaction}
                        isSelected={selectedTransaction?.id === transaction.id}
                        onSelect={() => setSelectedTransactionId(transaction.id)}
                        showIcon={false}
                        onEdit={onEditTransaction}
                        onRemove={onRemoveTransaction}
                      />
                    ))
                  ) : (
                    <tr>
                      <td className="transactions-empty" colSpan={6}>
                        Tidak ada transaksi yang cocok dengan filter yang dipilih.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer Tabel */}
            <div className="transactions-table-card__footer">
              <span className="transactions-table-card__count">
                Menampilkan {filteredTransactions.length} dari {activePeriodTransactions.length} transaksi
              </span>
              <span className="transactions-table-card__period-note">
                Seluruh transaksi pada periode ini
              </span>
            </div>
          </Card>

          {/* Catatan Bawah Tabel */}
          <div className="transactions-note">
            <CheckCircle2 size={16} className="transactions-note__icon" aria-hidden="true" />
            <span>Semua transaksi tercatat. Pilih baris untuk melihat rinciannya.</span>
          </div>
        </div>

        {/* Kolom Kanan: Rincian Transaksi */}
        <div className="transactions-detail-column">
          <Card className="transactions-detail-card">
            {/* Header Rincian */}
            <div className="transactions-detail-card__header">
              <h3 className="transactions-detail-card__title">Rincian transaksi</h3>
              {selectedTransaction ? (
                <button
                  type="button"
                  className="transactions-detail-close-btn"
                  onClick={() => setSelectedTransactionId(null)}
                  aria-label="Tutup rincian transaksi"
                >
                  <X size={18} aria-hidden="true" />
                </button>
              ) : null}
            </div>

            {selectedTransaction ? (
              <div className="transactions-detail-body">
                {/* Hero Icon Tile */}
                <div className="transactions-detail-tile" aria-hidden="true">
                  {SelectedCategoryIcon ? <SelectedCategoryIcon size={24} /> : null}
                </div>

                {/* Judul & Nominal */}
                <h4 className="transactions-detail-name">{selectedTransaction.name}</h4>
                <div
                  className={`transactions-detail-amount transactions-detail-amount--${selectedTransaction.type}`}
                >
                  {formatRupiah(
                    selectedTransaction.type === 'expense' || selectedTransaction.status === 'refunded'
                      ? -selectedTransaction.amount
                      : selectedTransaction.amount,
                    { signed: true },
                  )}
                </div>

                {/* Badge Status */}
                <div className="transactions-detail-badge-wrap">
                  <Badge tone={TRANSACTION_STATUS_BADGE[selectedTransaction.status]?.tone ?? 'neutral'}>
                    {TRANSACTION_STATUS_BADGE[selectedTransaction.status]?.label ?? selectedTransaction.status}
                  </Badge>
                </div>

                {/* List Data Kunci/Nilai */}
                <dl className="transactions-detail-list">
                  <div className="transactions-detail-row">
                    <dt>Tanggal</dt>
                    <dd>{formatShortIndonesianDate(selectedTransaction.date)}</dd>
                  </div>
                  <div className="transactions-detail-row">
                    <dt>Waktu</dt>
                    <dd>{formatTime(selectedTransaction.date)}</dd>
                  </div>
                  <div className="transactions-detail-row">
                    <dt>Jenis</dt>
                    <dd>{selectedTransaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}</dd>
                  </div>
                  <div className="transactions-detail-row">
                    <dt>Kategori</dt>
                    <dd>{selectedTransaction.category}</dd>
                  </div>
                  <div className="transactions-detail-row">
                    <dt>Sumber dana</dt>
                    <dd>{selectedTransaction.source}</dd>
                  </div>
                  {selectedTransaction.note ? (
                    <div className="transactions-detail-row">
                      <dt>Catatan</dt>
                      <dd>{selectedTransaction.note}</dd>
                    </div>
                  ) : null}
                </dl>

                {/* Tombol Ubah Transaksi */}
                <Button
                  className="transactions-detail-edit-btn"
                  variant="secondary"
                  type="button"
                  onClick={() => onEditTransaction(selectedTransaction)}
                >
                  Ubah transaksi
                </Button>
              </div>
            ) : (
              <div className="transactions-detail-empty">
                <p>Pilih baris pada daftar transaksi di sebelah kiri untuk melihat rincian lengkapnya.</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}

export default TransactionsPage
