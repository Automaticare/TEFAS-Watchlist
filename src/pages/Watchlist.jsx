import { useState, useEffect } from 'react'
import FundTable from '../components/FundTable'
import ReturnComparisonChart from '../components/ReturnComparisonChart'
import MultiPriceChart from '../components/MultiPriceChart'
import { getFundHistory } from '../services/tefasApi'
import { DEFAULT_FUNDS } from '../config/collections'

function calcReturn(currentPrice, oldPrice) {
  if (!currentPrice || !oldPrice) return null
  return ((currentPrice - oldPrice) / oldPrice) * 100
}

function Watchlist() {
  const [funds, setFunds] = useState([])
  const [fundsHistory, setFundsHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchFunds() {
      try {
        setLoading(true)

        const today = new Date()
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(today.getDate() - 30)

        const promises = DEFAULT_FUNDS.map(async (code) => {
          const history = await getFundHistory(code, thirtyDaysAgo, today)
          if (!history || history.length === 0) return null

          const sorted = [...history].sort((a, b) => parseInt(b.TARIH) - parseInt(a.TARIH))
          const latest = sorted[0]
          const prev = sorted[1] || null
          const weekAgo = sorted.find((_, i) => i >= 5) || null
          const monthAgo = sorted[sorted.length - 1] || null

          return {
            fundCode: code,
            fundName: latest.FONUNVAN,
            price: latest.FIYAT,
            investors: latest.KISISAYISI,
            marketCap: latest.PORTFOYBUYUKLUK,
            dailyReturn: calcReturn(latest.FIYAT, prev?.FIYAT),
            weeklyReturn: calcReturn(latest.FIYAT, weekAgo?.FIYAT),
            monthlyReturn: calcReturn(latest.FIYAT, monthAgo?.FIYAT),
            history,
          }
        })

        const results = await Promise.allSettled(promises)
        const fundData = results
          .filter((r) => r.status === 'fulfilled' && r.value !== null)
          .map((r) => r.value)

        setFunds(fundData)
        setFundsHistory(
          fundData.map((f) => ({ fundCode: f.fundCode, history: f.history }))
        )
      } catch (err) {
        setError('Veriler yüklenirken bir hata oluştu.')
      } finally {
        setLoading(false)
      }
    }

    fetchFunds()
  }, [])

  return (
    <div>
      <h2 style={{ marginBottom: '16px' }}>Watchlist</h2>
      <FundTable funds={funds} loading={loading} error={error} />
      <ReturnComparisonChart funds={funds} loading={loading} error={error} />
      <MultiPriceChart fundsHistory={fundsHistory} loading={loading} error={error} />
    </div>
  )
}

export default Watchlist
