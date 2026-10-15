import Button from './Button'
import { Bell, Calendar, ChevronDown, Plus } from 'lucide-react'
import type { DateRange } from '../utils/date'

import './PageHeader.css'

type PageHeaderProps = {
  greeting: string
  title: string
  onAddTransaction: () => void
  disabled?: boolean
  dateRange: DateRange
  onDateRangeChange: (range: DateRange) => void
}

function PageHeader({
  greeting,
  title,
  onAddTransaction,
  disabled = false,
}: PageHeaderProps) {
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
        <div className="page-header__filter-group">
          <button className="page-header__range-btn" type="button" aria-label="Pilih rentang tanggal">
            <Calendar size={16} aria-hidden="true" />
            <span>1–8 Oktober 2026</span>
            <ChevronDown size={14} aria-hidden="true" />
          </button>
          <span className="page-header__range-note">Bulan ini, hingga hari ini</span>
        </div>

        <span className="page-header__current-date">Kamis, 8 Oktober 2026</span>
      </div>
    </header>
  )
}

export default PageHeader
