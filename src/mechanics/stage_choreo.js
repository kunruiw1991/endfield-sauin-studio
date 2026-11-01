// Deterministic ctx.time/DT-driven stage choreography & clapper wipe sequencer
// per docs/DESIGN.md §4.2, §6.1, Gate G5, Gate G7 & Gate G12 (owner: mechanics).

import { CLAPPER_DURATION, TAKE_DURATION, TAKE_SKIP_AFTER } from '../levels/constants.js';

function buildFallbackBeats(take) {
  const actId = take?.actId || 1;
  const leftIsProp = actId <= 3;
  const actorX = leftIsProp ? 1.35 : -1.35;
  const propX = leftIsProp ? -1.35 : 1.35;
  return [
    {
      beatIndex: 0,
      t: 0.08,
      kind: 'drop_in',
      target: 'actor',
      action: 'enter_mark',
      expression: 'happy',
      sfx: 'slot_snap',
      particleKind: 'sparkles',
      pos: { x: actorX, y: 0.9, z: 0.35 },
    },
    {
      beatIndex: 1,
      t: 0.6,
      kind: 'prop_focus',
      target: 'prop',
      action: 'prop_highlight',
      expression: 'happy',
      sfx: 'gag_pop',
      particleKind: take?.particlePreset || 'sparkles',
      pos: { x: propX, y: 0.95, z: 0.35 },
    },
    {
      beatIndex: 2,
      t: 1.18,
      kind: 'npc_gesture',
      target: 'all',
      action: 'scene_reaction',
      expression: 'happy',
      sfx: null,
      particleKind: take?.particlePreset || 'confetti',
      pos: { x: 0.0, y: 1.1, z: 0.2 },
    },
    {
      beatIndex: 3,
      t: 1.72,
      kind: 'pose_freeze',
      target: 'all',
      action: 'polaroid_tableau',
      expression: 'happy',
      sfx: 'shutter_flash',
      particleKind: take?.particlePreset || 'sparkles',
      pos: { x: 0.0, y: 1.0, z: 0.25 },
    },
  ];
}

export function createStageChoreo(ctx) {
  let activeClapper = null; // { elapsed, duration, onComplete }
  let activeRoll = null; // { take, elapsed, duration, beats, firedFlags, flashed, shook, particlesSpawned, targetParticles, onComplete }

  function emit(type, payload) {
    ctx?.events?.emit?.(type, payload);
  }

  function burstParticles(kind = 'sparkles', worldPos = { x: 0, y: 1, z: 0 }, count = 12) {
    const safeCount = Math.max(1, Math.floor(Number(count) || 12));
    const stats = ctx.state.stats;
    const before = stats.particles || 0;
    ctx.render?.burstParticles?.(kind, worldPos, safeCount);
    if ((stats.particles || 0) === before) {
      stats.particles = before + safeCount;
    }
    return safeCount;
  }

  function flashCamera(strength = 0.85) {
    const stats = ctx.state.stats;
    const before = stats.flashes || 0;
    ctx.render?.flashCamera?.(strength);
    if ((stats.flashes || 0) === before) {
      stats.flashes = before + 1;
    }
  }

  function shakeCamera(trauma = 0.05) {
    const stats = ctx.state.stats;
    const before = stats.shakes || 0;
    ctx.render?.shakeCamera?.(trauma);
    if ((stats.shakes || 0) === before) {
      stats.shakes = before + 1;
    }
  }

  function cancelAll() {
    activeClapper = null;
    activeRoll = null;
  }

  function startClapper({ duration = CLAPPER_DURATION, onComplete } = {}) {
    activeRoll = null;
    activeClapper = {
      elapsed: 0,
      duration: Math.max(0.05, Number(duration) || CLAPPER_DURATION),
      onComplete: typeof onComplete === 'function' ? onComplete : null,
    };
  }

  function finishClapperNow() {
    if (!activeClapper) return false;
    const cb = activeClapper.onComplete;
    activeClapper = null;
    cb?.();
    return true;
  }

  function fireRollBeat(roll, index) {
    if (roll.firedFlags[index]) return;
    roll.firedFlags[index] = true;

    const beat = roll.beats[index];
    const take = roll.take;
    const pos = beat.pos ? { ...beat.pos } : { x: 0, y: 1.0, z: 0.25 };

    emit('choreoBeat', {
      actId: take.actId,
      takeId: take.takeId,
      beatIndex: beat.beatIndex ?? index,
      kind: beat.kind || 'beat',
      target: beat.target || 'all',
      action: beat.action || '',
      expression: beat.expression || 'happy',
      pos,
    });

    if (beat.sfx) {
      emit('sfx', { name: beat.sfx });
    }

    const pCount = roll.perBeatParticles[index] || 0;
    if (pCount > 0) {
      const pKind = beat.particleKind || take.particlePreset || 'sparkles';
      roll.particlesSpawned += burstParticles(pKind, pos, pCount);
    }

    const isFinalBeat = index === roll.beats.length - 1;
    if (beat.sfx === 'shutter_flash' || beat.kind === 'pose_freeze' || isFinalBeat) {
      if (!roll.flashed) {
        roll.flashed = true;
        flashCamera(0.85);
        if (beat.sfx !== 'shutter_flash') {
          emit('sfx', { name: 'shutter_flash' });
        }
      }
    }

    const isChaotic =
      (take.moodDelta?.chaos || 0) >= 1 ||
      beat.sfx === 'firework_burst' ||
      take.propId === 'fireworks';
    if (isChaotic && !roll.shook && index >= 1) {
      roll.shook = true;
      shakeCamera(0.055);
    }
  }

  function finalizeRoll(roll) {
    for (let i = 0; i < roll.beats.length; i++) {
      if (!roll.firedFlags[i]) {
        fireRollBeat(roll, i);
      }
    }
    if (!roll.flashed) {
      roll.flashed = true;
      flashCamera(0.85);
      emit('sfx', { name: 'shutter_flash' });
    }
    if (roll.particlesSpawned < roll.targetParticles) {
      const deficit = roll.targetParticles - roll.particlesSpawned;
      roll.particlesSpawned += burstParticles(
        roll.take.particlePreset || 'sparkles',
        { x: 0, y: 1.05, z: 0.25 },
        deficit
      );
    }
    if (ctx.state.currentTake && ctx.state.currentTake.takeId === roll.take.takeId) {
      ctx.state.currentTake.animProgress = 1;
    }
    const cb = roll.onComplete;
    const completedTake = roll.take;
    activeRoll = null;
    cb?.(completedTake);
  }

  function startTakeRoll(take, { duration = TAKE_DURATION, onComplete } = {}) {
    activeClapper = null;
    const rawBeats =
      Array.isArray(take?.choreoBeats) && take.choreoBeats.length > 0
        ? take.choreoBeats
        : buildFallbackBeats(take);

    const targetParticles = Math.max(32, Number(take?.particleCount) || 36);
    const beatCount = rawBeats.length;
    const basePerBeat = Math.floor(targetParticles / beatCount);
    const remainder = targetParticles - basePerBeat * beatCount;
    const perBeatParticles = rawBeats.map((_, idx) =>
      idx === beatCount - 1 ? basePerBeat + remainder : basePerBeat
    );

    activeRoll = {
      take,
      elapsed: 0,
      duration: Math.max(0.6, Number(duration) || TAKE_DURATION),
      beats: rawBeats,
      perBeatParticles,
      firedFlags: new Array(beatCount).fill(false),
      flashed: false,
      shook: false,
      particlesSpawned: 0,
      targetParticles,
      onComplete: typeof onComplete === 'function' ? onComplete : null,
    };
  }

  function canSkipTake() {
    return Boolean(activeRoll && activeRoll.elapsed >= TAKE_SKIP_AFTER - 1e-6);
  }

  function trySkipTake() {
    if (!canSkipTake()) return false;
    finalizeRoll(activeRoll);
    return true;
  }

  function forceFinishTake() {
    if (!activeRoll) return false;
    finalizeRoll(activeRoll);
    return true;
  }

  function getProgress() {
    if (activeClapper) {
      return {
        mode: 'clapper',
        elapsed: activeClapper.elapsed,
        duration: activeClapper.duration,
        progress: Math.min(1, activeClapper.elapsed / activeClapper.duration),
      };
    }
    if (activeRoll) {
      return {
        mode: 'rolling',
        elapsed: activeRoll.elapsed,
        duration: activeRoll.duration,
        progress: Math.min(1, activeRoll.elapsed / activeRoll.duration),
        skippable: canSkipTake(),
      };
    }
    return { mode: 'idle', elapsed: 0, duration: 0, progress: 0 };
  }

  function update(dt) {
    const step = Number.isFinite(dt) && dt > 0 ? dt : ctx?.DT || 1 / 60;

    if (activeClapper) {
      activeClapper.elapsed += step;
      if (activeClapper.elapsed >= activeClapper.duration - 1e-6) {
        finishClapperNow();
      }
      return;
    }

    if (activeRoll) {
      activeRoll.elapsed += step;
      const ratio = Math.min(1, activeRoll.elapsed / activeRoll.duration);
      if (ctx.state.currentTake && ctx.state.currentTake.takeId === activeRoll.take.takeId) {
        ctx.state.currentTake.animProgress = Number(ratio.toFixed(4));
      }

      for (let i = 0; i < activeRoll.beats.length; i++) {
        if (!activeRoll.firedFlags[i] && activeRoll.elapsed >= (activeRoll.beats[i].t || 0) - 1e-6) {
          fireRollBeat(activeRoll, i);
        }
      }

      if (activeRoll.elapsed >= activeRoll.duration - 1e-6) {
        finalizeRoll(activeRoll);
      }
    }
  }

  return {
    burstParticles,
    flashCamera,
    shakeCamera,
    cancelAll,
    startClapper,
    finishClapperNow,
    startTakeRoll,
    canSkipTake,
    trySkipTake,
    forceFinishTake,
    getProgress,
    update,
  };
}
