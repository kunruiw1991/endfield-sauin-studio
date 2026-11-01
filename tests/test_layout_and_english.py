#!/usr/bin/env python3
"""100% English Localization & 4-Viewport Responsive Layout Suite — Gates G9 & G13 (owner: @qa-e2e).

Verifies:
- Gate G9:  Sweeps Title, all 5 Act Cutscenes, Blocking UIs, all 20 Take Cards, all 5 Endings,
            Film Album, and Event Rewards Modal asserting `document.documentElement.lang === 'en'`
            and `hanziCount === 0` (`[\u4e00-\u9fff]` === 0 across DOM, attributes, data tables,
            and registered/intercepted 2D `<canvas>` text).
- Gate G13: Audits all 4 required viewports (`1280x800`, `1024x768`, `844x390`, `390x844`) across
            Title, Cutscene, Blocking, Take Result, Ending, Film Album, and Rewards Modal for:
            - zero scroll overflow (`scrollWidth <= innerWidth`, `scrollHeight <= innerHeight`)
            - zero overlapping interactive button bounding rects
            - all primary CTAs & foreground buttons inside viewport bounds & unoccluded
            - saves compressed JPEG screenshots strictly to `/tmp/bv13d_halloween/qa/`.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
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
)

VIEWPORTS = [
    (1280, 800, False, '1280x800'),
    (1024, 768, True, '1024x768'),
    (768, 1024, True, '768x1024'),
    (844, 390, True, '844x390'),
    (390, 844, True, '390x844'),
]

SCAN_HANZI_SNAPSHOT_JS = r"""
((label) => {
  const cjkRe = /[\u4e00-\u9fff]/g;
  const H = window.__HALLOWEEN__;
  const st = H.getState();
  const lang = document.documentElement ? document.documentElement.lang : '';
  const bodyText = document.body ? (document.body.innerText || '') : '';
  const domMatches = bodyText.match(cjkRe) || [];

  // Also scan accessible attributes (aria-label, title, placeholder, alt)
  const attrSamples = [];
  if (document.body) {
    for (const el of document.body.querySelectorAll('[aria-label],[title],[placeholder],[alt]')) {
      for (const a of ['aria-label', 'title', 'placeholder', 'alt']) {
        const v = el.getAttribute(a);
        if (v && cjkRe.test(v)) attrSamples.push(`${a}=${v.slice(0, 30)}`);
        cjkRe.lastIndex = 0;
      }
    }
  }

  // Scan intercepted 2D canvas fillText / strokeText strings
  const canvasStrings = (window.__qaProbe && Array.isArray(window.__qaProbe.canvasTexts))
    ? window.__qaProbe.canvasTexts
    : [];
  const canvasCjk = canvasStrings.filter((s) => {
    cjkRe.lastIndex = 0;
    return cjkRe.test(s);
  });

  return {
    label,
    lang,
    stateHanziCount: st ? st.hanziCount : -1,
    domCjkCount: domMatches.length,
    domCjkSample: domMatches.slice(0, 8).join(''),
    attrCjk: attrSamples.slice(0, 5),
    canvasCjkCount: canvasCjk.length,
    canvasCjkSample: canvasCjk.slice(0, 5),
  };
})
"""

AUDIT_VIEWPORT_SCREEN_JS = r"""
((screenName, primaryRegexStr) => {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const docEl = document.documentElement;
  const body = document.body;
  const H = window.__HALLOWEEN__;
  const st = H ? H.getState() : {};
  const modalActive = Boolean(st && st.modal);

  const isVisible = (el) => {
    if (!el || !(el instanceof Element)) return false;
    if (el.hasAttribute('hidden')) return false;
    let cur = el;
    while (cur && cur !== docEl) {
      if (cur.hasAttribute && cur.hasAttribute('hidden')) return false;
      const cs = window.getComputedStyle(cur);
      if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity || '1') <= 0.05) {
        return false;
      }
      cur = cur.parentElement;
    }
    const r = el.getBoundingClientRect();
    return r.width > 2 && r.height > 2;
  };

  const findScrollAncestor = (el) => {
    let cur = el.parentElement;
    while (cur && cur !== body && cur !== docEl) {
      const cs = window.getComputedStyle(cur);
      const oy = cs.overflowY;
      const ox = cs.overflowX;
      if (
        ((oy === 'auto' || oy === 'scroll') && cur.scrollHeight > cur.clientHeight + 2) ||
        ((ox === 'auto' || ox === 'scroll') && cur.scrollWidth > cur.clientWidth + 2)
      ) {
        return cur;
      }
      cur = cur.parentElement;
    }
    return null;
  };

  const describeEl = (el) => {
    const id = el.id ? `#${el.id}` : '';
    const cls = (typeof el.className === 'string' && el.className.trim())
      ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.')
      : '';
    const txt = (el.textContent || el.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 26);
    return `${el.tagName.toLowerCase()}${id}${cls}${txt ? `("${txt}")` : ''}`;
  };

  const roundRect = (r) => ({
    left: Math.round(r.left * 10) / 10,
    top: Math.round(r.top * 10) / 10,
    right: Math.round(r.right * 10) / 10,
    bottom: Math.round(r.bottom * 10) / 10,
    width: Math.round(r.width * 10) / 10,
    height: Math.round(r.height * 10) / 10,
  });

  // 1. Page-level scroll overflow check
  const docScrollWidth = docEl.scrollWidth;
  const docScrollHeight = docEl.scrollHeight;
  const scrollOverflow = (docScrollWidth > vw + 1) || (docScrollHeight > vh + 1);

  // 2. Collect visible interactive buttons/controls
  const selector = [
    'button',
    '[role="button"]',
    '[role="tab"]',
    'a[href]',
    '[data-item-id]',
    '[data-card-id]',
    '.cast-card',
    '.tray-card',
  ].join(', ');

  const rawInteractive = Array.from(body.querySelectorAll(selector)).filter((el) => {
    if (!isVisible(el)) return false;
    if (el.disabled) return false;
    const cs = window.getComputedStyle(el);
    return cs.pointerEvents !== 'none';
  });

  // Deduplicate nested interactive elements (keep outermost button/card)
  const topInteractive = rawInteractive.filter(
    (el) => !rawInteractive.some((other) => other !== el && other.contains(el))
  );

  // Filter to foreground controls (so background HUD behind an active modal dimmer is ignored)
  const fgControls = [];
  for (const el of topInteractive) {
    const rawR = el.getBoundingClientRect();
    const scrollAnc = findScrollAncestor(el);
    let effLeft = rawR.left;
    let effTop = rawR.top;
    let effRight = rawR.right;
    let effBottom = rawR.bottom;
    if (scrollAnc) {
      const sr = scrollAnc.getBoundingClientRect();
      effLeft = Math.max(effLeft, sr.left);
      effTop = Math.max(effTop, sr.top);
      effRight = Math.min(effRight, sr.right);
      effBottom = Math.min(effBottom, sr.bottom);
      if (effRight - effLeft < 6 || effBottom - effTop < 6) {
        // Scrolled outside internal scroll container view
        continue;
      }
    }

    const cx = (effLeft + effRight) / 2;
    const cy = (effTop + effBottom) / 2;
    if (modalActive && cx >= 0 && cx <= vw && cy >= 0 && cy <= vh) {
      const hit = document.elementFromPoint(cx, cy);
      if (hit && !(hit === el || el.contains(hit) || hit.contains(el))) {
        // Occluded behind active modal backdrop
        continue;
      }
    }

    fgControls.push({
      el,
      inScrollList: Boolean(scrollAnc),
      desc: describeEl(el),
      text: (el.textContent || el.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' '),
      rect: roundRect({
        left: effLeft,
        top: effTop,
        right: effRight,
        bottom: effBottom,
        width: effRight - effLeft,
        height: effBottom - effTop,
      }),
    });
  }

  // 3. Pairwise overlap check among active foreground buttons
  const overlaps = [];
  for (let i = 0; i < fgControls.length; i++) {
    for (let j = i + 1; j < fgControls.length; j++) {
      const a = fgControls[i];
      const b = fgControls[j];
      if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
      const ox = Math.min(a.rect.right, b.rect.right) - Math.max(a.rect.left, b.rect.left);
      const oy = Math.min(a.rect.bottom, b.rect.bottom) - Math.max(a.rect.top, b.rect.top);
      if (ox > 2.5 && oy > 2.5) {
        overlaps.push({
          a: a.desc,
          b: b.desc,
          ox: Math.round(ox * 10) / 10,
          oy: Math.round(oy * 10) / 10,
          aRect: a.rect,
          bRect: b.rect,
        });
      }
    }
  }

  // 4. Viewport bounds check on all non-scroll-list foreground buttons
  const outOfBounds = fgControls
    .filter((c) => !c.inScrollList && (
      c.rect.left < -2.0 ||
      c.rect.top < -2.0 ||
      c.rect.right > vw + 2.0 ||
      c.rect.bottom > vh + 2.0
    ))
    .map((c) => ({ desc: c.desc, rect: c.rect }));

  // 5. Primary CTA presence, bounds & hit-test check
  let primaryCtaOk = true;
  let primaryCtaDetail = null;
  if (primaryRegexStr) {
    const pRe = new RegExp(primaryRegexStr, 'i');
    const cta = fgControls.find((c) => pRe.test(c.text) || pRe.test(c.desc));
    if (!cta) {
      primaryCtaOk = false;
      primaryCtaDetail = { found: false, expectedPattern: primaryRegexStr, available: fgControls.map((c) => c.desc).slice(0, 10) };
    } else {
      const cx = (cta.rect.left + cta.rect.right) / 2;
      const cy = (cta.rect.top + cta.rect.bottom) / 2;
      const inBounds = cta.rect.left >= -1.5 && cta.rect.top >= -1.5 && cta.rect.right <= vw + 1.5 && cta.rect.bottom <= vh + 1.5;
      const hit = (cx >= 0 && cx <= vw && cy >= 0 && cy <= vh) ? document.elementFromPoint(cx, cy) : null;
      const unoccluded = Boolean(hit && (hit === cta.el || cta.el.contains(hit) || hit.contains(cta.el)));
      primaryCtaOk = inBounds && unoccluded;
      primaryCtaDetail = {
        found: true,
        desc: cta.desc,
        rect: cta.rect,
        inBounds,
        unoccluded,
        hitTag: hit ? describeEl(hit) : null,
      };
    }
  }

  // 6. Button internal label horizontal overflow check (checks actual text/span bounds vs button box, ignoring ::after badge dots)
  const clippedButtons = [];
  for (const c of fgControls) {
    if (c.el.tagName !== 'BUTTON') continue;
    const cs = window.getComputedStyle(c.el);
    if (cs.overflowX === 'hidden' && cs.textOverflow === 'ellipsis') continue;
    const br = c.el.getBoundingClientRect();
    if (br.width <= 0) continue;
    const range = document.createRange();
    range.selectNodeContents(c.el);
    const tr = range.getBoundingClientRect();
    if (tr.width > 0 && (tr.left < br.left - 1.5 || tr.right > br.right + 1.5)) {
      clippedButtons.push({
        desc: c.desc,
        textWidth: Math.round(tr.width * 10) / 10,
        buttonWidth: Math.round(br.width * 10) / 10,
        rect: c.rect,
      });
    }
  }

  // 7. Cinema VO subtitle pill (#captions-hud) visual overlap & shrink-to-fit check
  const captionOverlaps = [];
  let narrowCaption = null;
  const capHud = document.getElementById('captions-hud');
  if (capHud && isVisible(capHud)) {
    const cr = roundRect(capHud.getBoundingClientRect());
    for (const c of fgControls) {
      const ox = Math.min(cr.right, c.rect.right) - Math.max(cr.left, c.rect.left);
      const oy = Math.min(cr.bottom, c.rect.bottom) - Math.max(cr.top, c.rect.top);
      if (ox > 4.0 && oy > 4.0) {
        captionOverlaps.push({
          target: c.desc,
          ox: Math.round(ox * 10) / 10,
          oy: Math.round(oy * 10) / 10,
          captionRect: cr,
          targetRect: c.rect,
        });
      }
    }
    const endCode = document.querySelector('#ending-view .ending-code-tag');
    if (endCode && isVisible(endCode)) {
      const er = roundRect(endCode.getBoundingClientRect());
      const ox = Math.min(cr.right, er.right) - Math.max(cr.left, er.left);
      const oy = Math.min(cr.bottom, er.bottom) - Math.max(cr.top, er.top);
      if (ox > 4.0 && oy > 4.0) {
        captionOverlaps.push({
          target: '.ending-code-tag',
          ox: Math.round(ox * 10) / 10,
          oy: Math.round(oy * 10) / 10,
          captionRect: cr,
          targetRect: er,
        });
      }
    }
    const capTextEl = capHud.querySelector('.vo-caption-text');
    if (capTextEl && (capTextEl.textContent || '').trim().length > 12) {
      const tr = roundRect(capTextEl.getBoundingClientRect());
      if (tr.width < 110) {
        narrowCaption = {
          textWidth: tr.width,
          captionRect: cr,
          sample: (capTextEl.textContent || '').trim().slice(0, 32),
        };
      }
    }
  }

  // 8. Take Card narration vertical truncation check (.script-body-narration scrollHeight <= clientHeight + 2)
  let narrationClipped = null;
  const narrEl = document.querySelector('#take-card-narration, .script-body-narration');
  if (narrEl && isVisible(narrEl)) {
    const sh = narrEl.scrollHeight;
    const ch = narrEl.clientHeight;
    if (ch > 0 && sh > ch + 2) {
      narrationClipped = {
        scrollHeight: sh,
        clientHeight: ch,
        rect: roundRect(narrEl.getBoundingClientRect()),
      };
    }
  }

  // 9. Cutscene Polaroid vs Speaker Ribbon overlap check (.dialogue-polaroid ∩ .dialogue-speaker-ribbon == 0)
  let polaroidRibbonOverlap = null;
  const dlgPol = document.querySelector('#dialogue-layer .dialogue-polaroid');
  const dlgRib = document.querySelector('#dialogue-layer .dialogue-speaker-ribbon');
  if (dlgPol && dlgRib && isVisible(dlgPol) && isVisible(dlgRib)) {
    const pr = roundRect(dlgPol.getBoundingClientRect());
    const rr = roundRect(dlgRib.getBoundingClientRect());
    const ox = Math.min(pr.right, rr.right) - Math.max(pr.left, rr.left);
    const oy = Math.min(pr.bottom, rr.bottom) - Math.max(pr.top, rr.top);
    if (ox > 2.5 && oy > 2.5) {
      polaroidRibbonOverlap = {
        ox: Math.round(ox * 10) / 10,
        oy: Math.round(oy * 10) / 10,
        polaroidRect: pr,
        ribbonRect: rr,
      };
    }
  }

  return {
    screen: screenName,
    vw,
    vh,
    docScrollWidth,
    docScrollHeight,
    scrollOverflow,
    controlCount: fgControls.length,
    overlaps,
    outOfBounds,
    clippedButtons,
    captionOverlaps,
    narrowCaption,
    narrationClipped,
    polaroidRibbonOverlap,
    primaryCtaOk,
    primaryCtaDetail,
  };
})
"""


def _run_g9_english_sweep(b: Browser) -> dict[str, Any]:
  failures: list[str] = []

  sweep = b.eval(
      r"""((scanFn) => {
        const H = window.__HALLOWEEN__;
        const cjkRe = /[\u4e00-\u9fff]/g;
        const results = [];

        // Check static getLevels() data first
        const lvJson = JSON.stringify(H.getLevels ? H.getLevels() : {});
        const lvCjk = lvJson.match(cjkRe) || [];

        // 1. Title screen
        results.push(scanFn('title'));

        // 2. All 5 Acts: every cutscene line + blocking (both tabs) + all 4 takes per Act
        const actMatrix = {
          1: { actors: ['last_rite', 'camille'], props: ['sarkaz_mask', 'roast_steak'] },
          2: { actors: ['last_rite', 'chen_qianyu'], props: ['pop_loong', 'lankybeast'] },
          3: { actors: ['last_rite', 'rossi'], props: ['one_handed_sword', 'lollipop'] },
          4: { actors: ['last_rite', 'mi_fu'], props: ['candy_chest', 'fireworks'] },
          5: { actors: ['last_rite', 'ardashir'], props: ['sarkaz_mask', 'suppressor'] },
        };

        for (let actId = 1; actId <= 5; actId++) {
          H.startLevel({ act: actId, seed: 20261031, skipDialogue: false, resetMoods: actId === 1 });
          H.stepFrames(65);
          let guard = 0;
          while (H.getState().phase === 'dialogue' && guard < 12) {
            results.push(scanFn(`act${actId}_dlg_${guard}`));
            H.act('advanceDialogue');
            H.stepFrames(10);
            guard++;
          }
          if (H.getState().phase !== 'blocking') {
            H.act('skipDialogue');
            H.stepFrames(25);
          }
          results.push(scanFn(`act${actId}_blocking`));

          const spec = actMatrix[actId];
          let pIdx = 0;
          for (const actorId of spec.actors) {
            for (const propId of spec.props) {
              H.act('cast', { actorId, propId });
              H.stepFrames(10);
              H.act('rollCamera');
              H.stepFrames(220);
              results.push(scanFn(`take_${actId}_${pIdx + 1}`));
              if (pIdx < 3) {
                H.act('reshoot');
                H.stepFrames(35);
              }
              pIdx++;
            }
          }
        }

        // 3. All 5 Endings (renders all 5 ending Polaroid canvases too!)
        for (const eid of ['END1', 'END2', 'END3', 'END4', 'END5']) {
          H.startLevel({ act: 1, seed: 20261031, skipDialogue: true, resetMoods: true });
          H.stepFrames(30);
          H.solveCurrentLevel(eid);
          H.stepFrames(50);
          results.push(scanFn(`ending_${eid}`));
        }

        // 4. Film Album, Event Rewards, Guide & Dialogue Log modals
        for (const modal of ['album', 'rewards', 'guide', 'dialogue_log']) {
          H.act('openModal', { modal });
          H.stepFrames(20);
          results.push(scanFn(`modal_${modal}`));
          H.act('closeModal');
          H.stepFrames(10);
        }

        return {
          levelsDataCjkCount: lvCjk.length,
          statesChecked: results.length,
          violations: results.filter((r) => (
            r.lang !== 'en' ||
            r.stateHanziCount !== 0 ||
            r.domCjkCount !== 0 ||
            r.attrCjk.length > 0 ||
            r.canvasCjkCount !== 0
          )),
          totalCanvasStringsScanned: (window.__qaProbe && window.__qaProbe.canvasTexts)
            ? window.__qaProbe.canvasTexts.length
            : 0,
        };
      })(%s)""" % SCAN_HANZI_SNAPSHOT_JS,
      await_promise=True,
  )

  if sweep.get('levelsDataCjkCount', 0) != 0:
    failures.append(f'@levels: Found {sweep["levelsDataCjkCount"]} CJK chars in getLevels() data')

  for v in sweep.get('violations', [])[:6]:
    if v.get('lang') != 'en':
      failures.append(f'@core: document.documentElement.lang={v.get("lang")!r} on {v["label"]} (expected "en")')
    if v.get('stateHanziCount') != 0:
      failures.append(f'@core/@ui-hud: state.hanziCount={v.get("stateHanziCount")} on {v["label"]}')
    if v.get('domCjkCount') != 0 or v.get('attrCjk'):
      failures.append(
          f'@ui-hud/@levels: Found CJK in DOM on {v["label"]}: sample={v.get("domCjkSample")!r}, attrs={v.get("attrCjk")}'
      )
    if v.get('canvasCjkCount') != 0:
      failures.append(
          f'@world-render: Found CJK drawn onto <canvas> on {v["label"]}: {v.get("canvasCjkSample")}'
      )

  passed = len(failures) == 0
  summary = (
      f'PASS (lang="en", hanziCount=0 across {sweep.get("statesChecked")} screens/states & '
      f'{sweep.get("totalCanvasStringsScanned")} canvas text draws)'
      if passed
      else f'FAIL ({"; ".join(failures[:2])})'
  )
  return make_gate_result(
      'G9',
      '100% English Localization (Zero Hanzi)',
      passed,
      summary,
      sweep,
      failures,
  )


def _set_viewport(b: Browser, width: int, height: int, mobile: bool) -> None:
  b.cmd(
      'Emulation.setDeviceMetricsOverride',
      width=width,
      height=height,
      deviceScaleFactor=1,
      mobile=mobile,
  )
  if mobile:
    b.cmd('Emulation.setTouchEmulationEnabled', enabled=True, maxTouchPoints=5)
  else:
    b.cmd('Emulation.setTouchEmulationEnabled', enabled=False)
  b.eval(
      r"""new Promise((resolve) => {
        window.dispatchEvent(new Event('resize'));
        requestAnimationFrame(() => requestAnimationFrame(resolve));
      })""",
      await_promise=True,
  )


def _prepare_screen(b: Browser, screen: str) -> None:
  if screen == 'title':
    b.goto('index.html', timeout=15)
    b.eval('new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))', await_promise=True)
  elif screen == 'dialogue':
    b.eval(
        r"""(() => {
          const H = window.__HALLOWEEN__;
          H.startLevel({ act: 1, seed: 20261031, skipDialogue: false, resetMoods: true });
          H.stepFrames(65);
        })()""",
        await_promise=False,
    )
  elif screen == 'blocking_act1':
    b.eval(
        r"""(() => {
          const H = window.__HALLOWEEN__;
          H.startLevel({ act: 1, seed: 20261031, skipDialogue: true, resetMoods: true });
          H.stepFrames(60);
          if (H.getState().phase === 'dialogue') { H.act('skipDialogue'); H.stepFrames(25); }
          H.act('cast', { actorId: 'last_rite', propId: 'sarkaz_mask' });
          H.stepFrames(20);
        })()""",
        await_promise=False,
    )
  elif screen == 'blocking_act4':
    b.eval(
        r"""(() => {
          const H = window.__HALLOWEEN__;
          H.startLevel({ act: 4, seed: 20261031, skipDialogue: true, resetMoods: false });
          H.stepFrames(60);
          if (H.getState().phase === 'dialogue') { H.act('skipDialogue'); H.stepFrames(25); }
          H.act('cast', { actorId: 'mi_fu', propId: 'candy_chest' });
          H.stepFrames(20);
        })()""",
        await_promise=False,
    )
  elif screen == 'take_result':
    b.eval(
        r"""(() => {
          const H = window.__HALLOWEEN__;
          H.startLevel({ act: 1, seed: 20261031, skipDialogue: true, resetMoods: true });
          H.stepFrames(50);
          if (H.getState().phase === 'dialogue') { H.act('skipDialogue'); H.stepFrames(20); }
          H.act('cast', { actorId: 'last_rite', propId: 'sarkaz_mask' });
          H.act('rollCamera');
          H.stepFrames(220);
        })()""",
        await_promise=False,
    )
  elif screen == 'ending':
    b.eval(
        r"""(() => {
          const H = window.__HALLOWEEN__;
          H.startLevel({ act: 1, seed: 20261031, skipDialogue: true, resetMoods: true });
          H.stepFrames(30);
          H.solveCurrentLevel('END1');
          H.stepFrames(60);
        })()""",
        await_promise=False,
    )
  elif screen == 'album':
    b.eval(
        r"""(() => {
          const H = window.__HALLOWEEN__;
          H.act('openModal', { modal: 'album' });
          H.stepFrames(20);
        })()""",
        await_promise=False,
    )
  elif screen == 'rewards':
    b.eval(
        r"""(() => {
          const H = window.__HALLOWEEN__;
          H.act('closeModal');
          H.act('openModal', { modal: 'rewards' });
          H.stepFrames(20);
        })()""",
        await_promise=False,
    )
  b.eval('new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))', await_promise=True)


SCREEN_SPECS = [
    ('title', r'start\s*filming'),
    ('dialogue', r'skip|next'),
    ('blocking_act1', r'roll\s*camera'),
    ('blocking_act4', r'roll\s*camera'),
    ('take_result', r'next\s*act|reshoot'),
    ('ending', r'play\s*again|film\s*again'),
    ('album', r'close|×|✕|back'),
    ('rewards', r'close|×|✕|back|claim'),
]


def _run_g13_responsive_viewports(b: Browser, save_shots: bool = True) -> dict[str, Any]:
  failures: list[str] = []
  audits: list[dict[str, Any]] = []
  saved_shots: list[str] = []

  for width, height, mobile, vp_label in VIEWPORTS:
    _set_viewport(b, width, height, mobile)
    for screen_name, cta_regex in SCREEN_SPECS:
      _prepare_screen(b, screen_name)
      # Re-ensure viewport override sticks across full navigation on 'title'
      if screen_name == 'title':
        _set_viewport(b, width, height, mobile)

      audit = b.eval(
          f'({AUDIT_VIEWPORT_SCREEN_JS})({json.dumps(screen_name)}, {json.dumps(cta_regex)})',
          await_promise=False,
      )
      audit['viewport'] = vp_label
      audits.append(audit)

      if save_shots and screen_name in ('title', 'dialogue', 'blocking_act1', 'take_result', 'ending', 'album', 'rewards'):
        shot_path = os.path.join(QA_DIR, f'layout_{vp_label}_{screen_name}.jpg')
        b.screenshot(shot_path, quality=82)
        saved_shots.append(shot_path)

      if audit.get('scrollOverflow'):
        failures.append(
            f'@ui-hud: Scroll overflow at {vp_label} [{screen_name}]: '
            f'docScroll={audit["docScrollWidth"]}x{audit["docScrollHeight"]} > viewport={audit["vw"]}x{audit["vh"]}'
        )
      if audit.get('overlaps'):
        ov = audit['overlaps'][0]
        failures.append(
            f'@ui-hud: Overlapping buttons at {vp_label} [{screen_name}]: '
            f'{ov["a"]} overlaps {ov["b"]} by {ov["ox"]}x{ov["oy"]} px'
        )
      if audit.get('outOfBounds'):
        oob = audit['outOfBounds'][0]
        failures.append(
            f'@ui-hud: Control out of viewport at {vp_label} [{screen_name}]: '
            f'{oob["desc"]} rect={oob["rect"]} vs {audit["vw"]}x{audit["vh"]}'
        )
      if not audit.get('primaryCtaOk'):
        failures.append(
            f'@ui-hud: Primary CTA missing/out-of-bounds/occluded at {vp_label} [{screen_name}]: '
            f'{audit.get("primaryCtaDetail")}'
        )
      if audit.get('clippedButtons'):
        cb = audit['clippedButtons'][0]
        failures.append(
            f'@ui-hud: Button label overflows pill at {vp_label} [{screen_name}]: '
            f'{cb["desc"]} textWidth={cb["textWidth"]}px > buttonWidth={cb["buttonWidth"]}px'
        )
      if audit.get('captionOverlaps'):
        co = audit['captionOverlaps'][0]
        failures.append(
            f'@ui-hud: #captions-hud visually overlaps {co["target"]} at {vp_label} [{screen_name}] '
            f'by {co["ox"]}x{co["oy"]} px'
        )
      if audit.get('narrowCaption'):
        nc = audit['narrowCaption']
        failures.append(
            f'@ui-hud: #captions-hud text squeezed to {nc["textWidth"]}px wide at {vp_label} [{screen_name}] '
            f'(captionRect={nc["captionRect"]})'
        )
      if audit.get('narrationClipped'):
        ncp = audit['narrationClipped']
        failures.append(
            f'@ui-hud: Take narration clipped vertically at {vp_label} [{screen_name}]: '
            f'scrollHeight={ncp["scrollHeight"]} > clientHeight={ncp["clientHeight"]}'
        )
      if audit.get('polaroidRibbonOverlap'):
        pro = audit['polaroidRibbonOverlap']
        failures.append(
            f'@ui-hud: .dialogue-polaroid overlaps .dialogue-speaker-ribbon at {vp_label} [{screen_name}] '
            f'by {pro["ox"]}x{pro["oy"]} px'
        )

  passed = len(failures) == 0
  summary = (
      f'PASS ({len(VIEWPORTS)}/{len(VIEWPORTS)} viewports x {len(SCREEN_SPECS)} screens: 0 scrollbars, 0 button/HUD overlaps, '
      f'0 clipped text/buttons, all primary CTAs in-bounds; {len(saved_shots)} shots saved)'
      if passed
      else f'FAIL ({"; ".join(failures[:2])})'
  )
  return make_gate_result(
      'G13',
      '4-Viewport Responsive Layout',
      passed,
      summary,
      {'checksCount': len(audits), 'screenshots': saved_shots, 'audits': audits},
      failures,
  )


def run_layout_and_english(save_shots: bool = True) -> dict[str, dict[str, Any]]:
  ensure_qa_dir()
  index_path = os.path.join(ROOT, 'index.html')
  if not os.path.exists(index_path):
    msg = '@core/@ui-hud: index.html does not exist yet'
    return {
        'G9': make_gate_result('G9', '100% English Localization (Zero Hanzi)', False, msg, {}, [msg]),
        'G13': make_gate_result('G13', '4-Viewport Responsive Layout', False, msg, {}, [msg]),
    }

  with Browser(width=1280, height=800, root=ROOT, mobile=False, allow_autoplay=True) as b:
    install_page_probes(b)
    if not b.goto('index.html', timeout=15):
      errs = flatten_errors(collect_runtime_errors(b))
      msg = f'@core: Failed to boot index.html ({errs[:3]})'
      return {
          'G9': make_gate_result('G9', '100% English Localization (Zero Hanzi)', False, msg, {}, [msg]),
          'G13': make_gate_result('G13', '4-Viewport Responsive Layout', False, msg, {}, [msg]),
      }

    g9 = _run_g9_english_sweep(b)
    g13 = _run_g13_responsive_viewports(b, save_shots=save_shots)

  return {'G9': g9, 'G13': g13}


def main() -> int:
  ap = argparse.ArgumentParser(description='Gates G9 & G13 English localization & 4-viewport layout runner')
  ap.add_argument('--no-shots', action='store_true', help='Skip saving JPEG screenshots')
  args = ap.parse_args()

  results = run_layout_and_english(save_shots=not args.no_shots)
  out_json = os.path.join(ensure_qa_dir(), 'layout_and_english_results.json')
  with open(out_json, 'w', encoding='utf-8') as f:
    json.dump(results, f, indent=2)

  all_ok = True
  for gid in ('G9', 'G13'):
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
