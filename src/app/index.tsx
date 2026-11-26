import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import { BootSequence } from '@/components/kadran/BootSequence';
import { FasciaBackdrop } from '@/components/kadran/Fascia';
import { KdNumber } from '@/components/kadran/KdNumber';
import { HudButton, KdIcon, KdLabel } from '@/components/kadran/primitives';
import { GAUGE_ASPECT, Gauge } from '@/components/kadran/Gauges';
import { THEME_IDS, type ThemeId } from '@/features/kadran/settings';
import { alpha, paletteFor, themeMax, THEMES } from '@/features/kadran/themes';
import { useKadran } from '@/features/kadran/useKadran';

/** Ekranda görünen sürüm etiketi: telefonda hangi sürümün açıldığını doğrulamak için */
const APP_BUILD = 'SÜRÜM 1 · 26.11';

/** Kontak animasyonu uygulama oturumu başına bir kez */
let booted = false;

/** KADRAN amblemi: krom halkalı küçük kadran ve ibre */
export function Emblem({ size, color, needle }: { size: number; color: string; needle: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Circle cx={50} cy={50} r={44} stroke={color} strokeWidth={7} fill="none" />
      <Path d="M22 70 A32 32 0 1 1 78 70" stroke={color} strokeWidth={3} fill="none" strokeDasharray="3 6" />
      <Path d="M50 50 L72 30" stroke={needle} strokeWidth={7} strokeLinecap="round" />
      <Circle cx={50} cy={50} r={8} fill={color} />
    </Svg>
  );
}

/** Tek tema kartı: canlı önizleme + ad + dönem. Dokununca o temayla sürüş ekranı açılır. */
function ThemeCard({
  title,
  category,
  desc,
  preview,
  backdrop,
  bg,
  accent,
  text,
  dim,
  selected,
  onPress,
  delay,
  reduced,
  width,
}: {
  title: string;
  category: string;
  desc: string;
  preview: ReactNode;
  backdrop?: ReactNode;
  bg: string;
  accent: string;
  text: string;
  dim: string;
  selected: boolean;
  onPress: () => void;
  delay: number;
  reduced: boolean;
  width: number;
}) {
  return (
    <Animated.View entering={reduced ? undefined : FadeInDown.delay(delay).duration(480)} style={{ width }}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ selected }}
        style={({ pressed }) => ({
          backgroundColor: '#120E0A',
          borderWidth: selected ? 2 : 1,
          borderColor: selected || pressed ? accent : alpha(accent, 0.35),
          borderRadius: 10,
          overflow: 'hidden',
        })}
      >
        <View pointerEvents="none" style={{ height: 190, alignItems: 'center', justifyContent: 'center', backgroundColor: bg, overflow: 'hidden' }}>
          {backdrop}
          {preview}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: 1, borderColor: alpha(accent, 0.3) }}>
          <View style={{ flex: 1 }}>
            <KdLabel color={accent} size={9.5} spacing={2}>
              {category}
            </KdLabel>
            <KdLabel color={text} size={19} spacing={0.5} serif style={{ marginTop: 2 }}>
              {title}
            </KdLabel>
            <KdLabel color={dim} size={10.5} spacing={0.4} numberOfLines={2} style={{ textTransform: 'none', marginTop: 4 }}>
              {desc}
            </KdLabel>
          </View>
          <View style={{ alignItems: 'center', gap: 4 }}>
            <KdIcon name={selected ? 'check-circle' : 'key-variant'} size={22} color={accent} />
            <KdLabel color={accent} size={9} spacing={1.6}>
              {selected ? 'SON' : 'KONTAK'}
            </KdLabel>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

/** Başlangıç: tek sayfada cam HUD'u ve tüm klasik gösterge panelleri */
export default function Home() {
  const { upal: pal, pal: hudPal, wpal, nx, light, update } = useKadran();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const sysReduced = useReducedMotion();
  const enterReduced = sysReduced || nx.motion === 'az';
  const [boot, setBoot] = useState(!booted);
  const landscape = width > height;

  const done = useCallback(() => {
    booted = true;
    setBoot(false);
  }, []);

  const innerW = width - insets.left - insets.right - 40;
  const cols = landscape || innerW > 700 ? 2 : 1;
  const cardW = (innerW - (cols - 1) * 14) / cols;
  const openTheme = (id: ThemeId) => {
    update({ theme: id, lastView: 'kokpit' });
    router.push('/kokpit');
  };

  return (
    <View style={{ flex: 1, backgroundColor: pal.bg }}>
      <FasciaBackdrop kind="crackle" pal={pal} width={width} height={height} />
      {!boot ? (
        <ScrollView
          contentContainerStyle={{
            paddingTop: insets.top + 14,
            paddingBottom: insets.bottom + 24,
            paddingLeft: insets.left + 20,
            paddingRight: insets.right + 20,
          }}
        >
          <Animated.View entering={enterReduced ? undefined : FadeIn.duration(500)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Emblem size={30} color={pal.chrome} needle={pal.needle} />
              <View>
                <KdLabel color={pal.text} size={20} spacing={4} serif weight="700">
                  KADRAN
                </KdLabel>
                <KdLabel color={pal.dim} size={8.5} spacing={1.6}>
                  {`KLASİK GÖSTERGE · ${APP_BUILD}`}
                </KdLabel>
              </View>
            </View>
            <HudButton icon="tune-variant" pal={pal} size={38} onPress={() => router.push('/ayarlar')} />
          </Animated.View>

          <Animated.View entering={enterReduced ? undefined : FadeIn.delay(80).duration(600)} style={{ marginTop: 24, marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 22, height: 2, backgroundColor: pal.primary }} />
              <KdLabel color={pal.primary} size={10.5} spacing={3.5}>
                GÖSTERGE SEÇİMİ
              </KdLabel>
            </View>
            <KdLabel color={pal.text} size={landscape ? 24 : 28} spacing={0.3} serif style={{ marginTop: 6, fontStyle: 'italic' }} numberOfLines={2}>
              Gösterge panelinizi seçin
            </KdLabel>
          </Animated.View>
          {nx.demo ? (
            <KdLabel color={pal.warn} size={10} spacing={1.2} style={{ marginBottom: 12 }} numberOfLines={2}>
              ⚠ DEMO VERİSİ AÇIK — göstergeler gerçek hız göstermez
            </KdLabel>
          ) : null}

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
            <ThemeCard
              width={cardW}
              title="Cam HUD"
              category="CAM YANSITMA · NOSTALJİ"
              desc="Ön cama yansıtma · ayna görüntü · kalın amber rakamlar"
              bg="#000000"
              accent={wpal.primary}
              text={pal.text}
              dim={pal.dim}
              selected={nx.lastView === 'cam'}
              delay={100}
              reduced={enterReduced}
              onPress={() => {
                update({ lastView: 'cam' });
                router.push('/cam');
              }}
              preview={
                <View style={{ alignItems: 'center' }}>
                  <View style={{ transform: [{ scaleX: -1 }] }}>
                    <KdNumber text="88" height={96} color={wpal.primary} style="bold" weightScale={1.1} />
                  </View>
                  <View style={{ width: 160, height: 7, marginTop: 14, backgroundColor: alpha(wpal.primary, 0.15), alignItems: 'center' }}>
                    <View style={{ width: 70, height: 7, backgroundColor: wpal.primary }} />
                  </View>
                </View>
              }
            />
            {THEME_IDS.map((id, i) => {
              const t = THEMES[id];
              const tp = id === nx.theme ? hudPal : paletteFor(t, light, nx.accent);
              const gw = Math.min(cardW - 28, 172 / GAUGE_ASPECT[t.gauge]);
              return (
                <ThemeCard
                  key={id}
                  width={cardW}
                  title={t.name}
                  category={t.era}
                  desc={t.tagline}
                  bg={tp.bg}
                  backdrop={<FasciaBackdrop kind={t.fascia} pal={tp} width={cardW} height={190} />}
                  accent={pal.primary}
                  text={pal.text}
                  dim={pal.dim}
                  selected={nx.lastView === 'kokpit' && nx.theme === id}
                  delay={160 + i * 60}
                  reduced={enterReduced}
                  onPress={() => openTheme(id)}
                  preview={
                    <Gauge
                      kind={t.gauge}
                      speed={nx.unit === 'mph' ? 40 : 60}
                      max={themeMax(t, nx.unit)}
                      width={gw}
                      pal={nx.speedColor ? { ...tp, text: nx.speedColor } : tp}
                      glyph={t.glyph}
                      unit={nx.unit === 'mph' ? 'MPH' : 'KM/H'}
                      reduced={enterReduced}
                      odo="128.4"
                      now={new Date(2026, 0, 1, 10, 9, 30).getTime()}
                      assist={nx.digitalAssist}
                    />
                  }
                />
              );
            })}
          </View>
        </ScrollView>
      ) : null}
      {boot ? <BootSequence pal={hudPal} onDone={done} reduced={enterReduced} /> : null}
    </View>
  );
}
