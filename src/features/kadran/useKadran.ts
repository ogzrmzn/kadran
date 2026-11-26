import { useEffect, useMemo } from 'react';
import { useKadranSettings } from './KadranProvider';
import type { KadranSettings } from './settings';
import { daylightLevel, effectiveBrightness, sunTimes, type SunTimes } from './sun';
import { paletteFor, THEMES, uiPalette, windshieldPalette, type Palette, type ClassicTheme } from './themes';

export interface KadranCtx {
  nx: KadranSettings;
  theme: ClassicTheme;
  /** Kokpit paleti */
  pal: Palette;
  /** Cam modu paleti (saf siyah, amber) */
  wpal: Palette;
  /** Menü ekranları için daha açık palet */
  upal: Palette;
  /** Işık seviyesi: 0 gece … 1 gündüz (güneşe göre modda yumuşak geçer) */
  light: number;
  day: boolean;
  /** Bugünün güneş saatleri (konum biliniyorsa) */
  sun: SunTimes | null;
  /** Uygulanacak parlaklık: ayar + gece kısılması */
  brightness: number | null;
  update: (patch: Partial<KadranSettings>) => void;
}

export function useKadran(): KadranCtx {
  const { nx, update, now } = useKadranSettings();
  const theme = THEMES[nx.theme];
  const pos = nx.lastPos;
  const sun = useMemo(() => (pos ? sunTimes(new Date(now), pos.lat, pos.lon) : null), [pos, now]);
  // Seviye 2 ondalıkla yuvarlanır: dakikalık saat tıklaması paleti gereksiz yere yeniden hesaplatmasın
  const light = nx.dayNight === 'gunduz' ? 1 : nx.dayNight === 'gece' ? 0 : Math.round(daylightLevel(new Date(now), pos) * 100) / 100;
  const pal = useMemo(() => paletteFor(theme, light, nx.accent), [theme, light, nx.accent]);
  // Cam HUD'u kendi başına bir tema: kokpit temasından bağımsız, yalnızca ibre rengini alır
  const wpal = useMemo(() => windshieldPalette(light, nx.accent), [light, nx.accent]);
  // Menüler ışık seviyesinden bağımsız, her zaman okunaklı
  const upal = useMemo(() => uiPalette(), []);
  const brightness = effectiveBrightness(nx.brightness, light);
  return { nx, theme, pal, wpal, upal, light, day: light >= 0.5, sun, brightness, update };
}

/**
 * GPS konumunu (yaklaşık, 2 ondalık) hatırlar: güneşe göre ışık, uygulama yeniden açılınca da
 * doğru saatleri kullansın. Yalnızca konum belirgin değişince (~10 km) kaydedilir.
 */
export function useRememberPosition(last: { lat: number; lon: number } | null) {
  const { nx, update } = useKadranSettings();
  const lat = last ? Math.round(last.lat * 100) / 100 : null;
  const lon = last ? Math.round(last.lon * 100) / 100 : null;
  useEffect(() => {
    if (lat == null || lon == null) return;
    const p = nx.lastPos;
    if (p && Math.abs(p.lat - lat) < 0.1 && Math.abs(p.lon - lon) < 0.1) return;
    update({ lastPos: { lat, lon } });
  }, [lat, lon, nx.lastPos, update]);
}
