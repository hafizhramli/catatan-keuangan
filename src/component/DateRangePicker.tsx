import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react'
import {
  formatDateRangeLabel,
  getDateRangePresets,
  getDefaultDateRange,
  getRealTodayIso,
  type DateRangeValue,
} from '../utils/date'
import Button from './Button'
import './DateRangePicker.css'

export type DateRangePickerProps = {
  value: DateRangeValue
  onChange: (newValue: DateRangeValue) => void
  onClose: () => void
}

const WEEKDAYS = [
  { label: 'Sen', isWeekend: false },
  { label: 'Sel', isWeekend: false },
  { label: 'Rab', isWeekend: false },
  { label: 'Kam', isWeekend: false },
  { label: 'Jum', isWeekend: false },
  { label: 'Sab', isWeekend: true },
  { label: 'Min', isWeekend: true },
]

export default function DateRangePicker({ value, onChange, onClose }: DateRangePickerProps) {
  const realTodayIso = getRealTodayIso()
  const presets = useMemo(() => getDateRangePresets(), [])

  // Initial parse of value
  const initialStart = value.startDate || realTodayIso
  const initialEnd = value.endDate || realTodayIso

  const [pendingStart, setPendingStart] = useState<string>(initialStart)
  const [pendingEnd, setPendingEnd] = useState<string | null>(initialEnd)
  const [hoverDate, setHoverDate] = useState<string | null>(null)
  const [isSelecting, setIsSelecting] = useState(false)
  const [activePreset, setActivePreset] = useState<string | null>(value.preset || 'this-month-to-date')

  // Month navigation view
  const initialYear = Number(initialEnd.slice(0, 4)) || new Date().getFullYear()
  const initialMonth = (Number(initialEnd.slice(5, 7)) || new Date().getMonth() + 1) - 1
  const [viewYear, setViewYear] = useState<number>(initialYear)
  const [viewMonth, setViewMonth] = useState<number>(initialMonth)

  // Navigate month
  function handlePrevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear((y) => y - 1)
    } else {
      setViewMonth((m) => m - 1)
    }
  }

  function handleNextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear((y) => y + 1)
    } else {
      setViewMonth((m) => m + 1)
    }
  }

  function handleJumpToCurrentMonth() {
    const now = new Date()
    setViewYear(now.getFullYear())
    setViewMonth(now.getMonth())
  }

  // Handle Preset selection
  function handleSelectPreset(preset: (typeof presets)[0]) {
    setPendingStart(preset.startDate)
    setPendingEnd(preset.endDate)
    setIsSelecting(false)
    setActivePreset(preset.id)

    // Center calendar on preset's end date
    const endYear = Number(preset.endDate.slice(0, 4))
    const endMonth = Number(preset.endDate.slice(5, 7)) - 1
    if (!isNaN(endYear) && !isNaN(endMonth)) {
      setViewYear(endYear)
      setViewMonth(endMonth)
    }
  }

  // Handle Calendar Day click
  function handleDayClick(dayIso: string) {
    if (!isSelecting) {
      // First click: sets new start date, awaits second click
      setPendingStart(dayIso)
      setPendingEnd(null)
      setIsSelecting(true)
      setActivePreset('custom')
    } else {
      // Second click: completes the range
      if (dayIso < pendingStart) {
        setPendingEnd(pendingStart)
        setPendingStart(dayIso)
      } else {
        setPendingEnd(dayIso)
      }
      setIsSelecting(false)
      setActivePreset('custom')
    }
  }

  // Calculate effective selection for rendering
  const effectiveStart = pendingStart
  const effectiveEnd = pendingEnd || (isSelecting && hoverDate ? hoverDate : pendingStart)
  const minDate = effectiveStart <= effectiveEnd ? effectiveStart : effectiveEnd
  const maxDate = effectiveStart <= effectiveEnd ? effectiveEnd : effectiveStart

  // Calculate day count
  const dayCount = useMemo(() => {
    if (!minDate || !maxDate) return 1
    const d1 = new Date(`${minDate}T00:00:00`).getTime()
    const d2 = new Date(`${maxDate}T00:00:00`).getTime()
    const diff = Math.round(Math.abs(d2 - d1) / (1000 * 60 * 60 * 24)) + 1
    return diff
  }, [minDate, maxDate])

  // Generate calendar grid for viewYear and viewMonth
  const calendarCells = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1)
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

    // 0 = Sunday, 1 = Monday, ..., 6 = Saturday -> convert to Monday=0
    const startDayOfWeek = (firstDay.getDay() + 6) % 7

    const cells: Array<{
      dateIso: string
      dayNum: number
      isCurrentMonth: boolean
      isWeekend: boolean
    } | null> = []

    // Padding for empty start days
    for (let i = 0; i < startDayOfWeek; i++) {
      cells.push(null)
    }

    // Days in current month
    for (let d = 1; d <= daysInMonth; d++) {
      const padM = String(viewMonth + 1).padStart(2, '0')
      const padD = String(d).padStart(2, '0')
      const dateIso = `${viewYear}-${padM}-${padD}`
      const dayOfWeek = (startDayOfWeek + d - 1) % 7
      const isWeekend = dayOfWeek === 5 || dayOfWeek === 6

      cells.push({
        dateIso,
        dayNum: d,
        isCurrentMonth: true,
        isWeekend,
      })
    }

    return cells
  }, [viewYear, viewMonth])

  const viewMonthName = new Date(viewYear, viewMonth, 1).toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric',
  })

  // Format label for footer summary
  const summaryRangeText = formatDateRangeLabel(minDate, maxDate)

  // Handle Apply button
  function handleApply() {
    const finalStart = minDate
    const finalEnd = maxDate
    const finalLabel = formatDateRangeLabel(finalStart, finalEnd)

    let finalNote = 'Rentang kustom'
    if (activePreset === 'this-month-to-date') {
      finalNote = 'Bulan ini, hingga hari ini'
    } else if (activePreset === 'last-7-days') {
      finalNote = '7 hari terakhir'
    } else if (activePreset === 'last-30-days') {
      finalNote = '30 hari terakhir'
    } else if (activePreset === 'this-month-full') {
      finalNote = 'Bulan ini (penuh)'
    } else if (activePreset === 'last-month') {
      finalNote = 'Bulan lalu'
    } else if (activePreset === 'this-year') {
      finalNote = 'Tahun ini'
    }

    onChange({
      startDate: finalStart,
      endDate: finalEnd,
      label: finalLabel,
      note: finalNote,
      preset: activePreset || 'custom',
    })
    onClose()
  }

  // Handle Reset to Default (Bulan ini, hingga hari ini realtime)
  function handleResetDefault() {
    const def = getDefaultDateRange()
    setPendingStart(def.startDate)
    setPendingEnd(def.endDate)
    setIsSelecting(false)
    setActivePreset('this-month-to-date')

    const now = new Date()
    setViewYear(now.getFullYear())
    setViewMonth(now.getMonth())
  }

  return (
    <div
      className="date-range-picker"
      role="dialog"
      aria-label="Pemilih rentang tanggal"
      aria-modal="false"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="date-range-picker__body">
        {/* Preset Sidebar */}
        <aside className="date-range-picker__sidebar" aria-label="Preset rentang tanggal">
          <div className="date-range-picker__sidebar-header">
            <span>Pilihan cepat</span>
          </div>
          <div className="date-range-picker__presets-list" role="list">
            {presets.map((preset) => {
              const isSelected = activePreset === preset.id
              return (
                <button
                  key={preset.id}
                  type="button"
                  className={`date-range-preset-btn ${isSelected ? 'date-range-preset-btn--active' : ''}`}
                  onClick={() => handleSelectPreset(preset)}
                >
                  <span className="date-range-preset-btn__name">{preset.name}</span>
                  <span className="date-range-preset-btn__dates">{preset.label}</span>
                </button>
              )
            })}
          </div>
        </aside>

        {/* Calendar View */}
        <div className="date-range-picker__calendar-view">
          {/* Calendar Header */}
          <div className="date-range-picker__calendar-header">
            <button
              type="button"
              className="date-range-picker__nav-btn"
              onClick={handlePrevMonth}
              aria-label="Bulan sebelumnya"
              title="Bulan sebelumnya"
            >
              <ChevronLeft size={16} aria-hidden="true" />
            </button>

            <div className="date-range-picker__month-label">
              <span>{viewMonthName}</span>
            </div>

            <div className="date-range-picker__nav-actions">
              <button
                type="button"
                className="date-range-picker__nav-btn"
                onClick={handleNextMonth}
                aria-label="Bulan berikutnya"
                title="Bulan berikutnya"
              >
                <ChevronRight size={16} aria-hidden="true" />
              </button>
              <button
                type="button"
                className="date-range-picker__today-btn"
                onClick={handleJumpToCurrentMonth}
                title="Lihat bulan sekarang"
              >
                Bulan ini
              </button>
            </div>
          </div>

          {/* Weekday Labels */}
          <div className="date-range-picker__weekdays" role="row">
            {WEEKDAYS.map((wd) => (
              <div
                key={wd.label}
                className={`date-range-picker__weekday ${wd.isWeekend ? 'date-range-picker__weekday--weekend' : ''}`}
              >
                {wd.label}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div
            className="date-range-picker__grid"
            role="grid"
            aria-label={`Kalender ${viewMonthName}`}
            onMouseLeave={() => setHoverDate(null)}
          >
            {calendarCells.map((cell, idx) => {
              if (!cell) {
                return (
                  <div
                    key={`empty-${idx}`}
                    className="date-range-picker__cell date-range-picker__cell--empty"
                    aria-hidden="true"
                  />
                )
              }

              const { dateIso, dayNum, isWeekend } = cell
              const isStart = dateIso === minDate
              const isEnd = dateIso === maxDate
              const isInRange = dateIso > minDate && dateIso < maxDate
              const isToday = dateIso === realTodayIso
              const isSingleDay = minDate === maxDate

              let cellStateClass = ''
              if (isStart && isEnd) {
                cellStateClass = 'date-range-picker__cell--start date-range-picker__cell--end'
              } else if (isStart) {
                cellStateClass = 'date-range-picker__cell--start'
              } else if (isEnd) {
                cellStateClass = 'date-range-picker__cell--end'
              } else if (isInRange) {
                cellStateClass = 'date-range-picker__cell--in-range'
              }

              return (
                <div
                  key={dateIso}
                  className={`date-range-picker__cell-wrapper ${isInRange ? 'date-range-picker__cell-wrapper--in-range' : ''} ${
                    isStart && !isSingleDay ? 'date-range-picker__cell-wrapper--range-start' : ''
                  } ${isEnd && !isSingleDay ? 'date-range-picker__cell-wrapper--range-end' : ''}`}
                >
                  <button
                    type="button"
                    className={`date-range-picker__cell ${cellStateClass} ${
                      isToday ? 'date-range-picker__cell--today' : ''
                    } ${isWeekend ? 'date-range-picker__cell--weekend' : ''}`}
                    onClick={() => handleDayClick(dateIso)}
                    onMouseEnter={() => {
                      if (isSelecting) {
                        setHoverDate(dateIso)
                      }
                    }}
                    aria-label={`${dayNum} ${viewMonthName}${isToday ? ', hari ini' : ''}${isStart ? ', awal rentang' : ''}${isEnd ? ', akhir rentang' : ''}`}
                  >
                    <span className="date-range-picker__cell-num">{dayNum}</span>
                    {isToday && <span className="date-range-picker__today-dot" aria-hidden="true" />}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <footer className="date-range-picker__footer">
        <div className="date-range-picker__footer-info">
          <button
            type="button"
            className="date-range-picker__reset-btn"
            onClick={handleResetDefault}
            title="Kembalikan ke default awal bulan s/d hari ini"
          >
            <RotateCcw size={13} aria-hidden="true" />
            <span>Default (Bulan ini s/d hari ini)</span>
          </button>
          <span className="date-range-picker__summary">
            <strong>{summaryRangeText}</strong> · {dayCount} hari
          </span>
        </div>

        <div className="date-range-picker__footer-actions">
          <Button
            type="button"
            variant="ghost"
            className="date-range-picker__btn date-range-picker__btn--cancel"
            onClick={onClose}
          >
            Batal
          </Button>
          <Button
            type="button"
            variant="primary"
            className="date-range-picker__btn date-range-picker__btn--apply"
            onClick={handleApply}
          >
            Terapkan
          </Button>
        </div>
      </footer>
    </div>
  )
}
