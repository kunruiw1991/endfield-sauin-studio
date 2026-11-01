// Dual Drag-and-Drop + 1-Tap Parchment Casting Tray (drag_cast.js)
// Actors & Props tabs, crisp chibi/prop portraits, floating ghost card, Roll Camera CTA (owner: @ui-hud).

import { getPortraitDataURL } from '../render/chibi_atlas.js';

export function createDragCast(ctx, rightColEl, rootEl, stageHud, bindTap, helpers) {
  const el = document.createElement('div');
  el.id = 'drag-cast';
  el.className = 'drag-cast';

  el.innerHTML = `
    <div class="cast-tabs-row" role="tablist" aria-label="Casting Categories">
      <button type="button" id="tab-actors" class="sauin-btn cast-tab-btn is-active" role="tab" data-tab="actors" aria-selected="true">
        <span>Actors</span>
      </button>
      <button type="button" id="tab-props" class="sauin-btn cast-tab-btn" role="tab" data-tab="props" aria-selected="false">
        <span>Props</span>
      </button>
    </div>

    <div class="cast-parchment-box">
      <div id="cast-cards-grid" class="cast-cards-grid">
        <button type="button" id="cast-card-0" class="cast-card" data-index="0">
          <span class="cast-card-status is-hidden" hidden>ON MARK</span>
          <span class="cast-card-art"><img alt="" src="" /></span>
          <span class="cast-card-label">Actor 1</span>
        </button>
        <button type="button" id="cast-card-1" class="cast-card" data-index="1">
          <span class="cast-card-status is-hidden" hidden>ON MARK</span>
          <span class="cast-card-art"><img alt="" src="" /></span>
          <span class="cast-card-label">Actor 2</span>
        </button>
      </div>
    </div>

    <button type="button" id="btn-roll-camera" class="sauin-btn btn-primary not-ready" data-action="roll-camera">
      <span>\uD83C\uDFAC Roll Camera!</span>
    </button>
  `;

  rightColEl.appendChild(el);

  const ghostEl = document.createElement('div');
  ghostEl.id = 'drag-ghost';
  ghostEl.className = 'is-hidden';
  ghostEl.hidden = true;
  ghostEl.innerHTML = `
    <img id="drag-ghost-img" alt="" src="" />
    <div id="drag-ghost-name" class="ghost-name"></div>
  `;
  rootEl.appendChild(ghostEl);

  const ghostImg = ghostEl.querySelector('#drag-ghost-img');
  const ghostName = ghostEl.querySelector('#drag-ghost-name');
  const tabActorsBtn = el.querySelector('#tab-actors');
  const tabPropsBtn = el.querySelector('#tab-props');
  const cardBtns = [el.querySelector('#cast-card-0'), el.querySelector('#cast-card-1')];
  const btnRoll = el.querySelector('#btn-roll-camera');

  bindTap(tabActorsBtn, () => {
    helpers.unlockAudio();
    ctx.events?.emit?.('sfx', { name: 'tab_flip', vol: 0.6 });
    if (typeof ctx.mechanics?.selectTab === 'function') {
      ctx.mechanics.selectTab('actors');
    } else if (ctx.state) {
      ctx.state.activeTab = 'actors';
    }
    helpers.requestSync();
  });

  bindTap(tabPropsBtn, () => {
    helpers.unlockAudio();
    ctx.events?.emit?.('sfx', { name: 'tab_flip', vol: 0.6 });
    if (typeof ctx.mechanics?.selectTab === 'function') {
      ctx.mechanics.selectTab('props');
    } else if (ctx.state) {
      ctx.state.activeTab = 'props';
    }
    helpers.requestSync();
  });

  bindTap(btnRoll, (e) => {
    helpers.unlockAudio();
    const st = ctx.state;
    const ready = Boolean(st?.slots?.actorId && st?.slots?.propId);
    if (!ready) {
      ctx.events?.emit?.('sfx', { name: 'ui_click', vol: 0.5 });
      ctx.events?.emit?.('feedback', {
        kind: 'blocked',
        x: e?.clientX ?? 640,
        y: e?.clientY ?? 400,
      });
      helpers.showToast('Set 1 Actor and 1 Prop onto the stage marks first!');
      return;
    }
    ctx.events?.emit?.('sfx', { name: 'clapper_snap', vol: 0.75 });
    ctx.mechanics?.rollCamera?.();
    helpers.requestSync();
  });

  // Pointer drag-and-drop + 1-tap cast state machine
  const drag = {
    active: false,
    dragging: false,
    pointerId: null,
    cardEl: null,
    itemId: '',
    kind: 'actor',
    startX: 0,
    startY: 0,
    handledUpTs: -999,
    handledCardEl: null,
  };

  function performTapCast(itemId, kind) {
    if (!itemId) return;
    helpers.unlockAudio();
    let ok = false;
    if (typeof ctx.mechanics?.autoCastItem === 'function') {
      ok = Boolean(ctx.mechanics.autoCastItem(itemId, 'tap'));
    }
    const st = ctx.state;
    const curInSlot = kind === 'actor' ? st?.slots?.actorId : st?.slots?.propId;
    if (!ok && curInSlot !== itemId) {
      ctx.mechanics?.castSlot?.(kind, itemId, 'tap');
    }
    helpers.requestSync();
  }

  function finishDragCleanup() {
    if (drag.cardEl && drag.pointerId !== null) {
      try {
        if (drag.cardEl.hasPointerCapture?.(drag.pointerId)) {
          drag.cardEl.releasePointerCapture(drag.pointerId);
        }
      } catch (_err) {
        // Ignore capture release errors.
      }
    }
    drag.active = false;
    drag.dragging = false;
    drag.pointerId = null;
    drag.cardEl = null;
    ghostEl.hidden = true;
    ghostEl.classList.add('is-hidden');
    ctx.events?.emit?.('slotHover', { slotKind: null, valid: false });
  }

  for (const card of cardBtns) {
    card.addEventListener('pointerdown', (e) => {
      if (e.button !== undefined && e.button !== 0) return;
      const itemId = card.dataset.itemId || '';
      const kind = card.dataset.kind || 'actor';
      if (!itemId || ctx.state?.phase !== 'blocking') return;

      helpers.unlockAudio();
      drag.active = true;
      drag.dragging = false;
      drag.pointerId = e.pointerId;
      drag.cardEl = card;
      drag.itemId = itemId;
      drag.kind = kind;
      drag.startX = e.clientX;
      drag.startY = e.clientY;
      drag.handledCardEl = null;

      try {
        card.setPointerCapture?.(e.pointerId);
      } catch (_err) {
        // Synthetic pointer events may not have an active browser pointerId; safe to ignore.
      }
    });

    card.addEventListener('pointermove', (e) => {
      if (!drag.active || drag.cardEl !== card) return;
      const dist = Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY);
      if (!drag.dragging && dist >= 10) {
        drag.dragging = true;
        ctx.events?.emit?.('sfx', { name: 'card_pickup', vol: 0.55 });
        try {
          ghostImg.src = getPortraitDataURL(drag.itemId, 'happy');
        } catch (_err) {
          // Ignore portrait error.
        }
        ghostName.textContent = helpers.getItemName(drag.itemId);
        ghostEl.hidden = false;
        ghostEl.classList.remove('is-hidden');
      }

      if (drag.dragging) {
        ghostEl.style.left = `${e.clientX}px`;
        ghostEl.style.top = `${e.clientY}px`;
        const hitKind = stageHud.getSlotHitKind(e.clientX, e.clientY);
        ctx.events?.emit?.('slotHover', {
          slotKind: hitKind,
          valid: Boolean(hitKind && hitKind === drag.kind),
        });
      }
    });

    const handleCardPointerUp = (e) => {
      if (!drag.active || drag.cardEl !== card) return;
      const wasDragging = drag.dragging;
      const itemId = drag.itemId;
      const kind = drag.kind;
      const dist = Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY);

      finishDragCleanup();
      drag.handledCardEl = card;
      drag.handledUpTs = typeof performance !== 'undefined' ? performance.now() : Date.now();

      if (!wasDragging && dist < 12) {
        performTapCast(itemId, kind);
        return;
      }

      const hitKind = stageHud.getSlotHitKind(e.clientX, e.clientY);
      if (hitKind === kind) {
        ctx.mechanics?.castSlot?.(kind, itemId, 'drag');
        helpers.requestSync();
      } else if (hitKind && hitKind !== kind) {
        ctx.events?.emit?.('sfx', { name: 'slot_clear', vol: 0.5 });
        ctx.events?.emit?.('feedback', { kind: 'blocked', x: e.clientX, y: e.clientY });
        helpers.showToast(
          `Place ${helpers.getItemName(itemId)} on the ${kind === 'actor' ? 'Actor' : 'Prop'} mark!`
        );
      }
    };

    card.addEventListener('pointerup', handleCardPointerUp);
    card.addEventListener('pointercancel', () => finishDragCleanup());

    // Keyboard / synthetic el.click() fallback (skipped when pointerup already handled it)
    card.addEventListener('click', () => {
      const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
      if (drag.handledCardEl === card && now - drag.handledUpTs < 280) {
        drag.handledCardEl = null;
        return;
      }
      const itemId = card.dataset.itemId || '';
      const kind = card.dataset.kind || 'actor';
      if (itemId && ctx.state?.phase === 'blocking') {
        performTapCast(itemId, kind);
      }
    });
  }

  // Also listen on window for pointermove/pointerup in case synthetic mouse/pointer events don't use pointer capture
  window.addEventListener('pointermove', (e) => {
    if (!drag.active || !drag.cardEl) return;
    if (e.target === drag.cardEl || drag.cardEl.contains?.(e.target)) return;
    const dist = Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY);
    if (!drag.dragging && dist >= 10) {
      drag.dragging = true;
      try {
        ghostImg.src = getPortraitDataURL(drag.itemId, 'happy');
      } catch (_err) {
        // Ignore portrait error.
      }
      ghostName.textContent = helpers.getItemName(drag.itemId);
      ghostEl.hidden = false;
      ghostEl.classList.remove('is-hidden');
    }
    if (drag.dragging) {
      ghostEl.style.left = `${e.clientX}px`;
      ghostEl.style.top = `${e.clientY}px`;
      const hitKind = stageHud.getSlotHitKind(e.clientX, e.clientY);
      ctx.events?.emit?.('slotHover', {
        slotKind: hitKind,
        valid: Boolean(hitKind && hitKind === drag.kind),
      });
    }
  });

  window.addEventListener('pointerup', (e) => {
    if (!drag.active || !drag.cardEl) return;
    if (e.target === drag.cardEl || drag.cardEl.contains?.(e.target)) return;
    const card = drag.cardEl;
    const wasDragging = drag.dragging;
    const itemId = drag.itemId;
    const kind = drag.kind;
    const dist = Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY);

    finishDragCleanup();
    drag.handledCardEl = card;
    drag.handledUpTs = typeof performance !== 'undefined' ? performance.now() : Date.now();

    if (!wasDragging && dist < 12) {
      performTapCast(itemId, kind);
      return;
    }

    const hitKind = stageHud.getSlotHitKind(e.clientX, e.clientY);
    if (hitKind === kind) {
      ctx.mechanics?.castSlot?.(kind, itemId, 'drag');
      helpers.requestSync();
    } else if (hitKind && hitKind !== kind) {
      ctx.events?.emit?.('sfx', { name: 'slot_clear', vol: 0.5 });
      ctx.events?.emit?.('feedback', { kind: 'blocked', x: e.clientX, y: e.clientY });
      helpers.showToast(
        `Place ${helpers.getItemName(itemId)} on the ${kind === 'actor' ? 'Actor' : 'Prop'} mark!`
      );
    }
  });

  const renderedImgs = ['', ''];

  function sync(state) {
    const isBlocking = Boolean(state && state.phase === 'blocking');
    el.hidden = !isBlocking;
    el.classList.toggle('is-hidden', !isBlocking);
    if (!isBlocking) {
      if (drag.active) finishDragCleanup();
      return;
    }

    const act = helpers.getAct(state.actId || 1);
    const activeTab = state.activeTab === 'props' ? 'props' : 'actors';
    const isActors = activeTab === 'actors';

    tabActorsBtn.classList.toggle('is-active', isActors);
    tabActorsBtn.setAttribute('aria-selected', isActors ? 'true' : 'false');
    tabPropsBtn.classList.toggle('is-active', !isActors);
    tabPropsBtn.setAttribute('aria-selected', !isActors ? 'true' : 'false');

    const items = isActors ? act?.actors || [] : act?.props || [];
    const kind = isActors ? 'actor' : 'prop';
    const slottedId = isActors ? state.slots?.actorId : state.slots?.propId;

    for (let i = 0; i < 2; i++) {
      const card = cardBtns[i];
      const itemId = items[i] || '';
      if (!itemId) {
        card.hidden = true;
        card.classList.add('is-hidden');
        continue;
      }
      card.hidden = false;
      card.classList.remove('is-hidden');

      card.dataset.itemId = itemId;
      card.dataset.id = itemId;
      card.dataset.castId = itemId;
      card.dataset.kind = kind;
      if (isActors) {
        card.dataset.actorId = itemId;
        delete card.dataset.propId;
        card.classList.add('actor-card');
        card.classList.remove('prop-card');
      } else {
        card.dataset.propId = itemId;
        delete card.dataset.actorId;
        card.classList.add('prop-card');
        card.classList.remove('actor-card');
      }

      const name = helpers.getItemName(itemId);
      const isSlotted = slottedId === itemId;
      card.classList.toggle('is-slotted', isSlotted);

      const statusBadge = card.querySelector('.cast-card-status');
      const labelEl = card.querySelector('.cast-card-label');
      const imgEl = card.querySelector('img');

      if (labelEl) labelEl.textContent = name;
      if (statusBadge) {
        statusBadge.hidden = !isSlotted;
        statusBadge.classList.toggle('is-hidden', !isSlotted);
      }

      if (imgEl && renderedImgs[i] !== itemId) {
        renderedImgs[i] = itemId;
        try {
          imgEl.src = getPortraitDataURL(itemId, 'neutral');
          imgEl.alt = name;
        } catch (_err) {
          // Ignore portrait error.
        }
      }
    }

    const bothReady = Boolean(state.slots?.actorId && state.slots?.propId);
    btnRoll.classList.toggle('is-ready', bothReady);
    btnRoll.classList.toggle('not-ready', !bothReady);
  }

  return { el, sync };
}
