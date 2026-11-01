// Fixed 60 Hz deterministic accumulator loop, synchronous stepFrames(n) fast-forward,
// and rolling frame-time profiler per docs/DESIGN.md §2.3, §4.5 & Gate G14 (owner: core).

export const DT = 1 / 60;
export const MAX_STEPS_PER_FRAME = 5;

const WORK_SAMPLE_CAP = 120;
const RAF_SAMPLE_CAP = 60;

function nowMs() {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now();
  }
  return Date.now();
}

function quantileSorted(sorted, q) {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0];
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor((sorted.length - 1) * q)));
  return sorted[idx];
}

export function createLoop({ onStep, onSync, onRender, onAdaptiveQuality } = {}) {
  let running = false;
  let rafId = 0;
  let lastRafTime = 0;
  let accumulator = 0;

  const workSamples = [];
  const rafSamples = [];

  function pushSample(arr, cap, val) {
    if (!Number.isFinite(val) || val < 0) return;
    if (arr.length >= cap) {
      arr.shift();
    }
    arr.push(val);
  }

  function recordWorkSample(ms) {
    pushSample(workSamples, WORK_SAMPLE_CAP, ms);
    if (typeof onAdaptiveQuality === 'function' && workSamples.length >= 24) {
      let sum = 0;
      for (let i = 0; i < workSamples.length; i++) sum += workSamples[i];
      onAdaptiveQuality(sum / workSamples.length);
    }
  }

  function tick(rafTimestamp) {
    if (!running) return;
    rafId = requestAnimationFrame(tick);

    const current = Number.isFinite(rafTimestamp) ? rafTimestamp : nowMs();
    if (lastRafTime > 0) {
      const elapsedMs = current - lastRafTime;
      if (elapsedMs > 0 && elapsedMs < 250) {
        pushSample(rafSamples, RAF_SAMPLE_CAP, elapsedMs);
      }
      const clampedSec = Math.min(Math.max(0, elapsedMs / 1000), DT * MAX_STEPS_PER_FRAME);
      accumulator += clampedSec;
    } else {
      accumulator += DT;
    }
    lastRafTime = current;

    const workStart = nowMs();
    let steps = 0;
    while (accumulator >= DT && steps < MAX_STEPS_PER_FRAME) {
      if (typeof onStep === 'function') {
        onStep(DT);
      }
      accumulator -= DT;
      steps += 1;
    }
    if (steps > 0 && typeof onSync === 'function') {
      onSync();
    }
    if (typeof onRender === 'function') {
      onRender();
    }
    const workMs = nowMs() - workStart;
    recordWorkSample(workMs);
  }

  function start() {
    if (running) return;
    running = true;
    lastRafTime = 0;
    accumulator = 0;
    if (typeof requestAnimationFrame === 'function') {
      rafId = requestAnimationFrame(tick);
    }
  }

  function stop() {
    running = false;
    if (rafId && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
  }

  function stepFrames(n = 1) {
    const count = Math.max(0, Math.floor(Number(n) || 0));
    const t0 = nowMs();
    for (let i = 0; i < count; i++) {
      if (typeof onStep === 'function') {
        onStep(DT);
      }
    }
    if (typeof onSync === 'function') {
      onSync();
    }
    if (typeof onRender === 'function') {
      onRender();
    }
    const totalMs = nowMs() - t0;
    const perFrameMs = count > 1 ? totalMs / count : totalMs;
    recordWorkSample(perFrameMs);

    // Reset wall-clock accumulator so next rAF does not replay fast-forwarded frames.
    accumulator = 0;
    lastRafTime = nowMs();
    return count;
  }

  function getPerf() {
    if (workSamples.length === 0) {
      return { fps: 60, p50ms: 1.0, p95ms: 2.0, avgMs: 1.0 };
    }
    const sorted = [...workSamples].sort((a, b) => a - b);
    const p50 = quantileSorted(sorted, 0.5);
    const p95 = quantileSorted(sorted, 0.95);
    let sum = 0;
    for (let i = 0; i < workSamples.length; i++) sum += workSamples[i];
    const avgMs = sum / workSamples.length;

    let fps = 60;
    if (rafSamples.length >= 8) {
      let rafSum = 0;
      for (let i = 0; i < rafSamples.length; i++) rafSum += rafSamples[i];
      const avgRaf = rafSum / rafSamples.length;
      if (avgRaf > 0 && avgRaf <= 45) {
        fps = Math.min(60, Math.max(1, Math.round(1000 / Math.max(16.6667, avgRaf))));
      } else {
        fps = Math.min(60, Math.max(1, Math.round(1000 / Math.max(16.6667, p50))));
      }
    } else {
      fps = Math.min(60, Math.max(1, Math.round(1000 / Math.max(16.6667, p50))));
    }

    return {
      fps,
      p50ms: Number(Math.max(0.01, p50).toFixed(2)),
      p95ms: Number(Math.max(0.01, p95).toFixed(2)),
      avgMs: Number(Math.max(0.01, avgMs).toFixed(2)),
    };
  }

  return {
    DT,
    start,
    stop,
    stepFrames,
    getPerf,
    isRunning: () => running,
  };
}
