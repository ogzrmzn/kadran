import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withSequence, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { scheduleOnRN } from 'react-native-worklets';
import { alpha, type Palette } from '@/features/kadran/themes';
import { KdLabel } from './primitives';

const LINES = [
  ['KONTAK', 'AÇIK'],
  ['GÖSTERGE AYDINLATMASI', 'TAMAM'],
  ['İBRE KONTROLÜ', 'TAMAM'],
  ['KONUM MODÜLÜ', 'HAZIR'],
] as const;

const A0 = 135;
const SW = 270;

/** Kadran çizgileri (statik) */
const TICKS = (() => {
  const out: string[] = [];
  for (let i = 0; i <= 27; i++) {
    const a = ((A0 + (SW * i) / 27) * Math.PI) / 180;
    const big = i % 3 === 0;
    const r1 = 44;
    const r2 = big ? 37 : 40.5;
    out.push(`M${(50 + r1 * Math.cos(a)).toFixed(2)} ${(50 + r1 * Math.sin(a)).toFixed(2)}L${(50 + r2 * Math.cos(a)).toFixed(2)} ${(50 + r2 * Math.sin(a)).toFixed(2)}`);
  }
  return out.join('');
})();

/**
 * ~2.4 sn'lik kontak: kadran aydınlanır, ibre klasik araçlardaki gibi sona kadar gidip geri döner,
 * kontrol satırları gelir, sonra katman söner. Dokunarak atlanabilir; "az animasyon" tercihinde çok kısadır.
 */
export function BootSequence({ pal, onDone, reduced }: { pal: Palette; onDone: () => void; reduced?: boolean }) {
  const { width, height } = useWindowDimensions();
  const S = Math.min(width, height) * 0.52;
  const light = useSharedValue(0);
  const needle = useSharedValue(0);
  const out = useSharedValue(0);
  const [shownLines, setShownLines] = useState(0);
  const [title, setTitle] = useState(false);

  useEffect(() => {
    const total = reduced ? 500 : 2500;
    light.value = withTiming(1, { duration: reduced ? 100 : 450, easing: Easing.out(Easing.quad) });
    needle.value = reduced
      ? 0
      : withDelay(350, withSequence(withTiming(1, { duration: 700, easing: Easing.inOut(Easing.cubic) }), withTiming(0, { duration: 650, easing: Easing.inOut(Easing.cubic) })));
    const timers = [setTimeout(() => setTitle(true), reduced ? 50 : 500)];
    LINES.forEach((_, i) => timers.push(setTimeout(() => setShownLines(i + 1), reduced ? 80 : 800 + i * 260)));
    out.value = withDelay(
      total - (reduced ? 200 : 380),
      withTiming(1, { duration: reduced ? 200 : 380, easing: Easing.in(Easing.quad) }, (f) => {
        if (f) scheduleOnRN(onDone);
      }),
    );
    return () => timers.forEach(clearTimeout);
  }, [reduced, light, needle, out, onDone]);

  const faceStyle = useAnimatedStyle(() => ({ opacity: 0.25 + light.value * 0.75 }));
  const needleStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${A0 + SW * needle.value}deg` }] }));
  const rootStyle = useAnimatedStyle(() => ({ opacity: 1 - out.value }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: '#0B0806', zIndex: 100 }, rootStyle]}>
      <Pressable style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }} onPress={onDone} accessibilityLabel="Kontağı atla">
        <Animated.View style={[{ width: S, height: S }, faceStyle]}>
          <Svg width={S} height={S} viewBox="0 0 100 100">
            <Circle cx={50} cy={50} r={49} fill={pal.chrome} opacity={0.5} />
            <Circle cx={50} cy={50} r={46.5} fill={pal.face} />
            <Path d={TICKS} stroke={pal.text} strokeWidth={1.2} />
          </Svg>
        </Animated.View>
        <Animated.View style={[{ position: 'absolute', width: S, height: S }, needleStyle]} pointerEvents="none">
          <Svg width={S} height={S} viewBox="0 0 100 100">
            <Path d="M44 48.8 L88 49.6 L88 50.4 L44 51.2 Z" fill={pal.needle} />
            <Circle cx={50} cy={50} r={4.5} fill="#151515" stroke={alpha(pal.chrome, 0.8)} strokeWidth={0.8} />
          </Svg>
        </Animated.View>
        <View style={{ height: 52, alignItems: 'center', marginTop: 20 }}>
          {title ? (
            <>
              <KdLabel color={pal.text} size={28} spacing={8} serif weight="700">
                KADRAN
              </KdLabel>
              <KdLabel color={pal.primary} size={10.5} spacing={5}>
                KLASİK GÖSTERGE · KONTAK
              </KdLabel>
            </>
          ) : null}
        </View>
        <View style={{ marginTop: 20, width: Math.min(300, width - 60), gap: 5, minHeight: 80 }}>
          {LINES.slice(0, shownLines).map(([k, v]) => (
            <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <KdLabel color={alpha(pal.text, 0.6)} size={10} spacing={1.4}>
                {k}
              </KdLabel>
              <KdLabel color={pal.primary} size={10} spacing={1.4}>
                {v}
              </KdLabel>
            </View>
          ))}
        </View>
      </Pressable>
    </Animated.View>
  );
}
