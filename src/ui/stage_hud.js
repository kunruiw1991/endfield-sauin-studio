// Perforated 35mm Director Viewfinder & Left 4-Mood Filmstrip (stage_hud.js)
// Pointer-events pass-through over 3D stage so gags & 3D pedestals stay interactive (owner: @ui-hud).

const MOOD_META_UI = [
  { key: 'love', label: 'Love', icon: '\uD83D\uDC96' },
  { key: 'joy', label: 'Joy', icon: '\uD83D\uDC30' },
  { key: 'wonder', label: 'Wonder', icon: '\u2728' },
  { key: 'chaos', label: 'Chaos', icon: '\uD83C\uDF00' },
];

const GHOST_BUNNY_CORNER_SVG = `
<svg class="sticker-bunny-corner" viewBox="0 0 64 76" aria-hidden="true">
  <path d="M18 36 C15 14, 23 6, 27 24 C30 8, 41 8, 39 28 C48 33, 52 46, 48 64 C40 60, 34 68, 28 63 C21 68, 14 61, 12 64 C9 48, 12 39, 18 36 Z"
        fill="#fdfbf7" stroke="#2c1f17" stroke-width="2.6" stroke-linejoin="round"/>
  <ellipse cx="25" cy="43" rx="3" ry="4.5" fill="#f3b63a"/>
  <ellipse cx="36" cy="43" rx="3" ry="4.5" fill="#f3b63a"/>
</svg>`;

const BAT_CORNER_SVG = `
<svg class="sticker-bat-corner" viewBox="0 0 72 46" aria-hidden="true">
  <path d="M36 22 C26 7, 11 5, 3 14 C13 18, 17 26, 13 36 C23 29, 31 32, 36 39 C41 32, 49 29, 59 36 C55 26, 59 18, 69 14 C61 5, 46 7, 36 22 Z"
        fill="#c12c27" stroke="#fff6e5" stroke-width="2.6" stroke-linejoin="round"/>
</svg>`;

const COACH_MESSAGES = {
  1: 'Step 1/3: Drag or tap 1 Actor and 1 Prop onto the stage marks!',
  2: 'Step 2/3: Watch the left 35mm Mood Filmstrip preview (+1 / +2) — reaching 6 shapes your ending!',
  3: 'Step 3/3: Both marks are set! Press Roll Camera! to film this take!',
};

export function createStageHud(ctx, workspaceEl, bindTap, helpers) {
  const leftCol = document.createElement('div');
  leftCol.className = 'stage-left-col';

  const moodCellsHtml = MOOD_META_UI.map(
    (m) => `
    <div class="mood-cell" data-mood="${m.key}">
      <div class="mood-cell-top">
        <span class="mood-icon-badge">
          <span aria-hidden="true">${m.icon}</span>
          <span class="mood-name-label">${m.label}</span>
        </span>
        <span class="mood-val-wrap">
          <span class="mood-val-text" data-mood-val="${m.key}">0/8</span>
          <span class="mood-delta-pill is-hidden" data-mood-delta="${m.key}" hidden>+0</span>
        </span>
      </div>
      <div class="mood-bar-track">
        <div class="mood-bar-committed" data-mood-bar="${m.key}" style="width:0%"></div>
        <div class="mood-bar-preview" data-mood-prev="${m.key}" style="left:0%;width:0%"></div>
        <div class="mood-bar-threshold" title="Ending Threshold (6/8)"></div>
      </div>
    </div>
  `
  ).join('');

  leftCol.innerHTML = `
    <div id="mood-filmstrip" class="mood-filmstrip" aria-label="Studio Mood Gauges">
      <div class="mood-strip-header">Mood Reel (&ge;6)</div>
      <div class="mood-cells-list">${moodCellsHtml}</div>
    </div>
    <button type="button" id="btn-reel-replay" class="sauin-btn" data-action="reel-replay" title="Replay Pre-Shoot Cutscene">
      <span class="top-btn-full">\uD83C\uDFA5 Reel Replay</span>
      <span class="top-btn-short">\uD83C\uDFA5 Replay</span>
    </button>
  `;

  const centerCol = document.createElement('div');
  centerCol.className = 'stage-center-col';
  centerCol.innerHTML = `
    <div class="stage-header-row">
      <div id="act-plaque" class="act-plaque">
        <span id="act-plaque-code" class="act-plaque-code">Act 1/5</span>
        <span>&middot;</span>
        <span id="act-plaque-title" class="act-plaque-title">The Vanished Sauin</span>
      </div>
    </div>

    <div id="stage-viewfinder-frame" class="stage-viewfinder-frame">
      <div id="stage-viewfinder-window" class="stage-viewfinder-window">
        <div id="slot-left" class="stage-slot-guide stage-slot viewfinder-slot" data-slot="left" data-slot-side="left" data-slot-kind="prop">
          <button type="button" id="btn-clear-left" class="sauin-btn slot-clear-btn is-hidden" hidden aria-label="Clear Left Stage Mark">\u2715 Clear</button>
          <div id="slot-left-icon" class="slot-silhouette-icon" aria-hidden="true">\uD83C\uDFAD</div>
          <div id="slot-left-pill" class="slot-guide-pill">Prop Mark</div>
        </div>

        <div id="slot-right" class="stage-slot-guide stage-slot viewfinder-slot" data-slot="right" data-slot-side="right" data-slot-kind="actor">
          <button type="button" id="btn-clear-right" class="sauin-btn slot-clear-btn is-hidden" hidden aria-label="Clear Right Stage Mark">\u2715 Clear</button>
          <div id="slot-right-icon" class="slot-silhouette-icon" aria-hidden="true">\uD83C\uDFAC</div>
          <div id="slot-right-pill" class="slot-guide-pill">Actor Mark</div>
        </div>

        <div id="rolling-rec-pill" class="rolling-rec-pill is-hidden" hidden>
          <span class="rec-dot"></span>
          <span>REC &middot; ROLLING CAMERA</span>
        </div>

        <div id="coach-callout" class="coach-callout is-hidden" hidden></div>
      </div>
      ${GHOST_BUNNY_CORNER_SVG}
      ${BAT_CORNER_SVG}
    </div>

    <div id="stage-cue-banner" class="stage-cue-banner">
      The Sarkaz Princess sets out to reclaim the vanished Sauin.
    </div>
  `;

  workspaceEl.appendChild(leftCol);
  workspaceEl.appendChild(centerCol);

  const btnReplay = leftCol.querySelector('#btn-reel-replay');
  const actCodeEl = centerCol.querySelector('#act-plaque-code');
  const actTitleEl = centerCol.querySelector('#act-plaque-title');
  const windowEl = centerCol.querySelector('#stage-viewfinder-window');
  const slotLeftEl = centerCol.querySelector('#slot-left');
  const slotRightEl = centerCol.querySelector('#slot-right');
  const btnClearLeft = centerCol.querySelector('#btn-clear-left');
  const btnClearRight = centerCol.querySelector('#btn-clear-right');
  const slotLeftIcon = centerCol.querySelector('#slot-left-icon');
  const slotRightIcon = centerCol.querySelector('#slot-right-icon');
  const slotLeftPill = centerCol.querySelector('#slot-left-pill');
  const slotRightPill = centerCol.querySelector('#slot-right-pill');
  const rollingPill = centerCol.querySelector('#rolling-rec-pill');
  const coachEl = centerCol.querySelector('#coach-callout');
  const cueBannerEl = centerCol.querySelector('#stage-cue-banner');

  let hoverState = { slotKind: null, valid: false };

  ctx.events?.on?.('slotHover', (payload = {}) => {
    hoverState = {
      slotKind: payload.slotKind || null,
      valid: Boolean(payload.valid),
    };
    applyHoverClasses();
  });

  function applyHoverClasses() {
    for (const slotEl of [slotLeftEl, slotRightEl]) {
      const kind = slotEl.dataset.slotKind;
      const isHovered = hoverState.slotKind && hoverState.slotKind === kind;
      slotEl.classList.toggle('is-drop-valid', Boolean(isHovered && hoverState.valid));
      slotEl.classList.toggle('is-drop-invalid', Boolean(hoverState.slotKind && !isHovered && !hoverState.valid));
    }
  }

  bindTap(btnReplay, () => {
    helpers.unlockAudio();
    ctx.events?.emit?.('sfx', { name: 'ui_click', vol: 0.65 });
    const st = ctx.state;
    if (!st) return;
    if (st.phase === 'take_result' && st.currentTake?.takeId && typeof ctx.mechanics?.replayTake === 'function') {
      ctx.mechanics.replayTake(st.currentTake.takeId);
    } else if (typeof ctx.mechanics?.replayCutscene === 'function' && (st.phase === 'blocking' || st.phase === 'take_result')) {
      ctx.mechanics.replayCutscene();
    } else {
      ctx.mechanics?.jumpToAct?.(st.actId || 1, { keepMoods: true, skipDialogue: false });
    }
    helpers.requestSync();
  });

  bindTap(btnClearLeft, (e) => {
    e?.stopPropagation?.();
    helpers.unlockAudio();
    const kind = slotLeftEl.dataset.slotKind || 'prop';
    ctx.mechanics?.clearSlot?.(kind);
    helpers.requestSync();
  });

  bindTap(btnClearRight, (e) => {
    e?.stopPropagation?.();
    helpers.unlockAudio();
    const kind = slotRightEl.dataset.slotKind || 'actor';
    ctx.mechanics?.clearSlot?.(kind);
    helpers.requestSync();
  });

  function syncSlotCentersWith3D(hasCoach = false) {
    const winRect = windowEl.getBoundingClientRect();
    if (winRect.width < 80 || winRect.height < 60) return;

    const isNarrowPortrait =
      (window.innerWidth <= 900 && window.innerHeight > window.innerWidth) ||
      (window.innerWidth <= 660 && window.innerHeight > 480);
    const slotW = slotLeftEl.offsetWidth || Math.min(winRect.width * 0.36, 200);
    const minHalfPctX = Math.min(29, ((slotW * 0.5 + 14) / winRect.width) * 100);
    const minGapPctX = Math.min(52, ((slotW + 24) / winRect.width) * 100);

    let lPctX = 28;
    let rPctX = 72;
    let lPctY = isNarrowPortrait ? (hasCoach ? 53 : 56) : (hasCoach ? 46 : 52);
    let rPctY = isNarrowPortrait ? (hasCoach ? 53 : 56) : (hasCoach ? 46 : 52);

    const rects = ctx.render?.getSlotScreenRects?.();
    if (rects && rects.left && rects.right) {
      const lw = rects.left.width ?? rects.left.w ?? 0;
      const lh = rects.left.height ?? rects.left.h ?? 0;
      const rw = rects.right.width ?? rects.right.w ?? 0;
      const rh = rects.right.height ?? rects.right.h ?? 0;
      const lCx = rects.left.cx ?? ((rects.left.left ?? rects.left.x ?? NaN) + lw * 0.5);
      const lCy = rects.left.cy ?? ((rects.left.top ?? rects.left.y ?? NaN) + lh * 0.5);
      const rCx = rects.right.cx ?? ((rects.right.left ?? rects.right.x ?? NaN) + rw * 0.5);
      const rCy = rects.right.cy ?? ((rects.right.top ?? rects.right.y ?? NaN) + rh * 0.5);

      if (Number.isFinite(lCx) && Number.isFinite(rCx) && lCx < rCx - 16) {
        lPctX = ((lCx - winRect.left) / winRect.width) * 100;
        rPctX = ((rCx - winRect.left) / winRect.width) * 100;
      }
      if (!isNarrowPortrait && Number.isFinite(lCy) && Number.isFinite(rCy)) {
        lPctY = ((lCy - winRect.top) / winRect.height) * 100;
        rPctY = ((rCy - winRect.top) / winRect.height) * 100;
      }
    }

    const clampPct = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
    lPctX = clampPct(lPctX, minHalfPctX, 46);
    rPctX = clampPct(rPctX, 54, 100 - minHalfPctX);
    if (rPctX - lPctX < minGapPctX) {
      const mid = (lPctX + rPctX) * 0.5;
      lPctX = clampPct(mid - minGapPctX * 0.5, minHalfPctX, 50 - minGapPctX * 0.5);
      rPctX = clampPct(lPctX + minGapPctX, 50 + minGapPctX * 0.5, 100 - minHalfPctX);
    }

    const minPctY = isNarrowPortrait ? 50 : 42;
    const maxPctY = isNarrowPortrait ? (hasCoach ? 54 : 60) : (hasCoach ? 47 : 56);
    lPctY = clampPct(lPctY, minPctY, maxPctY);
    rPctY = clampPct(rPctY, minPctY, maxPctY);

    slotLeftEl.style.left = `${lPctX.toFixed(1)}%`;
    slotLeftEl.style.top = `${lPctY.toFixed(1)}%`;
    slotRightEl.style.left = `${rPctX.toFixed(1)}%`;
    slotRightEl.style.top = `${rPctY.toFixed(1)}%`;
  }

  function updateOneSlot(slotEl, clearBtn, iconEl, pillEl, slotKind, state, isBlocking) {
    slotEl.dataset.slotKind = slotKind;
    const itemId = slotKind === 'actor' ? state?.slots?.actorId : state?.slots?.propId;
    const filled = Boolean(itemId);
    slotEl.classList.toggle('is-filled', filled);

    iconEl.textContent = slotKind === 'actor' ? '\uD83C\uDFAD' : '\uD83D\uDCE6';
    const prefix = slotKind === 'actor' ? 'Actor' : 'Prop';
    if (filled) {
      pillEl.textContent = helpers.getItemName(itemId);
    } else {
      pillEl.textContent = `${prefix} Mark`;
    }

    const showClear = Boolean(isBlocking && filled);
    clearBtn.hidden = !showClear;
    clearBtn.classList.toggle('is-hidden', !showClear);
  }

  function syncMoodStrip(state) {
    const moods = state?.moods || { love: 0, joy: 0, wonder: 0, chaos: 0 };
    const isBlocking = state?.phase === 'blocking';
    const preview = isBlocking
      ? state?.previewDelta || { love: 0, joy: 0, wonder: 0, chaos: 0 }
      : { love: 0, joy: 0, wonder: 0, chaos: 0 };

    for (const m of MOOD_META_UI) {
      const k = m.key;
      const base = Math.max(0, Number(moods[k]) || 0);
      const delta = Math.max(0, Number(preview[k]) || 0);
      const cell = leftCol.querySelector(`.mood-cell[data-mood="${k}"]`);
      const valEl = leftCol.querySelector(`[data-mood-val="${k}"]`);
      const deltaEl = leftCol.querySelector(`[data-mood-delta="${k}"]`);
      const barEl = leftCol.querySelector(`[data-mood-bar="${k}"]`);
      const prevEl = leftCol.querySelector(`[data-mood-prev="${k}"]`);

      if (valEl) {
        valEl.textContent =
          typeof ctx.levels?.formatMoodValue === 'function'
            ? ctx.levels.formatMoodValue(base)
            : `${Math.min(8, base)}/8`;
      }
      if (deltaEl) {
        const showDelta = delta > 0;
        deltaEl.hidden = !showDelta;
        deltaEl.classList.toggle('is-hidden', !showDelta);
        if (showDelta) {
          deltaEl.textContent = `+${delta}`;
        }
      }

      const basePct = Math.min(100, (base / 8) * 100);
      const prevPct = Math.min(100 - basePct, (delta / 8) * 100);
      if (barEl) barEl.style.width = `${basePct.toFixed(1)}%`;
      if (prevEl) {
        prevEl.style.left = `${basePct.toFixed(1)}%`;
        prevEl.style.width = `${prevPct.toFixed(1)}%`;
      }
      if (cell) {
        cell.classList.toggle('has-preview', delta > 0);
        cell.classList.toggle('at-threshold', base + delta >= 6);
      }
    }
  }

  function sync(state) {
    const phase = state?.phase || 'title';
    const visible = phase === 'blocking' || phase === 'rolling' || phase === 'take_result';
    if (!visible) return;

    const actId = state?.actId || 1;
    const act = helpers.getAct(actId);
    actCodeEl.textContent = `Act ${actId}/5`;
    actTitleEl.textContent = act?.title || 'Sauin Set';
    cueBannerEl.textContent = act?.cuePrompt || 'Places, everyone—set your marks and roll camera!';

    const leftKind = state?.slots?.leftKind || act?.leftSlotKind || (actId >= 4 ? 'actor' : 'prop');
    const rightKind = state?.slots?.rightKind || act?.rightSlotKind || (actId >= 4 ? 'prop' : 'actor');
    const isBlocking = phase === 'blocking';

    // Show slot viewfinder guides during blocking; hide during rolling/result so 3D performance shines cleanly.
    slotLeftEl.hidden = !isBlocking;
    slotLeftEl.classList.toggle('is-hidden', !isBlocking);
    slotRightEl.hidden = !isBlocking;
    slotRightEl.classList.toggle('is-hidden', !isBlocking);

    // Non-blocking Act 1 3-step coach callout
    let coachStep = Number(state?.tutorialStep) || 0;
    if (isBlocking && actId === 1 && coachStep === 0 && (state?.progress?.unlockedTakes?.length || 0) === 0) {
      const hasActor = Boolean(state?.slots?.actorId);
      const hasProp = Boolean(state?.slots?.propId);
      coachStep = hasActor && hasProp ? 3 : hasActor || hasProp ? 2 : 1;
    }
    const showCoach = Boolean(isBlocking && actId === 1 && COACH_MESSAGES[coachStep]);
    const isShortLandscape = window.innerHeight <= 480 && window.innerWidth >= 560;
    if (showCoach && isShortLandscape) {
      coachEl.hidden = true;
      coachEl.classList.add('is-hidden');
      cueBannerEl.textContent = COACH_MESSAGES[coachStep];
      cueBannerEl.classList.add('is-coach-cue');
    } else {
      cueBannerEl.classList.remove('is-coach-cue');
      coachEl.hidden = !showCoach;
      coachEl.classList.toggle('is-hidden', !showCoach);
      if (showCoach) {
        coachEl.textContent = COACH_MESSAGES[coachStep];
      }
    }

    if (isBlocking) {
      syncSlotCentersWith3D(showCoach);
      updateOneSlot(slotLeftEl, btnClearLeft, slotLeftIcon, slotLeftPill, leftKind, state, true);
      updateOneSlot(slotRightEl, btnClearRight, slotRightIcon, slotRightPill, rightKind, state, true);
      applyHoverClasses();
    }

    const isRolling = phase === 'rolling';
    rollingPill.hidden = !isRolling;
    rollingPill.classList.toggle('is-hidden', !isRolling);

    syncMoodStrip(state);
  }

  function getSlotHitKind(clientX, clientY) {
    for (const slotEl of [slotLeftEl, slotRightEl]) {
      if (slotEl.hidden) continue;
      const r = slotEl.getBoundingClientRect();
      const pad = 20;
      if (
        clientX >= r.left - pad &&
        clientX <= r.right + pad &&
        clientY >= r.top - pad &&
        clientY <= r.bottom + pad
      ) {
        return slotEl.dataset.slotKind || null;
      }
    }
    const pick = ctx.render?.pickStage?.(clientX, clientY);
    if (pick && pick.kind === 'slot' && pick.slotKind) {
      return pick.slotKind;
    }
    // Generous stage-half fallback if dropped inside the 35mm stage window
    const winRect = windowEl.getBoundingClientRect();
    if (
      clientX >= winRect.left &&
      clientX <= winRect.right &&
      clientY >= winRect.top &&
      clientY <= winRect.bottom
    ) {
      const midX = winRect.left + winRect.width * 0.5;
      return clientX < midX
        ? slotLeftEl.dataset.slotKind || null
        : slotRightEl.dataset.slotKind || null;
    }
    return null;
  }

  return {
    leftCol,
    centerCol,
    sync,
    getSlotHitKind,
  };
}
