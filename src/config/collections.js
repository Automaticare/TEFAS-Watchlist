/**
 * Firestore koleksiyon yapısı:
 *
 * watchlist (koleksiyon)
 *   └── {fundCode} (doküman, örn: "TTA")
 *       ├── fundCode: "TTA"
 *       ├── fundName: "İŞ PORTFÖY ALTIN FONU"
 *       ├── fundType: "YAT"
 *       ├── addedAt: Timestamp
 *       └── history (alt koleksiyon)
 *           └── {YYYY-MM-DD} (doküman, örn: "2026-03-13")
 *               ├── date: Timestamp
 *               ├── price: 0.699420
 *               ├── totalShares: 46700448562
 *               ├── investors: 224820
 *               ├── marketCap: 32663230277.17
 *               └── allocation: { stocks: 0, bonds: 0, gold: 45.15, ... }
 */

export const COLLECTIONS = {
  WATCHLIST: 'watchlist',
  HISTORY: 'history',
  TRANSACTIONS: 'transactions',
}

/**
 * transactions (koleksiyon)
 *   └── {autoId} (doküman)
 *       ├── fundCode: "TTA"
 *       ├── type: "buy" | "sell"
 *       ├── quantity: 100        (pay adedi)
 *       ├── pricePerUnit: 0.699  (birim fiyat, TL)
 *       ├── date: Timestamp      (işlem tarihi)
 *       ├── createdAt: Timestamp
 */

export const DEFAULT_FUNDS = [
  'TTA', 'TTE', 'TBV', 'TI6', 'AES', 'YZG',
  'TGE', 'PHE', 'TI2', 'KKH', 'BIO', 'IPJ', 'BHF',
]
