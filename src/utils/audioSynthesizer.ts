export function playKitchenChime() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const playTone = (freq: number, start: number, dur: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;

      gain.gain.setValueAtTime(0, ctx.currentTime + start);
      gain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + start + 0.04);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + start + dur);

      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur + 0.08);
    };

    [0, 0.38, 0.76].forEach((timeOffset) => {
      playTone(880, timeOffset, 0.28);
      playTone(1100, timeOffset + 0.14, 0.22);
    });

    if ('vibrate' in navigator) {
      navigator.vibrate([280, 90, 280]);
    }
  } catch (err) {
    console.warn('Audio chime playback was blocked or unsupported:', err);
  }
}
