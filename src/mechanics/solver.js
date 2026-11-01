// Deterministic single-act and full 5-act branching ending solver
// per docs/DESIGN.md §4.4, §4.5, §6.2 & Gates G3, G4, G5 (owner: mechanics).

import { ACTS } from '../levels/acts_data.js';
import { RECIPES, resolveEndingId } from '../levels/endings_data.js';
import { getTake, getTakeById, getTakesForAct } from '../levels/takes_matrix.js';
import { resolveActRecord } from './casting.js';
import { addMoods, sumActChoices } from './mood_engine.js';

function getRecipesMap(ctx) {
  return ctx?.levels?.RECIPES || ctx?.levels?.recipes || RECIPES;
}

function advanceFramesUntil(ctx, updateFn, predicate, maxFrames = 240) {
  const dt = ctx?.DT || 1 / 60;
  let elapsedFrames = 0;

  while (!predicate() && elapsedFrames < maxFrames) {
    if (typeof ctx?.loop?.stepFrames === 'function') {
      // Advance in crisp 4-frame chunks until near completion so UI/render stay fast.
      const batch = Math.min(4, maxFrames - elapsedFrames);
      ctx.loop.stepFrames(batch);
      elapsedFrames += batch;
    } else {
      ctx.frame = (ctx.frame || 0) + 1;
      ctx.time = ctx.frame * dt;
      ctx.state.frame = ctx.frame;
      ctx.state.timeMs = Math.round((ctx.frame * 1000) / 60);
      updateFn(dt);
      ctx.render?.update?.(dt);
      ctx.audio?.update?.(dt);
      elapsedFrames += 1;
    }
  }

  if (typeof ctx?.loop?.stepFrames !== 'function') {
    ctx.ui?.sync?.(ctx.state);
    ctx.render?.renderFrame?.();
  }
}

function resolvePairArgument(ctx, actId, preferredPair) {
  const act = resolveActRecord(ctx, actId) || ACTS[actId];
  if (!act) return { actorId: null, propId: null };

  if (!preferredPair) {
    const slotActor = ctx.state.slots?.actorId;
    const slotProp = ctx.state.slots?.propId;
    if (slotActor && slotProp && act.actors.includes(slotActor) && act.props.includes(slotProp)) {
      return { actorId: slotActor, propId: slotProp };
    }
    return { actorId: act.actors[0], propId: act.props[0] };
  }

  if (typeof preferredPair === 'string') {
    if (preferredPair === 'unseen') {
      const unlocked = new Set(ctx.state.progress?.unlockedTakes || []);
      const candidates = getTakesForAct(actId);
      const unseen = candidates.find((t) => !unlocked.has(t.takeId));
      if (unseen) {
        return { actorId: unseen.actorId, propId: unseen.propId };
      }
      return { actorId: act.actors[0], propId: act.props[0] };
    }

    const byTake = getTakeById(preferredPair);
    if (byTake && Number(byTake.actId) === Number(actId)) {
      return { actorId: byTake.actorId, propId: byTake.propId };
    }

    const recipes = getRecipesMap(ctx);
    const recipeSteps = recipes?.[preferredPair];
    if (Array.isArray(recipeSteps)) {
      const step =
        recipeSteps.find((s) => Number(s.actId ?? s.act) === Number(actId)) ||
        recipeSteps[Number(actId) - 1];
      if (step) {
        return { actorId: step.actorId, propId: step.propId };
      }
    }
  }

  if (Array.isArray(preferredPair) && preferredPair.length >= 2) {
    return { actorId: preferredPair[0], propId: preferredPair[1] };
  }

  if (typeof preferredPair === 'object') {
    if (preferredPair.takeId) {
      const byTake = getTakeById(preferredPair.takeId);
      if (byTake && Number(byTake.actId) === Number(actId)) {
        return { actorId: byTake.actorId, propId: byTake.propId };
      }
    }
    const actorId = preferredPair.actorId || preferredPair.actor || act.actors[0];
    const propId = preferredPair.propId || preferredPair.prop || act.props[0];
    return { actorId, propId };
  }

  return { actorId: act.actors[0], propId: act.props[0] };
}

function projectPlanMoods(baseMoods, planSteps) {
  let running = { ...baseMoods };
  for (let i = 0; i < planSteps.length; i++) {
    const step = planSteps[i];
    const take = getTake(step.actId, step.actorId, step.propId);
    if (take?.moodDelta) {
      running = addMoods(running, take.moodDelta);
    }
  }
  return running;
}

function searchRemainingPlan(startAct, baseMoods, targetEndingId) {
  const chosen = [];

  function dfs(actId, currentMoods) {
    if (actId > 5) {
      return resolveEndingId(currentMoods) === targetEndingId;
    }
    const takes = getTakesForAct(actId);
    for (let i = 0; i < takes.length; i++) {
      const t = takes[i];
      chosen.push({ actId, actorId: t.actorId, propId: t.propId, takeId: t.takeId });
      const nextMoods = addMoods(currentMoods, t.moodDelta);
      if (dfs(actId + 1, nextMoods)) {
        return true;
      }
      chosen.pop();
    }
    return false;
  }

  return dfs(startAct, baseMoods) ? chosen : null;
}

export function createSolver(ctx, getMechanicsApi) {
  function solveCurrentAct(preferredPair) {
    const api = getMechanicsApi();
    const state = ctx.state;

    if (state.phase === 'title' || state.phase === 'ending') {
      const targetAct = state.phase === 'title' ? Math.max(1, Math.min(5, state.actId || 1)) : 1;
      api.startRun({
        seed: ctx.seed ?? state.seed,
        startAct: targetAct,
        skipDialogue: true,
      });
    }

    if (state.phase === 'rolling') {
      advanceFramesUntil(ctx, api.update, () => state.phase !== 'rolling', 220);
      if (!preferredPair && state.phase === 'take_result') {
        return state;
      }
    }

    if (state.phase === 'take_result') {
      api.reshoot();
    }

    if (state.phase === 'clapper' || state.phase === 'dialogue') {
      api.skipDialogue();
    }

    const actId = Math.max(1, Math.min(5, state.actId || 1));
    const { actorId, propId } = resolvePairArgument(ctx, actId, preferredPair);

    if (actorId) {
      api.castSlot('actor', actorId, 'seam');
    }
    if (propId) {
      api.castSlot('prop', propId, 'seam');
    }

    api.rollCamera();
    advanceFramesUntil(ctx, api.update, () => state.phase === 'take_result', 220);
    return state;
  }

  function solveRunForEnding(strategy = 'END1') {
    const api = getMechanicsApi();
    const state = ctx.state;
    const recipes = getRecipesMap(ctx);
    const normalizedStrategy =
      typeof strategy === 'string' && strategy.trim().length > 0 ? strategy.trim() : 'END1';
    const targetEndingId =
      normalizedStrategy === 'VIDEO_RUN'
        ? 'END1'
        : /^END[1-5]$/.test(normalizedStrategy)
          ? normalizedStrategy
          : 'END1';

    if (state.phase === 'title' || state.phase === 'ending') {
      api.startRun({
        seed: ctx.seed ?? state.seed,
        startAct: 1,
        skipDialogue: true,
      });
    } else if (state.phase === 'rolling') {
      advanceFramesUntil(ctx, api.update, () => state.phase !== 'rolling', 220);
    }

    // If currently sitting on a take_result in Act k, roll back Act k if we need to re-plan from Act k.
    if (state.phase === 'take_result') {
      api.reshoot();
    } else if (state.phase === 'clapper' || state.phase === 'dialogue') {
      api.skipDialogue();
    }

    let startAct = Math.max(1, Math.min(5, state.actId || 1));
    const priorChoices = {};
    for (let a = 1; a < startAct; a++) {
      if (state.actChoices[a]) {
        priorChoices[a] = state.actChoices[a];
      }
    }
    const baseMoods = sumActChoices(priorChoices);

    const canonicalRecipe = recipes?.[normalizedStrategy] || recipes?.[targetEndingId] || RECIPES.END1;
    let remainingSteps = [];
    for (let a = startAct; a <= 5; a++) {
      const step =
        canonicalRecipe.find((s) => Number(s.actId ?? s.act) === a) || canonicalRecipe[a - 1];
      remainingSteps.push(step);
    }

    const projected = projectPlanMoods(baseMoods, remainingSteps);
    if (resolveEndingId(projected) !== targetEndingId) {
      const dynamicPlan = searchRemainingPlan(startAct, baseMoods, targetEndingId);
      if (dynamicPlan) {
        remainingSteps = dynamicPlan;
      } else {
        // Mathematically unreachable from mid-run state -> restart cleanly from Act 1 with canonical recipe.
        api.startRun({
          seed: ctx.seed ?? state.seed,
          startAct: 1,
          skipDialogue: true,
        });
        startAct = 1;
        remainingSteps = [...canonicalRecipe];
      }
    }

    for (let i = 0; i < remainingSteps.length; i++) {
      const step = remainingSteps[i];
      if (state.phase === 'clapper' || state.phase === 'dialogue') {
        api.skipDialogue();
      }
      api.castSlot('actor', step.actorId, 'seam');
      api.castSlot('prop', step.propId, 'seam');
      api.rollCamera();
      advanceFramesUntil(ctx, api.update, () => state.phase === 'take_result', 220);

      if (state.actId < 5) {
        api.nextAct();
        if (state.phase === 'clapper' || state.phase === 'dialogue') {
          api.skipDialogue();
        }
      } else {
        api.revealEnding();
      }
    }

    return state;
  }

  return {
    solveCurrentAct,
    solveRunForEnding,
  };
}
