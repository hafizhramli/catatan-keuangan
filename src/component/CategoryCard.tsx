import Card from './Card'
import type { CategorySummary } from '../utils/summary'
import { formatRupiah } from '../utils/format'
import './CategoryCard.css'

type CategoryCardProps = {
  categories: CategorySummary[]
  totalExpenses: number
}

const CATEGORY_COLORS = [
  '#52550F', // Makanan - dark olive green
  '#7C7826', // Belanja - olive brown
  '#9B9858', // Tagihan - muted olive/taupe
  '#BCB98D', // Transportasi - light tan
]

function CategoryCard({ categories, totalExpenses }: CategoryCardProps) {
  const topCategory = categories[0]

  return (
    <Card className="category-card">
      <div className="category-card__header">
        <h2 className="section-title">Kategori pengeluaran</h2>
      </div>

      <div className="category-card__stat">
        <strong className="category-card__big-amount">{formatRupiah(totalExpenses)}</strong>
        <span className="category-card__subtitle">{categories.length} kategori · bulan ini</span>
      </div>

      <ul className="category-breakdown-list">
        {categories.map((cat, index) => {
          const color = CATEGORY_COLORS[index % CATEGORY_COLORS.length]
          return (
            <li key={cat.name} className="category-breakdown-item">
              <div className="category-breakdown-item__meta">
                <span className="category-name-with-dot">
                  <span
                    className="category-dot"
                    style={{ backgroundColor: color }}
                    aria-hidden="true"
                  />
                  <span className="category-name-text">{cat.name}</span>
                </span>
                <span className="category-amount-text">
                  {formatRupiah(cat.amount)} · {cat.percent}%
                </span>
              </div>
              <div className="category-bar-track">
                <div
                  className="category-bar-fill"
                  style={{
                    width: `${cat.percent}%`,
                    backgroundColor: color,
                  }}
                  role="progressbar"
                  aria-valuenow={cat.percent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${cat.name}, ${cat.percent}% dari pengeluaran`}
                />
              </div>
            </li>
          )
        })}
      </ul>

      {topCategory && (
        <p className="category-card__insight">
          {topCategory.name} adalah pengeluaran terbesar ({topCategory.percent}%).
        </p>
      )}
    </Card>
  )
}

export default CategoryCard
