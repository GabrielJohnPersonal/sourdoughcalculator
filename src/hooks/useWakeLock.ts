import { useState, useRef, useEffect, useCallback } from 'react';

export function useWakeLock() {
  const [isActive, setIsActive] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    setIsSupported('wakeLock' in navigator);
  }, []);

  const toggle = useCallback(async () => {
    if (!('wakeLock' in navigator)) {
      alert('Screen Wake Lock is not supported on this browser.');
      return;
    }

    if (isActive) {
      if (wakeLockRef.current) {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
      setIsActive(false);
    } else {
      try {
        const sentinel = await navigator.wakeLock.request('screen');
        wakeLockRef.current = sentinel;
        setIsActive(true);

        sentinel.addEventListener('release', () => {
          setIsActive(false);
          wakeLockRef.current = null;
        });
      } catch (err) {
        console.warn('Wake Lock request failed:', err);
        setIsActive(false);
      }
    }
  }, [isActive]);

  return { isActive, isSupported, toggle };
}
