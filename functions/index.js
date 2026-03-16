import { onRequest } from 'firebase-functions/v2/https'

const TEFAS_BASE_URL = 'https://www.tefas.gov.tr/api/DB'

export const tefasProxy = onRequest({ cors: true, region: 'europe-west1' }, async (req, res) => {
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

  try {
    const response = await fetch(`${TEFAS_BASE_URL}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Requested-With': 'XMLHttpRequest',
        'Origin': 'https://www.tefas.gov.tr',
        'Referer': 'https://www.tefas.gov.tr/TarihselVeriler.aspx',
      },
      body: req.body,
    })

    const data = await response.text()
    res.set('Cache-Control', 'public, max-age=300')
    res.status(response.status).send(data)
  } catch (error) {
    res.status(500).send('TEFAS API request failed')
  }
})
