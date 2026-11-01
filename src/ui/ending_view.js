// Bat-Winged 35mm Ending Polaroid View (#ending-view)
// Renders 960x540 Ending canvas from ending_illustrations.js + Mood breakdown + Film Again / Album / Rewards / Postcard.

import { drawEndingIllustration } from '../render/ending_illustrations.js';

const ENDING_MOODS = [
  { key: 'love', label: 'Love', icon: '\uD83D\uDC96' },
  { key: 'joy', label: 'Joy', icon: '\uD83D\uDC30' },
  { key: 'wonder', label: 'Wonder', icon: '\u2728' },
  { key: 'chaos', label: 'Chaos', icon: '\uD83C\uDF00' },
];

export function createEndingView(ctx, rootEl, bindTap, helpers) {
  const el = document.createElement('section');
  el.id = 'ending-view';
  el.className = 'ending-view ui-bg-layer is-hidden';
  el.hidden = true;
  el.setAttribute('aria-label', 'Sauin Film Ending Polaroid');

  el.innerHTML = `
    <div class="ending-polaroid-stage">
      <div class="ending-polaroid-frame">
        <div class="ending-canvas-mount">
          <canvas id="ending-polaroid-canvas" width="960" height="540"></canvas>
        </div>
        <div id="ending-album-ribbon" class="ending-album-ribbon">Ending added to Film Album</div>
      </div>
    </div>

    <div class="ending-story-panel">
      <div id="ending-code-tag" class="ending-code-tag">//END1</div>
      <h2 id="ending-main-title" class="ending-main-title">Strange Sauin</h2>
      <div id="ending-mood-summary" class="ending-mood-summary"></div>
      <p id="ending-story-text" class="ending-story-text"></p>

      <div class="ending-buttons-grid">
        <button type="button" id="btn-ending-again" class="sauin-btn btn-primary" data-action="film-again">
          <span>\uD83C\uDFAC Film Again</span>
        </button>
        <button type="button" id="btn-ending-postcard" class="sauin-btn btn-ticket" data-action="ending-postcard">
          <span>\uD83D\uDCF8 Save Postcard</span>
        </button>
        <button type="button" id="btn-ending-album" class="sauin-btn btn-ticket" data-action="ending-album">
          <span>\uD83C\uDF9E Film Album</span>
        </button>
        <button type="button" id="btn-ending-rewards" class="sauin-btn btn-ticket" data-action="ending-rewards">
          <span>\uD83C\uDF81 Rewards</span>
        </button>
      </div>
    </div>
  `;

  rootEl.appendChild(el);

  const canvasEl = el.querySelector('#ending-polaroid-canvas');
  const ribbonEl = el.querySelector('#ending-album-ribbon');
  const codeEl = el.querySelector('#ending-code-tag');
  const titleEl = el.querySelector('#ending-main-title');
  const moodSummaryEl = el.querySelector('#ending-mood-summary');
  const storyTextEl = el.querySelector('#ending-story-text');
  const btnAgain = el.querySelector('#btn-ending-again');
  const btnPostcard = el.querySelector('#btn-ending-postcard');
  const btnAlbum = el.querySelector('#btn-ending-album');
  const btnRewards = el.querySelector('#btn-ending-rewards');

  bindTap(btnAgain, () => {
    helpers.unlockAudio();
    ctx.events?.emit?.('sfx', { name: 'clapper_snap', vol: 0.75 });
    ctx.mechanics?.startRun?.({ seed: (ctx.state?.seed || 20261031) + 1, startAct: 1, skipDialogue: false });
    helpers.requestSync();
  });

  bindTap(btnPostcard, () => {
    helpers.unlockAudio();
    helpers.savePostcard('sauin_ending');
  });

  bindTap(btnAlbum, () => {
    helpers.unlockAudio();
    ctx.events?.emit?.('sfx', { name: 'ui_click', vol: 0.65 });
    helpers.openModal('album');
  });

  bindTap(btnRewards, () => {
    helpers.unlockAudio();
    ctx.events?.emit?.('sfx', { name: 'ui_click', vol: 0.65 });
    helpers.openModal('rewards');
  });

  let drawnEndingId = '';

  function sync(state) {
    const active = Boolean(state && state.phase === 'ending');
    el.hidden = !active;
    el.classList.toggle('is-hidden', !active);
    if (!active) return;

    const endState = state.currentEnding || {};
    const endingId = endState.endingId || endState.id || 'END1';
    const endDef = helpers.getEnding(endingId) || {};

    codeEl.textContent = endState.code || endDef.code || `//${endingId}`;
    titleEl.textContent = endState.title || endDef.title || 'Strange Sauin';
    storyTextEl.textContent = endState.bodyText || endDef.bodyText || '';
    ribbonEl.textContent = endState.isNewEnding
      ? 'NEW! Ending added to Film Album'
      : 'Ending recorded in Film Album';

    const totals = endState.totals || state.moods || { love: 0, joy: 0, wonder: 0, chaos: 0 };
    const peak = Math.max(
      Number(totals.love) || 0,
      Number(totals.joy) || 0,
      Number(totals.wonder) || 0,
      Number(totals.chaos) || 0
    );

    moodSummaryEl.innerHTML = ENDING_MOODS.map((m) => {
      const rawVal = Number(totals[m.key]) || 0;
      const dispVal = Math.min(8, Math.max(0, rawVal));
      const isPeak = rawVal >= 6 && rawVal === peak;
      return `<span class="ending-mood-chip${isPeak ? ' is-peak' : ''}">${m.icon} ${m.label}: ${dispVal}/8</span>`;
    }).join('');

    if (drawnEndingId !== endingId) {
      drawnEndingId = endingId;
      try {
        drawEndingIllustration(canvasEl, endingId);
      } catch (_err) {
        // Ignore render race.
      }
    }

    const readyCount = helpers.countClaimableCommissions(state.progress);
    btnRewards.classList.toggle('has-badge-dot', readyCount > 0);
  }

  return { el, sync };
}
