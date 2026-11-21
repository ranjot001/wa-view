"use client";

// Synthesised call tones (no audio assets needed).
//  - ringback: what the caller hears while waiting (Indian-style double beep)
//  - ringtone: what the agent hears for an incoming call
// Browsers may block audio until the page has had a user gesture; failures are silent.

export function startTone(kind: "ringback" | "ringtone"): () => void {
  let ctx: AudioContext;
  try {
    ctx = new AudioContext();
  } catch {
    return () => {};
  }
  const gain = ctx.createGain();
  gain.gain.value = 0;
  gain.connect(ctx.destination);
  const osc = ctx.createOscillator();
  osc.frequency.value = kind === "ringback" ? 425 : 880;
  osc.connect(gain);
  osc.start();

  const vol = kind === "ringback" ? 0.08 : 0.15;
  const pattern =
    kind === "ringback"
      ? [[0, 0.4], [0.6, 1.0]] // beep-beep, then silence
      : [[0, 0.25], [0.35, 0.6], [0.7, 0.95]];
  const period = kind === "ringback" ? 3 : 2;

  const schedule = () => {
    const t = ctx.currentTime;
    for (const [on, off] of pattern) {
      gain.gain.setValueAtTime(vol, t + on);
      gain.gain.setValueAtTime(0, t + off);
    }
  };
  schedule();
  const id = setInterval(schedule, period * 1000);

  return () => {
    clearInterval(id);
    try {
      osc.stop();
      ctx.close();
    } catch {}
  };
}
