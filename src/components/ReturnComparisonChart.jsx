import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts'
import './ReturnComparisonChart.css'

const PERIODS = [
  { key: 'dailyReturn', label: 'Günlük' },
  { key: 'weeklyReturn', label: 'Haftalık' },
  { key: 'monthlyReturn', label: 'Aylık' },
]

function ReturnComparisonChart({ funds, loading, error }) {
  const [period, setPeriod] = useState('monthlyReturn')

  if (loading) {
    return <div className="chart-card"><p className="chart-status">Yükleniyor...</p></div>
  }

  if (error) {
    return <div className="chart-card"><p className="chart-status chart-error">{error}</p></div>
  }

  if (!funds || funds.length === 0) {
    return <div className="chart-card"><p className="chart-status">Karşılaştırma verisi bulunamadı.</p></div>
  }

  const data = funds
    .map((f) => ({
      name: f.fundCode,
      value: f[period] != null ? parseFloat(f[period].toFixed(2)) : 0,
    }))
    .sort((a, b) => b.value - a.value)

  return (
    <div className="chart-card">
      <div className="chart-header">
        <h3 className="chart-title">Getiri Karşılaştırması</h3>
        <div className="period-selector">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              className={`period-btn ${period === p.key ? 'period-btn-active' : ''}`}
              onClick={() => setPeriod(p.key)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={Math.max(300, funds.length * 36)}>
        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 12 }}
            tickFormatter={(v) => `${v}%`}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 12, fontWeight: 600 }}
            width={40}
          />
          <Tooltip
            formatter={(value) => [`%${value.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`, 'Getiri']}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={28}>
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={entry.value >= 0 ? 'var(--positive)' : 'var(--negative)'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default ReturnComparisonChart
