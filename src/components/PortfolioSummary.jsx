import './PortfolioSummary.css'

function formatTL(val) {
  if (val == null) return '-'
  return val.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' TL'
}

function formatPercent(val) {
  if (val == null) return '-'
  const sign = val > 0 ? '+' : ''
  return sign + val.toFixed(2) + '%'
}

function PortfolioSummary({ funds, loading }) {
  if (loading) return <div className="portfolio-summary"><p className="summary-loading">Portföy hesaplanıyor...</p></div>
  if (!funds || funds.length === 0) return null

  let totalValue = 0
  let totalCost = 0
  let prevTotalValue = 0

  for (const fund of funds) {
    if (fund.price == null) continue
    totalValue += fund.positionValue
    totalCost += fund.quantity * fund.avgCost
    // Günlük kar/zarar için bir önceki fiyatı hesapla
    if (fund.dailyReturn != null) {
      const prevPrice = fund.price / (1 + fund.dailyReturn / 100)
      prevTotalValue += fund.quantity * prevPrice
    } else {
      prevTotalValue += fund.positionValue
    }
  }

  const totalPnl = totalValue - totalCost
  const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0
  const dailyPnl = totalValue - prevTotalValue
  const dailyPnlPct = prevTotalValue > 0 ? (dailyPnl / prevTotalValue) * 100 : 0

  const cards = [
    {
      label: 'Portföy Değeri',
      value: formatTL(totalValue),
      sub: `Maliyet: ${formatTL(totalCost)}`,
      color: null,
    },
    {
      label: 'Toplam Kar/Zarar',
      value: formatTL(totalPnl),
      sub: formatPercent(totalPnlPct),
      color: totalPnl >= 0 ? 'var(--positive)' : 'var(--negative)',
    },
    {
      label: 'Günlük Kar/Zarar',
      value: formatTL(dailyPnl),
      sub: formatPercent(dailyPnlPct),
      color: dailyPnl >= 0 ? 'var(--positive)' : 'var(--negative)',
    },
  ]

  return (
    <div className="portfolio-summary">
      {cards.map((card) => (
        <div key={card.label} className="summary-card">
          <span className="summary-label">{card.label}</span>
          <span className="summary-value" style={card.color ? { color: card.color } : undefined}>
            {card.value}
          </span>
          <span className="summary-sub" style={card.color ? { color: card.color } : undefined}>
            {card.sub}
          </span>
        </div>
      ))}
    </div>
  )
}

export default PortfolioSummary
