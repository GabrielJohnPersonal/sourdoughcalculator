import { useState, useEffect, useCallback, useRef } from 'react';
import { playKitchenChime } from '../utils/audioSynthesizer';

export interface UseTimerProps {
  initialDurationSecs: number;
  initialTargetEndTime?: number | null;
  initialRunning?: boolean;
  onComplete?: () => void;
}

export function useTimer({
  initialDurationSecs,
  initialTargetEndTime = null,
  initialRunning = false,
  onComplete,
}: UseTimerProps) {
  const [durationSecs, setDurationSecs] = useState(initialDurationSecs);
  const [targetEndTime, setTargetEndTime] = useState<number | null>(initialTargetEndTime);
  const [remaining, setRemaining] = useState<number>(() => {
    if (initialTargetEndTime && initialRunning) {
      return Math.max(0, Math.round((initialTargetEndTime - Date.now()) / 1000));
    }
    return initialDurationSecs;
  });
  const [isRunning, setIsRunning] = useState(initialRunning);
  const [isDone, setIsDone] = useState(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && targetEndTime) {
      interval = setInterval(() => {
        const secsLeft = Math.max(0, Math.round((targetEndTime - Date.now()) / 1000));
        setRemaining(secsLeft);

        if (secsLeft <= 0) {
          if (interval) clearInterval(interval);
          setIsRunning(false);
          setIsDone(true);
          setTargetEndTime(null);
          playKitchenChime();
          if (onCompleteRef.current) {
            onCompleteRef.current();
          }
        }
      }, 500);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, targetEndTime]);

  const start = useCallback((customSecs?: number) => {
    const total = customSecs !== undefined ? customSecs : (remaining > 0 ? remaining : durationSecs);
    const end = Date.now() + total * 1000;
    setDurationSecs(total);
    setRemaining(total);
    setTargetEndTime(end);
    setIsRunning(true);
    setIsDone(false);
  }, [durationSecs, remaining]);

  const pause = useCallback(() => {
    setIsRunning(false);
    setTargetEndTime(null);
  }, []);

  const resume = useCallback(() => {
    const end = Date.now() + remaining * 1000;
    setTargetEndTime(end);
    setIsRunning(true);
  }, [remaining]);

  const addTime = useCallback((extraSecs: number) => {
    if (isRunning && targetEndTime) {
      const newEnd = targetEndTime + extraSecs * 1000;
      setTargetEndTime(newEnd);
      setDurationSecs((prev) => prev + extraSecs);
      setRemaining((prev) => prev + extraSecs);
    } else {
      setDurationSecs((prev) => prev + extraSecs);
      setRemaining((prev) => prev + extraSecs);
      setIsDone(false);
    }
  }, [isRunning, targetEndTime]);

  const reset = useCallback((newDuration?: number) => {
    const d = newDuration !== undefined ? newDuration : durationSecs;
    setDurationSecs(d);
    setRemaining(d);
    setTargetEndTime(null);
    setIsRunning(false);
    setIsDone(false);
  }, [durationSecs]);

  return {
    remaining,
    durationSecs,
    isRunning,
    isDone,
    targetEndTime,
    start,
    pause,
    resume,
    addTime,
    reset,
  };
}
