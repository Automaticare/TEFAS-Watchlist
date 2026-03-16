import { useState, useEffect } from 'react'
import { calcPortfolioSummary } from '../services/portfolioService'
import { getFundHistory } from '../services/tefasApi'
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

function PortfolioSummary({ transactions }) {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!transactions || transactions.length === 0) {
      setSummary(null)
      return
    }

    let cancelled = false

    async function calculate() {
      setLoading(true)
      try {
        // İşlemleri kronolojik sıraya getir (eskiden yeniye) — doğru maliyet hesabı için
        const sorted = [...transactions].sort((a, b) => {
          const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date)
          const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date)
          return dateA - dateB
        })

        const portfolioMap = calcPortfolioSummary(sorted)

        // Portföyde hala payı olan fonları bul
        const activeFunds = Array.from(portfolioMap.values()).filter((f) => f.netQuantity > 0)

        if (activeFunds.length === 0) {
          if (!cancelled) setSummary({ totalValue: 0, totalCost: 0, totalPnl: 0, totalPnlPct: 0, dailyPnl: 0, dailyPnlPct: 0 })
          return
        }

        // Her aktif fon için son 2 günlük fiyatı çek
        const today = new Date()
        const weekAgo = new Date()
        weekAgo.setDate(today.getDate() - 7)

        const pricePromises = activeFunds.map(async (fund) => {
          const history = await getFundHistory(fund.fundCode, weekAgo, today)
          if (!history || history.length === 0) return { fundCode: fund.fundCode, currentPrice: null, prevPrice: null }

          const sortedHistory = [...history].sort((a, b) => parseInt(b.TARIH) - parseInt(a.TARIH))
          return {
            fundCode: fund.fundCode,
            currentPrice: sortedHistory[0]?.FIYAT || null,
            prevPrice: sortedHistory[1]?.FIYAT || null,
          }
        })

        const prices = await Promise.allSettled(pricePromises)
        const priceMap = new Map()
        for (const result of prices) {
          if (result.status === 'fulfilled' && result.value.currentPrice != null) {
            priceMap.set(result.value.fundCode, result.value)
          }
        }

        let totalValue = 0
        let totalCost = 0
        let prevTotalValue = 0

        for (const fund of activeFunds) {
          const price = priceMap.get(fund.fundCode)
          if (price) {
            totalValue += fund.netQuantity * price.currentPrice
            if (price.prevPrice != null) {
              prevTotalValue += fund.netQuantity * price.prevPrice
            } else {
              prevTotalValue += fund.netQuantity * price.currentPrice
            }
          }
          totalCost += fund.totalCost
        }

        const totalPnl = totalValue - totalCost
        const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0
        const dailyPnl = totalValue - prevTotalValue
        const dailyPnlPct = prevTotalValue > 0 ? (dailyPnl / prevTotalValue) * 100 : 0

        if (!cancelled) {
          setSummary({ totalValue, totalCost, totalPnl, totalPnlPct, dailyPnl, dailyPnlPct })
        }
      } catch {
        // Hata durumunda sessiz kal
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    calculate()
    return () => { cancelled = true }
  }, [transactions])

  if (!transactions || transactions.length === 0) return null
  if (loading) return <div className="portfolio-summary"><p className="summary-loading">Portföy hesaplanıyor...</p></div>

  if (!summary) return null

  const cards = [
    {
      label: 'Portföy Değeri',
      value: formatTL(summary.totalValue),
      sub: `Maliyet: ${formatTL(summary.totalCost)}`,
      color: null,
    },
    {
      label: 'Toplam Kar/Zarar',
      value: formatTL(summary.totalPnl),
      sub: formatPercent(summary.totalPnlPct),
      color: summary.totalPnl >= 0 ? 'var(--positive)' : 'var(--negative)',
    },
    {
      label: 'Günlük Kar/Zarar',
      value: formatTL(summary.dailyPnl),
      sub: formatPercent(summary.dailyPnlPct),
      color: summary.dailyPnl >= 0 ? 'var(--positive)' : 'var(--negative)',
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
