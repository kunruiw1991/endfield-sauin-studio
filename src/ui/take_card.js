// Right-Side Filmed Script Card (#take-card-layer) on 'take_result'
// Shows Take title, English narration, Mood Delta badges, NEW TAKE stamp, Reshoot, Next Act / Reveal Ending, Postcard.

import { getTakeThumbnailDataURL } from '../render/chibi_atlas.js';

const MOOD_ICONS = {
  love: '\uD83D\uDC96',
  joy: '\uD83D\uDC30',
  wonder: '\u2728',
  chaos: '\uD83C\uDF00',
};

const MOOD_LABELS = {
  love: 'Love',
  joy: 'Joy',
  wonder: 'Wonder',
  chaos: 'Chaos',
};

export function createTakeCard(ctx, rightColEl, bindTap, helpers) {
  const el = document.createElement('div');
  el.id = 'take-card-layer';
  el.className = 'take-card script-card is-hidden';
  el.hidden = true;

  el.innerHTML = `
    <div class="script-parchment-box">
      <div class="script-header-banner">
        <div id="take-card-act" class="script-act-sub">Act 1 &middot; Take</div>
        <div id="take-card-title" class="script-take-title">The Vanished Sauin</div>
      </div>

      <div id="take-new-stamp" class="new-take-stamp is-hidden" hidden>NEW TAKE UNLOCKED!</div>

      <div id="take-mini-polaroid" class="take-mini-polaroid">
        <img id="take-card-thumb" alt="Filmed Take Preview" src="" />
      </div>

      <p id="take-card-narration" class="script-body-narration"></p>

      <div id="take-card-deltas" class="script-deltas-row"></div>
    </div>

    <div class="take-actions-bottom take-actions-grid">
      <button type="button" id="btn-take-replay" class="sauin-btn btn-replay-accent" data-action="replay-take" aria-label="Replay Stage Take and Voiceover">
        <span>\uD83D\uDD0A Replay Take</span>
      </button>
      <button type="button" id="btn-take-postcard" class="sauin-btn btn-ticket" data-action="save-postcard">
        <span>\uD83D\uDCF8 Postcard</span>
      </button>
      <button type="button" id="btn-reshoot" class="sauin-btn" data-action="reshoot">
        <span>\u21BA Reshoot</span>
      </button>
      <button type="button" id="btn-next-act" class="sauin-btn btn-primary" data-action="next-act">
        <span>Next Act \u25B6</span>
      </button>
    </div>
  `;

  rightColEl.appendChild(el);

  const actSubEl = el.querySelector('#take-card-act');
  const titleEl = el.querySelector('#take-card-title');
  const newStampEl = el.querySelector('#take-new-stamp');
  const thumbImgEl = el.querySelector('#take-card-thumb');
  const narrationEl = el.querySelector('#take-card-narration');
  const deltasRowEl = el.querySelector('#take-card-deltas');
  const btnReplayTake = el.querySelector('#btn-take-replay');
  const btnPostcard = el.querySelector('#btn-take-postcard');
  const btnReshoot = el.querySelector('#btn-reshoot');
  const btnNextAct = el.querySelector('#btn-next-act');

  let lastNewTakeId = '';
  ctx.events?.on?.('takeCompleted', (payload = {}) => {
    if (payload.isNewTake && payload.takeId) {
      lastNewTakeId = payload.takeId;
    }
  });

  bindTap(btnReplayTake, () => {
    helpers.unlockAudio();
    ctx.audio?.setMuted?.({ vo: false });
    ctx.persistence?.saveAudio?.({ voMuted: false });
    ctx.mechanics?.replayTake?.(null, { unmute: true });
    helpers.requestSync();
  });

  bindTap(btnReshoot, () => {
    helpers.unlockAudio();
    ctx.events?.emit?.('sfx', { name: 'ui_click', vol: 0.65 });
    ctx.mechanics?.reshoot?.();
    helpers.requestSync();
  });

  bindTap(btnNextAct, () => {
    helpers.unlockAudio();
    const actId = ctx.state?.actId || 1;
    ctx.events?.emit?.('sfx', { name: 'ui_click', vol: 0.7 });
    if (actId >= 5) {
      ctx.mechanics?.revealEnding?.();
    } else {
      ctx.mechanics?.nextAct?.();
    }
    helpers.requestSync();
  });

  bindTap(btnPostcard, () => {
    helpers.unlockAudio();
    helpers.savePostcard('sauin_take');
  });

  function sync(state) {
    const active = Boolean(state && state.phase === 'take_result');
    el.hidden = !active;
    el.classList.toggle('is-hidden', !active);
    if (!active) return;

    const actId = state.actId || 1;
    const takeState = state.currentTake || null;
    const takeDef =
      (takeState?.takeId && helpers.getTakeById(takeState.takeId)) ||
      helpers.getTake(actId, state.slots?.actorId, state.slots?.propId) ||
      takeState ||
      {};

    const code = takeDef.code || `ACT ${actId} TAKE`;
    actSubEl.textContent = `Act ${actId}/5 \u00B7 ${code}`;
    titleEl.textContent = takeState?.title || takeDef.title || helpers.getAct(actId)?.title || 'Filmed Scene';
    narrationEl.textContent = takeState?.scriptText || takeDef.scriptText || '';

    if (thumbImgEl) {
      try {
        const tSrc = getTakeThumbnailDataURL({
          takeId: takeState?.takeId || takeDef.takeId || `take_${actId}_1`,
          actId,
          actorId: takeDef.actorId || state.slots?.actorId || 'last_rite',
          propId: takeDef.propId || state.slots?.propId || 'sarkaz_mask',
        });
        if (tSrc && thumbImgEl.getAttribute('src') !== tSrc) {
          thumbImgEl.setAttribute('src', tSrc);
        }
      } catch (_err) {
        // Ignore thumbnail render race.
      }
    }

    const isNew = Boolean(
      takeState?.isNewTake || (takeState?.takeId && takeState.takeId === lastNewTakeId)
    );
    newStampEl.hidden = !isNew;
    newStampEl.classList.toggle('is-hidden', !isNew);

    const delta = takeState?.moodDelta || takeDef.moodDelta || {};
    const chips = [];
    for (const k of ['love', 'joy', 'wonder', 'chaos']) {
      const v = Number(delta[k]) || 0;
      if (v > 0) {
        const arrows = v >= 2 ? '^^' : '^';
        chips.push(
          `<span class="script-delta-badge">${MOOD_ICONS[k]} ${MOOD_LABELS[k]} ${arrows} +${v}</span>`
        );
      }
    }
    deltasRowEl.innerHTML = chips.join('');

    if (actId >= 5) {
      btnNextAct.textContent = '\u2728 Reveal Ending';
    } else {
      btnNextAct.textContent = 'Next Act \u25B6';
    }
  }

  return { el, sync };
}
