import { memo, useId } from 'react';
import Svg, { Circle, Defs, LinearGradient, Path, Pattern, Rect, Stop } from 'react-native-svg';
import { alpha, mix, shade, type Fascia, type Palette } from '@/features/kadran/themes';

/**
 * Panel kaplaması: göstergenin arkasındaki ön panel dokusu. Tek, statik SVG (animasyonsuz).
 * ceviz kaplama · fırçalanmış alüminyum · kaporta rengi (krom şeritli) · fildişi · kırışık siyah boya · plastik · füme cam
 */
export const FasciaBackdrop = memo(function FasciaBackdrop({ kind, width, height, pal }: { kind: Fascia; width: number; height: number; pal: Palette }) {
  const id = 'f' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const bg = pal.bg;
  const light = mix(bg, '#FFFFFF', 0.12);
  const dark = shade(bg, 0.6);
  let body = null;

  if (kind === 'wood') {
    // Ceviz damarları: hafif dalgalı, kalınlığı ve tonu değişen çizgiler
    const lines: string[] = [];
    const lines2: string[] = [];
    const n = Math.ceil(height / 7);
    for (let i = 0; i < n; i++) {
      const y = i * 7 + 3 * Math.sin(i * 1.7);
      const a = 3 + 4 * Math.sin(i * 0.9);
      const w = width;
      const d = `M0 ${y.toFixed(1)} C${(w * 0.25).toFixed(0)} ${(y + a).toFixed(1)} ${(w * 0.5).toFixed(0)} ${(y - a).toFixed(1)} ${(w * 0.75).toFixed(0)} ${(y + a * 0.6).toFixed(1)} S${w} ${(y - a * 0.4).toFixed(1)} ${w} ${y.toFixed(1)}`;
      (i % 3 === 0 ? lines2 : lines).push(d);
    }
    body = (
      <>
        <Defs>
          <LinearGradient id={`${id}w`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={mix(bg, '#7A4524', 0.35)} />
            <Stop offset="0.5" stopColor={bg} />
            <Stop offset="1" stopColor={shade(bg, 0.7)} />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width={width} height={height} fill={`url(#${id}w)`} />
        <Path d={lines.join('')} stroke={alpha(shade(bg, 0.45), 0.5)} strokeWidth={1} fill="none" />
        <Path d={lines2.join('')} stroke={alpha(mix(bg, '#C27A45', 0.4), 0.35)} strokeWidth={2.2} fill="none" />
        {/* lak parlaklığı */}
        <Rect x={0} y={0} width={width} height={height * 0.35} fill="#FFFFFF" opacity={0.03} />
      </>
    );
  } else if (kind === 'brushed') {
    const ls: string[] = [];
    for (let y = 1; y < height; y += 2.5) ls.push(`M0 ${y.toFixed(1)}H${width}`);
    body = (
      <>
        <Defs>
          <LinearGradient id={`${id}b`} x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={dark} />
            <Stop offset="0.5" stopColor={light} />
            <Stop offset="1" stopColor={dark} />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width={width} height={height} fill={`url(#${id}b)`} />
        <Path d={ls.join('')} stroke="#FFFFFF" strokeOpacity={0.035} strokeWidth={1} />
      </>
    );
  } else if (kind === 'body') {
    // Kaporta rengi panel + krom çıta
    const y = Math.min(70, height * 0.1);
    body = (
      <>
        <Defs>
          <LinearGradient id={`${id}p`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={mix(bg, '#FFFFFF', 0.12)} />
            <Stop offset="0.6" stopColor={bg} />
            <Stop offset="1" stopColor={shade(bg, 0.55)} />
          </LinearGradient>
          <LinearGradient id={`${id}c`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FFFFFF" />
            <Stop offset="0.5" stopColor={shade(pal.chrome, 0.6)} />
            <Stop offset="1" stopColor={pal.chrome} />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width={width} height={height} fill={`url(#${id}p)`} />
        <Rect x={0} y={y} width={width} height={3} fill={`url(#${id}c)`} opacity={0.55} />
        <Rect x={0} y={height - y - 3} width={width} height={3} fill={`url(#${id}c)`} opacity={0.35} />
      </>
    );
  } else if (kind === 'glass') {
    body = (
      <>
        <Defs>
          <LinearGradient id={`${id}g`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.05} />
            <Stop offset="0.35" stopColor="#FFFFFF" stopOpacity={0} />
          </LinearGradient>
          <Pattern id={`${id}m`} x={0} y={0} width={4} height={4} patternUnits="userSpaceOnUse">
            <Rect x={0} y={0} width={1} height={1} fill={alpha(pal.primary, 0.05)} />
          </Pattern>
        </Defs>
        <Rect x={0} y={0} width={width} height={height} fill={bg} />
        <Rect x={0} y={0} width={width} height={height} fill={`url(#${id}m)`} />
        <Rect x={0} y={0} width={width} height={height} fill={`url(#${id}g)`} />
      </>
    );
  } else {
    // kırışık boya / plastik / fildişi: ince grenli doku + yumuşak ışık
    const grain = kind === 'crackle' ? 5 : kind === 'plastic' ? 3 : 7;
    body = (
      <>
        <Defs>
          <LinearGradient id={`${id}l`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={kind === 'ivory' ? mix(bg, '#FFFFFF', 0.08) : light} />
            <Stop offset="1" stopColor={dark} />
          </LinearGradient>
          <Pattern id={`${id}t`} x={0} y={0} width={grain} height={grain} patternUnits="userSpaceOnUse">
            <Circle cx={grain * 0.3} cy={grain * 0.4} r={0.7} fill="#000" opacity={0.35} />
            <Circle cx={grain * 0.8} cy={grain * 0.85} r={0.5} fill="#FFFFFF" opacity={0.05} />
          </Pattern>
        </Defs>
        <Rect x={0} y={0} width={width} height={height} fill={`url(#${id}l)`} />
        <Rect x={0} y={0} width={width} height={height} fill={`url(#${id}t)`} />
      </>
    );
  }

  return (
    <Svg width={width} height={height} style={{ position: 'absolute', left: 0, top: 0 }} pointerEvents="none">
      {body}
    </Svg>
  );
});
