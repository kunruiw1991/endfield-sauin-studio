/**
 * Main WebAudio + Neural English VO + Halloween March BGM + 18 SFX Engine.
 * Owner: audio-vo
 *
 * Implements createAudioEngine(ctx) per docs/DESIGN.md 4.4, 4.5, and 7.1-7.3.
 */

import { createHalloweenBGM } from './bgm_halloween.js';
import { SFX_NAMES, createSfxBank } from './sfx_bank.js';
import { FALLBACK_VO_MANIFEST, createVoPlayer } from './vo_player.js';

export { SFX_NAMES, FALLBACK_VO_MANIFEST };

const ENDING_VO_MAP = Object.freeze({
  END1: 'vo_end_1',
  END2: 'vo_end_2',
  END3: 'vo_end_3',
  END4: 'vo_end_4',
  END5: 'vo_end_5',
});

export function createAudioEngine(ctx) {
  let audioCtx = null;
  let unlocked = false;
  let sfxMuted = false;
  let initialized = false;
  let initTask = null;

  let tutCastVoPlayed = false;
  let masterVoPlayed = false;
  let albumOwnedVoId = null;
  let lastHoverSlot = null;
  let lastCurtainSfxMs = -1000;

  const unsubscribers = [];

  function nowMs() {
    return typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
  }

  function getOrCreateAudioContext() {
    if (audioCtx) return audioCtx;
    if (typeof window === 'undefined') return null;
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    try {
      audioCtx = new Ctor();
      if (audioCtx.state === 'running') {
        unlocked = true;
      }
      audioCtx.addEventListener?.('statechange', () => {
        if (audioCtx && audioCtx.state === 'running') {
          unlocked = true;
          bgm.onUnlock();
          voPlayer.onUnlock();
        }
      });
    } catch (_) {
      audioCtx = null;
    }
    return audioCtx;
  }

  function checkUnlocked() {
    if (audioCtx && audioCtx.state === 'running') {
      unlocked = true;
    }
    return unlocked;
  }

  const bgm = createHalloweenBGM({
    getContext: () => audioCtx,
    isUnlocked: checkUnlocked,
  });

  const sfxBank = createSfxBank({
    getContext: () => audioCtx,
    isUnlocked: checkUnlocked,
    isMuted: () => sfxMuted,
  });

  const voPlayer = createVoPlayer({
    getContext: () => audioCtx,
    isUnlocked: checkUnlocked,
    events: ctx?.events || null,
    onDuckChange(shouldDuck) {
      bgm.setDucked(shouldDuck);
    },
  });

  function playSFX(name, opts = {}) {
    return sfxBank.play(name, opts);
  }

  function playVO(voId, opts = {}) {
    const p = voPlayer.playVO(voId, opts);
    if (ctx?.state?.modal === 'album' && voPlayer.getStats().activeVoId === voId) {
      albumOwnedVoId = voId;
    }
    return p;
  }

  function stopVO() {
    albumOwnedVoId = null;
    voPlayer.stopVO();
  }

  function setBGM(playing) {
    bgm.setPlaying(playing);
  }

  function setMuted(flags = {}) {
    if (!flags || typeof flags !== 'object') return;
    if (typeof flags.bgm === 'boolean') {
      bgm.setMuted(flags.bgm);
    }
    if (typeof flags.vo === 'boolean') {
      voPlayer.setMuted(flags.vo);
    }
    if (typeof flags.sfx === 'boolean') {
      sfxMuted = flags.sfx;
    }
    ctx?.persistence?.saveAudio?.({
      bgmMuted: bgm.isMuted(),
      voMuted: voPlayer.getStats().voMuted,
      sfxMuted,
    });
  }

  function unlock() {
    const ac = getOrCreateAudioContext();
    if (!ac) return false;
    if (ac.state === 'running') {
      unlocked = true;
      bgm.onUnlock();
      voPlayer.onUnlock();
      return true;
    }
    if (typeof ac.resume === 'function') {
      try {
        const p = ac.resume();
        if (p && typeof p.then === 'function') {
          p.then(() => {
            if (ac.state === 'running') {
              unlocked = true;
              bgm.onUnlock();
              voPlayer.onUnlock();
            }
          }).catch(() => {
            // Autoplay remains gated until real user gesture.
          });
        }
      } catch (_) {
        // Ignore synchronous resume errors.
      }
    }
    return checkUnlocked();
  }

  function playCurtainSwishDebounced(open = true) {
    const t = nowMs();
    if (t - lastCurtainSfxMs < 140) return;
    lastCurtainSfxMs = t;
    playSFX('curtain_swish', { pitch: open ? 1.04 : 0.92 });
  }

  function playPropAccentSfx(propId, vol = 0.85) {
    if (!propId) return;
    if (propId === 'roast_steak') {
      playSFX('steak_sizzle', { vol });
    } else if (propId === 'lankybeast') {
      playSFX('frog_ribbit', { vol });
    } else if (propId === 'one_handed_sword') {
      playSFX('sword_ring', { vol });
    } else if (propId === 'fireworks') {
      playSFX('firework_burst', { vol });
    }
  }

  function bindEvents() {
    const events = ctx?.events;
    if (!events || typeof events.on !== 'function' || unsubscribers.length > 0) {
      return;
    }

    unsubscribers.push(
      events.on('voPlay', (payload = {}) => {
        if (payload && payload.voId) {
          playVO(payload.voId, {
            force: Boolean(payload.force),
            priority: payload.priority,
          });
        }
      })
    );

    unsubscribers.push(
      events.on('sfx', (payload = {}) => {
        const sfxName = typeof payload === 'string' ? payload : payload?.name;
        if (sfxName) {
          playSFX(sfxName, typeof payload === 'object' ? payload : {});
        }
      })
    );

    unsubscribers.push(
      events.on('curtainMove', (payload = {}) => {
        playCurtainSwishDebounced(payload?.open !== false);
      })
    );

    unsubscribers.push(
      events.on('clapperSnap', (payload = {}) => {
        playSFX('clapper_snap');
        const actId = Number(payload?.actId ?? ctx?.state?.actId ?? 1);
        if (actId === 1) {
          playVO('vo_clapper_start');
        }
      })
    );

    unsubscribers.push(
      events.on('phaseChange', (payload = {}) => {
        const from = payload?.from;
        const to = payload?.to;
        const actId = Number(payload?.actId ?? ctx?.state?.actId ?? 1);
        const curVo = voPlayer.getStats().activeVoId;

        // Cleanly end phase-scoped VO lines when exiting their screen so lower-priority
        // next-phase prompts (e.g. vo_tut_cast Prio 2 or new run Prio 3) are never blocked.
        if (from === 'dialogue' && to !== 'dialogue') {
          if (curVo && curVo.startsWith('vo_s') && curVo.includes('_dlg_')) {
            stopVO();
          }
        } else if (from === 'take_result' && to !== 'take_result') {
          if (curVo && curVo.startsWith('vo_take_')) {
            stopVO();
          }
        } else if (from === 'ending' && to !== 'ending') {
          if (curVo && curVo.startsWith('vo_end_')) {
            stopVO();
          }
        }
        if (
          to === 'clapper' &&
          (curVo === 'vo_all_complete' ||
            curVo === 'vo_rewards_claim' ||
            (curVo && curVo.startsWith('vo_end_')))
        ) {
          stopVO();
        }

        if (to === 'dialogue' || to === 'ending' || (to === 'title' && from && from !== 'title')) {
          playCurtainSwishDebounced(to !== 'title');
        }

        if (to === 'dialogue') {
          queueMicrotask(() => {
            if (ctx?.state?.phase !== 'dialogue') return;
            const activeId = voPlayer.getStats().activeVoId;
            const dlgVoId = ctx?.state?.dialogue?.voId;
            if (dlgVoId && activeId !== dlgVoId) {
              playVO(dlgVoId);
            }
          });
        } else if (to === 'blocking') {
          if (actId === 1 && (!tutCastVoPlayed || ctx?.state?.tutorialStep === 1)) {
            tutCastVoPlayed = true;
            playVO('vo_tut_cast');
          }
        }
      })
    );

    unsubscribers.push(
      events.on('dialogueStep', (payload = {}) => {
        playSFX('ui_click', { pitch: 1.08, vol: 0.45 });
        const voId = payload?.voId || payload?.line?.voId || ctx?.state?.dialogue?.voId;
        if (voId) {
          playVO(voId);
        }
      })
    );

    unsubscribers.push(
      events.on('dialogueSkipped', () => {
        const curVo = voPlayer.getStats().activeVoId;
        if (curVo && curVo.startsWith('vo_s') && curVo.includes('_dlg_')) {
          stopVO();
        }
        playSFX('tab_flip', { pitch: 1.12 });
      })
    );

    unsubscribers.push(
      events.on('tabChanged', () => {
        playSFX('tab_flip');
      })
    );

    unsubscribers.push(
      events.on('slotHover', (payload = {}) => {
        const nextSlot = payload?.slotKind || null;
        if (nextSlot && nextSlot !== lastHoverSlot) {
          playSFX('card_pickup', {
            pitch: payload?.valid === false ? 0.86 : 1.06,
            vol: payload?.valid === false ? 0.45 : 0.72,
          });
        }
        lastHoverSlot = nextSlot;
      })
    );

    unsubscribers.push(
      events.on('slotCast', (payload = {}) => {
        playSFX('slot_snap');
        playPropAccentSfx(payload?.itemId, 0.52);
      })
    );

    unsubscribers.push(
      events.on('slotCleared', () => {
        playSFX('slot_clear');
      })
    );

    unsubscribers.push(
      events.on('cameraRollStart', (payload = {}) => {
        const curVo = voPlayer.getStats().activeVoId;
        if (
          curVo === 'vo_clapper_start' ||
          (curVo && curVo.startsWith('vo_s') && curVo.includes('_dlg_'))
        ) {
          stopVO();
        }
        playSFX('camera_whir');
        playPropAccentSfx(payload?.propId || ctx?.state?.slots?.propId, 0.88);
        playVO('vo_roll_action');
      })
    );

    unsubscribers.push(
      events.on('choreoBeat', (payload = {}) => {
        const kind = String(payload?.kind || '');
        if (kind.includes('flash') || kind.includes('shutter')) {
          playSFX('shutter_flash', { vol: 0.75 });
        } else if (kind.includes('firework') || kind.includes('spark')) {
          playSFX('firework_burst', { vol: 0.75 });
        } else if (kind.includes('sizzle') || kind.includes('steak') || kind.includes('smoke')) {
          playSFX('steak_sizzle', { vol: 0.75 });
        } else if (kind.includes('ribbit') || kind.includes('leap') || kind.includes('frog')) {
          playSFX('frog_ribbit', { vol: 0.75 });
        } else if (kind.includes('sword') || kind.includes('slash')) {
          playSFX('sword_ring', { vol: 0.75 });
        } else if (Number(payload?.beatIndex) === 1) {
          playSFX('gag_pop', { vol: 0.55, pitch: 1.08 });
        }
      })
    );

    unsubscribers.push(
      events.on('stageGagTriggered', (payload = {}) => {
        playSFX('gag_pop');
        if (payload?.gagId === 'gag_crystal_chime') {
          playSFX('reward_chime', { pitch: 1.22, vol: 0.55 });
        } else if (payload?.gagId === 'gag_neon_wink') {
          playSFX('mood_up_1', { pitch: 1.15, vol: 0.5 });
        }
      })
    );

    unsubscribers.push(
      events.on('takeCompleted', (payload = {}) => {
        playSFX('shutter_flash');
        const delta = payload?.moodDelta || ctx?.state?.currentTake?.moodDelta || {};
        const maxBoost = Math.max(
          0,
          Number(delta.love) || 0,
          Number(delta.joy) || 0,
          Number(delta.wonder) || 0,
          Number(delta.chaos) || 0
        );
        if (maxBoost >= 2) {
          playSFX('mood_up_2');
        } else {
          playSFX('mood_up_1');
        }

        const takeId = payload?.takeId || ctx?.state?.currentTake?.takeId;
        const voId =
          ctx?.levels?.TAKES?.[takeId]?.voId ||
          ctx?.state?.currentTake?.voId ||
          (takeId ? `vo_${takeId}` : null);
        if (voId) {
          playVO(voId);
        }
      })
    );

    unsubscribers.push(
      events.on('reshootRequested', () => {
        const curVo = voPlayer.getStats().activeVoId;
        if (curVo && curVo.startsWith('vo_take_')) {
          stopVO();
        }
        playSFX('slot_clear', { pitch: 0.92 });
        playVO('vo_reshoot');
      })
    );

    unsubscribers.push(
      events.on('endingRevealed', (payload = {}) => {
        playSFX('ending_fanfare');
        const endingId = payload?.endingId || ctx?.state?.currentEnding?.endingId;
        const voId =
          ctx?.levels?.ENDINGS?.[endingId]?.voId ||
          ctx?.state?.currentEnding?.voId ||
          ENDING_VO_MAP[endingId] ||
          null;
        if (voId) {
          playVO(voId);
        }
      })
    );

    unsubscribers.push(
      events.on('modalOpened', (payload = {}) => {
        const modal = typeof payload === 'string' ? payload : payload?.modal;
        playSFX('ui_click');
        if (modal === 'album') {
          playVO('vo_album_open');
        } else if (modal === 'rewards') {
          const takesDone = (ctx?.state?.progress?.unlockedTakes || []).length >= 20;
          const endsDone = (ctx?.state?.progress?.unlockedEndings || []).length >= 5;
          if (takesDone && endsDone && !masterVoPlayed) {
            masterVoPlayed = true;
            playVO('vo_all_complete');
          }
        }
      })
    );

    unsubscribers.push(
      events.on('modalClosed', (payload = {}) => {
        const closedModal = typeof payload === 'string' ? payload : payload?.modal;
        const curVo = voPlayer.getStats().activeVoId;
        if (
          closedModal === 'album' &&
          curVo &&
          (curVo === 'vo_album_open' || curVo === albumOwnedVoId)
        ) {
          stopVO();
        } else if (
          closedModal === 'rewards' &&
          (curVo === 'vo_all_complete' || curVo === 'vo_rewards_claim')
        ) {
          stopVO();
        }
        playSFX('ui_click', { pitch: 0.88, vol: 0.7 });
      })
    );

    unsubscribers.push(
      events.on('commissionClaimed', (payload = {}) => {
        playSFX('reward_chime');
        const commId = payload?.commissionId || payload?.id;
        if (commId === 'comm_master_all') {
          masterVoPlayed = true;
          playVO('vo_all_complete');
        } else {
          playVO('vo_rewards_claim');
        }
      })
    );

    unsubscribers.push(
      events.on('feedback', (payload = {}) => {
        if (payload?.kind === 'ui') {
          playSFX('ui_click', { vol: 0.6 });
        } else if (payload?.kind === 'blocked') {
          playSFX('slot_clear', { pitch: 0.74, vol: 0.6 });
        }
      })
    );
  }

  function init() {
    if (!initialized) {
      initialized = true;
      const savedAudio = ctx?.persistence?.loadAudio?.();
      if (savedAudio) {
        bgm.setMuted(Boolean(savedAudio.bgmMuted));
        voPlayer.setMuted(Boolean(savedAudio.voMuted));
        sfxMuted = Boolean(savedAudio.sfxMuted);
      }
      bindEvents();
      // Attempt non-throwing AudioContext creation if autoplay policy permits it;
      // otherwise stays suspended until first gesture calls unlock().
      if (typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)) {
        getOrCreateAudioContext();
      }
    }
    if (!initTask) {
      initTask = voPlayer.init();
    }
    return initTask;
  }

  // Bind event bus immediately on construction so early boot events are never missed.
  bindEvents();

  function update(dt) {
    checkUnlocked();
    voPlayer.update(dt);
    bgm.update(dt);
  }

  function getAudioStats() {
    const voStats = voPlayer.getStats();
    return {
      unlocked: checkUnlocked(),
      bgmPlaying: bgm.isPlaying(),
      bgmDucked: bgm.isDucked(),
      bgmGain: bgm.getGain(),
      bgmMuted: bgm.isMuted(),
      voMuted: voStats.voMuted,
      sfxMuted,
      activeVoId: voStats.activeVoId,
      activeCaption: voStats.activeCaption,
      manifestLoaded: voStats.manifestLoaded,
      clipsTotal: voStats.clipsTotal,
      clipsVerified: voStats.clipsVerified,
      voPlayedIds: voStats.voPlayedIds,
      sfxPlayedCount: sfxBank.getPlayedCount(),
      speechSynthesisUsed: false,
    };
  }

  return {
    init,
    unlock,
    playVO,
    stopVO,
    playSFX,
    setBGM,
    setMuted,
    update,
    getAudioStats,
    getClipMeta: (voId) => voPlayer.getClipMeta(voId),
    getManifest: () => voPlayer.getManifest(),
  };
}
