import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts'
import './AllocationChart.css'

const LINE_COLORS = [
  '#0d6efd', '#198754', '#dc3545', '#ffc107', '#6f42c1',
  '#0dcaf0', '#fd7e14', '#20c997', '#6610f2', '#d63384',
  '#adb5bd', '#0a58ca', '#146c43',
]

function formatDateLabel(timestamp) {
  const date = new Date(timestamp)
  return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })
}

/**
 * Birden fazla fonun fiyat verisini normalize eder (başlangıç = 100).
 * Bu sayede farklı fiyat seviyelerindeki fonlar karşılaştırılabilir.
 */
function normalizeData(fundsHistory) {
  // Tüm tarihleri topla
  const dateMap = new Map()

  fundsHistory.forEach(({ fundCode, history }) => {
    const sorted = [...history].sort((a, b) => parseInt(a.TARIH) - parseInt(b.TARIH))
    const basePrice = sorted[0]?.FIYAT

    sorted.forEach((item) => {
      const ts = parseInt(item.TARIH)
      if (!dateMap.has(ts)) {
        dateMap.set(ts, { date: ts })
      }
      const normalized = basePrice ? (item.FIYAT / basePrice) * 100 : 100
      dateMap.get(ts)[fundCode] = parseFloat(normalized.toFixed(2))
    })
  })

  return Array.from(dateMap.values()).sort((a, b) => a.date - b.date)
}

function MultiPriceChart({ fundsHistory, loading, error }) {
  if (loading) {
    return <div className="chart-card"><p className="chart-status">Yükleniyor...</p></div>
  }

  if (error) {
    return <div className="chart-card"><p className="chart-status chart-error">{error}</p></div>
  }

  if (!fundsHistory || fundsHistory.length === 0) {
    return <div className="chart-card"><p className="chart-status">Karşılaştırma verisi bulunamadı.</p></div>
  }

  const data = normalizeData(fundsHistory)
  const fundCodes = fundsHistory.map((f) => f.fundCode)

  return (
    <div className="chart-card">
      <h3 className="chart-title">Fiyat Karşılaştırması (Normalize, Başlangıç = 100)</h3>
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDateLabel}
            tick={{ fontSize: 11 }}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => v.toFixed(1)}
            width={50}
          />
          <Tooltip
            labelFormatter={(label) => {
              const date = new Date(label)
              return date.toLocaleDateString('tr-TR', {
                day: '2-digit', month: 'long', year: 'numeric',
              })
            }}
            formatter={(value, name) => [`${value.toFixed(2)}`, name]}
          />
          <Legend />
          {fundCodes.map((code, index) => (
            <Line
              key={code}
              type="monotone"
              dataKey={code}
              stroke={LINE_COLORS[index % LINE_COLORS.length]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default MultiPriceChart
