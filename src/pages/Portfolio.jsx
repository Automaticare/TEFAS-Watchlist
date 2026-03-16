import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import TransactionForm from '../components/TransactionForm'
import PortfolioSummary from '../components/PortfolioSummary'
import { getAllTransactions, deleteTransaction } from '../services/portfolioService'
import { useFundList } from '../hooks/useFundList'
import './Portfolio.css'

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

function groupByFund(transactions) {
  const groups = new Map()
  for (const tx of transactions) {
    if (!groups.has(tx.fundCode)) {
      groups.set(tx.fundCode, [])
    }
    groups.get(tx.fundCode).push(tx)
  }
  return groups
}

function Portfolio() {
  const { funds: fundList } = useFundList()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)
  const [view, setView] = useState('all') // 'all' | 'grouped'

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getAllTransactions()
      setTransactions(data)
    } catch {
      // Hata durumunda boş liste
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  async function handleDelete(txId) {
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

  const grouped = groupByFund(transactions)

  function renderRow(tx) {
    return (
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
            onClick={() => handleDelete(tx.id)}
            disabled={deleting === tx.id}
            title="Sil"
          >
            {deleting === tx.id ? '...' : '×'}
          </button>
        </td>
      </tr>
    )
  }

  return (
    <div>
      <div className="watchlist-header">
        <h2>Portföy</h2>
        <Link to="/" className="back-link">Watchlist'e Dön</Link>
      </div>

      <PortfolioSummary transactions={transactions} />

      <TransactionForm fundList={fundList} onSaved={fetchTransactions} />

      <div className="tx-history-card">
        <div className="tx-history-header">
          <h3 className="tx-history-title">İşlem Geçmişi</h3>
          {transactions.length > 0 && (
            <div className="tx-view-toggle">
              <button
                className={`tx-view-btn ${view === 'all' ? 'tx-view-active' : ''}`}
                onClick={() => setView('all')}
              >
                Tümü
              </button>
              <button
                className={`tx-view-btn ${view === 'grouped' ? 'tx-view-active' : ''}`}
                onClick={() => setView('grouped')}
              >
                Fon Bazlı
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <p className="tx-empty">Yükleniyor...</p>
        ) : transactions.length === 0 ? (
          <p className="tx-empty">Henüz işlem kaydı yok.</p>
        ) : view === 'all' ? (
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
                {transactions.map(renderRow)}
              </tbody>
            </table>
          </div>
        ) : (
          <div>
            {Array.from(grouped.entries()).map(([fundCode, txs]) => (
              <div key={fundCode} className="tx-fund-group">
                <h4 className="tx-fund-group-title">{fundCode}</h4>
                <div style={{ overflowX: 'auto' }}>
                  <table className="tx-table">
                    <thead>
                      <tr className="tx-table-head">
                        <th className="tx-th">Tarih</th>
                        <th className="tx-th">Tür</th>
                        <th className="tx-th tx-th-right">Adet</th>
                        <th className="tx-th tx-th-right">Birim Fiyat</th>
                        <th className="tx-th tx-th-right">Toplam</th>
                        <th className="tx-th tx-th-center" style={{ width: 40 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {txs.map((tx) => (
                        <tr key={tx.id} className="tx-table-row">
                          <td className="tx-cell">{formatDate(tx.date)}</td>
                          <td className="tx-cell">
                            <span className={`tx-badge ${tx.type === 'buy' ? 'tx-badge-buy' : 'tx-badge-sell'}`}>
                              {tx.type === 'buy' ? 'Alım' : 'Satım'}
                            </span>
                          </td>
                          <td className="tx-cell tx-cell-right">{formatPrice(tx.quantity)}</td>
                          <td className="tx-cell tx-cell-right">{formatPrice(tx.pricePerUnit)}</td>
                          <td className="tx-cell tx-cell-right tx-cell-bold">{formatTL(tx.quantity * tx.pricePerUnit)}</td>
                          <td className="tx-cell tx-cell-center">
                            <button
                              className="tx-delete-btn"
                              onClick={() => handleDelete(tx.id)}
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Portfolio
