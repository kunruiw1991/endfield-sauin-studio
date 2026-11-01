// Sauin Studio Commissions, Film Album unlock ledger (20/20 takes + 5/5 endings),
// Oroberyl/T-Creds rewards, and localStorage persistence bridge (owner: mechanics).

import { COMMISSIONS, evaluateCommission, getCommission } from '../levels/commissions.js';
import { TOTAL_ENDINGS, TOTAL_OROBERYL, TOTAL_TAKES, TOTAL_TCREDS } from '../levels/constants.js';

export function getCommissionsList(ctx) {
  const src = ctx?.levels?.COMMISSIONS || ctx?.levels?.commissions || COMMISSIONS;
  return Array.isArray(src) ? src : Object.values(src || {});
}

export function createCommissionsManager(ctx, { recordInteraction }) {
  let masterVoTriggered = false;
  let pendingMasterVoUnsub = null;

  function emit(type, payload) {
    ctx?.events?.emit?.(type, payload);
  }

  function ensureProgressShape() {
    if (!ctx.state.progress || typeof ctx.state.progress !== 'object') {
      ctx.state.progress = {
        runsCompleted: 0,
        unlockedTakes: [],
        unlockedEndings: [],
        claimedCommissions: [],
        oroberyl: 0,
        tCreds: 0,
      };
    }
    const p = ctx.state.progress;
    if (!Array.isArray(p.unlockedTakes)) p.unlockedTakes = [];
    if (!Array.isArray(p.unlockedEndings)) p.unlockedEndings = [];
    if (!Array.isArray(p.claimedCommissions)) p.claimedCommissions = [];
    p.runsCompleted = Math.max(0, Math.floor(Number(p.runsCompleted) || 0));
    p.oroberyl = Math.max(0, Math.floor(Number(p.oroberyl) || 0));
    p.tCreds = Math.max(0, Math.floor(Number(p.tCreds) || 0));
    return p;
  }

  function persistProgress() {
    const p = ensureProgressShape();
    if (typeof ctx?.persistence?.saveProgress === 'function') {
      ctx.persistence.saveProgress(p);
    } else if (typeof ctx?.persistence?.save === 'function') {
      ctx.persistence.save(p);
    }
  }

  function isMasterComplete() {
    const p = ensureProgressShape();
    return p.unlockedTakes.length >= TOTAL_TAKES && p.unlockedEndings.length >= TOTAL_ENDINGS;
  }

  function scheduleMasterCompleteVo({ afterCurrentVo = true } = {}) {
    if (masterVoTriggered) return;
    masterVoTriggered = true;

    if (!afterCurrentVo || !ctx?.events?.once) {
      emit('voPlay', { voId: 'vo_all_complete' });
      return;
    }

    if (pendingMasterVoUnsub) {
      pendingMasterVoUnsub();
      pendingMasterVoUnsub = null;
    }
    pendingMasterVoUnsub = ctx.events.once('voEnded', () => {
      pendingMasterVoUnsub = null;
      emit('voPlay', { voId: 'vo_all_complete' });
    });
  }

  function recordTake(takeId) {
    if (typeof takeId !== 'string' || takeId.length === 0) return false;
    const p = ensureProgressShape();
    const wasMaster = isMasterComplete();
    let isNew = false;
    if (!p.unlockedTakes.includes(takeId)) {
      p.unlockedTakes.push(takeId);
      isNew = true;
    }
    persistProgress();

    if (!wasMaster && isMasterComplete()) {
      scheduleMasterCompleteVo({ afterCurrentVo: true });
    }
    return isNew;
  }

  function recordEnding(endingId, { incrementRuns = true } = {}) {
    if (typeof endingId !== 'string' || endingId.length === 0) return false;
    const p = ensureProgressShape();
    const wasMaster = isMasterComplete();

    if (incrementRuns) {
      p.runsCompleted += 1;
    }
    let isNew = false;
    if (!p.unlockedEndings.includes(endingId)) {
      p.unlockedEndings.push(endingId);
      isNew = true;
    }
    persistProgress();

    if (!wasMaster && isMasterComplete()) {
      scheduleMasterCompleteVo({ afterCurrentVo: true });
    }
    return isNew;
  }

  function getCommissionStatus(commissionOrId) {
    const p = ensureProgressShape();
    const list = getCommissionsList(ctx);
    const comm =
      typeof commissionOrId === 'string'
        ? list.find((c) => c.id === commissionOrId || c.commissionId === commissionOrId) ||
          getCommission(commissionOrId)
        : commissionOrId;
    if (!comm) {
      return {
        id: String(commissionOrId || ''),
        current: 0,
        target: 1,
        completed: false,
        claimed: false,
        claimable: false,
        oroberyl: 0,
        tCreds: 0,
      };
    }
    const status = evaluateCommission(comm, p);
    return {
      ...comm,
      ...status,
    };
  }

  function getAllStatuses() {
    const list = getCommissionsList(ctx);
    return list.map((comm) => getCommissionStatus(comm));
  }

  function claimSingleInternal(comm, { silentAudio = false } = {}) {
    const p = ensureProgressShape();
    const status = evaluateCommission(comm, p);
    if (!status.claimable) {
      return null;
    }
    p.claimedCommissions.push(comm.id);
    const oro = Math.max(0, Number(comm.oroberyl) || 0);
    const creds = Math.max(0, Number(comm.tCreds) || 0);
    p.oroberyl = Math.min(TOTAL_OROBERYL, p.oroberyl + oro);
    p.tCreds = Math.min(TOTAL_TCREDS, p.tCreds + creds);

    emit('commissionClaimed', {
      commissionId: comm.id,
      oroberyl: oro,
      tCreds: creds,
      totalOroberyl: p.oroberyl,
      totalTCreds: p.tCreds,
    });

    if (!silentAudio) {
      emit('sfx', { name: 'reward_chime' });
      emit('voPlay', { voId: 'vo_rewards_claim' });
      if (comm.id === 'comm_master_all') {
        scheduleMasterCompleteVo({ afterCurrentVo: true });
      }
    }

    return {
      commissionId: comm.id,
      oroberyl: oro,
      tCreds: creds,
    };
  }

  function claimCommission(id) {
    const list = getCommissionsList(ctx);
    const comm =
      list.find((c) => c.id === id || c.commissionId === id) || getCommission(id);
    if (!comm) {
      recordInteraction('blocked', 0, 0);
      emit('sfx', { name: 'ui_click', pitch: 0.72 });
      return false;
    }

    const p = ensureProgressShape();
    const status = evaluateCommission(comm, p);
    if (!status.claimable) {
      recordInteraction('blocked', 0, 0);
      emit('sfx', { name: 'ui_click', pitch: 0.75 });
      return false;
    }

    recordInteraction('ui', 0, 0);
    const claimed = claimSingleInternal(comm, { silentAudio: false });
    persistProgress();
    return Boolean(claimed);
  }

  function claimAllReady() {
    const list = getCommissionsList(ctx);
    const p = ensureProgressShape();
    const ready = list.filter((comm) => evaluateCommission(comm, p).claimable);

    if (ready.length === 0) {
      recordInteraction('blocked', 0, 0);
      emit('sfx', { name: 'ui_click', pitch: 0.75 });
      return [];
    }

    recordInteraction('ui', 0, 0);
    const claimedResults = [];
    let claimedMaster = false;

    for (let i = 0; i < ready.length; i++) {
      const res = claimSingleInternal(ready[i], { silentAudio: true });
      if (res) {
        claimedResults.push(res.commissionId);
        if (res.commissionId === 'comm_master_all') {
          claimedMaster = true;
        }
      }
    }

    persistProgress();
    emit('sfx', { name: 'reward_chime' });
    emit('voPlay', { voId: 'vo_rewards_claim' });
    if (claimedMaster) {
      scheduleMasterCompleteVo({ afterCurrentVo: true });
    }
    return claimedResults;
  }

  // Initialize masterVoTriggered from already-saved progress at boot so we don't misfire early.
  if (isMasterComplete()) {
    masterVoTriggered = true;
  }

  return {
    ensureProgressShape,
    persistProgress,
    recordTake,
    recordEnding,
    getCommissionStatus,
    getAllStatuses,
    claimCommission,
    claimAllReady,
    isMasterComplete,
  };
}
