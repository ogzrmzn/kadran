import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ControlContent } from '@/components/kadran/HudDrawer';
import { HudButton, KdLabel } from '@/components/kadran/primitives';
import { alpha } from '@/features/kadran/themes';
import { useKadran } from '@/features/kadran/useKadran';

/** Ayarlar: sağdan açılan kontrol paneliyle aynı içerik (ana sayfadan erişim için) */
export default function SettingsScreen() {
  const { upal: pal } = useKadran();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: pal.bg }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 40,
          paddingLeft: insets.left + 20,
          paddingRight: insets.right + 20,
          maxWidth: 720,
          width: '100%',
          alignSelf: 'center',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <HudButton icon="arrow-left" pal={pal} size={36} onPress={() => router.back()} />
          <View style={{ flex: 1 }}>
            <KdLabel color={pal.primary} size={10} spacing={3}>
              KADRAN
            </KdLabel>
            <KdLabel color={pal.text} size={24} spacing={0.5} serif weight="700">
              Ayarlar
            </KdLabel>
          </View>
        </View>
        <ControlContent />
        <View style={{ marginTop: 18, borderTopWidth: 1, borderColor: alpha(pal.dim, 0.5), paddingTop: 12 }}>
          <KdLabel color={pal.dim} size={8.5} spacing={1} style={{ textTransform: 'none' }} numberOfLines={4}>
            {'KADRAN hızı telefonun GPS\'inden ölçer. GPS verisi yoksa ya da doğruluk yetersizse ibre sıfırda kalır, dijital ekranlarda "--" yazar. Aynı ayarlar gösterge ekranındaki PANEL düğmesinden de açılır.'}
          </KdLabel>
        </View>
      </ScrollView>
    </View>
  );
}
