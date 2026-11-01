// Canonical state initializer, resetter, deep snapshot cloner, and live CJK detector
// per docs/DESIGN.md §4.3 & Gate G9 (owner: core).

import { DEFAULT_SEED, normalizeSeed } from './rng.js';

const HANZI_REGEX = /[\u4e00-\u9fff]/g;

// Registry of strings drawn onto <canvas> textures (portraits, props, ending Polaroids)
// so computeHanziCount() verifies both visible DOM text and offscreen/WebGL canvas labels.
const canvasTextRegistry = new Map();
const seenAutoCanvasStrings = new Set();
let autoCanvasId = 0;
let canvasHooksInstalled = false;

export function registerCanvasText(keyOrText, maybeText) {
  if (maybeText === undefined) {
    if (typeof keyOrText === 'string' && keyOrText.length > 0 && !seenAutoCanvasStrings.has(keyOrText)) {
      if (seenAutoCanvasStrings.size < 4096) {
        seenAutoCanvasStrings.add(keyOrText);
        autoCanvasId += 1;
        canvasTextRegistry.set(`auto_${autoCanvasId}`, keyOrText);
      }
    }
    return;
  }
  const key = String(keyOrText);
  if (maybeText === null || maybeText === '') {
    canvasTextRegistry.delete(key);
  } else {
    canvasTextRegistry.set(key, String(maybeText));
  }
}

export function installCanvasTextAuditHook() {
  if (canvasHooksInstalled || typeof window === 'undefined') return;
  canvasHooksInstalled = true;
  const patchProto = (proto) => {
    if (!proto) return;
    for (const method of ['fillText', 'strokeText']) {
      const orig = proto[method];
      if (typeof orig === 'function' && !orig.__sauinWrapped) {
        const wrapped = function patchedCanvasText(text, ...rest) {
          if (typeof text === 'string' && text.length > 0) {
            registerCanvasText(text);
          }
          return orig.call(this, text, ...rest);
        };
        wrapped.__sauinWrapped = true;
        proto[method] = wrapped;
      }
    }
  };
  try {
    patchProto(window.CanvasRenderingContext2D && window.CanvasRenderingContext2D.prototype);
    if (typeof window.OffscreenCanvasRenderingContext2D !== 'undefined') {
      patchProto(window.OffscreenCanvasRenderingContext2D.prototype);
    }
  } catch (_err) {
    // Ignore prototype instrumentation issues in restricted environments.
  }
}

installCanvasTextAuditHook();

export function clearCanvasTextRegistry() {
  canvasTextRegistry.clear();
  seenAutoCanvasStrings.clear();
  autoCanvasId = 0;
}

export function getRegisteredCanvasTexts() {
  return Array.from(canvasTextRegistry.values());
}

function countHanziInString(str) {
  if (typeof str !== 'string' || str.length === 0) return 0;
  const matches = str.match(HANZI_REGEX);
  return matches ? matches.length : 0;
}

export function computeHanziCount() {
  let total = 0;
  if (typeof document !== 'undefined') {
    const titleStr = document.title || '';
    total += countHanziInString(titleStr);
    if (document.body) {
      const domText =
        typeof document.body.innerText === 'string'
          ? document.body.innerText
          : document.body.textContent || '';
      total += countHanziInString(domText);
    }
  }
  for (const text of canvasTextRegistry.values()) {
    total += countHanziInString(text);
  }
  if (typeof window !== 'undefined' && Array.isArray(window.__HALLOWEEN_CANVAS_LABELS__)) {
    for (let i = 0; i < window.__HALLOWEEN_CANVAS_LABELS__.length; i++) {
      total += countHanziInString(String(window.__HALLOWEEN_CANVAS_LABELS__[i] || ''));
    }
  }
  return total;
}

function buildInitialDialogue(acts, actId = 1) {
  const act = acts && acts[actId];
  const lines = act && Array.isArray(act.dialogue) ? act.dialogue : null;
  if (lines && lines.length > 0) {
    const first = lines[0];
    return {
      index: 0,
      total: lines.length,
      speaker: first.speakerName || first.speaker || 'Mysterious Sarkaz',
      text: first.text || '',
      voId: first.voId || 'vo_s1_dlg_1',
    };
  }
  return {
    index: 0,
    total: 6,
    speaker: 'Mysterious Sarkaz',
    text: 'O most noble Sarkaz Princess! Where walk the Myriad Souls, Sauin must follow to guide them home—two halves bound by fate, forever inseparable!',
    voId: 'vo_s1_dlg_1',
  };
}

function buildInitialSlots(acts, actId = 1) {
  const act = acts && acts[actId];
  return {
    actorId: null,
    propId: null,
    leftKind: act?.leftSlotKind || (actId <= 3 ? 'prop' : 'actor'),
    rightKind: act?.rightSlotKind || (actId <= 3 ? 'actor' : 'prop'),
  };
}

export function createInitialState(seed = DEFAULT_SEED, acts = null) {
  const normalized = normalizeSeed(seed);
  return {
    v: 1,
    seed: normalized,
    frame: 0,
    timeMs: 0,
    phase: 'title',
    actId: 1,
    dialogue: buildInitialDialogue(acts, 1),
    activeTab: 'actors',
    slots: buildInitialSlots(acts, 1),
    moods: { love: 0, joy: 0, wonder: 0, chaos: 0 },
    previewDelta: { love: 0, joy: 0, wonder: 0, chaos: 0 },
    actChoices: {},
    currentTake: null,
    currentEnding: null,
    modal: null,
    tutorialStep: 0,
    progress: {
      runsCompleted: 0,
      unlockedTakes: [],
      unlockedEndings: [],
      claimedCommissions: [],
      oroberyl: 0,
      tCreds: 0,
    },
    feedback: {
      taps: 0,
      casts: 0,
      gags: 0,
      rolls: 0,
      dead: 0,
      firstActionMs: null,
    },
    stats: {
      particles: 0,
      flashes: 0,
      shakes: 0,
      clappers: 0,
    },
    hanziCount: 0,
  };
}

export function resetRunState(
  state,
  { seed = undefined, actId = 1, keepProgress = true, resetTelemetry = false, acts = null } = {}
) {
  if (seed !== undefined) {
    state.seed = normalizeSeed(seed);
  }
  state.phase = 'title';
  state.actId = actId;
  state.dialogue = buildInitialDialogue(acts, actId);
  state.activeTab = 'actors';
  state.slots = buildInitialSlots(acts, actId);
  state.moods = { love: 0, joy: 0, wonder: 0, chaos: 0 };
  state.previewDelta = { love: 0, joy: 0, wonder: 0, chaos: 0 };
  state.actChoices = {};
  state.currentTake = null;
  state.currentEnding = null;
  state.modal = null;
  state.tutorialStep = 0;

  if (!keepProgress) {
    state.progress = {
      runsCompleted: 0,
      unlockedTakes: [],
      unlockedEndings: [],
      claimedCommissions: [],
      oroberyl: 0,
      tCreds: 0,
    };
  }
  if (resetTelemetry) {
    state.frame = 0;
    state.timeMs = 0;
    state.feedback = {
      taps: 0,
      casts: 0,
      gags: 0,
      rolls: 0,
      dead: 0,
      firstActionMs: null,
    };
    state.stats = {
      particles: 0,
      flashes: 0,
      shakes: 0,
      clappers: 0,
    };
  }
  state.hanziCount = computeHanziCount();
  return state;
}

export function snapshotState(state) {
  state.hanziCount = computeHanziCount();
  return JSON.parse(JSON.stringify(state));
}
