// Unified pointer, touch, drag-fallback, and keyboard controller
// per docs/DESIGN.md §2.4, §4.5 & Gates G2, G6, G7 (owner: core).

const INTERACTIVE_UI_SELECTOR = [
  'button',
  'a[href]',
  'input',
  'select',
  'textarea',
  'label',
  '[role="button"]',
  '[data-action]',
  '[data-boot-action]',
  '[data-item-id]',
  '[data-cast-id]',
  '[data-card-id]',
  '[data-actor-id]',
  '[data-prop-id]',
  '[data-take-id]',
  '[data-ending-id]',
  '[data-commission-id]',
  '.cast-card',
  '.casting-card',
  '.actor-card',
  '.prop-card',
  '.dialogue-bar',
  '.dialogue-box',
  '.modal-card',
  '.modal-panel',
  '.modal-dialog',
  '.modal-content',
  '.take-card',
  '.script-card',
].join(', ');

function extractDraggedItemInfo(el) {
  if (!el || typeof el.closest !== 'function') return null;
  const card = el.closest(
    '[data-item-id], [data-cast-id], [data-card-id], [data-actor-id], [data-prop-id], .cast-card, .casting-card, .actor-card, .prop-card'
  );
  if (!card) return null;
  const ds = card.dataset || {};
  const itemId = ds.itemId || ds.castId || ds.cardId || ds.actorId || ds.propId || ds.id || null;
  if (!itemId) return null;
  let slotKind = ds.slotKind || ds.kind || null;
  if (!slotKind) {
    if (ds.actorId || card.classList.contains('actor-card')) slotKind = 'actor';
    else if (ds.propId || card.classList.contains('prop-card')) slotKind = 'prop';
  }
  return { itemId, slotKind };
}

export function createInput(ctx) {
  let attached = false;
  let welcomeTriggered = false;
  let lastBootBtnAt = 0;

  const pointerState = {
    down: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    startedOnUI: false,
    draggedCard: null,
    castsAtDown: 0,
    tapsAtDown: 0,
  };

  const aim = { x: 0, y: 0 };

  function markFirstAction() {
    if (ctx.state && ctx.state.feedback && ctx.state.feedback.firstActionMs === null) {
      ctx.state.feedback.firstActionMs = ctx.state.timeMs;
    }
  }

  function unlockAudioFromGesture(allowWelcomeVO = true) {
    ctx.audio?.unlock?.();
    if (!allowWelcomeVO || welcomeTriggered) return;
    welcomeTriggered = true;
    queueMicrotask(() => {
      if (!ctx.state || ctx.state.phase !== 'title' || ctx.state.modal !== null) {
        return;
      }
      const stats = ctx.audio?.getAudioStats?.();
      if (stats && stats.activeVoId) {
        return;
      }
      if (typeof ctx.audio?.playVO === 'function') {
        ctx.audio.playVO('vo_title_welcome');
      } else {
        ctx.events.emit('voPlay', { voId: 'vo_title_welcome' });
      }
    });
  }

  function setNormalizedAim(nx, ny) {
    aim.x = Math.max(-1, Math.min(1, Number(nx) || 0));
    aim.y = Math.max(-1, Math.min(1, Number(ny) || 0));
    ctx.render?.setAim?.(aim.x, aim.y);
    return { x: aim.x, y: aim.y };
  }

  function updateAimFromClient(clientX, clientY) {
    const vw = Math.max(1, window.innerWidth || 1280);
    const vh = Math.max(1, window.innerHeight || 800);
    const nx = (clientX / vw) * 2 - 1;
    const ny = (clientY / vh) * 2 - 1;
    setNormalizedAim(nx, ny);
  }

  function isInteractiveUIElement(target) {
    if (!target || typeof target.closest !== 'function') return false;
    return Boolean(target.closest(INTERACTIVE_UI_SELECTOR));
  }

  function handleBootFallbackAction(action) {
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (now - lastBootBtnAt < 280) return;
    lastBootBtnAt = now;
    markFirstAction();
    ctx.state.feedback.taps += 1;

    if (action === 'start') {
      ctx.mechanics?.startRun?.({ seed: ctx.seed, startAct: 1, skipDialogue: false });
    } else if (action === 'album') {
      ctx.ui?.openModal?.('album');
      if (ctx.state.modal !== 'album') {
        ctx.state.modal = 'album';
        ctx.events.emit('modalOpened', { modal: 'album' });
      }
    } else if (action === 'rewards') {
      ctx.ui?.openModal?.('rewards');
      if (ctx.state.modal !== 'rewards') {
        ctx.state.modal = 'rewards';
        ctx.events.emit('modalOpened', { modal: 'rewards' });
      }
    } else if (action === 'guide') {
      ctx.ui?.openModal?.('guide');
      if (ctx.state.modal !== 'guide') {
        ctx.state.modal = 'guide';
        ctx.events.emit('modalOpened', { modal: 'guide' });
      }
    } else if (action === 'toggle-bgm') {
      const st = ctx.audio?.getAudioStats?.() || {};
      const nextMuted = !st.bgmMuted;
      ctx.audio?.setMuted?.({ bgm: nextMuted });
      ctx.persistence?.saveAudio?.({ bgmMuted: nextMuted });
      const btn = document.getElementById('btn-title-bgm');
      if (btn) btn.textContent = nextMuted ? 'Music: OFF' : 'Music: ON';
    } else if (action === 'toggle-vo') {
      const st = ctx.audio?.getAudioStats?.() || {};
      const nextMuted = !st.voMuted;
      ctx.audio?.setMuted?.({ vo: nextMuted });
      ctx.persistence?.saveAudio?.({ voMuted: nextMuted });
      const btn = document.getElementById('btn-title-vo');
      if (btn) btn.textContent = nextMuted ? 'Voice: OFF' : 'Voice: ON';
    }
    ctx.ui?.sync?.(ctx.state);
    ctx.render?.renderFrame?.();
  }

  function handleStageTap(clientX, clientY) {
    markFirstAction();
    const tapsBefore = ctx.state.feedback.taps;

    // 1. Clicking backdrop outside modal closes active modal cleanly.
    if (ctx.state.modal !== null) {
      const closingModal = ctx.state.modal;
      ctx.ui?.closeModal?.();
      if (ctx.state.modal !== null) {
        ctx.state.modal = null;
        ctx.events.emit('modalClosed', { modal: closingModal });
      }
      if (ctx.state.feedback.taps === tapsBefore) {
        ctx.state.feedback.taps += 1;
      }
      ctx.events.emit('feedback', { kind: 'ui', x: clientX, y: clientY });
      ctx.ui?.sync?.(ctx.state);
      return;
    }

    // 2. Raycast 3D stage slots and interactive background gags.
    const hit = ctx.render?.pickStage?.(clientX, clientY) || { kind: 'stage' };

    if (hit && hit.kind === 'gag' && hit.gagId) {
      ctx.mechanics?.triggerStageGag?.(hit.gagId, clientX, clientY);
      if (ctx.state.feedback.taps === tapsBefore) {
        ctx.state.feedback.taps += 1;
      }
      ctx.ui?.sync?.(ctx.state);
      return;
    }

    if (hit && hit.kind === 'slot' && hit.slotKind && ctx.state.phase === 'blocking') {
      const currentItem =
        hit.slotKind === 'actor' ? ctx.state.slots.actorId : ctx.state.slots.propId;
      if (currentItem) {
        ctx.mechanics?.clearSlot?.(hit.slotKind);
      } else {
        ctx.mechanics?.selectTab?.(hit.slotKind === 'actor' ? 'actors' : 'props');
        ctx.render?.burstParticles?.('sparkle', hit.worldPos || { x: 0, y: 1.1, z: 0 }, 8);
        ctx.events.emit('sfx', { name: 'ui_click', vol: 0.45 });
        ctx.events.emit('feedback', { kind: 'ui', x: clientX, y: clientY });
      }
      if (ctx.state.feedback.taps === tapsBefore) {
        ctx.state.feedback.taps += 1;
      }
      ctx.ui?.sync?.(ctx.state);
      return;
    }

    // 3. During pre-shoot dialogue, tapping the stage advances dialogue.
    if (ctx.state.phase === 'dialogue') {
      ctx.mechanics?.advanceDialogue?.();
      if (ctx.state.feedback.taps === tapsBefore) {
        ctx.state.feedback.taps += 1;
      }
      ctx.ui?.sync?.(ctx.state);
      return;
    }

    // 4. Open stage tap: always provide responsive theatrical lantern sparkle + soft audio feedback
    // so zero stage taps are ever dead (Gate G7).
    const burstPos = hit?.worldPos || { x: aim.x * 1.8, y: 1.2 - aim.y * 0.6, z: 0 };
    ctx.render?.burstParticles?.('sparkle', burstPos, 6);
    ctx.state.feedback.taps += 1;
    ctx.events.emit('sfx', { name: 'ui_click', vol: 0.3 });
    ctx.events.emit('feedback', { kind: 'ui', x: clientX, y: clientY });
    ctx.ui?.sync?.(ctx.state);
  }

  function onPointerDown(e) {
    if (e.button !== undefined && e.button !== 0) return;
    unlockAudioFromGesture(true);
    markFirstAction();
    updateAimFromClient(e.clientX, e.clientY);

    pointerState.down = true;
    pointerState.pointerId = e.pointerId ?? 1;
    pointerState.startX = e.clientX;
    pointerState.startY = e.clientY;
    pointerState.lastX = e.clientX;
    pointerState.lastY = e.clientY;
    pointerState.startedOnUI = isInteractiveUIElement(e.target);
    pointerState.draggedCard = extractDraggedItemInfo(e.target);
    pointerState.castsAtDown = ctx.state.feedback.casts;
    pointerState.tapsAtDown = ctx.state.feedback.taps;
  }

  function onPointerMove(e) {
    updateAimFromClient(e.clientX, e.clientY);
    if (!pointerState.down) return;
    pointerState.lastX = e.clientX;
    pointerState.lastY = e.clientY;
  }

  function onPointerUp(e) {
    if (e.button !== undefined && e.button !== 0) return;
    updateAimFromClient(e.clientX, e.clientY);

    const wasDown = pointerState.down;
    const dx = e.clientX - pointerState.startX;
    const dy = e.clientY - pointerState.startY;
    const movedDist = Math.hypot(dx, dy);
    const draggedCard = pointerState.draggedCard;
    const castsAtDown = pointerState.castsAtDown;
    const tapsAtDown = pointerState.tapsAtDown;
    const startedOnUI = pointerState.startedOnUI;

    pointerState.down = false;
    pointerState.draggedCard = null;

    // Handle static fallback boot buttons if still mounted in DOM.
    const bootBtn = e.target && typeof e.target.closest === 'function'
      ? e.target.closest('[data-boot-action]')
      : null;
    if (bootBtn && movedDist < 16) {
      handleBootFallbackAction(bootBtn.getAttribute('data-boot-action'));
      return;
    }

    // Defer post-UI check to microtask so @ui-hud pointerup/click handlers execute first.
    queueMicrotask(() => {
      // Case 1: Drag-and-drop fallback onto 3D stage pedestals if UI drag_cast did not already cast.
      if (
        wasDown &&
        draggedCard &&
        movedDist >= 12 &&
        ctx.state.phase === 'blocking' &&
        ctx.state.feedback.casts === castsAtDown
      ) {
        const hit = ctx.render?.pickStage?.(e.clientX, e.clientY);
        let dropSlotKind = hit && hit.kind === 'slot' ? hit.slotKind : null;
        if (!dropSlotKind) {
          const vw = Math.max(1, window.innerWidth || 1280);
          const vh = Math.max(1, window.innerHeight || 800);
          if (
            e.clientX >= vw * 0.14 &&
            e.clientX <= vw * 0.72 &&
            e.clientY >= vh * 0.14 &&
            e.clientY <= vh * 0.86
          ) {
            dropSlotKind =
              e.clientX < vw * 0.44 ? ctx.state.slots.leftKind : ctx.state.slots.rightKind;
          }
        }
        if (dropSlotKind) {
          const expectedKind = draggedCard.slotKind;
          if (!expectedKind || expectedKind === dropSlotKind) {
            ctx.mechanics?.castSlot?.(dropSlotKind, draggedCard.itemId, 'drag');
          } else {
            ctx.events.emit('feedback', { kind: 'blocked', x: e.clientX, y: e.clientY });
          }
          if (ctx.state.feedback.taps === tapsAtDown) {
            ctx.state.feedback.taps += 1;
          }
          ctx.ui?.sync?.(ctx.state);
          return;
        }
      }

      // Case 2: Interactive UI button/card tap — ensure tap counter reflects valid UI interaction.
      if (startedOnUI || isInteractiveUIElement(e.target)) {
        if (movedDist < 16 && ctx.state.feedback.taps === tapsAtDown) {
          ctx.state.feedback.taps += 1;
        }
        ctx.ui?.sync?.(ctx.state);
        return;
      }

      // Case 3: 3D Stage / Slot / Gag / Backdrop tap.
      if (movedDist < 14) {
        handleStageTap(e.clientX, e.clientY);
      }
    });
  }

  function onKeyDown(e) {
    if (!e || e.altKey || e.ctrlKey || e.metaKey) return;
    const tag = e.target && e.target.tagName ? e.target.tagName.toLowerCase() : '';
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

    const isReplayKey = e.key === 'r' || e.key === 'R';
    unlockAudioFromGesture(!isReplayKey);

    if (e.key === 'Escape') {
      if (ctx.state.modal !== null) {
        e.preventDefault();
        markFirstAction();
        const closingModal = ctx.state.modal;
        ctx.ui?.closeModal?.();
        if (ctx.state.modal !== null) {
          ctx.state.modal = null;
          ctx.events.emit('modalClosed', { modal: closingModal });
        }
        ctx.state.feedback.taps += 1;
        ctx.ui?.sync?.(ctx.state);
      }
      return;
    }

    if (isReplayKey) {
      const m = ctx.state.modal;
      if (m === null || m === 'log' || m === 'dialogue_log' || m === 'album') {
        e.preventDefault();
        markFirstAction();
        ctx.state.feedback.taps += 1;
        ctx.mechanics?.replayCurrent?.();
        if (ctx.audio?.getAudioStats?.()?.voMuted === false) {
          ctx.persistence?.saveAudio?.({ voMuted: false });
        }
        ctx.ui?.sync?.(ctx.state);
      }
      return;
    }

    if (ctx.state.modal !== null) return;

    if (e.key === ' ' || e.code === 'Space' || e.key === 'Enter') {
      e.preventDefault();
      markFirstAction();
      ctx.state.feedback.taps += 1;
      const phase = ctx.state.phase;
      if (phase === 'title') {
        ctx.mechanics?.startRun?.({ seed: ctx.seed, startAct: 1, skipDialogue: false });
      } else if (phase === 'dialogue') {
        ctx.mechanics?.advanceDialogue?.();
      } else if (phase === 'blocking') {
        if (ctx.state.slots.actorId && ctx.state.slots.propId) {
          ctx.mechanics?.rollCamera?.();
        }
      } else if (phase === 'take_result') {
        if (ctx.state.actId >= 5) {
          ctx.mechanics?.revealEnding?.();
        } else {
          ctx.mechanics?.nextAct?.();
        }
      }
      ctx.ui?.sync?.(ctx.state);
      return;
    }

    if (ctx.state.phase === 'blocking') {
      const act = ctx.levels?.ACTS?.[ctx.state.actId];
      if (!act) return;
      if (e.key === '1' || e.key === '2') {
        const actorId = act.actors?.[e.key === '1' ? 0 : 1];
        if (actorId) {
          e.preventDefault();
          markFirstAction();
          ctx.mechanics?.castSlot?.('actor', actorId, 'tap');
          ctx.ui?.sync?.(ctx.state);
        }
      } else if (e.key === '3' || e.key === '4') {
        const propId = act.props?.[e.key === '3' ? 0 : 1];
        if (propId) {
          e.preventDefault();
          markFirstAction();
          ctx.mechanics?.castSlot?.('prop', propId, 'tap');
          ctx.ui?.sync?.(ctx.state);
        }
      }
    }
  }

  function dispatchSyntheticPointer(eventType, clientX = 640, clientY = 400) {
    const x = Number(clientX) || 0;
    const y = Number(clientY) || 0;
    const getTarget = () =>
      (typeof document !== 'undefined' && document.elementFromPoint(x, y)) ||
      (typeof document !== 'undefined' ? document.body : null);

    const fire = (pType, mType, buttons) => {
      const target = getTarget();
      if (!target) return;
      if (typeof PointerEvent === 'function') {
        target.dispatchEvent(
          new PointerEvent(pType, {
            bubbles: true,
            cancelable: true,
            composed: true,
            pointerId: 1,
            pointerType: 'mouse',
            isPrimary: true,
            clientX: x,
            clientY: y,
            button: 0,
            buttons,
          })
        );
      }
      if (mType && typeof MouseEvent === 'function') {
        target.dispatchEvent(
          new MouseEvent(mType, {
            bubbles: true,
            cancelable: true,
            composed: true,
            clientX: x,
            clientY: y,
            button: 0,
            buttons,
          })
        );
      }
    };

    if (eventType === 'down' || eventType === 'pointerdown') {
      fire('pointerdown', 'mousedown', 1);
    } else if (eventType === 'move' || eventType === 'pointermove') {
      fire('pointermove', 'mousemove', pointerState.down ? 1 : 0);
    } else if (eventType === 'up' || eventType === 'pointerup') {
      fire('pointerup', 'mouseup', 0);
    } else if (eventType === 'tap' || eventType === 'click') {
      fire('pointerdown', 'mousedown', 1);
      fire('pointerup', 'mouseup', 0);
      const target = getTarget();
      if (target && typeof MouseEvent === 'function') {
        target.dispatchEvent(
          new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            composed: true,
            clientX: x,
            clientY: y,
            button: 0,
            buttons: 0,
          })
        );
      }
    }
  }

  function attach() {
    if (attached || typeof window === 'undefined') return;
    attached = true;
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerup', onPointerUp, { passive: true });
    window.addEventListener('keydown', onKeyDown);
  }

  function detach() {
    if (!attached || typeof window === 'undefined') return;
    attached = false;
    window.removeEventListener('pointerdown', onPointerDown);
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('keydown', onKeyDown);
  }

  return {
    attach,
    detach,
    setNormalizedAim,
    dispatchSyntheticPointer,
    getAim: () => ({ ...aim }),
  };
}
