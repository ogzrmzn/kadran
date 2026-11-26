import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Platform, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { measureKd, KdNumber } from '@/components/kadran/KdNumber';
import { DimOverlay, HudDrawer } from '@/components/kadran/HudDrawer';
import { HudHeader } from '@/components/kadran/HudHeader';
import { HudButton, KdLabel } from '@/components/kadran/primitives';
import { clockDuration, distanceText, distUnitLabel, gaugeMax, toUnit, unitLabel } from '@/features/kadran/format';
import { alpha } from '@/features/kadran/themes';
import { useHudSystem } from '@/features/kadran/useHudSystem';
import { useKadran, useRememberPosition } from '@/features/kadran/useKadran';
import { STATUS_TEXT, useGps } from '@/features/kadran/useGps';


/**
 * CAM HUD — nostaljik amber yansıtma, klasik serif rakamlar
 * Telefon torpidoya yatırılır, ekran ön cama yansır. Ayna görüntü, saf siyah zemin, kalın amber rakamlar,
 * tek büyük hız. Işıma, sürekli animasyon ve küçük yazı yok: camda çift görüntü yapar ve göz yorar.
 */
export default function Windshield() {
  const { nx, wpal: pal, brightness } = useKadran();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const gps = useGps({ demo: nx.demo, compass: false });
  const [drawer, setDrawer] = useState(false);
  useHudSystem({ keepAwake: nx.keepAwake, brightness, orientation: nx.camOrientation });
  useRememberPosition(nx.demo ? null : gps.trip.last);

  const speed = gps.speedKmh == null ? null : Math.round(toUnit(gps.speedKmh, nx.unit));
  const over = nx.speedAlert > 0 && speed != null && speed > nx.speedAlert;
  const statusInfo = STATUS_TEXT[gps.status];
  const showClock = nx.widgets.clock;
  const showDist = nx.widgets.distance;
  const showTime = nx.widgets.tripTime;

  // Hız uyarısı: 3 kez yanıp söner + tek titreşim, sınırın üstünde kırmızı kalır
  const flash = useSharedValue(1);
  useEffect(() => {
    if (!over) return;
    flash.value = withRepeat(withSequence(withTiming(0.25, { duration: 220 }), withTiming(1, { duration: 220 })), 3, false);
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
  }, [over, flash]);
  const flashStyle = useAnimatedStyle(() => ({ opacity: flash.value }));

  // Merkez hız çubuğu: ortadan iki yana dolar (ayna görüntüde de simetrik)
  const frac = useSharedValue(0);
  useEffect(() => {
    const v = gps.speedKmh == null ? 0 : Math.min(1, toUnit(gps.speedKmh, nx.unit) / gaugeMax(nx.unit));
    frac.value = withTiming(v, { duration: 300 });
  }, [gps.speedKmh, nx.unit, frac]);
  const W = width - insets.left - insets.right - 40;
  const H = height - insets.top - insets.bottom - 30;
  const barW = W * 0.7;
  const barStyle = useAnimatedStyle(() => ({ width: barW * frac.value }));

  const glyph = 'serif' as const;
  const ratio = measureKd('188', 1, glyph);
  const extras = showClock || showDist || showTime;
  const numH = Math.min(H * (extras ? 0.44 : 0.56), (W * 0.84) / ratio) * nx.gaugeScale;
  const auxH = Math.max(22, Math.min(40, H * 0.1));
  const bigAux = Math.max(30, Math.min(64, H * 0.13));
  const color = speed == null ? pal.dim : over ? pal.danger : (nx.speedColor ?? pal.primary);
  const fixed = gps.lastFixAt != null;

  const needsAction = gps.status === 'reddedildi' || gps.status === 'servis-kapali';
  const flip = !nx.mirror ? [] : nx.mirrorAxis === 'ust' ? [{ scaleY: -1 }] : [{ scaleX: -1 }];

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <StatusBar hidden />
      {/* Üst çubuk: diğer temalarla aynı (aynalanmaz) */}
      <View style={{ paddingTop: insets.top + 10, paddingLeft: insets.left + 16, paddingRight: insets.right + 16 }}>
        <HudHeader
          pal={pal}
          gps={gps}
          showGps={nx.widgets.gps}
          showClock={showClock}
          clockHeight={Math.max(16, Math.min(34, Math.min(width, height) * 0.058) * 0.75)}
          glyph="classic"
          moving={(gps.speedKmh ?? 0) > 10}
          onPanel={() => setDrawer(true)}
        />
        {needsAction ? (
          <View style={{ alignItems: 'center', gap: 6, marginTop: 8 }}>
            <HudButton icon="crosshairs-gps" pal={pal} label={gps.status === 'reddedildi' ? 'İZİN VER' : 'TEKRAR DENE'} active onPress={gps.retry} />
            <KdLabel color={pal.dim} size={9.5} spacing={1}>
              {statusInfo.detail}
            </KdLabel>
          </View>
        ) : null}
      </View>
      {/* --- Yansıyan katman --- */}
      <View
        pointerEvents="none"
        style={{
          flex: 1,
          paddingTop: 8,
          paddingBottom: insets.bottom + 12,
          paddingLeft: insets.left + 20,
          paddingRight: insets.right + 20,
          transform: flip,
        }}
      >
        {nx.demo ? (
          <View style={{ alignItems: 'center' }}>
            <KdLabel color={pal.warn} size={auxH * 0.7} spacing={4} weight="800">
              DEMO
            </KdLabel>
          </View>
        ) : null}

        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Animated.View style={over ? flashStyle : undefined}>
            <KdNumber text={speed == null ? '--' : String(speed)} height={numH} color={color} style={glyph} weightScale={1.1} />
          </Animated.View>
          <View style={{ width: barW, height: Math.max(8, numH * 0.045), marginTop: numH * 0.17, backgroundColor: alpha(pal.primary, 0.14), alignItems: 'center' }}>
            <Animated.View style={[{ height: '100%', backgroundColor: over ? pal.danger : pal.primary }, barStyle]} />
          </View>
          <KdLabel color={speed == null ? pal.warn : pal.primary} size={auxH * 0.75} spacing={6} weight="800" style={{ marginTop: numH * 0.07 }}>
            {speed == null ? statusInfo.title : unitLabel(nx.unit)}
          </KdLabel>
        </View>

        {showDist || showTime ? (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            {showDist ? (
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
                <KdNumber text={fixed ? distanceText(gps.trip.distanceM, nx.unit) : '--'} height={bigAux} color={pal.text} style={glyph} weightScale={1} />
                <KdLabel color={pal.dim} size={auxH * 0.6} spacing={2} weight="800">
                  {distUnitLabel(nx.unit)}
                </KdLabel>
              </View>
            ) : (
              <View />
            )}
            {showTime ? <KdNumber text={fixed ? clockDuration(gps.now - gps.trip.startedAt) : '--'} height={bigAux} color={pal.text} style={glyph} weightScale={1} /> : null}
          </View>
        ) : null}
      </View>
      <DimOverlay brightness={brightness} />
      <HudDrawer mode="cam" open={drawer} onClose={() => setDrawer(false)} />
    </View>
  );
}
