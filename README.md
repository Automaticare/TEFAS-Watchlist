# TEFAS Watchlist

Takasbank TEFAS üzerindeki fonları takip etmek için oluşturulmuş kişisel bir watchlist uygulaması.

## Proje Amacı

Belirli bir kullanıcının portföyündeki ve ilgilendiği TEFAS fonlarını tek bir panelden izleyebilmesini sağlamak. Uygulama günlük fon verilerini TEFAS'ın sitesinden çekerek aşağıdaki bilgileri sunar:

- **Günlük fiyat** (birim pay değeri)
- **Getiri bilgileri** (günlük, haftalık, aylık)
- **Toplam yatırımcı sayısı**
- **Portföy dağılımı** (hisse, tahvil, altın, döviz vb.)

## Takip Edilen Fonlar

| Kod | Fon Adı |
|-----|---------|
| TTA | İş Portföy Altın Fonu |
| TTE | İş Portföy BIST Teknoloji Ağırlıklı Sınırlı Pay Fonu |
| TBV | İş Portföy Özel Sektör Borçlanma Araçları Fonu |
| TI6 | İş Portföy Borçlanma Araçları Fonu |
| AES | Ak Portföy Petrol Yabancı BYF Fon Sepeti Fonu |
| YZG | Yapı Kredi Portföy Yabancı Teknoloji Sektörü Hisse Senedi Fonu |
| TGE | İş Portföy Emtia Yabancı BYF Fon Sepeti Fonu |
| PHE | Pusula Portföy Hisse Senedi Fonu |
| TI2 | İş Portföy Hisse Senedi Fonu |
| KKH | İş Portföy Dengeli Fon |
| BIO | İş Portföy Sürdürülebilir Hisse Senedi Fonu |
| IPJ | İş Portföy Elektrikli Araçlar Karma Fon |
| BHF | Pardus Portföy Birinci Hisse Senedi Fonu |

> Not: Fon listesi uygulama içinden düzenlenebilir olacaktır.

## Teknoloji Yığını

| Katman | Teknoloji |
|--------|-----------|
| Frontend | React (Vite) |
| Tablo & Grafik | Belirlenecek (Recharts, Chart.js vb.) |
| Backend / DB | Firebase (Firestore + Hosting) |
| Veri Kaynağı | TEFAS sitesi (dahili API endpointleri) |

## Veri Kaynağı

TEFAS'ın resmi bir public API'ı bulunmamaktadır. Ancak `tefas.gov.tr` sitesinin arka planında kullandığı dahili endpointler JSON formatında veri döner. Bu projede bu endpointler kullanılacaktır:

- **Base URL:** `https://www.tefas.gov.tr/api/DB/`
- **Endpoint:** `BindHistoryInfo` (fiyat, yatırımcı sayısı, piyasa değeri)
- **Endpoint:** `BindHistoryAllocation` (portföy dağılımı)
- **Metod:** POST (`application/x-www-form-urlencoded`)
- **Tarih aralığı limiti:** Tek sorguda maksimum 90 gün
- **Fon tipleri:** YAT (Yatırım Fonları), EMK (Emeklilik Fonları), BYF (Borsa Yatırım Fonları)

Ayrıca npm'de mevcut olan `@firstthumb/tefas-api` paketi de değerlendirilecektir.

## Maliyet

Proje tamamen **ücretsiz** çalışacak şekilde tasarlanmıştır:

- **Firebase Spark (Ücretsiz) planı** kullanılacaktır
  - Firestore: 1 GiB depolama, 50K okuma/gün, 20K yazma/gün
  - Hosting: 10 GB/ay transfer, 1 GB depolama
- TEFAS endpointleri herkese açıktır, API anahtarı gerektirmez

## Geliştirme Planı (Issue Bazlı)

### Issue #1 — Proje Altyapısı
React projesinin oluşturulması ve temel yapının kurulması.
- [ ] React projesi oluşturma (Vite)
- [ ] Klasör yapısını belirleme
- [ ] Firebase projesini oluşturma ve config ekleme
- [ ] Temel routing yapısı

### Issue #2 — TEFAS Veri Servisi
TEFAS endpointlerinden veri çekecek servis katmanının yazılması.
- [ ] TEFAS API client (fiyat, getiri, yatırımcı sayısı)
- [ ] Portföy dağılımı verisi çekme
- [ ] Hata yönetimi ve rate limiting

### Issue #3 — Firestore Veri Modeli & Entegrasyonu
Veritabanı şeması ve veri yazma/okuma işlemleri.
- [ ] Firestore koleksiyon yapısı tasarımı
- [ ] Fon verilerini Firestore'a yazma
- [ ] Firestore'dan okuma servisleri

### Issue #4 — Watchlist Tablosu
Ana sayfa: fonların tablo halinde listelenmesi.
- [ ] Fon listesi tablosu (fiyat, günlük/haftalık/aylık getiri, yatırımcı sayısı)
- [ ] Sıralama ve filtreleme
- [ ] Responsive tasarım

### Issue #5 — Fon Detay Sayfası
Tek bir fonun detaylı bilgilerini gösteren sayfa.
- [ ] Fon özet kartı
- [ ] Portföy dağılımı grafiği (donut chart)
- [ ] Tarihsel fiyat grafiği (line chart)

### Issue #6 — Grafik & Karşılaştırma
Fonlar arası karşılaştırma ve gelişmiş grafikler.
- [ ] Getiri karşılaştırma grafiği (bar chart)
- [ ] Çoklu fon fiyat karşılaştırması (multi-line chart)
- [ ] Tarih aralığı seçici

### Issue #7 — Fon Yönetimi
Watchlist'e fon ekleme ve çıkarma.
- [ ] Fon arama (TEFAS'tan kod ile arama)
- [ ] Fon ekleme / çıkarma
- [ ] Varsayılan fon listesi

### Issue #8 — Deploy
Firebase Hosting üzerinden yayına alma.
- [ ] Build optimizasyonu
- [ ] Firebase Hosting deploy
- [ ] README güncelleme (canlı link)

## Lisans

MIT
