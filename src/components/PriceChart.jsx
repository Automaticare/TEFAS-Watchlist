import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import './AllocationChart.css'

function formatDateLabel(timestamp) {
  const date = new Date(parseInt(timestamp))
  return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })
}

function PriceChart({ history, loading, error }) {
  if (loading) {
    return <div className="chart-card"><p className="chart-status">Yükleniyor...</p></div>
  }

  if (error) {
    return <div className="chart-card"><p className="chart-status chart-error">{error}</p></div>
  }

  if (!history || history.length === 0) {
    return <div className="chart-card"><p className="chart-status">Fiyat geçmişi bulunamadı.</p></div>
  }

  const data = [...history]
    .sort((a, b) => parseInt(a.TARIH) - parseInt(b.TARIH))
    .map((item) => ({
      date: item.TARIH,
      price: item.FIYAT,
    }))

  const prices = data.map((d) => d.price)
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const padding = (maxPrice - minPrice) * 0.1 || 0.001

  return (
    <div className="chart-card">
      <h3 className="chart-title">Fiyat Geçmişi (Son 30 Gün)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDateLabel}
            tick={{ fontSize: 12 }}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[minPrice - padding, maxPrice + padding]}
            tick={{ fontSize: 12 }}
            tickFormatter={(v) => v.toFixed(4)}
            width={70}
          />
          <Tooltip
            labelFormatter={(label) => {
              const date = new Date(parseInt(label))
              return date.toLocaleDateString('tr-TR', {
                day: '2-digit', month: 'long', year: 'numeric',
              })
            }}
            formatter={(value) => [
              value.toLocaleString('tr-TR', { minimumFractionDigits: 6 }) + ' TL',
              'Fiyat',
            ]}
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke="var(--accent)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default PriceChart
