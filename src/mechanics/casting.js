// Dual casting controller (1-tap + drag-and-drop), Left/Right slot-order resolver
// across Acts 1-5, and Act 1 3-step tutorial progression (owner: mechanics).

import { ACTS } from '../levels/acts_data.js';
import { SLOT_KINDS, TABS } from '../levels/constants.js';

export function resolveActRecord(ctx, actId) {
  const n = Number(actId) || 1;
  const src = ctx?.levels?.ACTS || ctx?.levels?.acts || ACTS;
  if (Array.isArray(src)) {
    return src.find((a) => a && (a.id === n || a.actId === n)) || src[n] || src[n - 1] || ACTS[n] || null;
  }
  return (src && (src[n] || src[String(n)])) || ACTS[n] || null;
}

export function getActSlotOrder(ctx, actId) {
  const act = resolveActRecord(ctx, actId);
  const leftKind =
    act?.leftSlotKind || act?.leftKind || (Number(actId) <= 3 ? SLOT_KINDS.PROP : SLOT_KINDS.ACTOR);
  const rightKind =
    act?.rightSlotKind ||
    act?.rightKind ||
    (leftKind === SLOT_KINDS.PROP ? SLOT_KINDS.ACTOR : SLOT_KINDS.PROP);
  return { leftKind, rightKind };
}

export function resolveSlotKind(ctx, slotKind) {
  const state = ctx?.state;
  if (slotKind === SLOT_KINDS.ACTOR || slotKind === SLOT_KINDS.PROP) {
    return slotKind;
  }
  const order = state?.slots?.leftKind
    ? { leftKind: state.slots.leftKind, rightKind: state.slots.rightKind }
    : getActSlotOrder(ctx, state?.actId || 1);
  if (slotKind === 'left' || slotKind === 'leftSlot') {
    return order.leftKind;
  }
  if (slotKind === 'right' || slotKind === 'rightSlot') {
    return order.rightKind;
  }
  return null;
}

export function inferItemSlotKind(ctx, actId, itemId) {
  if (typeof itemId !== 'string' || itemId.length === 0) return null;
  const act = resolveActRecord(ctx, actId);
  if (!act) return null;
  if (Array.isArray(act.actors) && act.actors.includes(itemId)) {
    return SLOT_KINDS.ACTOR;
  }
  if (Array.isArray(act.props) && act.props.includes(itemId)) {
    return SLOT_KINDS.PROP;
  }
  return null;
}

export function isValidSlotAssignment(ctx, actId, slotKind, itemId) {
  const resolvedKind = resolveSlotKind(ctx, slotKind);
  if (!resolvedKind) return false;
  const itemKind = inferItemSlotKind(ctx, actId, itemId);
  return itemKind !== null && itemKind === resolvedKind;
}

export function createCastingController(ctx, { moodEngine, recordInteraction, ensureBlockingForSeam }) {
  let act1TutorialDone = false;

  function emit(type, payload) {
    ctx?.events?.emit?.(type, payload);
  }

  function resetSlotsForAct(actId) {
    const { leftKind, rightKind } = getActSlotOrder(ctx, actId);
    ctx.state.slots = {
      actorId: null,
      propId: null,
      leftKind,
      rightKind,
    };
    ctx.state.activeTab = TABS.ACTORS;
    ctx.render?.setPreviewPuppet?.(SLOT_KINDS.ACTOR, null);
    ctx.render?.setPreviewPuppet?.(SLOT_KINDS.PROP, null);
  }

  function resetTutorialForNewRun() {
    act1TutorialDone = false;
    ctx.state.tutorialStep = 0;
  }

  function onEnterBlocking({ playVo = true } = {}) {
    const state = ctx.state;
    if (state.actId === 1 && !act1TutorialDone) {
      const hasActor = Boolean(state.slots.actorId);
      const hasProp = Boolean(state.slots.propId);
      if (hasActor && hasProp) {
        state.tutorialStep = 3;
      } else if (hasActor || hasProp) {
        state.tutorialStep = 2;
      } else {
        state.tutorialStep = 1;
        if (playVo) {
          emit('voPlay', { voId: 'vo_tut_cast' });
        }
      }
    } else {
      state.tutorialStep = 0;
    }
  }

  function syncTutorialFromSlots() {
    const state = ctx.state;
    if (state.actId !== 1 || act1TutorialDone) {
      state.tutorialStep = 0;
      return;
    }
    const hasActor = Boolean(state.slots.actorId);
    const hasProp = Boolean(state.slots.propId);
    if (hasActor && hasProp) {
      state.tutorialStep = 3;
    } else if (hasActor || hasProp) {
      state.tutorialStep = 2;
    } else {
      state.tutorialStep = 1;
    }
  }

  function completeTutorial() {
    act1TutorialDone = true;
    ctx.state.tutorialStep = 0;
  }

  function advanceTutorial() {
    const state = ctx.state;
    recordInteraction('ui', 0, 0);
    emit('sfx', { name: 'ui_click' });
    if (state.tutorialStep <= 0) return false;
    if (state.tutorialStep < 3) {
      state.tutorialStep += 1;
    } else {
      completeTutorial();
    }
    return true;
  }

  function selectTab(tab) {
    const state = ctx.state;
    let normalized = null;
    if (tab === TABS.ACTORS || tab === SLOT_KINDS.ACTOR) {
      normalized = TABS.ACTORS;
    } else if (tab === TABS.PROPS || tab === SLOT_KINDS.PROP) {
      normalized = TABS.PROPS;
    }
    if (!normalized) {
      recordInteraction('blocked', 0, 0);
      return false;
    }
    state.activeTab = normalized;
    recordInteraction('ui', 0, 0);
    emit('tabChanged', { tab: normalized });
    emit('sfx', { name: 'tab_flip' });
    return true;
  }

  function hoverSlot(slotKind, itemId = null) {
    const resolvedKind = resolveSlotKind(ctx, slotKind);
    if (!resolvedKind) {
      emit('slotHover', { slotKind: null, valid: false });
      return false;
    }
    const valid = itemId ? isValidSlotAssignment(ctx, ctx.state.actId, resolvedKind, itemId) : true;
    emit('slotHover', { slotKind: resolvedKind, valid });
    return valid;
  }

  function castSlot(slotKind, itemId, source = 'tap') {
    const state = ctx.state;

    // Support object-form call e.g. castSlot({ actorId, propId, slotKind, itemId, source })
    if (slotKind && typeof slotKind === 'object') {
      const payload = slotKind;
      const src = payload.source || itemId || 'seam';
      let ok = false;
      if (payload.slotKind && payload.itemId) {
        ok = castSlot(payload.slotKind, payload.itemId, src) || ok;
      } else if (payload.itemId) {
        ok = autoCastItem(payload.itemId, src) || ok;
      }
      if (payload.actorId) {
        ok = castSlot(SLOT_KINDS.ACTOR, payload.actorId, src) || ok;
      }
      if (payload.propId) {
        ok = castSlot(SLOT_KINDS.PROP, payload.propId, src) || ok;
      }
      return ok;
    }

    const normalizedSource = source === 'drag' || source === 'seam' ? source : 'tap';
    if (normalizedSource === 'seam') {
      ensureBlockingForSeam?.();
    }

    if (state.phase !== 'blocking') {
      recordInteraction('blocked', 0, 0);
      emit('sfx', { name: 'ui_click', pitch: 0.75 });
      return false;
    }

    const resolvedKind = resolveSlotKind(ctx, slotKind);
    if (!resolvedKind || !isValidSlotAssignment(ctx, state.actId, resolvedKind, itemId)) {
      emit('slotHover', { slotKind: resolvedKind, valid: false });
      recordInteraction('blocked', 0, 0);
      emit('sfx', { name: 'ui_click', pitch: 0.72 });
      return false;
    }

    if (resolvedKind === SLOT_KINDS.ACTOR) {
      state.slots.actorId = itemId;
    } else {
      state.slots.propId = itemId;
    }

    recordInteraction('cast', 0, 0);
    syncTutorialFromSlots();
    ctx.render?.setPreviewPuppet?.(resolvedKind, itemId);

    emit('slotCast', {
      actId: state.actId,
      slotKind: resolvedKind,
      itemId,
      source: normalizedSource,
    });
    emit('sfx', { name: 'slot_snap' });

    moodEngine.syncPreview();
    return true;
  }

  function autoCastItem(itemId, source = 'tap') {
    const state = ctx.state;
    const normalizedSource = source === 'drag' || source === 'seam' ? source : 'tap';
    if (normalizedSource === 'seam') {
      ensureBlockingForSeam?.();
    }
    const kind = inferItemSlotKind(ctx, state.actId, itemId);
    if (!kind) {
      recordInteraction('blocked', 0, 0);
      emit('sfx', { name: 'ui_click', pitch: 0.72 });
      return false;
    }
    return castSlot(kind, itemId, normalizedSource);
  }

  function clearSlot(slotKind) {
    const state = ctx.state;
    if (state.phase !== 'blocking') {
      recordInteraction('blocked', 0, 0);
      emit('sfx', { name: 'ui_click', pitch: 0.75 });
      return false;
    }

    const resolvedKind = resolveSlotKind(ctx, slotKind);
    if (!resolvedKind) {
      // Clear both if no specific slotKind passed
      let clearedAny = false;
      if (state.slots.actorId) {
        state.slots.actorId = null;
        ctx.render?.setPreviewPuppet?.(SLOT_KINDS.ACTOR, null);
        emit('slotCleared', { actId: state.actId, slotKind: SLOT_KINDS.ACTOR });
        clearedAny = true;
      }
      if (state.slots.propId) {
        state.slots.propId = null;
        ctx.render?.setPreviewPuppet?.(SLOT_KINDS.PROP, null);
        emit('slotCleared', { actId: state.actId, slotKind: SLOT_KINDS.PROP });
        clearedAny = true;
      }
      recordInteraction(clearedAny ? 'cast' : 'ui', 0, 0);
      emit('sfx', { name: clearedAny ? 'slot_clear' : 'tab_flip' });
      syncTutorialFromSlots();
      moodEngine.syncPreview();
      return true;
    }

    const currentItem =
      resolvedKind === SLOT_KINDS.ACTOR ? state.slots.actorId : state.slots.propId;

    // Tapping an empty stage slot focuses the matching casting tray tab so taps are never dead!
    if (!currentItem) {
      const targetTab = resolvedKind === SLOT_KINDS.ACTOR ? TABS.ACTORS : TABS.PROPS;
      state.activeTab = targetTab;
      recordInteraction('ui', 0, 0);
      emit('tabChanged', { tab: targetTab });
      emit('sfx', { name: 'tab_flip' });
      return true;
    }

    if (resolvedKind === SLOT_KINDS.ACTOR) {
      state.slots.actorId = null;
    } else {
      state.slots.propId = null;
    }

    recordInteraction('cast', 0, 0);
    ctx.render?.setPreviewPuppet?.(resolvedKind, null);
    syncTutorialFromSlots();
    emit('slotCleared', { actId: state.actId, slotKind: resolvedKind });
    emit('sfx', { name: 'slot_clear' });
    moodEngine.syncPreview();
    return true;
  }

  return {
    resetSlotsForAct,
    resetTutorialForNewRun,
    onEnterBlocking,
    syncTutorialFromSlots,
    completeTutorial,
    advanceTutorial,
    selectTab,
    hoverSlot,
    castSlot,
    autoCastItem,
    clearSlot,
  };
}
