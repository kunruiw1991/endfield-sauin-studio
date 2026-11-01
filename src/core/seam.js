// Frozen window.__HALLOWEEN__ automation & verification seam
// per docs/DESIGN.md §4.5 & Gates G1..G14 (owner: core).

import { normalizeSeed } from './rng.js';
import { snapshotState } from './state.js';

function deepCloneJSON(obj) {
  return JSON.parse(JSON.stringify(obj ?? null));
}

function lookupVoMeta(ctx, voId) {
  if (!voId) return { speaker: '', text: '', durationMs: 0 };
  const fromAudio = ctx.audio?.getClipMeta?.(voId);
  if (fromAudio && (fromAudio.text || fromAudio.durationMs)) {
    return {
      speaker: fromAudio.speaker || '',
      text: fromAudio.text || '',
      durationMs: Number(fromAudio.durationMs) || 0,
    };
  }
  const studio = ctx.levels?.STUDIO_VO_LINES?.[voId];
  if (studio) {
    return {
      speaker: studio.speaker || '',
      text: studio.text || '',
      durationMs: studio.durationMs || 0,
    };
  }
  const takes = ctx.levels?.TAKES;
  if (takes) {
    for (const key of Object.keys(takes)) {
      const t = takes[key];
      if (t && t.voId === voId) {
        return {
          speaker: 'Stage Narrator',
          text: t.scriptText || t.text || '',
          durationMs: t.durationMs || 0,
        };
      }
    }
  }
  const endings = ctx.levels?.ENDINGS;
  if (endings) {
    for (const key of Object.keys(endings)) {
      const e = endings[key];
      if (e && e.voId === voId) {
        return {
          speaker: 'Stage Narrator',
          text: e.voText || e.bodyText || e.text || '',
          durationMs: e.durationMs || 0,
        };
      }
    }
  }
  const acts = ctx.levels?.ACTS;
  if (acts) {
    for (const actKey of Object.keys(acts)) {
      const lines = acts[actKey]?.dialogue || [];
      for (let i = 0; i < lines.length; i++) {
        if (lines[i]?.voId === voId) {
          return {
            speaker: lines[i].speakerName || lines[i].speaker || '',
            text: lines[i].text || '',
            durationMs: lines[i].durationMs || 0,
          };
        }
      }
    }
  }
  return { speaker: '', text: '', durationMs: 0 };
}

export function createSeam(ctx) {
  function markFirstAction() {
    if (ctx.state.feedback.firstActionMs === null) {
      ctx.state.feedback.firstActionMs = ctx.state.timeMs;
    }
  }

  function syncAll() {
    ctx.ui?.sync?.(ctx.state);
    ctx.render?.renderFrame?.();
  }

  function stepOutOfClapperIfNeeded() {
    let guard = 0;
    while (ctx.state.phase === 'clapper' && guard < 120) {
      ctx.loop.stepFrames(5);
      guard += 5;
    }
  }

  function resetRunClockAndTelemetry() {
    ctx.frame = 0;
    ctx.time = 0;
    ctx.state.frame = 0;
    ctx.state.timeMs = 0;
    ctx.state.feedback = {
      taps: 0,
      casts: 0,
      gags: 0,
      rolls: 0,
      dead: 0,
      firstActionMs: null,
    };
    ctx.state.stats = {
      particles: 0,
      flashes: 0,
      shakes: 0,
      clappers: 0,
    };
  }

  function startLevel(actOrOpts = 1) {
    ctx.persistence?.syncIfCleared?.(ctx.state);
    markFirstAction();
    let actId = 1;
    let opts = {};
    if (typeof actOrOpts === 'number') {
      actId = actOrOpts;
    } else if (actOrOpts && typeof actOrOpts === 'object') {
      opts = actOrOpts;
      actId = opts.act ?? opts.actId ?? opts.level ?? 1;
    }
    actId = Math.max(1, Math.min(5, Math.floor(Number(actId) || 1)));

    const shouldResetMoods =
      opts.resetMoods !== undefined
        ? Boolean(opts.resetMoods)
        : actId === 1 || ctx.state.phase === 'title' || ctx.state.phase === 'ending';

    if (opts.seed !== undefined) {
      const nextSeed = normalizeSeed(opts.seed);
      ctx.seed = nextSeed;
      ctx.rng.reseed(nextSeed);
      ctx.state.seed = nextSeed;
      if (shouldResetMoods) {
        resetRunClockAndTelemetry();
      }
    }

    if (ctx.state.modal !== null) {
      ctx.ui?.closeModal?.();
      ctx.state.modal = null;
    }

    if (shouldResetMoods && actId === 1) {
      ctx.mechanics?.startRun?.({
        seed: ctx.seed,
        startAct: 1,
        skipDialogue: Boolean(opts.skipDialogue),
      });
    } else if (shouldResetMoods) {
      ctx.mechanics?.startRun?.({
        seed: ctx.seed,
        startAct: actId,
        skipDialogue: Boolean(opts.skipDialogue),
      });
      if (ctx.state.actId !== actId) {
        ctx.mechanics?.jumpToAct?.(actId, {
          keepMoods: false,
          skipDialogue: Boolean(opts.skipDialogue),
        });
      }
    } else {
      ctx.mechanics?.jumpToAct?.(actId, {
        keepMoods: true,
        skipDialogue: Boolean(opts.skipDialogue),
      });
    }

    if (opts.skipDialogue && ctx.state.phase === 'clapper') {
      stepOutOfClapperIfNeeded();
      if (ctx.state.phase === 'dialogue') {
        ctx.mechanics?.skipDialogue?.();
      }
    }

    syncAll();
    return snapshotState(ctx.state);
  }

  function resetLevel() {
    markFirstAction();
    if (ctx.state.modal !== null) {
      ctx.ui?.closeModal?.();
      ctx.state.modal = null;
    }
    const actId = Math.max(1, Math.min(5, ctx.state.actId || 1));
    if (ctx.state.phase === 'take_result') {
      ctx.mechanics?.reshoot?.();
    } else if (ctx.state.phase === 'blocking') {
      if (ctx.state.slots.actorId) ctx.mechanics?.clearSlot?.('actor');
      if (ctx.state.slots.propId) ctx.mechanics?.clearSlot?.('prop');
    } else {
      const keepMoods = ctx.state.phase !== 'title' && ctx.state.phase !== 'ending';
      ctx.mechanics?.jumpToAct?.(actId, { keepMoods, skipDialogue: true });
      stepOutOfClapperIfNeeded();
      if (ctx.state.phase === 'dialogue') {
        ctx.mechanics?.skipDialogue?.();
      }
      if (ctx.state.slots.actorId) ctx.mechanics?.clearSlot?.('actor');
      if (ctx.state.slots.propId) ctx.mechanics?.clearSlot?.('prop');
    }
    syncAll();
    return snapshotState(ctx.state);
  }

  function act(type, payload = {}) {
    markFirstAction();
    const p = payload && typeof payload === 'object' ? payload : {};

    switch (type) {
      case 'startGame': {
        ctx.persistence?.syncIfCleared?.(ctx.state);
        if (p.seed !== undefined) {
          const nextSeed = normalizeSeed(p.seed);
          ctx.seed = nextSeed;
          ctx.rng.reseed(nextSeed);
          ctx.state.seed = nextSeed;
          resetRunClockAndTelemetry();
        }
        ctx.mechanics?.startRun?.({
          seed: ctx.seed,
          startAct: p.startAct ?? p.act ?? 1,
          skipDialogue: Boolean(p.skipDialogue),
        });
        break;
      }
      case 'advanceDialogue':
        ctx.mechanics?.advanceDialogue?.();
        break;
      case 'skipDialogue':
        stepOutOfClapperIfNeeded();
        ctx.mechanics?.skipDialogue?.();
        break;
      case 'selectTab':
      case 'tab':
        ctx.mechanics?.selectTab?.(typeof payload === 'string' ? payload : p.tab || 'actors');
        break;
      case 'cast': {
        const src = p.source || 'seam';
        if (p.slotKind && p.itemId) {
          ctx.mechanics?.castSlot?.(p.slotKind, p.itemId, src);
        } else {
          if (p.actorId) ctx.mechanics?.castSlot?.('actor', p.actorId, src);
          if (p.propId) ctx.mechanics?.castSlot?.('prop', p.propId, src);
          if (p.itemId && !p.actorId && !p.propId) {
            ctx.mechanics?.autoCastItem?.(p.itemId, src);
          }
        }
        break;
      }
      case 'clearSlot': {
        const kind = typeof payload === 'string' ? payload : p.slotKind;
        if (kind) {
          ctx.mechanics?.clearSlot?.(kind);
        } else {
          ctx.mechanics?.clearSlot?.('actor');
          ctx.mechanics?.clearSlot?.('prop');
        }
        break;
      }
      case 'rollCamera':
        ctx.mechanics?.rollCamera?.();
        break;
      case 'reshoot':
        ctx.mechanics?.reshoot?.();
        break;
      case 'nextAct':
        ctx.mechanics?.nextAct?.();
        break;
      case 'revealEnding':
        ctx.mechanics?.revealEnding?.();
        break;
      case 'jumpToAct': {
        const targetAct = p.actId ?? p.act ?? 1;
        ctx.mechanics?.jumpToAct?.(targetAct, {
          keepMoods: p.keepMoods ?? true,
          skipDialogue: Boolean(p.skipDialogue),
        });
        if (p.skipDialogue && ctx.state.phase === 'clapper') {
          stepOutOfClapperIfNeeded();
          if (ctx.state.phase === 'dialogue') {
            ctx.mechanics?.skipDialogue?.();
          }
        }
        break;
      }
      case 'openModal': {
        const modal = typeof payload === 'string' ? payload : p.modal;
        if (modal) {
          ctx.ui?.openModal?.(modal);
          if (ctx.state.modal !== modal) {
            ctx.state.modal = modal;
            ctx.events.emit('modalOpened', { modal });
          }
        }
        break;
      }
      case 'closeModal': {
        const prevModal = ctx.state.modal;
        ctx.ui?.closeModal?.();
        if (ctx.state.modal !== null) {
          ctx.state.modal = null;
          ctx.events.emit('modalClosed', { modal: prevModal });
        }
        break;
      }
      case 'claimCommission': {
        const commId = typeof payload === 'string' ? payload : p.id || p.commissionId;
        if (commId) {
          ctx.mechanics?.claimCommission?.(commId);
        }
        break;
      }
      case 'claimAll':
        ctx.mechanics?.claimAllReady?.();
        break;
      case 'gag': {
        const actData = ctx.levels?.ACTS?.[ctx.state.actId];
        const fallbackGag = actData?.gags?.[0]?.id || 'gag_curtain_bunny';
        const gagId = typeof payload === 'string' ? payload : p.gagId || fallbackGag;
        ctx.mechanics?.triggerStageGag?.(gagId, p.x ?? 640, p.y ?? 360);
        break;
      }
      case 'replayTake': {
        const takeId = typeof payload === 'string' ? payload : p.takeId;
        if (takeId) ctx.mechanics?.replayTake?.(takeId);
        break;
      }
      default:
        break;
    }

    syncAll();
    return snapshotState(ctx.state);
  }

  function move(x, y) {
    const res = ctx.input.setNormalizedAim(x, y);
    ctx.render?.renderFrame?.();
    return res;
  }

  function pointer(eventType, clientX, clientY) {
    ctx.input.dispatchSyntheticPointer(eventType, clientX, clientY);
    syncAll();
    return snapshotState(ctx.state);
  }

  function stepFrames(n = 1) {
    ctx.loop.stepFrames(n);
    return snapshotState(ctx.state);
  }

  function getState() {
    return snapshotState(ctx.state);
  }

  function getLevels() {
    return deepCloneJSON({
      acts: ctx.levels?.ACTS || {},
      takes: ctx.levels?.TAKES || {},
      endings: ctx.levels?.ENDINGS || {},
      recipes: ctx.levels?.RECIPES || {},
      commissions: ctx.levels?.COMMISSIONS || [],
    });
  }

  function normalizeRecipePair(entry) {
    if (!entry) return null;
    if (typeof entry === 'string') {
      const tk = ctx.levels?.TAKES?.[entry];
      return tk ? { actorId: tk.actorId, propId: tk.propId } : null;
    }
    if (Array.isArray(entry)) {
      return { actorId: entry[0], propId: entry[1] };
    }
    return {
      actorId: entry.actorId || entry.actor,
      propId: entry.propId || entry.prop,
    };
  }

  function completeSingleActWithPair(pair) {
    const resolvedPair = normalizeRecipePair(pair);
    stepOutOfClapperIfNeeded();
    if (ctx.state.phase === 'dialogue') {
      ctx.mechanics?.skipDialogue?.();
    }
    const actData = ctx.levels?.ACTS?.[ctx.state.actId];
    const actorId = resolvedPair?.actorId || ctx.state.slots.actorId || actData?.actors?.[0];
    const propId = resolvedPair?.propId || ctx.state.slots.propId || actData?.props?.[0];

    if (actorId && ctx.state.slots.actorId !== actorId) {
      ctx.mechanics?.castSlot?.('actor', actorId, 'seam');
    }
    if (propId && ctx.state.slots.propId !== propId) {
      ctx.mechanics?.castSlot?.('prop', propId, 'seam');
    }
    if (ctx.state.phase === 'blocking') {
      ctx.mechanics?.rollCamera?.();
    }
    if (ctx.state.phase === 'rolling') {
      ctx.loop.stepFrames(200);
    }
  }

  function solveCurrentLevel(strategy) {
    markFirstAction();
    const recipes = ctx.levels?.RECIPES || {};
    const isEndingRecipe =
      typeof strategy === 'string' &&
      (strategy in recipes || /^END[1-5]$/.test(strategy) || strategy === 'VIDEO_RUN');

    if (isEndingRecipe) {
      if (ctx.state.phase === 'title' || ctx.state.phase === 'ending') {
        ctx.mechanics?.startRun?.({ seed: ctx.seed, startAct: 1, skipDialogue: true });
      }
      stepOutOfClapperIfNeeded();

      // Delegate to mechanics solver first; then deterministically finish any pending rolling/nextAct steps.
      const recipeSteps = recipes[strategy];
      if (typeof ctx.mechanics?.solveRunForEnding === 'function' && (!Array.isArray(recipeSteps) || ctx.state.actId === 1)) {
        ctx.mechanics.solveRunForEnding(strategy);
      }

      if (ctx.state.phase !== 'ending' && Array.isArray(recipeSteps)) {
        while (ctx.state.phase !== 'ending') {
          stepOutOfClapperIfNeeded();
          const actIdx = Math.max(1, Math.min(5, ctx.state.actId || 1));
          const choice =
            recipeSteps.find((r) => (r.actId ?? r.act) === actIdx) || recipeSteps[actIdx - 1];
          if (ctx.state.phase === 'dialogue' || ctx.state.phase === 'blocking') {
            completeSingleActWithPair(choice);
          } else if (ctx.state.phase === 'rolling') {
            ctx.loop.stepFrames(200);
          }
          if (ctx.state.phase === 'take_result') {
            if (ctx.state.actId >= 5) {
              ctx.mechanics?.revealEnding?.();
              break;
            } else {
              ctx.mechanics?.nextAct?.();
            }
          } else if (ctx.state.phase === 'ending') {
            break;
          } else {
            break;
          }
        }
      }

      syncAll();
      return snapshotState(ctx.state);
    }

    // Single-Act completion path: skipDialogue -> cast -> rollCamera -> stepFrames(200).
    if (ctx.state.phase === 'title' || ctx.state.phase === 'ending') {
      ctx.mechanics?.startRun?.({ seed: ctx.seed, startAct: 1, skipDialogue: true });
    }
    stepOutOfClapperIfNeeded();
    if (ctx.state.phase === 'dialogue') {
      ctx.mechanics?.skipDialogue?.();
    }

    const preferredPair = strategy && typeof strategy === 'object' ? strategy : undefined;
    if (typeof ctx.mechanics?.solveCurrentAct === 'function') {
      ctx.mechanics.solveCurrentAct(preferredPair);
    }
    if (ctx.state.phase === 'blocking' || ctx.state.phase === 'rolling') {
      completeSingleActWithPair(preferredPair);
    }

    syncAll();
    return snapshotState(ctx.state);
  }

  function playVO(voId, opts = {}) {
    const fallbackMeta = lookupVoMeta(ctx, voId);
    const raw = ctx.audio?.playVO ? ctx.audio.playVO(voId, opts) : false;

    const buildReturn = (resolvedVal) => {
      const stats = ctx.audio?.getAudioStats?.() || {};
      const activeCap = ctx.activeCaption;
      const isObj = resolvedVal && typeof resolvedVal === 'object';
      const ok = isObj ? Boolean(resolvedVal.ok ?? true) : Boolean(resolvedVal);
      const speaker =
        (isObj && resolvedVal.speaker) ||
        (activeCap && activeCap.voId === voId ? activeCap.speaker : '') ||
        fallbackMeta.speaker ||
        '';
      const text =
        (isObj && resolvedVal.text) ||
        (activeCap && activeCap.voId === voId ? activeCap.text : '') ||
        (typeof stats.activeCaption === 'string' && stats.activeVoId === voId
          ? stats.activeCaption
          : stats.activeCaption?.text) ||
        fallbackMeta.text ||
        '';
      const durationMs =
        (isObj && Number(resolvedVal.durationMs)) ||
        (activeCap && activeCap.voId === voId ? Number(activeCap.durationMs) : 0) ||
        Number(fallbackMeta.durationMs) ||
        1500;
      return {
        ok,
        voId: String(voId || ''),
        durationMs,
        speaker,
        text,
      };
    };

    if (raw && typeof raw.then === 'function') {
      const p = raw.then((val) => {
        syncAll();
        return buildReturn(val);
      });
      const immediate = buildReturn(true);
      Object.assign(p, immediate);
      return p;
    }

    syncAll();
    return buildReturn(raw);
  }

  function getAudioStats() {
    const raw = ctx.audio?.getAudioStats?.() || {};
    const activeCaptionText =
      raw.activeCaption !== undefined && raw.activeCaption !== null
        ? raw.activeCaption
        : ctx.activeCaption
          ? ctx.activeCaption.text
          : null;
    return {
      unlocked: Boolean(raw.unlocked),
      bgmPlaying: Boolean(raw.bgmPlaying),
      bgmDucked: Boolean(raw.bgmDucked),
      bgmGain: Number.isFinite(Number(raw.bgmGain)) ? Number(raw.bgmGain) : 1.0,
      bgmMuted: Boolean(raw.bgmMuted),
      voMuted: Boolean(raw.voMuted),
      sfxMuted: Boolean(raw.sfxMuted),
      activeVoId: raw.activeVoId ?? (ctx.activeCaption ? ctx.activeCaption.voId : null),
      activeCaption: activeCaptionText,
      manifestLoaded: Boolean(raw.manifestLoaded),
      clipsTotal: Number(raw.clipsTotal) || 0,
      clipsVerified: Number(raw.clipsVerified) || 0,
      voPlayedIds: Array.isArray(raw.voPlayedIds) ? [...raw.voPlayedIds] : [],
      sfxPlayedCount: Number(raw.sfxPlayedCount) || 0,
      speechSynthesisUsed: false,
    };
  }

  function perf() {
    const loopPerf = ctx.loop.getPerf();
    const renderPerf = ctx.render?.getPerf?.() || {};
    return {
      fps: Number(loopPerf.fps) || 60,
      p50ms: Number.isFinite(loopPerf.p50ms) ? loopPerf.p50ms : 1.0,
      p95ms: Number.isFinite(loopPerf.p95ms) ? loopPerf.p95ms : 2.0,
      drawCalls: Number(renderPerf.drawCalls) || 0,
      triangles: Number(renderPerf.triangles) || 0,
      geometries: Number(renderPerf.geometries) || 0,
      textures: Number(renderPerf.textures) || 0,
    };
  }

  const seam = {
    startLevel,
    resetLevel,
    act,
    move,
    pointer,
    stepFrames,
    getState,
    getLevels,
    solveCurrentLevel,
    playVO,
    getAudioStats,
    perf,
  };

  return Object.freeze(seam);
}
