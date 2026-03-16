import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import FundSummaryCard from '../components/FundSummaryCard'
import { getFundHistory } from '../services/tefasApi'

function calcReturn(currentPrice, oldPrice) {
  if (!currentPrice || !oldPrice) return null
  return ((currentPrice - oldPrice) / oldPrice) * 100
}

function FundDetail() {
  const { fundCode } = useParams()
  const [fund, setFund] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchFund() {
      try {
        setLoading(true)
        setError(null)

        const today = new Date()
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(today.getDate() - 30)

        const history = await getFundHistory(fundCode, thirtyDaysAgo, today)

        if (!history || history.length === 0) {
          setError('Bu fon için veri bulunamadı.')
          return
        }

        const sorted = [...history].sort((a, b) => parseInt(b.TARIH) - parseInt(a.TARIH))
        const latest = sorted[0]
        const prev = sorted[1] || null
        const weekAgo = sorted.find((_, i) => i >= 5) || null
        const monthAgo = sorted[sorted.length - 1] || null

        setFund({
          fundCode,
          fundName: latest.FONUNVAN,
          price: latest.FIYAT,
          investors: latest.KISISAYISI,
          marketCap: latest.PORTFOYBUYUKLUK,
          totalShares: latest.TEDPAYSAYISI,
          dailyReturn: calcReturn(latest.FIYAT, prev?.FIYAT),
          weeklyReturn: calcReturn(latest.FIYAT, weekAgo?.FIYAT),
          monthlyReturn: calcReturn(latest.FIYAT, monthAgo?.FIYAT),
        })
      } catch (err) {
        setError('Veri yüklenirken bir hata oluştu.')
      } finally {
        setLoading(false)
      }
    }

    fetchFund()
  }, [fundCode])

  return (
    <div>
      <Link to="/" className="back-link">← Watchlist'e Dön</Link>
      <FundSummaryCard fund={fund} loading={loading} error={error} />
    </div>
  )
}

export default FundDetail
