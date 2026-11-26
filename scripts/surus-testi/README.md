# Sürüş benzetimi (akıcılık ve hız kararlılığı)

Telefon hızında (işlemci 8 kat yavaşlatılmış) 40 sn'lik sürüş: 1 Hz gürültülü GPS, ara sıra kötü doğruluk,
7 sn'lik tünel kesintisi. Kare süreleri, uzun görevler ve ekrandaki GPS uyarıları saniye saniye ölçülür.

```bash
# web derlemesi /kadran altında http://localhost:8130 üzerinden sunulurken:
node scripts/surus-testi/perf.js <çıktı-klasörü> <tema> 40      # ör. tema: led, anadolu, vfd
```

Durum satırında `.` = normal, `Z` = zayıf sinyal, `S` = sinyal kayboldu.
