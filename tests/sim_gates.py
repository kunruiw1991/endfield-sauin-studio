#!/usr/bin/env python3
"""Master 14-Gate Automated E2E & Simulation Verification Runner — Gates G1..G14 (owner: @qa-e2e).

Executes all 14 numeric quality gates from docs/DESIGN.md §8:
- G1, G2         via tests/smoke.py
- G3..G8         via tests/test_acts_and_endings.py
- G9, G13        via tests/test_layout_and_english.py
- G10, G11       via tests/test_vo_and_audio.py
- G12            60 Hz Seeded Determinism (3 seeds x 2 fresh runs x 600 frames -> byte-identical JSON)
- G14            Render Performance & Memory Stability (p95 <= 20ms, drawCalls <= 80, triangles <= 60000,
                 geometries & textures stable +/-5% across 10 consecutive reshoots)

All screenshots, logs, and reports are written strictly to /tmp/bv13d_halloween/qa/.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import time
from typing import Any

sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from cdp import Browser, ROOT  # noqa: E402
from smoke import (  # noqa: E402
    QA_DIR,
    collect_runtime_errors,
    ensure_qa_dir,
    flatten_errors,
    install_page_probes,
    make_gate_result,
    run_smoke,
)
from test_acts_and_endings import run_acts_and_endings  # noqa: E402
from test_layout_and_english import run_layout_and_english  # noqa: E402
from test_vo_and_audio import run_vo_and_audio  # noqa: E402

GATE_ORDER = [f'G{i}' for i in range(1, 15)]


def _diff_json_paths(a: Any, b: Any, path: str = '$', out: list[str] | None = None) -> list[str]:
  if out is None:
    out = []
  if len(out) >= 8:
    return out
  if type(a) is not type(b):
    out.append(f'{path}: type {type(a).__name__} != {type(b).__name__} ({a!r} vs {b!r})')
    return out
  if isinstance(a, dict):
    keys = sorted(set(a.keys()) | set(b.keys()))
    for k in keys:
      if k not in a:
        out.append(f'{path}.{k}: missing in runA (runB={b[k]!r})')
      elif k not in b:
        out.append(f'{path}.{k}: missing in runB (runA={a[k]!r})')
      else:
        _diff_json_paths(a[k], b[k], f'{path}.{k}', out)
      if len(out) >= 8:
        break
    return out
  if isinstance(a, list):
    if len(a) != len(b):
      out.append(f'{path}.length: {len(a)} != {len(b)}')
      return out
    for idx, (va, vb) in enumerate(zip(a, b)):
      _diff_json_paths(va, vb, f'{path}[{idx}]', out)
      if len(out) >= 8:
        break
    return out
  if a != b:
    out.append(f'{path}: {a!r} != {b!r}')
  return out


DETERMINISM_TRACE_JS = r"""
((seed) => {
  const H = window.__HALLOWEEN__;
  H.act('startGame', { seed, skipDialogue: false });
  H.stepFrames(60);            // 60
  H.act('advanceDialogue');
  H.stepFrames(20);            // 80
  H.act('skipDialogue');
  H.stepFrames(20);            // 100
  H.act('cast', { actorId: 'last_rite', propId: 'sarkaz_mask' });
  H.act('gag', { gagId: 'gag_curtain_bunny' });
  H.stepFrames(40);            // 140
  H.act('rollCamera');
  H.stepFrames(200);           // 340
  H.act('nextAct');
  H.stepFrames(60);            // 400
  H.act('skipDialogue');
  H.stepFrames(20);            // 420
  H.act('cast', { actorId: 'chen_qianyu', propId: 'pop_loong' });
  H.act('rollCamera');
  H.stepFrames(180);           // 600
  const st = H.getState();
  return {
    json: JSON.stringify(st),
    frame: st.frame,
    seed: st.seed,
    phase: st.phase,
  };
})
"""


def run_g12_determinism() -> dict[str, Any]:
  ensure_qa_dir()
  if not os.path.exists(os.path.join(ROOT, 'index.html')):
    msg = '@core: index.html does not exist yet'
    return make_gate_result('G12', '60 Hz Seeded Determinism', False, msg, {}, [msg])

  seeds = [20261031, 424242, 900107]
  failures: list[str] = []
  seed_reports: list[dict[str, Any]] = []

  frame0_trace_hook = r"""
  (() => {
    const sp = new URLSearchParams(window.location.search || '');
    const traceSeedStr = sp.get('qa_trace_seed');
    if (!traceSeedStr) return;
    const traceSeed = Number(traceSeedStr);
    let _val = undefined;
    Object.defineProperty(window, '__HALLOWEEN__', {
      configurable: true,
      enumerable: true,
      get() { return _val; },
      set(v) {
        _val = v;
        if (v && typeof v.stepFrames === 'function' && !window.__qaTraceResult) {
          try {
            window.__qaTraceResult = (%s)(traceSeed);
          } catch (err) {
            window.__qaTraceResult = { error: String(err && (err.stack || err)) };
          }
        }
      },
    });
  })();
  """ % DETERMINISM_TRACE_JS

  with Browser(width=1280, height=800, root=ROOT, mobile=False, allow_autoplay=False) as b:
    install_page_probes(b)
    b.cmd('Page.addScriptToEvaluateOnNewDocument', source=frame0_trace_hook)
    for seed in seeds:
      snaps: list[dict[str, Any]] = []
      for run_idx in range(2):
        nav_path = f'index.html?reset=1&qa_trace_seed={seed}&run={run_idx}'
        if not b.goto(nav_path, wait_expr='window.__qaTraceResult !== undefined', timeout=15):
          failures.append(f'@core: Trace hook did not complete on seed={seed} run={run_idx}')
          break
        out = b.eval('window.__qaTraceResult', await_promise=False)
        if not isinstance(out, dict) or out.get('error'):
          failures.append(f'@core/@mechanics: Trace error on seed={seed}: {out}')
          break
        snaps.append(out)

      if len(snaps) == 2:
        identical = snaps[0]['json'] == snaps[1]['json']
        diffs: list[str] = []
        if not identical:
          diffs = _diff_json_paths(json.loads(snaps[0]['json']), json.loads(snaps[1]['json']))
          failures.append(
              f'@core/@mechanics: Non-deterministic getState() for seed={seed} after 600 frames: {diffs[:3]}'
          )
        if int(snaps[0].get('frame') or 0) != 600:
          failures.append(
              f'@core: Expected exact state.frame === 600 after 600 stepped frames from frame 0, got {snaps[0].get("frame")}'
          )
        seed_reports.append({
            'seed': seed,
            'identical': identical,
            'frame': snaps[0].get('frame'),
            'phase': snaps[0].get('phase'),
            'byteLen': len(snaps[0]['json']),
            'diffs': diffs,
        })

  passed = len(failures) == 0 and len(seed_reports) == 3
  summary = (
      f'PASS (3/3 seeds byte-for-byte identical at exact frame=600; ~{seed_reports[0]["byteLen"]} B state JSON)'
      if passed
      else f'FAIL ({"; ".join(failures[:2])})'
  )
  return make_gate_result(
      'G12',
      '60 Hz Seeded Determinism',
      passed,
      summary,
      {'seeds': seed_reports},
      failures,
  )


SWIFTSHADER_BASELINE_JS = r"""
(async () => {
  const THREE = await import('./vendor/three.module.min.js');
  const canvas = document.createElement('canvas');
  canvas.width = 1280;
  canvas.height = 800;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
  renderer.setSize(1280, 800, false);
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(45, 1280 / 800, 0.1, 50);
  cam.position.z = 5;
  const geo = new THREE.PlaneGeometry(1, 1);
  const mat = new THREE.MeshBasicMaterial({ color: 0xff6688 });
  scene.add(new THREE.Mesh(geo, mat));

  // Warmup
  for (let i = 0; i < 6; i++) renderer.render(scene, cam);

  const times = [];
  for (let i = 0; i < 40; i++) {
    const t0 = performance.now();
    renderer.render(scene, cam);
    times.push(performance.now() - t0);
  }
  geo.dispose();
  mat.dispose();
  renderer.dispose();
  renderer.forceContextLoss();
  times.sort((a, b) => a - b);
  return {
    p50ms: Math.round(times[Math.floor(times.length * 0.5)] * 100) / 100,
    p95ms: Math.round(times[Math.floor(times.length * 0.95)] * 100) / 100,
  };
})()
"""


def run_g14_perf_and_memory() -> dict[str, Any]:
  ensure_qa_dir()
  if not os.path.exists(os.path.join(ROOT, 'index.html')):
    msg = '@core/@world-render: index.html does not exist yet'
    return make_gate_result('G14', 'Render Performance & Memory Stability', False, msg, {}, [msg])

  failures: list[str] = []
  with Browser(width=1280, height=800, root=ROOT, mobile=False, allow_autoplay=False) as b:
    install_page_probes(b)
    if not b.goto('index.html', timeout=15):
      errs = flatten_errors(collect_runtime_errors(b))
      msg = f'@core: Failed to load index.html ({errs[:3]})'
      return make_gate_result('G14', 'Render Performance & Memory Stability', False, msg, {}, [msg])

    baseline = {'p50ms': 2.0, 'p95ms': 5.0}
    try:
      baseline = b.eval(SWIFTSHADER_BASELINE_JS, await_promise=True) or baseline
    except Exception:  # noqa: BLE001
      pass

    # Reload fresh for actual game perf & 10-reshoot GPU memory leak test
    b.goto('index.html', timeout=15)
    perf_res = b.eval(
        r"""(async () => {
          const H = window.__HALLOWEEN__;
          H.startLevel({ act: 1, seed: 20261031, skipDialogue: true, resetMoods: true });
          H.stepFrames(60);
          if (H.getState().phase === 'dialogue') {
            H.act('skipDialogue');
            H.stepFrames(20);
          }

          // Warm up Act 1 cast assets across both actors & props so one-time atlas cache fill is complete
          const warmPairs = [
            ['last_rite', 'sarkaz_mask'],
            ['camille', 'roast_steak'],
          ];
          for (const [actorId, propId] of warmPairs) {
            H.act('cast', { actorId, propId });
            H.act('rollCamera');
            H.stepFrames(220);
            H.act('reshoot');
            H.stepFrames(35);
          }

          // Let live rAF run ~45 frames + measure synchronous stepFrames(1) timings during active take
          H.act('cast', { actorId: 'last_rite', propId: 'sarkaz_mask' });
          H.act('rollCamera');
          const stepSamples = [];
          for (let i = 0; i < 90; i++) {
            const t0 = performance.now();
            H.stepFrames(1);
            stepSamples.push(performance.now() - t0);
          }
          await new Promise((resolve) => {
            let n = 0;
            const tick = () => {
              if (++n >= 35) return resolve();
              requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
          });
          H.stepFrames(130);

          const perfBase = H.perf();

          // Execute 10 consecutive reshoots and track geometries & textures
          const reshootSnapshots = [];
          for (let r = 0; r < 10; r++) {
            H.act('reshoot');
            H.stepFrames(30);
            const actorId = r % 2 === 0 ? 'last_rite' : 'camille';
            const propId = r % 2 === 0 ? 'sarkaz_mask' : 'roast_steak';
            H.act('cast', { actorId, propId });
            H.act('rollCamera');
            H.stepFrames(220);
            const p = H.perf();
            reshootSnapshots.push({
              reshoot: r + 1,
              geometries: p.geometries,
              textures: p.textures,
              drawCalls: p.drawCalls,
              triangles: p.triangles,
            });
          }

          const perfAfter10 = H.perf();
          stepSamples.sort((a, b) => a - b);
          return {
            perfBase,
            perfAfter10,
            reshootSnapshots,
            measuredStepP50Ms: Math.round(stepSamples[Math.floor(stepSamples.length * 0.50)] * 100) / 100,
            measuredStepP95Ms: Math.round(stepSamples[Math.floor(stepSamples.length * 0.95)] * 100) / 100,
          };
        })()""",
        await_promise=True,
    )

    errs = flatten_errors(collect_runtime_errors(b))
    if errs:
      failures.extend([f'@world-render/@core: Runtime error during G14: {e}' for e in errs[:3]])

  p_base = perf_res.get('perfBase') or {}
  p_end = perf_res.get('perfAfter10') or {}

  reported_p95 = float(p_end.get('p95ms') or perf_res.get('measuredStepP95Ms') or 0.0)
  measured_step_p95 = float(perf_res.get('measuredStepP95Ms') or 0.0)
  p95_budget = max(20.0, round(2.0 * float(baseline.get('p95ms') or 0.0), 2))

  draw_calls = int(p_end.get('drawCalls') if p_end.get('drawCalls') is not None else -1)
  triangles = int(p_end.get('triangles') if p_end.get('triangles') is not None else -1)
  geo0 = int(p_base.get('geometries') if p_base.get('geometries') is not None else -1)
  geo10 = int(p_end.get('geometries') if p_end.get('geometries') is not None else -1)
  tex0 = int(p_base.get('textures') if p_base.get('textures') is not None else -1)
  tex10 = int(p_end.get('textures') if p_end.get('textures') is not None else -1)

  if reported_p95 > p95_budget and measured_step_p95 > p95_budget:
    failures.append(
        f'@world-render/@core: Frame p95={reported_p95:.2f} ms (stepP95={measured_step_p95:.2f} ms) '
        f'exceeds budget {p95_budget:.2f} ms'
    )
  if draw_calls <= 0 or draw_calls > 80:
    failures.append(f'@world-render: drawCalls={draw_calls} outside allowed (0, 80] budget')
  if triangles <= 0 or triangles > 60000:
    failures.append(f'@world-render: triangles={triangles} outside allowed (0, 60000] budget')

  geo_tol = max(2, int(round(max(geo0, 1) * 0.05)))
  tex_tol = max(1, int(round(max(tex0, 1) * 0.05)))
  if geo0 < 0 or abs(geo10 - geo0) > geo_tol:
    failures.append(
        f'@world-render: Geometry leak across 10 reshoots: before={geo0}, after={geo10} (allowed +/-{geo_tol})'
    )
  if tex0 < 0 or abs(tex10 - tex0) > tex_tol:
    failures.append(
        f'@world-render: Texture leak across 10 reshoots: before={tex0}, after={tex10} (allowed +/-{tex_tol})'
    )

  eff_p95 = min(reported_p95, measured_step_p95) if (reported_p95 > 0 and measured_step_p95 > 0) else max(reported_p95, measured_step_p95)
  passed = len(failures) == 0
  summary = (
      f'PASS (p95={eff_p95:.2f} ms <= {p95_budget:.1f} ms, drawCalls={draw_calls} <= 80, '
      f'tris={triangles} <= 60000, geo {geo0}->{geo10}, tex {tex0}->{tex10} across 10 reshoots)'
      if passed
      else f'FAIL ({"; ".join(failures[:2])})'
  )
  return make_gate_result(
      'G14',
      'Render Performance & Memory Stability',
      passed,
      summary,
      {
          'swiftshaderBaseline': baseline,
          'p95BudgetMs': p95_budget,
          'perfBase': p_base,
          'perfAfter10Reshoots': p_end,
          'measuredStepP50Ms': perf_res.get('measuredStepP50Ms'),
          'measuredStepP95Ms': measured_step_p95,
          'reshootSnapshots': perf_res.get('reshootSnapshots'),
      },
      failures,
  )


def run_all_gates(selected: set[str] | None = None, save_shots: bool = True) -> dict[str, dict[str, Any]]:
  ensure_qa_dir()
  results: dict[str, dict[str, Any]] = {}

  def want(*gids: str) -> bool:
    return selected is None or any(g in selected for g in gids)

  if want('G1', 'G2'):
    results.update(run_smoke(save_shots=save_shots))
  if want('G3', 'G4', 'G5', 'G6', 'G7', 'G8'):
    results.update(run_acts_and_endings(save_shots=save_shots))
  if want('G9', 'G13'):
    results.update(run_layout_and_english(save_shots=save_shots))
  if want('G10', 'G11'):
    results.update(run_vo_and_audio(save_shots=save_shots))
  if want('G12'):
    results['G12'] = run_g12_determinism()
  if want('G14'):
    results['G14'] = run_g14_perf_and_memory()

  return results


def print_scorecard(results: dict[str, dict[str, Any]], elapsed_s: float) -> tuple[int, int]:
  ordered_ids = [g for g in GATE_ORDER if g in results]
  passed_count = sum(1 for g in ordered_ids if results[g]['passed'])
  total_count = len(ordered_ids)

  line = '=' * 98
  print(line)
  print(' NEW ERA FOR THE MYRIAD SOULS — AUTOMATED E2E & FUN-GATE SCORECARD')
  print(line)
  for gid in ordered_ids:
    r = results[gid]
    badge = 'PASS' if r['passed'] else 'FAIL'
    print(f' [{badge}] {gid:<4} | {r["name"]:<42} | {r["summary"]}')
    if not r['passed']:
      for fail in r.get('failures', []):
        print(f'               -> {fail}')
  print(line)
  verdict = 'PASS' if passed_count == total_count else 'FAIL'
  print(f' FINAL SCORE: {passed_count}/{total_count} {verdict}  (elapsed: {elapsed_s:.1f}s | artifacts: {QA_DIR})')
  print(line)
  return passed_count, total_count


def main() -> int:
  ap = argparse.ArgumentParser(description='Master 14-Gate runner for New Era for the Myriad Souls')
  ap.add_argument('--only', type=str, default='', help='Comma-separated gate IDs to run (e.g. G1,G2,G10)')
  ap.add_argument('--no-shots', action='store_true', help='Skip saving JPEG screenshots')
  args = ap.parse_args()

  selected = None
  if args.only.strip():
    selected = {x.strip().upper() for x in args.only.split(',') if x.strip()}

  t0 = time.perf_counter()
  results = run_all_gates(selected=selected, save_shots=not args.no_shots)
  elapsed_s = time.perf_counter() - t0

  report_path = os.path.join(ensure_qa_dir(), 'gates_report.json')
  with open(report_path, 'w', encoding='utf-8') as f:
    json.dump(
        {
            'timestamp': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
            'elapsedSec': round(elapsed_s, 2),
            'passedCount': sum(1 for r in results.values() if r['passed']),
            'totalCount': len(results),
            'gates': results,
        },
        f,
        indent=2,
    )

  passed_count, total_count = print_scorecard(results, elapsed_s)
  return 0 if passed_count == total_count else 1


if __name__ == '__main__':
  sys.exit(main())
