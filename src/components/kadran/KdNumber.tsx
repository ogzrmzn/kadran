import { memo } from 'react';
import { Text, View } from 'react-native';
import Svg, { G, Path } from 'react-native-svg';
import type { GlyphStyle } from '@/features/kadran/themes';

/**
 * KADRAN rakam fontu. Hazır font kullanılmaz; rakamlar 10×16'lık kutuda çizilir:
 * - classic / bold / thin / italic: eski kadranlardaki yuvarlak hatlı, dar gövdeli rakamlar (çizgi yolu)
 * - seg: 80'lerin vakum floresan / LED ekranlarındaki 7 segment rakamlar (dolgu), sönük segmentler hayalet olarak görünür
 */

/** Klasik rakam iskeleti (10×16) */
const CLASSIC: Record<string, string> = {
  '0': 'M5 0C8.3 0 10 3 10 8C10 13 8.3 16 5 16C1.7 16 0 13 0 8C0 3 1.7 0 5 0Z',
  '1': 'M2.4 3.4L6 0L6 16',
  '2': 'M0.4 3.8C0.8 1.3 2.7 0 5 0C7.7 0 9.6 1.7 9.6 4.3C9.6 6.6 8.2 8.1 6 9.9L0.2 16L10 16',
  '3': 'M0.6 1.1C1.6 0.4 3 0 4.8 0C7.8 0 9.4 1.6 9.4 4C9.4 6.4 7.6 7.6 4.4 7.6C8 7.6 10 9.2 10 11.8C10 14.6 8 16 5 16C3 16 1.4 15.4 0.2 14.4',
  '4': 'M7.6 16L7.6 0L0 11.2L10 11.2',
  '5': 'M9.4 0L1.4 0L0.6 7.2C1.8 6.4 3.2 6 4.8 6C8 6 10 8 10 10.9C10 14 7.9 16 4.8 16C2.8 16 1.2 15.3 0 14.2',
  '6': 'M8.8 1.2C7.8 0.4 6.6 0 5.4 0C2 0 0 3.2 0 8.6C0 13.4 1.9 16 5 16C8 16 10 14 10 11C10 8 8 6.2 5.2 6.2C2.8 6.2 1 7.4 0.1 9.4',
  '7': 'M0 0L10 0C6.6 4.4 4.4 9.6 3.6 16',
  '8': 'M5 7.4C2.4 7.4 0.8 6 0.8 3.8C0.8 1.5 2.5 0 5 0C7.5 0 9.2 1.5 9.2 3.8C9.2 6 7.6 7.4 5 7.4C2 7.4 0 9 0 11.6C0 14.3 2.1 16 5 16C7.9 16 10 14.3 10 11.6C10 9 8 7.4 5 7.4Z',
  '9': 'M1.2 14.8C2.2 15.6 3.4 16 4.6 16C8 16 10 12.8 10 7.4C10 2.6 8.1 0 5 0C2 0 0 2 0 5C0 8 2 9.8 4.8 9.8C7.2 9.8 9 8.6 9.9 6.6',
  '-': 'M2 8.6L8 8.6',
  ':': 'M1.5 4.6L1.5 4.7M1.5 11.4L1.5 11.5',
  '.': 'M1.5 15.4L1.5 15.5',
  '°': 'M1 1.8C1 0.8 1.7 0 2.6 0C3.5 0 4.2 0.8 4.2 1.8C4.2 2.8 3.5 3.6 2.6 3.6C1.7 3.6 1 2.8 1 1.8Z',
  '±': 'M5 2L5 10M1 6L9 6M1 14L9 14',
};

/** 7 segment: a üst, b sağ üst, c sağ alt, d alt, e sol alt, f sol üst, g orta */
const SEG: Record<string, string> = {
  a: 'M1.1 0L8.9 0L7.3 1.7L2.7 1.7Z',
  b: 'M10 0.9L10 7.5L8.3 6.8L8.3 2.6Z',
  c: 'M10 8.5L10 15.1L8.3 13.4L8.3 9.2Z',
  d: 'M2.7 14.3L7.3 14.3L8.9 16L1.1 16Z',
  e: 'M0 8.5L1.7 9.2L1.7 13.4L0 15.1Z',
  f: 'M0 0.9L1.7 2.6L1.7 6.8L0 7.5Z',
  g: 'M1.1 8L2.6 7.15L7.4 7.15L8.9 8L7.4 8.85L2.6 8.85Z',
};
const SEG_ON: Record<string, string> = {
  '0': 'abcdef',
  '1': 'bc',
  '2': 'abged',
  '3': 'abgcd',
  '4': 'fgbc',
  '5': 'afgcd',
  '6': 'afgedc',
  '7': 'abc',
  '8': 'abcdefg',
  '9': 'abcdfg',
  '-': 'g',
};
const SEG_DOTS: Record<string, string> = {
  ':': 'M0.6 4L2.4 4L2.4 5.8L0.6 5.8ZM0.6 10.2L2.4 10.2L2.4 12L0.6 12Z',
  '.': 'M0.6 14.2L2.4 14.2L2.4 16L0.6 16Z',
  '°': 'M0.6 0L4 0L4 3.2L0.6 3.2Z',
};

const NARROW = new Set([':', '.']);
const GAP = 3;
const advance = (ch: string) => (NARROW.has(ch) ? 3 : ch === '°' ? 5 : 10);

interface StyleDef {
  weight: number;
  skew: number;
}
const STYLES: Record<GlyphStyle, StyleDef> = {
  classic: { weight: 0.1, skew: 0 },
  bold: { weight: 0.15, skew: 0 },
  thin: { weight: 0.05, skew: 0 },
  italic: { weight: 0.1, skew: 0.18 },
  seg: { weight: 0, skew: 0.12 },
  flat: { weight: 0, skew: 0 },
  serif: { weight: 0, skew: 0 },
};

interface Built {
  /** Yanan kısımlar */
  d: string;
  /** Sönük segmentler (yalnız seg) */
  ghost: string;
  width: number;
}

function translate(d: string, dx: number): string {
  // Yol komutlarındaki x koordinatlarını kaydırır (yalnız M/L/C ve mutlak koordinat kullanılır)
  return d.replace(/([MLCZ])([^MLCZ]*)/g, (_, cmd: string, args: string) => {
    if (cmd === 'Z') return 'Z';
    const nums = args.trim().split(/[\s,]+/).filter(Boolean).map(Number);
    const out = nums.map((n, i) => (i % 2 === 0 ? (n + dx).toFixed(2) : n.toFixed(2)));
    return cmd + out.join(' ');
  });
}

function build(text: string, style: GlyphStyle): Built {
  let x = 0;
  const on: string[] = [];
  const off: string[] = [];
  [...text].forEach((ch, i) => {
    if (i > 0) x += GAP;
    if (style === 'seg' || style === 'flat') {
      const segs = SEG_ON[ch];
      if (segs != null) {
        for (const k of Object.keys(SEG)) (segs.includes(k) ? on : off).push(translate(SEG[k], x));
      } else if (SEG_DOTS[ch]) on.push(translate(SEG_DOTS[ch], x));
      else if (ch === ' ') for (const k of Object.keys(SEG)) off.push(translate(SEG[k], x));
    } else if (CLASSIC[ch]) on.push(translate(CLASSIC[ch], x));
    x += advance(ch);
  });
  return { d: on.join(''), ghost: off.join(''), width: x };
}

const cache = new Map<string, Built>();
function pathFor(text: string, style: GlyphStyle): Built {
  const k = style + '|' + text;
  let v = cache.get(k);
  if (!v) {
    v = build(text, style);
    if (cache.size > 400) cache.clear();
    cache.set(k, v);
  }
  return v;
}

function box(width: number, st: StyleDef, weightScale: number) {
  const sw = st.weight * 16 * weightScale;
  const pad = Math.max(sw, 0.6);
  return { sw, pad, vbW: width + 16 * st.skew + pad * 2, vbH: 16 + pad * 2 };
}

/** Klasik serif rakamlar: Playfair Display Black (uygulamayla birlikte gelir, _layout'ta yüklenir) */
export const SERIF_FONT = 'PlayfairDisplay_900Black';
/** Rakam yüksekliği / yazı boyutu (Playfair rakam yüksekliği ≈ 0.71 em) */
const SERIF_CAP = 0.71;
const serifAdvance = (ch: string) => (ch === ':' || ch === '.' ? 0.36 : ch === '-' ? 0.5 : 0.84);

/** Verilen metnin bu yükseklikteki genişliği (yerleşim hesapları için) */
export function measureKd(text: string, height: number, style: GlyphStyle = 'classic', weightScale = 1): number {
  if (style === 'serif') return [...text].reduce((a, ch) => a + serifAdvance(ch), 0) * height;
  const b = box(pathFor(text, style).width, STYLES[style], weightScale);
  return (b.vbW / b.vbH) * height;
}

export const KdNumber = memo(function KdNumber({
  text,
  height,
  color,
  style = 'classic',
  glow,
  weightScale = 1,
  opacity = 1,
  ghost,
}: {
  text: string;
  height: number;
  color: string;
  style?: GlyphStyle;
  /** Hafif ışıma rengi (VFD/LED; cam modunda kullanılmaz) */
  glow?: string;
  /** Kalınlık çarpanı */
  weightScale?: number;
  opacity?: number;
  /** Sönük segment rengi (seg); verilmezse rakam renginin çok soluğu */
  ghost?: string | null;
}) {
  if (style === 'serif') {
    const fs = height / SERIF_CAP;
    return (
      <View style={{ height, justifyContent: 'center', opacity }}>
        <Text
          allowFontScaling={false}
          style={{ fontFamily: SERIF_FONT, fontSize: fs, lineHeight: fs * 1.02, color, fontVariant: ['lining-nums'], includeFontPadding: false, textAlign: "center", marginVertical: -(fs - height) / 2, transform: [{ translateY: -height * 0.1 }] }}
        >
          {text}
        </Text>
      </View>
    );
  }
  const st = STYLES[style];
  const { d, ghost: gd, width } = pathFor(text, style);
  const { sw, pad, vbW, vbH } = box(width, st, weightScale);
  const w = (vbW / vbH) * height;
  const skew = st.skew ? `translate(${16 * st.skew} 0) skewX(${(-Math.atan(st.skew) * 180) / Math.PI})` : undefined;
  return (
    <Svg width={w} height={height} viewBox={`${-pad} ${-pad} ${vbW} ${vbH}`} opacity={opacity}>
      <G transform={skew}>
        {style === 'seg' || style === 'flat' ? (
          <>
            {ghost !== null && gd ? <Path d={gd} fill={ghost ?? color} fillOpacity={ghost ? 1 : 0.07} /> : null}
            {glow ? <Path d={d} fill="none" stroke={glow} strokeOpacity={0.25} strokeWidth={1.2} strokeLinejoin="round" /> : null}
            <Path d={d} fill={color} />
          </>
        ) : (
          <>
            {glow ? <Path d={d} stroke={glow} strokeOpacity={0.2} strokeWidth={sw * 2.8} fill="none" strokeLinejoin="round" strokeLinecap="round" /> : null}
            <Path d={d} stroke={color} strokeWidth={sw} fill="none" strokeLinejoin="round" strokeLinecap="round" />
          </>
        )}
      </G>
    </Svg>
  );
});

/** Kadran içinde (başka bir SVG'nin içinde) rakam çizmek için ham yol ve stil bilgisi */
export function glyphPath(text: string, style: GlyphStyle): { d: string; ghost: string; width: number; weight: number; skew: number } {
  const b = pathFor(text, style);
  const st = STYLES[style];
  return { ...b, weight: st.weight, skew: st.skew };
}
