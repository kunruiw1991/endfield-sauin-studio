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

FIND_VISIBLE_BTN_JS = r"""
((selector) => {
  const isVis = (el) => {
    if (!el || !(el instanceof Element)) return false;
    if (el.hasAttribute('hidden') || el.disabled) return false;
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
    return r.width > 12 && r.height > 12;
  };
  const el = Array.from(document.querySelectorAll(selector)).find(isVis);
  if (!el) return { found: false };
  const r = el.getBoundingClientRect();
  return {
    found: true,
    id: el.id || '',
    cx: Math.round((r.left + r.width / 2) * 10) / 10,
    cy: Math.round((r.top + r.height / 2) * 10) / 10,
    voId: (el.dataset && (el.dataset.voId || el.dataset.replayVo)) || '',
    isMutedClass: el.classList.contains('is-muted'),
    text: (el.textContent || '').trim().replace(/\s+/g, ' '),
  };
})
"""


def _find_btn(b: Browser, selector: str) -> dict[str, Any]:
  return b.eval(f'({FIND_VISIBLE_BTN_JS})({json.dumps(selector)})', await_promise=False) or {'found': False}


def _press_key_r(b: Browser) -> None:
  b.cmd(
      'Input.dispatchKeyEvent',
      type='keyDown',
      key='r',
      code='KeyR',
      text='r',
      unmodifiedText='r',
      windowsVirtualKeyCode=82,
      nativeVirtualKeyCode=82,
  )
  b.cmd(
      'Input.dispatchKeyEvent',
      type='keyUp',
      key='r',
      code='KeyR',
      windowsVirtualKeyCode=82,
      nativeVirtualKeyCode=82,
  )


def _verify_replay_controls_e2e(b: Browser) -> tuple[list[str], dict[str, Any]]:
  """E2E verification of all 1-tap Replay buttons & keyboard shortcut R across every screen."""
  failures: list[str] = []
  details: dict[str, Any] = {}

  # 1. Return to Title via #btn-back-title and test #btn-title-replay + auto-unmute
  back_btn = _find_btn(b, '#btn-back-title')
  if back_btn.get('found'):
    time.sleep(0.32)
    b.tap(back_btn['cx'], back_btn['cy'])
    time.sleep(0.15)
    b.eval('window.__HALLOWEEN__.stepFrames(20)', await_promise=False)
  else:
    b.goto('index.html', timeout=15)
    time.sleep(0.15)

  vo_mute_btn = _find_btn(b, '#btn-title-vo, #btn-toggle-vo')
  if vo_mute_btn.get('found'):
    au_pre = b.eval('window.__HALLOWEEN__.getAudioStats()', await_promise=False) or {}
    if not au_pre.get('voMuted'):
      time.sleep(0.32)
      b.tap(vo_mute_btn['cx'], vo_mute_btn['cy'])
      time.sleep(0.12)

  title_replay = _find_btn(b, '#btn-title-replay')
  if not title_replay.get('found'):
    failures.append('@ui-hud: Missing visible #btn-title-replay on Title screen')
  else:
    time.sleep(0.32)
    b.tap(title_replay['cx'], title_replay['cy'])
    time.sleep(0.16)
    b.eval('window.__HALLOWEEN__.stepFrames(10)', await_promise=False)
    st_title = b.eval('({ st: window.__HALLOWEEN__.getState(), au: window.__HALLOWEEN__.getAudioStats(), titleVoMutedClass: Boolean(document.querySelector("#btn-title-vo")?.classList.contains("is-muted")), topVoMutedClass: Boolean(document.querySelector("#btn-toggle-vo")?.classList.contains("is-muted")), isSpeaking: Boolean(document.querySelector("#btn-title-replay")?.classList.contains("is-speaking")) })', await_promise=False)
    au_t = st_title.get('au') or {}
    details['titleReplay'] = {
        'activeVoId': au_t.get('activeVoId'),
        'lastVoId': au_t.get('lastVoId'),
        'voMuted': au_t.get('voMuted'),
        'isSpeaking': st_title.get('isSpeaking'),
    }
    if not st_title.get('isSpeaking'):
      failures.append('@ui-hud: #btn-title-replay missing .is-speaking visual pulse during active VO')
    if au_t.get('voMuted') is not False:
      failures.append(f'@audio-vo/@ui-hud: Tapping #btn-title-replay did not auto-unmute VO (voMuted={au_t.get("voMuted")})')
    if st_title.get('titleVoMutedClass') or st_title.get('topVoMutedClass'):
      failures.append('@ui-hud: VO toggle pill remained .is-muted after #btn-title-replay auto-unmuted VO')
    if au_t.get('activeVoId') != 'vo_title_welcome' or au_t.get('lastVoId') != 'vo_title_welcome':
      failures.append(
          f'@audio-vo/@ui-hud: #btn-title-replay expected vo_title_welcome, got active={au_t.get("activeVoId")!r}, last={au_t.get("lastVoId")!r}'
      )

  # 2. Cutscene Dialogue: #btn-dialogue-replay (must NOT advance line!) + #btn-dialogue-prev + keyboard R
  b.eval(
      r"""(() => {
        const H = window.__HALLOWEEN__;
        H.startLevel({ act: 1, seed: 20261031, skipDialogue: false, resetMoods: true });
        H.stepFrames(65);
      })()""",
      await_promise=False,
  )
  time.sleep(0.15)
  prev_at_zero = _find_btn(b, '#btn-dialogue-prev')
  if prev_at_zero.get('found'):
    failures.append('@ui-hud: #btn-dialogue-prev should be hidden or disabled at dialogue index 0')

  dlg_replay = _find_btn(b, '#btn-dialogue-replay')
  if not dlg_replay.get('found'):
    failures.append('@ui-hud: Missing visible #btn-dialogue-replay in Cutscene Dialogue bar')
  else:
    time.sleep(0.32)
    b.tap(dlg_replay['cx'], dlg_replay['cy'])
    time.sleep(0.15)
    b.eval('window.__HALLOWEEN__.stepFrames(8)', await_promise=False)
    st_dlg = b.eval('({ st: window.__HALLOWEEN__.getState(), au: window.__HALLOWEEN__.getAudioStats(), isSpeaking: Boolean(document.querySelector("#btn-dialogue-replay")?.classList.contains("is-speaking")) })', await_promise=False)
    idx_after_replay = ((st_dlg.get('st') or {}).get('dialogue') or {}).get('index')
    au_dlg = st_dlg.get('au') or {}
    details['dialogueReplay'] = {'indexAfterTap': idx_after_replay, 'activeVoId': au_dlg.get('activeVoId'), 'isSpeaking': st_dlg.get('isSpeaking')}
    if not st_dlg.get('isSpeaking'):
      failures.append('@ui-hud: #btn-dialogue-replay missing .is-speaking visual pulse during active VO')
    if (st_dlg.get('st') or {}).get('phase') != 'dialogue' or idx_after_replay != 0:
      failures.append(
          f'@ui-hud/@mechanics: Tapping #btn-dialogue-replay advanced or left dialogue! phase={(st_dlg.get("st") or {}).get("phase")!r}, index={idx_after_replay}'
      )
    if au_dlg.get('activeVoId') != 'vo_s1_dlg_1':
      failures.append(f'@audio-vo/@mechanics: #btn-dialogue-replay expected vo_s1_dlg_1, got {au_dlg.get("activeVoId")!r}')

  # Advance to line 1 via #btn-dialogue-next, then step back to line 0 via #btn-dialogue-prev
  dlg_next = _find_btn(b, '#btn-dialogue-next')
  if dlg_next.get('found'):
    time.sleep(0.32)
    b.tap(dlg_next['cx'], dlg_next['cy'])
    time.sleep(0.14)
    b.eval('window.__HALLOWEEN__.stepFrames(8)', await_promise=False)
    prev_at_one = _find_btn(b, '#btn-dialogue-prev')
    if not prev_at_one.get('found'):
      failures.append('@ui-hud: #btn-dialogue-prev was not visible/enabled at dialogue index 1')
    else:
      time.sleep(0.32)
      b.tap(prev_at_one['cx'], prev_at_one['cy'])
      time.sleep(0.14)
      b.eval('window.__HALLOWEEN__.stepFrames(8)', await_promise=False)
      st_prev = b.eval('({ st: window.__HALLOWEEN__.getState(), au: window.__HALLOWEEN__.getAudioStats() })', await_promise=False)
      idx_prev = ((st_prev.get('st') or {}).get('dialogue') or {}).get('index')
      au_prev = st_prev.get('au') or {}
      details['prevDialogue'] = {'indexAfterPrev': idx_prev, 'activeVoId': au_prev.get('activeVoId')}
      if idx_prev != 0 or au_prev.get('activeVoId') != 'vo_s1_dlg_1':
        failures.append(f'@mechanics/@ui-hud: #btn-dialogue-prev expected index=0 & vo_s1_dlg_1, got index={idx_prev}, vo={au_prev.get("activeVoId")!r}')

  # Keyboard shortcut 'r' in dialogue (must replay vo_s1_dlg_1 without advancing index!)
  taps_before_r = int(((b.eval('window.__HALLOWEEN__.getState().feedback', await_promise=False) or {}).get('taps', 0)))
  _press_key_r(b)
  time.sleep(0.14)
  b.eval('window.__HALLOWEEN__.stepFrames(8)', await_promise=False)
  st_key_r = b.eval('({ st: window.__HALLOWEEN__.getState(), au: window.__HALLOWEEN__.getAudioStats() })', await_promise=False)
  fb_r = (st_key_r.get('st') or {}).get('feedback') or {}
  idx_r = ((st_key_r.get('st') or {}).get('dialogue') or {}).get('index')
  au_r = st_key_r.get('au') or {}
  details['keyboardR'] = {'tapsDelta': int(fb_r.get('taps', 0)) - taps_before_r, 'index': idx_r, 'activeVoId': au_r.get('activeVoId')}
  if int(fb_r.get('taps', 0)) <= taps_before_r:
    failures.append('@core: Pressing keyboard shortcut R did not increment state.feedback.taps')
  if idx_r != 0 or au_r.get('activeVoId') != 'vo_s1_dlg_1':
    failures.append(f'@core/@mechanics: Pressing R in dialogue expected index=0 & vo_s1_dlg_1, got index={idx_r}, vo={au_r.get("activeVoId")!r}')

  # 3. Blocking phase: #btn-top-replay + Dialogue Log modal (.btn-log-replay & #btn-log-replay-cutscene)
  b.eval('window.__HALLOWEEN__.act("skipDialogue"); window.__HALLOWEEN__.stepFrames(25);', await_promise=False)
  time.sleep(0.12)
  top_replay = _find_btn(b, '#btn-top-replay')
  if not top_replay.get('found'):
    failures.append('@ui-hud: Missing visible #btn-top-replay in #top-bar during blocking')
  else:
    time.sleep(0.32)
    b.tap(top_replay['cx'], top_replay['cy'])
    time.sleep(0.14)
    b.eval('window.__HALLOWEEN__.stepFrames(8)', await_promise=False)
    au_top = b.eval('window.__HALLOWEEN__.getAudioStats()', await_promise=False) or {}
    details['topBarReplay'] = {'activeVoId': au_top.get('activeVoId'), 'lastVoId': au_top.get('lastVoId')}
    if not au_top.get('activeVoId'):
      failures.append(f'@ui-hud/@mechanics: #btn-top-replay in blocking did not trigger VO (au={au_top})')

  log_btn = _find_btn(b, '#btn-dialogue-log')
  if log_btn.get('found'):
    time.sleep(0.32)
    b.tap(log_btn['cx'], log_btn['cy'])
    time.sleep(0.14)
    b.eval('window.__HALLOWEEN__.stepFrames(10)', await_promise=False)
    line_replay = _find_btn(b, '.btn-log-replay')
    if not line_replay.get('found'):
      failures.append('@ui-hud: Missing visible .btn-log-replay inside #dialogue-log-modal')
    else:
      time.sleep(0.32)
      b.tap(line_replay['cx'], line_replay['cy'])
      time.sleep(0.14)
      b.eval('window.__HALLOWEEN__.stepFrames(8)', await_promise=False)
      au_log = b.eval('window.__HALLOWEEN__.getAudioStats()', await_promise=False) or {}
      expected_log_vo = line_replay.get('voId') or 'vo_s1_dlg_1'
      details['logLineReplay'] = {'expected': expected_log_vo, 'activeVoId': au_log.get('activeVoId')}
      if au_log.get('activeVoId') != expected_log_vo:
        failures.append(f'@ui-hud/@audio-vo: .btn-log-replay expected {expected_log_vo!r}, got {au_log.get("activeVoId")!r}')

    cutscene_replay_btn = _find_btn(b, '#btn-log-replay-cutscene')
    if not cutscene_replay_btn.get('found'):
      failures.append('@ui-hud: Missing visible #btn-log-replay-cutscene in Dialogue Log modal footer')
    else:
      time.sleep(0.32)
      b.tap(cutscene_replay_btn['cx'], cutscene_replay_btn['cy'])
      time.sleep(0.15)
      b.eval('window.__HALLOWEEN__.stepFrames(15)', await_promise=False)
      st_cut = b.eval('window.__HALLOWEEN__.getState()', await_promise=False) or {}
      details['logCutsceneReplay'] = {'modal': st_cut.get('modal'), 'phase': st_cut.get('phase')}
      if st_cut.get('modal') is not None or st_cut.get('phase') != 'dialogue':
        failures.append(
            f'@ui-hud/@mechanics: #btn-log-replay-cutscene expected modal=null & phase="dialogue", got modal={st_cut.get("modal")!r}, phase={st_cut.get("phase")!r}'
        )

  # 4. Take Result Card: #btn-take-replay (restarts 3D take + VO without double-counting moods!)
  b.eval(
      r"""(() => {
        const H = window.__HALLOWEEN__;
        if (H.getState().modal) H.act('closeModal');
        if (H.getState().phase === 'dialogue') { H.act('skipDialogue'); H.stepFrames(25); }
        H.act('cast', { actorId: 'last_rite', propId: 'sarkaz_mask' });
        H.act('rollCamera');
        H.stepFrames(220);
      })()""",
      await_promise=False,
  )
  time.sleep(0.15)
  pre_take_state = b.eval('window.__HALLOWEEN__.getState()', await_promise=False) or {}
  moods_pre_take_replay = (pre_take_state.get('moods') or {}).copy()
  choices_pre_take_replay = dict(pre_take_state.get('actChoices') or {})
  take_replay = _find_btn(b, '#btn-take-replay')
  if not take_replay.get('found'):
    failures.append('@ui-hud: Missing visible #btn-take-replay on Filmed Take Result card')
  else:
    time.sleep(0.32)
    b.tap(take_replay['cx'], take_replay['cy'])
    time.sleep(0.15)
    b.eval('window.__HALLOWEEN__.stepFrames(12)', await_promise=False)
    st_tr = b.eval('({ st: window.__HALLOWEEN__.getState(), au: window.__HALLOWEEN__.getAudioStats() })', await_promise=False)
    s_tr = st_tr.get('st') or {}
    au_tr = st_tr.get('au') or {}
    details['takeReplay'] = {
        'phase': s_tr.get('phase'),
        'activeVoId': au_tr.get('activeVoId'),
        'particles': (s_tr.get('stats') or {}).get('particles'),
        'moods': s_tr.get('moods'),
        'actChoices': s_tr.get('actChoices'),
    }
    if s_tr.get('phase') != 'take_result':
      failures.append(f'@mechanics/@ui-hud: #btn-take-replay changed phase from take_result to {s_tr.get("phase")!r}')
    if au_tr.get('activeVoId') != 'vo_take_1_1':
      failures.append(f'@mechanics/@audio-vo: #btn-take-replay expected vo_take_1_1, got {au_tr.get("activeVoId")!r}')
    if int((s_tr.get('stats') or {}).get('particles', 0)) < 15:
      failures.append(f'@mechanics/@world-render: #btn-take-replay spawned < 15 stage particles ({(s_tr.get("stats") or {}).get("particles")})')
    if s_tr.get('moods') != moods_pre_take_replay:
      failures.append(f'@mechanics: #btn-take-replay mutated committed moods! before={moods_pre_take_replay}, after={s_tr.get("moods")}')
    if dict(s_tr.get('actChoices') or {}) != choices_pre_take_replay:
      failures.append(
          f'@mechanics: #btn-take-replay mutated actChoices! before={choices_pre_take_replay}, after={s_tr.get("actChoices")}'
      )

  # Stage Reel Replay (#btn-reel-replay on HUD after Take 1-A is filmed)
  reel_replay = _find_btn(b, '#btn-reel-replay')
  if not reel_replay.get('found'):
    failures.append('@ui-hud: Missing visible #btn-reel-replay after Take 1-A was filmed')
  else:
    time.sleep(0.32)
    b.tap(reel_replay['cx'], reel_replay['cy'])
    time.sleep(0.15)
    b.eval('window.__HALLOWEEN__.stepFrames(12)', await_promise=False)
    au_reel = b.eval('window.__HALLOWEEN__.getAudioStats()', await_promise=False) or {}
    details['reelReplay'] = {'activeVoId': au_reel.get('activeVoId'), 'lastVoId': au_reel.get('lastVoId')}
    if au_reel.get('activeVoId') != 'vo_take_1_1':
      failures.append(f'@ui-hud/@mechanics: #btn-reel-replay expected vo_take_1_1, got {au_reel.get("activeVoId")!r}')

  # 5. Ending View: #btn-ending-replay (no progress.runsCompleted double-count!) + 10x rapid burst + Album [data-replay-vo]
  b.eval(
      r"""(() => {
        const H = window.__HALLOWEEN__;
        H.solveCurrentLevel('END1');
        H.stepFrames(60);
      })()""",
      await_promise=False,
  )
  time.sleep(0.15)
  runs_pre_ending_replay = int(
      (((b.eval('window.__HALLOWEEN__.getState()', await_promise=False) or {}).get('progress') or {}).get('runsCompleted', 0))
  )
  ending_replay = _find_btn(b, '#btn-ending-replay')
  if not ending_replay.get('found'):
    failures.append('@ui-hud: Missing visible #btn-ending-replay on Ending screen')
  else:
    time.sleep(0.32)
    b.tap(ending_replay['cx'], ending_replay['cy'])
    time.sleep(0.15)
    b.eval('window.__HALLOWEEN__.stepFrames(12)', await_promise=False)
    st_end = b.eval('({ st: window.__HALLOWEEN__.getState(), au: window.__HALLOWEEN__.getAudioStats(), isSpeaking: Boolean(document.querySelector("#btn-ending-replay")?.classList.contains("is-speaking")) })', await_promise=False)
    s_end = st_end.get('st') or {}
    au_end = st_end.get('au') or {}
    runs_after_ending_replay = int(((s_end.get('progress') or {}).get('runsCompleted', -1)))
    details['endingReplay'] = {
        'phase': s_end.get('phase'),
        'activeVoId': au_end.get('activeVoId'),
        'lastVoId': au_end.get('lastVoId'),
        'particles': (s_end.get('stats') or {}).get('particles'),
        'runsCompleted': runs_after_ending_replay,
        'isSpeaking': st_end.get('isSpeaking'),
    }
    if not st_end.get('isSpeaking'):
      failures.append('@ui-hud: #btn-ending-replay missing .is-speaking visual pulse during active VO')
    if s_end.get('phase') != 'ending':
      failures.append(f'@ui-hud/@mechanics: #btn-ending-replay left ending phase ({s_end.get("phase")!r})')
    if au_end.get('activeVoId') != 'vo_end_1' or au_end.get('lastVoId') != 'vo_end_1':
      failures.append(f'@mechanics/@audio-vo: #btn-ending-replay expected vo_end_1, got active={au_end.get("activeVoId")!r}, last={au_end.get("lastVoId")!r}')
    if int((s_end.get('stats') or {}).get('particles', 0)) < 15:
      failures.append(f'@mechanics: #btn-ending-replay spawned < 15 celebratory particles ({(s_end.get("stats") or {}).get("particles")})')
    if runs_after_ending_replay != runs_pre_ending_replay:
      failures.append(
          f'@mechanics: #btn-ending-replay double-counted progress.runsCompleted ({runs_pre_ending_replay} -> {runs_after_ending_replay})'
      )

  # 10x rapid replay burst check (preemption safety, zero errors, dead === 0)
  burst_res = b.eval(
      r"""(() => {
        const H = window.__HALLOWEEN__;
        for (let i = 0; i < 10; i++) {
          H.act('replay');
          H.stepFrames(2);
        }
        const st = H.getState();
        return {
          au: H.getAudioStats(),
          dead: st.feedback?.dead ?? -1,
          runsCompleted: st.progress?.runsCompleted ?? -1,
        };
      })()""",
      await_promise=False,
  )
  details['rapidBurst10x'] = burst_res
  if (burst_res.get('au') or {}).get('activeVoId') != 'vo_end_1' or burst_res.get('dead') != 0:
    failures.append(f'@audio-vo/@mechanics: 10x rapid replay burst failed: {burst_res}')
  if int(burst_res.get('runsCompleted', -1)) != runs_pre_ending_replay:
    failures.append(f'@mechanics: 10x rapid replay burst mutated progress.runsCompleted: {burst_res}')

  # Film Album [data-replay-vo] check
  b.eval('window.__HALLOWEEN__.act("openModal", { modal: "album" }); window.__HALLOWEEN__.stepFrames(20);', await_promise=False)
  time.sleep(0.14)
  album_vo_btn = _find_btn(b, '[data-replay-vo]')
  if not album_vo_btn.get('found'):
    failures.append('@ui-hud: Missing visible [data-replay-vo] button in Film Album modal')
  else:
    time.sleep(0.32)
    b.tap(album_vo_btn['cx'], album_vo_btn['cy'])
    time.sleep(0.15)
    b.eval('window.__HALLOWEEN__.stepFrames(8)', await_promise=False)
    au_alb = b.eval('window.__HALLOWEEN__.getAudioStats()', await_promise=False) or {}
    expected_alb_vo = album_vo_btn.get('voId') or ''
    details['albumVoReplay'] = {'expected': expected_alb_vo, 'activeVoId': au_alb.get('activeVoId')}
    if expected_alb_vo and au_alb.get('activeVoId') != expected_alb_vo:
      failures.append(f'@ui-hud/@audio-vo: Album [data-replay-vo] expected {expected_alb_vo!r}, got {au_alb.get("activeVoId")!r}')
  b.eval('window.__HALLOWEEN__.act("closeModal"); window.__HALLOWEEN__.stepFrames(10);', await_promise=False)

  return failures, details


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

    replay_failures, replay_details = _verify_replay_controls_e2e(b)
    g11_failures.extend(replay_failures)

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
      'PASS (VO captions, BGM ducking/restore & all 9 Replay controls + 10x burst + key R verified E2E)'
      if g11_passed
      else f'FAIL ({"; ".join(g11_failures[:2])})'
  )

  return {
      'G10': make_gate_result(
          'G10', '100% Neural English VO Integrity (52/52)', g10_passed, g10_summary, g10_metrics, g10_failures
      ),
      'G11': make_gate_result(
          'G11',
          'VO Caption Sync, BGM Ducking & Replay Controls',
          g11_passed,
          g11_summary,
          {'clips': clip_checks, 'replayControls': replay_details},
          g11_failures,
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
