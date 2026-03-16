import { useState, useEffect } from 'react'
import { DEFAULT_FUNDS } from '../config/collections'

const STORAGE_KEY = 'tefas-watchlist-funds'

function loadFunds() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch {
    // ignore
  }
  return [...DEFAULT_FUNDS]
}

function saveFunds(funds) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(funds))
}

export function useWatchlist() {
  const [fundCodes, setFundCodes] = useState(loadFunds)

  useEffect(() => {
    saveFunds(fundCodes)
  }, [fundCodes])

  function addFund(code) {
    const upper = code.toUpperCase().trim()
    if (!upper || fundCodes.includes(upper)) return false
    setFundCodes((prev) => [...prev, upper])
    return true
  }

  function removeFund(code) {
    setFundCodes((prev) => prev.filter((c) => c !== code))
  }

  function resetToDefaults() {
    setFundCodes([...DEFAULT_FUNDS])
  }

  return { fundCodes, addFund, removeFund, resetToDefaults }
}
