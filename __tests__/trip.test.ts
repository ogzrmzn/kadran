import { addPoint, avgKmh, compassLabel, distanceM, durationLabel, newTrip } from '@/features/kadran/trip';

describe('HUD hesapları', () => {
  it('mesafe (yaklaşık 111 m / 0.001 enlem)', () => {
    expect(Math.round(distanceM({ lat: 41, lon: 29 }, { lat: 41.001, lon: 29 }))).toBe(111);
  });
  it('pusula harfleri', () => {
    expect(compassLabel(0)).toBe('K');
    expect(compassLabel(90)).toBe('D');
    expect(compassLabel(225)).toBe('GB');
    expect(compassLabel(359)).toBe('K');
    expect(compassLabel(null)).toBe('—');
  });
  it('cihaz hız vermezse noktalar arasından hesaplar, mesafe ve maks hız birikir', () => {
    let t = newTrip(0);
    // 1 sn'de ~27.8 m kuzeye = ~100 km/sa
    for (let i = 0; i <= 10; i++) t = addPoint(t, { lat: 41 + i * 0.00025, lon: 29, time: i * 1000, speed: null, heading: null, accuracy: 5 });
    expect(Math.round(t.speedKmh)).toBe(100);
    expect(Math.round(t.distanceM)).toBe(278);
    expect(Math.round(avgKmh(t))).toBe(100);
    expect(compassLabel(t.heading)).toBe('K');
  });
  it('durunca hız 0, mesafe artmaz; kötü konum yok sayılır', () => {
    let t = newTrip(0);
    t = addPoint(t, { lat: 41, lon: 29, time: 0, speed: 0, heading: null, accuracy: 5 });
    t = addPoint(t, { lat: 41.000005, lon: 29, time: 1000, speed: 0.2, heading: null, accuracy: 5 });
    expect(t.speedKmh).toBe(0);
    expect(t.distanceM).toBe(0);
    t = addPoint(t, { lat: 41.01, lon: 29, time: 2000, speed: 20, heading: 0, accuracy: 200 });
    expect(t.distanceM).toBe(0);
  });
  it('süre etiketi', () => {
    expect(durationLabel(5 * 60000)).toBe('5 dk');
    expect(durationLabel(65 * 60000)).toBe('1:05');
  });
});

describe('HUD hız sıfıra düşmesin', () => {
  const pt = (i: number, lat: number, speed: number | null) => ({ lat, lon: 29, time: i * 1000, speed, heading: null, accuracy: 5 });
  it('aynı konumun tekrarı (hız bilgisi yok) hızı sıfırlamaz', () => {
    let t = newTrip(0);
    for (let i = 0; i <= 5; i++) t = addPoint(t, pt(i, 41 + i * 0.00005, null)); // ~20 km/sa
    const before = Math.round(t.speedKmh);
    t = addPoint(t, pt(6, 41 + 5 * 0.00005, null)); // aynı konum tekrar geldi
    expect(Math.round(t.speedKmh)).toBe(before);
    expect(before).toBeGreaterThan(15);
  });
  it('cihazdan tek bir hatalı 0 gelirse gösterge düşmez; 2,5 sn sürerse 0 olur', () => {
    let t = newTrip(0);
    t = addPoint(t, pt(0, 41, 5.5)); // ~20 km/sa
    t = addPoint(t, pt(1, 41.00005, 0));
    expect(Math.round(t.speedKmh)).toBe(20);
    t = addPoint(t, pt(2, 41.0001, 5.6));
    expect(Math.round(t.speedKmh)).toBe(20);
    t = addPoint(t, pt(3, 41.0001, 0));
    t = addPoint(t, pt(4, 41.0001, 0));
    expect(t.speedKmh).toBeGreaterThan(0);
    t = addPoint(t, pt(6, 41.0001, 0));
    expect(t.speedKmh).toBe(0);
  });
});

describe('Sürüşte kararlı hız', () => {
  // ~70 km/sa sabit sürüş, konumda ±4 m gürültü, cihaz hızı yok (tarayıcı GPS'i gibi)
  const noisyTrace = (n: number) => {
    let seed = 11;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647 - 0.5) * 2;
    const pts = [];
    for (let i = 0; i <= n; i++) pts.push({ lat: 41 + (i * 70) / 3.6 / 111320 + (rnd() * 4) / 111320, lon: 29 + (rnd() * 4) / 84000, time: i * 1000, speed: null, heading: null, accuracy: 8 });
    return pts;
  };
  it('gürültülü konumdan hesaplanan hız süzülür: titreme ham ölçümün yarısından az', () => {
    let t = newTrip(0);
    const shown: number[] = [];
    let raw: number[] = [];
    const pts = noisyTrace(40);
    pts.forEach((p, i) => {
      t = addPoint(t, p);
      if (i > 10) shown.push(t.speedKmh);
      if (i > 10) raw.push((distanceM(pts[i - 1], p) / 1) * 3.6);
    });
    const sd = (a: number[]) => {
      const m = a.reduce((x, y) => x + y, 0) / a.length;
      return Math.sqrt(a.reduce((x, y) => x + (y - m) ** 2, 0) / a.length);
    };
    expect(sd(shown)).toBeLessThan(sd(raw) * 0.5);
    const mean = shown.reduce((x, y) => x + y, 0) / shown.length;
    expect(Math.abs(mean - 70)).toBeLessThan(5);
    raw = [];
  });
  it('tek bir hatalı sıçrama (70 → 180) göstergeyi uçurmaz', () => {
    let t = newTrip(0);
    for (let i = 0; i <= 5; i++) t = addPoint(t, { lat: 41 + i * 0.000175, lon: 29, time: i * 1000, speed: 70 / 3.6, heading: 0, accuracy: 5 });
    t = addPoint(t, { lat: 41 + 6 * 0.000175, lon: 29, time: 6000, speed: 180 / 3.6, heading: 0, accuracy: 5 });
    expect(t.speedKmh).toBeLessThan(70 + 25 + 1);
  });
  it('kötü doğruluklu ölçümün cihaz hızı kullanılmaz', () => {
    let t = newTrip(0);
    t = addPoint(t, { lat: 41, lon: 29, time: 0, speed: 60 / 3.6, heading: 0, accuracy: 5 });
    t = addPoint(t, { lat: 41.0002, lon: 29, time: 1000, speed: 150 / 3.6, heading: 0, accuracy: 400 });
    expect(Math.round(t.speedKmh)).toBe(60);
  });
});
