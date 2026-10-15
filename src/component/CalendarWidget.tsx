import Card from './Card'
import type { CalendarMonthSummary } from '../types'
import { formatRupiah, formatShortRupiah } from '../utils/format'
import './CalendarWidget.css'

type CalendarWidgetProps = {
  data: CalendarMonthSummary
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

function CalendarWidget({ data }: CalendarWidgetProps) {
  const {
    monthName,
    year,
    days,
    monthlyIncome,
    monthlyExpense,
    monthlyNet,
    selectedDate,
    selectedDayIncome,
    selectedDayExpense,
    selectedDayNet,
  } = data

  const selectedDateLabel = selectedDate
    ? new Date(selectedDate).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : `${monthName} ${year}`

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

        <div className="calendar-grid">
          {days.map((dayData, idx) => {
            if (!dayData) {
              return <div key={`empty-${idx}`} className="calendar-cell calendar-cell--empty" />
            }

            const dayOfWeek = (idx % 7)
            const isWeekend = dayOfWeek === 5 || dayOfWeek === 6
            const isSelected = dayData.isSelected

            return (
              <div
                key={dayData.dateString}
                className={`calendar-cell${isSelected ? ' calendar-cell--selected' : ''}${
                  isWeekend ? ' calendar-cell--weekend' : ''
                }`}
              >
                <span className="calendar-cell__day">{dayData.day}</span>
                {isSelected && (dayData.income > 0 || dayData.expense > 0) && (
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
              </div>
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
        <div className="calendar-selected-box">
          <div className="calendar-selected-box__header">
            <strong className="calendar-selected-box__date">{selectedDateLabel}</strong>
            <span className="calendar-selected-box__badge">
              <span className="badge-dot" aria-hidden="true" />
              <span>Tercatat</span>
            </span>
          </div>
          <div className="calendar-selected-box__grid">
            <div className="calendar-selected-item">
              <span className="calendar-selected-item__label">Dana masuk</span>
              <strong className="calendar-selected-item__value">
                {formatRupiah(selectedDayIncome, { signed: true })}
              </strong>
            </div>
            <div className="calendar-selected-item">
              <span className="calendar-selected-item__label">Dana keluar</span>
              <strong className="calendar-selected-item__value">
                -{formatRupiah(selectedDayExpense)}
              </strong>
            </div>
            <div className="calendar-selected-item">
              <span className="calendar-selected-item__label">Selisih hari ini</span>
              <strong className="calendar-selected-item__value">
                {formatRupiah(selectedDayNet, { signed: true })}
              </strong>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default CalendarWidget
