import { useState, useEffect, useCallback, useMemo } from 'react'
import FundTable from '../components/FundTable'
import ReturnComparisonChart from '../components/ReturnComparisonChart'
import MultiPriceChart from '../components/MultiPriceChart'
import DateRangeSelector from '../components/DateRangeSelector'
import PortfolioSummary from '../components/PortfolioSummary'
import TransactionForm from '../components/TransactionForm'
import { getFundHistory } from '../services/tefasApi'
import { getAllTransactions, deleteTransaction, calcPortfolioSummary } from '../services/portfolioService'
import { useFundList } from '../hooks/useFundList'
import '../pages/Portfolio.css'

function calcReturn(currentPrice, oldPrice) {
  if (!currentPrice || !oldPrice) return null
  return ((currentPrice - oldPrice) / oldPrice) * 100
}

function formatDate(timestamp) {
  if (!timestamp) return '-'
  const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return d.toLocaleDateString('tr-TR')
}

function formatPrice(val) {
  if (val == null) return '-'
  return val.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 6 })
}

function formatTL(val) {
  if (val == null) return '-'
  return val.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' TL'
}

function Watchlist() {
  const { funds: fundList } = useFundList()
  const [activeTab, setActiveTab] = useState('overview')
  const [funds, setFunds] = useState([])
  const [fundsHistory, setFundsHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [days, setDays] = useState(30)

  // Portföy state
  const [transactions, setTransactions] = useState([])
  const [txLoading, setTxLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)

  const fetchTransactions = useCallback(async () => {
    try {
      setTxLoading(true)
      const data = await getAllTransactions()
      setTransactions(data)
    } catch {
      // Hata durumunda boş liste
    } finally {
      setTxLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  // Portföy özeti: fon bazlı net adet, maliyet
  const portfolioMap = useMemo(() => {
    if (transactions.length === 0) return new Map()

    const sorted = [...transactions].sort((a, b) => {
      const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date)
      const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date)
      return dateA - dateB
    })

    return calcPortfolioSummary(sorted)
  }, [transactions])

  // Her fon için en son alım tarihi
  const lastBuyDateMap = useMemo(() => {
    const map = new Map()
    transactions
      .filter((tx) => tx.type === 'buy')
      .forEach((tx) => {
        const d = tx.date?.toDate ? tx.date.toDate() : new Date(tx.date)
        const prev = map.get(tx.fundCode)
        if (!prev || d > prev) map.set(tx.fundCode, d)
      })
    return map
  }, [transactions])

  // Aktif fonlar (net adet > 0)
  const fundCodes = useMemo(() => {
    return Array.from(portfolioMap.values())
      .filter((f) => f.netQuantity > 0)
      .map((f) => f.fundCode)
  }, [portfolioMap])

  const hasPortfolio = fundCodes.length > 0

  // Fon verilerini çek
  useEffect(() => {
    if (!hasPortfolio) {
      setFunds([])
      setFundsHistory([])
      setLoading(false)
      return
    }

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

          // FIYAT=0 olan kayıtları filtrele (gün içi henüz güncellenmemiş veri)
          const validHistory = history.filter((h) => h.FIYAT && h.FIYAT > 0)
          if (validHistory.length === 0) return null

          const sorted = [...validHistory].sort((a, b) => parseInt(b.TARIH) - parseInt(a.TARIH))
          const latest = sorted[0]
          const prev = sorted[1] || null
          const weekAgo = sorted.find((_, i) => i >= 5) || null
          const monthAgo = sorted[sorted.length - 1] || null

          // Portföy verileri
          const portfolio = portfolioMap.get(code)
          const quantity = portfolio?.netQuantity || 0
          const avgCost = portfolio?.avgCost || 0
          const positionValue = quantity * latest.FIYAT
          const totalCost = portfolio?.totalCost || 0
          const pnl = positionValue - totalCost
          const pnlPct = totalCost > 0 ? (pnl / totalCost) * 100 : 0

          const latestDate = new Date(parseInt(latest.TARIH))

          return {
            fundCode: code,
            fundName: latest.FONUNVAN,
            price: latest.FIYAT,
            priceDate: latestDate,
            lastBuyDate: lastBuyDateMap.get(code) || null,
            investors: latest.KISISAYISI,
            marketCap: latest.PORTFOYBUYUKLUK,
            dailyReturn: calcReturn(latest.FIYAT, prev?.FIYAT),
            weeklyReturn: calcReturn(latest.FIYAT, weekAgo?.FIYAT),
            monthlyReturn: calcReturn(latest.FIYAT, monthAgo?.FIYAT),
            quantity,
            avgCost,
            positionValue,
            pnl,
            pnlPct,
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
  }, [days, fundCodes, hasPortfolio, portfolioMap, lastBuyDateMap])

  async function handleDeleteTx(txId) {
    if (deleting) return
    setDeleting(txId)
    try {
      await deleteTransaction(txId)
      // Silinen işlemi hemen UI'dan kaldır
      setTransactions((prev) => prev.filter((tx) => tx.id !== txId))
    } catch {
      // Hata olursa Firestore'dan tekrar çek
      await fetchTransactions()
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div>
      {/* Tab Bar */}
      <div className="tab-bar">
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Portföy
        </button>
        <button
          className={`tab-btn ${activeTab === 'portfolio' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('portfolio')}
        >
          Alım/Satım
        </button>
      </div>

      {/* Portföy Tab */}
      {activeTab === 'overview' && (
        <div>
          {!hasPortfolio && !txLoading ? (
            <div className="empty-state">
              <p className="empty-state-text">Henüz portföyünüzde fon yok.</p>
              <button
                className="empty-state-btn"
                onClick={() => setActiveTab('portfolio')}
              >
                Alım/Satım tab'ından ilk alımınızı ekleyin
              </button>
            </div>
          ) : (
            <>
              <PortfolioSummary funds={funds} loading={loading} />
              {(() => {
                if (loading || funds.length === 0) return null
                const today = new Date()
                today.setHours(0, 0, 0, 0)
                const staleFunds = funds.filter((f) => {
                  const pd = f.priceDate ? new Date(f.priceDate) : null
                  if (pd) pd.setHours(0, 0, 0, 0)
                  return pd && pd < today
                })
                if (staleFunds.length === 0) return null
                const codes = staleFunds.map((f) => f.fundCode).join(', ')
                return (
                  <div className="stale-data-warning">
                    {codes} fonlarının güncel fiyatı henüz TEFAS tarafından yayınlanmadı. Gösterilen değerler en son işlem gününe aittir.
                  </div>
                )
              })()}
              <div className="watchlist-actions">
                <DateRangeSelector value={days} onChange={setDays} />
              </div>
              <FundTable funds={funds} loading={loading} error={error} />
              <ReturnComparisonChart funds={funds} loading={loading} error={error} />
              <MultiPriceChart fundsHistory={fundsHistory} loading={loading} error={error} />
            </>
          )}
        </div>
      )}

      {/* Alım/Satım Tab */}
      {activeTab === 'portfolio' && (
        <div>
          <TransactionForm fundList={fundList} onSaved={fetchTransactions} />

          <div className="tx-history-card">
            <h3 className="tx-history-title" style={{ padding: '16px 20px 12px', margin: 0 }}>İşlem Geçmişi</h3>

            {txLoading ? (
              <p className="tx-empty">Yükleniyor...</p>
            ) : transactions.length === 0 ? (
              <p className="tx-empty">Henüz işlem kaydı yok.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="tx-table">
                  <thead>
                    <tr className="tx-table-head">
                      <th className="tx-th">Tarih</th>
                      <th className="tx-th">Tür</th>
                      <th className="tx-th">Fon</th>
                      <th className="tx-th tx-th-right">Adet</th>
                      <th className="tx-th tx-th-right">Birim Fiyat</th>
                      <th className="tx-th tx-th-right">Toplam</th>
                      <th className="tx-th tx-th-center" style={{ width: 40 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="tx-table-row">
                        <td className="tx-cell">{formatDate(tx.date)}</td>
                        <td className="tx-cell">
                          <span className={`tx-badge ${tx.type === 'buy' ? 'tx-badge-buy' : 'tx-badge-sell'}`}>
                            {tx.type === 'buy' ? 'Alım' : 'Satım'}
                          </span>
                        </td>
                        <td className="tx-cell tx-cell-bold">{tx.fundCode}</td>
                        <td className="tx-cell tx-cell-right">{formatPrice(tx.quantity)}</td>
                        <td className="tx-cell tx-cell-right">{formatPrice(tx.pricePerUnit)}</td>
                        <td className="tx-cell tx-cell-right tx-cell-bold">{formatTL(tx.quantity * tx.pricePerUnit)}</td>
                        <td className="tx-cell tx-cell-center">
                          <button
                            className="tx-delete-btn"
                            onClick={() => handleDeleteTx(tx.id)}
                            disabled={deleting === tx.id}
                            title="Sil"
                          >
                            {deleting === tx.id ? '...' : '×'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Watchlist
