import { useState, useEffect } from 'react'
import { getAllFundsList } from '../services/tefasApi'

const CACHE_KEY = 'tefas_fund_list'
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 saat

function getCachedList() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null

    const { funds, timestamp } = JSON.parse(raw)
    if (Date.now() - timestamp > CACHE_TTL) return null

    return funds
  } catch {
    return null
  }
}

function setCachedList(funds) {
  localStorage.setItem(CACHE_KEY, JSON.stringify({ funds, timestamp: Date.now() }))
}

/**
 * Tüm TEFAS fonlarının listesini döndürür.
 * İlk yüklemede TEFAS'tan çeker, sonra 24 saat localStorage'da cache'ler.
 */
export function useFundList() {
  const [funds, setFunds] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cached = getCachedList()
    if (cached) {
      setFunds(cached)
      setLoading(false)
      return
    }

    let cancelled = false

    getAllFundsList()
      .then((list) => {
        if (cancelled) return
        setFunds(list)
        setCachedList(list)
      })
      .catch(() => {
        // Hata durumunda boş liste ile devam et
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [])

  return { funds, loading }
}
