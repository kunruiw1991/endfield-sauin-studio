// Shareable 1280x720 Sauin Film Studio Postcard Compositor (exportPostcardDataURL)
// Composites live WebGL 3D stage take OR 960x540 Ending Polaroid into a crisp 35mm souvenir card.
// 100% English-only (hanziCount === 0).

import { getEndingCanvas } from './ending_illustrations.js';
import { getPortraitCanvas } from './chibi_atlas.js';

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w * 0.5, h * 0.5);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function clampLineWithEllipsis(ctx, text, maxWidth) {
  const raw = String(text || '').trim();
  if (ctx.measureText(raw).width <= maxWidth) return raw;
  let cut = raw;
  while (cut.length > 1 && ctx.measureText(`${cut}...`).width > maxWidth) {
    cut = cut.slice(0, -1).trimEnd();
  }
  return `${cut}...`;
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 8) {
  const words = String(text || '').trim().split(/\s+/).filter(Boolean);
  let line = '';
  let linesDrawn = 0;
  for (let i = 0; i < words.length; i++) {
    const test = line ? `${line} ${words[i]}` : words[i];
    if (ctx.measureText(test).width > maxWidth && line) {
      if (linesDrawn >= maxLines - 1) {
        const rest = `${line} ${words.slice(i).join(' ')}`;
        ctx.fillText(clampLineWithEllipsis(ctx, rest, maxWidth), x, y + linesDrawn * lineHeight);
        return linesDrawn + 1;
      }
      ctx.fillText(line, x, y + linesDrawn * lineHeight);
      linesDrawn++;
      line = words[i];
    } else {
      line = test;
    }
  }
  if (line && linesDrawn < maxLines) {
    ctx.fillText(clampLineWithEllipsis(ctx, line, maxWidth), x, y + linesDrawn * lineHeight);
    linesDrawn++;
  }
  return linesDrawn;
}

function drawFittedBannerTitle(ctx, titleText, x, y, maxWidth) {
  const clean = String(titleText || '').trim();
  for (const px of [20, 18.5, 17, 15.5, 14, 13]) {
    ctx.font = `800 ${px}px Georgia, serif`;
    if (ctx.measureText(clean).width <= maxWidth) {
      ctx.fillText(clean, x, y);
      return;
    }
  }
  ctx.font = '800 13.5px Georgia, serif';
  wrapText(ctx, clean, x, y - 9, maxWidth, 16, 2);
}

function computeAspectSafeStageCrop(glCanvas, destAspect) {
  const gw = glCanvas.width;
  const gh = glCanvas.height;
  // Default: centered cover-crop of full WebGL canvas preserving destAspect (zero horizontal/vertical squash!)
  let cx = gw * 0.5;
  let cy = gh * 0.47;
  let baseW = gw;
  let baseH = gh;

  if (typeof document !== 'undefined') {
    const winEl = document.getElementById('stage-viewfinder-window');
    const cRect = glCanvas.getBoundingClientRect?.();
    if (winEl && !winEl.hidden && cRect && cRect.width > 20 && cRect.height > 20) {
      const wRect = winEl.getBoundingClientRect();
      if (wRect.width > 40 && wRect.height > 40) {
        const sx = gw / cRect.width;
        const sy = gh / cRect.height;
        const wx = (wRect.left - cRect.left) * sx;
        const wy = (wRect.top - cRect.top) * sy;
        const ww = wRect.width * sx;
        const wh = wRect.height * sy;
        cx = wx + ww * 0.5;
        cy = wy + wh * 0.52;
        baseW = ww;
        baseH = wh;
      }
    }
  }

  // Fit a crop rectangle of exact destAspect inside/around (baseW x baseH) clamped to glCanvas
  let sw = baseW;
  let sh = sw / destAspect;
  if (sh > baseH * 1.08) {
    sh = Math.min(gh, baseH * 1.08);
    sw = sh * destAspect;
  }
  if (sw > gw) {
    sw = gw;
    sh = sw / destAspect;
  }
  if (sh > gh) {
    sh = gh;
    sw = sh * destAspect;
  }
  sw = Math.max(1, sw);
  sh = Math.max(1, sh);
  const sx = Math.max(0, Math.min(gw - sw, cx - sw * 0.5));
  const sy = Math.max(0, Math.min(gh - sh, cy - sh * 0.5));
  return { sx, sy, sw, sh };
}

export function composePostcardDataURL({
  ctx: gameCtx,
  renderer,
  renderNow,
  renderPostcardStage,
}) {
  const out = document.createElement('canvas');
  out.width = 1280;
  out.height = 720;
  const c = out.getContext('2d');

  // Deep crimson velvet & teal theater postcard background
  const bg = c.createLinearGradient(0, 0, 1280, 720);
  bg.addColorStop(0, '#1e0b14');
  bg.addColorStop(0.5, '#3b1220');
  bg.addColorStop(1, '#122628');
  c.fillStyle = bg;
  c.fillRect(0, 0, 1280, 720);

  // Gold filigree outer border
  roundRect(c, 22, 22, 1236, 676, 18);
  c.strokeStyle = '#d4aa63';
  c.lineWidth = 3;
  c.stroke();

  // Ivory 35mm perforated Polaroid frame on left (780x540)
  const fx = 52;
  const fy = 92;
  const fw = 780;
  const fh = 540;
  roundRect(c, fx, fy, fw, fh, 12);
  c.fillStyle = '#f3e9d2';
  c.fill();
  c.lineWidth = 4;
  c.strokeStyle = '#5c4328';
  c.stroke();

  // 35mm film perforations top & bottom
  c.fillStyle = '#2b211c';
  for (let px = fx + 24; px < fx + fw - 28; px += 46) {
    roundRect(c, px, fy + 12, 26, 16, 4);
    c.fill();
    roundRect(c, px, fy + fh - 28, 26, 16, 4);
    c.fill();
  }

  // Inner image viewport (740x448)
  const ix = fx + 20;
  const iy = fy + 46;
  const iw = fw - 40;
  const ih = fh - 92;

  const state = gameCtx?.state || {};
  const isEnding = state.phase === 'ending' && state.currentEnding;

  c.save();
  roundRect(c, ix, iy, iw, ih, 6);
  c.clip();

  if (isEnding) {
    const endCanvas = getEndingCanvas(state.currentEnding.endingId || 'END1');
    c.drawImage(endCanvas, ix, iy, iw, ih);
  } else if (typeof renderPostcardStage === 'function') {
    renderPostcardStage(c, ix, iy, iw, ih);
  } else if (renderer && renderer.domElement) {
    if (typeof renderNow === 'function') {
      renderNow();
    }
    const glCanvas = renderer.domElement;
    if (glCanvas.width > 0 && glCanvas.height > 0) {
      const { sx, sy, sw, sh } = computeAspectSafeStageCrop(glCanvas, iw / ih);
      c.drawImage(glCanvas, sx, sy, sw, sh, ix, iy, iw, ih);
    }
  }
  c.restore();

  // Header Crest Text
  c.fillStyle = '#ffe8b8';
  c.font = '800 24px Georgia, serif';
  c.fillText('NEW ERA FOR THE MYRIAD SOULS  ·  SAUIN FILM STUDIO', 54, 64);

  // Right Script & Mood Summary Card
  const rx = 862;
  const ry = 92;
  const rw = 366;
  const rh = 540;
  roundRect(c, rx, ry, rw, rh, 14);
  c.fillStyle = '#f5ecd8';
  c.fill();
  c.lineWidth = 4;
  c.strokeStyle = '#6b4c30';
  c.stroke();

  // Header banner inside right card
  roundRect(c, rx + 18, ry + 16, rw - 36, 78, 8);
  c.fillStyle = '#6e1d2a';
  c.fill();

  const subtitle = isEnding
    ? state.currentEnding.code || '//END1'
    : `ACT ${state.actId || 1} OF 5 · DIRECTOR'S CUT`;
  const mainTitle = isEnding
    ? state.currentEnding.title || 'Strange Sauin'
    : state.currentTake?.title || 'Sauin Promo Shoot';
  const bodyCopy = isEnding
    ? state.currentEnding.bodyText || ''
    : state.currentTake?.scriptText ||
      'Lights, camera, action! A festive Sauin memory captured on Talos-II.';

  c.fillStyle = '#ffd89b';
  c.font = '700 13px system-ui, sans-serif';
  c.fillText(subtitle.toUpperCase(), rx + 30, ry + 40);

  c.fillStyle = '#ffffff';
  drawFittedBannerTitle(c, mainTitle, rx + 30, ry + 72, rw - 60);

  // Story text (fits full 8-line ending narratives inside card with zero right-edge overflow)
  c.fillStyle = '#2d221c';
  c.font = '500 14.5px system-ui, sans-serif';
  wrapText(c, bodyCopy, rx + 26, ry + 120, rw - 52, 20.5, 8);

  // Cast / Prop cameo stamps
  const actorId = state.currentTake?.actorId || state.slots?.actorId || 'last_rite';
  const propId = state.currentTake?.propId || state.slots?.propId || 'sarkaz_mask';
  c.drawImage(getPortraitCanvas(actorId, 'happy'), rx + 50, ry + 304, 108, 108);
  c.drawImage(getPortraitCanvas(propId, 'neutral'), rx + 208, ry + 304, 108, 108);

  // Mood Meter Bar Summary
  const moods = state.currentEnding?.totals || state.moods || { love: 0, joy: 0, wonder: 0, chaos: 0 };
  const moodBadges = [
    ['LOVE', Math.min(8, Number(moods.love) || 0), '#e64980'],
    ['JOY', Math.min(8, Number(moods.joy) || 0), '#f59f00'],
    ['WONDER', Math.min(8, Number(moods.wonder) || 0), '#339af0'],
    ['CHAOS', Math.min(8, Number(moods.chaos) || 0), '#7950f2'],
  ];
  moodBadges.forEach(([label, val, col], idx) => {
    const bx = rx + 22 + idx * 82;
    const by = ry + 428;
    roundRect(c, bx, by, 74, 58, 8);
    c.fillStyle = '#fff9ee';
    c.fill();
    c.lineWidth = 2.5;
    c.strokeStyle = col;
    c.stroke();

    c.fillStyle = col;
    c.font = '800 11px system-ui, sans-serif';
    c.textAlign = 'center';
    c.fillText(label, bx + 37, by + 20);
    c.fillStyle = '#1f1916';
    c.font = '900 20px system-ui, sans-serif';
    c.fillText(String(val), bx + 37, by + 46);
    c.textAlign = 'left';
  });

  c.fillStyle = '#7a5c42';
  c.font = '600 11px system-ui, sans-serif';
  c.textAlign = 'center';
  c.fillText('ARKNIGHTS: ENDFIELD · ALL SOULS FESTIVAL SOUVENIR', rx + rw * 0.5, ry + 514);
  c.textAlign = 'left';

  return out.toDataURL('image/png');
}
