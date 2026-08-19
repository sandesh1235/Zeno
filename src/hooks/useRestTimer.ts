import { useCallback, useEffect, useRef, useState } from 'react';

export type RestTimerState = { visible: boolean; remainingSec: number; totalSec: number };

export function useRestTimer(defaultDurationSec = 90) {
  const [state, setState] = useState<RestTimerState>({ visible: false, remainingSec: 0, totalSec: defaultDurationSec });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clear = () => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  };

  const start = useCallback((duration: number = defaultDurationSec) => {
    clear();
    setState({ visible: true, remainingSec: duration, totalSec: duration });
    intervalRef.current = setInterval(() => {
      setState(s => {
        if (s.remainingSec <= 1) { clear(); return { ...s, visible: false, remainingSec: 0 }; }
        return { ...s, remainingSec: s.remainingSec - 1 };
      });
    }, 1000);
  }, [defaultDurationSec]);

  const skip = useCallback(() => { clear(); setState(s => ({ ...s, visible: false })); }, []);

  useEffect(() => clear, []);

  return { state, start, skip };
}
