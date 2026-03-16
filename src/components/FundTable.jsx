import { useState } from 'react'
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

const COLUMNS = [
  { key: 'fundCode', label: 'Kod', align: 'left' },
  { key: 'fundName', label: 'Fon Adı', align: 'left' },
  { key: 'price', label: 'Fiyat', align: 'right' },
  { key: 'dailyReturn', label: 'Günlük', align: 'right' },
  { key: 'weeklyReturn', label: 'Haftalık', align: 'right' },
  { key: 'monthlyReturn', label: 'Aylık', align: 'right' },
  { key: 'investors', label: 'Yatırımcı', align: 'right' },
  { key: 'marketCap', label: 'Piyasa Değeri', align: 'right' },
]

function sortFunds(funds, sortKey, sortDir) {
  return [...funds].sort((a, b) => {
    const valA = a[sortKey] ?? -Infinity
    const valB = b[sortKey] ?? -Infinity

    if (typeof valA === 'string') {
      return sortDir === 'asc'
        ? valA.localeCompare(valB, 'tr')
        : valB.localeCompare(valA, 'tr')
    }

    return sortDir === 'asc' ? valA - valB : valB - valA
  })
}

function FundTable({ funds, loading, error }) {
  const [sortKey, setSortKey] = useState('fundCode')
  const [sortDir, setSortDir] = useState('asc')

  function handleSort(key) {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir(key === 'fundCode' || key === 'fundName' ? 'asc' : 'desc')
    }
  }

  if (loading) {
    return <p className="fund-table-status">Veriler yükleniyor...</p>
  }

  if (error) {
    return <p className="fund-table-status fund-table-error">{error}</p>
  }

  if (!funds || funds.length === 0) {
    return <p className="fund-table-status">Watchlist'te fon bulunamadı.</p>
  }

  const sorted = sortFunds(funds, sortKey, sortDir)

  function renderCell(fund, key) {
    switch (key) {
      case 'fundCode':
        return (
          <Link to={`/fund/${fund.fundCode}`} className="fund-code">
            {fund.fundCode}
          </Link>
        )
      case 'fundName':
        return <span className="fund-name">{fund.fundName}</span>
      case 'price':
        return formatPrice(fund.price)
      case 'dailyReturn':
      case 'weeklyReturn':
      case 'monthlyReturn':
        return formatReturn(fund[key])
      case 'investors':
        return formatNumber(fund.investors)
      case 'marketCap':
        return formatMarketCap(fund.marketCap)
      default:
        return '-'
    }
  }

  function cellClass(fund, key) {
    const classes = []
    const col = COLUMNS.find((c) => c.key === key)
    if (col?.align === 'right') classes.push('text-right')
    if (['dailyReturn', 'weeklyReturn', 'monthlyReturn'].includes(key)) {
      classes.push(returnClass(fund[key]))
    }
    return classes.join(' ')
  }

  return (
    <div className="fund-table-wrapper">
      <table className="fund-table">
        <thead>
          <tr>
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                className={`${col.align === 'right' ? 'text-right' : ''} sortable`}
                onClick={() => handleSort(col.key)}
              >
                {col.label}
                {sortKey === col.key && (
                  <span className="sort-arrow">{sortDir === 'asc' ? ' ▲' : ' ▼'}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((fund) => (
            <tr key={fund.fundCode}>
              {COLUMNS.map((col) => (
                <td key={col.key} className={cellClass(fund, col.key)}>
                  {renderCell(fund, col.key)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default FundTable
