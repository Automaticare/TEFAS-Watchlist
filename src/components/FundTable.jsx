import { Link } from 'react-router-dom'
import './FundTable.css'

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
    return `${(value / 1_000_000_000).toLocaleString('tr-TR', { maximumFractionDigits: 2 })} Mrd`
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toLocaleString('tr-TR', { maximumFractionDigits: 2 })} Mln`
  }
  return formatNumber(value)
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

function FundTable({ funds, loading, error }) {
  if (loading) {
    return <p className="fund-table-status">Veriler yükleniyor...</p>
  }

  if (error) {
    return <p className="fund-table-status fund-table-error">{error}</p>
  }

  if (!funds || funds.length === 0) {
    return <p className="fund-table-status">Watchlist'te fon bulunamadı.</p>
  }

  return (
    <div className="fund-table-wrapper">
      <table className="fund-table">
        <thead>
          <tr>
            <th>Kod</th>
            <th>Fon Adı</th>
            <th className="text-right">Fiyat</th>
            <th className="text-right">Günlük</th>
            <th className="text-right">Haftalık</th>
            <th className="text-right">Aylık</th>
            <th className="text-right">Yatırımcı</th>
            <th className="text-right">Piyasa Değeri</th>
          </tr>
        </thead>
        <tbody>
          {funds.map((fund) => (
            <tr key={fund.fundCode}>
              <td>
                <Link to={`/fund/${fund.fundCode}`} className="fund-code">
                  {fund.fundCode}
                </Link>
              </td>
              <td className="fund-name">{fund.fundName}</td>
              <td className="text-right">{formatPrice(fund.price)}</td>
              <td className={`text-right ${returnClass(fund.dailyReturn)}`}>
                {formatReturn(fund.dailyReturn)}
              </td>
              <td className={`text-right ${returnClass(fund.weeklyReturn)}`}>
                {formatReturn(fund.weeklyReturn)}
              </td>
              <td className={`text-right ${returnClass(fund.monthlyReturn)}`}>
                {formatReturn(fund.monthlyReturn)}
              </td>
              <td className="text-right">{formatNumber(fund.investors)}</td>
              <td className="text-right">{formatMarketCap(fund.marketCap)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default FundTable
