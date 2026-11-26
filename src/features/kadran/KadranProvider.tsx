import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { resolveSettings, type KadranSettings } from './settings';
import { loadRaw, saveRaw } from './storage';

const KEY = 'kadran.settings';

interface Ctx {
  nx: KadranSettings;
  /** Dakikada bir güncellenen saat (güneşe göre ışık geçişi için) */
  now: number;
  update: (patch: Partial<KadranSettings>) => void;
}

const KadranContext = createContext<Ctx | null>(null);

function initial(): KadranSettings {
  const raw = loadRaw(KEY);
  try {
    return resolveSettings(raw ? JSON.parse(raw) : null);
  } catch {
    return resolveSettings(null);
  }
}

/** Uygulama ayarları: açılışta bir kez okunur, her değişiklikte kaydedilir */
export function KadranProvider({ children }: { children: ReactNode }) {
  const [nx, setNx] = useState<KadranSettings>(initial);
  const update = useCallback((patch: Partial<KadranSettings>) => {
    setNx((cur) => {
      const next = resolveSettings({ ...cur, ...patch });
      saveRaw(KEY, JSON.stringify(next));
      return next;
    });
  }, []);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(t);
  }, []);
  return <KadranContext.Provider value={{ nx, update, now }}>{children}</KadranContext.Provider>;
}

export function useKadranSettings(): Ctx {
  const c = useContext(KadranContext);
  if (!c) throw new Error('KadranProvider eksik');
  return c;
}
