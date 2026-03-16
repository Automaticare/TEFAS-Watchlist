import { doc, setDoc, Timestamp } from 'firebase/firestore'
import { db } from '../config/firebase'
import { COLLECTIONS } from '../config/collections'

/**
 * Watchlist'e yeni bir fon ekler.
 *
 * @param {string} fundCode - Fon kodu (örn: "TTA")
 * @param {string} fundName - Fon adı
 * @param {string} fundType - Fon tipi (YAT, EMK, BYF)
 */
export async function addFundToWatchlist(fundCode, fundName, fundType) {
  const ref = doc(db, COLLECTIONS.WATCHLIST, fundCode)
  await setDoc(ref, {
    fundCode,
    fundName,
    fundType,
    addedAt: Timestamp.now(),
  }, { merge: true })
}

/**
 * Bir fonun günlük verisini Firestore'a kaydeder.
 *
 * @param {string} fundCode - Fon kodu
 * @param {string} dateKey - Tarih anahtarı (YYYY-MM-DD)
 * @param {Object} data - Fon verisi
 * @param {number} data.price - Birim pay değeri
 * @param {number} data.totalShares - Tedavüldeki pay sayısı
 * @param {number} data.investors - Yatırımcı sayısı
 * @param {number} data.marketCap - Portföy büyüklüğü
 * @param {Object|null} data.allocation - Portföy dağılımı
 */
export async function saveFundDailyData(fundCode, dateKey, data) {
  const ref = doc(db, COLLECTIONS.WATCHLIST, fundCode, COLLECTIONS.HISTORY, dateKey)
  await setDoc(ref, {
    date: Timestamp.fromDate(new Date(dateKey)),
    price: data.price,
    totalShares: data.totalShares,
    investors: data.investors,
    marketCap: data.marketCap,
    allocation: data.allocation || null,
  })
}

/**
 * TEFAS API'den gelen ham veriyi Firestore formatına dönüştürür.
 *
 * @param {Object} raw - TEFAS API'den gelen ham veri
 * @returns {{ dateKey: string, data: Object }}
 */
export function transformTefasData(raw) {
  const timestamp = parseInt(raw.TARIH)
  const date = new Date(timestamp)
  const dateKey = date.toISOString().split('T')[0]

  return {
    dateKey,
    data: {
      price: raw.FIYAT,
      totalShares: raw.TEDPAYSAYISI,
      investors: raw.KISISAYISI,
      marketCap: raw.PORTFOYBUYUKLUK,
      allocation: null,
    },
  }
}

/**
 * TEFAS allocation verisini basitleştirilmiş formata dönüştürür.
 *
 * @param {Object} raw - TEFAS API'den gelen allocation verisi
 * @returns {Object} Sadeleştirilmiş dağılım
 */
export function transformAllocationData(raw) {
  return {
    stocks: raw.HS || 0,
    governmentBonds: raw.DT || 0,
    corporateBonds: raw.BTAA || 0,
    fx: raw.DÖT || 0,
    gold: raw.KMKBA || 0,
    preciousMetals: raw.KM || 0,
    repo: raw.GSYKB || 0,
    cash: raw.GYKB || 0,
    etf: raw.KMBYF || 0,
    fundOfFunds: raw.KKSTL || 0,
    other: raw.D || 0,
  }
}
