import { memo, useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSpring, withTiming, type SharedValue } from 'react-native-reanimated';
import Svg, { Circle, Defs, G, LinearGradient, Path, Pattern, RadialGradient, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { alpha, mix, shade, type GaugeKind, type GlyphStyle, type Palette } from '@/features/kadran/themes';
import { glyphPath } from './KdNumber';
import { LABEL_FONT } from './primitives';

/**
 * Klasik göstergeler. Kadranlar statik SVG olarak bir kez çizilir; yalnızca ibre (ya da tambur/sütun)
 * UI thread'de döner/kayar. İbre yaylı bir sönümle (mekanik ibre hissi) hedefe gider.
 */

export type Signal = 'ok' | 'weak' | 'none';

export interface GaugeProps {
  /** Seçili birimde hız; güvenilir veri yoksa null */
  speed: number | null;
  /** Skala sonu */
  max: number;
  /** Göstergenin genişliği (yükseklik geometriye göre) */
  width: number;
  pal: Palette;
  glyph: GlyphStyle;
  unit: string;
  /** Hız uyarısı aşıldı */
  over?: boolean;
  /** "az": geçişler kısa */
  reduced?: boolean;
  /** Göstergenin üstüne binen içerik (ör. GPS arama animasyonu) */
  center?: ReactNode;
  /** Analog kadranda küçük dijital hız penceresi */
  assist?: boolean;
  /** Analog saat için zaman (ms) */
  now?: number;
  /** Kilometre sayacı (yolculuk mesafesi) metni, ör. "12.4"; null = "--" */
  odo?: string | null;
  /** Uyarı lambaları için GPS durumu */
  signal?: Signal;
  /** GPS sinyal seviyesi 0..4 (küçük sinyal göstergeleri) */
  sigLevel?: number;
  /** Yolculuğun maksimum hızı (seçili birimde) */
  peak?: number | null;
}

/** Göstergenin yükseklik/genişlik oranı */
export const GAUGE_ASPECT: Record<GaugeKind, number> = { twin: 0.5, ribbon: 0.48, sport: 0.88, drum: 0.52, vfd: 0.66, led: 0.7, arcband: 0.46, chev: 0.64, band: 0.46 };

const D2R = Math.PI / 180;
const pt = (cx: number, cy: number, r: number, deg: number) => [cx + r * Math.cos(deg * D2R), cy + r * Math.sin(deg * D2R)] as const;
const f2 = (n: number) => n.toFixed(2);

/** SVG kimlikleri sayfada tekil olmalı (web'de aynı sayfada birden çok gösterge var) */
function useGid(): string {
  return 'g' + useId().replace(/[^a-zA-Z0-9]/g, '');
}

/**
 * Gösterilen sayının yumuşak geçişi: hedefe ~600 ms'de akar, yalnızca tam sayı değişince yeniden çizer.
 * (İki gerçek ölçüm arasındaki geçişi yumuşatır; yeni değer uydurmaz.)
 */
export function useTweenedSpeed(target: number | null, reduced?: boolean): number | null {
  const [shown, setShown] = useState<number | null>(target == null ? null : Math.round(target));
  const cur = useRef(target ?? 0);
  useEffect(() => {
    if (target == null) {
      setShown(null);
      return;
    }
    const from = cur.current;
    const to = target;
    if (reduced || Math.abs(to - from) < 0.5) {
      cur.current = to;
      setShown(Math.round(to));
      return;
    }
    const t0 = Date.now();
    const dur = 600;
    let raf = 0;
    const step = () => {
      const k = Math.min(1, (Date.now() - t0) / dur);
      const e = 1 - (1 - k) ** 3;
      cur.current = from + (to - from) * e;
      const r = Math.round(cur.current);
      setShown((s) => (s === r ? s : r));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, reduced]);
  return shown;
}

/** 0..1 hız oranı; mekanik ibre gibi hafif yaylı (UI thread) */
function useNeedle(speed: number | null, max: number, reduced?: boolean): SharedValue<number> {
  const f = useSharedValue(0);
  useEffect(() => {
    const v = speed == null ? 0 : Math.min(1.02, Math.max(0, speed / max));
    f.value = reduced ? withTiming(v, { duration: 150 }) : withSpring(v, { damping: 15, stiffness: 55, mass: 1 });
  }, [speed, max, reduced, f]);
  return f;
}

/** Düz geçişli oran (sütun, şerit dolgusu) */
function useFraction(speed: number | null, max: number, reduced?: boolean): SharedValue<number> {
  const f = useSharedValue(0);
  useEffect(() => {
    const v = speed == null ? 0 : Math.min(1, Math.max(0, speed / max));
    f.value = withTiming(v, { duration: reduced ? 150 : 700, easing: Easing.out(Easing.cubic) });
  }, [speed, max, reduced, f]);
  return f;
}

// ---------------------------------------------------------------------------
// Ortak çizim parçaları
// ---------------------------------------------------------------------------

/** SVG içinde, (x, y) merkezli rakam */
function DialNum({ text, x, y, h, color, style, ws = 1, ghost, cond = 1 }: { text: string; x: number; y: number; h: number; color: string; style: GlyphStyle; ws?: number; ghost?: string; cond?: number }) {
  const g = glyphPath(text, style);
  const s = h / 16;
  const w = (g.width + 16 * g.skew) * s * cond;
  const skew = g.skew ? ` translate(${16 * g.skew} 0) skewX(${f2((-Math.atan(g.skew) * 180) / Math.PI)})` : '';
  return (
    <G transform={`translate(${f2(x - w / 2)} ${f2(y - h / 2)}) scale(${(s * cond).toFixed(4)} ${s.toFixed(4)})${skew}`}>
      {style === 'seg' || style === 'flat' ? (
        <>
          {ghost && g.ghost ? <Path d={g.ghost} fill={ghost} /> : null}
          <Path d={g.d} fill={color} />
        </>
      ) : (
        <Path d={g.d} stroke={color} strokeWidth={g.weight * 16 * ws} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </G>
  );
}

function Label({ x, y, size, color, children, anchor = 'middle', spacing = 0.6, weight = '700' }: { x: number; y: number; size: number; color: string; children: string; anchor?: 'start' | 'middle' | 'end'; spacing?: number; weight?: '400' | '700' }) {
  return (
    <SvgText x={x} y={y} fill={color} fontSize={size} fontWeight={weight} fontFamily={LABEL_FONT} textAnchor={anchor} letterSpacing={spacing}>
      {children}
    </SvgText>
  );
}

/** Ölçek çizgileri: büyük / orta / küçük */
function dialTicks(cx: number, cy: number, r: number, a0: number, sweep: number, max: number, lens: [number, number, number]) {
  const major: string[] = [];
  const mid: string[] = [];
  const minor: string[] = [];
  for (let v = 0; v <= max + 0.01; v += 5) {
    const a = a0 + (sweep * v) / max;
    const kind = v % 20 === 0 ? 0 : v % 10 === 0 ? 1 : 2;
    const [x1, y1] = pt(cx, cy, r, a);
    const [x2, y2] = pt(cx, cy, r - lens[kind], a);
    (kind === 0 ? major : kind === 1 ? mid : minor).push(`M${f2(x1)} ${f2(y1)}L${f2(x2)} ${f2(y2)}`);
  }
  return { major: major.join(''), mid: mid.join(''), minor: minor.join('') };
}

function arc(cx: number, cy: number, r: number, a0: number, a1: number) {
  const [x0, y0] = pt(cx, cy, r, a0);
  const [x1, y1] = pt(cx, cy, r, a1);
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
  return `M${f2(x0)} ${f2(y0)}A${r} ${r} 0 ${large} 1 ${f2(x1)} ${f2(y1)}`;
}

/** Krom çerçeve ve kadran yüzü için gradyanlar */
function ChromeDefs({ id, pal }: { id: string; pal: Palette }) {
  return (
    <Defs>
      <LinearGradient id={`${id}c`} x1="0" y1="0" x2="0.35" y2="1">
        <Stop offset="0" stopColor={mix(pal.chrome, '#FFFFFF', 0.55)} />
        <Stop offset="0.45" stopColor={shade(pal.chrome, 0.55)} />
        <Stop offset="0.55" stopColor={pal.chrome} />
        <Stop offset="1" stopColor={shade(pal.chrome, 0.4)} />
      </LinearGradient>
      <RadialGradient id={`${id}f`} cx="0.5" cy="0.42" r="0.6">
        <Stop offset="0" stopColor={mix(pal.face, '#FFFFFF', pal.face > '#888888' ? 0.25 : 0.06)} />
        <Stop offset="1" stopColor={shade(pal.face, 0.85)} />
      </RadialGradient>
      <LinearGradient id={`${id}g`} x1="0" y1="0" x2="0.6" y2="1">
        <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.14} />
        <Stop offset="0.5" stopColor="#FFFFFF" stopOpacity={0.03} />
        <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
      </LinearGradient>
    </Defs>
  );
}

/** Kilometre sayacı: siyah kutularda beyaz rakamlar, ondalık hanesi beyaz kutuda siyah */
function Odo({ x, y, h, text, pal }: { x: number; y: number; h: number; text: string | null | undefined; pal: Palette }) {
  const [ip, dp] = (text ?? '--').split('.');
  const intDigits = text == null || ip === '--' ? ['-', '-', '-', '-'] : ip.padStart(4, '0').slice(-4).split('');
  const dec = text == null ? '-' : (dp ?? '0').slice(0, 1);
  const cw = h * 0.72;
  const gap = h * 0.08;
  const n = intDigits.length + 1;
  const total = n * cw + (n - 1) * gap;
  const x0 = x - total / 2;
  return (
    <G>
      <Rect x={x0 - h * 0.18} y={y - h / 2 - h * 0.16} width={total + h * 0.36} height={h * 1.32} rx={h * 0.12} fill="#050505" stroke={alpha(pal.chrome, 0.7)} strokeWidth={h * 0.06} />
      {[...intDigits, dec].map((d, i) => {
        const last = i === n - 1;
        const bx = x0 + i * (cw + gap);
        return (
          <G key={i}>
            <Rect x={bx} y={y - h / 2} width={cw} height={h} fill={last ? '#ECE6D6' : '#121212'} />
            <DialNum text={d} x={bx + cw / 2} y={y} h={h * 0.68} color={last ? '#141414' : '#EEEAE0'} style="classic" ws={1.1} />
          </G>
        );
      })}
    </G>
  );
}

/** Küçük dijital hız penceresi (analog kadranlarda isteğe bağlı) */
function DigiWin({ x, y, h, value, pal, over }: { x: number; y: number; h: number; value: number | null; pal: Palette; over?: boolean }) {
  const text = value == null ? '--' : String(value);
  const w = h * 2.3;
  return (
    <G>
      <Rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={h * 0.14} fill="#050505" stroke={alpha(pal.chrome, 0.6)} strokeWidth={h * 0.05} />
      <DialNum text={text} x={x} y={y} h={h * 0.66} color={over ? pal.danger : pal.text} style="classic" ws={1.15} />
    </G>
  );
}

/** Dönen ibre: pivot (cx, cy) çevresinde; 0° = sağ, saat yönü artar */
function Needle({
  f,
  k,
  cx,
  cy,
  a0,
  sweep,
  len,
  tail,
  w,
  color,
  hub,
  hubColor,
}: {
  f: SharedValue<number>;
  k: number;
  cx: number;
  cy: number;
  a0: number;
  sweep: number;
  len: number;
  tail: number;
  w: number;
  color: string;
  hub: number;
  hubColor: string;
}) {
  const L = Math.max(len, tail, hub) + 1;
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${a0 + sweep * f.value}deg` }] }));
  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: (cx - L) * k, top: (cy - L) * k, width: 2 * L * k, height: 2 * L * k }, style]}>
      <Svg width={2 * L * k} height={2 * L * k} viewBox={`${-L} ${-L} ${2 * L} ${2 * L}`}>
        {/* gölge */}
        <Path d={`M${-tail} ${-w * 0.7} L${len} ${-w * 0.18} L${len} ${w * 0.18} L${-tail} ${w * 0.7} Z`} fill="#000" opacity={0.35} transform="translate(0.5 0.8)" />
        <Path d={`M${-tail} ${-w * 0.7} L${len} ${-w * 0.18} L${len} ${w * 0.18} L${-tail} ${w * 0.7} Z`} fill={color} />
        <Path d={`M0 ${-w * 0.25} L${len * 0.96} ${-w * 0.05}`} stroke="#FFFFFF" strokeOpacity={0.35} strokeWidth={w * 0.18} />
        <Circle cx={0} cy={0} r={hub} fill={hubColor} />
        <Circle cx={0} cy={0} r={hub * 0.55} fill="#000" opacity={0.55} />
        <Circle cx={-hub * 0.25} cy={-hub * 0.3} r={hub * 0.25} fill="#FFFFFF" opacity={0.25} />
      </Svg>
    </Animated.View>
  );
}

/** Gösterge kabı + üstüne binen içerik (GPS arama vb.) */
function Shell({ width, height, children, center, pal }: { width: number; height: number; children: ReactNode; center?: ReactNode; pal: Palette }) {
  return (
    <View style={{ width, height }}>
      {children}
      {center ? (
        <View pointerEvents="box-none" style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', backgroundColor: alpha(pal.bg, 0.82), borderRadius: 8 }]}>
          {center}
        </View>
      ) : null}
    </View>
  );
}

/** Uyarı lambası (gerçek durumu gösterir: GPS, hız uyarısı) */
function Lamp({ x, y, r, on, color, label }: { x: number; y: number; r: number; on: boolean; color: string; label: string }) {
  return (
    <G>
      <Circle cx={x} cy={y} r={r} fill={on ? color : '#141414'} stroke="#000" strokeWidth={0.4} />
      {on ? <Circle cx={x} cy={y} r={r * 1.7} fill={color} opacity={0.18} /> : null}
      <Label x={x} y={y + r * 0.42} size={r * 0.95} color={on ? '#000' : '#4A4A4A'} spacing={0}>
        {label}
      </Label>
    </G>
  );
}

/** Saat verilmezse (önizleme) vitrin saati 10:10 gösterilir */
const SHOW_TIME = new Date(2026, 0, 1, 10, 9, 30).getTime();

const numEvery = (max: number) => (max > 160 ? 20 : max > 100 ? 20 : 10);

// ---------------------------------------------------------------------------
// 1) Anadolu 131 — iki yuvarlak kadran (hız + saat)
// ---------------------------------------------------------------------------
const TW = { l: { cx: 25, cy: 25 }, r: { cx: 75, cy: 25 }, R: 21 };
const TW_A0 = 135;
const TW_SW = 270;

const TwinGauge = memo(function TwinGauge({ speed, max, width, pal, unit, over, reduced, center, assist, now, odo, signal = 'ok' }: GaugeProps) {
  const h = width * GAUGE_ASPECT.twin;
  const k = width / 100;
  const id = useGid();
  const f = useNeedle(speed, max, reduced);
  const shown = useTweenedSpeed(assist ? speed : null, reduced);
  const { cx, cy } = TW.l;
  const R = TW.R;
  const ticks = useMemo(() => dialTicks(cx, cy, R - 1.6, TW_A0, TW_SW, max, [3, 2.2, 1.3]), [cx, cy, R, max]);
  const step = numEvery(max);
  const nums = useMemo(() => {
    const out: { v: number; x: number; y: number }[] = [];
    for (let v = 0; v <= max; v += step) {
      const [x, y] = pt(cx, cy, R - 7.4, TW_A0 + (TW_SW * v) / max);
      out.push({ v, x, y });
    }
    return out;
  }, [cx, cy, R, max, step]);
  // Analog saat
  const d = new Date(now ?? SHOW_TIME);
  const mins = d.getMinutes() + d.getSeconds() / 60;
  const hrs = (d.getHours() % 12) + mins / 60;
  const C = TW.r;
  const clockTicks = useMemo(() => {
    const a: string[] = [];
    const b: string[] = [];
    for (let i = 0; i < 60; i++) {
      const ang = i * 6 - 90;
      const big = i % 5 === 0;
      const [x1, y1] = pt(C.cx, C.cy, R - 1.6, ang);
      const [x2, y2] = pt(C.cx, C.cy, R - (big ? 4.4 : 2.6), ang);
      (big ? a : b).push(`M${f2(x1)} ${f2(y1)}L${f2(x2)} ${f2(y2)}`);
    }
    return { big: a.join(''), small: b.join('') };
  }, [C.cx, C.cy, R]);
  const hand = (deg: number, len: number) => {
    const [x, y] = pt(C.cx, C.cy, len, deg - 90);
    const [tx, ty] = pt(C.cx, C.cy, len * 0.18, deg + 90);
    return `M${f2(tx)} ${f2(ty)}L${f2(x)} ${f2(y)}`;
  };
  const housing = shade(pal.bg, 0.75);
  return (
    <Shell width={width} height={h} center={center} pal={pal}>
      <Svg width={width} height={h} viewBox="0 0 100 50">
        <ChromeDefs id={id} pal={pal} />
        {/* dikdörtgen gövde ve üst siperlik */}
        <Rect x={0.6} y={0.6} width={98.8} height={48.8} rx={7} fill={housing} stroke={alpha(pal.chrome, 0.35)} strokeWidth={0.5} />
        <Path d="M4 3.2 Q50 -0.6 96 3.2" stroke={alpha('#FFFFFF', 0.12)} strokeWidth={0.6} fill="none" />
        {[TW.l, TW.r].map((c, i) => (
          <G key={i}>
            <Circle cx={c.cx} cy={c.cy} r={R + 1.6} fill={`url(#${id}c)`} />
            <Circle cx={c.cx} cy={c.cy} r={R} fill={`url(#${id}f)`} />
          </G>
        ))}
        {/* hız kadranı */}
        <Path d={ticks.minor} stroke={alpha(pal.text, 0.7)} strokeWidth={0.35} />
        <Path d={ticks.mid} stroke={pal.text} strokeWidth={0.55} />
        <Path d={ticks.major} stroke={pal.text} strokeWidth={0.9} />
        {/* kırmızı bölge: skalanın son %15'i */}
        <Path d={arc(cx, cy, R - 1.2, TW_A0 + TW_SW * 0.85, TW_A0 + TW_SW)} stroke={alpha(pal.danger, 0.85)} strokeWidth={0.9} fill="none" />
        {nums.map((n) => (
          <DialNum key={n.v} text={String(n.v)} x={n.x} y={n.y} h={2.9} color={pal.text} style="classic" cond={0.72} ws={1.25} />
        ))}
        <Label x={cx} y={cy + 6.4} size={2.2} color={alpha(pal.text, 0.8)}>
          {unit.toLowerCase()}
        </Label>
        {assist ? <DigiWin x={cx} y={cy - 6.5} h={4} value={shown} pal={pal} over={over} /> : null}
        <Odo x={cx} y={cy + 14.6} h={2.9} text={odo} pal={pal} />
        {/* saat */}
        <Path d={clockTicks.small} stroke={alpha(pal.text, 0.6)} strokeWidth={0.3} />
        <Path d={clockTicks.big} stroke={pal.text} strokeWidth={0.9} />
        {[12, 3, 6, 9].map((n, i) => {
          const [x, y] = pt(C.cx, C.cy, R - 8.4, i * 90 - 90);
          return <DialNum key={n} text={String(n)} x={x} y={y} h={3.6} color={pal.text} style="classic" />;
        })}
        <Path d={hand(hrs * 30, 9.5)} stroke={pal.text} strokeWidth={1.5} strokeLinecap="round" />
        <Path d={hand(mins * 6, 15)} stroke={pal.text} strokeWidth={1} strokeLinecap="round" />
        <Path d={hand(d.getSeconds() * 6, 16.5)} stroke={pal.needle} strokeWidth={0.4} />
        <Circle cx={C.cx} cy={C.cy} r={1.4} fill={pal.needle} />
        {/* ortadaki uyarı lambaları */}
        <Lamp x={50} y={15} r={2.1} on={signal === 'ok'} color="#43D35C" label="G" />
        <Lamp x={50} y={25} r={2.1} on={signal === 'weak'} color="#FFB23E" label="!" />
        <Lamp x={50} y={35} r={2.1} on={!!over} color="#FF3B2F" label="H" />
        {/* cam parlaması */}
        <Path d="M2 2 H98 V18 Q50 24 2 14 Z" fill={`url(#${id}g)`} />
      </Svg>
      <Needle f={f} k={k} cx={cx} cy={cy} a0={TW_A0} sweep={TW_SW} len={R - 2.2} tail={4} w={1.5} color={over ? pal.danger : pal.needle} hub={2.4} hubColor="#1A1A1A" />
    </Shell>
  );
});

// ---------------------------------------------------------------------------
// 2) Şerit 124 — yatay skala, sağa sola kayan ibre
// ---------------------------------------------------------------------------
const RB = { x0: 9, x1: 91, top: 5, bot: 31 };

const RibbonGauge = memo(function RibbonGauge({ speed, max, width, pal, unit, over, reduced, center, assist, odo }: GaugeProps) {
  const h = width * GAUGE_ASPECT.ribbon;
  const k = width / 100;
  const id = useGid();
  const f = useNeedle(speed, max, reduced);
  const shown = useTweenedSpeed(assist ? speed : null, reduced);
  const span = RB.x1 - RB.x0;
  const scale = useMemo(() => {
    const maj: string[] = [];
    const mid: string[] = [];
    const min: string[] = [];
    for (let v = 0; v <= max + 0.01; v += 5) {
      const x = RB.x0 + (span * v) / max;
      if (v % 20 === 0) maj.push(`M${f2(x)} 16.5L${f2(x)} 23.5`);
      else if (v % 10 === 0) mid.push(`M${f2(x)} 18.5L${f2(x)} 23.5`);
      else min.push(`M${f2(x)} 20.8L${f2(x)} 23.5`);
    }
    return { maj: maj.join(''), mid: mid.join(''), min: min.join('') };
  }, [max, span]);
  const step = numEvery(max);
  const needleStyle = useAnimatedStyle(() => ({ transform: [{ translateX: span * k * Math.min(1.01, f.value) }] }));
  const col = over ? pal.danger : pal.needle;
  return (
    <Shell width={width} height={h} center={center} pal={pal}>
      <Svg width={width} height={h} viewBox="0 0 100 48">
        <ChromeDefs id={id} pal={pal} />
        {/* krom çerçeve ve siyah yüz */}
        <Rect x={1} y={RB.top - 3} width={98} height={RB.bot - RB.top + 6} rx={5} fill={`url(#${id}c)`} />
        <Rect x={3} y={RB.top - 1} width={94} height={RB.bot - RB.top + 2} rx={3.5} fill={`url(#${id}f)`} />
        {Array.from({ length: Math.floor(max / step) + 1 }, (_, i) => i * step).map((v) => (
          <DialNum key={v} text={String(v)} x={RB.x0 + (span * v) / max} y={11.2} h={4.2} color={pal.text} style="classic" cond={0.7} ws={1.25} />
        ))}
        <Path d={scale.min} stroke={alpha(pal.text, 0.7)} strokeWidth={0.35} />
        <Path d={scale.mid} stroke={pal.text} strokeWidth={0.55} />
        <Path d={scale.maj} stroke={pal.text} strokeWidth={0.85} />
        {/* renkli bant: şehir içi / yol / sınır */}
        <Rect x={RB.x0} y={25} width={span * 0.3} height={1.3} fill={alpha('#58C46A', 0.75)} />
        <Rect x={RB.x0 + span * 0.3} y={25} width={span * 0.5} height={1.3} fill={alpha('#E9C24A', 0.7)} />
        <Rect x={RB.x0 + span * 0.8} y={25} width={span * 0.2} height={1.3} fill={alpha(pal.danger, 0.8)} />
        <Label x={RB.x1} y={29.6} size={2.4} color={alpha(pal.text, 0.75)} anchor="end">
          {unit.toLowerCase()}
        </Label>
        <Path d={`M3 ${RB.top - 1} H97 V${RB.top + 8} Q50 ${RB.top + 13} 3 ${RB.top + 6} Z`} fill={`url(#${id}g)`} />
        {/* alt kısım: sayaç (+ dijital pencere) */}
        <Odo x={assist ? 34 : 50} y={41} h={4.4} text={odo} pal={pal} />
        {assist ? <DigiWin x={70} y={41} h={6} value={shown} pal={pal} over={over} /> : null}
      </Svg>
      {/* kayan ibre */}
      <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: (RB.x0 - 2) * k, top: (RB.top + 7) * k, width: 4 * k, height: 20 * k, alignItems: 'center' }, needleStyle]}>
        <Svg width={4 * k} height={20 * k} viewBox="0 0 4 20">
          <Path d="M0.6 0 L3.4 0 L2 2.6 Z" fill={col} />
          <Rect x={1.25} y={2} width={1.5} height={17} fill="#000" opacity={0.35} transform="translate(0.4 0.4)" />
          <Rect x={1.25} y={2} width={1.5} height={17} fill={col} />
          <Rect x={1.25} y={2} width={0.45} height={17} fill="#FFF" opacity={0.3} />
        </Svg>
      </Animated.View>
    </Shell>
  );
});

// ---------------------------------------------------------------------------
// 3) Ceviz Roadster — büyük siyah yuvarlak kadran, 270°
// ---------------------------------------------------------------------------
const SP = { cx: 50, cy: 44, R: 41, a0: 135, sw: 270 };

const SportGauge = memo(function SportGauge({ speed, max, width, pal, unit, over, reduced, center, assist, now, odo }: GaugeProps) {
  const h = width * GAUGE_ASPECT.sport;
  const k = width / 100;
  const id = useGid();
  const f = useNeedle(speed, max, reduced);
  const shown = useTweenedSpeed(assist ? speed : null, reduced);
  const { cx, cy, R, a0, sw } = SP;
  const ticks = useMemo(() => dialTicks(cx, cy, R - 2, a0, sw, max, [5, 3.4, 2]), [cx, cy, R, a0, sw, max]);
  const step = numEvery(max);
  // küçük saat (alt boşlukta)
  const d = new Date(now ?? SHOW_TIME);
  const mins = d.getMinutes() + d.getSeconds() / 60;
  const hrs = (d.getHours() % 12) + mins / 60;
  const ccx = cx;
  const ccy = cy + 29.5;
  const cr = 7.2;
  const hand = (deg: number, len: number) => {
    const [x, y] = pt(ccx, ccy, len, deg - 90);
    return `M${ccx} ${ccy}L${f2(x)} ${f2(y)}`;
  };
  return (
    <Shell width={width} height={h} center={center} pal={pal}>
      <Svg width={width} height={h} viewBox="0 0 100 88">
        <ChromeDefs id={id} pal={pal} />
        <Circle cx={cx} cy={cy} r={R + 3.4} fill={`url(#${id}c)`} />
        <Circle cx={cx} cy={cy} r={R + 1} fill={shade(pal.chrome, 0.35)} />
        <Circle cx={cx} cy={cy} r={R} fill={`url(#${id}f)`} />
        <Path d={ticks.minor} stroke={alpha(pal.text, 0.75)} strokeWidth={0.4} />
        <Path d={ticks.mid} stroke={pal.text} strokeWidth={0.7} />
        <Path d={ticks.major} stroke={pal.text} strokeWidth={1.3} />
        {Array.from({ length: Math.floor(max / step) + 1 }, (_, i) => i * step).map((v) => {
          const [x, y] = pt(cx, cy, R - 11.5, a0 + (sw * v) / max);
          return <DialNum key={v} text={String(v)} x={x} y={y} h={5} color={pal.text} style="classic" cond={0.72} ws={1.2} />;
        })}
        <Label x={cx} y={cy - 12} size={3.2} color={alpha(pal.text, 0.85)} spacing={1.4}>
          {unit}
        </Label>
        {assist ? <DigiWin x={cx} y={cy + 11} h={5.4} value={shown} pal={pal} over={over} /> : null}
        <Odo x={cx} y={cy + (assist ? 19 : 14)} h={3.8} text={odo} pal={pal} />
        {/* alt boşlukta küçük saat */}
        <Circle cx={ccx} cy={ccy} r={cr + 1.2} fill={`url(#${id}c)`} />
        <Circle cx={ccx} cy={ccy} r={cr} fill={pal.face} />
        {Array.from({ length: 12 }, (_, i) => {
          const [x1, y1] = pt(ccx, ccy, cr - 0.6, i * 30 - 90);
          const [x2, y2] = pt(ccx, ccy, cr - (i % 3 === 0 ? 2 : 1.2), i * 30 - 90);
          return <Path key={i} d={`M${f2(x1)} ${f2(y1)}L${f2(x2)} ${f2(y2)}`} stroke={pal.text} strokeWidth={i % 3 === 0 ? 0.6 : 0.35} />;
        })}
        <Path d={hand(hrs * 30, 3.6)} stroke={pal.text} strokeWidth={0.8} strokeLinecap="round" />
        <Path d={hand(mins * 6, 5.6)} stroke={pal.text} strokeWidth={0.5} strokeLinecap="round" />
        <Circle cx={ccx} cy={ccy} r={0.7} fill={pal.text} />
        <Path d={`M${cx - R + 4} ${cy - 8} A${R} ${R} 0 0 1 ${cx + R - 10} ${cy - 30} Q${cx} ${cy - 22} ${cx - R + 4} ${cy - 8} Z`} fill={`url(#${id}g)`} />
      </Svg>
      <Needle f={f} k={k} cx={cx} cy={cy} a0={a0} sweep={sw} len={R - 3} tail={9} w={1.4} color={over ? pal.danger : pal.needle} hub={3.6} hubColor="#151515" />
    </Shell>
  );
});

// ---------------------------------------------------------------------------
// 4) Tambur — büyüteç penceresinde dönen rakam tamburu
// ---------------------------------------------------------------------------
const DR = { x0: 6, x1: 94, top: 7, bot: 35 };
/** Tamburda 10 birimlik aralık (gösterge birimi) */
const DRUM_GAP = 30;

const DrumGauge = memo(function DrumGauge({ speed, max, width, pal, unit, over, reduced, center, odo }: GaugeProps) {
  const h = width * GAUGE_ASPECT.drum;
  const k = width / 100;
  const id = useGid();
  const f = useFraction(speed, max, reduced);
  const ppu = DRUM_GAP / 10; // birim başına genişlik
  const winW = DR.x1 - DR.x0;
  const tapeW = (max + 20) * ppu + winW;
  const tape = useMemo(() => {
    const nums: ReactNode[] = [];
    const t: string[] = [];
    const tm: string[] = [];
    for (let v = 0; v <= max + 0.01; v += 2) {
      const x = winW / 2 + v * ppu;
      if (v % 10 === 0) {
        t.push(`M${f2(x)} 21.5L${f2(x)} 26.5`);
        nums.push(<DialNum key={v} text={String(v)} x={x} y={12.5} h={11} color={pal.text} style="classic" ws={1.15} cond={0.8} />);
      } else tm.push(`M${f2(x)} 23.5L${f2(x)} 26.5`);
    }
    return { nums, t: t.join(''), tm: tm.join('') };
  }, [max, ppu, winW, pal.text]);
  const tapeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: -f.value * max * ppu * k }] }));
  const col = over ? pal.danger : pal.needle;
  const winH = DR.bot - DR.top;
  return (
    <Shell width={width} height={h} center={center} pal={pal}>
      <Svg width={width} height={h} viewBox="0 0 100 52" style={StyleSheet.absoluteFill}>
        <ChromeDefs id={id} pal={pal} />
        <Rect x={0.6} y={0.6} width={98.8} height={50.8} rx={6} fill={shade(pal.bg, 0.8)} stroke={alpha(pal.chrome, 0.35)} strokeWidth={0.5} />
        <Rect x={DR.x0 - 2} y={DR.top - 2} width={winW + 4} height={winH + 4} rx={4} fill={`url(#${id}c)`} />
        <Rect x={DR.x0} y={DR.top} width={winW} height={winH} rx={2.5} fill={pal.face} />
        <Label x={DR.x0 + 2} y={45} size={2.8} color={alpha(pal.text, 0.8)} anchor="start" spacing={1}>
          {unit}
        </Label>
        <Odo x={60} y={44} h={4.2} text={odo} pal={pal} />
      </Svg>
      {/* tambur penceresi */}
      <View style={{ position: 'absolute', left: DR.x0 * k, top: DR.top * k, width: winW * k, height: winH * k, overflow: 'hidden', borderRadius: 2.5 * k }}>
        <Animated.View style={[{ position: 'absolute', left: 0, top: 0, width: tapeW * k, height: winH * k }, tapeStyle]}>
          <Svg width={tapeW * k} height={winH * k} viewBox={`0 0 ${tapeW} ${winH}`}>
            {tape.nums}
            <Path d={tape.tm} stroke={alpha(pal.text, 0.7)} strokeWidth={0.45} />
            <Path d={tape.t} stroke={pal.text} strokeWidth={0.8} />
          </Svg>
        </Animated.View>
        {/* silindir gölgesi + büyüteç parlaması */}
        <Svg width={winW * k} height={winH * k} viewBox={`0 0 ${winW} ${winH}`} style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id={`${id}d`} x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor={pal.face} stopOpacity={1} />
              <Stop offset="0.22" stopColor={pal.face} stopOpacity={0.15} />
              <Stop offset="0.5" stopColor={pal.face} stopOpacity={0} />
              <Stop offset="0.78" stopColor={pal.face} stopOpacity={0.15} />
              <Stop offset="1" stopColor={pal.face} stopOpacity={1} />
            </LinearGradient>
            <LinearGradient id={`${id}v`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#000" stopOpacity={0.55} />
              <Stop offset="0.25" stopColor="#000" stopOpacity={0} />
              <Stop offset="0.75" stopColor="#000" stopOpacity={0} />
              <Stop offset="1" stopColor="#000" stopOpacity={0.6} />
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width={winW} height={winH} fill={`url(#${id}d)`} />
          <Rect x={0} y={0} width={winW} height={winH} fill={`url(#${id}v)`} />
          {/* sabit kırmızı okuma çizgisi */}
          <Path d={`M${winW / 2 - 1.6} 0 L${winW / 2 + 1.6} 0 L${winW / 2 + 0.35} 3 L${winW / 2 + 0.35} ${winH} L${winW / 2 - 0.35} ${winH} L${winW / 2 - 0.35} 3 Z`} fill={col} />
          <Path d={`M${winW * 0.2} 2 Q${winW / 2} -1 ${winW * 0.8} 2 L${winW * 0.75} 6 Q${winW / 2} 3.5 ${winW * 0.25} 6 Z`} fill="#FFFFFF" opacity={0.08} />
        </Svg>
      </View>
    </Shell>
  );
});

// ---------------------------------------------------------------------------
// 5) Dijital 85 — vakum floresan (VFD): segment rakam + yay çubuk grafik
// ---------------------------------------------------------------------------
const VF = { cx: 50, cy: 47, r1: 34, r2: 42, a0: 165, sw: 210, n: 42 };
const VFD_SEGS = Array.from({ length: VF.n }, (_, i) => {
  const step = VF.sw / VF.n;
  const a0 = VF.a0 + i * step + 0.6;
  const a1 = a0 + step - 1.6;
  const r2 = VF.r1 + 3 + (VF.r2 - VF.r1 - 3) * (i / VF.n);
  const p = [pt(VF.cx, VF.cy, VF.r1, a0), pt(VF.cx, VF.cy, r2, a0), pt(VF.cx, VF.cy, r2, a1), pt(VF.cx, VF.cy, VF.r1, a1)];
  return `M${p.map((q) => `${f2(q[0])} ${f2(q[1])}`).join('L')}Z`;
});

const VfdGauge = memo(function VfdGauge({ speed, max, width, pal, unit, over, reduced, center, odo }: GaugeProps) {
  const h = width * GAUGE_ASPECT.vfd;
  const id = useGid();
  const shown = useTweenedSpeed(speed, reduced);
  const lit = shown == null ? 0 : Math.round(Math.min(1, shown / max) * VF.n);
  const ghost = alpha(pal.text, 0.07);
  const txt = shown == null ? '--' : String(shown);
  const digits = txt.padStart(3, ' ');
  const step = max > 160 ? 40 : 20;
  return (
    <Shell width={width} height={h} center={center} pal={pal}>
      <Svg width={width} height={h} viewBox="0 0 100 66">
        <Defs>
          <LinearGradient id={`${id}s`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.07} />
            <Stop offset="0.4" stopColor="#FFFFFF" stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Rect x={0.6} y={0.6} width={98.8} height={64.8} rx={5} fill={pal.face} stroke={alpha(pal.chrome, 0.9)} strokeWidth={0.8} />
        {VFD_SEGS.map((d, i) => {
          const on = i < lit;
          const hot = i / VF.n >= 0.8;
          return <Path key={i} d={d} fill={on ? (over ? pal.danger : hot ? pal.secondary : pal.text) : ghost} />;
        })}
        {Array.from({ length: Math.floor(max / step) }, (_, i) => (i + 1) * step).map((v) => {
          const [x, y] = pt(VF.cx, VF.cy, VF.r2 + 3.6, VF.a0 + (VF.sw * v) / max);
          return <DialNum key={v} text={String(v)} x={x} y={y} h={2.8} color={alpha(pal.text, 0.7)} style="seg" />;
        })}
        <G>
          <DialNum text={digits} x={VF.cx} y={VF.cy - 3} h={20} color={over ? pal.danger : pal.text} style="seg" ghost={ghost} />
        </G>
        <Label x={VF.cx} y={VF.cy + 10.6} size={3.2} color={pal.text} spacing={2}>
          {unit}
        </Label>
        {/* alt şerit: yolculuk */}
        <Label x={10} y={62.4} size={2.8} color={alpha(pal.text, 0.6)} anchor="start" spacing={1.2}>
          TRIP
        </Label>
        <DialNum text={odo ?? '--'} x={30} y={61.3} h={4.2} color={pal.text} style="seg" />
        <Label x={90} y={62.4} size={2.8} color={over ? pal.danger : alpha(pal.secondary, 0.9)} anchor="end" spacing={1.2}>
          {over ? 'HIZ SINIRI' : 'ELECTRONIC'}
        </Label>
        <Rect x={0.6} y={0.6} width={98.8} height={64.8} rx={5} fill={`url(#${id}s)`} />
      </Svg>
    </Shell>
  );
});

// ---------------------------------------------------------------------------
// 6) LED VU — 70'ler hi-fi VU metresi + LED ışık sanatı (iki ayrı tasarım önerisinin karışımı):
//    krom at nalı çerçeve, LED ışın yelpazesi, gerçek analog ibre ve arkasında sönen hayalet izler,
//    5×7 nokta vuruşlu amber rakamlar (tabela ampulü gibi), yolculuk maksimumunda halka işaret
// ---------------------------------------------------------------------------
const LV = { cx: 50, cy: 64, a0: 220, sw: 100, rays: 21, radii: [35, 39, 43, 47, 51] };
/** 5×7 nokta vuruşlu rakamlar */
const DOT5x7: Record<string, string[]> = {
  '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
  '3': ['11111', '00010', '00100', '00010', '00001', '10001', '01110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  '6': ['00110', '01000', '10000', '11110', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],
  '-': ['00000', '00000', '00000', '11111', '00000', '00000', '00000'],
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
};
const LV_DOTS = Array.from({ length: LV.rays }, (_, i) => {
  const a = LV.a0 + (LV.sw * i) / (LV.rays - 1);
  return LV.radii.map((r) => pt(LV.cx, LV.cy, r, a));
});

/** İbre (pivot çevresinde döner; yalnızca r1..r2 arası çizilir: rakamların üstünden geçmez) */
function VuNeedle({ f, k, delta = 0, opacity = 1, color, tip }: { f: SharedValue<number>; k: number; delta?: number; opacity?: number; color: string; tip: string }) {
  const L = 54;
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${LV.a0 + LV.sw * Math.max(0, Math.min(1.01, f.value - delta))}deg` }] }));
  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: (LV.cx - L) * k, top: (LV.cy - L) * k, width: 2 * L * k, height: 2 * L * k, opacity }, style]}>
      <Svg width={2 * L * k} height={2 * L * k} viewBox={`${-L} ${-L} ${2 * L} ${2 * L}`}>
        <Path d="M33 -0.45 L47 -0.3 L47 0.3 L33 0.45 Z" fill={color} />
        <Path d="M47 -0.3 L53 -0.18 L53 0.18 L47 0.3 Z" fill={tip} />
      </Svg>
    </Animated.View>
  );
}

const LedGauge = memo(function LedGauge({ speed, max, width, pal, unit, over, reduced, center, odo, now, sigLevel = 4, peak }: GaugeProps) {
  const h = width * GAUGE_ASPECT.led;
  const k = width / 100;
  const id = useGid();
  const f = useNeedle(speed, max, reduced);
  const shown = useTweenedSpeed(speed, reduced);
  const pos = shown == null ? -1 : (Math.min(1, shown / max) * (LV.rays - 1));
  const lit = pos < 0 ? -1 : Math.round(pos);
  const peakRay = peak != null && peak > 0 ? Math.round(Math.min(1, peak / max) * (LV.rays - 1)) : -1;
  const amber = over ? pal.danger : pal.text;
  const hot = over ? '#FFD0C8' : pal.secondary;
  const unlit = pal.dim;
  // 5×7 rakamlar: yalnızca gerçek basamaklar çizilir, blok tam ortada (pivotun üstünde)
  const txt = (shown == null ? '--' : String(shown)).slice(-3);
  const P = 2.05;
  const digW = 6 * P;
  const blockW = txt.length * digW - P; // son basamaktan sonra boşluk yok
  const x0 = LV.cx - blockW / 2 + P / 2;
  const y0 = 41.6 - 3 * P;
  const dotsOn: { x: number; y: number }[] = [];
  const dotsOff: { x: number; y: number }[] = [];
  [...txt].forEach((ch, di) => {
    const rows = DOT5x7[ch] ?? DOT5x7[' '];
    rows.forEach((row, ry) =>
      [...row].forEach((c, rx) => (c === '1' ? dotsOn : dotsOff).push({ x: x0 + di * digW + rx * P, y: y0 + ry * P })),
    );
  });
  const d = new Date(now ?? SHOW_TIME);
  const clock = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return (
    <Shell width={width} height={h} center={center} pal={pal}>
      <Svg width={width} height={h} viewBox="0 0 100 70" style={StyleSheet.absoluteFill}>
        <ChromeDefs id={id} pal={pal} />
        <Rect x={0.5} y={0.5} width={99} height={69} rx={5} fill={pal.face} stroke={alpha(pal.chrome, 0.5)} strokeWidth={0.5} />
        {/* krom at nalı */}
        <Path d={arc(LV.cx, LV.cy, 59, 212, 328)} stroke={mix(pal.chrome, '#FFFFFF', 0.5)} strokeWidth={1.1} fill="none" />
        <Path d={arc(LV.cx, LV.cy, 57.8, 212, 328)} stroke={shade(pal.chrome, 0.55)} strokeWidth={0.8} fill="none" />
        {/* LED ışın yelpazesi: ibreye yakın ışınlar daha sıcak (kuyruklu yıldız) */}
        {LV_DOTS.map((ray, i) => {
          const on = i <= lit;
          const near = on ? Math.max(0, 1 - (pos - i) / 3) : 0;
          return ray.map(([x, y], j) => {
            const c = on ? mix(amber, hot, near * (0.4 + j * 0.12)) : unlit;
            return (
              <G key={`${i}-${j}`}>
                {near > 0.3 ? <Circle cx={x} cy={y} r={1.9} fill={amber} opacity={0.22 * near} /> : null}
                <Circle cx={x} cy={y} r={0.95} fill={c} />
              </G>
            );
          });
        })}
        {/* yolculuk maksimumu: en dış noktada halka */}
        {peakRay >= 0 ? <Circle cx={LV_DOTS[peakRay][4][0]} cy={LV_DOTS[peakRay][4][1]} r={1.9} stroke={pal.holo} strokeWidth={0.4} fill="none" /> : null}
        {[0, 5, 10, 15, 20].map((i) => {
          const [x, y] = pt(LV.cx, LV.cy, 55.2, LV.a0 + (LV.sw * i) / (LV.rays - 1));
          return <DialNum key={i} text={String(Math.round((max * i) / 20))} x={x} y={y} h={2.6} color={alpha(pal.text, 0.75)} style="classic" cond={0.8} />;
        })}
        {/* hız uyarı lambası */}
        <Circle cx={91} cy={9} r={1.6} fill={over ? pal.danger : unlit} />
        {over ? <Circle cx={91} cy={9} r={3.2} fill={pal.danger} opacity={0.25} /> : null}
        <Label x={91} y={14.2} size={1.9} color={alpha(pal.text, 0.6)}>
          LİMİT
        </Label>
        <Label x={9} y={10} size={1.9} color={alpha(pal.text, 0.6)}>
          {unit}
        </Label>
        {/* 5×7 nokta vuruşlu hız */}
        {dotsOff.map((p, i) => (
          <Circle key={`o${i}`} cx={p.x} cy={p.y} r={0.75} fill={unlit} opacity={0.55} />
        ))}
        {dotsOn.map((p, i) => (
          <Circle key={`g${i}`} cx={p.x} cy={p.y} r={1.4} fill={amber} opacity={0.25} />
        ))}
        {dotsOn.map((p, i) => (
          <Circle key={`n${i}`} cx={p.x} cy={p.y} r={0.8} fill={mix(amber, hot, 0.35)} />
        ))}
        {/* isim plakası */}
        <Rect x={2} y={52.5} width={96} height={16} rx={2} fill={shade(pal.face, 0.6)} />
        <Path d="M2 52.5 H98" stroke={pal.chrome} strokeWidth={0.5} />
        <Path d={`M${LV.cx - 3.4} 52.6 A3.4 3.4 0 0 1 ${LV.cx + 3.4} 52.6 Z`} fill={`url(#${id}c)`} />
        <Label x={6} y={60} size={2.2} color={alpha(pal.text, 0.6)} anchor="start" spacing={0.6}>
          TRIP
        </Label>
        <DialNum text={odo ?? '--'} x={20} y={63.4} h={4.2} color={pal.text} style="flat" />
        <DialNum text={clock} x={84} y={61.2} h={4.2} color={pal.text} style="flat" />
        {[0, 1, 2, 3].map((i) => (
          <Circle key={i} cx={80 + i * 2.6} cy={66.2} r={0.7} fill={i < sigLevel ? pal.text : unlit} />
        ))}
        <Label x={LV.cx} y={63.6} size={2} color={alpha(pal.text, 0.5)} spacing={1.4}>
          LED · VU
        </Label>
      </Svg>
      {/* sönen hayalet izler + ibre */}
      {reduced ? null : <VuNeedle f={f} k={k} delta={0.045} opacity={0.1} color={pal.needle} tip={pal.holo} />}
      {reduced ? null : <VuNeedle f={f} k={k} delta={0.03} opacity={0.22} color={pal.needle} tip={pal.holo} />}
      {reduced ? null : <VuNeedle f={f} k={k} delta={0.015} opacity={0.45} color={pal.needle} tip={pal.holo} />}
      <VuNeedle f={f} k={k} color={over ? pal.danger : pal.needle} tip={pal.holo} />
    </Shell>
  );
});

// ---------------------------------------------------------------------------
// 7) Fildişi 124 — fildişi gövde, üstte siyah rakam şeridi, alttan yelpaze ibre
//    (sol küçük gösterge: GPS sinyali, sağ: yolculuk maksimum hızı; altta ızgara ve lamba sırası)
// ---------------------------------------------------------------------------
const AB = { x0: 22, x1: 79, strip: 9, faceTop: 13.2, faceBot: 28, px: 50, py: 33 };

const ArcBandGauge = memo(function ArcBandGauge({ speed, max, width, pal, unit, over, reduced, center, assist, odo, signal = 'ok', sigLevel = 4, peak }: GaugeProps) {
  const h = width * GAUGE_ASPECT.arcband;
  const k = width / 100;
  const id = useGid();
  const f = useNeedle(speed, max, reduced);
  const shown = useTweenedSpeed(assist ? speed : null, reduced);
  const span = AB.x1 - AB.x0;
  const xOf = (v: number) => AB.x0 + (span * v) / max;
  const ticks = useMemo(() => {
    const maj: string[] = [];
    const min: string[] = [];
    for (let v = 0; v <= max + 0.01; v += 10) {
      const x = AB.x0 + (span * v) / max;
      const ang = Math.atan2(AB.faceTop + 0.6 - AB.py, x - AB.px);
      const big = v % 20 === 10;
      const len = big ? 4.6 : 2.6;
      const x2 = x - Math.cos(ang) * len;
      const y2 = AB.faceTop + 0.6 - Math.sin(ang) * len;
      (big ? maj : min).push(`M${f2(x)} ${f2(AB.faceTop + 0.6)}L${f2(x2)} ${f2(y2)}`);
    }
    return { maj: maj.join(''), min: min.join('') };
  }, [max, span]);
  const nums: number[] = [];
  const st = max > 160 ? 20 : 20;
  for (let v = 10; v <= max; v += st) nums.push(v);
  // ibre açısı: sabit pivot'tan şeritteki değer noktasına
  const L = 26;
  const nStyle = useAnimatedStyle(() => {
    const x = AB.x0 + span * Math.min(1.01, f.value);
    const a = (Math.atan2(AB.faceTop + 1 - AB.py, x - AB.px) * 180) / Math.PI;
    return { transform: [{ rotate: `${a}deg` }] };
  });
  const mini = (cx: number, frac: number, a0: number, a1: number) => {
    const a = a0 + (a1 - a0) * Math.max(0, Math.min(1, frac));
    const [x, y] = pt(cx, 30, 12.4, a);
    return `M${cx} 30L${f2(x)} ${f2(y)}`;
  };
  const lamps = [
    { on: signal === 'ok', c: '#46D45E' },
    { on: signal === 'weak', c: '#FFB23E' },
    { on: signal === 'none', c: '#FF7A1A' },
    { on: false, c: '#4AA8FF' },
    { on: false, c: '#46D45E' },
    { on: !!over, c: '#FF3B2F' },
  ];
  const ivory = mix(pal.chrome, '#F1E9D2', 0.75);
  return (
    <Shell width={width} height={h} center={center} pal={pal}>
      <Svg width={width} height={h} viewBox="0 0 100 46" style={StyleSheet.absoluteFill}>
        <ChromeDefs id={id} pal={pal} />
        <Defs>
          <LinearGradient id={`${id}i`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={mix(ivory, '#FFFFFF', 0.3)} />
            <Stop offset="1" stopColor={shade(ivory, 0.75)} />
          </LinearGradient>
          <LinearGradient id={`${id}y`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={mix(pal.face, '#FFFFFF', 0.12)} />
            <Stop offset="1" stopColor={shade(pal.face, 0.8)} />
          </LinearGradient>
        </Defs>
        {/* fildişi gövde, krom kenar */}
        <Rect x={0.5} y={0.5} width={99} height={45} rx={3.5} fill={`url(#${id}i)`} stroke={alpha(pal.chrome, 0.9)} strokeWidth={0.6} />
        <Rect x={2.6} y={3.4} width={94.8} height={39.6} rx={2} fill="#08090A" />
        {/* gri yüz + mini göstergeler */}
        <Rect x={4} y={AB.faceTop - 8.4} width={92} height={AB.faceBot - AB.faceTop + 8.4} fill={`url(#${id}y)`} />
        {/* üst siyah rakam şeridi */}
        <Rect x={AB.x0 - 5.5} y={4.4} width={span + 11} height={8.8} fill="#050505" />
        {nums.map((v) => (
          <DialNum key={v} text={String(v)} x={xOf(v)} y={AB.strip} h={4.6} color={pal.text} style="classic" cond={0.52} ws={1.2} />
        ))}
        <Label x={AB.x1 + 5} y={18} size={2.2} color={pal.text} anchor="end">
          {unit.toLowerCase()}
        </Label>
        <Path d={ticks.min} stroke={alpha(pal.text, 0.75)} strokeWidth={0.4} />
        <Path d={ticks.maj} stroke={pal.text} strokeWidth={0.75} />
        {/* sol: GPS sinyali */}
        <Label x={10} y={8.6} size={1.9} color={alpha(pal.text, 0.7)} spacing={0.3}>
          SİNYAL
        </Label>
        {['0', '½', '1'].map((t, i) => {
          const [x, y] = pt(10, 30, 15.2, 250 + i * 20);
          const [a, b] = pt(10, 30, 12.6, 250 + i * 20);
          const [c, d2] = pt(10, 30, 10.8, 250 + i * 20);
          return (
            <G key={t}>
              <Label x={x} y={y + 0.8} size={2.6} color={pal.text}>
                {t}
              </Label>
              <Path d={`M${f2(a)} ${f2(b)}L${f2(c)} ${f2(d2)}`} stroke={pal.text} strokeWidth={0.5} />
            </G>
          );
        })}
        <Path d={mini(10, sigLevel / 4, 250, 290)} stroke={pal.needle} strokeWidth={0.7} />
        {/* sağ: yolculuk maksimum hızı */}
        <Label x={90} y={8.6} size={2.2} color={pal.text} spacing={0.3}>
          MAKS
        </Label>
        {[0, 1, 2].map((i) => {
          const [a, b] = pt(90, 30, 12.6, 250 + i * 20);
          const [c, d2] = pt(90, 30, 10.8, 250 + i * 20);
          return <Path key={i} d={`M${f2(a)} ${f2(b)}L${f2(c)} ${f2(d2)}`} stroke={i === 2 ? pal.danger : pal.text} strokeWidth={0.5} />;
        })}
        <Path d={mini(90, (peak ?? 0) / max, 250, 290)} stroke={pal.needle} strokeWidth={0.7} />
        <Odo x={AB.px - 2} y={24.6} h={3.6} text={odo} pal={pal} />
        {assist ? <DigiWin x={AB.px + 14} y={24.6} h={4} value={shown} pal={pal} over={over} /> : null}
        {/* krom ızgara */}
        {Array.from({ length: 7 }, (_, i) => (
          <Path key={i} d={`M4 ${f2(AB.faceBot + 0.4 + i * 0.75)}H96`} stroke={i % 2 ? '#1A1A1A' : mix(pal.chrome, '#FFFFFF', 0.3)} strokeWidth={0.4} />
        ))}
        {/* lamba sırası (gerçek durum) */}
        {lamps.map((l, i) => {
          const x = i < 3 ? 12 + i * 11 : 58 + (i - 3) * 11;
          return <Rect key={i} x={x} y={37} width={7.5} height={2.8} rx={0.4} fill={l.on ? l.c : '#26292C'} stroke="#000" strokeWidth={0.3} />;
        })}
        <Rect x={2.6} y={3.4} width={94.8} height={14} fill={`url(#${id}g)`} />
      </Svg>
      {/* ibre: yalnız gri yüzde görünür */}
      <View pointerEvents="none" style={{ position: 'absolute', left: 4 * k, top: AB.faceTop * k, width: 92 * k, height: (AB.faceBot - AB.faceTop) * k, overflow: 'hidden' }}>
        <Animated.View style={[{ position: 'absolute', left: (AB.px - 4 - L) * k, top: (AB.py - AB.faceTop - L) * k, width: 2 * L * k, height: 2 * L * k }, nStyle]}>
          <Svg width={2 * L * k} height={2 * L * k} viewBox={`${-L} ${-L} ${2 * L} ${2 * L}`}>
            <Path d={`M0 -0.9 L${L - 0.5} -0.35 L${L - 0.5} 0.35 L0 0.9 Z`} fill="#000" opacity={0.35} transform="translate(0.4 0.6)" />
            <Path d={`M0 -0.9 L${L - 0.5} -0.35 L${L - 0.5} 0.35 L0 0.9 Z`} fill={over ? pal.danger : pal.needle} />
          </Svg>
        </Animated.View>
      </View>
    </Shell>
  );
});

// ---------------------------------------------------------------------------
// 8) Bordo 55 — bordo lake panelde krom çerçeveli siyah yelpaze kadran,
//     yay üzerinde eğik rakamlar ve altlarında noktalar
// ---------------------------------------------------------------------------
const CF = { cx: 50, cy: 60, R: 44, a0: 196, sw: 148 };

const ChevFanGauge = memo(function ChevFanGauge({ speed, max, width, pal, unit, over, reduced, center, assist, odo, sigLevel = 4 }: GaugeProps) {
  const h = width * GAUGE_ASPECT.chev;
  const k = width / 100;
  const id = useGid();
  const f = useNeedle(speed, max, reduced);
  const shown = useTweenedSpeed(assist ? speed : null, reduced);
  const { cx, cy, R, a0, sw } = CF;
  const step = max > 130 ? 20 : 10;
  const dots = useMemo(() => {
    const big: string[] = [];
    const small: string[] = [];
    for (let v = 0; v <= max + 0.01; v += step / 2) {
      const [x, y] = pt(cx, cy, R - 15, a0 + (sw * v) / max);
      (v % step === 0 ? big : small).push(`M${f2(x)} ${f2(y)}L${f2(x)} ${f2(y + 0.01)}`);
    }
    return { big: big.join(''), small: small.join('') };
  }, [max, step, cx, cy, R, a0, sw]);
  // kadran yüzü: yay + alt köşeler
  const [lx, ly] = pt(cx, cy, R + 2, a0 - 6);
  const [rx, ry] = pt(cx, cy, R + 2, a0 + sw + 6);
  const facePath = `M${f2(lx)} ${f2(ly)} A${R + 2} ${R + 2} 0 0 1 ${f2(rx)} ${f2(ry)} L${cx + 14} 61 L${cx - 14} 61 Z`;
  return (
    <Shell width={width} height={h} center={center} pal={pal}>
      <Svg width={width} height={h} viewBox="0 0 100 64">
        <ChromeDefs id={id} pal={pal} />
        <Defs>
          <Pattern id={`${id}p`} x={0} y={0} width={1.4} height={1.4} patternUnits="userSpaceOnUse">
            <Circle cx={0.7} cy={0.7} r={0.28} fill="#FFFFFF" opacity={0.07} />
          </Pattern>
        </Defs>
        <Path d={facePath} fill={`url(#${id}c)`} stroke={alpha('#FFFFFF', 0.5)} strokeWidth={0.4} transform={`translate(${cx} ${cy}) scale(1.045) translate(${-cx} ${-cy})`} />
        <Path d={facePath} fill={pal.face} />
        <Path d={facePath} fill={`url(#${id}p)`} />
        {Array.from({ length: Math.floor(max / step) + 1 }, (_, i) => i * step).map((v) => {
          const [x, y] = pt(cx, cy, R - 6.5, a0 + (sw * v) / max);
          return <DialNum key={v} text={String(v)} x={x} y={y} h={6.4} color={pal.text} style="italic" cond={0.6} ws={1.05} />;
        })}
        <Path d={dots.big} stroke={pal.text} strokeWidth={1.4} strokeLinecap="round" />
        <Path d={dots.small} stroke={alpha(pal.text, 0.7)} strokeWidth={0.8} strokeLinecap="round" />
        {/* üst: sinyal lambaları (yakıt göstergesi yerine gerçek GPS durumu) */}
        <Label x={cx} y={8.6} size={2.3} color={alpha(pal.text, 0.8)} spacing={0.8}>
          SİNYAL
        </Label>
        {[0, 1, 2, 3].map((i) => (
          <Circle key={i} cx={cx - 6 + i * 4} cy={11.6} r={0.9} fill={i < sigLevel ? pal.secondary : '#2A2522'} />
        ))}
        <Label x={cx - 10.5} y={12.4} size={2.2} color={pal.text}>
          Z
        </Label>
        <Label x={cx + 10.5} y={12.4} size={2.2} color={pal.text}>
          İ
        </Label>
        <Odo x={cx} y={42} h={3.8} text={odo} pal={pal} />
        {assist ? <DigiWin x={cx} y={33.5} h={5} value={shown} pal={pal} over={over} /> : null}
        {/* krom göbek */}
        <Path d={`M${cx - 11} 61 A11 11 0 0 1 ${cx + 11} 61 Z`} fill={`url(#${id}c)`} />
        <Label x={cx} y={58.6} size={2.4} color="#1A1A1A" spacing={1}>
          {unit}
        </Label>
        <Path d={`${arc(cx, cy, R + 1, a0, a0 + 70)} L${cx - 20} 30 Z`} fill={`url(#${id}g)`} />
      </Svg>
      <Needle f={f} k={k} cx={cx} cy={cy} a0={a0} sweep={sw} len={R - 13} tail={0} w={0.9} color={over ? pal.danger : pal.needle} hub={0.1} hubColor={pal.chrome} />
    </Shell>
  );
});

// ---------------------------------------------------------------------------
// 9) İsveç 68 — siyah panelde yatay bant: soldan büyüyen turuncu-kırmızı şerit; altta saat ve sayaç
// ---------------------------------------------------------------------------
const BD = { x0: 10, x1: 90, top: 15, bot: 20.5 };

const BandGauge = memo(function BandGauge({ speed, max, width, pal, unit, over, reduced, center, assist, now, odo }: GaugeProps) {
  const h = width * GAUGE_ASPECT.band;
  const k = width / 100;
  const id = useGid();
  const f = useFraction(speed, max, reduced);
  const shown = useTweenedSpeed(assist ? speed : null, reduced);
  const span = BD.x1 - BD.x0;
  const ticks = useMemo(() => {
    const a: string[] = [];
    for (let v = 0; v <= max + 0.01; v += 10) {
      const x = BD.x0 + (span * v) / max;
      a.push(`M${f2(x)} ${BD.bot + 0.8}L${f2(x)} ${BD.bot + (v % 20 === 0 ? 3 : 1.8)}`);
    }
    return a.join('');
  }, [max, span]);
  const bandStyle = useAnimatedStyle(() => ({ width: span * k * f.value }));
  const d = new Date(now ?? SHOW_TIME);
  const mins = d.getMinutes() + d.getSeconds() / 60;
  const hrs = (d.getHours() % 12) + mins / 60;
  const hand = (deg: number, len: number) => {
    const [x, y] = pt(26, 35.5, len, deg - 90);
    return `M26 35.5L${f2(x)} ${f2(y)}`;
  };
  return (
    <Shell width={width} height={h} center={center} pal={pal}>
      <Svg width={width} height={h} viewBox="0 0 100 46" style={StyleSheet.absoluteFill}>
        <ChromeDefs id={id} pal={pal} />
        <Rect x={0.5} y={0.5} width={99} height={45} rx={4} fill={shade(pal.bg, 0.8)} stroke={alpha(pal.chrome, 0.3)} strokeWidth={0.5} />
        <Rect x={4} y={4} width={92} height={23} rx={2.5} fill={`url(#${id}c)`} />
        <Rect x={5.2} y={5.2} width={89.6} height={20.6} rx={1.8} fill={pal.face} />
        {Array.from({ length: Math.floor(max / 20) + 1 }, (_, i) => i * 20).map((v) => (
          <DialNum key={v} text={String(v)} x={BD.x0 + (span * v) / max} y={10.2} h={4.4} color={pal.text} style="classic" cond={0.7} ws={1.2} />
        ))}
        <Rect x={BD.x0 - 0.8} y={BD.top - 0.8} width={span + 1.6} height={BD.bot - BD.top + 1.6} rx={0.6} fill="#000" stroke={alpha(pal.text, 0.35)} strokeWidth={0.3} />
        <Path d={ticks} stroke={pal.text} strokeWidth={0.5} />
        <Label x={BD.x1} y={25} size={2.2} color={alpha(pal.text, 0.7)} anchor="end">
          {unit.toLowerCase()}
        </Label>
        {/* saat */}
        <Circle cx={26} cy={35.5} r={7.8} fill={`url(#${id}c)`} />
        <Circle cx={26} cy={35.5} r={6.8} fill={pal.face} />
        {Array.from({ length: 12 }, (_, i) => {
          const [x1, y1] = pt(26, 35.5, 6.2, i * 30 - 90);
          const [x2, y2] = pt(26, 35.5, i % 3 === 0 ? 4.6 : 5.3, i * 30 - 90);
          return <Path key={i} d={`M${f2(x1)} ${f2(y1)}L${f2(x2)} ${f2(y2)}`} stroke={pal.text} strokeWidth={i % 3 === 0 ? 0.6 : 0.35} />;
        })}
        <Path d={hand(hrs * 30, 3.4)} stroke={pal.text} strokeWidth={0.8} strokeLinecap="round" />
        <Path d={hand(mins * 6, 5.2)} stroke={pal.text} strokeWidth={0.5} strokeLinecap="round" />
        <Odo x={assist ? 58 : 66} y={35.5} h={4.2} text={odo} pal={pal} />
        {assist ? <DigiWin x={84} y={35.5} h={5.4} value={shown} pal={pal} over={over} /> : null}
        <Rect x={5.2} y={5.2} width={89.6} height={8} fill={`url(#${id}g)`} />
      </Svg>
      {/* büyüyen bant */}
      <View pointerEvents="none" style={{ position: 'absolute', left: BD.x0 * k, top: BD.top * k, height: (BD.bot - BD.top) * k, width: span * k }}>
        <Animated.View style={[{ height: '100%', backgroundColor: over ? pal.danger : pal.needle, borderTopRightRadius: 1.2 * k, borderBottomRightRadius: 1.2 * k }, bandStyle]}>
          <View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: '35%', backgroundColor: '#FFFFFF', opacity: 0.22 }} />
        </Animated.View>
      </View>
    </Shell>
  );
});

export function Gauge({ kind, ...p }: GaugeProps & { kind: GaugeKind }) {
  switch (kind) {
    case 'ribbon':
      return <RibbonGauge {...p} />;
    case 'sport':
      return <SportGauge {...p} />;
    case 'drum':
      return <DrumGauge {...p} />;
    case 'vfd':
      return <VfdGauge {...p} />;
    case 'led':
      return <LedGauge {...p} />;
    case 'arcband':
      return <ArcBandGauge {...p} />;
    case 'chev':
      return <ChevFanGauge {...p} />;
    case 'band':
      return <BandGauge {...p} />;
    default:
      return <TwinGauge {...p} />;
  }
}
