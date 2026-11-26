import type { SpeedUnit, ThemeId } from './settings';

/**
 * Klasik gösterge temaları. Her tema yalnızca renk değil; kadranın geometrisini (yuvarlak, şerit,
 * yelpaze, tambur, sütun, dijital), panel kaplamasını (ceviz, alüminyum, kaporta rengi) ve
 * rakam karakterini belirler. Tasarımlar dönemlerden esinlenmiş özgün çizimlerdir; marka amblemi kullanılmaz.
 */

/** Hız göstergesinin geometrisi */
export type GaugeKind =
  | 'twin' // İki yuvarlak kadran (hız + analog saat), dikdörtgen siyah gövde — 70'ler Anadolu sedanı
  | 'ribbon' // Yatay şerit: sabit skala üzerinde sağa sola kayan ibre — 60'lar
  | 'sport' // Büyük siyah yuvarlak kadran, krom çerçeve, ceviz panel — İngiliz roadster
  | 'drum' // Dönen tambur: büyüteç penceresinden akan rakamlar — 70'ler Fransız
  | 'vfd' // Vakum floresan dijital: yeşil segment rakam + yay çubuk grafik — 80'ler
  | 'led' // Kırmızı LED: segment rakam + yatay LED merdiven — 70'ler sonu
  | 'arcband' // Fildişi gövde, üstte siyah rakam şeridi, alttan yelpaze ibre, ızgara + lamba sırası — 60'lar İtalyan
  | 'chev' // Bordo lake panelde siyah yelpaze kadran, eğik rakamlar ve noktalar — 50'ler Amerikan
  | 'band'; // Yatay bant: soldan büyüyen turuncu şerit, altta saat — 60'lar İsveç

/** Panel kaplaması (arka plan dokusu) */
export type Fascia = 'crackle' | 'brushed' | 'body' | 'wood' | 'plastic' | 'ivory' | 'glass';

/** Rakam karakteri (özel çizim fontun varyantları) */
/** seg: eğik 7 segment (VFD) · flat: dik, düz 7 segment (LED) */
export type GlyphStyle = 'classic' | 'bold' | 'thin' | 'seg' | 'flat' | 'italic';

export interface Palette {
  /** Panel / ekran zemini */
  bg: string;
  /** Kadran yüzü */
  face: string;
  /** Kadran rakamları ve büyük çizgiler */
  text: string;
  /** İbre */
  needle: string;
  /** Krom / metal çerçeve */
  chrome: string;
  /** Ana vurgu (aydınlatma, etiket vurgusu) */
  primary: string;
  /** İkincil vurgu */
  secondary: string;
  /** Üçüncü vurgu (pusula kuzeyi, panel kenarı) */
  holo: string;
  /** Soluk çizgiler / etiketler */
  dim: string;
  /** Hafif dolgu */
  glass: string;
  warn: string;
  danger: string;
}

export interface ClassicTheme {
  id: ThemeId;
  name: string;
  /** Dönem etiketi (kartta görünür) */
  era: string;
  tagline: string;
  gauge: GaugeKind;
  fascia: Fascia;
  glyph: GlyphStyle;
  /** Skala sonu (km/sa ve mph) */
  maxKmh: number;
  maxMph: number;
  night: Palette;
  day: Palette;
}

const base = { warn: '#FFB23E', danger: '#FF4A3D' };

export const THEMES: Record<ThemeId, ClassicTheme> = {
  fildisi: {
    id: 'fildisi',
    name: 'Fildişi 124',
    era: "1960'LAR · İTALYAN",
    tagline: 'Fildişi gövde · siyah rakam şeridi · alttan yelpaze ibre · krom ızgara ve lamba sırası',
    gauge: 'arcband',
    fascia: 'ivory',
    glyph: 'classic',
    maxKmh: 180,
    maxMph: 110,
    day: { ...base, bg: '#4A4438', face: '#5E5F59', text: '#F4F1E6', needle: '#E9C27A', chrome: '#D6D2C4', primary: '#E9C27A', secondary: '#F4F1E6', holo: '#E9C27A', dim: '#B4AA92', glass: 'rgba(244,241,230,0.07)' },
    night: { ...base, bg: '#1A1712', face: '#262622', text: '#C8F0A8', needle: '#FFC86A', chrome: '#6A665C', primary: '#C8F0A8', secondary: '#C8F0A8', holo: '#FFC86A', dim: '#5E584A', glass: 'rgba(200,240,168,0.05)' },
  },
  bordo: {
    id: 'bordo',
    name: 'Bordo 55',
    era: "1950'LER · AMERİKAN V8",
    tagline: 'Bordo lake panel · krom çerçeveli siyah yelpaze kadran · eğik rakamlar ve noktalar',
    gauge: 'chev',
    fascia: 'body',
    glyph: 'italic',
    maxKmh: 180,
    maxMph: 110,
    day: { ...base, bg: '#5A0E16', face: '#0B0909', text: '#F1E7D2', needle: '#F1E7D2', chrome: '#E4E6EA', primary: '#F0C27A', secondary: '#FFB23E', holo: '#E23A2A', dim: '#C9A0A0', glass: 'rgba(241,231,210,0.07)' },
    night: { ...base, bg: '#2A060A', face: '#060505', text: '#FFD58A', needle: '#FFE3A8', chrome: '#6E6A6A', primary: '#FFC86A', secondary: '#FFB23E', holo: '#FF5030', dim: '#7A4A4A', glass: 'rgba(255,200,106,0.06)' },
  },
  isvec: {
    id: 'isvec',
    name: 'İsveç 68',
    era: "1960'LAR · İSKANDİNAV",
    tagline: 'Siyah panel · beyaz rakamlar · soldan büyüyen kırmızı bant · altta saat ve sayaç',
    gauge: 'band',
    fascia: 'crackle',
    glyph: 'classic',
    maxKmh: 160,
    maxMph: 100,
    // Standart renkler: beyaz rakamlar, kırmızı ibre (gündüz ve gece aynı; gece yalnızca hafif kısılır)
    day: { ...base, bg: '#151515', face: '#0A0A0A', text: '#FFFFFF', needle: '#E3261C', chrome: '#BFC3C7', primary: '#E3261C', secondary: '#FFFFFF', holo: '#E3261C', dim: '#8E8E8A', glass: 'rgba(255,255,255,0.05)' },
    night: { ...base, bg: '#070707', face: '#050505', text: '#EDEDED', needle: '#D0221A', chrome: '#4E5256', primary: '#D0221A', secondary: '#EDEDED', holo: '#D0221A', dim: '#5A5A58', glass: 'rgba(255,255,255,0.04)' },
  },
  yesil: {
    id: 'yesil',
    name: 'Yeşil Klasik',
    era: "1950'LER · YEŞİL KAPORTA",
    tagline: 'Yeşil boyalı panel · büyük krem kadran · siyah rakamlar · kırmızı ibre',
    gauge: 'sport',
    fascia: 'body',
    glyph: 'classic',
    maxKmh: 160,
    maxMph: 100,
    day: { ...base, bg: '#2F5E43', face: '#EFE6CC', text: '#1D1C17', needle: '#C8281E', chrome: '#E2E4E6', primary: '#E8D9A6', secondary: '#1D1C17', holo: '#C8281E', dim: '#A9C7B0', glass: 'rgba(239,230,204,0.08)' },
    night: { ...base, bg: '#11261A', face: '#0F1D14', text: '#8DF5A6', needle: '#FF5A3A', chrome: '#5D6A62', primary: '#8DF5A6', secondary: '#8DF5A6', holo: '#FF5A3A', dim: '#4C6E57', glass: 'rgba(141,245,166,0.05)' },
  },
  anadolu: {
    id: 'anadolu',
    name: 'Anadolu 131',
    era: "1970'LER · SEDAN",
    tagline: 'İki yuvarlak kadran · turuncu ibre · analog saat · dikdörtgen siyah gövde',
    gauge: 'twin',
    fascia: 'crackle',
    glyph: 'classic',
    maxKmh: 180,
    maxMph: 120,
    day: { ...base, bg: '#141414', face: '#0B0B0C', text: '#F4F4F0', needle: '#FF7A1A', chrome: '#B9BCC0', primary: '#FF8A2A', secondary: '#E9E6DA', holo: '#FF7A1A', dim: '#8C8C88', glass: 'rgba(255,255,255,0.05)' },
    night: { ...base, bg: '#070707', face: '#050605', text: '#B7F59A', needle: '#FF6A10', chrome: '#55585C', primary: '#9FE07E', secondary: '#9FE07E', holo: '#FF6A10', dim: '#4E5A49', glass: 'rgba(159,224,126,0.05)' },
  },
  serit: {
    id: 'serit',
    name: 'Şerit 124',
    era: "1960'LAR · ŞERİT",
    tagline: 'Yatay skala · sağa sola kayan ibre · alüminyum panel',
    gauge: 'ribbon',
    fascia: 'brushed',
    glyph: 'classic',
    maxKmh: 180,
    maxMph: 110,
    day: { ...base, bg: '#2A2C2E', face: '#0D0D0E', text: '#F5F2E8', needle: '#FF4B1F', chrome: '#D5D8DB', primary: '#FF6A3A', secondary: '#E8E2CF', holo: '#FF4B1F', dim: '#9B9C9A', glass: 'rgba(255,255,255,0.06)' },
    night: { ...base, bg: '#0B0C0D', face: '#060606', text: '#FFD58E', needle: '#FF3B12', chrome: '#4C5054', primary: '#FFB75A', secondary: '#FFD58E', holo: '#FF3B12', dim: '#6A5A42', glass: 'rgba(255,183,90,0.05)' },
  },
  roadster: {
    id: 'roadster',
    name: 'Ceviz Roadster',
    era: "1960'LAR · İNGİLİZ SPOR",
    tagline: 'Büyük siyah kadran · krom çerçeve · beyaz ibre · ceviz kaplama panel',
    gauge: 'sport',
    fascia: 'wood',
    glyph: 'classic',
    maxKmh: 220,
    maxMph: 140,
    day: { ...base, bg: '#3A1F10', face: '#0C0C0B', text: '#F6F1E2', needle: '#F6F1E2', chrome: '#DADDE0', primary: '#E9C27A', secondary: '#F6F1E2', holo: '#E14A2A', dim: '#B89270', glass: 'rgba(255,230,190,0.07)' },
    night: { ...base, bg: '#1C0E07', face: '#060606', text: '#C9F0B4', needle: '#E8F5D8', chrome: '#5B5F63', primary: '#B8E39C', secondary: '#C9F0B4', holo: '#FF6A3D', dim: '#6E5A44', glass: 'rgba(184,227,156,0.05)' },
  },
  tambur: {
    id: 'tambur',
    name: 'Tambur',
    era: "1970'LER · FRANSIZ",
    tagline: 'Büyüteç penceresinde dönen tambur · sabit kırmızı çizgi',
    gauge: 'drum',
    fascia: 'plastic',
    glyph: 'classic',
    maxKmh: 200,
    maxMph: 120,
    day: { ...base, bg: '#1A1B1D', face: '#0A0A0B', text: '#F2F2EE', needle: '#FF3A2A', chrome: '#9EA3A8', primary: '#FF9A3C', secondary: '#E0DED6', holo: '#FF3A2A', dim: '#868A8E', glass: 'rgba(255,255,255,0.05)' },
    night: { ...base, bg: '#08090A', face: '#050505', text: '#FFB866', needle: '#FF3010', chrome: '#45494D', primary: '#FF9A3C', secondary: '#FFB866', holo: '#FF3010', dim: '#5E5144', glass: 'rgba(255,154,60,0.05)' },
  },
  vfd: {
    id: 'vfd',
    name: 'Dijital 85',
    era: "1980'LER · DİJİTAL",
    tagline: 'Yeşil vakum floresan ekran · segment rakam · yay çubuk grafik',
    gauge: 'vfd',
    fascia: 'glass',
    glyph: 'seg',
    maxKmh: 220,
    maxMph: 140,
    day: { ...base, bg: '#050807', face: '#020403', text: '#5CFFD0', needle: '#5CFFD0', chrome: '#2B3330', primary: '#4BF2C2', secondary: '#FFB23E', holo: '#FF5BB5', dim: '#3E6B5E', glass: 'rgba(75,242,194,0.06)' },
    night: { ...base, bg: '#020302', face: '#010201', text: '#3BD9A8', needle: '#3BD9A8', chrome: '#1B211F', primary: '#2FC497', secondary: '#D9922E', holo: '#D64A98', dim: '#2B4A41', glass: 'rgba(47,196,151,0.05)' },
  },
  led: {
    id: 'led',
    name: 'LED 79',
    era: "1970'LER SONU · LED",
    tagline: 'Dik, düz kırmızı LED rakamlar · yatay LED merdiven · füme cam',
    gauge: 'led',
    fascia: 'glass',
    glyph: 'flat',
    maxKmh: 240,
    maxMph: 150,
    day: { ...base, bg: '#0A0505', face: '#050202', text: '#FF3B2F', needle: '#FF3B2F', chrome: '#3A2626', primary: '#FF4A3A', secondary: '#FFB23E', holo: '#FF3B2F', dim: '#7A3A34', glass: 'rgba(255,59,47,0.06)' },
    night: { ...base, bg: '#040202', face: '#020101', text: '#D92A20', needle: '#D92A20', chrome: '#241717', primary: '#D93A2C', secondary: '#C98A2A', holo: '#D92A20', dim: '#55241F', glass: 'rgba(217,42,32,0.05)' },
  },
};

/** Temanın skala sonu (seçili birimde) */
export const themeMax = (t: ClassicTheme, unit: SpeedUnit) => (unit === 'mph' ? t.maxMph : t.maxKmh);

/** Uygulamanın ana rengi (menüler): sıcak amber */
export const APP_AMBER = '#E8A33D';

/**
 * Menü ekranları (başlangıç, ayarlar, kontrol paneli): koyu deri/kahve zemin, krem yazı, amber vurgu.
 * Tema renginden bağımsızdır; göstergeler kendi panellerinde kalır.
 */
export function uiPalette(): Palette {
  return {
    ...base,
    bg: '#17120D',
    face: '#0E0B08',
    text: '#F4EAD5',
    needle: '#FF7A1A',
    chrome: '#C9C2B4',
    primary: APP_AMBER,
    secondary: '#D9C7A0',
    holo: '#C0612B',
    dim: '#B3A288',
    glass: 'rgba(232,163,61,0.08)',
  };
}

/** Kullanıcının seçebileceği ibre renkleri (null = temanın ibresi) */
export const ACCENTS: { name: string; color: string }[] = [
  { name: 'Turuncu', color: '#FF7A1A' },
  { name: 'Kırmızı', color: '#E3261C' },
  { name: 'Beyaz', color: '#F6F3EA' },
  { name: 'Sarı', color: '#FFD23A' },
  { name: 'Yeşil', color: '#7CE07A' },
  { name: 'Buz', color: '#9FD8FF' },
];

/** Kadran rakam renkleri (null = temanın kendi rengi) */
export const SPEED_COLORS: { name: string; color: string | null }[] = [
  { name: 'Tema', color: null },
  { name: 'Beyaz', color: '#FFFFFF' },
  { name: 'Krem', color: '#F1E2BC' },
  { name: 'Amber', color: '#FFB347' },
  { name: 'Yeşil', color: '#9BF07E' },
  { name: 'Buz', color: '#A8E8FF' },
];

const hex2 = (n: number) => Math.round(Math.min(255, Math.max(0, n))).toString(16).padStart(2, '0');
const rgb = (h: string) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

/** İki renk arasında karışım (t=0 → a, t=1 → b) */
export function mix(a: string, b: string, t: number): string {
  if (a.length !== 7 || b.length !== 7) return a;
  const x = rgb(a);
  const y = rgb(b);
  return '#' + x.map((v, i) => hex2(v + (y[i] - v) * t)).join('');
}

/** Rengi koyulaştır (k < 1) / açıklaştır (k > 1) */
export function shade(h: string, k: number): string {
  if (h.length !== 7) return h;
  return '#' + rgb(h).map((v) => hex2(v * k)).join('');
}

/** İki palet arasında yumuşak geçiş (0 = gece, 1 = gündüz) */
function blend(n: Palette, d: Palette, level: number): Palette {
  if (level >= 1) return d;
  if (level <= 0) return n;
  const out = { ...n };
  (Object.keys(n) as (keyof Palette)[]).forEach((k) => {
    const a = n[k];
    const b = d[k];
    out[k] = a.startsWith('#') && a.length === 7 && b.startsWith('#') && b.length === 7 ? mix(a, b, level) : level >= 0.5 ? b : a;
  });
  return out;
}

/**
 * Tema + ışık seviyesi + isteğe bağlı ibre rengi → kullanılacak palet.
 * Gündüz (1): gün ışığında okunan kadran. Gece (0): klasik gösterge aydınlatması (yeşil, amber…).
 */
export function paletteFor(theme: ClassicTheme, light: boolean | number, accent: string | null): Palette {
  const level = typeof light === 'number' ? light : light ? 1 : 0;
  const p = blend(theme.night, theme.day, level);
  if (!accent) return p;
  return { ...p, needle: level >= 0.5 ? accent : shade(accent, 0.85) };
}

/**
 * Cam yansıtma paleti: zemin her zaman saf siyah; nostaljik amber rakamlar.
 * Gece kısılır, gündüz parlak. Mor/koyu mavi kullanılmaz (camda kaybolur).
 */
export function windshieldPalette(light: boolean | number, accent: string | null): Palette {
  const level = typeof light === 'number' ? light : light ? 1 : 0;
  const ui = uiPalette();
  const day: Palette = { ...ui, bg: '#000000', face: '#000000', text: '#FFFFFF', primary: accent ?? '#FFB347', needle: accent ?? '#FFB347', dim: '#C2A983' };
  const night: Palette = {
    ...ui,
    bg: '#000000',
    face: '#000000',
    text: '#FFFFFF',
    primary: accent ? shade(accent, 0.6) : '#A8641E',
    needle: accent ? shade(accent, 0.6) : '#A8641E',
    dim: '#5C4A34',
    warn: shade(base.warn, 0.7),
    danger: shade(base.danger, 0.8),
  };
  return blend(night, day, level);
}

/** #RRGGBB + opaklık */
export function alpha(hex: string, a: number): string {
  if (!hex.startsWith('#') || hex.length !== 7) return hex;
  const v = Math.round(Math.min(1, Math.max(0, a)) * 255)
    .toString(16)
    .padStart(2, '0');
  return hex + v;
}
