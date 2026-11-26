import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { alpha, type GlyphStyle, type Palette } from '@/features/kadran/themes';
import { KdNumber } from './KdNumber';

/** Etiket yazısı: eski gösterge plakalarındaki gibi dar gövdeli, büyük harf */
export const LABEL_FONT = Platform.select({
  ios: 'AvenirNextCondensed-DemiBold',
  android: 'sans-serif-condensed',
  default: '"Avenir Next Condensed", "Roboto Condensed", "Arial Narrow", "Helvetica Neue", sans-serif',
});
/** Başlık yazısı: klasik serif */
export const TITLE_FONT = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, "Times New Roman", serif' });

export function KdLabel({
  children,
  color,
  size = 10,
  spacing = 2.2,
  weight = '700',
  style,
  numberOfLines = 1,
  serif,
}: {
  children: ReactNode;
  color: string;
  size?: number;
  spacing?: number;
  weight?: TextStyle['fontWeight'];
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
  /** Klasik serif başlık yazısı (büyük harfe çevrilmez) */
  serif?: boolean;
}) {
  return (
    <Text
      numberOfLines={numberOfLines}
      allowFontScaling={false}
      style={[
        serif
          ? { color, fontSize: size, letterSpacing: spacing, fontWeight: weight, fontFamily: TITLE_FONT }
          : { color, fontSize: size, letterSpacing: spacing, fontWeight: weight, fontFamily: LABEL_FONT, textTransform: 'uppercase' },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];
export function KdIcon({ name, size = 18, color }: { name: string; size?: number; color: string }) {
  return <MaterialCommunityIcons name={name as IconName} size={size} color={color} />;
}

/** Tek veri plakası: etiket + özel rakamlar + birim (krom kenarlı küçük pano) */
export function DataCell({
  label,
  value,
  unit,
  pal,
  glyph,
  size = 26,
  align = 'flex-start',
  color,
  icon,
}: {
  label: string;
  value: string;
  unit?: string;
  pal: Palette;
  glyph: GlyphStyle;
  size?: number;
  align?: 'flex-start' | 'center' | 'flex-end';
  color?: string;
  icon?: string;
}) {
  return (
    <View
      style={{
        alignItems: align,
        paddingHorizontal: size * 0.38,
        paddingVertical: size * 0.24,
        borderRadius: 6,
        backgroundColor: alpha(pal.face, 0.82),
        borderWidth: 1,
        borderColor: alpha(pal.chrome, 0.45),
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: size * 0.2 }}>
        {icon ? <KdIcon name={icon} size={11} color={pal.primary} /> : null}
        <KdLabel color={alpha(pal.text, 0.7)} size={9.5} spacing={1.4}>
          {label}
        </KdLabel>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 5 }}>
        <KdNumber text={value} height={size} color={color ?? pal.text} style={glyph} glow={glyph === 'seg' || glyph === 'flat' ? pal.text : undefined} />
        {unit ? (
          <KdLabel color={alpha(pal.text, 0.65)} size={Math.max(9, size * 0.34)} spacing={1} style={{ marginBottom: -1 }}>
            {unit}
          </KdLabel>
        ) : null}
      </View>
    </View>
  );
}

/** Küçük, zarif yuvarlak/pahlı kontrol */
export function HudButton({
  icon,
  onPress,
  pal,
  label,
  size = 40,
  active,
  disabled,
}: {
  icon: string;
  onPress: () => void;
  pal: Palette;
  label?: string;
  size?: number;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      style={({ pressed }) => ({
        height: size,
        minWidth: size,
        paddingHorizontal: label ? 12 : 0,
        borderRadius: size / 2,
        flexDirection: 'row',
        gap: 6,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: active ? pal.primary : alpha(pal.chrome, 0.55),
        backgroundColor: active ? alpha(pal.primary, 0.18) : pressed ? alpha(pal.primary, 0.14) : 'rgba(0,0,0,0.55)',
        opacity: disabled ? 0.35 : 1,
      })}
    >
      <KdIcon name={icon} size={size * 0.46} color={active ? pal.primary : pal.text} />
      {label ? (
        <KdLabel color={active ? pal.primary : pal.text} size={10}>
          {label}
        </KdLabel>
      ) : null}
    </Pressable>
  );
}

/** Seçenek grubu (ayarlar) */
export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  pal,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  pal: Palette;
}) {
  return (
    <View style={{ flexDirection: 'row', borderWidth: 1, borderColor: alpha(pal.primary, 0.25), borderRadius: 3, padding: 3, gap: 3 }}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={String(o.value)}
            onPress={() => onChange(o.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            style={{
              flex: 1,
              paddingVertical: 9,
              alignItems: 'center',
              borderRadius: 2,
              backgroundColor: on ? alpha(pal.primary, 0.18) : 'transparent',
              borderWidth: 1,
              borderColor: on ? pal.primary : 'transparent',
            }}
          >
            <KdLabel color={on ? pal.primary : pal.dim} size={10} spacing={1.2}>
              {o.label}
            </KdLabel>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Aç/kapa anahtarı (dijital kayar) */
export function KdSwitch({ value, onChange, pal }: { value: boolean; onChange: (v: boolean) => void; pal: Palette }) {
  return (
    <Pressable
      onPress={() => onChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      hitSlop={10}
      style={{ width: 50, height: 24, borderRadius: 2, borderWidth: 1, borderColor: value ? pal.primary : alpha(pal.dim, 0.7), padding: 3, justifyContent: 'center' }}
    >
      <View
        style={{
          width: 20,
          height: 16,
          backgroundColor: value ? pal.primary : pal.dim,
          alignSelf: value ? 'flex-end' : 'flex-start',
          borderRadius: 1,
        }}
      />
    </Pressable>
  );
}

/** − değer + ayarı (hız uyarısı, parlaklık) */
export function Stepper({ value, onMinus, onPlus, pal, minusDisabled, plusDisabled }: { value: string; onMinus: () => void; onPlus: () => void; pal: Palette; minusDisabled?: boolean; plusDisabled?: boolean }) {
  const btn = (icon: string, onPress: () => void, disabled?: boolean, label?: string) => (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      style={({ pressed }) => ({
        width: 52,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: alpha(pal.primary, 0.45),
        backgroundColor: pressed ? alpha(pal.primary, 0.25) : alpha(pal.primary, 0.1),
        opacity: disabled ? 0.35 : 1,
        borderRadius: 4,
      })}
    >
      <KdIcon name={icon} size={24} color={pal.text} />
    </Pressable>
  );
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      {btn('minus', onMinus, minusDisabled, 'Azalt')}
      <View style={{ flex: 1, height: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: alpha(pal.primary, 0.25), backgroundColor: pal.glass, borderRadius: 4 }}>
        <KdLabel color={pal.text} size={15} spacing={2} weight="800">
          {value}
        </KdLabel>
      </View>
      {btn('plus', onPlus, plusDisabled, 'Artır')}
    </View>
  );
}

/** Simgeli seçenek kartları (ekran içeriği, mod) */
export function OptionCards<T extends string>({ options, value, onChange, pal }: { options: { value: T; label: string; icon: string }[]; value: T; onChange: (v: T) => void; pal: Palette }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            style={{
              flex: 1,
              paddingVertical: 12,
              alignItems: 'center',
              gap: 6,
              borderRadius: 4,
              borderWidth: 1,
              borderColor: on ? pal.primary : alpha(pal.primary, 0.2),
              backgroundColor: on ? alpha(pal.primary, 0.22) : pal.glass,
            }}
          >
            <KdIcon name={o.icon} size={20} color={on ? pal.primary : pal.text} />
            <KdLabel color={on ? pal.primary : pal.text} size={9.5} spacing={1}>
              {o.label}
            </KdLabel>
          </Pressable>
        );
      })}
    </View>
  );
}
