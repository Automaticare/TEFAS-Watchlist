import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import TransactionForm from '../components/TransactionForm'
import { getAllTransactions } from '../services/portfolioService'
import { useFundList } from '../hooks/useFundList'

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

function Portfolio() {
  const { funds: fundList } = useFundList()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

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

  return (
    <div>
      <div className="watchlist-header">
        <h2>Portföy</h2>
        <Link to="/" className="back-link">Watchlist'e Dön</Link>
      </div>

      <TransactionForm fundList={fundList} onSaved={fetchTransactions} />

      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
        <h3 style={{ padding: '16px 20px 12px', fontSize: 16, margin: 0 }}>İşlem Geçmişi</h3>

        {loading ? (
          <p style={{ padding: '12px 20px', color: 'var(--text-secondary)', fontSize: 14 }}>Yükleniyor...</p>
        ) : transactions.length === 0 ? (
          <p style={{ padding: '12px 20px', color: 'var(--text-secondary)', fontSize: 14 }}>Henüz işlem kaydı yok.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                  <th style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Tarih</th>
                  <th style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Tür</th>
                  <th style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Fon</th>
                  <th style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'right' }}>Adet</th>
                  <th style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'right' }}>Birim Fiyat</th>
                  <th style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'right' }}>Toplam</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '8px 12px' }}>{formatDate(tx.date)}</td>
                    <td style={{ padding: '8px 12px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 600,
                        background: tx.type === 'buy' ? '#e8f5e9' : '#ffebee',
                        color: tx.type === 'buy' ? 'var(--positive)' : 'var(--negative)',
                      }}>
                        {tx.type === 'buy' ? 'Alım' : 'Satım'}
                      </span>
                    </td>
                    <td style={{ padding: '8px 12px', fontWeight: 600 }}>{tx.fundCode}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right' }}>{formatPrice(tx.quantity)}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right' }}>{formatPrice(tx.pricePerUnit)}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 500 }}>
                      {formatTL(tx.quantity * tx.pricePerUnit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default Portfolio
