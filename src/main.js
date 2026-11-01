// Main Lead Integrator entrypoint for New Era for the Myriad Souls
// per docs/DESIGN.md §2, §4.1–§4.5 & Gates G1..G14 (owner: core).

import * as THREE from '../vendor/three.module.min.js';

import { DEFAULT_SEED, mulberry32, normalizeSeed } from './core/rng.js';
import { createEventBus } from './core/events.js';
import { createPersistence } from './core/persistence.js';
import {
  computeHanziCount,
  createInitialState,
  registerCanvasText,
} from './core/state.js';
import { DT, createLoop } from './core/loop.js';
import { createInput } from './core/input.js';
import { createSeam } from './core/seam.js';

import * as constantsMod from './levels/constants.js';
import * as castCatalogMod from './levels/cast_catalog.js';
import * as actsDataMod from './levels/acts_data.js';
import * as takesMatrixMod from './levels/takes_matrix.js';
import * as endingsDataMod from './levels/endings_data.js';
import * as commissionsMod from './levels/commissions.js';

import * as mechanicsMod from './mechanics/director_fsm.js';
import * as renderMod from './render/theater_scene.js';
import * as uiMod from './ui/ui_manager.js';
import * as audioMod from './audio/audio_engine.js';

function parseBootParams() {
  const out = { seed: DEFAULT_SEED, resetStorage: false };
  try {
    if (typeof window !== 'undefined' && window.location && window.location.search) {
      const sp = new URLSearchParams(window.location.search);
      if (sp.has('seed')) {
        out.seed = normalizeSeed(sp.get('seed'));
      }
      if (sp.get('reset') === '1' || sp.get('fresh') === '1') {
        out.resetStorage = true;
      }
    }
  } catch (_err) {
    // Ignore URL parse errors.
  }
  return out;
}

function yieldNextPaint() {
  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve();
    };
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(finish);
    }
    setTimeout(finish, 24);
  });
}

function ensureTitleElementId(uiRoot) {
  if (typeof document === 'undefined' || !uiRoot) return;
  if (document.getElementById('title')) return;
  const candidate = uiRoot.querySelector(
    '[data-view="title"], [data-phase="title"], .title-view, .title-screen'
  );
  if (candidate && !candidate.id) {
    candidate.id = 'title';
  }
}

function wrapRenderTelemetry(ctx, render) {
  if (!render || typeof render !== 'object') return render;

  if (typeof render.burstParticles === 'function') {
    const origBurst = render.burstParticles.bind(render);
    render.burstParticles = (kind, worldPos, count = 12) => {
      const before = ctx.state.stats.particles;
      const res = origBurst(kind, worldPos, count);
      if (ctx.state.stats.particles === before) {
        ctx.state.stats.particles += Math.max(1, Math.floor(Number(count) || 12));
      }
      return res;
    };
  }

  if (typeof render.flashCamera === 'function') {
    const origFlash = render.flashCamera.bind(render);
    render.flashCamera = (strength = 1) => {
      const before = ctx.state.stats.flashes;
      const res = origFlash(strength);
      if (ctx.state.stats.flashes === before) {
        ctx.state.stats.flashes += 1;
      }
      return res;
    };
  }

  if (typeof render.shakeCamera === 'function') {
    const origShake = render.shakeCamera.bind(render);
    render.shakeCamera = (trauma = 0.4) => {
      const before = ctx.state.stats.shakes;
      const res = origShake(trauma);
      if (ctx.state.stats.shakes === before) {
        ctx.state.stats.shakes += 1;
      }
      return res;
    };
  }

  return render;
}

async function runSlicedStageBoot(render) {
  if (!render || typeof render.initSlice !== 'function') return;
  const maxSlices = 24;
  let slicesRun = 0;
  while (slicesRun < maxSlices) {
    const sliceStart = typeof performance !== 'undefined' ? performance.now() : Date.now();
    let done = false;
    while (slicesRun < maxSlices) {
      const res = render.initSlice();
      slicesRun += 1;
      // Treat boolean true, { done: true }, or undefined/null (single-shot initSlice) as complete.
      if (res === true || res === undefined || res === null || (res && res.done === true)) {
        done = true;
        break;
      }
      const elapsed =
        (typeof performance !== 'undefined' ? performance.now() : Date.now()) - sliceStart;
      if (elapsed >= 7.5) {
        break;
      }
    }
    if (done) break;
    await yieldNextPaint();
  }
}

async function boot() {
  const bootParams = parseBootParams();
  const stageMount = document.getElementById('stage-mount');
  const uiRoot = document.getElementById('ui-root');

  const levels = {
    ...constantsMod,
    ...castCatalogMod,
    ...actsDataMod,
    ...takesMatrixMod,
    ...endingsDataMod,
    ...commissionsMod,
  };

  const events = createEventBus();
  const rng = mulberry32(bootParams.seed);
  const persistence = createPersistence(levels.STORAGE_KEY || 'endfield_sauin_v1');

  if (bootParams.resetStorage) {
    persistence.reset({ alsoResetState: false });
  }

  const state = createInitialState(bootParams.seed, levels.ACTS);
  persistence.bindState(state);
  const savedRecord = persistence.applyToState(state);

  const ctx = {
    THREE,
    DT,
    seed: bootParams.seed,
    rng,
    time: 0,
    frame: 0,
    events,
    state,
    persistence,
    levels,
    mechanics: null,
    render: null,
    ui: null,
    audio: null,
    input: null,
    loop: null,
    activeCaption: null,
    stepFrames: (n = 1) => ctx.loop?.stepFrames(n),
    registerCanvasText,
  };

  // Wire synchronized VO captions & clapper telemetry fallback on the event bus.
  events.on('clapperSnap', () => {
    if (!ctx.mechanics) {
      ctx.state.stats.clappers += 1;
    }
  });

  events.on('voStarted', (payload = {}) => {
    const caption = {
      voId: payload.voId || '',
      speaker: payload.speaker || 'Stage Narrator',
      text: payload.text || '',
      durationMs: Number(payload.durationMs) || 2000,
    };
    ctx.activeCaption = caption;
    ctx.ui?.showCaption?.(caption);
  });

  events.on('voEnded', () => {
    ctx.activeCaption = null;
    ctx.ui?.clearCaption?.();
  });

  // Instantiate subsystems in dependency-safe order.
  const audio =
    typeof audioMod.createAudioEngine === 'function' ? audioMod.createAudioEngine(ctx) : null;
  ctx.audio = audio;

  const rawRender =
    typeof renderMod.createWorldRender === 'function'
      ? renderMod.createWorldRender(ctx, stageMount)
      : null;
  const render = wrapRenderTelemetry(ctx, rawRender);
  ctx.render = render;

  const mechanics =
    typeof mechanicsMod.createMechanics === 'function' ? mechanicsMod.createMechanics(ctx) : null;
  ctx.mechanics = mechanics;

  const ui = typeof uiMod.createUI === 'function' ? uiMod.createUI(ctx, uiRoot) : null;
  ctx.ui = ui;

  // Apply persisted mute preferences to audio engine before UI sync.
  if (audio && savedRecord?.audio) {
    audio.setMuted?.({
      bgm: savedRecord.audio.bgmMuted,
      vo: savedRecord.audio.voMuted,
      sfx: savedRecord.audio.sfxMuted,
    });
  }

  // Initialize UI immediately so #title is interactive on frame 1.
  ui?.init?.();
  ensureTitleElementId(uiRoot);
  state.hanziCount = computeHanziCount();
  ui?.sync?.(state);

  const loop = createLoop({
    onStep(dt) {
      ctx.frame += 1;
      ctx.time = ctx.frame * dt;
      ctx.state.frame = ctx.frame;
      ctx.state.timeMs = Math.round((ctx.frame * 1000) / 60);
      ctx.mechanics?.update?.(dt);
      ctx.audio?.update?.(dt);
      ctx.render?.update?.(dt);
    },
    onSync() {
      ensureTitleElementId(uiRoot);
      ctx.ui?.sync?.(ctx.state);
    },
    onRender() {
      ctx.render?.renderFrame?.();
    },
  });
  ctx.loop = loop;

  const input = createInput(ctx);
  ctx.input = input;
  input.attach();

  // Start async audio manifest verification in parallel with first paint + incremental stage build.
  const audioInitPromise = Promise.race([
    Promise.resolve(audio?.init?.()).catch(() => false),
    new Promise((resolve) => setTimeout(resolve, 4000)),
  ]);

  await yieldNextPaint();
  await Promise.all([runSlicedStageBoot(render), audioInitPromise]);

  // Set initial closed/title proscenium state and render initial frame.
  render?.renderFrame?.();
  state.hanziCount = computeHanziCount();
  ui?.sync?.(state);
  ensureTitleElementId(uiRoot);

  events.emit('bootReady', {});
  loop.start();

  // Mount frozen test & automation seam after bootReady and manifest load.
  window.__HALLOWEEN__ = createSeam(ctx);
}

boot();
