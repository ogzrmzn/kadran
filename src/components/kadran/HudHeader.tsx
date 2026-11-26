import { router } from 'expo-router';
import { View } from 'react-native';
import { clockText } from '@/features/kadran/format';
import type { GlyphStyle, Palette } from '@/features/kadran/themes';
import type { Gps } from '@/features/kadran/useGps';
import type { Weather } from '@/features/kadran/useWeather';
import { SignalIndicator } from './Instruments';
import { HudButton, KdIcon, KdLabel } from './primitives';
import { KdNumber } from './KdNumber';

/**
 * Tüm sürüş ekranlarında (Windshield dahil) aynı üst çubuk: geri, GPS sinyali, ortada saat,
 * hava durumu, yolculuğu sıfırla (dururken) ve kontrol paneli. Cama yansıtma bu çubuğu çevirmez.
 */
export function HudHeader({
  pal,
  gps,
  showGps,
  showClock,
  clockHeight,
  glyph,
  weather,
  moving,
  onPanel,
}: {
  pal: Palette;
  gps: Gps;
  showGps: boolean;
  showClock: boolean;
  clockHeight: number;
  glyph: GlyphStyle;
  weather?: Weather | null;
  moving: boolean;
  onPanel: () => void;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 40 }}>
      <HudButton icon="arrow-left" pal={pal} size={36} onPress={() => router.back()} />
      {showGps ? <SignalIndicator status={gps.status} accuracy={gps.accuracy} pal={pal} /> : null}
      <View style={{ flex: 1, alignItems: 'center' }}>
        {showClock ? <KdNumber text={clockText(new Date(gps.now))} height={clockHeight} color={pal.text} style={glyph} /> : null}
      </View>
      {weather ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <KdIcon name={weather.icon} size={16} color={pal.secondary} />
          <KdLabel color={pal.text} size={11} spacing={1}>
            {`${weather.temp}°`}
          </KdLabel>
        </View>
      ) : null}
      {moving ? null : <HudButton icon="restart" pal={pal} size={36} onPress={gps.resetTrip} />}
      <HudButton icon="menu" pal={pal} size={36} label="PANEL" active onPress={onPanel} />
    </View>
  );
}
