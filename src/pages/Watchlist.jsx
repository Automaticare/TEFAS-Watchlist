import { useState, useEffect } from 'react'
import FundTable from '../components/FundTable'
import { getMultipleFundsToday } from '../services/tefasApi'
import { DEFAULT_FUNDS } from '../config/collections'

function Watchlist() {
  const [funds, setFunds] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchFunds() {
      try {
        setLoading(true)
        const results = await getMultipleFundsToday(DEFAULT_FUNDS)

        const fundData = results
          .filter((r) => r.data !== null)
          .map((r) => ({
            fundCode: r.fundCode,
            fundName: r.data.FONUNVAN,
            price: r.data.FIYAT,
            investors: r.data.KISISAYISI,
            marketCap: r.data.PORTFOYBUYUKLUK,
          }))

        setFunds(fundData)
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
    </div>
  )
}

export default Watchlist
