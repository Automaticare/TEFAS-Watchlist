import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import FundSummaryCard from '../components/FundSummaryCard'
import AllocationChart from '../components/AllocationChart'
import PriceChart from '../components/PriceChart'
import { getFundHistory, getFundAllocation } from '../services/tefasApi'
import { transformAllocationData } from '../services/firestoreWrite'

function calcReturn(currentPrice, oldPrice) {
  if (!currentPrice || !oldPrice) return null
  return ((currentPrice - oldPrice) / oldPrice) * 100
}

function FundDetail() {
  const { fundCode } = useParams()
  const [fund, setFund] = useState(null)
  const [priceHistory, setPriceHistory] = useState([])
  const [allocation, setAllocation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [allocLoading, setAllocLoading] = useState(true)
  const [error, setError] = useState(null)
  const [allocError, setAllocError] = useState(null)

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

        setPriceHistory(history)

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

    async function fetchAllocation() {
      try {
        setAllocLoading(true)
        setAllocError(null)

        const today = new Date()
        const weekAgo = new Date()
        weekAgo.setDate(today.getDate() - 7)

        const data = await getFundAllocation(fundCode, weekAgo, today)

        if (!data || data.length === 0) {
          setAllocError('Dağılım verisi bulunamadı.')
          return
        }

        const latest = [...data].sort((a, b) => parseInt(b.TARIH) - parseInt(a.TARIH))[0]
        setAllocation(transformAllocationData(latest))
      } catch (err) {
        setAllocError('Dağılım verisi yüklenirken bir hata oluştu.')
      } finally {
        setAllocLoading(false)
      }
    }

    fetchFund()
    fetchAllocation()
  }, [fundCode])

  return (
    <div>
      <Link to="/" className="back-link">← Watchlist'e Dön</Link>
      <FundSummaryCard fund={fund} loading={loading} error={error} />
      <PriceChart history={priceHistory} loading={loading} error={error} />
      <AllocationChart allocation={allocation} loading={allocLoading} error={allocError} />
    </div>
  )
}

export default FundDetail
