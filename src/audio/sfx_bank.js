/**
 * Procedural WebAudio Theatrical Sound Effects Bank (18 named effects).
 * Owner: audio-vo
 *
 * Uses a private deterministic noise buffer (never touches ctx.rng) and
 * auto-disconnects every transient WebAudio node on completion so zero
 * graph leaks occur across repeated takes and reshoots.
 */

export const SFX_NAMES = Object.freeze([
  'ui_click',
  'tab_flip',
  'curtain_swish',
  'clapper_snap',
  'card_pickup',
  'slot_snap',
  'slot_clear',
  'camera_whir',
  'shutter_flash',
  'mood_up_1',
  'mood_up_2',
  'gag_pop',
  'firework_burst',
  'steak_sizzle',
  'frog_ribbit',
  'sword_ring',
  'ending_fanfare',
  'reward_chime',
]);

const noiseCache = new WeakMap();

function getDeterministicNoiseBuffer(audioCtx) {
  let buf = noiseCache.get(audioCtx);
  if (buf) return buf;
  const sampleRate = audioCtx.sampleRate || 44100;
  const length = Math.floor(sampleRate * 1.2);
  buf = audioCtx.createBuffer(1, length, sampleRate);
  const data = buf.getChannelData(0);
  // Private mulberry32 PRNG so ctx.rng is never touched.
  let seed = 0x9e3779b9;
  for (let i = 0; i < length; i++) {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    const u = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    data[i] = u * 2 - 1;
  }
  noiseCache.set(audioCtx, buf);
  return buf;
}

function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

function spawnTone(audioCtx, dest, {
  type = 'triangle',
  f0 = 440,
  f1 = null,
  start = 0,
  attack = 0.004,
  dur = 0.12,
  gain = 0.18,
  expRamp = true,
}) {
  const osc = audioCtx.createOscillator();
  const env = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(Math.max(20, f0), start);
  if (f1 !== null && f1 !== f0) {
    if (expRamp && f0 > 20 && f1 > 20) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, f1), start + dur);
    } else {
      osc.frequency.linearRampToValueAtTime(Math.max(20, f1), start + dur);
    }
  }
  const peak = Math.max(0.0002, gain);
  env.gain.setValueAtTime(0.0001, start);
  env.gain.linearRampToValueAtTime(peak, start + Math.min(attack, dur * 0.45));
  env.gain.exponentialRampToValueAtTime(0.0001, start + dur);

  osc.connect(env);
  env.connect(dest);
  osc.onended = () => {
    try {
      osc.disconnect();
      env.disconnect();
    } catch (_) {
      // Ignore post-close disconnect errors.
    }
  };
  osc.start(start);
  osc.stop(start + dur + 0.01);
}

function spawnNoise(audioCtx, dest, noiseBuf, {
  filterType = 'bandpass',
  f0 = 1200,
  f1 = null,
  q = 1.4,
  start = 0,
  offset = 0,
  attack = 0.005,
  dur = 0.12,
  gain = 0.16,
}) {
  const src = audioCtx.createBufferSource();
  src.buffer = noiseBuf;
  const filter = audioCtx.createBiquadFilter();
  filter.type = filterType;
  filter.Q.setValueAtTime(q, start);
  filter.frequency.setValueAtTime(Math.max(40, f0), start);
  if (f1 !== null && f1 !== f0) {
    filter.frequency.exponentialRampToValueAtTime(Math.max(40, f1), start + dur);
  }
  const env = audioCtx.createGain();
  const peak = Math.max(0.0002, gain);
  env.gain.setValueAtTime(0.0001, start);
  env.gain.linearRampToValueAtTime(peak, start + Math.min(attack, dur * 0.45));
  env.gain.exponentialRampToValueAtTime(0.0001, start + dur);

  src.connect(filter);
  filter.connect(env);
  env.connect(dest);
  src.onended = () => {
    try {
      src.disconnect();
      filter.disconnect();
      env.disconnect();
    } catch (_) {
      // Ignore post-close disconnect errors.
    }
  };
  const safeOffset = clamp(offset, 0, Math.max(0, noiseBuf.duration - dur - 0.02));
  src.start(start, safeOffset, Math.min(dur + 0.015, noiseBuf.duration - safeOffset));
}

function spawnFmBell(audioCtx, dest, {
  carrier = 622.25,
  ratio = 2.0,
  modIndex = 220,
  start = 0,
  dur = 0.28,
  gain = 0.16,
}) {
  const cOsc = audioCtx.createOscillator();
  const mOsc = audioCtx.createOscillator();
  const mGain = audioCtx.createGain();
  const env = audioCtx.createGain();

  cOsc.type = 'sine';
  mOsc.type = 'sine';
  cOsc.frequency.setValueAtTime(carrier, start);
  mOsc.frequency.setValueAtTime(carrier * ratio, start);

  mGain.gain.setValueAtTime(Math.max(1, modIndex), start);
  mGain.gain.exponentialRampToValueAtTime(0.5, start + dur * 0.85);

  const peak = Math.max(0.0002, gain);
  env.gain.setValueAtTime(0.0001, start);
  env.gain.linearRampToValueAtTime(peak, start + 0.005);
  env.gain.exponentialRampToValueAtTime(0.0001, start + dur);

  mOsc.connect(mGain);
  mGain.connect(cOsc.frequency);
  cOsc.connect(env);
  env.connect(dest);

  cOsc.onended = () => {
    try {
      mOsc.disconnect();
      mGain.disconnect();
      cOsc.disconnect();
      env.disconnect();
    } catch (_) {
      // Ignore disconnect errors.
    }
  };
  mOsc.start(start);
  cOsc.start(start);
  mOsc.stop(start + dur + 0.01);
  cOsc.stop(start + dur + 0.01);
}

const SFX_RECIPES = {
  ui_click(audioCtx, dest, now, p, v, noise) {
    spawnTone(audioCtx, dest, {
      type: 'triangle',
      f0: 920 * p,
      f1: 440 * p,
      start: now,
      attack: 0.002,
      dur: 0.042,
      gain: 0.18 * v,
    });
    spawnNoise(audioCtx, dest, noise, {
      filterType: 'bandpass',
      f0: 2400 * p,
      q: 2.2,
      start: now,
      dur: 0.022,
      gain: 0.09 * v,
    });
  },

  tab_flip(audioCtx, dest, now, p, v, noise) {
    spawnNoise(audioCtx, dest, noise, {
      filterType: 'bandpass',
      f0: 1350 * p,
      f1: 3300 * p,
      q: 1.5,
      start: now,
      attack: 0.008,
      dur: 0.085,
      gain: 0.16 * v,
    });
    spawnTone(audioCtx, dest, {
      type: 'sine',
      f0: 540 * p,
      f1: 810 * p,
      start: now + 0.015,
      attack: 0.003,
      dur: 0.055,
      gain: 0.11 * v,
    });
  },

  curtain_swish(audioCtx, dest, now, p, v, noise) {
    spawnNoise(audioCtx, dest, noise, {
      filterType: 'bandpass',
      f0: 340 * p,
      f1: 1180 * p,
      q: 0.95,
      start: now,
      attack: 0.06,
      dur: 0.34,
      gain: 0.2 * v,
    });
    spawnNoise(audioCtx, dest, noise, {
      filterType: 'highpass',
      f0: 2600 * p,
      f1: 1800 * p,
      q: 0.8,
      start: now + 0.04,
      offset: 0.15,
      attack: 0.05,
      dur: 0.26,
      gain: 0.06 * v,
    });
  },

  clapper_snap(audioCtx, dest, now, p, v, noise) {
    // Maple clapperboard sharp transient crack + hollow wooden body resonance.
    spawnNoise(audioCtx, dest, noise, {
      filterType: 'bandpass',
      f0: 2100 * p,
      f1: 1200 * p,
      q: 1.3,
      start: now,
      attack: 0.001,
      dur: 0.045,
      gain: 0.34 * v,
    });
    spawnTone(audioCtx, dest, {
      type: 'triangle',
      f0: 620 * p,
      f1: 245 * p,
      start: now,
      attack: 0.001,
      dur: 0.095,
      gain: 0.28 * v,
    });
    spawnTone(audioCtx, dest, {
      type: 'square',
      f0: 1180 * p,
      f1: 520 * p,
      start: now,
      attack: 0.001,
      dur: 0.038,
      gain: 0.12 * v,
    });
  },

  card_pickup(audioCtx, dest, now, p, v, noise) {
    spawnTone(audioCtx, dest, {
      type: 'triangle',
      f0: 392 * p,
      f1: 622.25 * p,
      start: now,
      attack: 0.003,
      dur: 0.075,
      gain: 0.17 * v,
    });
    spawnNoise(audioCtx, dest, noise, {
      filterType: 'bandpass',
      f0: 1900 * p,
      q: 1.8,
      start: now,
      dur: 0.035,
      gain: 0.07 * v,
    });
  },

  slot_snap(audioCtx, dest, now, p, v) {
    spawnTone(audioCtx, dest, {
      type: 'sine',
      f0: 210 * p,
      f1: 130 * p,
      start: now,
      attack: 0.002,
      dur: 0.07,
      gain: 0.2 * v,
    });
    spawnFmBell(audioCtx, dest, {
      carrier: 523.25 * p,
      ratio: 2,
      modIndex: 140,
      start: now + 0.008,
      dur: 0.12,
      gain: 0.15 * v,
    });
    spawnFmBell(audioCtx, dest, {
      carrier: 783.99 * p,
      ratio: 2,
      modIndex: 160,
      start: now + 0.048,
      dur: 0.16,
      gain: 0.17 * v,
    });
  },

  slot_clear(audioCtx, dest, now, p, v, noise) {
    spawnTone(audioCtx, dest, {
      type: 'triangle',
      f0: 587.33 * p,
      f1: 311.13 * p,
      start: now,
      attack: 0.003,
      dur: 0.095,
      gain: 0.17 * v,
    });
    spawnNoise(audioCtx, dest, noise, {
      filterType: 'bandpass',
      f0: 1500 * p,
      f1: 800 * p,
      q: 1.4,
      start: now,
      dur: 0.06,
      gain: 0.08 * v,
    });
  },

  camera_whir(audioCtx, dest, now, p, v, noise) {
    // 35mm film reel motor hum + rhythmic sprocket clicks.
    spawnTone(audioCtx, dest, {
      type: 'sawtooth',
      f0: 138 * p,
      f1: 164 * p,
      start: now,
      attack: 0.04,
      dur: 0.44,
      gain: 0.07 * v,
    });
    for (let i = 0; i < 8; i++) {
      const t = now + i * 0.052;
      spawnNoise(audioCtx, dest, noise, {
        filterType: 'bandpass',
        f0: (2400 + (i % 2) * 320) * p,
        q: 3.0,
        start: t,
        offset: i * 0.07,
        attack: 0.001,
        dur: 0.022,
        gain: 0.11 * v,
      });
    }
  },

  shutter_flash(audioCtx, dest, now, p, v, noise) {
    // Twin mechanical mirror clicks + magnesium bulb shimmer.
    spawnNoise(audioCtx, dest, noise, {
      filterType: 'bandpass',
      f0: 2800 * p,
      q: 2.0,
      start: now,
      attack: 0.001,
      dur: 0.026,
      gain: 0.24 * v,
    });
    spawnNoise(audioCtx, dest, noise, {
      filterType: 'bandpass',
      f0: 2100 * p,
      q: 2.0,
      start: now + 0.032,
      offset: 0.09,
      attack: 0.001,
      dur: 0.03,
      gain: 0.22 * v,
    });
    spawnFmBell(audioCtx, dest, {
      carrier: 1396.91 * p,
      ratio: 2.5,
      modIndex: 260,
      start: now + 0.015,
      dur: 0.26,
      gain: 0.14 * v,
    });
  },

  mood_up_1(audioCtx, dest, now, p, v) {
    const notes = [622.25, 932.33]; // Eb5 -> Bb5
    notes.forEach((n, idx) => {
      spawnFmBell(audioCtx, dest, {
        carrier: n * p,
        ratio: 2.0,
        modIndex: 180,
        start: now + idx * 0.065,
        dur: 0.24,
        gain: 0.17 * v,
      });
    });
  },

  mood_up_2(audioCtx, dest, now, p, v) {
    const notes = [622.25, 783.99, 932.33, 1244.51]; // Eb5 -> G5 -> Bb5 -> Eb6
    notes.forEach((n, idx) => {
      spawnFmBell(audioCtx, dest, {
        carrier: n * p,
        ratio: 2.0,
        modIndex: 210,
        start: now + idx * 0.055,
        dur: 0.28,
        gain: (0.15 + idx * 0.015) * v,
      });
    });
  },

  gag_pop(audioCtx, dest, now, p, v) {
    spawnTone(audioCtx, dest, {
      type: 'sine',
      f0: 260 * p,
      f1: 790 * p,
      start: now,
      attack: 0.003,
      dur: 0.075,
      gain: 0.23 * v,
    });
    spawnFmBell(audioCtx, dest, {
      carrier: 1567.98 * p,
      ratio: 2.0,
      modIndex: 150,
      start: now + 0.055,
      dur: 0.18,
      gain: 0.13 * v,
    });
  },

  firework_burst(audioCtx, dest, now, p, v, noise) {
    // Rising sky-rocket whistle -> low thump -> crackle stars.
    spawnTone(audioCtx, dest, {
      type: 'sine',
      f0: 520 * p,
      f1: 1760 * p,
      start: now,
      attack: 0.01,
      dur: 0.16,
      gain: 0.15 * v,
    });
    spawnTone(audioCtx, dest, {
      type: 'triangle',
      f0: 145 * p,
      f1: 46 * p,
      start: now + 0.15,
      attack: 0.002,
      dur: 0.22,
      gain: 0.28 * v,
    });
    for (let i = 0; i < 5; i++) {
      spawnNoise(audioCtx, dest, noise, {
        filterType: 'highpass',
        f0: (2800 + i * 500) * p,
        q: 1.2,
        start: now + 0.16 + i * 0.045,
        offset: 0.2 + i * 0.11,
        attack: 0.002,
        dur: 0.09,
        gain: (0.16 - i * 0.02) * v,
      });
    }
  },

  steak_sizzle(audioCtx, dest, now, p, v, noise) {
    spawnNoise(audioCtx, dest, noise, {
      filterType: 'bandpass',
      f0: 3200 * p,
      f1: 4800 * p,
      q: 0.9,
      start: now,
      attack: 0.015,
      dur: 0.42,
      gain: 0.2 * v,
    });
    for (let i = 0; i < 4; i++) {
      spawnNoise(audioCtx, dest, noise, {
        filterType: 'highpass',
        f0: 5200 * p,
        q: 1.5,
        start: now + 0.04 + i * 0.08,
        offset: 0.35 + i * 0.08,
        attack: 0.002,
        dur: 0.045,
        gain: 0.12 * v,
      });
    }
  },

  frog_ribbit(audioCtx, dest, now, p, v) {
    // Two-pulse Lankybeast croak ("rib-bit!").
    const pulses = [
      { dt: 0, f0: 155 * p, f1: 270 * p, dur: 0.085 },
      { dt: 0.105, f0: 175 * p, f1: 320 * p, dur: 0.12 },
    ];
    for (const pulse of pulses) {
      const osc = audioCtx.createOscillator();
      const filter = audioCtx.createBiquadFilter();
      const env = audioCtx.createGain();
      const t0 = now + pulse.dt;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(pulse.f0, t0);
      osc.frequency.exponentialRampToValueAtTime(pulse.f1, t0 + pulse.dur);

      filter.type = 'bandpass';
      filter.Q.setValueAtTime(4.2, t0);
      filter.frequency.setValueAtTime(pulse.f0 * 3.2, t0);
      filter.frequency.exponentialRampToValueAtTime(pulse.f1 * 3.8, t0 + pulse.dur);

      env.gain.setValueAtTime(0.0001, t0);
      env.gain.linearRampToValueAtTime(0.24 * v, t0 + 0.012);
      env.gain.exponentialRampToValueAtTime(0.0001, t0 + pulse.dur);

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
      osc.stop(t0 + pulse.dur + 0.01);
    }
  },

  sword_ring(audioCtx, dest, now, p, v, noise) {
    spawnNoise(audioCtx, dest, noise, {
      filterType: 'highpass',
      f0: 2900 * p,
      f1: 5400 * p,
      q: 1.6,
      start: now,
      attack: 0.004,
      dur: 0.075,
      gain: 0.18 * v,
    });
    const partials = [1479.98, 2217.46, 3729.31];
    partials.forEach((freq, i) => {
      spawnFmBell(audioCtx, dest, {
        carrier: freq * p,
        ratio: 1.414,
        modIndex: 180 - i * 40,
        start: now + 0.01,
        dur: 0.46 - i * 0.08,
        gain: (0.14 - i * 0.03) * v,
      });
    });
  },

  ending_fanfare(audioCtx, dest, now, p, v, noise) {
    // Theatrical curtain-call brass & celesta cadence in Eb/Gb/Bb -> Eb major lift.
    const steps = [
      { t: 0.0, freqs: [311.13, 466.16, 622.25], dur: 0.16 },
      { t: 0.16, freqs: [392.0, 587.33, 783.99], dur: 0.16 },
      { t: 0.32, freqs: [466.16, 698.46, 932.33], dur: 0.18 },
      { t: 0.50, freqs: [311.13, 622.25, 783.99, 932.33, 1244.51], dur: 0.52 },
    ];
    for (const s of steps) {
      for (const f of s.freqs) {
        spawnTone(audioCtx, dest, {
          type: 'triangle',
          f0: f * p,
          start: now + s.t,
          attack: 0.012,
          dur: s.dur,
          gain: 0.11 * v,
        });
        if (f >= 600) {
          spawnFmBell(audioCtx, dest, {
            carrier: f * p,
            ratio: 2.0,
            modIndex: 150,
            start: now + s.t,
            dur: s.dur * 0.95,
            gain: 0.08 * v,
          });
        }
      }
    }
    spawnNoise(audioCtx, dest, noise, {
      filterType: 'highpass',
      f0: 4800 * p,
      q: 0.7,
      start: now + 0.5,
      offset: 0.5,
      attack: 0.01,
      dur: 0.42,
      gain: 0.08 * v,
    });
  },

  reward_chime(audioCtx, dest, now, p, v) {
    // Endfield Oroberyl crystalline arpeggio.
    const notes = [932.33, 1244.51, 1396.91, 1864.66]; // Bb5 -> Eb6 -> F6 -> Bb6
    notes.forEach((n, idx) => {
      spawnFmBell(audioCtx, dest, {
        carrier: n * p,
        ratio: 2.0,
        modIndex: 190,
        start: now + idx * 0.055,
        dur: 0.32,
        gain: 0.15 * v,
      });
    });
  },
};

export function createSfxBank({ getContext, isUnlocked, isMuted }) {
  let playedCount = 0;
  let busNode = null;
  let busCtx = null;

  function ensureBus(audioCtx) {
    if (busNode && busCtx === audioCtx) return busNode;
    busCtx = audioCtx;
    busNode = audioCtx.createGain();
    busNode.gain.setValueAtTime(0.85, audioCtx.currentTime);
    busNode.connect(audioCtx.destination);
    return busNode;
  }

  function play(name, opts = {}) {
    const recipe = SFX_RECIPES[name];
    if (!recipe) return false;
    if (isMuted && isMuted()) return false;

    playedCount += 1;

    const audioCtx = getContext ? getContext() : null;
    if (!audioCtx || (isUnlocked && !isUnlocked()) || audioCtx.state !== 'running') {
      return true;
    }

    const pitch = clamp(Number.isFinite(opts.pitch) ? opts.pitch : 1.0, 0.5, 2.0);
    const vol = clamp(Number.isFinite(opts.vol) ? opts.vol : 1.0, 0.05, 1.5);
    const dest = ensureBus(audioCtx);
    const noise = getDeterministicNoiseBuffer(audioCtx);
    const now = audioCtx.currentTime + 0.002;

    try {
      recipe(audioCtx, dest, now, pitch, vol, noise);
    } catch (_) {
      // Guard against rare suspended/closed WebAudio races.
    }
    return true;
  }

  function getPlayedCount() {
    return playedCount;
  }

  return {
    play,
    getPlayedCount,
    names: SFX_NAMES,
  };
}
