import { useState } from 'react'
import type { FormEvent } from 'react'
import { Check } from 'lucide-react'

import Button from './Button'
import Input from './Input'
import Select from './Select'
import type { NewTransaction, Transaction, TransactionType } from '../types'
import { TRANSACTION_CATEGORIES, TRANSACTION_SOURCES } from '../data/transactionOptions'
import type { TransactionCategory, TransactionSource } from '../data/transactionOptions'
import { getLocalTime, getToday } from '../utils/date'

import './TransactionForm.css'

type TransactionFormProps = {
  initialTransaction?: Transaction | null
  onAddTransaction: (transaction: NewTransaction) => Promise<void>
  onUpdateTransaction?: (id: string, transaction: Partial<NewTransaction>) => Promise<void>
  onAdded?: () => void
  onCancel?: () => void
}

type Errors = {
  name: string
  category: string
  source: string
  type: string
  date: string
  amount: string
  form: string
}

const emptyErrors = (): Errors => ({
  name: '',
  category: '',
  source: '',
  type: '',
  date: '',
  amount: '',
  form: '',
})

const TYPE_OPTIONS: Array<{ value: TransactionType; label: string }> = [
  { value: 'expense', label: 'Pengeluaran' },
  { value: 'income', label: 'Pemasukan' },
]

function validate(
  name: string,
  category: TransactionCategory | '',
  source: TransactionSource | '',
  type: TransactionType,
  date: string,
  digits: string,
): Errors {
  const numericAmount = Number(digits)

  return {
    amount:
      digits && Number.isInteger(numericAmount) && numericAmount > 0
        ? ''
        : 'Nominal harus berupa angka lebih dari 0',
    name: name.trim() ? '' : 'Nama transaksi tidak boleh kosong',
    category: category ? '' : 'Pilih kategori transaksi',
    date: date ? '' : 'Tanggal transaksi tidak boleh kosong',
    source: source ? '' : 'Pilih sumber dana',
    type: type === 'income' || type === 'expense' ? '' : 'Pilih jenis transaksi',
    form: '',
  }
}

function TransactionForm({
  initialTransaction,
  onAddTransaction,
  onUpdateTransaction,
  onAdded,
  onCancel,
}: TransactionFormProps) {
  const [type, setType] = useState<TransactionType>(initialTransaction?.type ?? 'expense')
  const [digits, setDigits] = useState(initialTransaction ? String(initialTransaction.amount) : '')
  const [name, setName] = useState(initialTransaction?.name ?? '')
  const [category, setCategory] = useState<TransactionCategory | ''>(initialTransaction?.category ?? '')
  const [date, setDate] = useState(
    initialTransaction?.date ? initialTransaction.date.slice(0, 10) : getToday(),
  )
  const [source, setSource] = useState<TransactionSource | ''>(initialTransaction?.source ?? '')
  const [note, setNote] = useState(initialTransaction?.note ?? '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Errors>(emptyErrors)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedName = name.trim()
    const nextErrors = validate(trimmedName, category, source, type, date, digits)
    setErrors(nextErrors)

    if (Object.values(nextErrors).some(Boolean) || !category || !source) {
      return
    }

    setIsSubmitting(true)
    try {
      if (initialTransaction && onUpdateTransaction) {
        await onUpdateTransaction(initialTransaction.id, {
          name: trimmedName,
          category,
          source,
          type,
          amount: Number(digits),
          date: `${date}T${initialTransaction.date.slice(11) || `${getLocalTime()}:00`}`,
          note: note.trim() || undefined,
        })
      } else {
        await onAddTransaction({
          name: trimmedName,
          category,
          source,
          type,
          status: 'recorded',
          amount: Number(digits),
          date: `${date}T${getLocalTime()}:00`,
          note: note.trim() || undefined,
        })
      }
      onAdded?.()
    } catch {
      setErrors((current) => ({ ...current, form: 'Transaksi gagal disimpan. Coba lagi.' }))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="form" noValidate onSubmit={handleSubmit}>
      {/* 1. Segmented control: Pengeluaran | Pemasukan */}
      <div role="radiogroup" aria-label="Jenis transaksi" className="segmented">
        {TYPE_OPTIONS.map((option) => (
          <label key={option.value} className="segmented__option">
            <input
              type="radio"
              name="type"
              value={option.value}
              className="segmented__input"
              checked={type === option.value}
              onChange={() => {
                setType(option.value)
                if (errors.type) setErrors((current) => ({ ...current, type: '' }))
              }}
            />
            <span className="segmented__label">{option.label}</span>
          </label>
        ))}
      </div>

      {/* 2. Nominal lebih dulu, format rupiah otomatis, fokus awal */}
      <Input
        data-autofocus
        label="Nominal"
        type="text"
        inputMode="numeric"
        placeholder="Rp0"
        required
        value={digits === '' ? '' : `Rp${Number(digits).toLocaleString('id-ID')}`}
        onChange={(event) => {
          setDigits(event.target.value.replace(/\D/g, '').slice(0, 12))
          if (errors.amount) setErrors((current) => ({ ...current, amount: '' }))
        }}
        error={errors.amount}
      />

      {/* 3. Nama transaksi dengan petunjuk bantuan */}
      <Input
        label="Nama transaksi"
        required
        value={name}
        onChange={(event) => {
          setName(event.target.value)
          if (errors.name) setErrors((current) => ({ ...current, name: '' }))
        }}
        error={errors.name}
        hint="Nama singkat yang mudah dikenali."
        placeholder="Contoh: Belanja dapur, Kopi pagi"
      />

      {/* 4. Kategori dan Tanggal berdampingan */}
      <div className="form-row form-row--two-cols">
        <Select
          label="Kategori"
          value={category}
          onChange={(event) => {
            setCategory(event.target.value as TransactionCategory | '')
            if (errors.category) setErrors((current) => ({ ...current, category: '' }))
          }}
          error={errors.category}
          options={[
            { label: 'Pilih kategori', value: '' },
            ...TRANSACTION_CATEGORIES.map((value) => ({ label: value, value })),
          ]}
          required
        />
        <Input
          label="Tanggal"
          type="date"
          required
          value={date}
          onChange={(event) => {
            setDate(event.target.value)
            if (errors.date) setErrors((current) => ({ ...current, date: '' }))
          }}
          error={errors.date}
        />
      </div>

      {/* 5. Sumber dana */}
      <Select
        label="Sumber dana"
        value={source}
        onChange={(event) => {
          setSource(event.target.value as TransactionSource | '')
          if (errors.source) setErrors((current) => ({ ...current, source: '' }))
        }}
        error={errors.source}
        options={[
          { label: 'Pilih sumber', value: '' },
          ...TRANSACTION_SOURCES.map((value) => ({ label: value, value })),
        ]}
        required
      />

      {/* 6. Catatan (opsional) */}
      <Input
        label="Catatan (opsional)"
        type="text"
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Catatan tambahan bila diperlukan"
      />

      {errors.form ? (
        <p className="form-error" role="alert">
          {errors.form}
        </p>
      ) : null}

      {/* 7. Kaki dialog: garis pemisah, Batal (sekunder) dan Simpan transaksi (utama dengan centang) rata kanan */}
      <div className="form-footer">
        <Button variant="secondary" type="button" onClick={onCancel} disabled={isSubmitting}>
          Batal
        </Button>
        <Button variant="primary" type="submit" disabled={isSubmitting}>
          <Check size={16} aria-hidden="true" />
          {isSubmitting ? 'Menyimpan…' : initialTransaction ? 'Simpan perubahan' : 'Simpan transaksi'}
        </Button>
      </div>
    </form>
  )
}

export default TransactionForm
