import { useMemo } from 'react'
import Card from './Card'
import type { CashFlowTrendData } from '../types'
import { formatRupiah } from '../utils/format'
import './CashFlowChart.css'

type CashFlowChartProps = {
  data: CashFlowTrendData
}

function CashFlowChart({ data }: CashFlowChartProps) {
  const { points, periodLabel, netCashFlow } = data

  const svgWidth = 600
  const svgHeight = 160

  const maxDataValue = points.reduce(
    (max, pt) => Math.max(max, pt.cumulativeIncome, pt.cumulativeExpense),
    0,
  )
  const step = 2000000
  const maxY = Math.max(8000000, Math.ceil(maxDataValue / step) * step)

  const yTicks = [
    { value: maxY, label: `Rp${(maxY / 1000000).toFixed(maxY % 1000000 === 0 ? 0 : 1)} jt` },
    { value: (maxY * 3) / 4, label: `Rp${(((maxY * 3) / 4) / 1000000).toFixed(((maxY * 3) / 4) % 1000000 === 0 ? 0 : 1)} jt` },
    { value: maxY / 2, label: `Rp${((maxY / 2) / 1000000).toFixed((maxY / 2) % 1000000 === 0 ? 0 : 1)} jt` },
    { value: maxY / 4, label: `Rp${((maxY / 4) / 1000000).toFixed((maxY / 4) % 1000000 === 0 ? 0 : 1)} jt` },
    { value: 0, label: 'Rp0' },
  ]

  const totalPoints = points.length

  // Batasi jumlah label sumbu X maksimal 7 titik agar tidak menumpuk/berantakan
  const visibleTicks = useMemo(() => {
    if (totalPoints <= 8) {
      return points.map((pt, i) => ({ pt, i }))
    }
    const maxTicks = 7
    const tickStep = (totalPoints - 1) / (maxTicks - 1)
    const indices = new Set<number>()
    for (let s = 0; s < maxTicks; s++) {
      indices.add(Math.round(s * tickStep))
    }
    return Array.from(indices)
      .sort((a, b) => a - b)
      .map((i) => ({ pt: points[i], i }))
  }, [points, totalPoints])

  function getX(index: number) {
    if (totalPoints <= 1) return svgWidth / 2
    return (index / (totalPoints - 1)) * svgWidth
  }

  function getY(amount: number) {
    const clamped = Math.max(0, Math.min(amount, maxY))
    return svgHeight - (clamped / maxY) * svgHeight
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

  // Area fill under green line down to baseline
  const areaPath =
    points.length > 0
      ? `M ${getX(0).toFixed(1)} ${getY(points[0].cumulativeIncome).toFixed(1)} ` +
        points
          .slice(1)
          .map((pt, i) => `L ${getX(i + 1).toFixed(1)} ${getY(pt.cumulativeIncome).toFixed(1)}`)
          .join(' ') +
        ` L ${getX(lastIndex).toFixed(1)} ${svgHeight} L ${getX(0).toFixed(1)} ${svgHeight} Z`
      : ''

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
        {/* Kolom Sumbu Y (HTML Murni - Tidak Pipih & Beri Jarak Jelas ke Garis Grid) */}
        <div className="cashflow-y-axis" aria-hidden="true">
          {yTicks.map(({ value, label }) => {
            const topPct = (1 - value / maxY) * 100
            return (
              <span
                key={value}
                className="cashflow-y-tick"
                style={{ top: `${topPct}%` }}
              >
                {label}
              </span>
            )
          })}
        </div>

        {/* Area Grafik Garis & Sumbu X */}
        <div className="cashflow-plot-area">
          <div className="cashflow-svg-wrap">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="cashflow-svg"
              preserveAspectRatio="none"
              role="img"
              aria-label={`Grafik garis arus kas periode ${periodLabel}`}
            >
              <defs>
                {/* Gradien halus area hijau seperti di Figma */}
                <linearGradient id="cashflowIncomeAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#585e19" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="#585e19" stopOpacity="0.02" />
                </linearGradient>
              </defs>

              {/* Garis Grid Horizontal Solid */}
              {yTicks.map(({ value }) => {
                const y = getY(value)
                return (
                  <line
                    key={value}
                    x1={0}
                    y1={y}
                    x2={svgWidth}
                    y2={y}
                    className="chart-grid-line"
                  />
                )
              })}

              {/* Area Fill Hijau Transparan di Bawah Garis Pemasukan */}
              {areaPath && (
                <path
                  d={areaPath}
                  fill="url(#cashflowIncomeAreaGrad)"
                  className="chart-area-fill"
                />
              )}

              {/* Garis Pengeluaran (Dashed Merah/Terracotta) */}
              <path d={expensePath} className="chart-line chart-line--expense" />

              {/* Garis Pemasukan (Solid Hijau Zaitun) */}
              <path d={incomePath} className="chart-line chart-line--income" />

              {/* Titik Akhir (End Markers) */}
              {lastPoint && (
                <>
                  <circle
                    cx={lastExpenseX}
                    cy={lastExpenseY}
                    r={3.5}
                    className="chart-marker chart-marker--expense"
                  />
                  <circle
                    cx={lastIncomeX}
                    cy={lastIncomeY}
                    r={3.5}
                    className="chart-marker chart-marker--income"
                  />
                </>
              )}
            </svg>
          </div>

          {/* Sumbu X (HTML Murni, rapi dan tidak bertumpuk) */}
          <div className="cashflow-x-axis" aria-hidden="true">
            {visibleTicks.map(({ pt, i }) => {
              const leftPct = totalPoints > 1 ? (i / (totalPoints - 1)) * 100 : 50
              return (
                <span
                  key={pt.date}
                  className={`cashflow-x-tick${i === lastIndex ? ' cashflow-x-tick--current' : ''}`}
                  style={{
                    left: `${leftPct}%`,
                    transform:
                      i === 0
                        ? 'translateX(0)'
                        : i === lastIndex
                          ? 'translateX(-100%)'
                          : 'translateX(-50%)',
                  }}
                >
                  {pt.dayLabel}
                </span>
              )
            })}
          </div>
        </div>
      </div>

      <div className="cashflow-card__footer">
        <span className="cashflow-card__footer-label">
          Pemasukan – pengeluaran · arus kas neto
        </span>
        <strong className="cashflow-card__footer-value">
          {formatRupiah(netCashFlow, { signed: true })}
        </strong>
      </div>
    </Card>
  )
}

export default CashFlowChart
