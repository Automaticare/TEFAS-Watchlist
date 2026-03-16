import './FundSummaryCard.css'

function formatPrice(value) {
  if (value == null) return '-'
  return value.toLocaleString('tr-TR', { minimumFractionDigits: 6, maximumFractionDigits: 6 })
}

function formatNumber(value) {
  if (value == null) return '-'
  return value.toLocaleString('tr-TR')
}

function formatMarketCap(value) {
  if (value == null) return '-'
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toLocaleString('tr-TR', { maximumFractionDigits: 2 })} Mrd TL`
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toLocaleString('tr-TR', { maximumFractionDigits: 2 })} Mln TL`
  }
  return `${formatNumber(value)} TL`
}

function formatReturn(value) {
  if (value == null) return '-'
  const prefix = value > 0 ? '+' : ''
  return `${prefix}${value.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`
}

function returnClass(value) {
  if (value == null) return ''
  if (value > 0) return 'return-positive'
  if (value < 0) return 'return-negative'
  return ''
}

function FundSummaryCard({ fund, loading, error }) {
  if (loading) {
    return <div className="summary-card"><p className="summary-status">Yükleniyor...</p></div>
  }

  if (error) {
    return <div className="summary-card"><p className="summary-status summary-error">{error}</p></div>
  }

  if (!fund) {
    return <div className="summary-card"><p className="summary-status">Fon verisi bulunamadı.</p></div>
  }

  return (
    <div className="summary-card">
      <div className="summary-header">
        <span className="summary-code">{fund.fundCode}</span>
        <h2 className="summary-name">{fund.fundName}</h2>
      </div>

      <div className="summary-price">
        {formatPrice(fund.price)}
        <span className="summary-currency">TL</span>
      </div>

      <div className="summary-grid">
        <div className="summary-item">
          <span className="summary-label">Günlük</span>
          <span className={`summary-value ${returnClass(fund.dailyReturn)}`}>
            {formatReturn(fund.dailyReturn)}
          </span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Haftalık</span>
          <span className={`summary-value ${returnClass(fund.weeklyReturn)}`}>
            {formatReturn(fund.weeklyReturn)}
          </span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Aylık</span>
          <span className={`summary-value ${returnClass(fund.monthlyReturn)}`}>
            {formatReturn(fund.monthlyReturn)}
          </span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Yatırımcı Sayısı</span>
          <span className="summary-value">{formatNumber(fund.investors)}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Piyasa Değeri</span>
          <span className="summary-value">{formatMarketCap(fund.marketCap)}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Tedavüldeki Pay</span>
          <span className="summary-value">{formatNumber(fund.totalShares)}</span>
        </div>
      </div>
    </div>
  )
}

export default FundSummaryCard
