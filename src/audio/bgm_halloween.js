/**
 * Original Procedural WebAudio BGM Synthesizer:
 * E-flat minor 4/4 "Spooky-Cute" Orchestral Halloween March / Polka at 124.4 BPM.
 * Owner: audio-vo
 *
 * Structure (16 bars = 128 eighth-note steps, ~30.87s seamless loop):
 * - Section A (Bars 1-8): Staccato tuba oom-pah bass on beats 1 & 3, crisp pizzicato
 *   minor chords on beats 2 & 4, chromatic FM celesta/glockenspiel + staccato clarinet
 *   melody opening with Eb5-F5-Gb5-F5-Eb5-D5-Eb5-Bb4.
 * - Section B (Bars 9-16): Brighter Gb major / Bb7 Sauin carnival bridge with
 *   sleigh-bell shimmer + airy vibrato flute counter-melody, turning around via Bb7
 *   back into Section A seamlessly.
 * - Smooth ducking GainNode: 1.0x normal -> 0.35x in 80 ms when VO starts ->
 *   1.0x in 280 ms when VO ends.
 */

export const BGM_BPM = 124.4;
export const BGM_BEAT_SEC = 60 / BGM_BPM; // ~0.482315s
const STEP_SEC = BGM_BEAT_SEC * 0.5;      // Eighth-note grid (~0.241158s)
const TOTAL_STEPS = 128;                  // 16 bars * 8 eighth-notes
const DUCK_GAIN = 0.35;
const DUCK_ATTACK_SEC = 0.08;             // 80 ms attack
const DUCK_RELEASE_SEC = 0.28;            // 280 ms release
const MIX_LEVEL = 0.24;                   // Comfortable musical bed beneath -16 LUFS VO

function midiToHz(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// MIDI pitch constants (Eb minor / Gb major palette)
const N = {
  Ab1: 32, Bb1: 34, Cb2: 35, C2: 36, Db2: 37, D2: 38, Eb2: 39, F2: 41, Gb2: 42, G2: 43, Ab2: 44, Bb2: 46,
  Ab3: 56, Bb3: 58, Cb4: 59, C4: 60, Db4: 61, D4: 62, Eb4: 63, E4: 64, F4: 65, Gb4: 66, G4: 67, Ab4: 68, A4: 69, Bb4: 70, Cb5: 71,
  C5: 72, Db5: 73, D5: 74, Eb5: 75, E5: 76, F5: 77, Gb5: 78, G5: 79, Ab5: 80, A5: 81, Bb5: 82, Cb6: 83,
  C6: 84, Db6: 85, D6: 86, Eb6: 87,
};

// 16-bar harmonic & oom-pah chart (each bar has bass1 on step 0, bass3 on step 4, optional pickup on step 6, chord on steps 2 & 6)
const BAR_CHART = [
  // --- SECTION A: Spooky-Cute Eb-minor Polka March (Bars 0..7) ---
  { section: 'A', b1: N.Eb2, b3: N.Bb1, b4: null, chord2: [N.Eb4, N.Gb4, N.Bb4], chord4: [N.Eb4, N.Gb4, N.Bb4] },
  { section: 'A', b1: N.Eb2, b3: N.Bb1, b4: null, chord2: [N.Eb4, N.Gb4, N.Bb4], chord4: [N.D4, N.F4, N.Ab4] },
  { section: 'A', b1: N.Ab1, b3: N.Eb2, b4: null, chord2: [N.Ab3, N.Cb4, N.Eb4], chord4: [N.Ab3, N.Cb4, N.Eb4] },
  { section: 'A', b1: N.Bb1, b3: N.F2,  b4: N.D2, chord2: [N.D4, N.F4, N.Ab4],   chord4: [N.D4, N.F4, N.Bb4] },
  { section: 'A', b1: N.Eb2, b3: N.Bb1, b4: null, chord2: [N.Eb4, N.Gb4, N.Bb4], chord4: [N.Eb4, N.Gb4, N.Bb4] },
  { section: 'A', b1: N.Cb2, b3: N.Gb2, b4: null, chord2: [N.Cb4, N.Eb4, N.Gb4], chord4: [N.Cb4, N.Eb4, N.Gb4] },
  { section: 'A', b1: N.F2,  b3: N.Bb1, b4: null, chord2: [N.F4, N.Ab4, N.Cb5],  chord4: [N.D4, N.F4, N.Ab4] },
  { section: 'A', b1: N.Eb2, b3: N.F2,  b4: N.G2, chord2: [N.Eb4, N.Gb4, N.Bb4], chord4: [N.Eb4, N.G4, N.Bb4] },

  // --- SECTION B: Gb-major / Bb7 Sauin Carnival Bridge (Bars 8..15) ---
  { section: 'B', b1: N.Gb2, b3: N.Db2, b4: null, chord2: [N.Gb4, N.Bb4, N.Db5], chord4: [N.Gb4, N.Bb4, N.Db5] },
  { section: 'B', b1: N.Db2, b3: N.Ab1, b4: null, chord2: [N.F4, N.Ab4, N.Db5],  chord4: [N.F4, N.Ab4, N.Db5] },
  { section: 'B', b1: N.Ab1, b3: N.Cb2, b4: null, chord2: [N.Eb4, N.Gb4, N.Cb5], chord4: [N.Eb4, N.Gb4, N.Cb5] },
  { section: 'B', b1: N.Bb1, b3: N.F2,  b4: N.D2, chord2: [N.D4, N.F4, N.Ab4],   chord4: [N.D4, N.Ab4, N.Bb4] },
  { section: 'B', b1: N.Gb2, b3: N.Db2, b4: null, chord2: [N.Gb4, N.Bb4, N.Db5], chord4: [N.Gb4, N.Bb4, N.Db5] },
  { section: 'B', b1: N.Eb2, b3: N.Bb1, b4: null, chord2: [N.Eb4, N.Gb4, N.Bb4], chord4: [N.Eb4, N.Gb4, N.Bb4] },
  { section: 'B', b1: N.Cb2, b3: N.Gb2, b4: null, chord2: [N.Cb4, N.Eb4, N.A4],  chord4: [N.Cb4, N.Eb4, N.A4] },
  { section: 'B', b1: N.Bb1, b3: N.Bb1, b4: N.D2, chord2: [N.D4, N.F4, N.Ab4],   chord4: [N.D4, N.F4, N.Bb4] },
];

// Section A lead melody (64 eighth-note steps; null = rest).
// Opens with canonical Eb5-F5-Gb5-F5-Eb5-D5-Eb5-Bb4 motif from DESIGN.md 7.3.
const SECTION_A_MELODY = [
  // Bar 0 & 1: Eb5 - F5 - Gb5 - F5 | Eb5 - D5 - Eb5 - Bb4 (with playful staccato bounce)
  N.Eb5, N.F5,  N.Gb5, N.F5,  N.Eb5, N.D5,  N.Eb5, N.Bb4,
  N.Eb5, null,  N.Gb5, N.F5,  N.D5,  N.Eb5, N.F5,  null,
  // Bar 2 & 3: Abm -> Bb7 mischievous chromatic answer
  N.Ab4, N.Cb5, N.Eb5, N.Gb5, N.F5,  N.E5,  N.F5,  N.Ab5,
  N.G5,  N.F5,  N.Eb5, N.D5,  N.F5,  null,  N.Bb4, N.D5,
  // Bar 4 & 5: Higher celesta variation -> Cb major spooky lift
  N.Eb5, N.F5,  N.Gb5, N.Bb5, N.A5,  N.Bb5, N.Gb5, N.Eb5,
  N.Cb6, null,  N.Bb5, N.Ab5, N.Gb5, N.F5,  N.Eb5, null,
  // Bar 6 & 7: Fm7b5 -> Bb7 -> Ebm turnaround
  N.F5,  N.Ab5, N.Cb6, N.Ab5, N.G5,  N.F5,  N.D5,  N.Bb4,
  N.Eb5, null,  N.F5,  N.Gb5, N.G5,  N.Ab5, N.A5,  N.Bb5,
];

// Section B airy carnival flute melody + celesta sparkle (64 eighth-note steps).
const SECTION_B_FLUTE = [
  // Bar 8 & 9: Gb major -> Db major carnival soar
  N.Bb5, null,  N.Gb5, N.Ab5, N.Bb5, null,  N.Db6, null,
  N.C6,  N.Bb5, N.Ab5, null,  N.F5,  N.Ab5, N.Db6, null,
  // Bar 10 & 11: Abm/Cb -> Bb7 bright dance
  N.Cb6, N.Bb5, N.Ab5, N.Gb5, N.Eb5, N.Gb5, N.Ab5, N.Cb6,
  N.Bb5, null,  N.Ab5, N.G5,  N.F5,  null,  null,  null,
  // Bar 12 & 13: Gb major -> Ebm warm echo
  N.Db6, null,  N.Bb5, N.Gb5, N.Ab5, N.Bb5, N.Db6, N.Bb5,
  N.Eb6, null,  N.Bb5, N.Ab5, N.Gb5, null,  N.Eb5, null,
  // Bar 14 & 15: Cb7 -> Bb7 chromatic glockenspiel run back to Eb5
  N.Eb5, N.Gb5, N.A5,  N.Cb6, N.Bb5, N.A5,  N.Gb5, N.Eb5,
  N.D5,  null,  N.Bb4, N.C5,  N.Db5, N.D5,  N.F5,  N.D5,
];

const bellNoiseCache = new WeakMap();

function getSleighBellNoise(audioCtx) {
  let buf = bellNoiseCache.get(audioCtx);
  if (buf) return buf;
  const sr = audioCtx.sampleRate || 44100;
  const len = Math.floor(sr * 0.4);
  buf = audioCtx.createBuffer(1, len, sr);
  const ch = buf.getChannelData(0);
  let seed = 0x517cc1b7;
  for (let i = 0; i < len; i++) {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    ch[i] = (((t ^ (t >>> 14)) >>> 0) / 4294967296) * 2 - 1;
  }
  bellNoiseCache.set(audioCtx, buf);
  return buf;
}

function scheduleTuba(audioCtx, dest, freq, time, dur = 0.21, gain = 0.34) {
  const osc1 = audioCtx.createOscillator();
  const osc2 = audioCtx.createOscillator();
  const filter = audioCtx.createBiquadFilter();
  const env = audioCtx.createGain();

  osc1.type = 'triangle';
  osc2.type = 'sawtooth';
  osc1.frequency.setValueAtTime(freq, time);
  osc2.frequency.setValueAtTime(freq, time);

  filter.type = 'lowpass';
  filter.Q.setValueAtTime(1.8, time);
  filter.frequency.setValueAtTime(freq * 3.8, time);
  filter.frequency.exponentialRampToValueAtTime(Math.max(85, freq * 1.9), time + dur);

  const subMix = audioCtx.createGain();
  subMix.gain.setValueAtTime(0.38, time);

  env.gain.setValueAtTime(0.0001, time);
  env.gain.linearRampToValueAtTime(gain, time + 0.009);
  env.gain.exponentialRampToValueAtTime(0.0001, time + dur);

  osc1.connect(filter);
  osc2.connect(subMix);
  subMix.connect(filter);
  filter.connect(env);
  env.connect(dest);

  osc1.onended = () => {
    try {
      osc1.disconnect();
      osc2.disconnect();
      subMix.disconnect();
      filter.disconnect();
      env.disconnect();
    } catch (_) {
      // Ignore post-close disconnect errors.
    }
  };

  osc1.start(time);
  osc2.start(time);
  osc1.stop(time + dur + 0.01);
  osc2.stop(time + dur + 0.01);
}

function schedulePizzicatoChord(audioCtx, dest, midis, time, gain = 0.11) {
  midis.forEach((m, i) => {
    const t0 = time + i * 0.008;
    const freq = midiToHz(m);
    const osc = audioCtx.createOscillator();
    const filter = audioCtx.createBiquadFilter();
    const env = audioCtx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, t0);

    filter.type = 'lowpass';
    filter.Q.setValueAtTime(1.2, t0);
    filter.frequency.setValueAtTime(freq * 4.2, t0);
    filter.frequency.exponentialRampToValueAtTime(freq * 1.3, t0 + 0.115);

    env.gain.setValueAtTime(0.0001, t0);
    env.gain.linearRampToValueAtTime(gain, t0 + 0.004);
    env.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.125);

    osc.connect(filter);
    filter.connect(env);
    env.connect(dest);
    osc.onended = () => {
      try {
        osc.disconnect();
        filter.disconnect();
        env.disconnect();
      } catch (_) {
        // Ignore disconnect errors.
      }
    };
    osc.start(t0);
    osc.stop(t0 + 0.135);
  });
}

function scheduleCelestaAndClarinet(audioCtx, dest, midi, time, dur = 0.2, gain = 0.14) {
  const freq = midiToHz(midi);

  // 1) FM Celesta bell layer
  const cOsc = audioCtx.createOscillator();
  const mOsc = audioCtx.createOscillator();
  const mGain = audioCtx.createGain();
  const cEnv = audioCtx.createGain();

  cOsc.type = 'sine';
  mOsc.type = 'sine';
  cOsc.frequency.setValueAtTime(freq, time);
  mOsc.frequency.setValueAtTime(freq * 2.0, time);

  mGain.gain.setValueAtTime(freq * 0.65, time);
  mGain.gain.exponentialRampToValueAtTime(1.0, time + dur * 0.85);

  cEnv.gain.setValueAtTime(0.0001, time);
  cEnv.gain.linearRampToValueAtTime(gain, time + 0.005);
  cEnv.gain.exponentialRampToValueAtTime(0.0001, time + dur * 1.15);

  mOsc.connect(mGain);
  mGain.connect(cOsc.frequency);
  cOsc.connect(cEnv);
  cEnv.connect(dest);

  // 2) Staccato woodwind (clarinet) hollow square layer one octave below when high
  const wOsc = audioCtx.createOscillator();
  const wFilter = audioCtx.createBiquadFilter();
  const wEnv = audioCtx.createGain();
  const wFreq = midi >= 77 ? freq * 0.5 : freq;

  wOsc.type = 'square';
  wOsc.frequency.setValueAtTime(wFreq, time);

  wFilter.type = 'bandpass';
  wFilter.Q.setValueAtTime(1.6, time);
  wFilter.frequency.setValueAtTime(wFreq * 2.2, time);

  wEnv.gain.setValueAtTime(0.0001, time);
  wEnv.gain.linearRampToValueAtTime(gain * 0.55, time + 0.01);
  wEnv.gain.exponentialRampToValueAtTime(0.0001, time + dur * 0.82);

  wOsc.connect(wFilter);
  wFilter.connect(wEnv);
  wEnv.connect(dest);

  cOsc.onended = () => {
    try {
      mOsc.disconnect();
      mGain.disconnect();
      cOsc.disconnect();
      cEnv.disconnect();
    } catch (_) {
      // Ignore disconnect errors.
    }
  };
  wOsc.onended = () => {
    try {
      wOsc.disconnect();
      wFilter.disconnect();
      wEnv.disconnect();
    } catch (_) {
      // Ignore disconnect errors.
    }
  };

  mOsc.start(time);
  cOsc.start(time);
  wOsc.start(time);
  mOsc.stop(time + dur * 1.18);
  cOsc.stop(time + dur * 1.18);
  wOsc.stop(time + dur * 0.85);
}

function scheduleCarnivalFlute(audioCtx, dest, midi, time, dur = 0.36, gain = 0.15) {
  const freq = midiToHz(midi);
  const osc = audioCtx.createOscillator();
  const lfo = audioCtx.createOscillator();
  const lfoGain = audioCtx.createGain();
  const filter = audioCtx.createBiquadFilter();
  const env = audioCtx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(freq, time);

  lfo.type = 'sine';
  lfo.frequency.setValueAtTime(5.4, time);
  lfoGain.gain.setValueAtTime(freq * 0.008, time);

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(freq * 2.8, time);

  env.gain.setValueAtTime(0.0001, time);
  env.gain.linearRampToValueAtTime(gain, time + 0.028);
  env.gain.setValueAtTime(gain * 0.85, time + dur * 0.65);
  env.gain.exponentialRampToValueAtTime(0.0001, time + dur);

  lfo.connect(lfoGain);
  lfoGain.connect(osc.frequency);
  osc.connect(filter);
  filter.connect(env);
  env.connect(dest);

  osc.onended = () => {
    try {
      lfo.disconnect();
      lfoGain.disconnect();
      osc.disconnect();
      filter.disconnect();
      env.disconnect();
    } catch (_) {
      // Ignore disconnect errors.
    }
  };

  lfo.start(time);
  osc.start(time);
  lfo.stop(time + dur + 0.015);
  osc.stop(time + dur + 0.015);
}

function scheduleSleighBell(audioCtx, dest, time, accent = false) {
  const noiseBuf = getSleighBellNoise(audioCtx);
  const src = audioCtx.createBufferSource();
  src.buffer = noiseBuf;
  const hp = audioCtx.createBiquadFilter();
  hp.type = 'bandpass';
  hp.frequency.setValueAtTime(accent ? 7200 : 6400, time);
  hp.Q.setValueAtTime(2.6, time);

  const env = audioCtx.createGain();
  const peak = accent ? 0.065 : 0.036;
  env.gain.setValueAtTime(0.0001, time);
  env.gain.linearRampToValueAtTime(peak, time + 0.004);
  env.gain.exponentialRampToValueAtTime(0.0001, time + 0.085);

  src.connect(hp);
  hp.connect(env);
  env.connect(dest);
  src.onended = () => {
    try {
      src.disconnect();
      hp.disconnect();
      env.disconnect();
    } catch (_) {
      // Ignore disconnect errors.
    }
  };
  src.start(time, 0, 0.095);
}

export function createHalloweenBGM({ getContext, isUnlocked }) {
  let wanted = true;
  let muted = false;
  let ducked = false;

  let boundCtx = null;
  let mixGain = null;
  let duckGain = null;
  let muteGain = null;

  let stepIndex = 0;
  let nextNoteTime = 0;
  let timerId = null;

  function ensureGraph(audioCtx) {
    if (boundCtx === audioCtx && mixGain && duckGain && muteGain) {
      return mixGain;
    }
    boundCtx = audioCtx;
    mixGain = audioCtx.createGain();
    duckGain = audioCtx.createGain();
    muteGain = audioCtx.createGain();

    const now = audioCtx.currentTime;
    mixGain.gain.setValueAtTime(MIX_LEVEL, now);
    duckGain.gain.setValueAtTime(ducked ? DUCK_GAIN : 1.0, now);
    muteGain.gain.setValueAtTime(muted || !wanted ? 0.0 : 1.0, now);

    mixGain.connect(duckGain);
    duckGain.connect(muteGain);
    muteGain.connect(audioCtx.destination);
    return mixGain;
  }

  function scheduleStep(audioCtx, dest, step, time) {
    const barIdx = Math.floor(step / 8);
    const inBar = step % 8;
    const bar = BAR_CHART[barIdx];

    // Tuba oom-pah bass on beats 1 & 3 (+ turnaround pickup on step 6 when present)
    if (inBar === 0) {
      scheduleTuba(audioCtx, dest, midiToHz(bar.b1), time, 0.21, 0.34);
    } else if (inBar === 4) {
      scheduleTuba(audioCtx, dest, midiToHz(bar.b3), time, 0.2, 0.31);
    } else if (inBar === 6 && bar.b4 !== null) {
      scheduleTuba(audioCtx, dest, midiToHz(bar.b4), time, 0.16, 0.24);
    }

    // Off-beat pizzicato chords on beats 2 & 4
    if (inBar === 2) {
      schedulePizzicatoChord(audioCtx, dest, bar.chord2, time, 0.105);
    } else if (inBar === 6) {
      schedulePizzicatoChord(audioCtx, dest, bar.chord4, time, 0.105);
    }

    if (bar.section === 'A') {
      const mNote = SECTION_A_MELODY[step];
      if (mNote !== null && mNote !== undefined) {
        const nextNote = SECTION_A_MELODY[(step + 1) % 64];
        const dur = nextNote === null ? STEP_SEC * 1.45 : STEP_SEC * 0.86;
        scheduleCelestaAndClarinet(audioCtx, dest, mNote, time, dur, 0.145);
      }
    } else {
      // Section B carnival bridge: sleigh bells + airy flute + twinkling celesta arpeggio
      scheduleSleighBell(audioCtx, dest, time, inBar === 2 || inBar === 6);
      const bStep = step - 64;
      const fNote = SECTION_B_FLUTE[bStep];
      if (fNote !== null && fNote !== undefined) {
        const nextF = SECTION_B_FLUTE[(bStep + 1) % 64];
        const dur = nextF === null ? STEP_SEC * 1.75 : STEP_SEC * 0.95;
        scheduleCarnivalFlute(audioCtx, dest, fNote, time, dur, 0.155);
      }
      if (inBar % 2 === 1) {
        const arpPool = inBar < 4 ? bar.chord2 : bar.chord4;
        const arpMidi = arpPool[(inBar >> 1) % arpPool.length] + 12;
        scheduleCelestaAndClarinet(audioCtx, dest, arpMidi, time, STEP_SEC * 0.72, 0.075);
      }
    }
  }

  function pumpLookahead() {
    if (!wanted || muted) return;
    const audioCtx = getContext ? getContext() : null;
    if (!audioCtx || (isUnlocked && !isUnlocked()) || audioCtx.state !== 'running') {
      return;
    }
    const dest = ensureGraph(audioCtx);
    const now = audioCtx.currentTime;
    if (nextNoteTime < now - 0.05 || nextNoteTime === 0) {
      nextNoteTime = now + 0.025;
    }
    const horizon = now + 0.14;
    while (nextNoteTime < horizon) {
      scheduleStep(audioCtx, dest, stepIndex, nextNoteTime);
      nextNoteTime += STEP_SEC;
      stepIndex = (stepIndex + 1) % TOTAL_STEPS;
    }
  }

  function startSchedulerIfReady() {
    if (!wanted || muted) {
      stopScheduler();
      return;
    }
    const audioCtx = getContext ? getContext() : null;
    if (!audioCtx || audioCtx.state !== 'running') return;
    ensureGraph(audioCtx);
    if (muteGain) {
      const now = audioCtx.currentTime;
      muteGain.gain.cancelScheduledValues(now);
      muteGain.gain.setValueAtTime(muteGain.gain.value, now);
      muteGain.gain.linearRampToValueAtTime(1.0, now + 0.04);
    }
    pumpLookahead();
    if (timerId === null && typeof window !== 'undefined') {
      timerId = window.setInterval(pumpLookahead, 55);
    }
  }

  function stopScheduler() {
    if (timerId !== null && typeof window !== 'undefined') {
      window.clearInterval(timerId);
      timerId = null;
    }
    nextNoteTime = 0;
  }

  function applyMuteState() {
    const audioCtx = getContext ? getContext() : null;
    if (audioCtx && muteGain) {
      const now = audioCtx.currentTime;
      muteGain.gain.cancelScheduledValues(now);
      muteGain.gain.setValueAtTime(muteGain.gain.value, now);
      muteGain.gain.linearRampToValueAtTime(muted || !wanted ? 0.0 : 1.0, now + 0.03);
    }
    if (wanted && !muted) {
      startSchedulerIfReady();
    } else {
      stopScheduler();
    }
  }

  function setPlaying(playing) {
    wanted = Boolean(playing);
    applyMuteState();
  }

  function setMuted(isMutedFlag) {
    muted = Boolean(isMutedFlag);
    applyMuteState();
  }

  function setDucked(shouldDuck) {
    const nextDuck = Boolean(shouldDuck);
    if (ducked === nextDuck && !duckGain) {
      ducked = nextDuck;
      return;
    }
    ducked = nextDuck;
    const audioCtx = getContext ? getContext() : null;
    if (audioCtx && duckGain) {
      const now = audioCtx.currentTime;
      const target = ducked ? DUCK_GAIN : 1.0;
      const rampSec = ducked ? DUCK_ATTACK_SEC : DUCK_RELEASE_SEC;
      duckGain.gain.cancelScheduledValues(now);
      duckGain.gain.setValueAtTime(duckGain.gain.value, now);
      duckGain.gain.linearRampToValueAtTime(target, now + rampSec);
    }
  }

  function onUnlock() {
    startSchedulerIfReady();
  }

  function update() {
    if (wanted && !muted) {
      pumpLookahead();
    }
  }

  function isPlaying() {
    const unlockedNow = isUnlocked ? Boolean(isUnlocked()) : true;
    return Boolean(wanted && !muted && unlockedNow);
  }

  function isDucked() {
    return Boolean(ducked && wanted && !muted);
  }

  function getGain() {
    if (!wanted || muted) return 0;
    return ducked ? DUCK_GAIN : 1.0;
  }

  function isMuted() {
    return muted;
  }

  return {
    setPlaying,
    setMuted,
    setDucked,
    onUnlock,
    update,
    isPlaying,
    isDucked,
    getGain,
    isMuted,
  };
}
