// Deterministic seeded mulberry32 PRNG for New Era for the Myriad Souls (owner: core).

export const DEFAULT_SEED = 20261031;

export function normalizeSeed(seed) {
  if (typeof seed === 'number' && Number.isFinite(seed)) {
    const u = seed >>> 0;
    return u === 0 ? DEFAULT_SEED : u;
  }
  if (typeof seed === 'string' && seed.trim().length > 0) {
    const trimmed = seed.trim();
    const numeric = Number(trimmed);
    if (Number.isFinite(numeric)) {
      const u = numeric >>> 0;
      return u === 0 ? DEFAULT_SEED : u;
    }
    let h = 2166136261 >>> 0;
    for (let i = 0; i < trimmed.length; i++) {
      h ^= trimmed.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h === 0 ? DEFAULT_SEED : (h >>> 0);
  }
  return DEFAULT_SEED;
}

export function mulberry32(initialSeed = DEFAULT_SEED) {
  let state = normalizeSeed(initialSeed);

  function next() {
    state = (state + 0x6D2B79F5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  function range(min = 0, max = 1) {
    const a = Number(min) || 0;
    const b = Number.isFinite(Number(max)) ? Number(max) : 1;
    return a + (b - a) * next();
  }

  function int(min, max) {
    const lo = Math.ceil(Math.min(min, max));
    const hi = Math.floor(Math.max(min, max));
    if (!Number.isFinite(lo) || !Number.isFinite(hi)) return 0;
    if (hi <= lo) return lo;
    return lo + Math.floor(next() * (hi - lo + 1));
  }

  function pick(arr) {
    if (!Array.isArray(arr) || arr.length === 0) return undefined;
    return arr[Math.floor(next() * arr.length)];
  }

  function reseed(newSeed) {
    state = normalizeSeed(newSeed);
    return state;
  }

  function getState() {
    return state >>> 0;
  }

  function setState(savedState) {
    state = Number(savedState) >>> 0;
    return state;
  }

  return {
    next,
    range,
    int,
    pick,
    reseed,
    getState,
    setState,
  };
}

export const createRng = mulberry32;
