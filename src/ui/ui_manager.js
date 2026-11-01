// Main Theatrical UI Coordinator (ui_manager.js)
// Exports createUI(ctx, rootEl) matching docs/DESIGN.md §4.4 (owner: @ui-hud).

import { createCaptionsHud } from './captions_hud.js';
import { createTitleView } from './title_view.js';
import { createDialogueBox } from './dialogue_box.js';
import { createStageHud } from './stage_hud.js';
import { createDragCast } from './drag_cast.js';
import { createTakeCard } from './take_card.js';
import { createEndingView } from './ending_view.js';
import { createAlbumModal } from './album_modal.js';
import { createRewardsModal } from './rewards_modal.js';

const SPEAKER_NAME_MAP = {
  'last rite': 'last_rite',
  camille: 'camille',
  'chen qianyu': 'chen_qianyu',
  rossi: 'rossi',
  'mi fu': 'mi_fu',
  yvonne: 'yvonne',
  ardashir: 'ardashir',
  'mysterious sarkaz': 'mysterious_sarkaz',
  'sarkaz director': 'sarkaz_director',
  'injured landbreaker': 'injured_landbreaker',
};

const FALLBACK_NAMES = {
  last_rite: 'Last Rite',
  camille: 'Camille',
  chen_qianyu: 'Chen Qianyu',
  rossi: 'Rossi',
  mi_fu: 'Mi Fu',
  yvonne: 'Yvonne',
  ardashir: 'Ardashir',
  mysterious_sarkaz: 'Mysterious Sarkaz',
  sarkaz_director: 'Sarkaz Director',
  injured_landbreaker: 'Injured Landbreaker',
  sarkaz_mask: 'Sarkaz Mask',
  roast_steak: 'Roast Burdenbeast Steak',
  pop_loong: 'Weeping Pop Loong',
  lankybeast: 'Lankybeast',
  one_handed_sword: 'One-Handed Sword',
  lollipop: 'Giant Swirl Lollipop',
  candy_chest: 'Candy Treasure Chest',
  fireworks: 'Festive Fireworks',
  suppressor: 'Originium Suppressor',
};

/**
 * Binds touch-first pointerup + click fallback without double-firing on a single gesture,
 * while still allowing rapid consecutive automated taps (Gate G2, G6, G7).
 */
export function bindTap(el, handler) {
  if (!el || typeof handler !== 'function') return;
  let handledOnPointerUp = false;
  let lastFireTime = -1000;

  el.addEventListener('pointerdown', (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    handledOnPointerUp = false;
  });

  el.addEventListener('pointerup', (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    if (el.disabled || el.classList.contains('is-disabled')) return;
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (now - lastFireTime < 280) {
      handledOnPointerUp = true;
      e.preventDefault?.();
      return;
    }
    handledOnPointerUp = true;
    lastFireTime = now;
    handler(e);
  });

  el.addEventListener('click', (e) => {
    if (el.disabled || el.classList.contains('is-disabled')) return;
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if ((handledOnPointerUp && now - lastFireTime < 320) || now - lastFireTime < 280) {
      handledOnPointerUp = false;
      e.preventDefault?.();
      return;
    }
    handledOnPointerUp = false;
    lastFireTime = now;
    handler(e);
  });
}

export function createUI(ctx, rootEl) {
  const host = rootEl || document.getElementById('ui-root') || document.body;
  let initialized = false;
  let toastTimer = null;

  let topBarEl = null;
  let clapperEl = null;
  let workspaceEl = null;
  let rightColEl = null;
  let rollingSlateEl = null;
  let modalLayerEl = null;
  let dialogueLogModalEl = null;
  let guideModalEl = null;
  let postcardModalEl = null;
  let lastPostcardUrl = '';
  let lastPostcardFilename = 'sauin_postcard_1.png';
  let toastEl = null;

  let captionsHud = null;
  let titleView = null;
  let dialogueBox = null;
  let stageHud = null;
  let dragCast = null;
  let takeCard = null;
  let endingView = null;
  let albumModal = null;
  let rewardsModal = null;

  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function unlockAudio() {
    ctx.audio?.unlock?.();
    if (ctx.state?.feedback && ctx.state.feedback.firstActionMs === null) {
      ctx.state.feedback.firstActionMs = ctx.state.timeMs || 0;
    }
  }

  function getAct(actId = 1) {
    const acts = ctx.levels?.ACTS;
    if (!acts) return null;
    if (Array.isArray(acts)) {
      return acts.find((a) => a && (a.id === actId || a.actId === actId)) || acts[actId] || null;
    }
    return acts[actId] || null;
  }

  function getItemName(itemId) {
    if (!itemId) return '';
    const ch = ctx.levels?.CHARACTERS?.[itemId] || ctx.levels?.getCharacter?.(itemId);
    if (ch && ch.name) return ch.name;
    const pr = ctx.levels?.PROPS?.[itemId] || ctx.levels?.getProp?.(itemId);
    if (pr && pr.name) return pr.name;
    return FALLBACK_NAMES[itemId] || String(itemId).replace(/_/g, ' ');
  }

  function speakerNameToId(name) {
    const key = String(name || '').trim().toLowerCase();
    return SPEAKER_NAME_MAP[key] || 'sarkaz_director';
  }

  function getTakeById(takeId) {
    if (!takeId) return null;
    return ctx.levels?.TAKES?.[takeId] || ctx.levels?.getTakeById?.(takeId) || null;
  }

  function getTake(actId, actorId, propId) {
    if (typeof ctx.levels?.getTake === 'function') {
      return ctx.levels.getTake(actId, actorId, propId);
    }
    const all = ctx.levels?.TAKES || {};
    return (
      Object.values(all).find(
        (t) => t && t.actId === actId && t.actorId === actorId && t.propId === propId
      ) || null
    );
  }

  function getEnding(endingId) {
    if (!endingId) return null;
    return ctx.levels?.ENDINGS?.[endingId] || ctx.levels?.getEnding?.(endingId) || null;
  }

  function getCommissionsList() {
    const c = ctx.levels?.COMMISSIONS || ctx.levels?.COMMISSION_LIST;
    if (Array.isArray(c)) return c;
    if (c && typeof c === 'object') return Object.values(c);
    return [];
  }

  function evaluateCommission(comm, progress = {}) {
    if (typeof ctx.levels?.evaluateCommission === 'function') {
      return ctx.levels.evaluateCommission(comm, progress);
    }
    const unlockedTakes = Array.isArray(progress?.unlockedTakes) ? progress.unlockedTakes : [];
    const unlockedEndings = Array.isArray(progress?.unlockedEndings) ? progress.unlockedEndings : [];
    const claimed = Array.isArray(progress?.claimedCommissions) ? progress.claimedCommissions : [];
    const target = Number(comm?.target) || 1;
    let current = 0;
    if (comm?.kind === 'act1_complete') {
      current = unlockedTakes.some((t) => String(t).startsWith('take_1_')) ? 1 : 0;
    } else if (comm?.kind === 'any_ending') {
      current = unlockedEndings.length > 0 ? 1 : 0;
    } else if (comm?.kind === 'ending') {
      current = unlockedEndings.includes(comm.requiredEndingId) ? 1 : 0;
    } else if (comm?.kind === 'takes_count') {
      current = Math.min(target, unlockedTakes.length);
    } else if (comm?.kind === 'master_all') {
      current = Math.min(target, unlockedTakes.length + unlockedEndings.length);
    }
    const isClaimed = claimed.includes(comm?.id);
    const completed = current >= target;
    return {
      current,
      target,
      completed,
      claimed: isClaimed,
      claimable: completed && !isClaimed,
    };
  }

  function countClaimableCommissions(progress = {}) {
    let count = 0;
    for (const c of getCommissionsList()) {
      if (evaluateCommission(c, progress).claimable) count += 1;
    }
    return count;
  }

  function showToast(text) {
    if (!toastEl) return;
    const clean = String(text || '').trim();
    if (!clean) return;
    if (toastTimer) clearTimeout(toastTimer);
    toastEl.textContent = clean;
    toastEl.hidden = false;
    toastEl.classList.remove('is-hidden');
    toastTimer = setTimeout(() => {
      toastEl.hidden = true;
      toastEl.classList.add('is-hidden');
    }, 2200);
  }

  function savePostcard(prefix = 'sauin_postcard') {
    ctx.events?.emit?.('sfx', { name: 'shutter_flash', vol: 0.75 });
    const dataUrl = ctx.render?.exportPostcardDataURL?.();
    if (dataUrl && typeof dataUrl === 'string' && dataUrl.startsWith('data:image')) {
      lastPostcardUrl = dataUrl;
      lastPostcardFilename = `${prefix}_${ctx.state?.actId || 1}.png`;
      try {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = lastPostcardFilename;
        document.body.appendChild(link);
        link.click();
        link.remove();
      } catch (_err) {
        // Headless or iOS Safari download suppressed; preview modal provides long-press save.
      }
      openModal('postcard');
    } else {
      showToast('Postcard snapshot saved!');
    }
  }

  function openModal(name) {
    if (!name || !ctx.state) return;
    ctx.state.modal = name;
    ctx.events?.emit?.('modalOpened', { modal: name });
    if (name === 'album') {
      if (typeof ctx.audio?.playVO === 'function') {
        ctx.audio.playVO('vo_album_open');
      } else {
        ctx.events?.emit?.('voPlay', { voId: 'vo_album_open' });
      }
    }
    sync(ctx.state);
  }

  function closeModal() {
    if (!ctx.state) return;
    const prev = ctx.state.modal;
    ctx.state.modal = null;
    if (prev) {
      ctx.events?.emit?.('modalClosed', { modal: prev });
    }
    sync(ctx.state);
  }

  function requestSync() {
    if (ctx.state) {
      sync(ctx.state);
    }
  }

  const helpers = {
    escapeHtml,
    unlockAudio,
    getAct,
    getItemName,
    speakerNameToId,
    getTakeById,
    getTake,
    getEnding,
    getCommissionsList,
    evaluateCommission,
    countClaimableCommissions,
    showToast,
    savePostcard,
    openModal,
    closeModal,
    requestSync,
  };

  function buildTopBar() {
    topBarEl = document.createElement('header');
    topBarEl.id = 'top-bar';
    topBarEl.className = 'ui-bg-layer';
    topBarEl.innerHTML = `
      <div class="top-bar-left">
        <button type="button" id="btn-back-title" class="sauin-btn btn-icon-pill is-hidden" hidden data-action="back-title" aria-label="Return to Title Screen">
          <span class="top-btn-full">\u25C0 Title</span>
          <span class="top-btn-short">\u25C0</span>
        </button>
      </div>

      <div class="top-bar-right">
        <button type="button" id="btn-top-album" class="sauin-btn btn-icon-pill is-hidden" hidden data-action="top-album" aria-label="Open Film Album">
          <span class="top-btn-full">\uD83C\uDF9E Album (0/25)</span>
          <span class="top-btn-short">\uD83C\uDF9E</span>
        </button>
        <button type="button" id="btn-top-rewards" class="sauin-btn btn-icon-pill is-hidden" hidden data-action="top-rewards" aria-label="Open Studio Rewards">
          <span class="top-btn-full">\uD83C\uDF81 Rewards (0/8)</span>
          <span class="top-btn-short">\uD83C\uDF81</span>
        </button>
        <button type="button" id="btn-dialogue-log" class="sauin-btn btn-icon-pill is-hidden" hidden data-action="dialogue-log" aria-label="Open Dialogue Log">
          <span class="top-btn-full">\uD83D\uDCDC Log</span>
          <span class="top-btn-short">\uD83D\uDCDC</span>
        </button>
        <button type="button" id="btn-toggle-bgm" class="sauin-btn btn-icon-pill" data-action="toggle-bgm" aria-label="Toggle Background Music">
          <span class="top-btn-full">\uD83C\uDFB5 Music</span>
          <span class="top-btn-short">\uD83C\uDFB5</span>
        </button>
        <button type="button" id="btn-toggle-vo" class="sauin-btn btn-icon-pill" data-action="toggle-vo" aria-label="Toggle English Voiceover">
          <span class="top-btn-full">\uD83C\uDF99 Voice</span>
          <span class="top-btn-short">\uD83C\uDF99</span>
        </button>
        <button type="button" id="btn-open-guide" class="sauin-btn btn-icon-pill" data-action="open-guide" aria-label="Open Filmmaking Guide">
          <span class="top-btn-full">? Guide</span>
          <span class="top-btn-short">?</span>
        </button>
      </div>
    `;
    host.appendChild(topBarEl);

    bindTap(topBarEl.querySelector('#btn-back-title'), () => {
      unlockAudio();
      ctx.audio?.stopVO?.();
      if (typeof ctx.mechanics?.returnToTitle === 'function') {
        ctx.mechanics.returnToTitle();
      } else if (ctx.state) {
        ctx.events?.emit?.('sfx', { name: 'curtain_swish', vol: 0.6 });
        const from = ctx.state.phase;
        ctx.state.phase = 'title';
        ctx.state.modal = null;
        ctx.render?.setCurtains?.(false, false);
        ctx.events?.emit?.('phaseChange', { from, to: 'title', actId: ctx.state.actId });
      }
      requestSync();
    });

    bindTap(topBarEl.querySelector('#btn-top-album'), () => {
      unlockAudio();
      ctx.events?.emit?.('sfx', { name: 'ui_click', vol: 0.65 });
      openModal('album');
    });

    bindTap(topBarEl.querySelector('#btn-top-rewards'), () => {
      unlockAudio();
      ctx.events?.emit?.('sfx', { name: 'ui_click', vol: 0.65 });
      openModal('rewards');
    });

    bindTap(topBarEl.querySelector('#btn-dialogue-log'), () => {
      unlockAudio();
      ctx.events?.emit?.('sfx', { name: 'ui_click', vol: 0.6 });
      openModal('dialogue_log');
    });

    bindTap(topBarEl.querySelector('#btn-toggle-bgm'), () => {
      unlockAudio();
      const au = ctx.audio?.getAudioStats?.() || {};
      const nextMuted = !au.bgmMuted;
      ctx.audio?.setMuted?.({ bgm: nextMuted });
      ctx.persistence?.saveAudio?.({ bgmMuted: nextMuted });
      ctx.events?.emit?.('sfx', { name: 'ui_click', vol: 0.5 });
      requestSync();
    });

    bindTap(topBarEl.querySelector('#btn-toggle-vo'), () => {
      unlockAudio();
      const au = ctx.audio?.getAudioStats?.() || {};
      const nextMuted = !au.voMuted;
      ctx.audio?.setMuted?.({ vo: nextMuted });
      ctx.persistence?.saveAudio?.({ voMuted: nextMuted });
      ctx.events?.emit?.('sfx', { name: 'ui_click', vol: 0.5 });
      requestSync();
    });

    bindTap(topBarEl.querySelector('#btn-open-guide'), () => {
      unlockAudio();
      ctx.events?.emit?.('sfx', { name: 'ui_click', vol: 0.6 });
      openModal('guide');
    });
  }

  function buildClapperOverlay() {
    clapperEl = document.createElement('div');
    clapperEl.id = 'clapper-overlay';
    clapperEl.className = 'is-hidden';
    clapperEl.hidden = true;
    clapperEl.innerHTML = `
      <div class="clapper-card">
        <div class="clapper-top-stick"></div>
        <div class="clapper-bottom-stick"></div>
        <div class="clapper-slate-body">
          <div id="clapper-act-code" class="clapper-act-code">SCENE 01</div>
          <div id="clapper-act-title" class="clapper-act-title">The Vanished Sauin</div>
        </div>
      </div>
    `;
    host.appendChild(clapperEl);
  }

  function buildAuxiliaryModals() {
    dialogueLogModalEl = document.createElement('div');
    dialogueLogModalEl.id = 'dialogue-log-modal';
    dialogueLogModalEl.className = 'sauin-modal-card modal-card modal-panel is-hidden';
    dialogueLogModalEl.hidden = true;
    dialogueLogModalEl.setAttribute('role', 'dialog');
    dialogueLogModalEl.setAttribute('aria-label', 'Scene Dialogue Log');
    dialogueLogModalEl.innerHTML = `
      <div class="modal-header-bar">
        <div class="modal-title-group">
          <h2 id="dlg-log-heading">\uD83D\uDCDC Act 1 Dialogue Log</h2>
        </div>
        <div class="modal-header-actions">
          <button type="button" id="btn-log-close" class="sauin-btn btn-icon-pill" data-action="close-modal">
            <span>\u2715 Close</span>
          </button>
        </div>
      </div>
      <div id="dlg-log-body" class="modal-scroll-text-body"></div>
    `;
    modalLayerEl.appendChild(dialogueLogModalEl);

    bindTap(dialogueLogModalEl.querySelector('#btn-log-close'), () => {
      unlockAudio();
      ctx.events?.emit?.('sfx', { name: 'ui_click', vol: 0.6 });
      closeModal();
    });

    guideModalEl = document.createElement('div');
    guideModalEl.id = 'guide-modal';
    guideModalEl.className = 'sauin-modal-card modal-card modal-panel is-hidden';
    guideModalEl.hidden = true;
    guideModalEl.setAttribute('role', 'dialog');
    guideModalEl.setAttribute('aria-label', 'Director Studio Guide');
    guideModalEl.innerHTML = `
      <div class="modal-header-bar">
        <div class="modal-title-group">
          <h2>\uD83C\uDFAC Sauin Studio Director's Guide</h2>
        </div>
        <div class="modal-header-actions">
          <button type="button" id="btn-guide-close" class="sauin-btn btn-primary btn-icon-pill" data-action="close-modal">
            <span>Got It</span>
          </button>
        </div>
      </div>
      <div class="modal-scroll-text-body">
        <div class="log-line-item">
          <div class="log-line-speaker">1. Cast Your Scene Marks (Acts 1–5)</div>
          <div class="log-line-text">Drag or tap 1 Actor and 1 Prop from the right parchment tray onto the stage marks. Watch out—Acts 1–3 place Prop on the left and Actor on the right, while Acts 4–5 swap Actor to the left and Prop to the right!</div>
        </div>
        <div class="log-line-item">
          <div class="log-line-speaker">2. Shape the Four Studio Moods</div>
          <div class="log-line-text">Every (Actor + Prop) pairing shifts Love, Joy, Wonder, or Chaos by +1 or +2. Preview pips appear live on the left 35mm filmstrip before you roll camera, and you can Reshoot any Act freely!</div>
        </div>
        <div class="log-line-item">
          <div class="log-line-speaker">3. Unlock All 20 Takes &amp; 5 Branching Endings</div>
          <div class="log-line-text">If any Mood reaches 6 or higher after Act 5, your highest Mood unlocks its dedicated Ending (//END2 Love, //END3 Joy, //END4 Wonder, //END5 Chaos). Keep all four Moods below 6 to unlock //END1: Strange Sauin!</div>
        </div>
        <div class="log-line-item">
          <div class="log-line-speaker">4. Interactive Set Gags &amp; Studio Commissions</div>
          <div class="log-line-text">Tap peeking ghost-bunnies, neon signs, rustling tents, bushes, and Originium spires on the 3D stage for bonus sparkles, and claim up to 300 Oroberyl in Studio Rewards!</div>
        </div>
      </div>
    `;
    modalLayerEl.appendChild(guideModalEl);

    bindTap(guideModalEl.querySelector('#btn-guide-close'), () => {
      unlockAudio();
      ctx.events?.emit?.('sfx', { name: 'ui_click', vol: 0.6 });
      closeModal();
    });

    postcardModalEl = document.createElement('div');
    postcardModalEl.id = 'postcard-modal';
    postcardModalEl.className = 'sauin-modal-card modal-card modal-panel postcard-modal-card is-hidden';
    postcardModalEl.hidden = true;
    postcardModalEl.setAttribute('role', 'dialog');
    postcardModalEl.setAttribute('aria-label', 'Souvenir Postcard Preview');
    postcardModalEl.innerHTML = `
      <div class="modal-header-bar">
        <div class="modal-title-group">
          <h2>\uD83D\uDCF8 Sauin Souvenir Postcard</h2>
          <span class="modal-counter-pill">Touch &amp; hold image on iPad / iOS to Save to Photos</span>
        </div>
        <div class="modal-header-actions">
          <a id="btn-postcard-download-link" class="sauin-btn btn-primary btn-icon-pill" href="#" download="sauin_postcard.png">
            <span>\u2B07 Download PNG</span>
          </a>
          <button type="button" id="btn-postcard-close" class="sauin-btn btn-icon-pill" data-action="close-modal">
            <span>\u2715 Close</span>
          </button>
        </div>
      </div>
      <div class="postcard-preview-stage">
        <img id="postcard-preview-img" alt="Sauin Studio Souvenir Postcard" src="" />
      </div>
    `;
    modalLayerEl.appendChild(postcardModalEl);

    bindTap(postcardModalEl.querySelector('#btn-postcard-close'), () => {
      unlockAudio();
      ctx.events?.emit?.('sfx', { name: 'ui_click', vol: 0.6 });
      closeModal();
    });
  }

  function init() {
    if (initialized) return;
    initialized = true;

    titleView = createTitleView(ctx, host, bindTap, helpers);
    buildTopBar();
    buildClapperOverlay();

    dialogueBox = createDialogueBox(ctx, host, bindTap, helpers);

    workspaceEl = document.createElement('section');
    workspaceEl.id = 'stage-workspace';
    workspaceEl.className = 'ui-bg-layer is-hidden';
    workspaceEl.hidden = true;
    host.appendChild(workspaceEl);

    stageHud = createStageHud(ctx, workspaceEl, bindTap, helpers);

    rightColEl = document.createElement('div');
    rightColEl.className = 'stage-right-col';
    workspaceEl.appendChild(rightColEl);

    rollingSlateEl = document.createElement('div');
    rollingSlateEl.id = 'rolling-slate-panel';
    rollingSlateEl.className = 'rolling-slate-panel is-hidden';
    rollingSlateEl.hidden = true;
    rollingSlateEl.innerHTML = `
      <div class="rolling-slate-card">
        <div class="rolling-slate-badge"><span class="rec-dot"></span> CAMERA A &middot; ROLLING</div>
        <div id="rolling-slate-scene" class="rolling-slate-scene">SCENE 01</div>
        <div id="rolling-slate-cast" class="rolling-slate-cast">Capturing live Sauin performance...</div>
        <div class="rolling-slate-note">Quiet on set! Action is unfolding inside the 35mm stage frame.</div>
      </div>
    `;
    rightColEl.appendChild(rollingSlateEl);

    dragCast = createDragCast(ctx, rightColEl, host, stageHud, bindTap, helpers);
    takeCard = createTakeCard(ctx, rightColEl, bindTap, helpers);
    endingView = createEndingView(ctx, host, bindTap, helpers);

    modalLayerEl = document.createElement('div');
    modalLayerEl.id = 'modal-layer';
    modalLayerEl.className = 'is-hidden';
    modalLayerEl.hidden = true;
    modalLayerEl.addEventListener('pointerup', (e) => {
      if (e.target === modalLayerEl) {
        unlockAudio();
        closeModal();
      }
    });
    host.appendChild(modalLayerEl);

    albumModal = createAlbumModal(ctx, modalLayerEl, bindTap, helpers);
    rewardsModal = createRewardsModal(ctx, modalLayerEl, bindTap, helpers);
    buildAuxiliaryModals();

    captionsHud = createCaptionsHud(ctx, host);

    toastEl = document.createElement('div');
    toastEl.id = 'ui-toast';
    toastEl.className = 'is-hidden';
    toastEl.hidden = true;
    host.appendChild(toastEl);

    if (ctx.state) {
      sync(ctx.state);
    }
  }

  function syncTopBar(state) {
    if (!topBarEl) return;
    const phase = state?.phase || 'title';
    const isTitle = phase === 'title';
    const isStageOrDialog =
      phase === 'dialogue' || phase === 'blocking' || phase === 'rolling' || phase === 'take_result';
    const showMetaBtns = phase === 'blocking' || phase === 'take_result';

    const btnBack = topBarEl.querySelector('#btn-back-title');
    const btnAlbum = topBarEl.querySelector('#btn-top-album');
    const btnRewards = topBarEl.querySelector('#btn-top-rewards');
    const btnLog = topBarEl.querySelector('#btn-dialogue-log');
    const btnBgm = topBarEl.querySelector('#btn-toggle-bgm');
    const btnVo = topBarEl.querySelector('#btn-toggle-vo');

    btnBack.hidden = isTitle;
    btnBack.classList.toggle('is-hidden', isTitle);

    btnAlbum.hidden = !showMetaBtns;
    btnAlbum.classList.toggle('is-hidden', !showMetaBtns);

    btnRewards.hidden = !showMetaBtns;
    btnRewards.classList.toggle('is-hidden', !showMetaBtns);

    btnLog.hidden = !isStageOrDialog;
    btnLog.classList.toggle('is-hidden', !isStageOrDialog);

    const prog = state?.progress || {};
    const takesCount = Array.isArray(prog.unlockedTakes) ? prog.unlockedTakes.length : 0;
    const endingsCount = Array.isArray(prog.unlockedEndings) ? prog.unlockedEndings.length : 0;
    const claimedCount = Array.isArray(prog.claimedCommissions) ? prog.claimedCommissions.length : 0;

    const albumFull = btnAlbum.querySelector('.top-btn-full');
    if (albumFull) albumFull.textContent = `\uD83C\uDF9E Album (${takesCount + endingsCount}/25)`;

    const rewardsFull = btnRewards.querySelector('.top-btn-full');
    if (rewardsFull) rewardsFull.textContent = `\uD83C\uDF81 Rewards (${claimedCount}/8)`;
    btnRewards.classList.toggle('has-badge-dot', countClaimableCommissions(prog) > 0);

    const au = ctx.audio?.getAudioStats?.() || {};
    const bgmMuted = Boolean(au.bgmMuted);
    const voMuted = Boolean(au.voMuted);

    btnBgm.classList.toggle('is-muted', bgmMuted);
    const bgmFull = btnBgm.querySelector('.top-btn-full');
    if (bgmFull) bgmFull.textContent = bgmMuted ? '\uD83D\uDD07 Music' : '\uD83C\uDFB5 Music';

    btnVo.classList.toggle('is-muted', voMuted);
    const voFull = btnVo.querySelector('.top-btn-full');
    if (voFull) voFull.textContent = voMuted ? '\uD83D\uDD07 Voice' : '\uD83C\uDF99 Voice';
  }

  function syncClapper(state) {
    if (!clapperEl) return;
    const active = state?.phase === 'clapper';
    clapperEl.hidden = !active;
    clapperEl.classList.toggle('is-hidden', !active);
    if (!active) return;

    const actId = state?.actId || 1;
    const act = getAct(actId);
    const codeEl = clapperEl.querySelector('#clapper-act-code');
    const titleEl = clapperEl.querySelector('#clapper-act-title');
    if (codeEl) codeEl.textContent = `SCENE 0${actId}`;
    if (titleEl) titleEl.textContent = act?.title || 'Action!';
  }

  function syncDialogueLogModal(state) {
    if (!dialogueLogModalEl) return;
    const open = state?.modal === 'dialogue_log';
    dialogueLogModalEl.hidden = !open;
    dialogueLogModalEl.classList.toggle('is-hidden', !open);
    if (!open) return;

    const actId = state?.actId || 1;
    const act = getAct(actId);
    const heading = dialogueLogModalEl.querySelector('#dlg-log-heading');
    const body = dialogueLogModalEl.querySelector('#dlg-log-body');
    if (heading) {
      heading.textContent = `\uD83D\uDCDC Act ${actId}: ${act?.title || 'Scene'} — Script Log`;
    }
    if (body) {
      const lines = Array.isArray(act?.dialogue) ? act.dialogue : [];
      body.innerHTML = lines
        .map(
          (l) => `
          <div class="log-line-item">
            <div class="log-line-speaker">${escapeHtml(l.speakerName || l.speaker || 'Cast')}</div>
            <div class="log-line-text">${escapeHtml(l.text || '')}</div>
          </div>
        `
        )
        .join('');
    }
  }

  function sync(state) {
    if (!initialized) init();
    const s = state || ctx.state;
    if (!s) return;

    const phase = s.phase || 'title';
    const hasModal = Boolean(s.modal);
    host.dataset.phase = phase;
    host.classList.toggle('has-modal', hasModal);

    syncTopBar(s);
    syncClapper(s);
    titleView?.sync(s);
    dialogueBox?.sync(s);

    const inWorkspace = phase === 'blocking' || phase === 'rolling' || phase === 'take_result';
    workspaceEl.hidden = !inWorkspace;
    workspaceEl.classList.toggle('is-hidden', !inWorkspace);
    workspaceEl.classList.toggle('is-rolling', phase === 'rolling');
    rightColEl.hidden = false;
    rightColEl.classList.remove('is-hidden');

    if (rollingSlateEl) {
      const showSlate = phase === 'rolling';
      rollingSlateEl.hidden = !showSlate;
      rollingSlateEl.classList.toggle('is-hidden', !showSlate);
      if (showSlate) {
        const scEl = rollingSlateEl.querySelector('#rolling-slate-scene');
        const caEl = rollingSlateEl.querySelector('#rolling-slate-cast');
        if (scEl) scEl.textContent = `SCENE 0${s.actId || 1} \u00B7 ${getAct(s.actId || 1)?.title || 'Sauin Set'}`;
        if (caEl) {
          const aName = getItemName(s.slots?.actorId);
          const pName = getItemName(s.slots?.propId);
          caEl.textContent = aName && pName ? `${aName} + ${pName}` : 'Capturing live Sauin performance...';
        }
      }
    }

    stageHud?.sync(s);
    dragCast?.sync(s);
    takeCard?.sync(s);
    endingView?.sync(s);

    modalLayerEl.hidden = !hasModal;
    modalLayerEl.classList.toggle('is-hidden', !hasModal);
    albumModal?.sync(s);
    rewardsModal?.sync(s);
    syncDialogueLogModal(s);
    if (guideModalEl) {
      const openGuide = s.modal === 'guide';
      guideModalEl.hidden = !openGuide;
      guideModalEl.classList.toggle('is-hidden', !openGuide);
    }
    if (postcardModalEl) {
      const openPostcard = s.modal === 'postcard';
      postcardModalEl.hidden = !openPostcard;
      postcardModalEl.classList.toggle('is-hidden', !openPostcard);
      if (openPostcard && lastPostcardUrl) {
        const imgEl = postcardModalEl.querySelector('#postcard-preview-img');
        const dlEl = postcardModalEl.querySelector('#btn-postcard-download-link');
        if (imgEl && imgEl.getAttribute('src') !== lastPostcardUrl) {
          imgEl.setAttribute('src', lastPostcardUrl);
        }
        if (dlEl) {
          dlEl.setAttribute('href', lastPostcardUrl);
          dlEl.setAttribute('download', lastPostcardFilename);
        }
      }
    }

    captionsHud?.sync();
  }

  return {
    init,
    sync,
    showCaption: (payload) => {
      if (!initialized) init();
      captionsHud?.showCaption(payload);
    },
    clearCaption: () => {
      captionsHud?.clearCaption(false);
    },
    openModal,
    closeModal,
    showToast,
  };
}
