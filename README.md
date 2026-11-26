# KADRAN · Klasik Gösterge

Klasik araç göstergeleri: hız telefonun GPS'inden ölçülür, analog ibreler ve eski dijital ekranlar gerçek zamanlı çalışır.
Nexus HUD ile aynı ekran düzenini kullanır ama ondan tamamen bağımsız bir uygulamadır (ayrı ad, kimlik ve ayar deposu).

## Temalar (her biri farklı geometri)

| Tema | Dönem | Gösterge |
|---|---|---|
| Anadolu 131 | 1970'ler sedan | İki yuvarlak kadran (hız + analog saat), turuncu ibre, kilometre sayacı, uyarı lambaları |
| Şerit 124 | 1960'lar | Yatay skala üzerinde sağa sola kayan ibre, alüminyum panel |
| Krom 57 | 1950'ler Amerikan | Krem yelpaze kadran, krom halkalar, kırmızı ibre, turkuaz kaporta paneli |
| Ceviz Roadster | 1960'lar İngiliz spor | Büyük siyah kadran, krom çerçeve, küçük saat, ceviz panel |
| Tambur | 1970'ler Fransız | Büyüteç penceresinde dönen rakam tamburu |
| Termometre | 1960'lar Alman sedan | Dikey cam tüpte yükselen kırmızı sütun (km/h + mph) |
| Dijital 85 | 1980'ler | Yeşil vakum floresan, segment rakam, yay çubuk grafik |
| LED 79 | 1970'ler sonu | Kırmızı LED rakamlar, yatay LED merdiven |
| Cam HUD | — | Ön cama yansıtma, ayna görüntü, kalın amber rakamlar |

Tasarımlar dönemlerden esinlenmiş özgün çizimlerdir; marka amblemi kullanılmaz.

## Dürüstlük
GPS yoksa ibre sıfırda kalır, dijital ekranlarda `--` yazar. Kilometre sayacı yolculuk mesafesini, saatler gerçek saati,
uyarı lambaları gerçek GPS/hız uyarısı durumunu gösterir. Demo verisi açıkça etiketlenir.

```bash
npm install
npx expo start                     # geliştirme
npx expo export --platform web     # web derlemesi (dist/)
npm test && npx tsc --noEmit && npx expo lint
```
