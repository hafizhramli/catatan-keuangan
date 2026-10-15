import Card from './Card'
import type { CashFlowTrendData } from '../types'
import { formatRupiah } from '../utils/format'
import './CashFlowChart.css'

type CashFlowChartProps = {
  data: CashFlowTrendData
}

function CashFlowChart({ data }: CashFlowChartProps) {
  const { points, periodLabel, netCashFlow } = data

  // Chart dimensions & coordinates
  const svgWidth = 600
  const svgHeight = 220
  const paddingLeft = 50
  const paddingRight = 20
  const paddingTop = 20
  const paddingBottom = 35

  const chartWidth = svgWidth - paddingLeft - paddingRight
  const chartHeight = svgHeight - paddingTop - paddingBottom

  const maxDataValue = points.reduce(
    (max, pt) => Math.max(max, pt.cumulativeIncome, pt.cumulativeExpense),
    0,
  )
  const step = maxDataValue > 10000000 ? 5000000 : maxDataValue > 4000000 ? 2000000 : 1000000
  const maxY = Math.max(step * 4, Math.ceil(maxDataValue / step) * step)
  const yTicks = [
    { value: maxY, label: `Rp${(maxY / 1000000).toFixed(maxY % 1000000 === 0 ? 0 : 1)} jt` },
    { value: (maxY * 3) / 4, label: `Rp${(((maxY * 3) / 4) / 1000000).toFixed(((maxY * 3) / 4) % 1000000 === 0 ? 0 : 1)} jt` },
    { value: maxY / 2, label: `Rp${((maxY / 2) / 1000000).toFixed((maxY / 2) % 1000000 === 0 ? 0 : 1)} jt` },
    { value: maxY / 4, label: `Rp${((maxY / 4) / 1000000).toFixed((maxY / 4) % 1000000 === 0 ? 0 : 1)} jt` },
    { value: 0, label: 'Rp0' },
  ]

  const totalPoints = points.length
  function getX(index: number) {
    if (totalPoints <= 1) return paddingLeft + chartWidth / 2
    return paddingLeft + (index / (totalPoints - 1)) * chartWidth
  }

  function getY(amount: number) {
    const clamped = Math.max(0, Math.min(amount, maxY))
    return paddingTop + chartHeight - (clamped / maxY) * chartHeight
  }

  // Generate SVG path points
  const incomePath = points
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(pt.cumulativeIncome).toFixed(1)}`)
    .join(' ')

  const expensePath = points
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(pt.cumulativeExpense).toFixed(1)}`)
    .join(' ')

  const lastIndex = totalPoints - 1
  const lastPoint = points[lastIndex]
  const lastIncomeX = getX(lastIndex)
  const lastIncomeY = lastPoint ? getY(lastPoint.cumulativeIncome) : 0
  const lastExpenseX = getX(lastIndex)
  const lastExpenseY = lastPoint ? getY(lastPoint.cumulativeExpense) : 0

  return (
    <Card className="cashflow-card">
      <div className="cashflow-card__header">
        <div className="cashflow-card__title-group">
          <h2 className="section-title">Tren arus kas</h2>
          <p className="cashflow-card__subtitle">{periodLabel}</p>
        </div>
        <div className="cashflow-card__legend" aria-hidden="true">
          <span className="legend-item legend-item--income">
            <span className="legend-dot legend-dot--income" />
            <span>Pemasukan</span>
          </span>
          <span className="legend-item legend-item--expense">
            <span className="legend-dot legend-dot--expense" />
            <span>Pengeluaran</span>
          </span>
        </div>
      </div>

      <div className="cashflow-chart-container">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="cashflow-svg"
          preserveAspectRatio="none"
          role="img"
          aria-label="Grafik garis akumulasi pemasukan dan pengeluaran 1 hingga 8 Oktober 2026"
        >
          {/* Horizontal Grid lines and Y-axis labels */}
          {yTicks.map(({ value, label }) => {
            const y = getY(value)
            return (
              <g key={value} className="chart-grid-row">
                <text
                  x={paddingLeft - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="chart-axis-label chart-axis-label--y"
                >
                  {label}
                </text>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={svgWidth - paddingRight}
                  y2={y}
                  className="chart-grid-line"
                />
              </g>
            )
          })}

          {/* Lines */}
          <path d={incomePath} className="chart-line chart-line--income" />
          <path d={expensePath} className="chart-line chart-line--expense" />

          {/* End Markers */}
          {lastPoint && (
            <>
              <circle
                cx={lastIncomeX}
                cy={lastIncomeY}
                r={4}
                className="chart-marker chart-marker--income"
              />
              <circle
                cx={lastExpenseX}
                cy={lastExpenseY}
                r={4}
                className="chart-marker chart-marker--expense"
              />
            </>
          )}

          {/* X-axis labels */}
          {points.map((pt, i) => {
            const x = getX(i)
            return (
              <text
                key={pt.date}
                x={x}
                y={svgHeight - 10}
                textAnchor="middle"
                className={`chart-axis-label chart-axis-label--x${i === lastIndex ? ' chart-axis-label--current' : ''}`}
              >
                {pt.dayLabel}
              </text>
            )
          })}
        </svg>
      </div>

      <div className="cashflow-card__footer">
        <span className="cashflow-card__footer-label">
          Pemasukan − pengeluaran · arus kas neto
        </span>
        <strong className="cashflow-card__footer-value">
          {formatRupiah(netCashFlow, { signed: true })}
        </strong>
      </div>
    </Card>
  )
}

export default CashFlowChart
