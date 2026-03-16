import { https } from 'firebase-functions'

const TEFAS_BASE_URL = 'https://www.tefas.gov.tr/api/DB'

export const tefasProxy = https.onRequest((req, res) => {
  // CORS headers
  res.set('Access-Control-Allow-Origin', '*')
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.set('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.status(204).send('')
    return
  }

  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed')
    return
  }

  const endpoint = req.query.endpoint
  if (!endpoint) {
    res.status(400).send('Missing endpoint parameter')
    return
  }

  const allowedEndpoints = ['BindHistoryInfo', 'BindHistoryAllocation', 'BindComparisonFundReturns']
  if (!allowedEndpoints.includes(endpoint)) {
    res.status(400).send('Invalid endpoint')
    return
  }

  fetch(`${TEFAS_BASE_URL}/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Requested-With': 'XMLHttpRequest',
      'Origin': 'https://www.tefas.gov.tr',
      'Referer': 'https://www.tefas.gov.tr/TarihselVeriler.aspx',
    },
    body: req.rawBody,
  })
    .then((response) => response.text())
    .then((data) => {
      res.set('Cache-Control', 'public, max-age=300')
      res.status(200).send(data)
    })
    .catch(() => {
      res.status(500).send('TEFAS API request failed')
    })
})
