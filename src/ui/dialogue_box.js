// Burnt-Celluloid Pre-Shoot Cutscene Dialogue Bar (#dialogue-layer)
// Polaroid chibi portrait frame, speaker ribbon, English line, Next tap-anywhere, Skip (owner: @ui-hud).

import { getPortraitDataURL } from '../render/chibi_atlas.js';

const MINI_BAT_SVG = `
<svg class="dialogue-polaroid-bat" viewBox="0 0 56 34" aria-hidden="true">
  <path d="M28 18 C20 6, 8 4, 2 12 C10 15, 13 21, 10 28 C18 23, 24 25, 28 30 C32 25, 38 23, 46 28 C43 21, 46 15, 54 12 C48 4, 36 6, 28 18 Z"
        fill="#b8252b" stroke="#fff7e6" stroke-width="2.4" stroke-linejoin="round"/>
</svg>`;

export function createDialogueBox(ctx, rootEl, bindTap, helpers) {
  const el = document.createElement('section');
  el.id = 'dialogue-layer';
  el.className = 'dialogue-layer ui-bg-layer is-hidden';
  el.hidden = true;
  el.setAttribute('aria-label', 'Pre-Shoot Cutscene Dialogue');

  el.innerHTML = `
    <div class="dialogue-top-controls">
      <button type="button" id="btn-dialogue-skip" class="sauin-btn btn-icon-pill" data-action="skip-dialogue">
        <span>Skip \u23ED</span>
      </button>
    </div>

    <div id="dialogue-stage-wrap" class="dialogue-stage-wrap dialogue-bar dialogue-box">
      <div class="dialogue-polaroid">
        <img id="dialogue-portrait-img" alt="Speaker Portrait" src="" />
        ${MINI_BAT_SVG}
      </div>

      <div class="dialogue-celluloid-bar">
        <div id="dialogue-speaker" class="dialogue-speaker-ribbon">Sarkaz Director</div>
        <p id="dialogue-text" class="dialogue-line-text"></p>
        <div class="dialogue-footer-row">
          <span id="dialogue-counter" class="dialogue-step-counter">Line 1 / 1</span>
          <button type="button" id="btn-dialogue-next" class="sauin-btn btn-primary" data-action="next-dialogue">
            <span>Next \u25B6</span>
          </button>
        </div>
      </div>
    </div>
  `;

  rootEl.appendChild(el);

  const btnSkip = el.querySelector('#btn-dialogue-skip');
  const btnNext = el.querySelector('#btn-dialogue-next');
  const barWrap = el.querySelector('#dialogue-stage-wrap');
  const portraitImg = el.querySelector('#dialogue-portrait-img');
  const speakerEl = el.querySelector('#dialogue-speaker');
  const textEl = el.querySelector('#dialogue-text');
  const counterEl = el.querySelector('#dialogue-counter');

  let lastStepTs = -1000;
  function stepNext() {
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (now - lastStepTs < 280) return;
    lastStepTs = now;
    helpers.unlockAudio();
    ctx.events?.emit?.('sfx', { name: 'ui_click', vol: 0.55 });
    ctx.mechanics?.advanceDialogue?.();
    helpers.requestSync();
  }

  bindTap(btnSkip, (e) => {
    e?.stopPropagation?.();
    helpers.unlockAudio();
    ctx.events?.emit?.('sfx', { name: 'tab_flip', vol: 0.65 });
    ctx.mechanics?.skipDialogue?.();
    helpers.requestSync();
  });

  bindTap(btnNext, (e) => {
    e?.stopPropagation?.();
    stepNext();
  });

  // Allow tapping anywhere on the burnt-celluloid bar (outside buttons) to advance cleanly.
  let barHandledUp = false;
  let barUpTs = -999;
  barWrap.addEventListener('pointerdown', (e) => {
    if (e.target && e.target.closest('button')) return;
    barHandledUp = false;
  });
  barWrap.addEventListener('pointerup', (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    if (e.target && e.target.closest('button')) return;
    barHandledUp = true;
    barUpTs = typeof performance !== 'undefined' ? performance.now() : Date.now();
    stepNext();
  });
  barWrap.addEventListener('click', (e) => {
    if (e.target && e.target.closest('button')) return;
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (barHandledUp && now - barUpTs < 280) {
      barHandledUp = false;
      return;
    }
    stepNext();
  });

  let lastPortraitKey = '';

  function resolveCurrentDialogueLine(state) {
    const act = helpers.getAct(state?.actId || 1);
    const lines = Array.isArray(act?.dialogue) ? act.dialogue : [];
    const idx = Math.max(0, Math.min(lines.length - 1, Number(state?.dialogue?.index) || 0));
    const entry = lines[idx] || null;
    const speakerName =
      state?.dialogue?.speaker || entry?.speakerName || entry?.speaker || 'Sarkaz Director';
    const speakerId = entry?.speakerId || helpers.speakerNameToId(speakerName) || 'sarkaz_director';
    const portraitMood = entry?.portraitMood || 'neutral';
    const text = state?.dialogue?.text || entry?.text || '';
    const total = Number(state?.dialogue?.total) || lines.length || 1;
    return {
      index: idx,
      total,
      speakerId,
      speakerName,
      portraitMood,
      text,
    };
  }

  function sync(state) {
    const active = Boolean(state && state.phase === 'dialogue');
    el.hidden = !active;
    el.classList.toggle('is-hidden', !active);
    if (!active) return;

    const line = resolveCurrentDialogueLine(state);
    speakerEl.textContent = line.speakerName;
    textEl.textContent = line.text;
    counterEl.textContent = `Act ${state.actId || 1} \u00B7 Line ${line.index + 1} / ${line.total}`;

    const pKey = `${line.speakerId}::${line.portraitMood}`;
    if (pKey !== lastPortraitKey) {
      lastPortraitKey = pKey;
      try {
        portraitImg.src = getPortraitDataURL(line.speakerId, line.portraitMood);
        portraitImg.alt = `${line.speakerName} portrait`;
      } catch (_err) {
        // Ignore portrait render race.
      }
    }
  }

  return { el, sync };
}
