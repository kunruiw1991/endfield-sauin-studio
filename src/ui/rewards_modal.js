// Event Rewards Modal (rewards_modal.js) — 8 Studio Commissions (300 Oroberyl & 40,000 T-Creds)
// Zero-scroll responsive grid across 1280x800, 1024x768, 844x390, and 390x844 (owner: @ui-hud).

export function createRewardsModal(ctx, modalMountEl, bindTap, helpers) {
  const el = document.createElement('div');
  el.id = 'rewards-modal';
  el.className = 'sauin-modal-card modal-card modal-panel is-hidden';
  el.hidden = true;
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-label', 'Sauin Studio Commissions & Rewards');

  el.innerHTML = `
    <div class="modal-header-bar">
      <div class="modal-title-group">
        <h2>\uD83C\uDF81 Studio Commissions</h2>
        <span id="rewards-oroberyl-pill" class="modal-counter-pill">Oroberyl: 0 / 300</span>
        <span id="rewards-tcreds-pill" class="modal-counter-pill">T-Creds: 0 / 40,000</span>
      </div>
      <div class="modal-header-actions">
        <button type="button" id="btn-claim-all" class="sauin-btn btn-primary" data-action="claim-all">
          <span>Claim All</span>
        </button>
        <button type="button" id="btn-rewards-close" class="sauin-btn btn-icon-pill" data-action="close-modal">
          <span>\u2715 Close</span>
        </button>
      </div>
    </div>

    <div id="rewards-grid" class="rewards-grid"></div>
  `;

  modalMountEl.appendChild(el);

  const oroberylPill = el.querySelector('#rewards-oroberyl-pill');
  const tcredsPill = el.querySelector('#rewards-tcreds-pill');
  const btnClaimAll = el.querySelector('#btn-claim-all');
  const btnClose = el.querySelector('#btn-rewards-close');
  const gridEl = el.querySelector('#rewards-grid');

  let lastSig = '';

  bindTap(btnClaimAll, () => {
    helpers.unlockAudio();
    const claimed = ctx.mechanics?.claimAllReady?.();
    if (Array.isArray(claimed) && claimed.length > 0) {
      ctx.events?.emit?.('sfx', { name: 'reward_chime', vol: 0.8 });
      helpers.showToast(`Claimed ${claimed.length} Studio Commission${claimed.length > 1 ? 's' : ''}!`);
    } else {
      ctx.events?.emit?.('sfx', { name: 'ui_click', vol: 0.5 });
      helpers.showToast('Complete more milestones to claim Studio Commissions!');
    }
    lastSig = '';
    helpers.requestSync();
  });

  bindTap(btnClose, () => {
    helpers.unlockAudio();
    ctx.events?.emit?.('sfx', { name: 'ui_click', vol: 0.6 });
    helpers.closeModal();
  });

  function bindClaimButtons() {
    const btns = Array.from(gridEl.querySelectorAll('[data-claim-id]'));
    for (const btn of btns) {
      bindTap(btn, () => {
        helpers.unlockAudio();
        const id = btn.getAttribute('data-claim-id');
        if (!id) return;
        const ok = ctx.mechanics?.claimCommission?.(id);
        if (ok !== false) {
          ctx.events?.emit?.('sfx', { name: 'reward_chime', vol: 0.78 });
        }
        lastSig = '';
        helpers.requestSync();
      });
    }
  }

  function sync(state) {
    const open = state?.modal === 'rewards';
    el.hidden = !open;
    el.classList.toggle('is-hidden', !open);
    if (!open) return;

    const prog = state?.progress || {};
    const oroberyl = Number(prog.oroberyl) || 0;
    const tCreds = Number(prog.tCreds) || 0;
    oroberylPill.textContent = `Oroberyl: ${oroberyl} / 300`;
    tcredsPill.textContent = `T-Creds: ${tCreds.toLocaleString('en-US')} / 40,000`;

    const list = helpers.getCommissionsList();
    let readyCount = 0;
    const evals = list.map((comm) => {
      const ev = helpers.evaluateCommission(comm, prog);
      if (ev.claimable) readyCount += 1;
      return { comm, ev };
    });

    btnClaimAll.disabled = readyCount === 0;
    btnClaimAll.classList.toggle('is-disabled', readyCount === 0);
    btnClaimAll.textContent = readyCount > 0 ? `Claim All (${readyCount})` : 'Claim All';

    const sig = evals
      .map(({ comm, ev }) => `${comm.id}:${ev.current}/${ev.target}:${ev.claimed ? 2 : ev.claimable ? 1 : 0}`)
      .join('|');
    if (sig === lastSig) return;
    lastSig = sig;

    gridEl.innerHTML = evals
      .map(({ comm, ev }) => {
        const pct = Math.min(100, Math.round((ev.current / Math.max(1, ev.target)) * 100));
        const stateCls = ev.claimed ? ' is-claimed' : ev.claimable ? ' is-claimable' : '';
        let actionMarkup = '';
        if (ev.claimed) {
          actionMarkup = `<span class="commission-status-tag">\u2713 Claimed</span>`;
        } else if (ev.claimable) {
          actionMarkup = `
            <button type="button" class="sauin-btn btn-primary btn-icon-pill" data-claim-id="${helpers.escapeHtml(comm.id)}" data-commission-id="${helpers.escapeHtml(comm.id)}">
              <span>Claim</span>
            </button>
          `;
        } else {
          actionMarkup = `<span class="commission-status-tag">${ev.current}/${ev.target}</span>`;
        }

        const fullTitle = comm.title || comm.shortTitle || comm.id;
        const shortTitle = comm.shortTitle || fullTitle;
        const fullDesc = comm.description || comm.shortDescription || '';
        const shortDesc = comm.shortDescription || fullDesc;
        const tCredsNum = Number(comm.tCreds || 5000);
        const tCredsShort = tCredsNum >= 1000 ? `${Math.round(tCredsNum / 1000)}k` : String(tCredsNum);

        return `
          <div class="commission-card${stateCls}" data-commission-card="${helpers.escapeHtml(comm.id)}">
            <div class="commission-info">
              <div class="commission-title-row">
                <span class="commission-title">
                  <span class="comm-title-full">${helpers.escapeHtml(fullTitle)}</span>
                  <span class="comm-title-short">${helpers.escapeHtml(shortTitle)}</span>
                </span>
                <span class="commission-loot">
                  <span class="comm-loot-full">+${comm.oroberyl} Oroberyl &middot; +${tCredsNum.toLocaleString('en-US')} T-Creds</span>
                  <span class="comm-loot-short">+${comm.oroberyl} Oro &middot; +${tCredsShort} TC</span>
                </span>
              </div>
              <div class="commission-desc">
                <span class="comm-desc-full">${helpers.escapeHtml(fullDesc)}</span>
                <span class="comm-desc-short">${helpers.escapeHtml(shortDesc)}</span>
              </div>
              <div class="commission-progress-track">
                <div class="commission-progress-fill" style="width:${pct}%"></div>
              </div>
            </div>
            ${actionMarkup}
          </div>
        `;
      })
      .join('');

    bindClaimButtons();
  }

  return { el, sync };
}
