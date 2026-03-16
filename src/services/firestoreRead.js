import { doc, getDoc, getDocs, collection, query, orderBy, limit } from 'firebase/firestore'
import { db } from '../config/firebase'
import { COLLECTIONS } from '../config/collections'

/**
 * Watchlist'teki tüm fonları getirir.
 *
 * @returns {Promise<Array>} Fon listesi
 */
export async function getWatchlist() {
  const snapshot = await getDocs(collection(db, COLLECTIONS.WATCHLIST))
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
}

/**
 * Tek bir fonun watchlist bilgisini getirir.
 *
 * @param {string} fundCode - Fon kodu
 * @returns {Promise<Object|null>}
 */
export async function getFund(fundCode) {
  const ref = doc(db, COLLECTIONS.WATCHLIST, fundCode)
  const snapshot = await getDoc(ref)
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null
}

/**
 * Bir fonun tarihsel verilerini getirir (en yeniden eskiye).
 *
 * @param {string} fundCode - Fon kodu
 * @param {number} maxDays - Maksimum gün sayısı (varsayılan: 30)
 * @returns {Promise<Array>} Tarihsel veri listesi
 */
export async function getFundHistory(fundCode, maxDays = 30) {
  const ref = collection(db, COLLECTIONS.WATCHLIST, fundCode, COLLECTIONS.HISTORY)
  const q = query(ref, orderBy('date', 'desc'), limit(maxDays))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
}

/**
 * Bir fonun en son kaydedilen günlük verisini getirir.
 *
 * @param {string} fundCode - Fon kodu
 * @returns {Promise<Object|null>}
 */
export async function getLatestFundData(fundCode) {
  const data = await getFundHistory(fundCode, 1)
  return data.length > 0 ? data[0] : null
}

/**
 * Watchlist'teki tüm fonların en son verilerini getirir.
 *
 * @returns {Promise<Array>} Her fon için en son veri
 */
export async function getAllFundsLatestData() {
  const funds = await getWatchlist()
  const promises = funds.map(async (fund) => {
    const latest = await getLatestFundData(fund.fundCode)
    return { ...fund, latest }
  })
  return Promise.all(promises)
}
