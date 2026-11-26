import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { PlayfairDisplay_900Black, useFonts } from '@expo-google-fonts/playfair-display';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { KadranProvider } from '@/features/kadran/KadranProvider';
import { useKadran } from '@/features/kadran/useKadran';

SplashScreen.preventAutoHideAsync().catch(() => {});

function Root() {
  const { pal } = useKadran();
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(pal.bg).catch(() => {});
  }, [pal.bg]);
  // Cam HUD'unun klasik serif rakamları; yüklenince (ya da hata olursa) açılış ekranı kapanır
  const [fontsLoaded, fontError] = useFonts({ PlayfairDisplay_900Black });
  const ready = fontsLoaded || !!fontError;
  // Yerel açılış ekranı (KADRAN amblemi) kapanır; ardından kontak animasyonu oynar
  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);
  if (!ready) return null;
  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: pal.bg } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="cam" options={{ contentStyle: { backgroundColor: '#000' } }} />
        <Stack.Screen name="kokpit" />
        <Stack.Screen name="ayarlar" options={{ animation: 'slide_from_bottom' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <KadranProvider>
        <Root />
      </KadranProvider>
    </SafeAreaProvider>
  );
}
