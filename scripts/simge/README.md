# KADRAN simgesi

Simge SVG olarak çizilir ve tarayıcıda PNG'ye dönüştürülür.

```bash
mkdir -p /tmp/simge && python3 scripts/simge/make.py /tmp/simge && node scripts/simge/render.js /tmp/simge
```

Çıktılar: `icon` (genel), `maskable` (yuvarlak maske güvenli bölge), `fg` / `bgonly` / `mono` (Android uyarlanabilir simge), `splash` (açılış).
