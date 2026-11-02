// Deterministic 5-Act Filmmaking Finite State Machine & Main Mechanics Entry
// per docs/DESIGN.md §4.1–§4.5, §5, §6, §7 & Gates G1..G14 (owner: mechanics).

import { getGagById } from '../levels/acts_data.js';
import { getCharacter } from '../levels/cast_catalog.js';
import { CLAPPER_DURATION, PHASES } from '../levels/constants.js';
import { getTakeById } from '../levels/takes_matrix.js';
import { createCastingController, resolveActRecord } from './casting.js';
import { createCommissionsManager } from './commissions_mgr.js';
import { createMoodEngine, lookupTakeForPair } from './mood_engine.js';
import { createSolver } from './solver.js';
import { createStageChoreo } from './stage_choreo.js';

function clampActId(actId) {
  const n = Math.floor(Number(actId) || 1);
  return Math.max(1, Math.min(5, n));
}

function normalizeSeedUint32(seed, fallback = 20261031) {
  const n = Number(seed);
  if (Number.isFinite(n)) {
    const u = n >>> 0;
    return u === 0 ? fallback : u;
  }
  return fallback >>> 0;
}

function normalizeDialogueLine(ctx, rawLine, index) {
  if (!rawLine) return null;
  const speakerId = rawLine.speakerId || rawLine.characterId || 'sarkaz_director';
  const charMeta =
    ctx?.levels?.getCharacter?.(speakerId) ||
    ctx?.levels?.CHARACTERS?.[speakerId] ||
    getCharacter(speakerId);
  const speakerName =
    rawLine.speakerName || rawLine.speaker || charMeta?.name || 'Sarkaz Director';
  const portraitMood = rawLine.portraitMood || rawLine.mood || 'neutral';
  const text = rawLine.text || '';
  const voId = rawLine.voId || null;

  return {
    index,
    speakerId,
    speakerName,
    speaker: speakerName,
    portraitMood,
    text,
    voId,
  };
}

export function createMechanics(ctx) {
  let api = null;

  function emit(type, payload) {
    ctx?.events?.emit?.(type, payload);
  }

  function emitReplayVo(voId, { force = true, unmute = true } = {}) {
    if (!voId) return false;
    const shouldUnmute = Boolean(unmute);
    if (shouldUnmute) {
      ctx.audio?.unlock?.();
      if (ctx.audio?.getAudioStats?.()?.voMuted) {
        ctx.audio?.setMuted?.({ vo: false });
      }
    }
    emit('voPlay', {
      voId,
      force: Boolean(force),
      unmute: shouldUnmute,
    });
    return true;
  }

  function recordInteraction(kind = 'ui', x = 0, y = 0) {
    const fb = ctx.state.feedback;
    if (fb.firstActionMs === null) {
      fb.firstActionMs = Number.isFinite(ctx.state.timeMs)
        ? ctx.state.timeMs
        : Math.round((ctx.time || 0) * 1000);
    }
    fb.taps = (fb.taps || 0) + 1;
    if (kind === 'cast') {
      fb.casts = (fb.casts || 0) + 1;
    } else if (kind === 'gag') {
      fb.gags = (fb.gags || 0) + 1;
    } else if (kind === 'roll') {
      fb.rolls = (fb.rolls || 0) + 1;
    }
    emit('feedback', {
      kind,
      x: Number(x) || 0,
      y: Number(y) || 0,
    });
  }

  function setPhase(nextPhase, { forceEmit = false } = {}) {
    const prev = ctx.state.phase;
    ctx.state.phase = nextPhase;
    if (prev !== nextPhase || forceEmit) {
      emit('phaseChange', {
        from: prev,
        to: nextPhase,
        actId: ctx.state.actId,
      });
    }
  }

  const moodEngine = createMoodEngine(ctx);
  const choreo = createStageChoreo(ctx);
  const commissions = createCommissionsManager(ctx, { recordInteraction });

  function ensureBlockingForSeam() {
    if (ctx.state.phase === PHASES.CLAPPER || ctx.state.phase === PHASES.DIALOGUE) {
      choreo.cancelAll();
      emit('dialogueSkipped', { actId: ctx.state.actId });
      enterBlocking({ playTutorialVo: false });
    }
  }

  const casting = createCastingController(ctx, {
    moodEngine,
    recordInteraction,
    ensureBlockingForSeam,
  });

  function populateDialoguePreview(actId, lineIndex = 0) {
    const act = resolveActRecord(ctx, actId);
    const lines = Array.isArray(act?.dialogue) ? act.dialogue : [];
    if (lines.length === 0) {
      ctx.state.dialogue = {
        index: 0,
        total: 0,
        speakerId: 'sarkaz_director',
        speaker: 'Sarkaz Director',
        speakerName: 'Sarkaz Director',
        portraitMood: 'neutral',
        text: '',
        voId: null,
      };
      return null;
    }
    const clampedIdx = Math.max(0, Math.min(lines.length - 1, lineIndex));
    const line = normalizeDialogueLine(ctx, lines[clampedIdx], clampedIdx);
    ctx.state.dialogue = {
      index: clampedIdx,
      total: lines.length,
      speakerId: line.speakerId,
      speaker: line.speakerName,
      speakerName: line.speakerName,
      portraitMood: line.portraitMood,
      text: line.text,
      voId: line.voId,
    };
    return { line, total: lines.length };
  }

  function enterDialogue(startIndex = 0) {
    const act = resolveActRecord(ctx, ctx.state.actId);
    const lines = Array.isArray(act?.dialogue) ? act.dialogue : [];
    if (lines.length === 0 || startIndex >= lines.length) {
      enterBlocking({ playTutorialVo: true });
      return;
    }

    setPhase(PHASES.DIALOGUE);
    const applied = populateDialoguePreview(ctx.state.actId, startIndex);
    if (applied) {
      emit('dialogueStep', {
        actId: ctx.state.actId,
        index: startIndex,
        total: applied.total,
        line: applied.line,
      });
      if (applied.line.voId) {
        emit('voPlay', { voId: applied.line.voId });
      }
    }
  }

  function enterBlocking({ playTutorialVo = true } = {}) {
    choreo.cancelAll();
    setPhase(PHASES.BLOCKING);
    casting.onEnterBlocking({ playVo: playTutorialVo });
    moodEngine.syncPreview({ emitEvent: true });
  }

  function loadActStage(actId, { skipDialogue = false, playStartClapperVo = false } = {}) {
    const targetAct = clampActId(actId);
    choreo.cancelAll();

    ctx.state.actId = targetAct;
    ctx.state.currentTake = null;
    ctx.state.currentEnding = null;

    casting.resetSlotsForAct(targetAct);
    populateDialoguePreview(targetAct, 0);
    moodEngine.syncPreview({ emitEvent: true });

    const act = resolveActRecord(ctx, targetAct);
    const clapperLabel =
      act?.clapperLabel || `SCENE 0${targetAct} · ${(act?.title || '').toUpperCase()}`;

    ctx.render?.setActSet?.(targetAct);
    ctx.render?.setCurtains?.(true, Boolean(skipDialogue));
    emit('curtainMove', { open: true, duration: skipDialogue ? 0 : CLAPPER_DURATION });

    ctx.state.stats.clappers = (ctx.state.stats.clappers || 0) + 1;
    emit('clapperSnap', { label: clapperLabel, actId: targetAct });
    emit('sfx', { name: 'clapper_snap' });

    if (playStartClapperVo && !skipDialogue) {
      emit('voPlay', { voId: 'vo_clapper_start' });
    }

    const hasDialogue = Array.isArray(act?.dialogue) && act.dialogue.length > 0;
    if (skipDialogue || !hasDialogue) {
      enterBlocking({ playTutorialVo: !skipDialogue });
      return;
    }

    setPhase(PHASES.CLAPPER, { forceEmit: true });
    choreo.startClapper({
      duration: CLAPPER_DURATION,
      onComplete: () => {
        enterDialogue(0);
      },
    });
  }

  function startRun(opts = {}) {
    const options = opts && typeof opts === 'object' ? opts : {};
    if (options.seed !== undefined && options.seed !== null) {
      const normalizedSeed = normalizeSeedUint32(options.seed, ctx.seed || 20261031);
      ctx.seed = normalizedSeed;
      ctx.state.seed = normalizedSeed;
      ctx.rng?.reseed?.(normalizedSeed);
    }

    const startAct = clampActId(options.startAct ?? options.act ?? 1);
    const skipDialogue = Boolean(options.skipDialogue);

    recordInteraction('ui', 0, 0);

    if (ctx.state.modal !== null) {
      const prevModal = ctx.state.modal;
      ctx.ui?.closeModal?.();
      ctx.state.modal = null;
      emit('modalClosed', { modal: prevModal });
    }

    commissions.ensureProgressShape();
    moodEngine.resetMoods({ emitEvent: false });
    casting.resetTutorialForNewRun();

    loadActStage(startAct, {
      skipDialogue,
      playStartClapperVo: startAct === 1,
    });

    return ctx.state;
  }

  function jumpToAct(actId = 1, opts = {}) {
    const options = opts && typeof opts === 'object' ? opts : {};
    const targetAct = clampActId(actId);
    const keepMoods =
      options.keepMoods !== undefined
        ? Boolean(options.keepMoods)
        : options.resetMoods !== undefined
          ? !options.resetMoods
          : true;
    const skipDialogue = Boolean(options.skipDialogue);

    recordInteraction('ui', 0, 0);

    if (ctx.state.modal !== null) {
      const prevModal = ctx.state.modal;
      ctx.ui?.closeModal?.();
      ctx.state.modal = null;
      emit('modalClosed', { modal: prevModal });
    }

    moodEngine.pruneChoicesFromAct(targetAct, { keepMoods });
    if (!keepMoods && targetAct === 1) {
      casting.resetTutorialForNewRun();
    }

    loadActStage(targetAct, {
      skipDialogue,
      playStartClapperVo: false,
    });

    return ctx.state;
  }

  function advanceDialogue() {
    const phase = ctx.state.phase;
    if (phase === PHASES.CLAPPER) {
      recordInteraction('ui', 0, 0);
      emit('sfx', { name: 'ui_click' });
      choreo.finishClapperNow();
      return true;
    }

    if (phase === PHASES.ROLLING && choreo.canSkipTake()) {
      recordInteraction('ui', 0, 0);
      emit('sfx', { name: 'ui_click' });
      return choreo.trySkipTake();
    }

    if (phase !== PHASES.DIALOGUE) {
      recordInteraction('blocked', 0, 0);
      emit('sfx', { name: 'ui_click', pitch: 0.78 });
      return false;
    }

    recordInteraction('ui', 0, 0);
    emit('sfx', { name: 'ui_click' });

    const act = resolveActRecord(ctx, ctx.state.actId);
    const lines = Array.isArray(act?.dialogue) ? act.dialogue : [];
    const nextIdx = (ctx.state.dialogue?.index ?? 0) + 1;

    if (nextIdx < lines.length) {
      const applied = populateDialoguePreview(ctx.state.actId, nextIdx);
      if (applied) {
        emit('dialogueStep', {
          actId: ctx.state.actId,
          index: nextIdx,
          total: applied.total,
          line: applied.line,
        });
        if (applied.line.voId) {
          emit('voPlay', { voId: applied.line.voId });
        }
      }
      return true;
    }

    enterBlocking({ playTutorialVo: true });
    return true;
  }

  function skipDialogue() {
    const phase = ctx.state.phase;
    if (phase === PHASES.ROLLING && choreo.canSkipTake()) {
      recordInteraction('ui', 0, 0);
      emit('sfx', { name: 'curtain_swish' });
      return choreo.trySkipTake();
    }

    if (phase === PHASES.BLOCKING) {
      recordInteraction('ui', 0, 0);
      return true;
    }

    if (phase !== PHASES.CLAPPER && phase !== PHASES.DIALOGUE) {
      recordInteraction('blocked', 0, 0);
      emit('sfx', { name: 'ui_click', pitch: 0.78 });
      return false;
    }

    recordInteraction('ui', 0, 0);
    choreo.cancelAll();
    emit('dialogueSkipped', { actId: ctx.state.actId });
    emit('sfx', { name: 'curtain_swish' });
    enterBlocking({ playTutorialVo: true });
    return true;
  }

  function replayCutscene() {
    const phase = ctx.state.phase;
    if (phase !== PHASES.BLOCKING && phase !== PHASES.TAKE_RESULT) {
      recordInteraction('blocked', 0, 0);
      return false;
    }
    recordInteraction('ui', 0, 0);
    emit('sfx', { name: 'camera_whir' });
    if (phase === PHASES.TAKE_RESULT) {
      moodEngine.rollbackActChoice(ctx.state.actId);
      ctx.state.currentTake = null;
      casting.resetSlotsForAct(ctx.state.actId);
    }
    enterDialogue(0);
    return true;
  }

  function replayDialogueLine(opts = {}) {
    if (ctx.state.phase !== PHASES.DIALOGUE) {
      recordInteraction('blocked', 0, 0);
      emit('sfx', { name: 'ui_click', pitch: 0.78 });
      return false;
    }

    const options = opts && typeof opts === 'object' ? opts : {};
    const preservedIdx = Math.max(0, Math.floor(Number(ctx.state.dialogue?.index) || 0));
    const existingVoId = ctx.state.dialogue?.voId || null;
    const act = resolveActRecord(ctx, ctx.state.actId);
    const rawLine = Array.isArray(act?.dialogue) ? act.dialogue[preservedIdx] : null;
    const normalizedLine = rawLine ? normalizeDialogueLine(ctx, rawLine, preservedIdx) : null;
    const voId = existingVoId || normalizedLine?.voId || null;

    if (ctx.state.dialogue) {
      ctx.state.dialogue.index = preservedIdx;
      if (voId && !ctx.state.dialogue.voId) {
        ctx.state.dialogue.voId = voId;
      }
    }

    recordInteraction('ui', 0, 0);
    emit('sfx', { name: 'ui_click' });

    const speakerId =
      ctx.state.dialogue?.speakerId || normalizedLine?.speakerId || 'sarkaz_director';
    const portraitMood =
      ctx.state.dialogue?.portraitMood || normalizedLine?.portraitMood || 'neutral';
    ctx.render?.setDialogueSpeaker?.(speakerId, portraitMood);

    emit('dialogueReplay', {
      actId: ctx.state.actId,
      index: preservedIdx,
      total: ctx.state.dialogue?.total || (Array.isArray(act?.dialogue) ? act.dialogue.length : 0),
      line: normalizedLine || (ctx.state.dialogue ? { ...ctx.state.dialogue } : null),
      voId,
    });

    if (voId) {
      emitReplayVo(voId, { force: true, unmute: options.unmute !== false });
    }
    return true;
  }

  function prevDialogue() {
    if (ctx.state.phase !== PHASES.DIALOGUE) {
      recordInteraction('blocked', 0, 0);
      emit('sfx', { name: 'ui_click', pitch: 0.78 });
      return false;
    }

    const curIdx = Math.floor(Number(ctx.state.dialogue?.index) || 0);
    if (curIdx <= 0) {
      recordInteraction('blocked', 0, 0);
      emit('sfx', { name: 'ui_click', pitch: 0.78 });
      return false;
    }

    const prevIdx = curIdx - 1;
    recordInteraction('ui', 0, 0);
    emit('sfx', { name: 'ui_click' });

    const applied = populateDialoguePreview(ctx.state.actId, prevIdx);
    if (applied) {
      ctx.render?.setDialogueSpeaker?.(applied.line.speakerId, applied.line.portraitMood);
      emit('dialogueStep', {
        actId: ctx.state.actId,
        index: prevIdx,
        total: applied.total,
        line: applied.line,
        voId: applied.line.voId,
      });
      if (applied.line.voId) {
        emit('voPlay', { voId: applied.line.voId, force: true });
      }
    }
    return true;
  }

  function completeRolledTake(take) {
    const isNewTake = commissions.recordTake(take.takeId);
    const totals = moodEngine.commitActTake(ctx.state.actId, take);

    if (ctx.state.currentTake) {
      ctx.state.currentTake.animProgress = 1;
      ctx.state.currentTake.isNewTake = isNewTake;
    }

    const maxDelta = Math.max(
      take.moodDelta?.love || 0,
      take.moodDelta?.joy || 0,
      take.moodDelta?.wonder || 0,
      take.moodDelta?.chaos || 0
    );
    emit('sfx', { name: maxDelta >= 2 ? 'mood_up_2' : 'mood_up_1' });

    setPhase(PHASES.TAKE_RESULT);
    emit('takeCompleted', {
      actId: ctx.state.actId,
      takeId: take.takeId,
      isNewTake,
      moodDelta: { ...take.moodDelta },
      totals: { ...totals },
    });

    if (take.voId) {
      emit('voPlay', { voId: take.voId });
    }
  }

  function rollCamera() {
    const state = ctx.state;
    if (state.phase === PHASES.ROLLING) {
      if (choreo.canSkipTake()) {
        recordInteraction('ui', 0, 0);
        return choreo.trySkipTake();
      }
      recordInteraction('ui', 0, 0);
      return false;
    }

    if (state.phase !== PHASES.BLOCKING) {
      recordInteraction('blocked', 0, 0);
      emit('sfx', { name: 'ui_click', pitch: 0.72 });
      return false;
    }

    const { actorId, propId } = state.slots || {};
    if (!actorId || !propId) {
      recordInteraction('blocked', 0, 0);
      emit('sfx', { name: 'ui_click', pitch: 0.72 });
      return false;
    }

    const take = lookupTakeForPair(ctx, state.actId, actorId, propId);
    if (!take) {
      recordInteraction('blocked', 0, 0);
      emit('sfx', { name: 'ui_click', pitch: 0.72 });
      return false;
    }

    casting.completeTutorial();
    recordInteraction('roll', 0, 0);

    const alreadyUnlocked = commissions
      .ensureProgressShape()
      .unlockedTakes.includes(take.takeId);

    state.currentTake = {
      takeId: take.takeId,
      actId: state.actId,
      code: take.code || `TAKE ${state.actId}`,
      title: take.title,
      actorId: take.actorId,
      propId: take.propId,
      scriptText: take.scriptText,
      moodDelta: { ...take.moodDelta },
      moodBadges: take.moodBadges ? take.moodBadges.map((b) => ({ ...b })) : [],
      voId: take.voId,
      animProgress: 0,
      isNewTake: !alreadyUnlocked,
    };

    state.stats.clappers = (state.stats.clappers || 0) + 1;
    setPhase(PHASES.ROLLING);

    emit('clapperSnap', {
      label: `${take.code || 'TAKE'} · ${take.title.toUpperCase()}`,
      actId: state.actId,
    });
    emit('cameraRollStart', {
      actId: state.actId,
      takeId: take.takeId,
      actorId: take.actorId,
      propId: take.propId,
      moodDelta: { ...take.moodDelta },
    });
    emit('sfx', { name: 'clapper_snap' });
    emit('sfx', { name: 'camera_whir' });
    emit('voPlay', { voId: 'vo_roll_action' });

    ctx.render?.playTakeChoreo?.(take);

    choreo.startTakeRoll(take, {
      onComplete: (completedTake) => {
        completeRolledTake(completedTake);
      },
    });

    return true;
  }

  function skipRolling() {
    if (ctx.state.phase !== PHASES.ROLLING || !choreo.canSkipTake()) {
      recordInteraction('blocked', 0, 0);
      return false;
    }
    recordInteraction('ui', 0, 0);
    emit('sfx', { name: 'curtain_swish' });
    return choreo.trySkipTake();
  }

  function reshoot() {
    const phase = ctx.state.phase;
    if (
      phase !== PHASES.TAKE_RESULT &&
      phase !== PHASES.ROLLING &&
      phase !== PHASES.BLOCKING
    ) {
      recordInteraction('blocked', 0, 0);
      emit('sfx', { name: 'ui_click', pitch: 0.75 });
      return false;
    }

    recordInteraction('ui', 0, 0);
    choreo.cancelAll();

    const actId = clampActId(ctx.state.actId);
    ctx.state.currentTake = null;
    moodEngine.rollbackActChoice(actId);
    casting.resetSlotsForAct(actId);

    ctx.render?.setActSet?.(actId);
    ctx.render?.setCurtains?.(true, true);

    emit('reshootRequested', { actId });
    emit('sfx', { name: 'curtain_swish' });
    emit('voPlay', { voId: 'vo_reshoot' });

    setPhase(PHASES.BLOCKING, { forceEmit: true });
    casting.onEnterBlocking({ playVo: false });
    moodEngine.syncPreview({ emitEvent: true });
    return true;
  }

  function nextAct() {
    if (ctx.state.phase !== PHASES.TAKE_RESULT) {
      recordInteraction('blocked', 0, 0);
      emit('sfx', { name: 'ui_click', pitch: 0.75 });
      return false;
    }

    if (ctx.state.actId >= 5) {
      return Boolean(revealEnding());
    }

    recordInteraction('ui', 0, 0);
    emit('sfx', { name: 'curtain_swish' });

    const nextActId = clampActId(ctx.state.actId + 1);
    loadActStage(nextActId, {
      skipDialogue: false,
      playStartClapperVo: false,
    });
    return true;
  }

  function revealEnding() {
    const phase = ctx.state.phase;
    if (phase === PHASES.ROLLING) {
      choreo.forceFinishTake();
    }

    if (ctx.state.phase !== PHASES.TAKE_RESULT && ctx.state.actId < 5) {
      recordInteraction('blocked', 0, 0);
      emit('sfx', { name: 'ui_click', pitch: 0.75 });
      return null;
    }

    recordInteraction('ui', 0, 0);
    choreo.cancelAll();

    const { ending, totals } = moodEngine.resolveFinalEnding();
    const isNewEnding = commissions.recordEnding(ending.endingId, { incrementRuns: true });

    ctx.state.currentEnding = {
      endingId: ending.endingId,
      code: ending.code,
      title: ending.title,
      bodyText: ending.bodyText,
      voId: ending.voId,
      totals: { ...totals },
      isNewEnding,
    };

    ctx.render?.showEndingBackdrop?.(ending.endingId);
    choreo.flashCamera(0.75);
    const endingParticleKind =
      ending.endingId === 'END2'
        ? 'hearts'
        : ending.endingId === 'END4'
          ? 'stars'
          : 'confetti';
    choreo.burstParticles(endingParticleKind, { x: 0, y: 1.1, z: 0.1 }, 32);

    setPhase(PHASES.ENDING);
    emit('endingRevealed', {
      endingId: ending.endingId,
      isNewEnding,
      totals: { ...totals },
    });
    emit('sfx', { name: 'ending_fanfare' });
    if (ending.voId) {
      emit('voPlay', { voId: ending.voId });
    }

    return ctx.state.currentEnding;
  }

  function returnToTitle() {
    recordInteraction('ui', 0, 0);
    choreo.cancelAll();
    if (ctx.state.modal !== null) {
      const prevModal = ctx.state.modal;
      ctx.ui?.closeModal?.();
      ctx.state.modal = null;
      emit('modalClosed', { modal: prevModal });
    }
    ctx.state.currentTake = null;
    ctx.state.currentEnding = null;
    ctx.render?.setCurtains?.(false, false);
    emit('curtainMove', { open: false, duration: 0.5 });
    emit('sfx', { name: 'curtain_swish' });
    setPhase(PHASES.TITLE);
    return ctx.state;
  }

  function triggerStageGag(gagId, x = 0, y = 0) {
    const act = resolveActRecord(ctx, ctx.state.actId);
    const fallbackGag = act?.gags?.[0] || null;
    const gag = (gagId && getGagById(gagId)) || fallbackGag || {
      id: String(gagId || 'gag_curtain_bunny'),
      worldPos: { x: 0, y: 1.15, z: -0.4 },
      sfx: 'gag_pop',
      particleKind: 'sparkles',
      bonusSparkles: 16,
    };

    const resolvedId = gag.id || gag.gagId || String(gagId || 'gag_curtain_bunny');
    const bonusSparkles = Math.max(8, Number(gag.bonusSparkles) || 16);
    const jitterX = ctx.rng ? ctx.rng.range(-0.08, 0.08) : 0;
    const jitterY = ctx.rng ? ctx.rng.range(-0.05, 0.05) : 0;
    const basePos = gag.worldPos || { x: 0, y: 1.15, z: -0.4 };
    const worldPos = {
      x: Number(((basePos.x || 0) + jitterX).toFixed(4)),
      y: Number(((basePos.y || 1.1) + jitterY).toFixed(4)),
      z: basePos.z || 0,
    };

    recordInteraction('gag', x, y);
    choreo.burstParticles(gag.particleKind || 'sparkles', worldPos, bonusSparkles);

    emit('stageGagTriggered', {
      actId: ctx.state.actId,
      gagId: resolvedId,
      x: Number(x) || 0,
      y: Number(y) || 0,
      bonusSparkles,
    });
    emit('sfx', { name: gag.sfx || 'gag_pop' });
    return true;
  }

  function replayTake(takeId = null, opts = {}) {
    let argId = takeId;
    let options = opts && typeof opts === 'object' ? opts : {};
    if (takeId && typeof takeId === 'object') {
      options = takeId;
      argId = options.takeId || null;
    }

    const fallbackId =
      ctx.state.currentTake?.takeId ||
      ctx.state.actChoices?.[ctx.state.actId]?.takeId ||
      null;
    const resolvedId = argId || fallbackId;
    const take = resolvedId
      ? ctx?.levels?.TAKES?.[resolvedId] || getTakeById(resolvedId)
      : null;

    if (!take) {
      recordInteraction('blocked', 0, 0);
      emit('sfx', { name: 'ui_click', pitch: 0.75 });
      return false;
    }

    recordInteraction('ui', 0, 0);
    emit('sfx', { name: 'camera_whir' });

    if (ctx.state.phase === PHASES.TAKE_RESULT && Number(take.actId) === Number(ctx.state.actId)) {
      ctx.render?.playTakeChoreo?.(take);
      choreo.burstParticles(take.particlePreset || 'sparkles', { x: 0, y: 1.0, z: 0.25 }, 20);
    } else if (ctx.state.modal === 'album') {
      ctx.render?.setActSet?.(take.actId);
      ctx.render?.playTakeChoreo?.(take);
      choreo.burstParticles(take.particlePreset || 'sparkles', { x: 0, y: 1.0, z: 0.25 }, 18);
    }

    if (take.voId) {
      emitReplayVo(take.voId, {
        force: true,
        unmute: options.unmute !== false,
      });
    }
    return true;
  }

  function replayEnding(opts = {}) {
    const options = opts && typeof opts === 'object' ? opts : {};
    const currentEnding = ctx.state.currentEnding;
    const voId =
      currentEnding?.voId ||
      (currentEnding?.endingId && ctx?.levels?.ENDINGS?.[currentEnding.endingId]?.voId) ||
      null;

    if (ctx.state.phase !== PHASES.ENDING || !voId) {
      recordInteraction('blocked', 0, 0);
      emit('sfx', { name: 'ui_click', pitch: 0.75 });
      return false;
    }

    recordInteraction('ui', 0, 0);
    emit('sfx', { name: 'ui_click' });

    const endingId = currentEnding?.endingId || 'END1';
    const endingParticleKind =
      endingId === 'END2' ? 'hearts' : endingId === 'END4' ? 'stars' : 'confetti';
    choreo.burstParticles(endingParticleKind, { x: 0, y: 1.1, z: 0.1 }, 20);

    emitReplayVo(voId, {
      force: true,
      unmute: options.unmute !== false,
    });
    return true;
  }

  function replayCurrent(opts = {}) {
    const options = opts && typeof opts === 'object' ? opts : {};
    const shouldUnmute = options.unmute !== false;
    const phase = ctx.state.phase;

    if (ctx.state.modal !== null) {
      recordInteraction('ui', 0, 0);
      emit('sfx', { name: 'ui_click' });
      const stats = ctx.audio?.getAudioStats?.() || {};
      const candidateVo = options.voId || stats.activeVoId || stats.lastVoId || null;

      if (candidateVo && typeof ctx.audio?.replayLastVO === 'function') {
        if (shouldUnmute) {
          ctx.audio?.unlock?.();
          if (stats.voMuted) {
            ctx.audio?.setMuted?.({ vo: false });
          }
        }
        ctx.audio.replayLastVO({ ...options, unmute: shouldUnmute });
        return true;
      }

      const fallbackModalVo =
        candidateVo ||
        (phase === PHASES.TITLE
          ? 'vo_title_welcome'
          : ctx.state.modal === 'album'
            ? 'vo_album_open'
            : ctx.state.currentTake?.voId ||
              ctx.state.currentEnding?.voId ||
              ctx.state.dialogue?.voId ||
              'vo_title_welcome');

      if (typeof ctx.audio?.playVO === 'function') {
        if (shouldUnmute) {
          ctx.audio?.unlock?.();
          if (stats.voMuted) {
            ctx.audio?.setMuted?.({ vo: false });
          }
        }
        ctx.audio.playVO(fallbackModalVo, { force: true, unmute: shouldUnmute });
      } else {
        emitReplayVo(fallbackModalVo, { force: true, unmute: shouldUnmute });
      }
      return true;
    }

    if (phase === PHASES.DIALOGUE) {
      return replayDialogueLine({ unmute: shouldUnmute });
    }

    if (phase === PHASES.TAKE_RESULT) {
      return replayTake(null, { ...options, unmute: shouldUnmute });
    }

    if (phase === PHASES.ENDING) {
      return replayEnding({ unmute: shouldUnmute });
    }

    if (phase === PHASES.TITLE) {
      recordInteraction('ui', 0, 0);
      emit('sfx', { name: 'ui_click' });
      const stats = ctx.audio?.getAudioStats?.() || {};
      const targetVoId = stats.lastVoId || 'vo_title_welcome';
      if (typeof ctx.audio?.playVO === 'function') {
        if (shouldUnmute) {
          ctx.audio?.unlock?.();
          if (stats.voMuted) {
            ctx.audio?.setMuted?.({ vo: false });
          }
        }
        ctx.audio.playVO(targetVoId, { force: true, unmute: shouldUnmute });
      } else {
        emitReplayVo(targetVoId, { force: true, unmute: shouldUnmute });
      }
      return true;
    }

    // blocking, clapper, rolling
    recordInteraction('ui', 0, 0);
    emit('sfx', { name: 'ui_click' });
    const stats = ctx.audio?.getAudioStats?.() || {};
    const targetVoId = stats.lastVoId || 'vo_tut_cast';
    if (typeof ctx.audio?.playVO === 'function') {
      if (shouldUnmute) {
        ctx.audio?.unlock?.();
        if (stats.voMuted) {
          ctx.audio?.setMuted?.({ vo: false });
        }
      }
      ctx.audio.playVO(targetVoId, { force: true, unmute: shouldUnmute });
    } else {
      emitReplayVo(targetVoId, { force: true, unmute: shouldUnmute });
    }
    return true;
  }

  function update(dt) {
    choreo.update(dt);
  }

  const solver = createSolver(ctx, () => api);

  api = {
    startRun,
    jumpToAct,
    returnToTitle,
    advanceDialogue,
    prevDialogue,
    replayDialogueLine,
    skipDialogue,
    replayCutscene,
    selectTab: casting.selectTab,
    hoverSlot: casting.hoverSlot,
    castSlot: casting.castSlot,
    autoCastItem: casting.autoCastItem,
    clearSlot: casting.clearSlot,
    advanceTutorial: casting.advanceTutorial,
    rollCamera,
    skipRolling,
    reshoot,
    nextAct,
    revealEnding,
    replayEnding,
    triggerStageGag,
    claimCommission: commissions.claimCommission,
    claimAllReady: commissions.claimAllReady,
    getCommissionStatus: commissions.getCommissionStatus,
    getCommissionStatuses: commissions.getAllStatuses,
    solveCurrentAct: solver.solveCurrentAct,
    solveRunForEnding: solver.solveRunForEnding,
    replayTake,
    replayCurrent,
    update,
  };

  return api;
}
