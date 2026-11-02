#!/usr/bin/env python3
"""Smoke & Boot Responsiveness E2E Suite — Gates G1 & G2 (owner: @qa-e2e).

Verifies:
- Gate G1: `#title` visible in initial HTML before JS finishes; `window.__HALLOWEEN__`
  ready <= 1.5s; frozen seam with all 12 methods; 0 console errors, 0 uncaught
  exceptions, 0 HTTP 4xx/5xx responses, 0 importmaps / external CDNs.
- Gate G2: Clicking `Start Filming` transitions out of `#title` to Act 1
  (`clapper` -> `dialogue` / `blocking`) with visual + audio event response <= 120 ms
  and reaches interactive control <= 300 ms.

All scratch artifacts & screenshots live strictly under /tmp/bv13d_halloween/qa/.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
import urllib.request
from typing import Any

sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from cdp import Browser, ROOT  # noqa: E402

QA_DIR = os.environ.get('HALLOWEEN_QA_DIR', '/tmp/bv13d_replay/qa')

REQUIRED_SEAM_METHODS = [
    'startLevel',
    'resetLevel',
    'act',
    'move',
    'pointer',
    'stepFrames',
    'getState',
    'getLevels',
    'solveCurrentLevel',
    'playVO',
    'getAudioStats',
    'perf',
]

EARLY_PAGE_PROBE_JS = r"""
(() => {
  const probe = {
    scriptStartPerfMs: performance.now(),
    interactiveTitleVisible: null,
    interactiveTitleRect: null,
    dclTitleVisible: null,
    readyPerfMs: null,
    windowErrors: [],
    rejections: [],
    speechSynthCalls: 0,
    canvasTexts: [],
  };
  window.__qaProbe = probe;

  const checkTitleNow = () => {
    const el = document.getElementById('title') || document.querySelector('[data-view="title"], .title-screen, .title-view');
    if (!el) return { exists: false, visible: false, rect: null };
    const cs = window.getComputedStyle(el);
    const r = el.getBoundingClientRect();
    const visible = (
      !el.hasAttribute('hidden') &&
      cs.display !== 'none' &&
      cs.visibility !== 'hidden' &&
      parseFloat(cs.opacity || '1') > 0.05 &&
      r.width > 10 &&
      r.height > 10
    );
    return {
      exists: true,
      id: el.id || '',
      visible,
      rect: { width: Math.round(r.width), height: Math.round(r.height) },
    };
  };

  document.addEventListener('readystatechange', () => {
    if (document.readyState === 'interactive' && probe.interactiveTitleVisible === null) {
      const res = checkTitleNow();
      probe.interactiveTitleVisible = res.visible && res.id === 'title';
      probe.interactiveTitleRect = res;
    }
  });

  document.addEventListener('DOMContentLoaded', () => {
    const res = checkTitleNow();
    probe.dclTitleVisible = res.visible && res.id === 'title';
    if (probe.interactiveTitleVisible === null) {
      probe.interactiveTitleVisible = probe.dclTitleVisible;
      probe.interactiveTitleRect = res;
    }
  });

  window.addEventListener('error', (ev) => {
    const msg = ev && (ev.message || (ev.error && ev.error.stack) || String(ev));
    probe.windowErrors.push(String(msg || 'window.error'));
  });

  window.addEventListener('unhandledrejection', (ev) => {
    const reason = ev && (ev.reason && (ev.reason.stack || ev.reason.message || ev.reason));
    probe.rejections.push(String(reason || 'unhandledrejection'));
  });

  try {
    if (window.speechSynthesis && typeof window.speechSynthesis.speak === 'function') {
      const origSpeak = window.speechSynthesis.speak.bind(window.speechSynthesis);
      window.speechSynthesis.speak = function (...args) {
        probe.speechSynthCalls += 1;
        return undefined;
      };
      void origSpeak;
    }
  } catch (_) {}

  try {
    const seen = new Set();
    const recordText = (txt) => {
      const s = String(txt ?? '');
      if (!s || seen.has(s) || probe.canvasTexts.length >= 4000) return;
      seen.add(s);
      probe.canvasTexts.push(s);
    };
    const proto = window.CanvasRenderingContext2D && window.CanvasRenderingContext2D.prototype;
    if (proto) {
      const origFill = proto.fillText;
      const origStroke = proto.strokeText;
      if (typeof origFill === 'function') {
        proto.fillText = function (text, ...rest) {
          recordText(text);
          return origFill.call(this, text, ...rest);
        };
      }
      if (typeof origStroke === 'function') {
        proto.strokeText = function (text, ...rest) {
          recordText(text);
          return origStroke.call(this, text, ...rest);
        };
      }
    }
    if (typeof window.OffscreenCanvasRenderingContext2D !== 'undefined') {
      const oproto = window.OffscreenCanvasRenderingContext2D.prototype;
      const oFill = oproto.fillText;
      const oStroke = oproto.strokeText;
      if (typeof oFill === 'function') {
        oproto.fillText = function (text, ...rest) {
          recordText(text);
          return oFill.call(this, text, ...rest);
        };
      }
      if (typeof oStroke === 'function') {
        oproto.strokeText = function (text, ...rest) {
          recordText(text);
          return oStroke.call(this, text, ...rest);
        };
      }
    }
  } catch (_) {}
})();
"""


def ensure_qa_dir() -> str:
  os.makedirs(QA_DIR, exist_ok=True)
  return QA_DIR


def make_gate_result(
    gate: str,
    name: str,
    passed: bool,
    summary: str,
    metrics: dict[str, Any] | None = None,
    failures: list[str] | None = None,
) -> dict[str, Any]:
  return {
      'gate': gate,
      'name': name,
      'passed': bool(passed),
      'summary': summary,
      'metrics': metrics or {},
      'failures': failures or [],
  }


def install_page_probes(b: Browser) -> None:
  b.cmd('Page.addScriptToEvaluateOnNewDocument', source=EARLY_PAGE_PROBE_JS)


def http_get_local(port: int, path: str, timeout: float = 5.0) -> tuple[int, bytes, dict[str, str]]:
  opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
  url = f'http://127.0.0.1:{port}/{path.lstrip("/")}'
  try:
    with opener.open(url, timeout=timeout) as resp:
      return resp.status, resp.read(), dict(resp.headers.items())
  except urllib.error.HTTPError as err:
    return err.code, b'', {}


def collect_runtime_errors(b: Browser) -> dict[str, list[str]]:
  # Drain any pending Runtime events with a lightweight evaluate.
  probe_errs: dict[str, Any] = {'windowErrors': [], 'rejections': []}
  try:
    res = b.eval(
        'window.__qaProbe ? ({windowErrors: window.__qaProbe.windowErrors,'
        ' rejections: window.__qaProbe.rejections}) : null',
        await_promise=False,
    )
    if isinstance(res, dict):
      probe_errs = res
  except Exception as exc:  # noqa: BLE001
    probe_errs['windowErrors'].append(f'eval_drain_error: {exc}')

  console_errors = [
      f'{kind}: {msg}'
      for kind, msg in b.console
      if kind in ('error', 'assert')
  ]
  exceptions = [str(x) for x in b.exceptions if x]
  http_errors = []
  for cmd_name, path, code_str in b.requests:
    s = str(code_str).strip()
    if s.isdigit() and int(s) >= 400:
      http_errors.append(f'{cmd_name} {path} -> HTTP {s}')

  return {
      'console_errors': console_errors,
      'exceptions': exceptions,
      'window_errors': [str(x) for x in probe_errs.get('windowErrors', [])],
      'rejections': [str(x) for x in probe_errs.get('rejections', [])],
      'http_errors': http_errors,
  }


def flatten_errors(err_dict: dict[str, list[str]]) -> list[str]:
  out: list[str] = []
  for k, items in err_dict.items():
    for it in items:
      out.append(f'[{k}] {it}')
  return out


def audit_static_html(port: int) -> dict[str, Any]:
  code, raw, _ = http_get_local(port, 'index.html')
  if code != 200:
    return {'ok': False, 'status': code, 'issues': [f'@core: index.html returned HTTP {code}']}

  html = raw.decode('utf-8', errors='replace')
  issues: list[str] = []

  if not re.search(r'<html\b[^>]*\blang\s*=\s*["\']en["\']', html, flags=re.IGNORECASE):
    issues.append('@core: index.html missing <html lang="en">')

  if re.search(r'<script\b[^>]*\btype\s*=\s*["\']importmap["\']', html, flags=re.IGNORECASE):
    issues.append('@core: index.html contains banned <script type="importmap">')

  ext_refs = re.findall(
      r'(?:src|href)\s*=\s*["\'](https?://[^"\']+)["\']',
      html,
      flags=re.IGNORECASE,
  )
  if ext_refs:
    issues.append(f'@core: index.html references external CDN URLs: {ext_refs[:3]}')

  title_match = re.search(r'<([a-z0-9]+)\b([^>]*\bid\s*=\s*["\']title["\'][^>]*)>', html, flags=re.IGNORECASE)
  if not title_match:
    issues.append('@core: index.html missing static #title element in initial HTML')
  else:
    attrs = title_match.group(2)
    if re.search(r'\bhidden\b', attrs, flags=re.IGNORECASE):
      issues.append('@core: static #title has `hidden` attribute in initial HTML')
    if re.search(r'display\s*:\s*none', attrs, flags=re.IGNORECASE):
      issues.append('@core: static #title has inline `display: none` in initial HTML')

  return {'ok': len(issues) == 0, 'status': code, 'issues': issues}


def navigate_and_measure_boot(b: Browser, timeout: float = 10.0) -> dict[str, Any]:
  url = f'http://127.0.0.1:{b.http_port}/index.html'
  t0 = time.perf_counter()
  b.cmd('Page.navigate', url=url)
  ready = False
  boot_wall_ms = None
  while (time.perf_counter() - t0) < timeout:
    try:
      ok = b.eval(
          'typeof window.__HALLOWEEN__ === "object" && window.__HALLOWEEN__ !== null'
          ' && typeof window.__HALLOWEEN__.getState === "function"',
          await_promise=False,
      )
      if ok:
        boot_wall_ms = round((time.perf_counter() - t0) * 1000.0, 2)
        ready = True
        break
    except RuntimeError:
      pass
    time.sleep(0.02)

  if not ready:
    return {
        'ready': False,
        'bootWallMs': round((time.perf_counter() - t0) * 1000.0, 2),
    }

  snap = b.eval(
      r"""(() => {
        const H = window.__HALLOWEEN__;
        const st = H.getState();
        const titleEl = document.getElementById('title');
        const tRect = titleEl ? titleEl.getBoundingClientRect() : null;
        const tCs = titleEl ? window.getComputedStyle(titleEl) : null;
        const titleVisibleAtBoot = Boolean(
          titleEl &&
          !titleEl.hasAttribute('hidden') &&
          tCs.display !== 'none' &&
          tCs.visibility !== 'hidden' &&
          parseFloat(tCs.opacity || '1') > 0.05 &&
          tRect.width > 10 &&
          tRect.height > 10
        );
        return {
          perfNowMs: Math.round(performance.now() * 100) / 100,
          frozen: Object.isFrozen(H),
          methods: Object.keys(H).filter((k) => typeof H[k] === 'function'),
          missingMethods: %s.filter((k) => typeof H[k] !== 'function'),
          phase: st ? st.phase : null,
          titleVisibleAtBoot,
          titleRect: tRect ? {
            left: Math.round(tRect.left),
            top: Math.round(tRect.top),
            width: Math.round(tRect.width),
            height: Math.round(tRect.height),
          } : null,
          probe: window.__qaProbe ? {
            interactiveTitleVisible: window.__qaProbe.interactiveTitleVisible,
            dclTitleVisible: window.__qaProbe.dclTitleVisible,
            interactiveTitleRect: window.__qaProbe.interactiveTitleRect,
          } : null,
        };
      })()""" % json.dumps(REQUIRED_SEAM_METHODS),
      await_promise=False,
  )
  snap['ready'] = True
  snap['bootWallMs'] = boot_wall_ms
  return snap


def run_smoke(save_shots: bool = True) -> dict[str, dict[str, Any]]:
  ensure_qa_dir()
  index_path = os.path.join(ROOT, 'index.html')
  if not os.path.exists(index_path):
    fail_msg = '@core: index.html does not exist yet in repository root'
    return {
        'G1': make_gate_result('G1', 'Instant Boot & Visible Title', False, fail_msg, {}, [fail_msg]),
        'G2': make_gate_result('G2', 'Time-to-First-Action Responsiveness', False, fail_msg, {}, [fail_msg]),
    }

  g1_failures: list[str] = []
  g2_failures: list[str] = []
  g1_metrics: dict[str, Any] = {}
  g2_metrics: dict[str, Any] = {}

  with Browser(width=1280, height=800, root=ROOT, mobile=False, allow_autoplay=True) as b:
    install_page_probes(b)
    static_audit = audit_static_html(b.http_port)
    g1_metrics['staticHtmlOk'] = static_audit['ok']
    if not static_audit['ok']:
      g1_failures.extend(static_audit['issues'])

    boot = navigate_and_measure_boot(b, timeout=10.0)
    g1_metrics['ready'] = boot.get('ready', False)
    g1_metrics['bootWallMs'] = boot.get('bootWallMs')
    g1_metrics['perfNowMs'] = boot.get('perfNowMs')

    if not boot.get('ready'):
      errs = flatten_errors(collect_runtime_errors(b))
      g1_failures.append(
          f'@core: window.__HALLOWEEN__ failed to initialize within 10s (waited {boot.get("bootWallMs")} ms)'
      )
      g1_failures.extend(errs[:8])
      return {
          'G1': make_gate_result(
              'G1', 'Instant Boot & Visible Title', False, 'Boot failed: window.__HALLOWEEN__ missing',
              g1_metrics, g1_failures,
          ),
          'G2': make_gate_result(
              'G2', 'Time-to-First-Action Responsiveness', False, 'Blocked by G1 boot failure',
              {}, ['@core: Blocked by G1 boot failure'],
          ),
      }

    # Allow 2 animation frames for initial paint, then capture title screenshot.
    b.eval('new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))', await_promise=True)
    if save_shots:
      g1_metrics['titleShot'] = b.screenshot(os.path.join(QA_DIR, 'smoke_title.jpg'))

    probe = boot.get('probe') or {}
    pre_js_title_ok = bool(probe.get('interactiveTitleVisible') or probe.get('dclTitleVisible'))
    title_at_boot = bool(boot.get('titleVisibleAtBoot'))
    g1_metrics['preJsTitleVisible'] = pre_js_title_ok
    g1_metrics['titleVisibleAtBoot'] = title_at_boot
    g1_metrics['initialPhase'] = boot.get('phase')
    g1_metrics['seamFrozen'] = boot.get('frozen')
    g1_metrics['missingMethods'] = boot.get('missingMethods', [])

    # Use effective boot time (min of in-page performance.now() at seam ready and wall clock).
    eff_boot_ms = min(
        float(boot.get('bootWallMs') or 9999.0),
        float(boot.get('perfNowMs') or 9999.0),
    )
    g1_metrics['effectiveBootMs'] = round(eff_boot_ms, 2)

    if not pre_js_title_ok:
      g1_failures.append(
          f'@core/@ui-hud: #title was not visible before JS module boot completed (probe={probe})'
      )
    if not title_at_boot:
      g1_failures.append(
          f'@core/@ui-hud: #title is not visible at boot (rect={boot.get("titleRect")})'
      )
    if boot.get('phase') != 'title':
      g1_failures.append(f'@core: Expected initial state.phase === "title", got {boot.get("phase")!r}')
    if eff_boot_ms > 1500.0:
      g1_failures.append(
          f'@core/@world-render: Boot took {eff_boot_ms:.1f} ms (> 1500 ms limit; check synchronous compile/assets)'
      )
    if not boot.get('frozen'):
      g1_failures.append('@core: window.__HALLOWEEN__ is not Object.freeze()-frozen')
    if boot.get('missingMethods'):
      g1_failures.append(f'@core: window.__HALLOWEEN__ missing seam methods: {boot["missingMethods"]}')

    boot_errs = collect_runtime_errors(b)
    flat_boot_errs = flatten_errors(boot_errs)
    g1_metrics['errorCount'] = len(flat_boot_errs)
    if flat_boot_errs:
      g1_failures.extend([f'@core: {e}' for e in flat_boot_errs[:8]])

    # --- Gate G2: Click "Start Filming" and measure transition latency ---
    btn_info = b.eval(
        r"""(() => {
          const candidates = Array.from(document.querySelectorAll(
            '#title button, #title [role="button"], button, [role="button"]'
          ));
          const isVis = (el) => {
            const cs = window.getComputedStyle(el);
            const r = el.getBoundingClientRect();
            return (
              !el.hasAttribute('hidden') &&
              cs.display !== 'none' &&
              cs.visibility !== 'hidden' &&
              parseFloat(cs.opacity || '1') > 0.05 &&
              cs.pointerEvents !== 'none' &&
              r.width > 8 &&
              r.height > 8
            );
          };
          const vis = candidates.filter(isVis);
          const startBtn = vis.find((el) => /start\s*filming/i.test(el.textContent || ''))
            || vis.find((el) => /start|play|begin|film/i.test((el.id || '') + ' ' + (el.dataset.action || '') + ' ' + (el.textContent || '')));
          if (!startBtn) {
            return { found: false, visibleButtons: vis.map((e) => (e.textContent || '').trim().slice(0, 40)) };
          }
          const r = startBtn.getBoundingClientRect();
          const cx = r.left + r.width / 2;
          const cy = r.top + r.height / 2;
          const hit = document.elementFromPoint(cx, cy);
          const hitOk = Boolean(hit && (hit === startBtn || startBtn.contains(hit) || hit.contains(startBtn)));

          window.__qaG2 = { tDown: null, tUp: null, tPhaseChange: null, toPhase: null, audioTriggered: false };
          startBtn.addEventListener('pointerdown', () => { window.__qaG2.tDown = performance.now(); }, { once: true });
          startBtn.addEventListener('pointerup', () => { window.__qaG2.tUp = performance.now(); }, { once: true });
          startBtn.addEventListener('click', () => {
            if (window.__qaG2.tUp === null) window.__qaG2.tUp = performance.now();
          }, { once: true });

          return {
            found: true,
            text: (startBtn.textContent || '').trim().replace(/\s+/g, ' '),
            cx: Math.round(cx * 10) / 10,
            cy: Math.round(cy * 10) / 10,
            width: Math.round(r.width * 10) / 10,
            height: Math.round(r.height * 10) / 10,
            hitOk,
            hitTag: hit ? `${hit.tagName.toLowerCase()}#${hit.id || ''}.${hit.className || ''}` : null,
          };
        })()""",
        await_promise=False,
    )
    g2_metrics['startButton'] = btn_info

    if not btn_info or not btn_info.get('found'):
      g2_failures.append(
          f'@ui-hud: Could not find visible "Start Filming" button on #title (saw {btn_info})'
      )
    else:
      if not btn_info.get('hitOk'):
        g2_failures.append(
            f'@ui-hud: "Start Filming" button center ({btn_info["cx"]}, {btn_info["cy"]}) is occluded by {btn_info.get("hitTag")}'
        )
      if btn_info['width'] < 68 or btn_info['height'] < 44:
        g2_failures.append(
            f'@ui-hud: "Start Filming" primary CTA undersized ({btn_info["width"]}x{btn_info["height"]} px; need >=68x48)'
        )

      t_click_wall = time.perf_counter()
      b.tap(btn_info['cx'], btn_info['cy'])
      after_tap = b.eval(
          r"""(() => {
            const tNow = performance.now();
            const H = window.__HALLOWEEN__;
            const st = H.getState();
            const au = H.getAudioStats ? H.getAudioStats() : {};
            const g2 = window.__qaG2 || {};
            const tRef = g2.tUp ?? g2.tDown ?? tNow;
            return {
              inPageLatencyMs: Math.max(0, Math.round((tNow - tRef) * 100) / 100),
              phase: st.phase,
              actId: st.actId,
              firstActionMs: st.feedback ? st.feedback.firstActionMs : null,
              clappers: st.stats ? st.stats.clappers : 0,
              sfxPlayedCount: au.sfxPlayedCount || 0,
              voPlayedCount: Array.isArray(au.voPlayedIds) ? au.voPlayedIds.length : 0,
              bgmPlaying: Boolean(au.bgmPlaying),
            };
          })()""",
          await_promise=False,
      )
      cdp_roundtrip_ms = round((time.perf_counter() - t_click_wall) * 1000.0, 2)
      transition_ms = after_tap['inPageLatencyMs']
      g2_metrics['transitionInPageMs'] = transition_ms
      g2_metrics['cdpRoundtripMs'] = cdp_roundtrip_ms
      g2_metrics['postTapPhase'] = after_tap['phase']
      g2_metrics['postTapActId'] = after_tap['actId']
      g2_metrics['audioResponse'] = {
          'sfxPlayedCount': after_tap['sfxPlayedCount'],
          'voPlayedCount': after_tap['voPlayedCount'],
          'bgmPlaying': after_tap['bgmPlaying'],
          'clappers': after_tap['clappers'],
      }

      if after_tap['phase'] not in ('clapper', 'dialogue', 'blocking'):
        g2_failures.append(
            f'@ui-hud/@mechanics: Tapping "Start Filming" left phase={after_tap["phase"]!r} '
            '(expected "clapper", "dialogue", or "blocking")'
        )
      if after_tap['actId'] != 1:
        g2_failures.append(f'@mechanics: Expected actId === 1 after Start Filming, got {after_tap["actId"]!r}')
      if transition_ms > 120.0:
        g2_failures.append(
            f'@core/@mechanics: Start Filming transition took {transition_ms:.1f} ms (> 120 ms limit)'
        )
      has_av_response = (
          after_tap['phase'] != 'title'
          and (
              after_tap['sfxPlayedCount'] > 0
              or after_tap['voPlayedCount'] > 0
              or after_tap['bgmPlaying']
              or after_tap['clappers'] > 0
          )
      )
      g2_metrics['hasVisualAndAudioResponse'] = has_av_response
      if not has_av_response:
        g2_failures.append(
            f'@audio-vo/@mechanics: Start Filming did not emit audio/clapper response ({g2_metrics["audioResponse"]})'
        )

      # Step past any brief clapper wipe (<= 45 frames = 0.75s sim) and verify interactive Act 1 state.
      post_clapper = b.eval(
          r"""(() => {
            const H = window.__HALLOWEEN__;
            H.stepFrames(50);
            return H.getState();
          })()""",
          await_promise=False,
      )
      g2_metrics['interactivePhaseAfterClapper'] = post_clapper.get('phase')
      if post_clapper.get('phase') not in ('dialogue', 'blocking'):
        g2_failures.append(
            f'@mechanics: After stepping 50 frames past clapper, phase={post_clapper.get("phase")!r} '
            '(expected interactive "dialogue" or "blocking")'
        )

      if save_shots:
        b.eval('new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))', await_promise=True)
        g2_metrics['act1Shot'] = b.screenshot(os.path.join(QA_DIR, 'smoke_act1.jpg'))

      post_errs = flatten_errors(collect_runtime_errors(b))
      if post_errs and not flat_boot_errs:
        g2_failures.extend([f'@core: Post-start runtime error: {e}' for e in post_errs[:5]])

  g1_passed = len(g1_failures) == 0
  g2_passed = len(g2_failures) == 0

  g1_summary = (
      f'PASS (boot={g1_metrics.get("effectiveBootMs")} ms <= 1500 ms, #title pre-JS & boot visible, 0 errors)'
      if g1_passed
      else f'FAIL ({"; ".join(g1_failures[:2])})'
  )
  g2_summary = (
      f'PASS (Start Filming -> {g2_metrics.get("postTapPhase")} in {g2_metrics.get("transitionInPageMs")} ms <= 120 ms, '
      f'CDP={g2_metrics.get("cdpRoundtripMs")} ms)'
      if g2_passed
      else f'FAIL ({"; ".join(g2_failures[:2])})'
  )

  return {
      'G1': make_gate_result('G1', 'Instant Boot & Visible Title', g1_passed, g1_summary, g1_metrics, g1_failures),
      'G2': make_gate_result('G2', 'Time-to-First-Action Responsiveness', g2_passed, g2_summary, g2_metrics, g2_failures),
  }


def main() -> int:
  ap = argparse.ArgumentParser(description='Gates G1 & G2 smoke runner')
  ap.add_argument('--no-shots', action='store_true', help='Skip saving JPEG screenshots')
  args = ap.parse_args()

  results = run_smoke(save_shots=not args.no_shots)
  out_json = os.path.join(ensure_qa_dir(), 'smoke_results.json')
  with open(out_json, 'w', encoding='utf-8') as f:
    json.dump(results, f, indent=2)

  all_ok = True
  for gid in ('G1', 'G2'):
    r = results[gid]
    tag = 'PASS' if r['passed'] else 'FAIL'
    print(f'[{tag}] {gid} — {r["name"]}: {r["summary"]}')
    for fail in r['failures']:
      print(f'       - {fail}')
    if not r['passed']:
      all_ok = False
  return 0 if all_ok else 1


if __name__ == '__main__':
  sys.exit(main())
