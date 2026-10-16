import { useEffect, useRef, useState } from 'react'
import { ArrowDownLeft, ArrowRight, ArrowUpRight, CheckCircle2, Search, Wallet, X } from 'lucide-react'
import { getDefaultDateRange, type DateRangeValue } from './utils/date'
import type { Transaction } from './types'

import useTransactions from './viewmodels/useTransactions'
import AppShell from './component/AppShell'
import PageHeader from './component/PageHeader'
import TransactionsPage from './component/TransactionsPage'
import TransactionForm from './component/TransactionForm'
import SummaryCard from './component/SummaryCard'
import TransactionRow from './component/TransactionRow'
import Button from './component/Button'
import Card from './component/Card'
import Input from './component/Input'
import Select from './component/Select'
import CashFlowChart from './component/CashFlowChart'
import CalendarWidget from './component/CalendarWidget'
import CategoryCard from './component/CategoryCard'
import { formatRupiah } from './utils/format'
import { TRANSACTION_CATEGORIES } from './data/transactionOptions'

import './App.css'
import './Dashboard.css'

function App() {
  const [activeTab, setActiveTab] = useState<'transaksi' | 'ringkasan'>(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#ringkasan') {
      return 'ringkasan'
    }
    return 'transaksi'
  })

  useEffect(() => {
    function handleHashChange() {
      const hash = window.location.hash
      if (hash === '#ringkasan') {
        setActiveTab('ringkasan')
      } else {
        setActiveTab('transaksi')
      }
    }

    window.addEventListener('hashchange', handleHashChange)
    if (!window.location.hash) {
      window.location.hash = '#transaksi'
    }
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  useEffect(() => {
    const mainEl = document.querySelector('.app-main')
    if (mainEl) {
      mainEl.scrollTop = 0
    }
  }, [activeTab])

  const [dateRange, setDateRange] = useState<DateRangeValue>(() => getDefaultDateRange())
  const {
    status,
    retryLoad,
    transactions,
    addTransaction,
    updateTransaction,
    removeTransaction,
    periodIncome,
    periodExpenses,
    periodOpeningBalance,
    todayIncome,
    todayExpenses,
    netFlowToday,
    todayRecordedCount,
    expenseRate,
    balance,
    categorySummary,
    newestTodayTransactions,
    cashFlowTrend,
    calendarSummary,
    footerData,
  } = useTransactions(dateRange)

  const transactionDialogRef = useRef<HTMLDialogElement>(null)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [transactionFormKey, setTransactionFormKey] = useState(0)
  const [transactionQuery, setTransactionQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const filteredTransactions = newestTodayTransactions.filter((transaction) => {
    const query = transactionQuery.trim().toLocaleLowerCase('id-ID')
    const matchesQuery = !query || transaction.name.toLocaleLowerCase('id-ID').includes(query)
    const matchesCategory = categoryFilter === 'all' || transaction.category === categoryFilter
    return matchesQuery && matchesCategory
  })

  function openTransactionDialog() {
    const dialog = transactionDialogRef.current
    if (dialog && !dialog.open) {
      dialog.showModal()
      const autofocusTarget =
        dialog.querySelector<HTMLInputElement>('[data-autofocus]') ??
        dialog.querySelector<HTMLInputElement>('input')
      autofocusTarget?.focus()
    }
  }

  function handleOpenAddDialog() {
    setEditingTransaction(null)
    setTransactionFormKey((key) => key + 1)
    openTransactionDialog()
  }

  function handleOpenEditDialog(transaction: Transaction) {
    setEditingTransaction(transaction)
    setTransactionFormKey((key) => key + 1)
    openTransactionDialog()
  }

  function closeTransactionDialog() {
    const dialog = transactionDialogRef.current
    if (dialog?.open) {
      dialog.close()
      setEditingTransaction(null)
      setTransactionFormKey((key) => key + 1)
    }
  }

  const currentHour = new Date().getHours()
  const greetingTime =
    currentHour < 11
      ? 'Selamat pagi'
      : currentHour < 15
        ? 'Selamat siang'
        : currentHour < 18
          ? 'Selamat sore'
          : 'Selamat malam'

  const todayFormatted = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <AppShell activeHref={`#${activeTab}`}>
      {status === 'loading' ? (
        <div className="dashboard-state" role="status" aria-live="polite">
          Menghubungkan ke Cloud Firestore & memuat data transaksi...
        </div>
      ) : null}

      {status === 'error' ? (
        <div className="dashboard-state dashboard-state--error" role="alert">
          <p>Data transaksi gagal dimuat dari database.</p>
          <Button type="button" onClick={retryLoad}>
            Coba lagi
          </Button>
        </div>
      ) : null}

      {status === 'ready' ? (
        <>
          <dialog
            ref={transactionDialogRef}
            className="transaction-dialog"
            aria-labelledby="transaction-dialog-title"
            onCancel={(event) => {
              event.preventDefault()
              closeTransactionDialog()
            }}
            onClick={(event) => {
              if (event.target === event.currentTarget) closeTransactionDialog()
            }}
          >
            <div className="transaction-dialog__content">
              <div className="transaction-dialog__header">
                <div className="transaction-dialog__title-group">
                  <h2 className="section-title" id="transaction-dialog-title">
                    {editingTransaction ? 'Edit transaksi' : 'Tambah transaksi'}
                  </h2>
                  <p className="transaction-dialog__subtitle">
                    {editingTransaction
                      ? 'Perbarui rincian transaksi Anda di cloud.'
                      : 'Catat pengeluaran atau pemasukan harianmu.'}
                  </p>
                </div>
                <Button
                  className="transaction-dialog__close"
                  variant="ghost"
                  type="button"
                  aria-label="Tutup form transaksi"
                  onClick={closeTransactionDialog}
                >
                  <X size={20} aria-hidden="true" />
                </Button>
              </div>
              <TransactionForm
                key={transactionFormKey}
                initialTransaction={editingTransaction}
                onAddTransaction={addTransaction}
                onUpdateTransaction={updateTransaction}
                onAdded={closeTransactionDialog}
                onCancel={closeTransactionDialog}
              />
            </div>
          </dialog>

          {activeTab === 'transaksi' ? (
            <TransactionsPage
              transactions={transactions}
              onAddTransaction={handleOpenAddDialog}
              onEditTransaction={handleOpenEditDialog}
              onRemoveTransaction={removeTransaction}
              disabled={status !== 'ready'}
            />
          ) : (
            <>
              <PageHeader
                greeting={`${greetingTime}, Nabila`}
                title="Ringkasan keuangan"
                onAddTransaction={handleOpenAddDialog}
                disabled={status !== 'ready'}
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
              />

              <div className="dashboard-layout">
            {/* Top 3 Summary Cards */}
            <section className="summary-section" aria-labelledby="summary-title">
              <h2 className="visually-hidden" id="summary-title">
                Ringkasan bulan ini
              </h2>
              <div className="summary-grid">
                <SummaryCard
                  title="Saldo tersedia"
                  amount={balance}
                  footnote={`Saldo awal bulan ${formatRupiah(periodOpeningBalance)}`}
                  variant="balance"
                  icon={<Wallet size={18} aria-hidden="true" />}
                />
                <SummaryCard
                  title="Pemasukan bulan ini"
                  amount={periodIncome}
                  footnote={`Hari ini ${formatRupiah(todayIncome, { signed: true })}`}
                  variant="income"
                  icon={<ArrowDownLeft size={18} aria-hidden="true" />}
                />
                <SummaryCard
                  title="Pengeluaran bulan ini"
                  amount={periodExpenses}
                  footnote={`Hari ini ${formatRupiah(-todayExpenses, { signed: true })} · ${expenseRate}% dari pemasukan`}
                  variant="expense"
                  icon={<ArrowUpRight size={18} aria-hidden="true" />}
                />
              </div>
            </section>

            {/* Main 8/4 Columns */}
            <div className="dashboard-main-columns">
              {/* Kolom Kiri (8) */}
              <div className="dashboard-column-left">
                {/* 1. Grafik Tren arus kas */}
                <CashFlowChart data={cashFlowTrend} />

                {/* 2. Kartu Tabel Transaksi hari ini */}
                <Card className="transaction-table-card">
                  <div className="transaction-table-card__header">
                    <div className="transaction-table-card__title-group">
                      <h2 className="section-title">Transaksi hari ini</h2>
                      <p className="transaction-table-card__subtitle">
                        {todayFormatted} · {todayRecordedCount} transaksi tercatat
                      </p>
                    </div>
                    <div className="transaction-table-card__controls">
                      <Input
                        className="transaction-search"
                        aria-label="Cari transaksi"
                        placeholder="Cari transaksi..."
                        value={transactionQuery}
                        onChange={(event) => setTransactionQuery(event.target.value)}
                        leadingIcon={<Search size={16} aria-hidden="true" />}
                      />
                      <Select
                        className="transaction-category-filter"
                        aria-label="Filter kategori"
                        value={categoryFilter}
                        onChange={(event) => setCategoryFilter(event.target.value)}
                        options={[
                          { label: 'Semua kategori', value: 'all' },
                          ...TRANSACTION_CATEGORIES.map((category) => ({
                            label: category,
                            value: category,
                          })),
                        ]}
                      />
                    </div>
                  </div>

                  <div className="transaction-table-scroll">
                    <table className="transaction-table">
                      <thead>
                        <tr>
                          <th scope="col">Transaksi</th>
                          <th scope="col">Kategori</th>
                          <th scope="col">Sumber</th>
                          <th scope="col">Status</th>
                          <th scope="col" className="transaction-amount-header">
                            Nominal
                          </th>
                          <th scope="col" aria-label="Aksi"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTransactions.length > 0 ? (
                          filteredTransactions.map((transaction) => (
                            <TransactionRow
                              key={transaction.id}
                              transaction={transaction}
                              onEdit={handleOpenEditDialog}
                              onRemove={removeTransaction}
                            />
                          ))
                        ) : (
                          <tr>
                            <td className="transaction-empty" colSpan={6}>
                              {newestTodayTransactions.length
                                ? 'Tidak ada transaksi yang cocok.'
                                : 'Belum ada transaksi hari ini.'}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="transaction-table-card__footer">
                    <div className="transaction-table-card__net-flow">
                      <span>Arus kas neto hari ini</span>
                      <strong>{formatRupiah(netFlowToday, { signed: true })}</strong>
                    </div>
                    <a href="#transaksi" className="transaction-table-card__view-all">
                      <span>Lihat semua transaksi</span>
                      <ArrowRight size={14} aria-hidden="true" />
                    </a>
                  </div>
                </Card>

                {/* Footnote status bar di bawah tabel transaksi */}
                <div className="dashboard-status-bar">
                  <div className="dashboard-status-bar__left">
                    <CheckCircle2 size={16} className="dashboard-status-bar__icon" aria-hidden="true" />
                    <span>{footerData.lastUpdatedText}</span>
                  </div>
                  <div className="dashboard-status-bar__right">
                    <span>{footerData.equationText}</span>
                  </div>
                </div>
              </div>

              {/* Kolom Kanan (4) */}
              <div className="dashboard-column-right">
                {/* 1. Kartu Kategori pengeluaran versi baru */}
                <CategoryCard
                  categories={categorySummary}
                  totalExpenses={periodExpenses}
                />

                {/* 2. Kalender Oktober 2026 */}
                <CalendarWidget data={calendarSummary} />
              </div>
            </div>
          </div>
        </>
      )}
    </>
  ) : null}
    </AppShell>
  )
}

export default App
