import { useState } from 'react'
import { getFundHistory } from '../services/tefasApi'
import './AddFundForm.css'

function AddFundForm({ onAdd, existingCodes }) {
  const [code, setCode] = useState('')
  const [searching, setSearching] = useState(false)
  const [message, setMessage] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    const trimmed = code.toUpperCase().trim()

    if (!trimmed) return

    if (existingCodes.includes(trimmed)) {
      setMessage({ type: 'error', text: `${trimmed} zaten watchlist'te.` })
      return
    }

    setSearching(true)
    setMessage(null)

    try {
      const today = new Date()
      const weekAgo = new Date()
      weekAgo.setDate(today.getDate() - 7)

      const data = await getFundHistory(trimmed, weekAgo, today)

      if (!data || data.length === 0) {
        setMessage({ type: 'error', text: `${trimmed} kodu ile fon bulunamadı.` })
        return
      }

      const fundName = data[0].FONUNVAN
      const added = onAdd(trimmed)

      if (added) {
        setMessage({ type: 'success', text: `${fundName} eklendi.` })
        setCode('')
      }
    } catch {
      setMessage({ type: 'error', text: 'Fon aranırken bir hata oluştu.' })
    } finally {
      setSearching(false)
    }
  }

  return (
    <div className="add-fund-form">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Fon kodu (örn: TTA)"
          className="add-fund-input"
          maxLength={10}
          disabled={searching}
        />
        <button type="submit" className="add-fund-btn" disabled={searching || !code.trim()}>
          {searching ? 'Aranıyor...' : 'Ekle'}
        </button>
      </form>
      {message && (
        <p className={`add-fund-message ${message.type === 'error' ? 'message-error' : 'message-success'}`}>
          {message.text}
        </p>
      )}
    </div>
  )
}

export default AddFundForm
