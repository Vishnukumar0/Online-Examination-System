/* ── Sound Synthesizer (Web Audio API) ────────────────────────
   Zero-dependency, synthesized audio effects for quiz interactions.
───────────────────────────────────────────────────────────── */
const SoundFX = (() => {
  let ctx = null;
  let enabled = localStorage.getItem('qm_sound') !== 'false';

  function getAudioContext() {
    if (!ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) ctx = new AudioContext();
    }
    if (ctx && ctx.state === 'suspended') {
      ctx.resume();
    }
    return ctx;
  }

  function isEnabled() { return enabled; }

  function setEnabled(val) {
    enabled = Boolean(val);
    localStorage.setItem('qm_sound', enabled ? 'true' : 'false');
  }

  function playTone(freq, type = 'sine', duration = 0.15, gainVal = 0.1) {
    if (!enabled) return;
    try {
      const audioCtx = getAudioContext();
      if (!audioCtx) return;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

      gain.gain.setValueAtTime(gainVal, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch {}
  }

  function playClick() {
    playTone(600, 'sine', 0.05, 0.04);
  }

  function playOptionSelect() {
    playTone(520, 'triangle', 0.08, 0.08);
  }

  function playCorrect() {
    if (!enabled) return;
    try {
      const audioCtx = getAudioContext();
      if (!audioCtx) return;
      const now = audioCtx.currentTime;

      [523.25, 659.25, 783.99].forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.12, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.25);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.25);
      });
    } catch {}
  }

  function playWrong() {
    if (!enabled) return;
    try {
      const audioCtx = getAudioContext();
      if (!audioCtx) return;
      const now = audioCtx.currentTime;

      [350, 260].forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);
        gain.gain.setValueAtTime(0.08, now + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.12 + 0.2);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.2);
      });
    } catch {}
  }

  function playTimerTick() {
    playTone(880, 'sine', 0.04, 0.05);
  }

  function playFanfare() {
    if (!enabled) return;
    try {
      const audioCtx = getAudioContext();
      if (!audioCtx) return;
      const now = audioCtx.currentTime;
      const notes = [
        { f: 523.25, d: 0.12, t: 0.00 }, // C5
        { f: 659.25, d: 0.12, t: 0.12 }, // E5
        { f: 783.99, d: 0.12, t: 0.24 }, // G5
        { f: 1046.50, d: 0.40, t: 0.36 } // C6
      ];

      notes.forEach(({ f, d, t }) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now + t);
        gain.gain.setValueAtTime(0.15, now + t);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + t + d);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + t);
        osc.stop(now + t + d);
      });
    } catch {}
  }

  return { isEnabled, setEnabled, playClick, playOptionSelect, playCorrect, playWrong, playTimerTick, playFanfare };
})();
