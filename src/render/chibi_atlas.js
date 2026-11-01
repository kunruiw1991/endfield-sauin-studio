// Bespoke High-DPI (512x512) Endfield Sauin Chibi Theater Illustrator & Texture Atlas
// Zero external image dependencies, 100% English-safe, cached Canvas & THREE.CanvasTexture pool.

export const CHIBI_IDS = [
  'last_rite',
  'camille',
  'chen_qianyu',
  'rossi',
  'mi_fu',
  'yvonne',
  'ardashir',
  'mysterious_sarkaz',
  'sarkaz_director',
  'injured_landbreaker',
];

export const PROP_IDS = [
  'sarkaz_mask',
  'roast_steak',
  'pop_loong',
  'lankybeast',
  'one_handed_sword',
  'lollipop',
  'candy_chest',
  'fireworks',
  'suppressor',
];

export const MOOD_EXPRESSIONS = [
  'neutral',
  'flustered',
  'happy',
  'deadpan',
  'shocked',
  'wink',
];

const _standeeCanvasCache = new Map();
const _standeeUrlCache = new Map();
const _portraitCanvasCache = new Map();
const _portraitUrlCache = new Map();
const _takeThumbUrlCache = new Map();
const _threeTextureCache = new Map();

const INK = '#19161d';

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function roundRectPath(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w * 0.5, h * 0.5);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function fillStroke(ctx, fillStyle, strokeStyle = INK, lineWidth = 5.5) {
  if (fillStyle) {
    ctx.fillStyle = fillStyle;
    ctx.fill();
  }
  if (strokeStyle && lineWidth > 0) {
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = strokeStyle;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();
  }
}

function drawStarSparkle(ctx, cx, cy, rOuter, rInner, color = '#fff5c0', stroke = null) {
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    const r = i % 2 === 0 ? rOuter : rInner;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 3;
    ctx.stroke();
  }
  ctx.restore();
}

// Applies a crisp white paper-cutout die-cut sticker border around any drawn silhouette!
function finalizePaperCutout(rawCanvas, borderPx = 11) {
  const w = rawCanvas.width;
  const h = rawCanvas.height;
  const out = makeCanvas(w, h);
  const ctx = out.getContext('2d');

  // Create white silhouette stamp of rawCanvas
  const sil = makeCanvas(w, h);
  const sctx = sil.getContext('2d');
  sctx.drawImage(rawCanvas, 0, 0);
  sctx.globalCompositeOperation = 'source-in';
  sctx.fillStyle = '#fff9ee';
  sctx.fillRect(0, 0, w, h);

  // Soft stage drop shadow
  ctx.save();
  ctx.shadowColor = 'rgba(12, 8, 18, 0.52)';
  ctx.shadowBlur = 14;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 7;

  const steps = 16;
  for (let i = 0; i < steps; i++) {
    const ang = (i / steps) * Math.PI * 2;
    ctx.drawImage(sil, Math.cos(ang) * borderPx, Math.sin(ang) * borderPx);
  }
  ctx.restore();

  // Second pass without shadow so sticker rim is opaque cream-white + subtle warm edge
  const innerRim = Math.max(2, borderPx - 2.5);
  for (let i = 0; i < steps; i++) {
    const ang = (i / steps) * Math.PI * 2;
    ctx.drawImage(sil, Math.cos(ang) * innerRim, Math.sin(ang) * innerRim);
  }

  // Original crisp inked artwork on top
  ctx.drawImage(rawCanvas, 0, 0);
  return out;
}

// Shared anime chibi head & face helper
function drawChibiHeadBase(ctx, cx, cy, rx, ry, skinColor = '#ffefe2', earType = 'pointed') {
  ctx.save();
  // Side pointed Sarkaz/elf ears if requested
  if (earType === 'pointed') {
    for (const dir of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(cx + dir * (rx - 6), cy - 4);
      ctx.quadraticCurveTo(cx + dir * (rx + 28), cy + 2, cx + dir * (rx + 32), cy + 12);
      ctx.quadraticCurveTo(cx + dir * (rx + 12), cy + 22, cx + dir * (rx - 8), cy + 18);
      ctx.closePath();
      fillStroke(ctx, skinColor, INK, 5);
      // Inner ear blush
      ctx.beginPath();
      ctx.moveTo(cx + dir * (rx + 2), cy + 5);
      ctx.lineTo(cx + dir * (rx + 20), cy + 10);
      ctx.strokeStyle = '#f2a7a0';
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  }

  // Face oval with cute chibi cheeks
  ctx.beginPath();
  ctx.moveTo(cx, cy - ry);
  ctx.bezierCurveTo(cx + rx * 0.95, cy - ry, cx + rx * 1.06, cy + ry * 0.15, cx + rx * 0.88, cy + ry * 0.68);
  ctx.bezierCurveTo(cx + rx * 0.55, cy + ry * 1.02, cx - rx * 0.55, cy + ry * 1.02, cx - rx * 0.88, cy + ry * 0.68);
  ctx.bezierCurveTo(cx - rx * 1.06, cy + ry * 0.15, cx - rx * 0.95, cy - ry, cx, cy - ry);
  ctx.closePath();
  fillStroke(ctx, skinColor, INK, 5.5);

  // Warm cheek blush ovals
  ctx.fillStyle = 'rgba(255, 128, 138, 0.42)';
  ctx.beginPath();
  ctx.ellipse(cx - rx * 0.52, cy + ry * 0.34, 17, 9, -0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + rx * 0.52, cy + ry * 0.34, 17, 9, 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawAnimeEye(ctx, x, y, w, h, topCol, botCol, style = 'open', pupilSlit = false) {
  ctx.save();
  if (style === 'wink' || style === 'laugh') {
    ctx.beginPath();
    if (style === 'wink') {
      ctx.moveTo(x - w * 0.55, y - 4);
      ctx.lineTo(x + w * 0.35, y + 3);
      ctx.lineTo(x - w * 0.5, y + 10);
    } else {
      ctx.arc(x, y + 6, w * 0.52, Math.PI * 1.12, Math.PI * 1.88);
    }
    ctx.strokeStyle = INK;
    ctx.lineWidth = 5.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();
    return;
  }

  const eh = style === 'deadpan' ? h * 0.68 : style === 'shocked' ? h * 1.08 : h;
  // Sclera
  roundRectPath(ctx, x - w * 0.5, y - eh * 0.5, w, eh, w * 0.42);
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  // Iris gradient
  ctx.save();
  ctx.clip();
  const iw = style === 'shocked' ? w * 0.68 : w * 0.84;
  const ih = style === 'shocked' ? eh * 0.72 : eh * 0.92;
  const grad = ctx.createLinearGradient(x, y - ih * 0.5, x, y + ih * 0.5);
  grad.addColorStop(0, topCol);
  grad.addColorStop(1, botCol);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(x, y + 2, iw * 0.5, ih * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Dark upper pupil shade
  ctx.fillStyle = 'rgba(20, 14, 30, 0.55)';
  ctx.beginPath();
  if (pupilSlit) {
    ctx.ellipse(x, y + 2, iw * 0.14, ih * 0.36, 0, 0, Math.PI * 2);
  } else {
    ctx.ellipse(x, y - 1, iw * 0.28, ih * 0.28, 0, 0, Math.PI * 2);
  }
  ctx.fill();

  // Deadpan heavy upper eyelid
  if (style === 'deadpan') {
    ctx.fillStyle = '#ffe9dc';
    ctx.fillRect(x - w * 0.6, y - eh * 0.6, w * 1.2, eh * 0.36);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.moveTo(x - w * 0.55, y - eh * 0.24);
    ctx.lineTo(x + w * 0.55, y - eh * 0.24);
    ctx.stroke();
  }

  // Glossy white catchlights
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(x - iw * 0.2, y - ih * 0.2, iw * 0.17, ih * 0.15, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + iw * 0.2, y + ih * 0.2, iw * 0.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Thick upper eyelash arch
  ctx.strokeStyle = INK;
  ctx.lineWidth = 6.2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (style === 'deadpan') {
    ctx.moveTo(x - w * 0.56, y - eh * 0.22);
    ctx.lineTo(x + w * 0.56, y - eh * 0.22);
  } else {
    ctx.moveTo(x - w * 0.55, y - eh * 0.15);
    ctx.quadraticCurveTo(x, y - eh * 0.66, x + w * 0.55, y - eh * 0.12);
  }
  ctx.stroke();
  ctx.restore();
}

function drawMouthAndMoodFX(ctx, cx, cy, mood, opts = {}) {
  ctx.save();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4.2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const my = cy + 36;
  if (mood === 'happy') {
    ctx.beginPath();
    ctx.moveTo(cx - 13, my - 3);
    ctx.quadraticCurveTo(cx, my + 15, cx + 13, my - 3);
    ctx.closePath();
    ctx.fillStyle = '#e85d75';
    ctx.fill();
    ctx.stroke();
    if (opts.fang) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(cx + 4, my - 2);
      ctx.lineTo(cx + 8, my + 5);
      ctx.lineTo(cx + 11, my - 2);
      ctx.fill();
    }
  } else if (mood === 'flustered') {
    // Wavy shy mouth + extra blush slashes + sweat drop
    ctx.beginPath();
    ctx.moveTo(cx - 12, my + 2);
    ctx.quadraticCurveTo(cx - 6, my - 4, cx, my + 2);
    ctx.quadraticCurveTo(cx + 6, my + 7, cx + 12, my + 1);
    ctx.stroke();
    // Blush hashes
    ctx.strokeStyle = '#ff5c77';
    ctx.lineWidth = 2.8;
    for (const dir of [-1, 1]) {
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(cx + dir * 42 + i * 6, cy + 20);
        ctx.lineTo(cx + dir * 39 + i * 6, cy + 28);
        ctx.stroke();
      }
    }
    // Sweat drop
    drawSweatDrop(ctx, cx + 62, cy - 18);
  } else if (mood === 'shocked') {
    ctx.beginPath();
    ctx.ellipse(cx, my + 2, 8, 11, 0, 0, Math.PI * 2);
    fillStroke(ctx, '#b83b56', INK, 4);
    drawSweatDrop(ctx, cx - 64, cy - 14);
  } else if (mood === 'deadpan') {
    ctx.beginPath();
    ctx.moveTo(cx - 10, my + 2);
    ctx.lineTo(cx + 10, my + 2);
    ctx.stroke();
  } else if (mood === 'wink') {
    // Smug cat/fang grin
    ctx.beginPath();
    ctx.moveTo(cx - 13, my);
    ctx.quadraticCurveTo(cx - 6, my + 8, cx, my + 1);
    ctx.quadraticCurveTo(cx + 6, my + 8, cx + 13, my - 1);
    ctx.stroke();
    if (opts.fang) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(cx + 5, my + 2);
      ctx.lineTo(cx + 9, my + 10);
      ctx.lineTo(cx + 12, my + 2);
      ctx.closePath();
      fillStroke(ctx, '#ffffff', INK, 2.5);
    }
  } else {
    // Gentle smile or smirk
    ctx.beginPath();
    if (opts.smirk) {
      ctx.moveTo(cx - 8, my + 2);
      ctx.quadraticCurveTo(cx + 3, my + 6, cx + 12, my - 3);
    } else {
      ctx.moveTo(cx - 9, my);
      ctx.quadraticCurveTo(cx, my + 8, cx + 9, my);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function drawSweatDrop(ctx, x, y) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x, y - 14);
  ctx.quadraticCurveTo(x + 11, y + 2, x + 8, y + 10);
  ctx.arc(x, y + 10, 8, 0, Math.PI);
  ctx.quadraticCurveTo(x - 11, y + 2, x, y - 14);
  ctx.closePath();
  fillStroke(ctx, '#8ce0ff', INK, 3.5);
  ctx.restore();
}

// ============================================================================
// 10 CHARACTER STANDEE ILLUSTRATORS (512x512)
// ============================================================================

function drawLastRite(ctx, mood) {
  const cx = 256;
  const hy = 205;

  // Back long cerulean twin-tails cascading behind body
  for (const dir of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(cx + dir * 68, hy - 35);
    ctx.bezierCurveTo(cx + dir * 145, hy + 10, cx + dir * 162, hy + 165, cx + dir * 124, 448);
    ctx.lineTo(cx + dir * 88, 434);
    ctx.lineTo(cx + dir * 74, 452);
    ctx.bezierCurveTo(cx + dir * 92, hy + 150, cx + dir * 78, hy + 45, cx + dir * 48, hy);
    ctx.closePath();
    const hGrad = ctx.createLinearGradient(cx, hy - 40, cx, 455);
    hGrad.addColorStop(0, '#2bb0f0');
    hGrad.addColorStop(0.55, '#1382c4');
    hGrad.addColorStop(1, '#0c5285');
    fillStroke(ctx, hGrad, INK, 6);

    // Hair highlight ribbon streak
    ctx.strokeStyle = '#7ce2ff';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(cx + dir * 86, hy + 15);
    ctx.quadraticCurveTo(cx + dir * 122, hy + 110, cx + dir * 108, 390);
    ctx.stroke();
  }

  // Boots & legs
  for (const dir of [-1, 1]) {
    const lx = cx + dir * 24;
    roundRectPath(ctx, lx - 16, 405, 32, 68, 12);
    fillStroke(ctx, '#1b7ac2', INK, 5.5);
    // White criss-cross boot laces
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(lx - 10, 422);
    ctx.lineTo(lx + 10, 438);
    ctx.moveTo(lx + 10, 422);
    ctx.lineTo(lx - 10, 438);
    ctx.moveTo(lx - 10, 444);
    ctx.lineTo(lx + 10, 458);
    ctx.stroke();
  }

  // Flared white & deep-blue Gothic Frost Striker coat/skirt
  ctx.beginPath();
  ctx.moveTo(cx - 42, 286);
  ctx.lineTo(cx - 112, 425);
  ctx.quadraticCurveTo(cx - 65, 444, cx - 26, 432);
  ctx.lineTo(cx + 26, 432);
  ctx.quadraticCurveTo(cx + 65, 444, cx + 112, 425);
  ctx.lineTo(cx + 42, 286);
  ctx.closePath();
  fillStroke(ctx, '#f2f7fc', INK, 6);

  // Center blue apron panel with white geometric diamond trim
  ctx.beginPath();
  ctx.moveTo(cx - 26, 292);
  ctx.lineTo(cx - 44, 428);
  ctx.quadraticCurveTo(cx, 438, cx + 44, 428);
  ctx.lineTo(cx + 26, 292);
  ctx.closePath();
  fillStroke(ctx, '#167bc2', INK, 5.5);

  ctx.strokeStyle = '#e8f6ff';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(cx, 310);
  ctx.lineTo(cx - 24, 370);
  ctx.lineTo(cx, 418);
  ctx.lineTo(cx + 24, 370);
  ctx.closePath();
  ctx.stroke();

  // Dark upper bodice & collar + glowing cyan soul gem
  ctx.beginPath();
  ctx.moveTo(cx - 38, 282);
  ctx.lineTo(cx - 46, 338);
  ctx.lineTo(cx + 46, 338);
  ctx.lineTo(cx + 38, 282);
  ctx.closePath();
  fillStroke(ctx, '#1e2430', INK, 5.5);

  // Clasped shy hands / sleeves in front
  for (const dir of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(cx + dir * 40, 290);
    ctx.quadraticCurveTo(cx + dir * 72, 335, cx + dir * 20, 358);
    ctx.lineTo(cx + dir * 10, 338);
    ctx.closePath();
    fillStroke(ctx, '#1c6cab', INK, 5);
  }
  ctx.beginPath();
  ctx.arc(cx - 10, 352, 11, 0, Math.PI * 2);
  ctx.arc(cx + 10, 352, 11, 0, Math.PI * 2);
  fillStroke(ctx, '#fff1e6', INK, 4.5);

  // Cyan chest diamond
  ctx.beginPath();
  ctx.moveTo(cx, 292);
  ctx.lineTo(cx - 10, 308);
  ctx.lineTo(cx, 324);
  ctx.lineTo(cx + 10, 308);
  ctx.closePath();
  fillStroke(ctx, '#5ce6ff', INK, 3.5);

  // Back hair dome
  ctx.beginPath();
  ctx.arc(cx, hy - 8, 92, Math.PI, 0);
  fillStroke(ctx, '#1e9be0', INK, 6);

  // Chibi Head
  drawChibiHeadBase(ctx, cx, hy + 8, 78, 68, '#fff1e6', 'pointed');

  // Eyes (big expressive orange-amber!)
  const eyeStyleL = mood === 'wink' ? 'wink' : mood === 'deadpan' ? 'deadpan' : mood === 'shocked' ? 'shocked' : 'open';
  const eyeStyleR = mood === 'deadpan' ? 'deadpan' : mood === 'shocked' ? 'shocked' : 'open';
  drawAnimeEye(ctx, cx - 33, hy + 14, 34, 38, '#c94014', '#ffb84d', eyeStyleL);
  drawAnimeEye(ctx, cx + 33, hy + 14, 34, 38, '#c94014', '#ffb84d', eyeStyleR);
  drawMouthAndMoodFX(ctx, cx, hy + 8, mood === 'neutral' ? 'flustered' : mood);

  // Blunt cerulean bangs + side sidelocks
  ctx.beginPath();
  ctx.moveTo(cx - 82, hy + 4);
  ctx.quadraticCurveTo(cx - 86, hy - 58, cx, hy - 66);
  ctx.quadraticCurveTo(cx + 86, hy - 58, cx + 82, hy + 4);
  ctx.lineTo(cx + 72, hy + 48);
  ctx.lineTo(cx + 58, hy - 10);
  ctx.lineTo(cx + 38, hy - 8);
  ctx.lineTo(cx + 32, hy - 22);
  ctx.lineTo(cx + 22, hy - 8);
  ctx.lineTo(cx - 22, hy - 8);
  ctx.lineTo(cx - 32, hy - 22);
  ctx.lineTo(cx - 38, hy - 8);
  ctx.lineTo(cx - 58, hy - 10);
  ctx.lineTo(cx - 72, hy + 48);
  ctx.closePath();
  fillStroke(ctx, '#22a2e8', INK, 5.5);

  // Crisp white bangs specular band
  ctx.fillStyle = 'rgba(190, 244, 255, 0.78)';
  roundRectPath(ctx, cx - 44, hy - 32, 88, 9, 4);
  ctx.fill();

  // Iconic Tall White Pointed Sarkaz Hood/Ears Headdress + Tech Visor Band!
  for (const dir of [-1, 1]) {
    // Tall pointed white horn-hood peak
    ctx.beginPath();
    ctx.moveTo(cx + dir * 16, hy - 52);
    ctx.lineTo(cx + dir * 74, hy - 142);
    ctx.lineTo(cx + dir * 88, hy - 36);
    ctx.closePath();
    fillStroke(ctx, '#f6f8fc', INK, 6);

    // Inner grey ear bevel
    ctx.beginPath();
    ctx.moveTo(cx + dir * 34, hy - 54);
    ctx.lineTo(cx + dir * 68, hy - 118);
    ctx.lineTo(cx + dir * 76, hy - 44);
    ctx.closePath();
    ctx.fillStyle = '#bac4d4';
    ctx.fill();

    // Mechanical side hair clip + bow
    ctx.beginPath();
    ctx.arc(cx + dir * 78, hy - 22, 15, 0, Math.PI * 2);
    fillStroke(ctx, '#9aa5b5', INK, 4.5);
  }

  // Forehead white headband + dark visor block
  roundRectPath(ctx, cx - 64, hy - 64, 128, 24, 8);
  fillStroke(ctx, '#f6f8fc', INK, 5.5);
  roundRectPath(ctx, cx - 32, hy - 66, 64, 22, 6);
  fillStroke(ctx, '#2b303c', INK, 5);
}

function drawCamille(ctx, mood) {
  const cx = 256;
  const hy = 205;

  // Boots
  for (const dir of [-1, 1]) {
    roundRectPath(ctx, cx + dir * 22 - 15, 405, 30, 66, 10);
    fillStroke(ctx, '#1b1c22', INK, 5.5);
  }

  // Tailored black double-breasted Vanguard coat
  ctx.beginPath();
  ctx.moveTo(cx - 46, 282);
  ctx.lineTo(cx - 66, 424);
  ctx.lineTo(cx + 66, 424);
  ctx.lineTo(cx + 46, 282);
  ctx.closePath();
  fillStroke(ctx, '#22242c', INK, 6);

  // Coat lapels & silver buttons
  ctx.beginPath();
  ctx.moveTo(cx - 24, 282);
  ctx.lineTo(cx, 336);
  ctx.lineTo(cx + 24, 282);
  ctx.strokeStyle = '#5c6274';
  ctx.lineWidth = 4.5;
  ctx.stroke();
  for (const by of [350, 380, 406]) {
    for (const bx of [-14, 14]) {
      ctx.fillStyle = '#ced4da';
      ctx.beginPath();
      ctx.arc(cx + bx, by, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Right arm relaxed, Left arm raised with iconic CRIMSON GLOVE on chin!
  ctx.beginPath();
  ctx.moveTo(cx + 46, 288);
  ctx.quadraticCurveTo(cx + 72, 345, cx + 56, 392);
  ctx.lineTo(cx + 38, 388);
  ctx.closePath();
  fillStroke(ctx, '#2a2d37', INK, 5.5);

  // Head
  drawChibiHeadBase(ctx, cx, hy + 8, 76, 67, '#f8ece4', 'pointed');

  // Cool half-lidded crimson-grey eyes
  const effMood = mood === 'neutral' ? 'deadpan' : mood;
  drawAnimeEye(ctx, cx - 31, hy + 14, 32, 34, '#6c2438', '#d6455d', effMood === 'wink' ? 'wink' : effMood);
  drawAnimeEye(ctx, cx + 31, hy + 14, 32, 34, '#6c2438', '#d6455d', effMood);
  drawMouthAndMoodFX(ctx, cx, hy + 8, mood, { smirk: true });

  // Messy layered dark-teal hair
  ctx.beginPath();
  ctx.moveTo(cx - 84, hy + 18);
  ctx.quadraticCurveTo(cx - 96, hy - 55, cx - 28, hy - 78);
  ctx.quadraticCurveTo(cx + 35, hy - 86, cx + 84, hy - 35);
  ctx.quadraticCurveTo(cx + 96, hy + 8, cx + 78, hy + 32);
  ctx.lineTo(cx + 64, hy - 2);
  ctx.lineTo(cx + 44, hy + 18);
  ctx.lineTo(cx + 26, hy - 12);
  ctx.lineTo(cx + 4, hy + 22);
  ctx.lineTo(cx - 18, hy - 14);
  ctx.lineTo(cx - 42, hy + 18);
  ctx.lineTo(cx - 64, hy - 4);
  ctx.closePath();
  const hGrad = ctx.createLinearGradient(cx, hy - 82, cx, hy + 30);
  hGrad.addColorStop(0, '#2b6b78');
  hGrad.addColorStop(0.6, '#173f47');
  hGrad.addColorStop(1, '#0e252b');
  fillStroke(ctx, hGrad, INK, 6);

  // Ahoge strand
  ctx.beginPath();
  ctx.moveTo(cx - 6, hy - 78);
  ctx.quadraticCurveTo(cx + 14, hy - 108, cx + 28, hy - 92);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 5;
  ctx.stroke();

  // Iconic Floating Jagged Crimson Sarkaz Halo above head!
  ctx.save();
  ctx.shadowColor = '#ff1e38';
  ctx.shadowBlur = 12;
  ctx.strokeStyle = '#e6192e';
  ctx.lineWidth = 6.5;
  ctx.beginPath();
  ctx.ellipse(cx, hy - 104, 62, 13, -0.05, 0, Math.PI * 2);
  ctx.stroke();
  // Thorny spikes on halo
  for (const sx of [-52, -24, 10, 44]) {
    ctx.fillStyle = '#ff2a44';
    ctx.beginPath();
    ctx.moveTo(cx + sx - 6, hy - 104);
    ctx.lineTo(cx + sx, hy - 118);
    ctx.lineTo(cx + sx + 6, hy - 104);
    ctx.fill();
  }
  ctx.restore();

  // Left arm + Crimson Glove resting thoughtfully on chin
  ctx.beginPath();
  ctx.moveTo(cx - 46, 292);
  ctx.quadraticCurveTo(cx - 72, 330, cx - 34, 286);
  ctx.closePath();
  fillStroke(ctx, '#262933', INK, 5.5);

  roundRectPath(ctx, cx - 38, hy + 52, 28, 36, 10);
  fillStroke(ctx, '#d91e2e', INK, 5);
  // Finger on chin
  roundRectPath(ctx, cx - 22, hy + 38, 12, 22, 5);
  fillStroke(ctx, '#e62b3b', INK, 4.5);
}

function drawChenQianyu(ctx, mood) {
  const cx = 256;
  const hy = 206;

  // Sword hilt peeking diagonally behind shoulder
  ctx.save();
  ctx.translate(cx + 58, 252);
  ctx.rotate(0.55);
  roundRectPath(ctx, -7, -55, 14, 58, 5);
  fillStroke(ctx, '#384259', INK, 5);
  roundRectPath(ctx, -20, -6, 40, 11, 4);
  fillStroke(ctx, '#5ce1e6', INK, 4.5);
  ctx.restore();

  // Twin spiky charcoal-dark ponytails
  for (const dir of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(cx + dir * 68, hy - 12);
    ctx.quadraticCurveTo(cx + dir * 138, hy + 25, cx + dir * 126, 378);
    ctx.lineTo(cx + dir * 96, 355);
    ctx.lineTo(cx + dir * 78, 376);
    ctx.quadraticCurveTo(cx + dir * 82, hy + 80, cx + dir * 56, hy + 18);
    ctx.closePath();
    fillStroke(ctx, '#2c303b', INK, 6);
  }

  // Boots
  for (const dir of [-1, 1]) {
    roundRectPath(ctx, cx + dir * 24 - 15, 404, 30, 66, 11);
    fillStroke(ctx, '#1e2b40', INK, 5.5);
  }

  // Wuling Navy & Cyan Martial Uniform + Gold Trim
  ctx.beginPath();
  ctx.moveTo(cx - 44, 282);
  ctx.lineTo(cx - 78, 418);
  ctx.lineTo(cx + 78, 418);
  ctx.lineTo(cx + 44, 282);
  ctx.closePath();
  fillStroke(ctx, '#1c3554', INK, 6);

  // White inner collar + red martial knot tassel
  ctx.beginPath();
  ctx.moveTo(cx - 24, 282);
  ctx.lineTo(cx, 326);
  ctx.lineTo(cx + 24, 282);
  ctx.closePath();
  fillStroke(ctx, '#f4f7fb', INK, 5);

  ctx.beginPath();
  ctx.arc(cx, 324, 8, 0, Math.PI * 2);
  fillStroke(ctx, '#e63946', INK, 4);

  // Energetic fists on hips
  for (const dir of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(cx + dir * 44, 290);
    ctx.quadraticCurveTo(cx + dir * 84, 332, cx + dir * 52, 362);
    ctx.lineTo(cx + dir * 38, 346);
    ctx.closePath();
    fillStroke(ctx, '#25466e', INK, 5.5);
    ctx.beginPath();
    ctx.arc(cx + dir * 48, 356, 12, 0, Math.PI * 2);
    fillStroke(ctx, '#fff0e4', INK, 4.5);
  }

  // Head
  drawChibiHeadBase(ctx, cx, hy + 8, 76, 66, '#fff0e4', 'pointed');

  // Bright berry-crimson eyes
  const effMood = mood === 'neutral' ? 'happy' : mood;
  drawAnimeEye(ctx, cx - 32, hy + 14, 33, 37, '#9e1c3b', '#ff6b8b', effMood === 'wink' ? 'wink' : effMood);
  drawAnimeEye(ctx, cx + 32, hy + 14, 33, 37, '#9e1c3b', '#ff6b8b', effMood);
  drawMouthAndMoodFX(ctx, cx, hy + 8, effMood, { fang: true });

  // Spiky charcoal bangs
  ctx.beginPath();
  ctx.moveTo(cx - 84, hy + 16);
  ctx.quadraticCurveTo(cx - 90, hy - 62, cx, hy - 74);
  ctx.quadraticCurveTo(cx + 90, hy - 62, cx + 84, hy + 16);
  ctx.lineTo(cx + 68, hy + 42);
  ctx.lineTo(cx + 56, hy - 6);
  ctx.lineTo(cx + 34, hy + 14);
  ctx.lineTo(cx + 18, hy - 14);
  ctx.lineTo(cx, hy + 14);
  ctx.lineTo(cx - 18, hy - 14);
  ctx.lineTo(cx - 34, hy + 14);
  ctx.lineTo(cx - 56, hy - 6);
  ctx.lineTo(cx - 68, hy + 42);
  ctx.closePath();
  fillStroke(ctx, '#313542', INK, 6);

  // Cyan-tipped Lung Dragon Horns!
  for (const dir of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(cx + dir * 36, hy - 56);
    ctx.quadraticCurveTo(cx + dir * 52, hy - 115, cx + dir * 44, hy - 142);
    ctx.quadraticCurveTo(cx + dir * 24, hy - 102, cx + dir * 20, hy - 62);
    ctx.closePath();
    const hornGrad = ctx.createLinearGradient(cx, hy - 56, cx, hy - 142);
    hornGrad.addColorStop(0, '#232630');
    hornGrad.addColorStop(0.55, '#1396b8');
    hornGrad.addColorStop(1, '#4df0ff');
    fillStroke(ctx, hornGrad, INK, 5.5);
  }
}

function drawRossi(ctx, mood) {
  const cx = 256;
  const hy = 212;

  // Fluffy Wolf Tail peeking out right
  ctx.beginPath();
  ctx.moveTo(cx + 52, 385);
  ctx.quadraticCurveTo(cx + 145, 360, cx + 132, 422);
  ctx.quadraticCurveTo(cx + 98, 452, cx + 48, 418);
  ctx.closePath();
  fillStroke(ctx, '#c92a2a', INK, 5.5);

  // Boots
  for (const dir of [-1, 1]) {
    roundRectPath(ctx, cx + dir * 24 - 15, 408, 30, 62, 11);
    fillStroke(ctx, '#4a2c2a', INK, 5.5);
  }

  // Fluffy Crimson Red-Riding-Hood Cloak & Cream Tunic
  ctx.beginPath();
  ctx.moveTo(cx - 62, 268);
  ctx.quadraticCurveTo(cx - 118, 355, cx - 92, 426);
  ctx.lineTo(cx + 92, 426);
  ctx.quadraticCurveTo(cx + 118, 355, cx + 62, 268);
  ctx.closePath();
  fillStroke(ctx, '#c92a2a', INK, 6);

  // Cream front apron & corset
  ctx.beginPath();
  ctx.moveTo(cx - 28, 290);
  ctx.lineTo(cx - 38, 422);
  ctx.lineTo(cx + 38, 422);
  ctx.lineTo(cx + 28, 290);
  ctx.closePath();
  fillStroke(ctx, '#fff3db', INK, 5);

  // Crimson Hood Dome behind head
  ctx.beginPath();
  ctx.arc(cx, hy - 2, 102, Math.PI * 0.88, Math.PI * 0.12, false);
  ctx.closePath();
  fillStroke(ctx, '#c92a2a', INK, 6);

  // Head
  drawChibiHeadBase(ctx, cx, hy + 10, 74, 64, '#fff2e6', 'none');

  // Cheeky Wolfpack eyes: default is playful wink on left, bright amber slit eye on right!
  const leftStyle = mood === 'shocked' ? 'shocked' : mood === 'deadpan' ? 'deadpan' : 'wink';
  const rightStyle = mood === 'shocked' ? 'shocked' : mood === 'deadpan' ? 'deadpan' : 'open';
  drawAnimeEye(ctx, cx - 30, hy + 16, 32, 36, '#d97706', '#fde047', leftStyle, true);
  drawAnimeEye(ctx, cx + 30, hy + 16, 34, 38, '#d97706', '#fde047', rightStyle, true);
  drawMouthAndMoodFX(ctx, cx, hy + 10, mood === 'neutral' ? 'wink' : mood, { fang: true });

  // Fluffy Golden-Blonde Bangs & Side Tufts
  ctx.beginPath();
  ctx.moveTo(cx - 78, hy + 22);
  ctx.quadraticCurveTo(cx - 82, hy - 48, cx, hy - 58);
  ctx.quadraticCurveTo(cx + 82, hy - 48, cx + 78, hy + 22);
  ctx.lineTo(cx + 66, hy + 52);
  ctx.lineTo(cx + 52, hy + 2);
  ctx.lineTo(cx + 24, hy + 16);
  ctx.lineTo(cx + 4, hy - 8);
  ctx.lineTo(cx - 18, hy + 16);
  ctx.lineTo(cx - 48, hy);
  ctx.lineTo(cx - 66, hy + 52);
  ctx.closePath();
  fillStroke(ctx, '#f2dfa8', INK, 5.5);

  // Crimson Hood Trim Arch + Two Big Fluffy Wolf Ears poking through!
  ctx.beginPath();
  ctx.arc(cx, hy - 4, 92, Math.PI * 1.08, Math.PI * 1.92);
  ctx.strokeStyle = '#d93030';
  ctx.lineWidth = 18;
  ctx.stroke();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 5.5;
  ctx.stroke();

  for (const dir of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(cx + dir * 22, hy - 68);
    ctx.quadraticCurveTo(cx + dir * 56, hy - 148, cx + dir * 78, hy - 136);
    ctx.quadraticCurveTo(cx + dir * 92, hy - 86, cx + dir * 72, hy - 46);
    ctx.closePath();
    fillStroke(ctx, '#d63333', INK, 6);

    // Cream fluffy inner ear
    ctx.beginPath();
    ctx.moveTo(cx + dir * 36, hy - 68);
    ctx.lineTo(cx + dir * 68, hy - 120);
    ctx.lineTo(cx + dir * 68, hy - 58);
    ctx.closePath();
    fillStroke(ctx, '#fff5e4', INK, 3.5);
  }

  // Playful claw hands up near collar
  for (const dir of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(cx + dir * 34, 316, 13, 0, Math.PI * 2);
    fillStroke(ctx, '#fff2e6', INK, 4.5);
  }
}

function drawMiFu(ctx, mood) {
  const cx = 256;
  const hy = 208;

  // Fluffy Two-Tone Cyan & Pink Tail curving out left!
  ctx.beginPath();
  ctx.moveTo(cx - 34, 385);
  ctx.bezierCurveTo(cx - 145, 360, cx - 150, 445, cx - 78, 448);
  ctx.quadraticCurveTo(cx - 42, 445, cx - 32, 408);
  ctx.closePath();
  const tailGrad = ctx.createLinearGradient(cx - 140, 380, cx - 40, 440);
  tailGrad.addColorStop(0, '#38d9f5');
  tailGrad.addColorStop(0.55, '#ff9ebb');
  tailGrad.addColorStop(1, '#d6335c');
  fillStroke(ctx, tailGrad, INK, 6);

  // Dark boots with crimson soles
  for (const dir of [-1, 1]) {
    roundRectPath(ctx, cx + dir * 22 - 15, 404, 30, 66, 10);
    fillStroke(ctx, '#222630', INK, 5.5);
  }

  // Crimson & Charcoal Patrol Squad Street Coat
  ctx.beginPath();
  ctx.moveTo(cx - 46, 284);
  ctx.lineTo(cx - 72, 422);
  ctx.lineTo(cx + 72, 422);
  ctx.lineTo(cx + 46, 284);
  ctx.closePath();
  fillStroke(ctx, '#252730', INK, 6);

  // Crimson inner vest
  roundRectPath(ctx, cx - 26, 288, 52, 118, 8);
  fillStroke(ctx, '#d62849', INK, 5);

  // Crossed arms deadpan pose
  roundRectPath(ctx, cx - 48, 326, 96, 28, 12);
  fillStroke(ctx, '#2e313d', INK, 5.5);
  roundRectPath(ctx, cx - 28, 328, 56, 24, 10);
  fillStroke(ctx, '#e03152', INK, 4.5);

  // Pastel pink back bob hair
  ctx.beginPath();
  ctx.arc(cx, hy + 4, 92, Math.PI * 0.85, Math.PI * 0.15, false);
  ctx.closePath();
  fillStroke(ctx, '#ffb8cc', INK, 6);

  // Head
  drawChibiHeadBase(ctx, cx, hy + 8, 76, 66, '#fff1e8', 'pointed');

  // Right eye visible (unimpressed magenta-berry), left eye covered by sweeping pink bangs!
  const effMood = mood === 'neutral' ? 'deadpan' : mood;
  drawAnimeEye(ctx, cx + 30, hy + 15, 34, 35, '#8a1548', '#ff5c93', effMood);
  drawMouthAndMoodFX(ctx, cx, hy + 8, effMood);

  // Sweeping Pastel-Pink Bob Bangs covering left eye
  const hairGrad = ctx.createLinearGradient(cx, hy - 72, cx, hy + 65);
  hairGrad.addColorStop(0, '#fff0f5');
  hairGrad.addColorStop(0.55, '#ffc2d4');
  hairGrad.addColorStop(1, '#ff8fab');

  ctx.beginPath();
  ctx.moveTo(cx - 84, hy + 18);
  ctx.quadraticCurveTo(cx - 88, hy - 64, cx, hy - 72);
  ctx.quadraticCurveTo(cx + 88, hy - 64, cx + 84, hy + 28);
  ctx.lineTo(cx + 68, hy + 62);
  ctx.lineTo(cx + 56, hy - 6);
  ctx.lineTo(cx + 16, hy - 4);
  // Long asymmetric bang over left eye!
  ctx.quadraticCurveTo(cx - 8, hy + 44, cx - 48, hy + 52);
  ctx.lineTo(cx - 56, hy + 28);
  ctx.lineTo(cx - 72, hy + 60);
  ctx.closePath();
  fillStroke(ctx, hairGrad, INK, 6);

  // Asymmetrical Black-and-Cyan Jagged Sarkaz Horns!
  // Larger left horn with cyan core
  ctx.beginPath();
  ctx.moveTo(cx - 42, hy - 46);
  ctx.lineTo(cx - 88, hy - 122);
  ctx.lineTo(cx - 54, hy - 102);
  ctx.lineTo(cx - 58, hy - 134);
  ctx.lineTo(cx - 22, hy - 66);
  ctx.closePath();
  fillStroke(ctx, '#1c2029', INK, 5.5);
  ctx.strokeStyle = '#33e8ff';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(cx - 38, hy - 62);
  ctx.lineTo(cx - 66, hy - 108);
  ctx.stroke();

  // Sleeker right horn
  ctx.beginPath();
  ctx.moveTo(cx + 36, hy - 54);
  ctx.lineTo(cx + 62, hy - 118);
  ctx.lineTo(cx + 24, hy - 66);
  ctx.closePath();
  fillStroke(ctx, '#1c2029', INK, 5.5);
}

function drawYvonne(ctx, mood) {
  const cx = 256;
  const hy = 206;

  // Striped punk demon/cat tail curling up right!
  ctx.save();
  ctx.lineCap = 'round';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 20;
  ctx.beginPath();
  ctx.moveTo(cx + 35, 392);
  ctx.bezierCurveTo(cx + 115, 410, cx + 145, 350, cx + 125, 315);
  ctx.stroke();
  ctx.strokeStyle = '#ced4da';
  ctx.lineWidth = 11;
  ctx.setLineDash([12, 10]);
  ctx.stroke();
  ctx.restore();

  // Punk boots (one leg kicked up!)
  roundRectPath(ctx, cx - 38, 404, 30, 66, 10);
  fillStroke(ctx, '#23242b', INK, 5.5);
  ctx.save();
  ctx.translate(cx + 30, 392);
  ctx.rotate(-0.35);
  roundRectPath(ctx, -15, 0, 30, 62, 10);
  fillStroke(ctx, '#23242b', INK, 5.5);
  ctx.restore();

  // White-Red-Black Punk Jacket & Shorts
  ctx.beginPath();
  ctx.moveTo(cx - 46, 282);
  ctx.lineTo(cx - 68, 395);
  ctx.lineTo(cx + 68, 395);
  ctx.lineTo(cx + 46, 282);
  ctx.closePath();
  fillStroke(ctx, '#f8f9fa', INK, 6);

  roundRectPath(ctx, cx - 26, 288, 52, 98, 8);
  fillStroke(ctx, '#212529', INK, 5);
  // Red punk tie/straps
  ctx.fillStyle = '#ff4d6d';
  ctx.fillRect(cx - 8, 294, 16, 56);

  // Cheering raised arms
  for (const dir of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(cx + dir * 44, 292);
    ctx.quadraticCurveTo(cx + dir * 92, 265, cx + dir * 82, 232);
    ctx.lineTo(cx + dir * 62, 242);
    ctx.closePath();
    fillStroke(ctx, '#2b2d38', INK, 5.5);
    ctx.beginPath();
    ctx.arc(cx + dir * 74, 232, 12, 0, Math.PI * 2);
    fillStroke(ctx, '#fff0e6', INK, 4.5);
  }

  // Head
  drawChibiHeadBase(ctx, cx, hy + 8, 76, 66, '#fff0e6', 'pointed');

  // Left eye laughing arc, Right eye cute black eyepatch with pink heart!
  drawAnimeEye(ctx, cx - 30, hy + 14, 34, 36, '#ff4d8d', '#ffb3c6', mood === 'shocked' ? 'shocked' : 'laugh');

  // Eyepatch strap + heart patch
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4.5;
  ctx.beginPath();
  ctx.moveTo(cx - 60, hy - 18);
  ctx.lineTo(cx + 68, hy + 24);
  ctx.stroke();
  roundRectPath(ctx, cx + 12, hy - 4, 38, 32, 8);
  fillStroke(ctx, '#23242b', INK, 4.5);
  ctx.fillStyle = '#ff6b9d';
  ctx.beginPath();
  ctx.arc(cx + 27, hy + 10, 5, 0, Math.PI * 2);
  ctx.arc(cx + 35, hy + 10, 5, 0, Math.PI * 2);
  ctx.moveTo(cx + 22, hy + 12);
  ctx.lineTo(cx + 31, hy + 21);
  ctx.lineTo(cx + 40, hy + 12);
  ctx.fill();

  // Exuberant open laugh mouth!
  drawMouthAndMoodFX(ctx, cx, hy + 8, mood === 'neutral' ? 'happy' : mood, { fang: true });

  // Wild Two-Tone Ash-Grey & Pink Wolf-Cut Hair
  ctx.beginPath();
  ctx.moveTo(cx - 88, hy + 28);
  ctx.quadraticCurveTo(cx - 98, hy - 62, cx, hy - 74);
  ctx.quadraticCurveTo(cx + 98, hy - 62, cx + 88, hy + 28);
  ctx.lineTo(cx + 76, hy + 56);
  ctx.lineTo(cx + 58, hy - 4);
  ctx.lineTo(cx + 28, hy + 14);
  ctx.lineTo(cx, hy - 12);
  ctx.lineTo(cx - 28, hy + 14);
  ctx.lineTo(cx - 58, hy - 4);
  ctx.lineTo(cx - 76, hy + 56);
  ctx.closePath();
  const yGrad = ctx.createLinearGradient(cx - 80, hy - 70, cx + 80, hy + 50);
  yGrad.addColorStop(0, '#7a7f8a');
  yGrad.addColorStop(0.65, '#5c606b');
  yGrad.addColorStop(1, '#ff9ebb');
  fillStroke(ctx, yGrad, INK, 6);

  // Jagged Coral-Spotted Sarkaz Horns!
  for (const dir of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(cx + dir * 32, hy - 54);
    ctx.lineTo(cx + dir * 74, hy - 132);
    ctx.lineTo(cx + dir * 56, hy - 86);
    ctx.lineTo(cx + dir * 84, hy - 102);
    ctx.lineTo(cx + dir * 52, hy - 46);
    ctx.closePath();
    fillStroke(ctx, '#382e34', INK, 5.5);
    // Coral spots
    ctx.fillStyle = '#ff6b6b';
    ctx.beginPath();
    ctx.arc(cx + dir * 56, hy - 98, 5.5, 0, Math.PI * 2);
    ctx.arc(cx + dir * 64, hy - 76, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawArdashir(ctx, mood) {
  const cx = 256;
  const hy = 206;

  // Low silver-white ponytail resting over left shoulder
  ctx.beginPath();
  ctx.moveTo(cx - 56, hy + 38);
  ctx.quadraticCurveTo(cx - 115, hy + 95, cx - 86, 372);
  ctx.quadraticCurveTo(cx - 58, 355, cx - 48, 290);
  ctx.closePath();
  fillStroke(ctx, '#dce5f2', INK, 5.5);

  // Aristocratic dark boots
  for (const dir of [-1, 1]) {
    roundRectPath(ctx, cx + dir * 22 - 15, 405, 30, 66, 10);
    fillStroke(ctx, '#181e2c', INK, 5.5);
  }

  // High-collared dark navy nobleman coat with silver filigree
  ctx.beginPath();
  ctx.moveTo(cx - 44, 280);
  ctx.lineTo(cx - 66, 425);
  ctx.lineTo(cx + 66, 425);
  ctx.lineTo(cx + 44, 280);
  ctx.closePath();
  fillStroke(ctx, '#1e2638', INK, 6);

  // Silver cravat + cyan gem
  ctx.beginPath();
  ctx.moveTo(cx - 16, 284);
  ctx.lineTo(cx, 338);
  ctx.lineTo(cx + 16, 284);
  ctx.closePath();
  fillStroke(ctx, '#e2eaf5', INK, 4.5);
  ctx.beginPath();
  ctx.arc(cx, 304, 6.5, 0, Math.PI * 2);
  fillStroke(ctx, '#4cc9f0', INK, 3.5);

  // Thoughtful gloved hand near chin
  ctx.beginPath();
  ctx.moveTo(cx + 42, 290);
  ctx.quadraticCurveTo(cx + 68, 326, cx + 26, 288);
  ctx.closePath();
  fillStroke(ctx, '#28334a', INK, 5.5);
  ctx.beginPath();
  ctx.arc(cx + 24, hy + 62, 13, 0, Math.PI * 2);
  fillStroke(ctx, '#333d52', INK, 4.5);

  // Head
  drawChibiHeadBase(ctx, cx, hy + 8, 75, 66, '#faf2ec', 'pointed');

  // Calm cerulean-sapphire eyes
  const effMood = mood === 'neutral' ? 'deadpan' : mood;
  drawAnimeEye(ctx, cx - 30, hy + 15, 32, 35, '#1d4ed8', '#93c5fd', effMood === 'wink' ? 'wink' : effMood);
  drawAnimeEye(ctx, cx + 30, hy + 15, 32, 35, '#1d4ed8', '#93c5fd', effMood);
  drawMouthAndMoodFX(ctx, cx, hy + 8, mood);
  if (mood === 'neutral' || mood === 'deadpan') {
    drawSweatDrop(ctx, cx - 54, hy - 12);
  }

  // Fluffy Silvery-White Hair
  const sGrad = ctx.createLinearGradient(cx, hy - 78, cx, hy + 48);
  sGrad.addColorStop(0, '#ffffff');
  sGrad.addColorStop(0.65, '#e5ecf6');
  sGrad.addColorStop(1, '#bccbe0');

  ctx.beginPath();
  ctx.moveTo(cx - 84, hy + 20);
  ctx.quadraticCurveTo(cx - 92, hy - 64, cx, hy - 76);
  ctx.quadraticCurveTo(cx + 92, hy - 64, cx + 84, hy + 20);
  ctx.lineTo(cx + 68, hy + 48);
  ctx.lineTo(cx + 52, hy - 4);
  ctx.lineTo(cx + 24, hy + 18);
  ctx.lineTo(cx, hy - 10);
  ctx.lineTo(cx - 24, hy + 18);
  ctx.lineTo(cx - 52, hy - 4);
  ctx.lineTo(cx - 68, hy + 48);
  ctx.closePath();
  fillStroke(ctx, sGrad, INK, 6);

  // Curved Dark-Tipped Horns sweeping across crown!
  for (const dir of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(cx + dir * 18, hy - 54);
    ctx.quadraticCurveTo(cx + dir * 68, hy - 82, cx + dir * 78, hy - 114);
    ctx.quadraticCurveTo(cx + dir * 48, hy - 66, cx + dir * 8, hy - 40);
    ctx.closePath();
    fillStroke(ctx, '#222733', INK, 5);
  }
}

function drawMysteriousSarkaz(ctx, mood) {
  const cx = 232;
  const hy = 200;

  // Dramatic raised pale hands on BOTH sides (\o/) matching [01:05]!
  for (const dir of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(cx + dir * 62, 295);
    ctx.lineTo(cx + dir * 116, 205);
    ctx.lineTo(cx + dir * 94, 198);
    ctx.lineTo(cx + dir * 48, 275);
    ctx.closePath();
    fillStroke(ctx, '#343038', INK, 6);
    // Pale hand with spread fingers
    ctx.beginPath();
    ctx.arc(cx + dir * 106, 192, 16, 0, Math.PI * 2);
    fillStroke(ctx, '#f2ebe9', INK, 5);
  }

  // Tall Dark Charcoal Ritual Robe
  ctx.beginPath();
  ctx.moveTo(cx - 64, 248);
  ctx.lineTo(cx - 96, 456);
  ctx.quadraticCurveTo(cx, 468, cx + 88, 456);
  ctx.lineTo(cx + 64, 248);
  ctx.closePath();
  fillStroke(ctx, '#2b2830', INK, 6.5);

  // Pointed Hood + Curved Sarkaz Horns
  for (const dir of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(cx + dir * 32, hy - 48);
    ctx.lineTo(cx + dir * 88, hy - 96);
    ctx.lineTo(cx + dir * 56, hy - 34);
    ctx.closePath();
    fillStroke(ctx, '#3d3338', INK, 5.5);
  }

  ctx.beginPath();
  ctx.moveTo(cx, hy - 95);
  ctx.quadraticCurveTo(cx + 96, hy - 45, cx + 82, hy + 68);
  ctx.lineTo(cx - 82, hy + 68);
  ctx.quadraticCurveTo(cx - 96, hy - 45, cx, hy - 95);
  ctx.closePath();
  fillStroke(ctx, '#322e38', INK, 6.5);

  // Shadowed Face Void with 3 Glowing Horizontal Visor Slits (===)
  roundRectPath(ctx, cx - 44, hy - 28, 88, 82, 24);
  fillStroke(ctx, '#141218', INK, 5);
  for (const sy of [-8, 10, 28]) {
    roundRectPath(ctx, cx - 28, hy + sy, 56, 8, 4);
    ctx.fillStyle = mood === 'shocked' ? '#ffd43b' : '#f1f5f9';
    ctx.fill();
  }

  // Hanging White Ritual Bandage Strips draped over hood & robe!
  const strips = [
    [-54, hy - 42, -72, 385],
    [-28, hy - 55, -36, 360],
    [28, hy - 55, 34, 372],
    [54, hy - 42, 68, 392],
  ];
  for (const [x1, y1, x2, y2] of strips) {
    ctx.beginPath();
    ctx.moveTo(cx + x1 - 7, y1);
    ctx.lineTo(cx + x1 + 7, y1);
    ctx.lineTo(cx + x2 + 8, y2);
    ctx.lineTo(cx + x2 - 8, y2);
    ctx.closePath();
    fillStroke(ctx, '#f4f4f8', INK, 4.5);
  }

  // Little Wooden Pedestal + Purple Pillow + Glowing Crystal Ball on right!
  const bx = 374;
  roundRectPath(ctx, bx - 38, 444, 76, 16, 6);
  fillStroke(ctx, '#6c4632', INK, 5);
  roundRectPath(ctx, bx - 12, 398, 24, 48, 4);
  fillStroke(ctx, '#593826', INK, 5);
  roundRectPath(ctx, bx - 44, 386, 88, 16, 6);
  fillStroke(ctx, '#7d523b', INK, 5);
  // Cushion
  roundRectPath(ctx, bx - 34, 372, 68, 16, 8);
  fillStroke(ctx, '#674188', INK, 4.5);
  // Crystal ball
  const cGrad = ctx.createRadialGradient(bx - 8, 344, 4, bx, 352, 26);
  cGrad.addColorStop(0, '#ffffff');
  cGrad.addColorStop(0.65, '#e0e7ff');
  cGrad.addColorStop(1, '#93c5fd');
  ctx.beginPath();
  ctx.arc(bx, 352, 25, 0, Math.PI * 2);
  fillStroke(ctx, cGrad, INK, 5);
}

function drawSarkazDirector(ctx, mood) {
  const cx = 256;
  const hy = 216;

  // Boots & Director Suit
  for (const dir of [-1, 1]) {
    roundRectPath(ctx, cx + dir * 22 - 15, 408, 30, 62, 10);
    fillStroke(ctx, '#241e22', INK, 5.5);
  }

  ctx.beginPath();
  ctx.moveTo(cx - 46, 288);
  ctx.lineTo(cx - 68, 424);
  ctx.lineTo(cx + 68, 424);
  ctx.lineTo(cx + 46, 288);
  ctx.closePath();
  fillStroke(ctx, '#38282c', INK, 6);

  // Crisp white shirt & crimson tie
  ctx.beginPath();
  ctx.moveTo(cx - 20, 288);
  ctx.lineTo(cx, 336);
  ctx.lineTo(cx + 20, 288);
  ctx.closePath();
  fillStroke(ctx, '#f8f9fa', INK, 4.5);
  ctx.beginPath();
  ctx.moveTo(cx, 296);
  ctx.lineTo(cx - 9, 344);
  ctx.lineTo(cx, 358);
  ctx.lineTo(cx + 9, 344);
  ctx.closePath();
  fillStroke(ctx, '#d92638', INK, 4);

  // Megaphone held in right hand!
  ctx.save();
  ctx.translate(cx + 76, 316);
  ctx.rotate(-0.28);
  ctx.beginPath();
  ctx.moveTo(-18, -10);
  ctx.lineTo(36, -28);
  ctx.lineTo(36, 28);
  ctx.lineTo(-18, 10);
  ctx.closePath();
  fillStroke(ctx, '#e8590c', INK, 5);
  roundRectPath(ctx, -26, -12, 12, 24, 4);
  fillStroke(ctx, '#f8f9fa', INK, 4.5);
  ctx.restore();

  // Head
  drawChibiHeadBase(ctx, cx, hy + 8, 72, 62, '#faece4', 'pointed');
  drawMouthAndMoodFX(ctx, cx, hy + 8, mood === 'neutral' ? 'happy' : mood);

  // Dark hair bangs
  ctx.beginPath();
  ctx.arc(cx, hy - 8, 76, Math.PI, 0);
  fillStroke(ctx, '#2b2226', INK, 5.5);

  // Opaque White-Glint Boxy Anime Director Glasses!
  for (const dir of [-1, 1]) {
    roundRectPath(ctx, cx + dir * 32 - 24, hy + 2, 48, 28, 6);
    fillStroke(ctx, '#f8fafc', INK, 5.5);
    // Diagonal anime lens glint
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx + dir * 32 - 12, hy + 24);
    ctx.lineTo(cx + dir * 32 + 8, hy + 6);
    ctx.stroke();
  }
  ctx.strokeStyle = INK;
  ctx.lineWidth = 5.5;
  ctx.beginPath();
  ctx.moveTo(cx - 8, hy + 14);
  ctx.lineTo(cx + 8, hy + 14);
  ctx.stroke();

  // Pointed Witch-Director Brim Hat + Mini Clapperboard Badge!
  for (const dir of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(cx + dir * 48, hy - 44);
    ctx.lineTo(cx + dir * 88, hy - 88);
    ctx.lineTo(cx + dir * 66, hy - 32);
    ctx.closePath();
    fillStroke(ctx, '#241c20', INK, 5.5);
  }
  // Hat cone
  ctx.beginPath();
  ctx.moveTo(cx - 64, hy - 34);
  ctx.lineTo(cx - 12, hy - 146);
  ctx.lineTo(cx + 64, hy - 34);
  ctx.closePath();
  fillStroke(ctx, '#332428', INK, 6);
  // Hat brim
  ctx.beginPath();
  ctx.ellipse(cx, hy - 34, 108, 20, -0.04, 0, Math.PI * 2);
  fillStroke(ctx, '#261a1e', INK, 6);

  // Mini Clapperboard Badge pinned on hat!
  ctx.save();
  ctx.translate(cx + 18, hy - 74);
  ctx.rotate(0.14);
  roundRectPath(ctx, -22, -16, 44, 34, 5);
  fillStroke(ctx, '#1e2026', '#f8f9fa', 3.5);
  ctx.fillStyle = '#f8f9fa';
  ctx.fillRect(-20, -15, 40, 9);
  ctx.fillStyle = '#1e2026';
  for (let sx = -16; sx <= 12; sx += 12) {
    ctx.fillRect(sx, -15, 6, 9);
  }
  ctx.restore();
}

function drawInjuredLandbreaker(ctx, mood) {
  const cx = 256;
  const hy = 202;

  // Hulking dark boots & muscular legs
  for (const dir of [-1, 1]) {
    roundRectPath(ctx, cx + dir * 36 - 20, 392, 40, 74, 12);
    fillStroke(ctx, '#2a282e', INK, 6);
  }

  // Muscular hunched torso & nervous flexing arms!
  ctx.beginPath();
  ctx.moveTo(cx - 72, 250);
  ctx.lineTo(cx - 86, 404);
  ctx.lineTo(cx + 86, 404);
  ctx.lineTo(cx + 72, 250);
  ctx.closePath();
  fillStroke(ctx, '#36333b', INK, 6.5);

  for (const dir of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(cx + dir * 68, 264);
    ctx.quadraticCurveTo(cx + dir * 136, 295, cx + dir * 108, 356);
    ctx.lineTo(cx + dir * 82, 344);
    ctx.closePath();
    fillStroke(ctx, '#3d3a44', INK, 6);
    ctx.beginPath();
    ctx.arc(cx + dir * 94, 352, 16, 0, Math.PI * 2);
    fillStroke(ctx, '#252329', INK, 5.5);
  }

  // Heavy Dark Hood Dome
  ctx.beginPath();
  ctx.arc(cx, hy + 12, 92, Math.PI * 0.92, Math.PI * 0.08, false);
  ctx.closePath();
  fillStroke(ctx, '#2f2c34', INK, 6.5);

  // Vertical Metallic Mask Bars (||||)
  roundRectPath(ctx, cx - 52, hy - 22, 104, 78, 18);
  fillStroke(ctx, '#1b191f', INK, 5.5);
  for (let bx = -36; bx <= 36; bx += 18) {
    roundRectPath(ctx, cx + bx - 5, hy - 14, 10, 62, 4);
    fillStroke(ctx, '#adb5bd', INK, 3.5);
  }

  // Comical Giant White X Cross-Plaster Bandage on Temple!
  ctx.save();
  ctx.translate(cx + 48, hy - 42);
  for (const ang of [0.65, -0.65]) {
    ctx.save();
    ctx.rotate(ang);
    roundRectPath(ctx, -30, -10, 60, 20, 6);
    fillStroke(ctx, '#f8f9fa', INK, 4.5);
    ctx.restore();
  }
  ctx.restore();

  // Nervous sweat drops
  if (mood !== 'happy') {
    drawSweatDrop(ctx, cx - 88, hy - 18);
  }
}

// ============================================================================
// 9 STAGE PROP ILLUSTRATORS (512x512)
// ============================================================================

function drawPropSarkazMask(ctx) {
  const cx = 256;
  const cy = 266;

  // Four curved charcoal horns (upper + lower pairs)
  for (const dir of [-1, 1]) {
    // Upper sweeping horn
    ctx.beginPath();
    ctx.moveTo(cx + dir * 68, cy - 35);
    ctx.quadraticCurveTo(cx + dir * 158, cy - 55, cx + dir * 146, cy - 126);
    ctx.quadraticCurveTo(cx + dir * 112, cy - 75, cx + dir * 56, cy - 68);
    ctx.closePath();
    fillStroke(ctx, '#43434f', INK, 6.5);

    // Lower cheek horn
    ctx.beginPath();
    ctx.moveTo(cx + dir * 74, cy + 12);
    ctx.quadraticCurveTo(cx + dir * 168, cy + 10, cx + dir * 166, cy - 42);
    ctx.quadraticCurveTo(cx + dir * 130, cy - 6, cx + dir * 68, cy - 12);
    ctx.closePath();
    fillStroke(ctx, '#34343e', INK, 6.5);
  }

  // Bone-white & ash two-tone skull mask with 3 top spikes & jagged jaw!
  ctx.beginPath();
  ctx.moveTo(cx, cy - 118);
  ctx.lineTo(cx + 22, cy - 82);
  ctx.lineTo(cx + 58, cy - 112);
  ctx.quadraticCurveTo(cx + 102, cy - 40, cx + 82, cy + 44);
  ctx.lineTo(cx + 48, cy + 98);
  ctx.lineTo(cx + 26, cy + 74);
  ctx.lineTo(cx, cy + 106);
  ctx.lineTo(cx - 26, cy + 74);
  ctx.lineTo(cx - 48, cy + 98);
  ctx.lineTo(cx - 82, cy + 44);
  ctx.quadraticCurveTo(cx - 102, cy - 40, cx - 58, cy - 112);
  ctx.lineTo(cx - 22, cy - 82);
  ctx.closePath();
  fillStroke(ctx, '#e9ecef', INK, 7);

  // Shaded right half matching video [00:58]!
  ctx.save();
  ctx.clip();
  ctx.fillStyle = 'rgba(92, 94, 110, 0.45)';
  ctx.fillRect(cx, cy - 130, 150, 260);
  ctx.restore();
  // Re-stroke outline cleanly
  ctx.lineWidth = 7;
  ctx.strokeStyle = INK;
  ctx.stroke();

  // Hollow dark eye sockets
  for (const dir of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(cx + dir * 36, cy - 4, 18, 28, dir * 0.16, 0, Math.PI * 2);
    fillStroke(ctx, '#1e1e26', INK, 5);
  }
}

function drawPropRoastSteak(ctx) {
  const cx = 256;
  const cy = 278;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.22);

  // Thick seared meat side depth
  ctx.beginPath();
  ctx.ellipse(0, 22, 152, 86, 0, 0, Math.PI * 2);
  fillStroke(ctx, '#5c2812', INK, 7);

  // Glossy glazed top slab
  const mGrad = ctx.createRadialGradient(-30, -18, 15, 0, 0, 150);
  mGrad.addColorStop(0, '#ba5d2c');
  mGrad.addColorStop(0.7, '#8c3d19');
  mGrad.addColorStop(1, '#692a0f');
  ctx.beginPath();
  ctx.ellipse(0, 0, 148, 82, 0, 0, Math.PI * 2);
  fillStroke(ctx, mGrad, INK, 7);

  // T-bone / marrow ring
  ctx.beginPath();
  ctx.ellipse(-74, -8, 22, 15, 0.2, 0, Math.PI * 2);
  fillStroke(ctx, '#fff8eb', INK, 5);
  ctx.beginPath();
  ctx.arc(-74, -8, 8, 0, Math.PI * 2);
  ctx.fillStyle = '#d97742';
  ctx.fill();

  // Creamy zig-zag sauce drizzle matching [01:00]!
  ctx.strokeStyle = '#fff5d6';
  ctx.lineWidth = 13;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(-48, 26);
  ctx.lineTo(12, -32);
  ctx.lineTo(-8, 28);
  ctx.lineTo(66, -24);
  ctx.lineTo(48, 18);
  ctx.lineTo(94, -8);
  ctx.stroke();

  // Green herb sprig in center
  ctx.fillStyle = '#51cf66';
  ctx.beginPath();
  ctx.ellipse(12, -2, 14, 7, -0.5, 0, Math.PI * 2);
  ctx.ellipse(24, 4, 13, 6, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Rising aroma swirls
  ctx.strokeStyle = 'rgba(255, 245, 220, 0.88)';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  for (const sx of [-55, 8, 68]) {
    ctx.beginPath();
    ctx.moveTo(cx + sx, 165);
    ctx.quadraticCurveTo(cx + sx - 16, 136, cx + sx + 6, 112);
    ctx.quadraticCurveTo(cx + sx + 22, 92, cx + sx - 4, 72);
    ctx.stroke();
  }
}

function drawPropPopLoong(ctx) {
  const cx = 250;
  const cy = 268;

  // Curly olive-cream dragon tail on right
  ctx.beginPath();
  ctx.moveTo(cx + 96, cy + 28);
  ctx.quadraticCurveTo(cx + 168, cy - 12, cx + 148, cy - 58);
  ctx.quadraticCurveTo(cx + 124, cy - 32, cx + 114, cy + 4);
  ctx.closePath();
  fillStroke(ctx, '#c9be82', INK, 6.5);

  // Stubby little feet
  for (const dir of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(cx + dir * 56, cy + 92, 22, 16, 0, 0, Math.PI * 2);
    fillStroke(ctx, '#ffffff', INK, 6);
  }

  // Plump Snowy-White Chubby Dragon Ball Body
  const pGrad = ctx.createRadialGradient(cx - 24, cy - 28, 18, cx, cy, 125);
  pGrad.addColorStop(0, '#ffffff');
  pGrad.addColorStop(0.8, '#f4f6fa');
  pGrad.addColorStop(1, '#dce3ee');
  ctx.beginPath();
  ctx.ellipse(cx, cy, 116, 98, 0, 0, Math.PI * 2);
  fillStroke(ctx, pGrad, INK, 7);

  // Stubby Olive-Gold Horns + Little Red Ribbon
  for (const dir of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(cx + dir * 44, cy - 82);
    ctx.lineTo(cx + dir * 72, cy - 134);
    ctx.lineTo(cx + dir * 84, cy - 68);
    ctx.closePath();
    fillStroke(ctx, '#c2b675', INK, 6.5);
  }
  ctx.fillStyle = '#e03131';
  ctx.beginPath();
  ctx.arc(cx + 66, cy - 72, 11, 0, Math.PI * 2);
  fillStroke(ctx, '#e03131', INK, 4);

  // Squinting >_< weeping eyes + big blue teardrops!
  ctx.strokeStyle = INK;
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  // Left >
  ctx.beginPath();
  ctx.moveTo(cx - 64, cy - 16);
  ctx.lineTo(cx - 34, cy + 2);
  ctx.lineTo(cx - 64, cy + 18);
  ctx.stroke();
  // Right <
  ctx.beginPath();
  ctx.moveTo(cx + 64, cy - 16);
  ctx.lineTo(cx + 34, cy + 2);
  ctx.lineTo(cx + 64, cy + 18);
  ctx.stroke();

  // Blue teardrops
  for (const dir of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(cx + dir * 74, cy + 24, 13, 8, dir * 0.4, 0, Math.PI * 2);
    fillStroke(ctx, '#74c0fc', INK, 4.5);
  }

  // Happy/wailing open pink mouth
  ctx.beginPath();
  ctx.moveTo(cx - 18, cy + 14);
  ctx.quadraticCurveTo(cx, cy + 44, cx + 18, cy + 14);
  ctx.closePath();
  fillStroke(ctx, '#ff8787', INK, 5.5);
}

function drawPropLankybeast(ctx) {
  const cx = 256;
  const cy = 282;

  // Webbed frog feet & bowed green legs matching [01:30]!
  for (const dir of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(cx + dir * 92, cy + 28, 36, 56, dir * 0.35, 0, Math.PI * 2);
    fillStroke(ctx, '#74b816', INK, 6.5);
    // Webbed toes
    ctx.beginPath();
    ctx.moveTo(cx + dir * 68, cy + 78);
    ctx.lineTo(cx + dir * 118, cy + 86);
    ctx.lineTo(cx + dir * 95, cy + 64);
    ctx.closePath();
    fillStroke(ctx, '#82c91e', INK, 5.5);
  }

  // Pear-shaped Emerald-Green Frog Body
  ctx.beginPath();
  ctx.moveTo(cx - 56, cy - 92);
  ctx.bezierCurveTo(cx - 118, cy - 20, cx - 112, cy + 88, cx, cy + 88);
  ctx.bezierCurveTo(cx + 112, cy + 88, cx + 118, cy - 20, cx + 56, cy - 92);
  ctx.closePath();
  fillStroke(ctx, '#82c91e', INK, 7);

  // Creamy-Yellow Spotted Belly
  ctx.beginPath();
  ctx.ellipse(cx, cy + 18, 72, 62, 0, 0, Math.PI * 2);
  fillStroke(ctx, '#fff3bf', INK, 5.5);

  // Cute round yellow spots along side
  ctx.fillStyle = '#d8f5a2';
  for (const dir of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(cx + dir * 78, cy + 12, 8, 0, Math.PI * 2);
    ctx.arc(cx + dir * 72, cy + 36, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  // Two Big Blank Staring Frog Eyes on top of head!
  for (const dir of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(cx + dir * 38, cy - 92, 26, 0, Math.PI * 2);
    fillStroke(ctx, '#82c91e', INK, 6.5);
    ctx.beginPath();
    ctx.arc(cx + dir * 38, cy - 92, 18, 0, Math.PI * 2);
    fillStroke(ctx, '#ffffff', INK, 4.5);
    ctx.beginPath();
    ctx.arc(cx + dir * 36, cy - 92, 8, 0, Math.PI * 2);
    ctx.fillStyle = INK;
    ctx.fill();
  }

  // Wide blank frog mouth
  ctx.strokeStyle = INK;
  ctx.lineWidth = 5.5;
  ctx.beginPath();
  ctx.moveTo(cx - 38, cy - 52);
  ctx.quadraticCurveTo(cx, cy - 42, cx + 38, cy - 52);
  ctx.stroke();
}

function drawPropSword(ctx) {
  ctx.save();
  ctx.translate(256, 256);
  ctx.rotate(0.58);

  // Gleaming Two-Tone Steel Blade
  ctx.beginPath();
  ctx.moveTo(0, -188);
  ctx.lineTo(26, -135);
  ctx.lineTo(22, 68);
  ctx.lineTo(-22, 68);
  ctx.lineTo(-26, -135);
  ctx.closePath();
  fillStroke(ctx, '#f1f3f5', INK, 7);

  // Darker steel bevel on right half
  ctx.beginPath();
  ctx.moveTo(0, -182);
  ctx.lineTo(22, -134);
  ctx.lineTo(18, 65);
  ctx.lineTo(0, 65);
  ctx.closePath();
  ctx.fillStyle = '#adb5bd';
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, -182);
  ctx.lineTo(0, 65);
  ctx.stroke();

  // Iron Crossguard with cyan gem
  ctx.beginPath();
  ctx.moveTo(-64, 62);
  ctx.lineTo(0, 52);
  ctx.lineTo(64, 62);
  ctx.lineTo(54, 84);
  ctx.lineTo(0, 78);
  ctx.lineTo(-54, 84);
  ctx.closePath();
  fillStroke(ctx, '#495057', INK, 6.5);

  ctx.beginPath();
  ctx.arc(0, 67, 9, 0, Math.PI * 2);
  fillStroke(ctx, '#4dabf7', INK, 4);

  // Grip & Pommel
  roundRectPath(ctx, -12, 80, 24, 68, 6);
  fillStroke(ctx, '#343a40', INK, 6);
  ctx.beginPath();
  ctx.moveTo(0, 142);
  ctx.lineTo(20, 162);
  ctx.lineTo(0, 182);
  ctx.lineTo(-20, 162);
  ctx.closePath();
  fillStroke(ctx, '#868e96', INK, 6);

  ctx.restore();
  drawStarSparkle(ctx, 318, 148, 26, 7, '#ffffff', INK);
}

function drawPropLollipop(ctx) {
  ctx.save();
  ctx.translate(256, 256);
  ctx.rotate(0.24);

  // White candy stick
  roundRectPath(ctx, -9, 45, 18, 148, 8);
  fillStroke(ctx, '#f8f9fa', INK, 6.5);

  // Oversized Pink Candy Disc
  ctx.beginPath();
  ctx.arc(0, -34, 108, 0, Math.PI * 2);
  fillStroke(ctx, '#ff85a1', INK, 7);

  // Cream Archimedes Swirl!
  ctx.strokeStyle = '#fff0f5';
  ctx.lineWidth = 16;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let t = 0; t <= Math.PI * 5.3; t += 0.12) {
    const r = 5.5 * t;
    const x = Math.cos(t) * r;
    const y = -34 + Math.sin(t) * r;
    if (t === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Cute yellow ribbon bow at neck
  ctx.beginPath();
  ctx.moveTo(0, 82);
  ctx.lineTo(-32, 66);
  ctx.lineTo(-26, 98);
  ctx.closePath();
  fillStroke(ctx, '#ffd43b', INK, 5);
  ctx.beginPath();
  ctx.moveTo(0, 82);
  ctx.lineTo(32, 66);
  ctx.lineTo(26, 98);
  ctx.closePath();
  fillStroke(ctx, '#ffd43b', INK, 5);
  ctx.beginPath();
  ctx.arc(0, 82, 9, 0, Math.PI * 2);
  fillStroke(ctx, '#fcc419', INK, 4.5);

  ctx.restore();
}

function drawPropCandyChest(ctx) {
  const cx = 256;
  const cy = 278;

  // Dome Lid propped open at top
  ctx.beginPath();
  ctx.arc(cx, cy - 52, 128, Math.PI, 0);
  ctx.closePath();
  fillStroke(ctx, '#8d6346', INK, 7);
  // Center wooden strap on lid
  roundRectPath(ctx, cx - 16, cy - 180, 32, 128, 6);
  fillStroke(ctx, '#6f4b33', INK, 5.5);

  // Overflowing Heap of Pastel Candies, Lollipops & Stars!
  const candies = [
    [-86, -42, 22, '#ff85a1'],
    [-52, -56, 24, '#74c0fc'],
    [-14, -62, 25, '#ffe066'],
    [28, -58, 24, '#b197fc'],
    [68, -48, 23, '#63e6be'],
    [94, -36, 20, '#ffa8a8'],
    [-34, -34, 22, '#ffc078'],
    [12, -34, 22, '#ff85a1'],
    [52, -32, 21, '#ffe066'],
  ];
  for (const [dx, dy, r, col] of candies) {
    ctx.beginPath();
    ctx.arc(cx + dx, cy + dy, r, 0, Math.PI * 2);
    fillStroke(ctx, col, INK, 4.5);
  }

  // Lower Trapezoid Wooden Chest Box matching [02:20]!
  ctx.beginPath();
  ctx.moveTo(cx - 134, cy - 26);
  ctx.lineTo(cx + 134, cy - 26);
  ctx.lineTo(cx + 108, cy + 106);
  ctx.lineTo(cx - 108, cy + 106);
  ctx.closePath();
  fillStroke(ctx, '#9c6f4f', INK, 7);

  // Horizontal plank lines & gold lock clasp
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4.5;
  for (const py of [cy + 16, cy + 58]) {
    ctx.beginPath();
    ctx.moveTo(cx - 120, py);
    ctx.lineTo(cx + 120, py);
    ctx.stroke();
  }
  roundRectPath(ctx, cx - 22, cy - 34, 44, 34, 8);
  fillStroke(ctx, '#ffd43b', INK, 5);
}

function drawPropFireworks(ctx) {
  const cx = 256;
  const cy = 295;

  // Assorted Colorful Sky-Rockets sticking out of crate matching [02:18]!
  const rockets = [
    { x: -62, y: -65, rot: -0.22, body: '#ffd43b', cone: '#fa5252', w: 32, h: 110 },
    { x: -12, y: -102, rot: -0.05, body: '#cc5de8', cone: '#fcc419', w: 38, h: 140 },
    { x: 46, y: -82, rot: 0.18, body: '#339af0', cone: '#51cf66', w: 40, h: 128 },
    { x: 78, y: -38, rot: 0.36, body: '#ff922b', cone: '#845ef7', w: 28, h: 92 },
  ];
  for (const rk of rockets) {
    ctx.save();
    ctx.translate(cx + rk.x, cy + rk.y);
    ctx.rotate(rk.rot);
    roundRectPath(ctx, -rk.w * 0.5, 0, rk.w, rk.h, 6);
    fillStroke(ctx, rk.body, INK, 6);
    // Rocket nose cone
    ctx.beginPath();
    ctx.moveTo(-rk.w * 0.64, 4);
    ctx.lineTo(0, -42);
    ctx.lineTo(rk.w * 0.64, 4);
    ctx.closePath();
    fillStroke(ctx, rk.cone, INK, 6);
    ctx.restore();
  }

  // Red-and-Gold Striped Party Box Base
  ctx.beginPath();
  ctx.moveTo(cx - 112, cy - 22);
  ctx.lineTo(cx + 112, cy - 22);
  ctx.lineTo(cx + 92, cy + 96);
  ctx.lineTo(cx - 92, cy + 96);
  ctx.closePath();
  fillStroke(ctx, '#ffe066', INK, 7);

  ctx.save();
  ctx.clip();
  ctx.fillStyle = '#e03131';
  for (let sx = -130; sx <= 130; sx += 44) {
    ctx.beginPath();
    ctx.moveTo(cx + sx, cy - 30);
    ctx.lineTo(cx + sx + 22, cy - 30);
    ctx.lineTo(cx + sx + 4, cy + 105);
    ctx.lineTo(cx + sx - 18, cy + 105);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  // Re-stroke crate outline
  ctx.beginPath();
  ctx.moveTo(cx - 112, cy - 22);
  ctx.lineTo(cx + 112, cy - 22);
  ctx.lineTo(cx + 92, cy + 96);
  ctx.lineTo(cx - 92, cy + 96);
  ctx.closePath();
  ctx.lineWidth = 7;
  ctx.strokeStyle = INK;
  ctx.stroke();

  drawStarSparkle(ctx, cx - 96, cy - 112, 20, 6, '#ffe066', INK);
  drawStarSparkle(ctx, cx + 104, cy - 118, 22, 6, '#ff85a1', INK);
}

function drawPropSuppressor(ctx) {
  const cx = 256;
  const cy = 264;

  // Exact Endfield Originium Suppressor U-Hexagon Tech Collar matching [02:46] & [02:52]!
  ctx.beginPath();
  ctx.moveTo(cx - 92, cy - 122);
  ctx.lineTo(cx - 56, cy - 122);
  ctx.lineTo(cx - 44, cy - 42);
  ctx.lineTo(cx + 44, cy - 42);
  ctx.lineTo(cx + 56, cy - 122);
  ctx.lineTo(cx + 92, cy - 122);
  ctx.lineTo(cx + 132, cy + 28);
  ctx.lineTo(cx, cy + 122);
  ctx.lineTo(cx - 132, cy + 28);
  ctx.closePath();

  const gGrad = ctx.createLinearGradient(cx - 120, cy - 120, cx + 120, cy + 120);
  gGrad.addColorStop(0, '#adb5bd');
  gGrad.addColorStop(0.5, '#6c757d');
  gGrad.addColorStop(1, '#495057');
  fillStroke(ctx, gGrad, INK, 7.5);

  // Inner armor bevel seams
  ctx.strokeStyle = '#343a40';
  ctx.lineWidth = 4.5;
  ctx.beginPath();
  ctx.moveTo(cx - 56, cy - 42);
  ctx.lineTo(cx - 88, cy + 48);
  ctx.moveTo(cx + 56, cy - 42);
  ctx.lineTo(cx + 88, cy + 48);
  ctx.stroke();

  // Glowing Amber-Yellow Warning LED Bars on lower left & right bevels!
  for (const dir of [-1, 1]) {
    ctx.save();
    ctx.translate(cx + dir * 102, cy + 42);
    ctx.rotate(dir * -0.62);
    roundRectPath(ctx, -20, -8, 40, 16, 5);
    fillStroke(ctx, '#ffd43b', INK, 4.5);
    ctx.restore();
  }

  // Crisp White Endfield Geometric Emblem in center
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - 10, cy + 56);
  ctx.lineTo(cx - 18, cy + 12);
  ctx.lineTo(cx + 22, cy + 28);
  ctx.moveTo(cx - 14, cy + 34);
  ctx.lineTo(cx + 12, cy + 42);
  ctx.stroke();
}

const DRAW_DISPATCH = {
  last_rite: drawLastRite,
  camille: drawCamille,
  chen_qianyu: drawChenQianyu,
  rossi: drawRossi,
  mi_fu: drawMiFu,
  yvonne: drawYvonne,
  ardashir: drawArdashir,
  mysterious_sarkaz: drawMysteriousSarkaz,
  sarkaz_director: drawSarkazDirector,
  injured_landbreaker: drawInjuredLandbreaker,
  sarkaz_mask: drawPropSarkazMask,
  roast_steak: drawPropRoastSteak,
  pop_loong: drawPropPopLoong,
  lankybeast: drawPropLankybeast,
  one_handed_sword: drawPropSword,
  lollipop: drawPropLollipop,
  candy_chest: drawPropCandyChest,
  fireworks: drawPropFireworks,
  suppressor: drawPropSuppressor,
};

function drawFallbackBadge(ctx, id) {
  ctx.beginPath();
  ctx.arc(256, 256, 120, 0, Math.PI * 2);
  fillStroke(ctx, '#495057', INK, 7);
  ctx.fillStyle = '#fff5d6';
  ctx.font = 'bold 36px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(id || 'ITEM').slice(0, 10).toUpperCase(), 256, 256);
}

/**
 * Returns a cached 512x512 HTMLCanvasElement of the full-body chibi standee or stage prop
 * with white paper-cutout sticker border and soft theatrical shadow.
 */
export function getStandeeCanvas(id, mood = 'neutral') {
  const cleanId = String(id || 'last_rite');
  const isProp = PROP_IDS.includes(cleanId);
  const cleanMood = isProp ? 'neutral' : MOOD_EXPRESSIONS.includes(mood) ? mood : 'neutral';
  const key = `${cleanId}::${cleanMood}`;
  if (_standeeCanvasCache.has(key)) {
    return _standeeCanvasCache.get(key);
  }

  const raw = makeCanvas(512, 512);
  const ctx = raw.getContext('2d');
  const fn = DRAW_DISPATCH[cleanId];
  if (fn) {
    fn(ctx, cleanMood);
  } else {
    drawFallbackBadge(ctx, cleanId);
  }

  const sticker = finalizePaperCutout(raw, 11);
  _standeeCanvasCache.set(key, sticker);
  return sticker;
}

/**
 * Returns a cached PNG DataURL of the full 512x512 standee/prop.
 */
export function getStandeeDataURL(id, mood = 'neutral') {
  const cleanId = String(id || 'last_rite');
  const isProp = PROP_IDS.includes(cleanId);
  const cleanMood = isProp ? 'neutral' : MOOD_EXPRESSIONS.includes(mood) ? mood : 'neutral';
  const key = `${cleanId}::${cleanMood}`;
  if (_standeeUrlCache.has(key)) {
    return _standeeUrlCache.get(key);
  }
  const url = getStandeeCanvas(cleanId, cleanMood).toDataURL('image/png');
  _standeeUrlCache.set(key, url);
  return url;
}

/**
 * Returns a cached 256x256 portrait/card thumbnail canvas:
 * - Characters: crisp upper-body/face framing matching Endfield casting cards & Polaroid avatars!
 * - Props: centered prop icon scaled cleanly inside 256x256.
 */
export function getPortraitCanvas(id, mood = 'neutral') {
  const cleanId = String(id || 'last_rite');
  const isProp = PROP_IDS.includes(cleanId);
  const cleanMood = isProp ? 'neutral' : MOOD_EXPRESSIONS.includes(mood) ? mood : 'neutral';
  const key = `${cleanId}::${cleanMood}`;
  if (_portraitCanvasCache.has(key)) {
    return _portraitCanvasCache.get(key);
  }

  const standee = getStandeeCanvas(cleanId, cleanMood);
  const out = makeCanvas(256, 256);
  const ctx = out.getContext('2d');

  if (isProp) {
    ctx.drawImage(standee, 16, 16, 480, 480, 8, 8, 240, 240);
  } else if (cleanId === 'mysterious_sarkaz') {
    ctx.drawImage(standee, 44, 52, 376, 376, 0, 4, 256, 256);
  } else {
    // Upper-body + head + horns crop matching video Polaroid & casting card portraits!
    ctx.drawImage(standee, 56, 36, 400, 360, 0, 4, 256, 252);
  }

  _portraitCanvasCache.set(key, out);
  return out;
}

/**
 * Returns a cached PNG DataURL (256x256) for casting cards, dialogue Polaroid avatars, and modals.
 */
export function getPortraitDataURL(id, mood = 'neutral') {
  const cleanId = String(id || 'last_rite');
  const isProp = PROP_IDS.includes(cleanId);
  const cleanMood = isProp ? 'neutral' : MOOD_EXPRESSIONS.includes(mood) ? mood : 'neutral';
  const key = `${cleanId}::${cleanMood}`;
  if (_portraitUrlCache.has(key)) {
    return _portraitUrlCache.get(key);
  }
  const url = getPortraitCanvas(cleanId, cleanMood).toDataURL('image/png');
  _portraitUrlCache.set(key, url);
  return url;
}

/**
 * Draws a crisp chibi portrait or prop thumbnail directly onto any caller <canvas>.
 */
export function drawThumbnail(canvas, id, mood = 'neutral') {
  if (!canvas || typeof canvas.getContext !== 'function') return canvas;
  if (!canvas.width) canvas.width = 256;
  if (!canvas.height) canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const src = getPortraitCanvas(id, mood);
  const side = Math.min(canvas.width, canvas.height);
  const ox = (canvas.width - side) * 0.5;
  const oy = (canvas.height - side) * 0.5;
  ctx.drawImage(src, ox, oy, side, side);
  return canvas;
}

export const drawPortrait = drawThumbnail;

/**
 * Generates a cached 320x180 mini-Polaroid thumbnail DataURL for any Take (for Film Album).
 */
export function getTakeThumbnailDataURL(takeOrInfo) {
  const takeId = typeof takeOrInfo === 'string' ? takeOrInfo : takeOrInfo?.takeId || 'take_1_1';
  if (_takeThumbUrlCache.has(takeId)) {
    return _takeThumbUrlCache.get(takeId);
  }

  const parts = String(takeId).split('_');
  const actNum = Number(parts[1]) || takeOrInfo?.actId || 1;
  const actorId = takeOrInfo?.actorId || 'last_rite';
  const propId = takeOrInfo?.propId || 'sarkaz_mask';

  const palettes = {
    1: ['#5e3724', '#c98850'],
    2: ['#152938', '#386b7a'],
    3: ['#1b2336', '#4a5a78'],
    4: ['#14262e', '#2d5a58'],
    5: ['#121636', '#4d66b8'],
  };
  const [cTop, cBot] = palettes[actNum] || palettes[1];

  const c = makeCanvas(320, 180);
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 180);
  g.addColorStop(0, cTop);
  g.addColorStop(1, cBot);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 320, 180);

  // Soft stage spotlight circle
  const sp = ctx.createRadialGradient(160, 90, 10, 160, 90, 130);
  sp.addColorStop(0, 'rgba(255, 245, 210, 0.32)');
  sp.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = sp;
  ctx.fillRect(0, 0, 320, 180);

  const actorFirst = actNum >= 4;
  const leftImg = getStandeeCanvas(actorFirst ? actorId : propId, 'happy');
  const rightImg = getStandeeCanvas(actorFirst ? propId : actorId, 'happy');
  ctx.drawImage(leftImg, 22, 14, 142, 152);
  ctx.drawImage(rightImg, 156, 14, 142, 152);

  const url = c.toDataURL('image/png');
  _takeThumbUrlCache.set(takeId, url);
  return url;
}

/**
 * Returns a pooled THREE.CanvasTexture in SRGBColorSpace (never duplicated across reshoots!).
 */
export function getStandeeTexture(THREE, id, mood = 'neutral') {
  const cleanId = String(id || 'last_rite');
  const isProp = PROP_IDS.includes(cleanId);
  const cleanMood = isProp ? 'neutral' : MOOD_EXPRESSIONS.includes(mood) ? mood : 'neutral';
  const key = `${cleanId}::${cleanMood}`;
  if (_threeTextureCache.has(key)) {
    return _threeTextureCache.get(key);
  }
  const canvas = getStandeeCanvas(cleanId, cleanMood);
  const tex = new THREE.CanvasTexture(canvas);
  if (THREE.SRGBColorSpace) {
    tex.colorSpace = THREE.SRGBColorSpace;
  }
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  _threeTextureCache.set(key, tex);
  return tex;
}

export function disposeAtlasTextures() {
  for (const tex of _threeTextureCache.values()) {
    tex.dispose();
  }
  _threeTextureCache.clear();
}
