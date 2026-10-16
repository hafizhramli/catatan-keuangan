import { useEffect, useRef, useState } from 'react'
import Button from './Button'
import { Bell, Calendar, ChevronDown, Plus } from 'lucide-react'
import { formatCurrentDate, getDefaultDateRange, type DateRangeValue } from '../utils/date'
import DateRangePicker from './DateRangePicker'

import './PageHeader.css'

type PageHeaderProps = {
  greeting: string
  title: string
  onAddTransaction: () => void
  disabled?: boolean
  dateRange: DateRangeValue
  onDateRangeChange: (range: DateRangeValue) => void
  currentDate?: string
}

function PageHeader({
  greeting,
  title,
  onAddTransaction,
  disabled = false,
  dateRange = getDefaultDateRange(),
  onDateRangeChange,
  currentDate: propCurrentDate,
}: PageHeaderProps) {
  const [currentDate, setCurrentDate] = useState(() => propCurrentDate || formatCurrentDate())
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const rangeContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (propCurrentDate) {
      setCurrentDate(propCurrentDate)
      return
    }

    // Perbarui otomatis setiap menit agar selalu realtime
    const timer = setInterval(() => {
      setCurrentDate(formatCurrentDate())
    }, 60000)

    return () => clearInterval(timer)
  }, [propCurrentDate])

  // Tutup dropdown jika klik di luar atau tekan Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        rangeContainerRef.current &&
        !rangeContainerRef.current.contains(event.target as Node)
      ) {
        setIsPickerOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsPickerOpen(false)
      }
    }

    if (isPickerOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isPickerOpen])

  return (
    <header className="page-header">
      {/* Baris Atas: Judul, Sapaan, dan Aksi */}
      <div className="page-header__top">
        <div className="page-header__titles">
          <p className="page-header__greeting">{greeting}</p>
          <h1 className="page-title">{title}</h1>
        </div>

        <div className="page-header__actions">
          <Button
            className="page-header__bell"
            variant="secondary"
            type="button"
            aria-label="Notifikasi"
            title="Notifikasi"
          >
            <Bell size={18} aria-hidden="true" />
          </Button>

          <Button
            className="page-header__add-btn"
            variant="primary"
            type="button"
            aria-haspopup="dialog"
            disabled={disabled}
            onClick={onAddTransaction}
          >
            <Plus size={18} strokeWidth={2.2} aria-hidden="true" />
            <span>Tambah transaksi</span>
          </Button>
        </div>
      </div>

      {/* Baris Bawah: Pemilih Rentang Waktu & Tanggal Hari Ini */}
      <div className="page-header__bottom">
        <div
          className="page-header__filter-group page-header__range-container"
          ref={rangeContainerRef}
        >
          <button
            className={`page-header__range-btn ${isPickerOpen ? 'page-header__range-btn--active' : ''}`}
            type="button"
            aria-label="Pilih rentang tanggal"
            aria-expanded={isPickerOpen}
            aria-haspopup="dialog"
            onClick={() => setIsPickerOpen((prev) => !prev)}
          >
            <Calendar size={16} aria-hidden="true" />
            <span>{dateRange.label}</span>
            <ChevronDown
              size={14}
              className={`page-header__range-chevron ${isPickerOpen ? 'page-header__range-chevron--open' : ''}`}
              aria-hidden="true"
            />
          </button>
          <span className="page-header__range-note">
            {dateRange.note || 'Bulan ini, hingga hari ini'}
          </span>

          {isPickerOpen && (
            <DateRangePicker
              value={dateRange}
              onChange={(newRange) => {
                onDateRangeChange(newRange)
                setIsPickerOpen(false)
              }}
              onClose={() => setIsPickerOpen(false)}
            />
          )}
        </div>

        <span className="page-header__current-date">{currentDate}</span>
      </div>
    </header>
  )
}

export default PageHeader
