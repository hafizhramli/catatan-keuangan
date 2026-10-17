import { useState } from 'react'
import Card from './Card'
import Badge from './Badge'
import type { CalendarMonthSummary } from '../types'
import { formatRupiah, formatShortRupiah } from '../utils/format'
import { getRealTodayIso } from '../utils/date'
import './CalendarWidget.css'

type CalendarWidgetProps = {
  data: CalendarMonthSummary
  selectedDate?: string
  onSelectDate?: (dateString: string) => void
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

function formatSelectedDateLabel(
  dateString: string,
  fallbackMonth: string,
  fallbackYear: number,
): string {
  if (!dateString) return `${fallbackMonth} ${fallbackYear}`
  const [yStr, mStr, dStr] = dateString.split('-')
  const y = Number(yStr)
  const m = Number(mStr) - 1
  const d = Number(dStr)
  if (isNaN(y) || isNaN(m) || isNaN(d)) return `${fallbackMonth} ${fallbackYear}`

  return new Date(y, m, d).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function CalendarWidget({ data, selectedDate: propSelectedDate, onSelectDate }: CalendarWidgetProps) {
  const {
    monthName,
    year,
    days,
    monthlyIncome,
    monthlyExpense,
    monthlyNet,
  } = data

  const realTodayIso = getRealTodayIso()
  const [internalSelectedDate, setInternalSelectedDate] = useState<string>(
    () => propSelectedDate || data.selectedDate || realTodayIso,
  )

  const activeSelectedDate = propSelectedDate !== undefined ? propSelectedDate : internalSelectedDate

  function handleSelectDate(dateString: string) {
    if (propSelectedDate === undefined) {
      setInternalSelectedDate(dateString)
    }
    onSelectDate?.(dateString)
  }

  // Cari data hari untuk tanggal yang sedang dipilih
  const selectedDayData = days.find((d) => d?.dateString === activeSelectedDate)
  const isSelectedToday = activeSelectedDate === realTodayIso || Boolean(selectedDayData?.isToday)
  const selectedDayIncome = selectedDayData?.income ?? 0
  const selectedDayExpense = selectedDayData?.expense ?? 0
  const selectedDayNet = selectedDayIncome - selectedDayExpense
  const hasTransactions = Boolean(
    selectedDayData?.hasTransactions || selectedDayIncome > 0 || selectedDayExpense > 0,
  )

  const selectedDateLabel = formatSelectedDateLabel(activeSelectedDate, monthName, year)

  return (
    <Card className="calendar-card">
      <div className="calendar-card__header">
        <h2 className="calendar-card__title">
          {monthName} {year}
        </h2>
        <div className="calendar-card__legend" aria-hidden="true">
          <span className="legend-item legend-item--income">
            <span className="legend-dot legend-dot--income" />
            <span>Masuk</span>
          </span>
          <span className="legend-item legend-item--expense">
            <span className="legend-dot legend-dot--expense" />
            <span>Keluar</span>
          </span>
        </div>
      </div>

      <div className="calendar-grid-wrapper">
        <div className="calendar-weekdays" role="row">
          {WEEKDAYS.map((wd) => (
            <div
              key={wd.label}
              className={`calendar-weekday${wd.isWeekend ? ' calendar-weekday--weekend' : ''}`}
            >
              {wd.label}
            </div>
          ))}
        </div>

        <div className="calendar-grid" role="grid" aria-label={`Kalender ${monthName} ${year}`}>
          {days.map((dayData, idx) => {
            if (!dayData) {
              return (
                <div
                  key={`empty-${idx}`}
                  className="calendar-cell calendar-cell--empty"
                  aria-hidden="true"
                />
              )
            }

            const dayOfWeek = idx % 7
            const isWeekend = dayOfWeek === 5 || dayOfWeek === 6
            const isSelected = dayData.dateString === activeSelectedDate
            const isToday = dayData.isToday || dayData.dateString === realTodayIso

            return (
              <button
                type="button"
                key={dayData.dateString}
                onClick={() => handleSelectDate(dayData.dateString)}
                aria-label={`${dayData.day} ${monthName} ${year}${isToday ? ', hari ini' : ''}${isSelected ? ', terpilih' : ''}`}
                aria-pressed={isSelected}
                className={`calendar-cell${isSelected ? ' calendar-cell--selected' : ''}${
                  isToday ? ' calendar-cell--today' : ''
                }${isWeekend ? ' calendar-cell--weekend' : ''}`}
              >
                <span className="calendar-cell__day">{dayData.day}</span>
                {(dayData.income > 0 || dayData.expense > 0) && (
                  <div className="calendar-cell__chips">
                    {dayData.income > 0 && (
                      <span className="calendar-chip calendar-chip--income">
                        +{formatShortRupiah(dayData.income)}
                      </span>
                    )}
                    {dayData.expense > 0 && (
                      <span className="calendar-chip calendar-chip--expense">
                        -{formatShortRupiah(dayData.expense)}
                      </span>
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="calendar-summary-section">
        <h3 className="calendar-summary__title">Ringkasan {monthName} {year}</h3>
        <div className="calendar-summary__metrics">
          <div className="calendar-metric">
            <span className="calendar-metric__label">
              <span className="legend-dot legend-dot--income" aria-hidden="true" />
              <span>Dana masuk</span>
            </span>
            <strong className="calendar-metric__value calendar-metric__value--income">
              +{formatRupiah(monthlyIncome)}
            </strong>
          </div>
          <div className="calendar-metric">
            <span className="calendar-metric__label">
              <span className="legend-dot legend-dot--expense" aria-hidden="true" />
              <span>Dana keluar</span>
            </span>
            <strong className="calendar-metric__value calendar-metric__value--expense">
              -{formatRupiah(monthlyExpense)}
            </strong>
          </div>
          <div className="calendar-metric">
            <span className="calendar-metric__label">Selisih</span>
            <strong className="calendar-metric__value calendar-metric__value--net">
              {formatRupiah(monthlyNet, { signed: true })}
            </strong>
          </div>
        </div>

        {/* Selected day box */}
        <div
          className={`calendar-selected-box ${
            isSelectedToday ? 'calendar-selected-box--today' : 'calendar-selected-box--neutral'
          }`}
        >
          <div className="calendar-selected-box__header">
            <strong className="calendar-selected-box__date">{selectedDateLabel}</strong>
            <Badge tone={isSelectedToday ? 'success' : 'neutral'}>
              {hasTransactions ? 'Tercatat' : isSelectedToday ? 'Hari ini' : 'Tidak ada transaksi'}
            </Badge>
          </div>
          <div className="calendar-selected-box__grid">
            <div className="calendar-selected-item">
              <span className="calendar-selected-item__label">Dana masuk</span>
              <strong className="calendar-selected-item__value calendar-selected-item__value--income">
                {selectedDayIncome > 0 ? `+${formatRupiah(selectedDayIncome)}` : 'Rp0'}
              </strong>
            </div>
            <div className="calendar-selected-item">
              <span className="calendar-selected-item__label">Dana keluar</span>
              <strong className="calendar-selected-item__value calendar-selected-item__value--expense">
                {selectedDayExpense > 0 ? `-${formatRupiah(selectedDayExpense)}` : 'Rp0'}
              </strong>
            </div>
            <div className="calendar-selected-item">
              <span className="calendar-selected-item__label">Selisih hari ini</span>
              <strong
                className={`calendar-selected-item__value ${
                  selectedDayNet > 0
                    ? 'calendar-selected-item__value--net-positive'
                    : selectedDayNet < 0
                      ? 'calendar-selected-item__value--net-negative'
                      : ''
                }`}
              >
                {formatRupiah(selectedDayNet, { signed: selectedDayNet !== 0 })}
              </strong>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default CalendarWidget
