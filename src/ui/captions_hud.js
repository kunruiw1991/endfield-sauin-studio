// Synchronized Cinema Voiceover Subtitle Pill (#captions-hud)
// Synced to voStarted / voEnded via ui.showCaption / ui.clearCaption (owner: @ui-hud).

export function createCaptionsHud(ctx, mountParent) {
  const el = document.createElement('aside');
  el.id = 'captions-hud';
  el.className = 'captions-hud vo-caption caption-banner is-hidden';
  el.setAttribute('data-caption', 'true');
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', 'polite');
  el.hidden = true;

  el.innerHTML = `
    <span class="vo-wave-bars" aria-hidden="true">
      <span></span><span></span><span></span><span></span>
    </span>
    <span id="vo-caption-speaker" class="vo-caption-speaker">Stage Narrator:</span>
    <span id="vo-caption-text" class="vo-caption-text"></span>
  `;

  mountParent.appendChild(el);

  const speakerEl = el.querySelector('#vo-caption-speaker');
  const textEl = el.querySelector('#vo-caption-text');
  let clearTimer = null;
  let currentPayload = null;

  function isRedundantOnScreen(payload) {
    if (!payload || !payload.text) return false;
    const st = ctx.state;
    if (!st || st.modal) return false;
    const phase = st.phase || 'title';
    const voId = String(payload.voId || '');
    if (phase === 'dialogue' && /^vo_s\d+_dlg_/.test(voId)) return true;
    if (phase === 'take_result' && /^vo_take_/.test(voId)) return true;
    if (phase === 'ending' && /^vo_end_/.test(voId)) return true;
    return false;
  }

  function applyVisibility() {
    if (!currentPayload || !currentPayload.text || isRedundantOnScreen(currentPayload)) {
      el.hidden = true;
      el.classList.add('is-hidden');
      mountParent.classList.remove('has-caption');
      return;
    }
    const speaker = String(currentPayload.speaker || 'Stage Narrator').trim();
    speakerEl.textContent = `\uD83C\uDF99 ${speaker}:`;
    textEl.textContent = String(currentPayload.text).trim();
    el.dataset.voId = String(currentPayload.voId || '');
    el.hidden = false;
    el.classList.remove('is-hidden');
    mountParent.classList.add('has-caption');
  }

  function showCaption(payload = {}) {
    if (clearTimer) {
      clearTimeout(clearTimer);
      clearTimer = null;
    }
    const text = String(payload.text || '').trim();
    if (!text) {
      clearCaption(true);
      return;
    }
    currentPayload = {
      voId: String(payload.voId || ''),
      speaker: String(payload.speaker || 'Stage Narrator').trim(),
      text,
    };
    applyVisibility();
  }

  function clearCaption(immediate = false) {
    if (clearTimer) {
      clearTimeout(clearTimer);
      clearTimer = null;
    }
    const hideNow = () => {
      currentPayload = null;
      el.hidden = true;
      el.classList.add('is-hidden');
      el.dataset.voId = '';
      mountParent.classList.remove('has-caption');
    };
    if (immediate) {
      hideNow();
    } else {
      clearTimer = setTimeout(hideNow, 220);
    }
  }

  function sync() {
    const au = ctx.audio?.getAudioStats?.();
    if (au && au.activeCaption && au.activeCaption.text) {
      const nextVoId = String(au.activeVoId || au.activeCaption.voId || '');
      if (
        !currentPayload ||
        currentPayload.text !== au.activeCaption.text ||
        (nextVoId && currentPayload.voId !== nextVoId)
      ) {
        currentPayload = {
          voId: nextVoId,
          speaker: String(au.activeCaption.speaker || 'Stage Narrator').trim(),
          text: String(au.activeCaption.text).trim(),
        };
      }
      applyVisibility();
    } else if (ctx.activeCaption && ctx.activeCaption.text) {
      currentPayload = {
        voId: String(ctx.activeCaption.voId || ''),
        speaker: String(ctx.activeCaption.speaker || 'Stage Narrator').trim(),
        text: String(ctx.activeCaption.text).trim(),
      };
      applyVisibility();
    } else {
      applyVisibility();
    }
  }

  return {
    el,
    showCaption,
    clearCaption,
    sync,
  };
}
