// Title Screen View (#title) — Upgrades static #title in-place for Gate G1 & G2
// Bat-winged "New Era for the Myriad Souls" crest, Album, Studio Rewards, Start Filming CTA.

const BAT_WING_LEFT_SVG = `
<svg class="title-bat-svg" viewBox="0 0 64 40" aria-hidden="true">
  <path d="M60 28 C48 10, 28 4, 4 10 C14 16, 18 24, 12 32 C24 26, 34 28, 40 35 C46 28, 53 27, 60 28 Z"
        fill="#a32229" stroke="#fff5e2" stroke-width="2.5" stroke-linejoin="round"/>
</svg>`;

const BAT_WING_RIGHT_SVG = `
<svg class="title-bat-svg" viewBox="0 0 64 40" aria-hidden="true">
  <path d="M4 28 C16 10, 36 4, 60 10 C50 16, 46 24, 52 32 C40 26, 30 28, 24 35 C18 28, 11 27, 4 28 Z"
        fill="#a32229" stroke="#fff5e2" stroke-width="2.5" stroke-linejoin="round"/>
</svg>`;

export function createTitleView(ctx, rootEl, bindTap, helpers) {
  let el = rootEl.querySelector('#title') || document.getElementById('title');
  if (!el) {
    el = document.createElement('section');
    el.id = 'title';
    rootEl.appendChild(el);
  }
  el.id = 'title';
  el.className = 'title-view title-screen ui-bg-layer';
  el.setAttribute('data-view', 'title');
  el.setAttribute('aria-label', 'New Era for the Myriad Souls Title Screen');

  el.innerHTML = `
    <div class="title-spotlight-disc">
      <div class="title-crest-wrap">
        <div class="title-kicker">Arknights: Endfield &middot; Sauin Promo Shoot</div>
        <h1 class="title-crest-heading">
          ${BAT_WING_LEFT_SVG}
          <span>New Era for the Myriad Souls</span>
          ${BAT_WING_RIGHT_SVG}
        </h1>
        <div class="title-swish-rule" aria-hidden="true"></div>
        <p class="title-tagline">
          Traditions leap back to life in our memories. Direct five festive acts, shape four studio moods, and film all five Sauin endings!
        </p>
      </div>

      <div class="title-secondary-row">
        <button type="button" id="btn-title-album" class="sauin-btn btn-ticket" data-action="open-album">
          <span>\uD83C\uDF9E Film Album (0/25)</span>
        </button>
        <button type="button" id="btn-title-rewards" class="sauin-btn btn-ticket" data-action="open-rewards">
          <span>\uD83C\uDF81 Studio Rewards (0/8)</span>
        </button>
        <button type="button" id="btn-title-replay" class="sauin-btn btn-ticket btn-replay-accent" data-action="replay-intro" aria-label="Replay Welcome Voiceover">
          <span>\uD83D\uDD0A Replay Intro</span>
        </button>
      </div>

      <div class="title-primary-row">
        <button type="button" id="btn-start-filming" class="sauin-btn btn-primary" data-action="start-filming">
          <span>\u25B6 Start Filming</span>
        </button>
      </div>
    </div>
  `;

  const btnStart = el.querySelector('#btn-start-filming');
  const btnAlbum = el.querySelector('#btn-title-album');
  const btnRewards = el.querySelector('#btn-title-rewards');
  const btnReplay = el.querySelector('#btn-title-replay');

  bindTap(btnStart, () => {
    helpers.unlockAudio();
    ctx.events?.emit?.('sfx', { name: 'ui_click', vol: 0.7 });
    ctx.mechanics?.startRun?.({ seed: ctx.state?.seed ?? ctx.seed, startAct: 1, skipDialogue: false });
    helpers.requestSync();
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

  bindTap(btnReplay, () => {
    helpers.unlockAudio();
    if (ctx.state?.feedback) {
      ctx.state.feedback.taps = (Number(ctx.state.feedback.taps) || 0) + 1;
    }
    ctx.audio?.setMuted?.({ vo: false });
    ctx.persistence?.saveAudio?.({ voMuted: false });
    ctx.events?.emit?.('sfx', { name: 'ui_click', vol: 0.6 });
    if (typeof ctx.audio?.playVO === 'function') {
      ctx.audio.playVO('vo_title_welcome', { force: true, unmute: true });
    } else {
      ctx.events?.emit?.('voPlay', { voId: 'vo_title_welcome', force: true, unmute: true });
    }
    helpers.requestSync();
  });

  let lastAlbumLabel = '';
  let lastRewardsLabel = '';

  function sync(state) {
    const isTitle = !state || state.phase === 'title';
    el.hidden = !isTitle;
    el.classList.toggle('is-hidden', !isTitle);
    if (!isTitle) return;

    const prog = state?.progress || {};
    const takesCount = Array.isArray(prog.unlockedTakes) ? prog.unlockedTakes.length : 0;
    const endingsCount = Array.isArray(prog.unlockedEndings) ? prog.unlockedEndings.length : 0;
    const claimedCount = Array.isArray(prog.claimedCommissions) ? prog.claimedCommissions.length : 0;

    const albumText = `\uD83C\uDF9E Film Album (${takesCount + endingsCount}/25)`;
    if (albumText !== lastAlbumLabel) {
      btnAlbum.textContent = albumText;
      lastAlbumLabel = albumText;
    }

    const rewardsText = `\uD83C\uDF81 Studio Rewards (${claimedCount}/8)`;
    if (rewardsText !== lastRewardsLabel) {
      btnRewards.textContent = rewardsText;
      lastRewardsLabel = rewardsText;
    }

    const readyCount = helpers.countClaimableCommissions(prog);
    btnRewards.classList.toggle('has-badge-dot', readyCount > 0);
  }

  return { el, sync };
}
