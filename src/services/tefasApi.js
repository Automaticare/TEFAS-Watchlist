const IS_DEV = import.meta.env.DEV
const TEFAS_BASE_URL = '/api/DB'
const FUNCTION_URL = '/tefasProxy'
const MAX_DAYS_PER_REQUEST = 90
const FUND_TYPES = ['YAT', 'EMK', 'BYF']

/**
 * Tarihi dd.mm.yyyy formatına çevirir.
 */
function formatDate(date) {
  const d = new Date(date)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}.${month}.${year}`
}

/**
 * Tarih aralığını 90 günlük parçalara böler.
 */
function chunkDateRange(startDate, endDate) {
  const chunks = []
  let current = new Date(startDate)
  const end = new Date(endDate)

  while (current <= end) {
    const chunkEnd = new Date(current)
    chunkEnd.setDate(chunkEnd.getDate() + MAX_DAYS_PER_REQUEST - 1)

    chunks.push({
      start: new Date(current),
      end: chunkEnd > end ? new Date(end) : chunkEnd,
    })

    current = new Date(chunkEnd)
    current.setDate(current.getDate() + 1)
  }

  return chunks
}

/**
 * TEFAS API'ye POST isteği gönderir. Başarısız olursa retry yapar.
 */
async function tefasPost(endpoint, params, retries = 2) {
  const body = new URLSearchParams(params)

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      let response

      if (IS_DEV) {
        // Dev: Vite proxy üzerinden doğrudan TEFAS'a
        response = await fetch(`${TEFAS_BASE_URL}/${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Requested-With': 'XMLHttpRequest',
          },
          body: body.toString(),
        })
      } else {
        // Production: Firebase Cloud Function proxy
        response = await fetch(`${FUNCTION_URL}?endpoint=${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: body.toString(),
        })
      }

      if (!response.ok) {
        throw new Error(`TEFAS API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      if (attempt === retries) {
        throw error
      }
      await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)))
    }
  }
}

/**
 * Tüm fon tiplerini deneyerek veri çeker.
 * TEFAS fontip parametresini zorunlu tutuyor, hangi tipte olduğunu bilmiyorsak hepsini deneriz.
 */
async function tefasPostAllTypes(endpoint, params) {
  for (const fontip of FUND_TYPES) {
    const result = await tefasPost(endpoint, { ...params, fontip })
    if (result.data && result.data.length > 0) {
      return result
    }
  }
  return { data: [] }
}

/**
 * Fon fiyat ve getiri bilgilerini çeker.
 * 90 günden uzun aralıkları otomatik olarak parçalar.
 *
 * @param {string} fundCode - Fon kodu (örn: "TTA")
 * @param {Date|string} startDate - Başlangıç tarihi
 * @param {Date|string} endDate - Bitiş tarihi
 * @returns {Promise<Array>} Fon verileri
 */
export async function getFundHistory(fundCode, startDate, endDate) {
  const chunks = chunkDateRange(startDate, endDate)

  const results = []
  for (const chunk of chunks) {
    const params = {
      fonkod: fundCode || '',
      bastarih: formatDate(chunk.start),
      bittarih: formatDate(chunk.end),
    }

    const result = await tefasPostAllTypes('BindHistoryInfo', params)
    if (result.data) {
      results.push(...result.data)
    }
  }

  return results
}

/**
 * Bugünün fon verisini çeker.
 *
 * @param {string} fundCode - Fon kodu
 * @returns {Promise<Object|null>} Güncel fon verisi
 */
export async function getFundToday(fundCode) {
  const today = new Date()
  const data = await getFundHistory(fundCode, today, today)
  return data.length > 0 ? data[0] : null
}

/**
 * Birden fazla fonun güncel verisini çeker.
 *
 * @param {string[]} fundCodes - Fon kodları listesi
 * @returns {Promise<Array>} Her fon için güncel veri
 */
export async function getMultipleFundsToday(fundCodes) {
  const promises = fundCodes.map((code) => getFundToday(code))
  const results = await Promise.allSettled(promises)

  return results.map((result, index) => ({
    fundCode: fundCodes[index],
    data: result.status === 'fulfilled' ? result.value : null,
    error: result.status === 'rejected' ? result.reason.message : null,
  }))
}

/**
 * Fonun portföy dağılımını çeker (hisse, tahvil, altın, döviz vb.).
 * 90 günden uzun aralıkları otomatik olarak parçalar.
 *
 * @param {string} fundCode - Fon kodu (örn: "TTA")
 * @param {Date|string} startDate - Başlangıç tarihi
 * @param {Date|string} endDate - Bitiş tarihi
 * @returns {Promise<Array>} Portföy dağılım verileri
 */
export async function getFundAllocation(fundCode, startDate, endDate) {
  const chunks = chunkDateRange(startDate, endDate)

  const results = []
  for (const chunk of chunks) {
    const params = {
      fonkod: fundCode || '',
      bastarih: formatDate(chunk.start),
      bittarih: formatDate(chunk.end),
    }

    const result = await tefasPostAllTypes('BindHistoryAllocation', params)
    if (result.data) {
      results.push(...result.data)
    }
  }

  return results
}

/**
 * Fonun bugünkü portföy dağılımını çeker.
 *
 * @param {string} fundCode - Fon kodu
 * @returns {Promise<Object|null>} Güncel portföy dağılımı
 */
export async function getFundAllocationToday(fundCode) {
  const today = new Date()
  const data = await getFundAllocation(fundCode, today, today)
  return data.length > 0 ? data[0] : null
}

/**
 * Tüm TEFAS fonlarının kod ve isim listesini çeker.
 * Her üç fon tipini (YAT, EMK, BYF) sorgular ve sonuçları birleştirir.
 *
 * @returns {Promise<Array<{code: string, name: string}>>} Fon listesi (kod + isim)
 */
export async function getAllFundsList() {
  const today = new Date()
  const todayStr = formatDate(today)

  const params = {
    fonkod: '',
    bastarih: todayStr,
    bittarih: todayStr,
  }

  const allFunds = new Map()

  for (const fontip of FUND_TYPES) {
    try {
      const result = await tefasPost('BindHistoryInfo', { ...params, fontip })
      if (result.data) {
        for (const item of result.data) {
          if (item.FONKODU && !allFunds.has(item.FONKODU)) {
            allFunds.set(item.FONKODU, {
              code: item.FONKODU,
              name: item.FONUNVAN || item.FONKODU,
            })
          }
        }
      }
    } catch {
      // Bir tip başarısız olursa diğerlerine devam et
    }
  }

  return Array.from(allFunds.values()).sort((a, b) => a.code.localeCompare(b.code))
}

export { formatDate, chunkDateRange }
