// Safe localStorage['endfield_sauin_v1'] persistence manager (owner: core).

export const STORAGE_KEY = 'endfield_sauin_v1';

function createDefaultRecord() {
  return {
    v: 1,
    runsCompleted: 0,
    unlockedTakes: [],
    unlockedEndings: [],
    claimedCommissions: [],
    oroberyl: 0,
    tCreds: 0,
    audio: {
      bgmMuted: false,
      voMuted: false,
      sfxMuted: false,
    },
  };
}

function uniqueStringList(arr) {
  if (!Array.isArray(arr)) return [];
  const seen = new Set();
  const out = [];
  for (let i = 0; i < arr.length; i++) {
    const v = arr[i];
    if (typeof v === 'string' && v.length > 0 && !seen.has(v)) {
      seen.add(v);
      out.push(v);
    }
  }
  return out;
}

function clampNonNegInt(n, fallback = 0) {
  const v = Number(n);
  if (!Number.isFinite(v)) return fallback;
  return Math.max(0, Math.floor(v));
}

function normalizeAudio(raw, baseAudio) {
  const base = baseAudio || { bgmMuted: false, voMuted: false, sfxMuted: false };
  if (!raw || typeof raw !== 'object') {
    return { ...base };
  }
  const bgmMuted =
    typeof raw.bgmMuted === 'boolean'
      ? raw.bgmMuted
      : typeof raw.bgm === 'boolean'
        ? raw.bgm
        : base.bgmMuted;
  const voMuted =
    typeof raw.voMuted === 'boolean'
      ? raw.voMuted
      : typeof raw.vo === 'boolean'
        ? raw.vo
        : base.voMuted;
  const sfxMuted =
    typeof raw.sfxMuted === 'boolean'
      ? raw.sfxMuted
      : typeof raw.sfx === 'boolean'
        ? raw.sfx
        : base.sfxMuted;
  return {
    bgmMuted: Boolean(bgmMuted),
    voMuted: Boolean(voMuted),
    sfxMuted: Boolean(sfxMuted),
  };
}

function normalizeRecord(raw, fallbackRecord = createDefaultRecord()) {
  const base = fallbackRecord || createDefaultRecord();
  if (!raw || typeof raw !== 'object') {
    return structuredCloneRecord(base);
  }
  const srcProgress = raw.progress && typeof raw.progress === 'object' ? raw.progress : raw;
  const hasRuns = srcProgress.runsCompleted !== undefined;
  const hasTakes = Array.isArray(srcProgress.unlockedTakes);
  const hasEndings = Array.isArray(srcProgress.unlockedEndings);
  const hasClaims = Array.isArray(srcProgress.claimedCommissions);
  const hasOro = srcProgress.oroberyl !== undefined;
  const hasCreds = srcProgress.tCreds !== undefined;

  const audioSrc = raw.audio && typeof raw.audio === 'object' ? raw.audio : raw;
  return {
    v: 1,
    runsCompleted: hasRuns ? clampNonNegInt(srcProgress.runsCompleted, base.runsCompleted) : base.runsCompleted,
    unlockedTakes: hasTakes ? uniqueStringList(srcProgress.unlockedTakes) : [...base.unlockedTakes],
    unlockedEndings: hasEndings ? uniqueStringList(srcProgress.unlockedEndings) : [...base.unlockedEndings],
    claimedCommissions: hasClaims ? uniqueStringList(srcProgress.claimedCommissions) : [...base.claimedCommissions],
    oroberyl: hasOro ? clampNonNegInt(srcProgress.oroberyl, base.oroberyl) : base.oroberyl,
    tCreds: hasCreds ? clampNonNegInt(srcProgress.tCreds, base.tCreds) : base.tCreds,
    audio: normalizeAudio(audioSrc, base.audio),
  };
}

function structuredCloneRecord(rec) {
  return {
    v: 1,
    runsCompleted: rec.runsCompleted,
    unlockedTakes: [...rec.unlockedTakes],
    unlockedEndings: [...rec.unlockedEndings],
    claimedCommissions: [...rec.claimedCommissions],
    oroberyl: rec.oroberyl,
    tCreds: rec.tCreds,
    audio: { ...rec.audio },
  };
}

export function createPersistence(storageKey = STORAGE_KEY) {
  let memoryCache = createDefaultRecord();
  let boundState = null;

  function readRawStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(storageKey);
        return { ok: true, value: raw ? JSON.parse(raw) : null };
      }
      return { ok: false, value: null };
    } catch (_err) {
      // Gracefully fall back to in-memory record on private mode / quota / disabled storage.
      return { ok: false, value: null };
    }
  }

  function writeRawStorage(record) {
    memoryCache = structuredCloneRecord(record);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(storageKey, JSON.stringify(memoryCache));
      }
    } catch (_err) {
      // Ignore quota / security errors while retaining memoryCache for session stability.
    }
    return structuredCloneRecord(memoryCache);
  }

  function bindState(state) {
    boundState = state;
  }

  function load() {
    const res = readRawStorage();
    if (res.ok) {
      memoryCache = res.value
        ? normalizeRecord(res.value, createDefaultRecord())
        : createDefaultRecord();
    }
    return structuredCloneRecord(memoryCache);
  }

  function syncIfCleared(targetState = boundState) {
    const res = readRawStorage();
    if (res.ok && res.value === null) {
      memoryCache = createDefaultRecord();
      if (targetState && targetState.progress) {
        targetState.progress.runsCompleted = 0;
        targetState.progress.unlockedTakes = [];
        targetState.progress.unlockedEndings = [];
        targetState.progress.claimedCommissions = [];
        targetState.progress.oroberyl = 0;
        targetState.progress.tCreds = 0;
      }
    }
  }

  function save(partialOrState) {
    const current = load();
    let source = partialOrState;
    if (!source && boundState) {
      source = boundState.progress;
    }
    const merged = normalizeRecord(source || {}, current);
    return writeRawStorage(merged);
  }

  function saveProgress(progressObj) {
    return save(progressObj || (boundState ? boundState.progress : {}));
  }

  function saveAudio(audioSettings) {
    const current = load();
    current.audio = normalizeAudio(audioSettings, current.audio);
    return writeRawStorage(current);
  }

  function loadAudio() {
    const rec = load();
    return { ...rec.audio };
  }

  function applyToState(targetState = boundState) {
    const rec = load();
    if (targetState && targetState.progress) {
      targetState.progress.runsCompleted = rec.runsCompleted;
      targetState.progress.unlockedTakes = [...rec.unlockedTakes];
      targetState.progress.unlockedEndings = [...rec.unlockedEndings];
      targetState.progress.claimedCommissions = [...rec.claimedCommissions];
      targetState.progress.oroberyl = rec.oroberyl;
      targetState.progress.tCreds = rec.tCreds;
    }
    return rec;
  }

  function reset({ alsoResetState = true } = {}) {
    memoryCache = createDefaultRecord();
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(storageKey);
      }
    } catch (_err) {
      // Ignore storage access errors.
    }
    if (alsoResetState && boundState && boundState.progress) {
      boundState.progress.runsCompleted = 0;
      boundState.progress.unlockedTakes = [];
      boundState.progress.unlockedEndings = [];
      boundState.progress.claimedCommissions = [];
      boundState.progress.oroberyl = 0;
      boundState.progress.tCreds = 0;
    }
    return structuredCloneRecord(memoryCache);
  }

  return {
    key: storageKey,
    bindState,
    load,
    save,
    saveProgress,
    saveAudio,
    loadAudio,
    applyToState,
    syncIfCleared,
    reset,
    clear: reset,
  };
}
