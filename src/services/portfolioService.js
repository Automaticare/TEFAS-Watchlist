import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, query, orderBy, where, Timestamp,
} from 'firebase/firestore'
import { db } from '../config/firebase'
import { COLLECTIONS } from '../config/collections'

const txRef = collection(db, COLLECTIONS.TRANSACTIONS)

/**
 * Yeni alım veya satım kaydı ekler.
 *
 * @param {{ fundCode: string, type: 'buy'|'sell', quantity: number, pricePerUnit: number, date: Date }} tx
 * @returns {Promise<string>} Oluşturulan doküman ID'si
 */
export async function addTransaction(tx) {
  const docRef = await addDoc(txRef, {
    fundCode: tx.fundCode,
    type: tx.type,
    quantity: tx.quantity,
    pricePerUnit: tx.pricePerUnit,
    date: Timestamp.fromDate(new Date(tx.date)),
    createdAt: Timestamp.now(),
  })
  return docRef.id
}

/**
 * Mevcut bir işlemi günceller.
 *
 * @param {string} txId - İşlem doküman ID'si
 * @param {{ fundCode?: string, type?: 'buy'|'sell', quantity?: number, pricePerUnit?: number, date?: Date }} updates
 */
export async function updateTransaction(txId, updates) {
  const ref = doc(db, COLLECTIONS.TRANSACTIONS, txId)
  const data = { ...updates }
  if (data.date) {
    data.date = Timestamp.fromDate(new Date(data.date))
  }
  await updateDoc(ref, data)
}

/**
 * Bir işlemi siler.
 *
 * @param {string} txId - İşlem doküman ID'si
 */
export async function deleteTransaction(txId) {
  const ref = doc(db, COLLECTIONS.TRANSACTIONS, txId)
  await deleteDoc(ref)
}

/**
 * Tüm işlemleri getirir (en yeniden eskiye).
 *
 * @returns {Promise<Array>} İşlem listesi
 */
export async function getAllTransactions() {
  const q = query(txRef, orderBy('date', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
}

/**
 * Belirli bir fonun işlemlerini getirir.
 *
 * @param {string} fundCode - Fon kodu
 * @returns {Promise<Array>} Fon işlem listesi
 */
export async function getTransactionsByFund(fundCode) {
  const q = query(txRef, where('fundCode', '==', fundCode), orderBy('date', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
}

/**
 * Tüm işlemlerden fon bazlı özet hesaplar.
 * Her fon için: net adet, ortalama maliyet, toplam yatırım
 *
 * @param {Array} transactions - İşlem listesi
 * @returns {Map<string, { fundCode: string, netQuantity: number, totalCost: number, avgCost: number }>}
 */
export function calcPortfolioSummary(transactions) {
  const summary = new Map()

  for (const tx of transactions) {
    const code = tx.fundCode
    if (!summary.has(code)) {
      summary.set(code, { fundCode: code, netQuantity: 0, totalCost: 0 })
    }
    const entry = summary.get(code)

    if (tx.type === 'buy') {
      entry.totalCost += tx.quantity * tx.pricePerUnit
      entry.netQuantity += tx.quantity
    } else {
      // Satışta ortalama maliyet oranında düş
      const costPerUnit = entry.netQuantity > 0 ? entry.totalCost / entry.netQuantity : 0
      entry.totalCost -= tx.quantity * costPerUnit
      entry.netQuantity -= tx.quantity
    }
  }

  // Ortalama maliyet hesapla
  for (const entry of summary.values()) {
    entry.avgCost = entry.netQuantity > 0 ? entry.totalCost / entry.netQuantity : 0
  }

  return summary
}
