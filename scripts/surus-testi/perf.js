// Sürüş benzetimi: 4x yavaş işlemci, 1 Hz gürültülü GPS (hız bilgisi yok, konumdan hesaplanır),
// doğruluk dalgalanması ve 7 sn'lik tünel kesintisi. Kare süreleri ve uzun görevler ölçülür.
const { chromium } = require('playwright');
const [SP, theme, secs] = [process.argv[2], process.argv[3], +(process.argv[4] || 40)];
(async () => {
  const b = await chromium.launch();
  const c = await b.newContext({ viewport: { width: 915, height: 412 }, permissions: ['geolocation'], geolocation: { latitude: 41, longitude: 29, accuracy: 8 } });
  const p = await c.newPage();
  await p.goto('http://localhost:8130/kadran/');
  await p.evaluate((v) => localStorage.setItem('kadran.settings', v), JSON.stringify({ theme, lastView: 'kokpit', dayNight: 'gunduz' }));
  await p.goto('http://localhost:8130/kadran/kokpit');
  await p.waitForTimeout(2500);
  const cdp = await c.newCDPSession(p);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: +(process.env.RATE || 8) });
  await p.evaluate(() => {
    window.__f = []; let last = performance.now();
    const loop = (t) => { window.__f.push(t - last); last = t; requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
    window.__lt = 0; new PerformanceObserver((l) => { window.__lt += l.getEntries().length; }).observe({ entryTypes: ['longtask'] });
  });
  let lat = 41, lon = 29, seed = 7; const statuses = [];
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) - 0.5;
  for (let s = 0; s < secs; s++) {
    const kmh = 40 + 50 * Math.sin(s / 9) ** 2; // 40–90 km/sa
    lat += (kmh / 3.6) / 111320;
    const tunnel = s >= 20 && s < 27;
    if (!tunnel) {
      const acc = s % 11 === 0 ? 60 : 6 + Math.abs(rnd()) * 12; // ara sıra kötü doğruluk
      await c.setGeolocation({ latitude: lat + rnd() * 0.00003, longitude: lon + rnd() * 0.00003, accuracy: acc });
    }
    await p.waitForTimeout(1000);
    const txt = await p.evaluate(() => document.body.innerText);
    const st = ['SİNYAL KAYBOLDU', 'ZAYIF SİNYAL', 'UYDU ARANIYOR', 'KONUM İZNİ'].find((k) => txt.includes(k)) || 'ok';
    statuses.push(st === 'ok' ? '.' : st[0]);
  }
  console.log('durum:', statuses.join(''));
  const r = await p.evaluate(() => {
    const f = window.__f.slice(5); const n = f.length;
    const over = (ms) => f.filter((x) => x > ms).length;
    const sorted = [...f].sort((a, b) => a - b);
    return { frames: n, fps: +(n / (f.reduce((a, b) => a + b, 0) / 1000)).toFixed(1), p95: +sorted[Math.floor(n * 0.95)].toFixed(1), max: +sorted[n - 1].toFixed(0), over50: over(50), over100: over(100), longtasks: window.__lt };
  });
  console.log(theme, JSON.stringify(r));
  await b.close();
})();
