// Film Album Modal (album_modal.js) — 20/20 Stage Takes (Act 1-5 tabs) + 5/5 Endings tab
// Zero scrollbars across all 5 viewports, illustrated Polaroid thumbnails, mystery mood >= 6 hints, 1-tap Replay VO!

import { getTakeThumbnailDataURL } from '../render/chibi_atlas.js';
import { getEndingDataURL } from '../render/ending_illustrations.js';

const ENDING_IDS = ['END1', 'END2', 'END3', 'END4', 'END5'];

const DEFAULT_ENDING_HINTS = {
  END1: 'Hint: Keep all four Studio Moods below 6 across Acts 1-5.',
  END2: 'Hint: Reach Love >= 6 as your highest Studio Mood.',
  END3: 'Hint: Reach Joy >= 6 as your highest Studio Mood.',
  END4: 'Hint: Reach Wonder >= 6 as your highest Studio Mood.',
  END5: 'Hint: Reach Chaos >= 6 as your highest Studio Mood.',
};

export function createAlbumModal(ctx, modalMountEl, bindTap, helpers) {
  const el = document.createElement('div');
  el.id = 'album-modal';
  el.className = 'sauin-modal-card modal-card modal-panel is-hidden';
  el.hidden = true;
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-label', 'Sauin Film Album');

  el.innerHTML = `
    <div class="modal-header-bar">
      <div class="modal-title-group">
        <h2>\uD83C\uDF9E Sauin Film Album</h2>
        <span id="album-takes-counter" class="modal-counter-pill">Takes: 0/20</span>
        <span id="album-endings-counter" class="modal-counter-pill">Endings: 0/5</span>
      </div>
      <div class="modal-header-actions">
        <button type="button" id="btn-album-close" class="sauin-btn btn-icon-pill" data-action="close-modal">
          <span>\u2715 Close</span>
        </button>
      </div>
    </div>

    <div id="album-tabs-bar" class="album-tabs-bar" role="tablist">
      <button type="button" class="sauin-btn album-tab-btn is-active" data-album-tab="1">Act 1</button>
      <button type="button" class="sauin-btn album-tab-btn" data-album-tab="2">Act 2</button>
      <button type="button" class="sauin-btn album-tab-btn" data-album-tab="3">Act 3</button>
      <button type="button" class="sauin-btn album-tab-btn" data-album-tab="4">Act 4</button>
      <button type="button" class="sauin-btn album-tab-btn" data-album-tab="5">Act 5</button>
      <button type="button" class="sauin-btn album-tab-btn" data-album-tab="endings">Endings</button>
    </div>

    <div id="album-content-area" class="album-content-area"></div>
  `;

  modalMountEl.appendChild(el);

  const takesCounterEl = el.querySelector('#album-takes-counter');
  const endingsCounterEl = el.querySelector('#album-endings-counter');
  const btnClose = el.querySelector('#btn-album-close');
  const tabBtns = Array.from(el.querySelectorAll('[data-album-tab]'));
  const contentArea = el.querySelector('#album-content-area');

  let currentTab = '1';
  let lastRenderSig = '';

  bindTap(btnClose, () => {
    helpers.unlockAudio();
    ctx.events?.emit?.('sfx', { name: 'ui_click', vol: 0.6 });
    helpers.closeModal();
  });

  for (const btn of tabBtns) {
    bindTap(btn, () => {
      helpers.unlockAudio();
      ctx.events?.emit?.('sfx', { name: 'tab_flip', vol: 0.55 });
      currentTab = btn.getAttribute('data-album-tab') || '1';
      lastRenderSig = '';
      helpers.requestSync();
    });
  }

  function bindReplayButtons() {
    const replayBtns = Array.from(contentArea.querySelectorAll('[data-replay-vo]'));
    for (const btn of replayBtns) {
      bindTap(btn, () => {
        helpers.unlockAudio();
        const voId = btn.getAttribute('data-replay-vo');
        if (voId) {
          ctx.audio?.setMuted?.({ vo: false });
          ctx.persistence?.saveAudio?.({ voMuted: false });
          if (typeof ctx.audio?.playVO === 'function') {
            ctx.audio.playVO(voId, { force: true, unmute: true });
          } else {
            ctx.events?.emit?.('voPlay', { voId, force: true, unmute: true });
          }
          helpers.requestSync();
        }
      });
    }
  }

  function renderActTakes(actNum, unlockedTakesSet) {
    const cards = [];
    for (let idx = 1; idx <= 4; idx++) {
      const takeId = `take_${actNum}_${idx}`;
      const take = helpers.getTakeById(takeId) || {};
      const unlocked = unlockedTakesSet.has(takeId);
      const actorName = helpers.getItemName(take.actorId);
      const propName = helpers.getItemName(take.propId);

      if (unlocked) {
        const badges = [];
        const md = take.moodDelta || {};
        for (const k of ['love', 'joy', 'wonder', 'chaos']) {
          if ((md[k] || 0) > 0) {
            badges.push(`${k[0].toUpperCase() + k.slice(1)} +${md[k]}`);
          }
        }
        let thumbSrc = '';
        try {
          thumbSrc = getTakeThumbnailDataURL({
            takeId,
            actId: actNum,
            actorId: take.actorId,
            propId: take.propId,
          });
        } catch (_err) {
          thumbSrc = '';
        }
        cards.push(`
          <div class="album-entry-card has-thumb" data-take-id="${takeId}">
            <div class="album-thumb-wrap">
              ${thumbSrc ? `<img class="album-thumb-img" src="${thumbSrc}" alt="${helpers.escapeHtml(take.title || takeId)}" />` : ''}
            </div>
            <div class="album-entry-main">
              <div class="album-entry-top">
                <span class="album-entry-title">${helpers.escapeHtml(take.title || takeId)}</span>
                <span class="album-hint-tag">${helpers.escapeHtml(badges.join(' \u00B7 '))}</span>
              </div>
              <p class="album-entry-desc">${helpers.escapeHtml(take.scriptText || '')}</p>
              <div class="album-entry-footer">
                <span class="album-hint-tag">${helpers.escapeHtml(actorName)} + ${helpers.escapeHtml(propName)}</span>
                <button type="button" class="sauin-btn btn-icon-pill" data-replay-vo="${helpers.escapeHtml(take.voId || '')}">
                  <span>\uD83D\uDD0A Replay VO</span>
                </button>
              </div>
            </div>
          </div>
        `);
      } else {
        cards.push(`
          <div class="album-entry-card has-thumb is-locked" data-take-id="${takeId}">
            <div class="album-thumb-wrap is-locked-thumb" aria-hidden="true">
              <span class="locked-reel-icon">\uD83C\uDF9E</span>
              <span class="locked-reel-code">${actNum}-${idx}</span>
            </div>
            <div class="album-entry-main">
              <div class="album-entry-top">
                <span class="album-entry-title">\uD83D\uDD12 Unfilmed Take (${actNum}-${idx})</span>
              </div>
              <p class="album-entry-desc">Cast ${helpers.escapeHtml(actorName)} with ${helpers.escapeHtml(propName)} in Act ${actNum} to record this scene.</p>
              <div class="album-entry-footer">
                <span class="album-hint-tag">Locked Reel</span>
              </div>
            </div>
          </div>
        `);
      }
    }
    contentArea.innerHTML = `<div class="album-takes-grid">${cards.join('')}</div>`;
    bindReplayButtons();
  }

  function renderEndings(unlockedEndingsSet) {
    const cards = ENDING_IDS.map((eid) => {
      const endDef = helpers.getEnding(eid) || {};
      const unlocked = unlockedEndingsSet.has(eid);
      const code = endDef.code || `//${eid}`;
      const hint = endDef.unlockHint || endDef.triggerRule || DEFAULT_ENDING_HINTS[eid] || '';

      if (unlocked) {
        let endSrc = '';
        try {
          endSrc = getEndingDataURL(eid);
        } catch (_err) {
          endSrc = '';
        }
        return `
          <div class="album-entry-card has-thumb is-ending-card" data-ending-id="${eid}">
            <div class="album-thumb-wrap is-ending-thumb">
              ${endSrc ? `<img class="album-thumb-img" src="${endSrc}" alt="${helpers.escapeHtml(endDef.title || eid)}" />` : ''}
            </div>
            <div class="album-entry-main">
              <div class="album-entry-top">
                <span class="album-entry-title">${helpers.escapeHtml(code)} ${helpers.escapeHtml(endDef.title || eid)}</span>
              </div>
              <p class="album-entry-desc">${helpers.escapeHtml(endDef.bodyText || '')}</p>
              <div class="album-entry-footer">
                <span class="album-hint-tag">${helpers.escapeHtml(endDef.triggerRule || '')}</span>
                <button type="button" class="sauin-btn btn-icon-pill" data-replay-vo="${helpers.escapeHtml(endDef.voId || '')}">
                  <span>\uD83D\uDD0A Replay VO</span>
                </button>
              </div>
            </div>
          </div>
        `;
      }
      return `
        <div class="album-entry-card has-thumb is-ending-card is-locked" data-ending-id="${eid}">
          <div class="album-thumb-wrap is-locked-thumb" aria-hidden="true">
            <span class="locked-reel-icon">\uD83D\uDD12</span>
            <span class="locked-reel-code">${helpers.escapeHtml(code)}</span>
          </div>
          <div class="album-entry-main">
            <div class="album-entry-top">
              <span class="album-entry-title">\uD83D\uDD12 ${helpers.escapeHtml(code)} Mystery Ending</span>
            </div>
            <p class="album-entry-desc">${helpers.escapeHtml(hint)}</p>
            <div class="album-entry-footer">
              <span class="album-hint-tag">${helpers.escapeHtml(endDef.triggerRule || 'Mood Threshold >= 6')}</span>
            </div>
          </div>
        </div>
      `;
    });

    contentArea.innerHTML = `<div class="album-endings-grid">${cards.join('')}</div>`;
    bindReplayButtons();
  }

  function sync(state) {
    const open = state?.modal === 'album';
    el.hidden = !open;
    el.classList.toggle('is-hidden', !open);
    if (!open) return;

    const prog = state?.progress || {};
    const unlockedTakes = Array.isArray(prog.unlockedTakes) ? prog.unlockedTakes : [];
    const unlockedEndings = Array.isArray(prog.unlockedEndings) ? prog.unlockedEndings : [];

    takesCounterEl.textContent = `Stage Takes: ${unlockedTakes.length}/20`;
    endingsCounterEl.textContent = `Endings: ${unlockedEndings.length}/5`;

    for (const btn of tabBtns) {
      const isAct = btn.getAttribute('data-album-tab') === currentTab;
      btn.classList.toggle('is-active', isAct);
    }

    const sig = `${currentTab}|${unlockedTakes.join(',')}|${unlockedEndings.join(',')}`;
    if (sig === lastRenderSig) return;
    lastRenderSig = sig;

    if (currentTab === 'endings') {
      renderEndings(new Set(unlockedEndings));
    } else {
      renderActTakes(Number(currentTab) || 1, new Set(unlockedTakes));
    }
  }

  return { el, sync };
}
