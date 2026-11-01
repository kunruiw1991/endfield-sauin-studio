// Studio Mood preview, commit/rollback ledger, and branching ending resolver
// per docs/DESIGN.md §4.2, §4.3, §6.1 & §6.2 (owner: mechanics).

import { createEmptyMoods, ENDING_THRESHOLD, MOOD_KEYS, MOOD_MAX } from '../levels/constants.js';
import { ENDINGS, resolveEnding, resolveEndingId } from '../levels/endings_data.js';
import { getTake, TAKES } from '../levels/takes_matrix.js';

export function normalizeMoods(raw) {
  const out = createEmptyMoods();
  if (!raw || typeof raw !== 'object') return out;
  for (let i = 0; i < MOOD_KEYS.length; i++) {
    const key = MOOD_KEYS[i];
    const v = Number(raw[key]);
    out[key] = Number.isFinite(v) ? Math.max(0, v) : 0;
  }
  return out;
}

export function clampMoodDisplay(moods, max = MOOD_MAX) {
  const out = createEmptyMoods();
  const cap = Number.isFinite(Number(max)) ? Number(max) : MOOD_MAX;
  for (let i = 0; i < MOOD_KEYS.length; i++) {
    const key = MOOD_KEYS[i];
    const v = Number(moods?.[key]) || 0;
    out[key] = Math.min(cap, Math.max(0, v));
  }
  return out;
}

export function addMoods(a, b) {
  const out = createEmptyMoods();
  for (let i = 0; i < MOOD_KEYS.length; i++) {
    const key = MOOD_KEYS[i];
    out[key] = Math.max(0, (Number(a?.[key]) || 0) + (Number(b?.[key]) || 0));
  }
  return out;
}

export function sumActChoices(actChoices, baseline = null) {
  let totals = normalizeMoods(baseline);
  if (!actChoices || typeof actChoices !== 'object') {
    return totals;
  }
  const keys = Object.keys(actChoices).sort((x, y) => Number(x) - Number(y));
  for (let i = 0; i < keys.length; i++) {
    const choice = actChoices[keys[i]];
    if (choice && choice.delta) {
      totals = addMoods(totals, choice.delta);
    }
  }
  return totals;
}

export function lookupTakeForPair(ctx, actId, actorId, propId) {
  if (!actId || !actorId || !propId) return null;
  if (typeof ctx?.levels?.getTake === 'function') {
    const hit = ctx.levels.getTake(actId, actorId, propId);
    if (hit) return hit;
  }
  const direct = getTake(actId, actorId, propId);
  if (direct) return direct;

  const customTakes = ctx?.levels?.TAKES || ctx?.levels?.takes || TAKES;
  if (customTakes && typeof customTakes === 'object') {
    const list = Array.isArray(customTakes) ? customTakes : Object.values(customTakes);
    return (
      list.find(
        (t) =>
          t &&
          Number(t.actId) === Number(actId) &&
          t.actorId === actorId &&
          t.propId === propId
      ) || null
    );
  }
  return null;
}

export function resolveEndingRecord(ctx, moods) {
  const normalized = normalizeMoods(moods);
  if (typeof ctx?.levels?.resolveEnding === 'function') {
    const resolved = ctx.levels.resolveEnding(normalized);
    if (resolved) return resolved;
  }
  const endingId = resolveEndingId(normalized);
  const map = ctx?.levels?.ENDINGS || ctx?.levels?.endings || ENDINGS;
  return (map && map[endingId]) || resolveEnding(normalized);
}

export function createMoodEngine(ctx) {
  let baselineMoods = createEmptyMoods();

  function emitPreviewUpdate() {
    ctx?.events?.emit?.('moodPreviewUpdated', {
      committed: { ...ctx.state.moods },
      displayCommitted: clampMoodDisplay(ctx.state.moods, MOOD_MAX),
      previewDelta: { ...ctx.state.previewDelta },
      threshold: ENDING_THRESHOLD,
    });
  }

  function recomputeCommitted({ emitEvent = true } = {}) {
    ctx.state.moods = sumActChoices(ctx.state.actChoices, baselineMoods);
    if (emitEvent) {
      emitPreviewUpdate();
    }
    return { ...ctx.state.moods };
  }

  function resetMoods({ emitEvent = true } = {}) {
    baselineMoods = createEmptyMoods();
    ctx.state.actChoices = {};
    ctx.state.moods = createEmptyMoods();
    ctx.state.previewDelta = createEmptyMoods();
    if (emitEvent) {
      emitPreviewUpdate();
    }
  }

  function syncPreview({ emitEvent = true } = {}) {
    const state = ctx.state;
    const { actorId, propId } = state.slots || {};
    if (state.phase === 'blocking' && actorId && propId) {
      const take = lookupTakeForPair(ctx, state.actId, actorId, propId);
      state.previewDelta = take ? normalizeMoods(take.moodDelta) : createEmptyMoods();
    } else {
      state.previewDelta = createEmptyMoods();
    }
    if (emitEvent) {
      emitPreviewUpdate();
    }
    return { ...state.previewDelta };
  }

  function commitActTake(actId, take) {
    const delta = normalizeMoods(take?.moodDelta);
    ctx.state.actChoices[Number(actId)] = {
      actorId: take.actorId,
      propId: take.propId,
      takeId: take.takeId,
      delta,
    };
    ctx.state.previewDelta = createEmptyMoods();
    return recomputeCommitted({ emitEvent: true });
  }

  function rollbackActChoice(actId) {
    delete ctx.state.actChoices[Number(actId)];
    ctx.state.previewDelta = createEmptyMoods();
    return recomputeCommitted({ emitEvent: true });
  }

  function pruneChoicesFromAct(startActId, { keepMoods = true } = {}) {
    if (!keepMoods) {
      resetMoods({ emitEvent: true });
      return { ...ctx.state.moods };
    }
    const existingKeys = Object.keys(ctx.state.actChoices || {});
    const hasManualMoods = MOOD_KEYS.some((k) => (Number(ctx.state.moods?.[k]) || 0) > 0);
    if (existingKeys.length === 0 && hasManualMoods) {
      baselineMoods = normalizeMoods(ctx.state.moods);
    } else {
      for (let i = 0; i < existingKeys.length; i++) {
        const k = existingKeys[i];
        if (Number(k) >= Number(startActId)) {
          delete ctx.state.actChoices[k];
        }
      }
    }
    ctx.state.previewDelta = createEmptyMoods();
    return recomputeCommitted({ emitEvent: true });
  }

  function resolveFinalEnding() {
    const totals = recomputeCommitted({ emitEvent: false });
    const ending = resolveEndingRecord(ctx, totals);
    return { ending, totals };
  }

  return {
    recomputeCommitted,
    resetMoods,
    syncPreview,
    commitActTake,
    rollbackActChoice,
    pruneChoicesFromAct,
    resolveFinalEnding,
    clampMoodDisplay,
  };
}
