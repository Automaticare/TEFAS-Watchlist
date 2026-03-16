import { useState, useEffect } from 'react'
import FundTable from '../components/FundTable'
import ReturnComparisonChart from '../components/ReturnComparisonChart'
import MultiPriceChart from '../components/MultiPriceChart'
import DateRangeSelector from '../components/DateRangeSelector'
import AddFundForm from '../components/AddFundForm'
import { getFundHistory } from '../services/tefasApi'
import { useWatchlist } from '../hooks/useWatchlist'
import { useFundList } from '../hooks/useFundList'

function calcReturn(currentPrice, oldPrice) {
  if (!currentPrice || !oldPrice) return null
  return ((currentPrice - oldPrice) / oldPrice) * 100
}

function Watchlist() {
  const { fundCodes, addFund, removeFund, resetToDefaults } = useWatchlist()
  const { funds: fundList } = useFundList()
  const [funds, setFunds] = useState([])
  const [fundsHistory, setFundsHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [days, setDays] = useState(30)

  useEffect(() => {
    async function fetchFunds() {
      try {
        setLoading(true)
        setError(null)

        const today = new Date()
        const startDate = new Date()
        startDate.setDate(today.getDate() - days)

        const promises = fundCodes.map(async (code) => {
          const history = await getFundHistory(code, startDate, today)
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
  }, [days, fundCodes])

  return (
    <div>
      <div className="watchlist-header">
        <h2>Watchlist</h2>
        <DateRangeSelector value={days} onChange={setDays} />
      </div>
      <div className="watchlist-actions">
        <AddFundForm onAdd={addFund} existingCodes={fundCodes} fundList={fundList} />
        <button className="reset-btn" onClick={resetToDefaults}>
          Varsayılana Sıfırla
        </button>
      </div>
      <FundTable funds={funds} loading={loading} error={error} onRemove={removeFund} />
      <ReturnComparisonChart funds={funds} loading={loading} error={error} />
      <MultiPriceChart fundsHistory={fundsHistory} loading={loading} error={error} />
    </div>
  )
}

export default Watchlist
