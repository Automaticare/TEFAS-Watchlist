import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import './AllocationChart.css'

const COLORS = [
  '#0d6efd', '#198754', '#dc3545', '#ffc107', '#6f42c1',
  '#0dcaf0', '#fd7e14', '#20c997', '#6610f2', '#d63384', '#adb5bd',
]

const LABELS = {
  stocks: 'Hisse Senedi',
  governmentBonds: 'Devlet Tahvili',
  corporateBonds: 'Özel Sektör Tahvili',
  fx: 'Döviz',
  gold: 'Altın',
  preciousMetals: 'Kıymetli Maden',
  repo: 'Repo',
  cash: 'Nakit',
  etf: 'BYF',
  fundOfFunds: 'Fon Sepeti',
  other: 'Diğer',
}

function AllocationChart({ allocation, loading, error }) {
  if (loading) {
    return <div className="chart-card"><p className="chart-status">Yükleniyor...</p></div>
  }

  if (error) {
    return <div className="chart-card"><p className="chart-status chart-error">{error}</p></div>
  }

  if (!allocation) {
    return <div className="chart-card"><p className="chart-status">Dağılım verisi bulunamadı.</p></div>
  }

  const data = Object.entries(allocation)
    .filter(([, value]) => value > 0)
    .map(([key, value]) => ({
      name: LABELS[key] || key,
      value: parseFloat(value.toFixed(2)),
    }))
    .sort((a, b) => b.value - a.value)

  if (data.length === 0) {
    return <div className="chart-card"><p className="chart-status">Dağılım verisi bulunamadı.</p></div>
  }

  return (
    <div className="chart-card">
      <h3 className="chart-title">Portföy Dağılımı</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={110}
            dataKey="value"
            label={({ name, value }) => `${name} %${value}`}
            labelLine={true}
          >
            {data.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => `%${value}`}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

export default AllocationChart
