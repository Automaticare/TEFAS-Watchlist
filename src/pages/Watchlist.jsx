import { useState, useEffect, useCallback } from 'react'
import FundTable from '../components/FundTable'
import ReturnComparisonChart from '../components/ReturnComparisonChart'
import MultiPriceChart from '../components/MultiPriceChart'
import DateRangeSelector from '../components/DateRangeSelector'
import AddFundForm from '../components/AddFundForm'
import PortfolioSummary from '../components/PortfolioSummary'
import TransactionForm from '../components/TransactionForm'
import { getFundHistory } from '../services/tefasApi'
import { getAllTransactions, deleteTransaction } from '../services/portfolioService'
import { useWatchlist } from '../hooks/useWatchlist'
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
  const { fundCodes, addFund, removeFund, resetToDefaults } = useWatchlist()
  const { funds: fundList } = useFundList()
  const [activeTab, setActiveTab] = useState('watchlist')
  const [funds, setFunds] = useState([])
  const [fundsHistory, setFundsHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [days, setDays] = useState(30)

  // Portföy state
  const [transactions, setTransactions] = useState([])
  const [txLoading, setTxLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)

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

  async function handleDeleteTx(txId) {
    if (deleting) return
    setDeleting(txId)
    try {
      await deleteTransaction(txId)
      await fetchTransactions()
    } catch {
      // silme hatası
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div>
      {/* Tab Bar */}
      <div className="tab-bar">
        <button
          className={`tab-btn ${activeTab === 'watchlist' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('watchlist')}
        >
          Watchlist
        </button>
        <button
          className={`tab-btn ${activeTab === 'portfolio' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('portfolio')}
        >
          Portföy
        </button>
      </div>

      {/* Watchlist Tab */}
      {activeTab === 'watchlist' && (
        <div>
          <div className="watchlist-actions">
            <AddFundForm onAdd={addFund} existingCodes={fundCodes} fundList={fundList} />
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <DateRangeSelector value={days} onChange={setDays} />
              <button className="reset-btn" onClick={resetToDefaults}>
                Varsayılana Sıfırla
              </button>
            </div>
          </div>
          <FundTable funds={funds} loading={loading} error={error} onRemove={removeFund} />
          <ReturnComparisonChart funds={funds} loading={loading} error={error} />
          <MultiPriceChart fundsHistory={fundsHistory} loading={loading} error={error} />
        </div>
      )}

      {/* Portföy Tab */}
      {activeTab === 'portfolio' && (
        <div>
          <PortfolioSummary transactions={transactions} />

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
