import { useState, useRef, useEffect } from 'react'
import { addTransaction } from '../services/portfolioService'
import './TransactionForm.css'

const TODAY = new Date().toISOString().split('T')[0]

function TransactionForm({ fundList, onSaved }) {
  const [type, setType] = useState('buy')
  const [fundQuery, setFundQuery] = useState('')
  const [selectedFund, setSelectedFund] = useState(null)
  const [quantity, setQuantity] = useState('')
  const [pricePerUnit, setPricePerUnit] = useState('')
  const [date, setDate] = useState(TODAY)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [highlightIndex, setHighlightIndex] = useState(-1)
  const wrapperRef = useRef(null)

  const filtered = fundQuery.length > 0 && !selectedFund
    ? fundList.filter(
        (f) =>
          f.code.toLowerCase().includes(fundQuery.toLowerCase()) ||
          f.name.toLowerCase().includes(fundQuery.toLowerCase())
      ).slice(0, 15)
    : []

  useEffect(() => {
    setHighlightIndex(-1)
  }, [fundQuery])

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function selectFund(fund) {
    setSelectedFund(fund)
    setFundQuery(fund.code)
    setShowDropdown(false)
  }

  function handleFundInputChange(e) {
    setFundQuery(e.target.value)
    setSelectedFund(null)
    setShowDropdown(true)
  }

  function handleKeyDown(e) {
    if (!showDropdown || filtered.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightIndex((prev) => (prev > 0 ? prev - 1 : filtered.length - 1))
    } else if (e.key === 'Enter' && highlightIndex >= 0) {
      e.preventDefault()
      selectFund(filtered[highlightIndex])
    } else if (e.key === 'Escape') {
      setShowDropdown(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setMessage(null)

    const fundCode = selectedFund ? selectedFund.code : fundQuery.toUpperCase().trim()
    const qty = parseFloat(quantity)
    const price = parseFloat(pricePerUnit)

    if (!fundCode) {
      setMessage({ type: 'error', text: 'Fon kodu seçiniz.' })
      return
    }
    if (!qty || qty <= 0) {
      setMessage({ type: 'error', text: 'Geçerli bir adet giriniz.' })
      return
    }
    if (!price || price <= 0) {
      setMessage({ type: 'error', text: 'Geçerli bir fiyat giriniz.' })
      return
    }
    if (!date) {
      setMessage({ type: 'error', text: 'Tarih seçiniz.' })
      return
    }
    if (date > TODAY) {
      setMessage({ type: 'error', text: 'İleri tarihli işlem eklenemez.' })
      return
    }

    setSaving(true)
    try {
      await addTransaction({
        fundCode,
        type,
        quantity: qty,
        pricePerUnit: price,
        date: new Date(date),
      })

      const label = type === 'buy' ? 'Alım' : 'Satım'
      setMessage({ type: 'success', text: `${label} kaydı eklendi: ${fundCode} × ${qty}` })

      // Formu sıfırla
      setFundQuery('')
      setSelectedFund(null)
      setQuantity('')
      setPricePerUnit('')
      setDate(TODAY)

      if (onSaved) onSaved()
    } catch {
      setMessage({ type: 'error', text: 'Kayıt eklenirken bir hata oluştu.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="transaction-form">
      <h3 className="transaction-form-title">İşlem Ekle</h3>
      <form onSubmit={handleSubmit}>
        <div className="tx-form-row">
          <div className="tx-form-group tx-type-group">
            <label>Tür</label>
            <div className="tx-type-toggle">
              <button
                type="button"
                className={`tx-type-btn ${type === 'buy' ? 'tx-type-active-buy' : ''}`}
                onClick={() => setType('buy')}
              >
                Alım
              </button>
              <button
                type="button"
                className={`tx-type-btn ${type === 'sell' ? 'tx-type-active-sell' : ''}`}
                onClick={() => setType('sell')}
              >
                Satım
              </button>
            </div>
          </div>

          <div className="tx-form-group tx-fund-group" ref={wrapperRef}>
            <label>Fon</label>
            <div className="tx-fund-autocomplete">
              <input
                type="text"
                value={fundQuery}
                onChange={handleFundInputChange}
                onFocus={() => fundQuery.length > 0 && !selectedFund && setShowDropdown(true)}
                onKeyDown={handleKeyDown}
                placeholder="Fon kodu veya adı"
                className="tx-input"
                disabled={saving}
                autoComplete="off"
              />
              {showDropdown && filtered.length > 0 && (
                <ul className="autocomplete-dropdown">
                  {filtered.map((fund, i) => (
                    <li
                      key={fund.code}
                      className={`autocomplete-item ${i === highlightIndex ? 'autocomplete-highlight' : ''}`}
                      onMouseDown={() => selectFund(fund)}
                      onMouseEnter={() => setHighlightIndex(i)}
                    >
                      <span className="autocomplete-code">{fund.code}</span>
                      <span className="autocomplete-name">{fund.name}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="tx-form-group">
            <label>Adet</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0"
              className="tx-input"
              min="0"
              step="any"
              disabled={saving}
            />
          </div>

          <div className="tx-form-group">
            <label>Birim Fiyat (TL)</label>
            <input
              type="number"
              value={pricePerUnit}
              onChange={(e) => setPricePerUnit(e.target.value)}
              placeholder="0.000000"
              className="tx-input"
              min="0"
              step="any"
              disabled={saving}
            />
          </div>

          <div className="tx-form-group">
            <label>Tarih</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={TODAY}
              className="tx-input"
              disabled={saving}
            />
          </div>

          <div className="tx-form-group tx-submit-group">
            <label>&nbsp;</label>
            <button type="submit" className="tx-submit-btn" disabled={saving}>
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </div>
      </form>
      {message && (
        <p className={`tx-message ${message.type === 'error' ? 'message-error' : 'message-success'}`}>
          {message.text}
        </p>
      )}
    </div>
  )
}

export default TransactionForm
