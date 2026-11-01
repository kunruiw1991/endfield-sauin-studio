#!/usr/bin/env python3
"""Neural English Voiceover Pack, Caption Sync & BGM Auto-Ducking — Gates G10 & G11 (owner: @qa-e2e).

Verifies:
- Gate G10: `assets/vo/manifest.json` HTTP 200 with exact 52 entries; every `assets/vo/<id>.mp3`
            HTTP 200, size > 4000 bytes, valid MP3 header, durationMs >= 400, zero Hanzi / leaked
            phonetic spellings in subtitle text, `speechSynthesisUsed === false`.
- Gate G11: Triggering cutscene, take, and ending VO clips displays visible English caption banner
            matching `manifest[id].text`, sets `bgmDucked === true` (`bgmGain <= 0.40`) during
            playback, and restores `bgmGain` after completion.

All scratch artifacts & screenshots live strictly under /tmp/bv13d_halloween/qa/.
"""
from __future__ import annotations

import argparse
import json
import os
import re
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
    http_get_local,
    install_page_probes,
    make_gate_result,
)

EXPECTED_52_VO_IDS = [
    # 8 Studio / System lines
    'vo_title_welcome',
    'vo_clapper_start',
    'vo_tut_cast',
    'vo_roll_action',
    'vo_reshoot',
    'vo_album_open',
    'vo_rewards_claim',
    'vo_all_complete',
    # 19 Pre-Shoot Cutscene lines
    'vo_s1_dlg_1', 'vo_s1_dlg_2', 'vo_s1_dlg_3', 'vo_s1_dlg_4', 'vo_s1_dlg_5', 'vo_s1_dlg_6',
    'vo_s2_dlg_1', 'vo_s2_dlg_2',
    'vo_s3_dlg_1', 'vo_s3_dlg_2', 'vo_s3_dlg_3',
    'vo_s4_dlg_1', 'vo_s4_dlg_2', 'vo_s4_dlg_3', 'vo_s4_dlg_4',
    'vo_s5_dlg_1', 'vo_s5_dlg_2', 'vo_s5_dlg_3', 'vo_s5_dlg_4',
    # 20 Stage Take narrations
    'vo_take_1_1', 'vo_take_1_2', 'vo_take_1_3', 'vo_take_1_4',
    'vo_take_2_1', 'vo_take_2_2', 'vo_take_2_3', 'vo_take_2_4',
    'vo_take_3_1', 'vo_take_3_2', 'vo_take_3_3', 'vo_take_3_4',
    'vo_take_4_1', 'vo_take_4_2', 'vo_take_4_3', 'vo_take_4_4',
    'vo_take_5_1', 'vo_take_5_2', 'vo_take_5_3', 'vo_take_5_4',
    # 5 Branching Ending narrations
    'vo_end_1', 'vo_end_2', 'vo_end_3', 'vo_end_4', 'vo_end_5',
]

CJK_RE = re.compile(r'[\u4e00-\u9fff]')
PHONETIC_LEAK_RE = re.compile(r'\b(Sah-win|Sahr-kahz|Fahng-choo|Mee Foo|Chyen-yoo|Sesh-kah)\b', re.IGNORECASE)


def _is_valid_mp3_bytes(data: bytes) -> bool:
  if len(data) < 16:
    return False
  if data[:3] == b'ID3':
    return True
  return data[0] == 0xFF and (data[1] & 0xE0) == 0xE0


def _norm_ws(s: str) -> str:
  return re.sub(r'\s+', ' ', (s or '').strip())


def _audit_manifest_and_mp3s_http(http_port: int) -> tuple[dict[str, Any], list[str], dict[str, Any]]:
  failures: list[str] = []
  code, raw, _ = http_get_local(http_port, 'assets/vo/manifest.json', timeout=5.0)
  if code != 200:
    msg = f'@vo-studio: assets/vo/manifest.json returned HTTP {code}'
    return {}, [msg], {'manifestStatus': code}

  try:
    manifest = json.loads(raw.decode('utf-8'))
  except Exception as exc:  # noqa: BLE001
    msg = f'@vo-studio: assets/vo/manifest.json invalid JSON: {exc}'
    return {}, [msg], {'manifestStatus': code}

  if not isinstance(manifest, dict):
    return {}, ['@vo-studio: manifest.json root must be an object'], {'manifestStatus': code}

  got_ids = set(manifest.keys())
  exp_ids = set(EXPECTED_52_VO_IDS)
  if len(manifest) != 52 or got_ids != exp_ids:
    missing = sorted(exp_ids - got_ids)
    extra = sorted(got_ids - exp_ids)
    failures.append(
        f'@vo-studio: Expected 52 canonical VO IDs, got {len(manifest)} (missing={missing[:5]}, extra={extra[:5]})'
    )

  min_bytes = None
  max_bytes = 0
  min_dur_ms = None
  http_200_count = 0

  for vid in EXPECTED_52_VO_IDS:
    entry = manifest.get(vid)
    if not isinstance(entry, dict):
      continue
    rel_file = str(entry.get('file') or '')
    dur_ms = entry.get('durationMs')
    txt = str(entry.get('text') or '')
    speaker = str(entry.get('speaker') or '')

    if not rel_file or not speaker or not txt:
      failures.append(f'@vo-studio: manifest[{vid}] missing file/speaker/text: {entry}')
      continue
    if not isinstance(dur_ms, (int, float)) or dur_ms < 400:
      failures.append(f'@vo-studio: manifest[{vid}].durationMs={dur_ms} (< 400 ms threshold)')
    else:
      min_dur_ms = dur_ms if min_dur_ms is None else min(min_dur_ms, dur_ms)

    if CJK_RE.search(txt) or CJK_RE.search(speaker):
      failures.append(f'@vo-studio: manifest[{vid}] contains CJK characters in text/speaker')
    if PHONETIC_LEAK_RE.search(txt):
      failures.append(
          f'@vo-studio: manifest[{vid}].text leaked phonetic TTS spelling instead of canonical englishText: {txt!r}'
      )

    m_code, m_bytes, _ = http_get_local(http_port, rel_file, timeout=5.0)
    if m_code != 200:
      failures.append(f'@vo-studio: {rel_file} returned HTTP {m_code}')
      continue
    http_200_count += 1
    sz = len(m_bytes)
    min_bytes = sz if min_bytes is None else min(min_bytes, sz)
    max_bytes = max(max_bytes, sz)
    if sz <= 4000:
      failures.append(f'@vo-studio: {rel_file} size={sz} bytes (need > 4000 bytes)')
    if not _is_valid_mp3_bytes(m_bytes):
      failures.append(f'@vo-studio: {rel_file} lacks valid ID3/MPEG MP3 header')

  metrics = {
      'manifestEntries': len(manifest),
      'mp3Http200Count': http_200_count,
      'minBytes': min_bytes,
      'maxBytes': max_bytes,
      'minDurationMs': min_dur_ms,
  }
  return manifest, failures, metrics


READ_CAPTION_AND_AUDIO_JS = r"""
(() => {
  const H = window.__HALLOWEEN__;
  const au = H.getAudioStats ? H.getAudioStats() : {};
  const isVis = (el) => {
    if (!el || !(el instanceof Element)) return false;
    if (el.hasAttribute('hidden')) return false;
    let cur = el;
    while (cur && cur !== document.documentElement) {
      if (cur.hasAttribute && cur.hasAttribute('hidden')) return false;
      const cs = window.getComputedStyle(cur);
      if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity || '1') <= 0.05) {
        return false;
      }
      cur = cur.parentElement;
    }
    const r = el.getBoundingClientRect();
    return r.width > 10 && r.height > 10;
  };

  const capCandidates = Array.from(document.querySelectorAll(
    '#captions, #caption-banner, #vo-caption, [data-caption], .caption-banner, .captions-hud, .vo-caption, [class*="caption"]'
  )).filter(isVis);

  const visibleCaptionTexts = capCandidates.map((el) => (el.textContent || '').trim().replace(/\s+/g, ' '));
  const fullBodyText = (document.body ? document.body.innerText : '').replace(/\s+/g, ' ');

  return {
    audioStats: au,
    visibleCaptionTexts,
    fullBodyText,
    speechSynthCalls: window.__qaProbe ? window.__qaProbe.speechSynthCalls : 0,
  };
})()
"""


def run_vo_and_audio(save_shots: bool = True) -> dict[str, dict[str, Any]]:
  ensure_qa_dir()
  index_exists = os.path.exists(os.path.join(ROOT, 'index.html'))

  with Browser(width=1280, height=800, root=ROOT, mobile=False, allow_autoplay=True) as b:
    install_page_probes(b)
    manifest, g10_failures, g10_metrics = _audit_manifest_and_mp3s_http(b.http_port)

    if not index_exists:
      g10_failures.append('@core/@audio-vo: index.html not yet created to verify runtime speechSynthesisUsed & manifestLoaded')
      g11_msg = '@core/@audio-vo: index.html does not exist yet'
      return {
          'G10': make_gate_result(
              'G10', '100% Neural English VO Integrity (52/52)', False, g10_failures[-1], g10_metrics, g10_failures
          ),
          'G11': make_gate_result(
              'G11', 'VO Caption Sync & BGM Auto-Ducking', False, g11_msg, {}, [g11_msg]
          ),
      }

    if not b.goto('index.html', timeout=15):
      errs = flatten_errors(collect_runtime_errors(b))
      msg = f'@core: Failed to load index.html ({errs[:3]})'
      g10_failures.append(msg)
      return {
          'G10': make_gate_result('G10', '100% Neural English VO Integrity (52/52)', False, msg, g10_metrics, g10_failures),
          'G11': make_gate_result('G11', 'VO Caption Sync & BGM Auto-Ducking', False, msg, {}, [msg]),
      }

    # Give manifest fetch inside audio_engine a moment to resolve on localhost.
    for _ in range(30):
      au0 = b.eval('window.__HALLOWEEN__.getAudioStats()', await_promise=False) or {}
      if au0.get('manifestLoaded'):
        break
      time.sleep(0.05)

    # Unlock audio via user gesture tap on center / Start Filming or innocuous title gesture, then settle.
    b.tap(640, 200)
    time.sleep(0.15)
    b.eval(
        r"""(() => {
          const H = window.__HALLOWEEN__;
          H.act('startGame', { seed: 20261031, skipDialogue: true });
          H.stepFrames(500);
        })()""",
        await_promise=False,
    )
    time.sleep(0.35)
    b.eval('window.__HALLOWEEN__.stepFrames(120)', await_promise=False)

    snap0 = b.eval(READ_CAPTION_AND_AUDIO_JS, await_promise=False)
    au_boot = snap0.get('audioStats') or {}
    g10_metrics['runtimeAudioStats'] = {
        'manifestLoaded': au_boot.get('manifestLoaded'),
        'clipsTotal': au_boot.get('clipsTotal'),
        'clipsVerified': au_boot.get('clipsVerified'),
        'speechSynthesisUsed': au_boot.get('speechSynthesisUsed'),
        'speechSynthSpyCalls': snap0.get('speechSynthCalls', 0),
    }

    if not au_boot.get('manifestLoaded'):
      g10_failures.append(f'@audio-vo: getAudioStats().manifestLoaded is {au_boot.get("manifestLoaded")!r}')
    if int(au_boot.get('clipsTotal') or 0) != 52:
      g10_failures.append(f'@audio-vo: getAudioStats().clipsTotal={au_boot.get("clipsTotal")} (expected 52)')
    if au_boot.get('speechSynthesisUsed') is not False or snap0.get('speechSynthCalls', 0) != 0:
      g10_failures.append(
          f'@audio-vo: Banned window.speechSynthesis detected! '
          f'speechSynthesisUsed={au_boot.get("speechSynthesisUsed")}, spyCalls={snap0.get("speechSynthCalls")}'
      )

    # --- Gate G11: Cutscene, Take, and Ending VO clips -> Caption Sync + BGM Ducking + Restore ---
    g11_failures: list[str] = []
    clip_checks: list[dict[str, Any]] = []
    test_clips = [
        ('cutscene', 'vo_s1_dlg_2'),
        ('take', 'vo_take_2_3'),
        ('ending', 'vo_end_1'),
    ]

    for category, vo_id in test_clips:
      expected_text = _norm_ws((manifest.get(vo_id) or {}).get('text', ''))
      expected_speaker = _norm_ws((manifest.get(vo_id) or {}).get('speaker', ''))
      dur_ms = int((manifest.get(vo_id) or {}).get('durationMs', 3500))

      play_ret = b.eval(
          f'window.__HALLOWEEN__.playVO({json.dumps(vo_id)}, {{ force: true }})',
          await_promise=True,
      )
      # Allow 80ms WebAudio ducking attack + UI sync frame
      time.sleep(0.14)
      b.eval('window.__HALLOWEEN__.stepFrames(8)', await_promise=False)
      during = b.eval(READ_CAPTION_AND_AUDIO_JS, await_promise=False)
      au_during = during.get('audioStats') or {}

      if save_shots and category == 'take':
        b.eval('new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))', await_promise=True)
        b.screenshot(os.path.join(QA_DIR, 'g11_vo_caption.jpg'))

      cap_joined = ' | '.join(during.get('visibleCaptionTexts') or [])
      active_cap = str(au_during.get('activeCaption') or '')
      caption_matched = bool(
          expected_text
          and (
              expected_text in cap_joined
              or expected_text in _norm_ws(during.get('fullBodyText') or '')
          )
      )
      ducked_flag = bool(au_during.get('bgmDucked'))
      gain_during = float(au_during.get('bgmGain') if au_during.get('bgmGain') is not None else 1.0)

      if not (play_ret and (play_ret is True or (isinstance(play_ret, dict) and play_ret.get('ok', True)))):
        g11_failures.append(f'@audio-vo: playVO({vo_id!r}) returned non-ok: {play_ret}')
      if au_during.get('activeVoId') != vo_id:
        g11_failures.append(
            f'@audio-vo: During {category} clip {vo_id}, activeVoId={au_during.get("activeVoId")!r}'
        )
      if not caption_matched:
        g11_failures.append(
            f'@ui-hud/@core/@audio-vo: Visible caption during {vo_id} did not match manifest text! '
            f'Expected {expected_text!r}, visibleCaptions={during.get("visibleCaptionTexts")}'
        )
      if not ducked_flag or gain_during > 0.40:
        g11_failures.append(
            f'@audio-vo: BGM not ducked during {vo_id}: bgmDucked={ducked_flag}, bgmGain={gain_during:.3f} (need <= 0.40)'
        )

      # Advance simulation past clip duration; if live HTML5 Audio is still playing, let it finish or step cleanly.
      frames_to_end = int((dur_ms + 600) / 16.666) + 15
      b.eval(f'window.__HALLOWEEN__.stepFrames({frames_to_end})', await_promise=False)
      t_wait0 = time.perf_counter()
      while (time.perf_counter() - t_wait0) < (dur_ms / 1000.0 + 1.2):
        au_chk = b.eval('window.__HALLOWEEN__.getAudioStats()', await_promise=False) or {}
        if au_chk.get('activeVoId') != vo_id:
          break
        time.sleep(0.10)
        b.eval('window.__HALLOWEEN__.stepFrames(10)', await_promise=False)

      # Wait 340 ms for 280 ms BGM release ramp + 250 ms caption auto-clear
      time.sleep(0.35)
      b.eval('window.__HALLOWEEN__.stepFrames(25)', await_promise=False)
      after = b.eval(READ_CAPTION_AND_AUDIO_JS, await_promise=False)
      au_after = after.get('audioStats') or {}
      gain_after = float(au_after.get('bgmGain') if au_after.get('bgmGain') is not None else 0.0)

      if au_after.get('activeVoId') == vo_id:
        g11_failures.append(f'@audio-vo: {vo_id} remained stuck as activeVoId after completion')
      if au_after.get('bgmDucked') is not False:
        g11_failures.append(f'@audio-vo: bgmDucked remained True after {vo_id} finished')
      if gain_after <= max(0.55, gain_during + 0.25):
        g11_failures.append(
            f'@audio-vo: bgmGain did not restore after {vo_id} finished (during={gain_during:.3f}, after={gain_after:.3f})'
        )
      if after.get('speechSynthCalls', 0) != 0 or au_after.get('speechSynthesisUsed') is not False:
        g11_failures.append('@audio-vo: speechSynthesisUsed became true during VO playback')

      clip_checks.append({
          'category': category,
          'voId': vo_id,
          'speaker': expected_speaker,
          'captionMatched': caption_matched,
          'activeCaption': active_cap[:80],
          'bgmDuckedDuring': ducked_flag,
          'bgmGainDuring': round(gain_during, 3),
          'bgmGainAfter': round(gain_after, 3),
      })

    errs = flatten_errors(collect_runtime_errors(b))
    if errs:
      g11_failures.extend([f'@audio-vo/@core: Runtime error during VO test: {e}' for e in errs[:4]])

  g10_passed = len(g10_failures) == 0
  g11_passed = len(g11_failures) == 0

  g10_summary = (
      f'PASS (52/52 manifest & MP3s HTTP 200, minSize={g10_metrics.get("minBytes")} B > 4000 B, '
      f'minDur={g10_metrics.get("minDurationMs")} ms >= 400 ms, speechSynthesisUsed=false)'
      if g10_passed
      else f'FAIL ({"; ".join(g10_failures[:2])})'
  )
  g11_summary = (
      'PASS (cutscene, take & ending VOs sync English captions, duck BGM <= 0.40, and restore cleanly)'
      if g11_passed
      else f'FAIL ({"; ".join(g11_failures[:2])})'
  )

  return {
      'G10': make_gate_result(
          'G10', '100% Neural English VO Integrity (52/52)', g10_passed, g10_summary, g10_metrics, g10_failures
      ),
      'G11': make_gate_result(
          'G11', 'VO Caption Sync & BGM Auto-Ducking', g11_passed, g11_summary, {'clips': clip_checks}, g11_failures
      ),
  }


def main() -> int:
  ap = argparse.ArgumentParser(description='Gates G10 & G11 VO & Audio verification runner')
  ap.add_argument('--no-shots', action='store_true', help='Skip saving JPEG screenshots')
  args = ap.parse_args()

  results = run_vo_and_audio(save_shots=not args.no_shots)
  out_json = os.path.join(ensure_qa_dir(), 'vo_and_audio_results.json')
  with open(out_json, 'w', encoding='utf-8') as f:
    json.dump(results, f, indent=2)

  all_ok = True
  for gid in ('G10', 'G11'):
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
