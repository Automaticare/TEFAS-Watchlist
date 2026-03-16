import { useState, useRef, useEffect } from 'react'
import { getFundHistory } from '../services/tefasApi'
import './AddFundForm.css'

function AddFundForm({ onAdd, existingCodes, fundList }) {
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [message, setMessage] = useState(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [highlightIndex, setHighlightIndex] = useState(-1)
  const wrapperRef = useRef(null)

  const filtered = query.length > 0
    ? fundList.filter(
        (f) =>
          (f.code.toLowerCase().includes(query.toLowerCase()) ||
            f.name.toLowerCase().includes(query.toLowerCase())) &&
          !existingCodes.includes(f.code)
      ).slice(0, 20)
    : []

  useEffect(() => {
    setHighlightIndex(-1)
  }, [query])

  // Dışarı tıklayınca dropdown'u kapat
  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function addFund(fundCode) {
    if (existingCodes.includes(fundCode)) {
      setMessage({ type: 'error', text: `${fundCode} zaten watchlist'te.` })
      return
    }

    setSearching(true)
    setMessage(null)
    setShowDropdown(false)

    try {
      const today = new Date()
      const weekAgo = new Date()
      weekAgo.setDate(today.getDate() - 7)

      const data = await getFundHistory(fundCode, weekAgo, today)

      if (!data || data.length === 0) {
        setMessage({ type: 'error', text: `${fundCode} kodu ile fon bulunamadı.` })
        return
      }

      const fundName = data[0].FONUNVAN
      const added = onAdd(fundCode)

      if (added) {
        setMessage({ type: 'success', text: `${fundName} eklendi.` })
        setQuery('')
      }
    } catch {
      setMessage({ type: 'error', text: 'Fon aranırken bir hata oluştu.' })
    } finally {
      setSearching(false)
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = query.toUpperCase().trim()
    if (!trimmed) return

    // Dropdown'da seçili öğe varsa onu ekle
    if (highlightIndex >= 0 && filtered[highlightIndex]) {
      addFund(filtered[highlightIndex].code)
      return
    }

    addFund(trimmed)
  }

  function handleKeyDown(e) {
    if (!showDropdown || filtered.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightIndex((prev) => (prev > 0 ? prev - 1 : filtered.length - 1))
    } else if (e.key === 'Escape') {
      setShowDropdown(false)
    }
  }

  return (
    <div className="add-fund-form" ref={wrapperRef}>
      <form onSubmit={handleSubmit}>
        <div className="add-fund-autocomplete">
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setShowDropdown(true)
            }}
            onFocus={() => query.length > 0 && setShowDropdown(true)}
            onKeyDown={handleKeyDown}
            placeholder="Fon kodu veya adı ara..."
            className="add-fund-input"
            disabled={searching}
            autoComplete="off"
          />
          {showDropdown && filtered.length > 0 && (
            <ul className="autocomplete-dropdown">
              {filtered.map((fund, i) => (
                <li
                  key={fund.code}
                  className={`autocomplete-item ${i === highlightIndex ? 'autocomplete-highlight' : ''}`}
                  onMouseDown={() => addFund(fund.code)}
                  onMouseEnter={() => setHighlightIndex(i)}
                >
                  <span className="autocomplete-code">{fund.code}</span>
                  <span className="autocomplete-name">{fund.name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button type="submit" className="add-fund-btn" disabled={searching || !query.trim()}>
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
