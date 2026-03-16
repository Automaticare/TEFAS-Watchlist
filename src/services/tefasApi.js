const TEFAS_BASE_URL = '/api/DB'

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
 * TEFAS API'ye POST isteği gönderir.
 */
async function tefasPost(endpoint, params) {
  const body = new URLSearchParams(params)

  const response = await fetch(`${TEFAS_BASE_URL}/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Requested-With': 'XMLHttpRequest',
    },
    body: body.toString(),
  })

  if (!response.ok) {
    throw new Error(`TEFAS API error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

/**
 * Fon fiyat ve getiri bilgilerini çeker.
 *
 * @param {string} fundCode - Fon kodu (örn: "TTA"). Boş bırakılırsa tüm fonlar döner.
 * @param {Date|string} startDate - Başlangıç tarihi
 * @param {Date|string} endDate - Bitiş tarihi
 * @returns {Promise<Array>} Fon verileri
 */
export async function getFundHistory(fundCode, startDate, endDate) {
  const params = {
    fonkod: fundCode || '',
    bastarih: formatDate(startDate),
    bittarih: formatDate(endDate),
  }

  const result = await tefasPost('BindHistoryInfo', params)
  return result.data || []
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
 *
 * @param {string} fundCode - Fon kodu (örn: "TTA")
 * @param {Date|string} startDate - Başlangıç tarihi
 * @param {Date|string} endDate - Bitiş tarihi
 * @returns {Promise<Array>} Portföy dağılım verileri
 */
export async function getFundAllocation(fundCode, startDate, endDate) {
  const params = {
    fonkod: fundCode || '',
    bastarih: formatDate(startDate),
    bittarih: formatDate(endDate),
  }

  const result = await tefasPost('BindHistoryAllocation', params)
  return result.data || []
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

export { formatDate }
