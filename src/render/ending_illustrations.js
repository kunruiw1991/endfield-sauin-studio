// Bespoke 960x540 Illustrated Polaroid Endings (END1..END5) + 3D Stage Backdrop Configs
// 100% English localization (hanziCount === 0), cached Canvas, DataURL, and THREE.CanvasTexture.

import { getStandeeCanvas } from './chibi_atlas.js';

export const ENDING_IDS = ['END1', 'END2', 'END3', 'END4', 'END5'];

const _endingCanvasCache = new Map();
const _endingUrlCache = new Map();
const _endingTexCache = new Map();

const INK = '#19161d';

const BACKDROP_CONFIGS = {
  END1: {
    skyTop: 0x3b1414,
    skyBottom: 0xd96b27,
    spotColor: 0xffa94d,
    spotIntensity: 1.35,
    ambientColor: 0xffb070,
    particleKind: 'candy',
    curtainOpen: 0.72,
  },
  END2: {
    skyTop: 0x2a183b,
    skyBottom: 0xd96b8a,
    spotColor: 0xffc9de,
    spotIntensity: 1.4,
    ambientColor: 0xffbfd3,
    particleKind: 'hearts',
    curtainOpen: 0.85,
  },
  END3: {
    skyTop: 0x0f223d,
    skyBottom: 0x2b7285,
    spotColor: 0xffe066,
    spotIntensity: 1.45,
    ambientColor: 0xfff3bf,
    particleKind: 'fireworks',
    curtainOpen: 0.9,
  },
  END4: {
    skyTop: 0x0b102b,
    skyBottom: 0x364fc7,
    spotColor: 0x91a7ff,
    spotIntensity: 1.35,
    ambientColor: 0xbac8ff,
    particleKind: 'stardust',
    curtainOpen: 0.85,
  },
  END5: {
    skyTop: 0x2e101c,
    skyBottom: 0xc92a2a,
    spotColor: 0xff8787,
    spotIntensity: 1.5,
    ambientColor: 0xffa8a8,
    particleKind: 'fireworks',
    curtainOpen: 0.92,
  },
};

export function getEndingBackdropConfig(endingId) {
  return BACKDROP_CONFIGS[endingId] || BACKDROP_CONFIGS.END1;
}

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

function drawCostumedPopLoong(ctx, x, y, scale, costume = 'pumpkin') {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // Chubby white dragon body
  ctx.beginPath();
  ctx.ellipse(0, 0, 56, 48, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#fff9f2';
  ctx.fill();
  ctx.lineWidth = 4.5;
  ctx.strokeStyle = INK;
  ctx.stroke();

  // Stubby horns
  for (const dir of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(dir * 22, -38);
    ctx.lineTo(dir * 36, -64);
    ctx.lineTo(dir * 42, -30);
    ctx.closePath();
    ctx.fillStyle = '#c9be82';
    ctx.fill();
    ctx.stroke();
  }

  // Mischievous >:) eyes & grin
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.arc(-18, -4, 5, 0, Math.PI * 2);
  ctx.arc(18, -4, 5, 0, Math.PI * 2);
  ctx.fill();
  // Angled mischief brows
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-28, -15);
  ctx.lineTo(-10, -9);
  ctx.moveTo(28, -15);
  ctx.lineTo(10, -9);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(0, 8, 11, 0, Math.PI);
  ctx.fillStyle = '#ff6b6b';
  ctx.fill();
  ctx.stroke();

  if (costume === 'witch') {
    ctx.beginPath();
    ctx.moveTo(-42, -34);
    ctx.lineTo(0, -96);
    ctx.lineTo(42, -34);
    ctx.closePath();
    ctx.fillStyle = '#674188';
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(0, -34, 54, 11, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#4c2c69';
    ctx.fill();
    ctx.stroke();
  } else if (costume === 'pumpkin') {
    ctx.beginPath();
    ctx.ellipse(0, -48, 34, 22, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#f76707';
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#5c940d';
    ctx.fillRect(-5, -76, 10, 12);
  } else if (costume === 'sarkaz') {
    // Little dark Sarkaz hood cloak!
    ctx.beginPath();
    ctx.arc(0, -10, 54, Math.PI * 1.1, Math.PI * 1.9);
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#3b2830';
    ctx.stroke();
  } else if (costume === 'mummy') {
    ctx.strokeStyle = '#e9ecef';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(-48, -18);
    ctx.lineTo(48, -8);
    ctx.moveTo(-46, 18);
    ctx.lineTo(46, 8);
    ctx.stroke();
  }

  ctx.restore();
}

function drawBunting(ctx, yStart, colors) {
  ctx.save();
  ctx.strokeStyle = '#3b1f1c';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, yStart);
  ctx.quadraticCurveTo(480, yStart + 58, 960, yStart - 10);
  ctx.stroke();

  const count = 14;
  for (let i = 0; i < count; i++) {
    const t = (i + 0.5) / count;
    const x = t * 960;
    const y = (1 - t) * (1 - t) * yStart + 2 * (1 - t) * t * (yStart + 58) + t * t * (yStart - 10);
    ctx.beginPath();
    ctx.moveTo(x - 24, y - 2);
    ctx.lineTo(x + 24, y - 2);
    ctx.lineTo(x, y + 36);
    ctx.closePath();
    ctx.fillStyle = colors[i % colors.length];
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = INK;
    ctx.stroke();
  }
  ctx.restore();
}

function drawEnd1StrangeSauin(ctx) {
  // Matches video [02:58] //END1: Warm orange-amber Halloween party + Pop Loong army + shocked Last Rite!
  const g = ctx.createLinearGradient(0, 0, 0, 540);
  g.addColorStop(0, '#4a1215');
  g.addColorStop(0.45, '#b84218');
  g.addColorStop(1, '#ffad42');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 960, 540);

  // Warm radial bonfire glow
  const glow = ctx.createRadialGradient(540, 320, 30, 540, 320, 460);
  glow.addColorStop(0, 'rgba(255, 235, 150, 0.55)');
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 960, 540);

  // Cobwebs in top-left corner
  ctx.strokeStyle = 'rgba(255, 245, 225, 0.35)';
  ctx.lineWidth = 2.5;
  for (let r = 45; r <= 180; r += 45) {
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 0.5);
    ctx.stroke();
  }

  // Festive Bunting Flags
  drawBunting(ctx, 42, ['#ffd43b', '#ff6b6b', '#ffffff', '#ffa94d', '#845ef7']);
  drawBunting(ctx, 108, ['#ffa94d', '#63e6be', '#ffd43b', '#ff8787']);

  // Back row of mischievous costumed Pop Loongs!
  const armyBack = [
    [110, 235, 0.95, 'pumpkin'],
    [255, 195, 0.85, 'witch'],
    [435, 225, 0.9, 'mummy'],
    [575, 198, 0.95, 'sarkaz'],
    [720, 185, 1.05, 'pumpkin'],
    [855, 215, 0.98, 'witch'],
  ];
  for (const [x, y, s, c] of armyBack) {
    drawCostumedPopLoong(ctx, x, y, s, c);
  }

  // Mid-ground Pop Loong platoon marching with "TRICK!" banner
  const armyFront = [
    [485, 345, 1.12, 'witch'],
    [635, 328, 1.18, 'pumpkin'],
    [795, 348, 1.22, 'sarkaz'],
    [560, 452, 1.15, 'mummy'],
    [725, 460, 1.2, 'pumpkin'],
    [880, 455, 1.1, 'witch'],
  ];
  for (const [x, y, s, c] of armyFront) {
    drawCostumedPopLoong(ctx, x, y, s, c);
  }

  // Cute wooden protest sign held by Pop Loongs: "NO CANDY? TRICK TIME!"
  ctx.save();
  ctx.translate(655, 242);
  ctx.rotate(-0.08);
  ctx.fillStyle = '#5c3c24';
  ctx.fillRect(-6, 10, 12, 75);
  roundRect(ctx, -122, -36, 244, 56, 10);
  ctx.fillStyle = '#fff4e0';
  ctx.fill();
  ctx.lineWidth = 4.5;
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.fillStyle = '#c92a2a';
  ctx.font = '900 18px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('NO CANDY?! TRICK!', 0, -8);
  ctx.restore();

  // Foreground Left: Wide-eyed Shocked Last Rite matching [02:58]!
  const lr = getStandeeCanvas('last_rite', 'shocked');
  ctx.drawImage(lr, 38, 86, 448, 448);
}

function drawEnd2SauinUniverse(ctx) {
  // Warm Golden-Rose Lantern Sky + Whole Cast + Hugging Pop Loong!
  const g = ctx.createLinearGradient(0, 0, 0, 540);
  g.addColorStop(0, '#1e1338');
  g.addColorStop(0.5, '#7c3268');
  g.addColorStop(1, '#f7a072');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 960, 540);

  // Floating Golden Soul-Lanterns across the twilight sky
  const lanterns = [
    [95, 92, 18], [210, 64, 14], [340, 110, 22], [490, 58, 16],
    [625, 88, 24], [765, 62, 15], [875, 108, 20], [155, 175, 13], [820, 182, 14],
  ];
  for (const [lx, ly, lr] of lanterns) {
    const lg = ctx.createRadialGradient(lx, ly, 2, lx, ly, lr * 2.6);
    lg.addColorStop(0, 'rgba(255, 236, 153, 0.95)');
    lg.addColorStop(0.5, 'rgba(255, 169, 77, 0.45)');
    lg.addColorStop(1, 'rgba(255, 169, 77, 0)');
    ctx.fillStyle = lg;
    ctx.beginPath();
    ctx.arc(lx, ly, lr * 2.6, 0, Math.PI * 2);
    ctx.fill();

    roundRect(ctx, lx - lr * 0.65, ly - lr * 0.85, lr * 1.3, lr * 1.7, 6);
    ctx.fillStyle = '#ffe066';
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#d9480f';
    ctx.stroke();
  }

  // Warm Cobblestone Terrace Floor
  ctx.fillStyle = '#2d1c36';
  ctx.fillRect(0, 425, 960, 115);

  // Cast Ensemble Gathered Together (Camille, Chen Qianyu, Last Rite, Yvonne, Mi Fu, Rossi)!
  ctx.drawImage(getStandeeCanvas('camille', 'happy'), 6, 174, 255, 255);
  ctx.drawImage(getStandeeCanvas('chen_qianyu', 'happy'), 140, 180, 252, 252);
  ctx.drawImage(getStandeeCanvas('yvonne', 'happy'), 446, 162, 260, 260);
  ctx.drawImage(getStandeeCanvas('mi_fu', 'happy'), 582, 178, 252, 252);
  ctx.drawImage(getStandeeCanvas('rossi', 'wink'), 704, 172, 252, 252);

  // Centerpiece Candy Chest + Beaming Last Rite & Pop Loong!
  ctx.drawImage(getStandeeCanvas('candy_chest'), 468, 312, 182, 182);
  ctx.drawImage(getStandeeCanvas('last_rite', 'happy'), 256, 128, 336, 336);
  ctx.drawImage(getStandeeCanvas('pop_loong'), 208, 318, 172, 172);

  // Floating Pink Hearts
  ctx.fillStyle = '#ff85a1';
  for (const [hx, hy, hs] of [[310, 118, 14], [480, 108, 17], [625, 136, 13], [218, 138, 12]]) {
    ctx.beginPath();
    ctx.moveTo(hx, hy + hs * 0.95);
    ctx.bezierCurveTo(hx - hs * 1.25, hy + hs * 0.2, hx - hs * 1.1, hy - hs * 0.85, hx, hy - hs * 0.2);
    ctx.bezierCurveTo(hx + hs * 1.1, hy - hs * 0.85, hx + hs * 1.25, hy + hs * 0.2, hx, hy + hs * 0.95);
    ctx.closePath();
    ctx.fill();
  }
}

function drawEnd3UnendingParade(ctx) {
  // Starlit Fangqu Street Carnival + Fireworks + Dancing Lankybeasts + Rossi & Last Rite!
  const g = ctx.createLinearGradient(0, 0, 0, 540);
  g.addColorStop(0, '#0b192e');
  g.addColorStop(0.6, '#1b4965');
  g.addColorStop(1, '#2c6e7f');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 960, 540);

  // Dazzling Carnival Fireworks in Sky!
  const bursts = [
    [180, 108, 68, '#ff6b9d'],
    [480, 56, 62, '#ffd43b'],
    [790, 112, 72, '#4dabf7'],
  ];
  for (const [bx, by, br, col] of bursts) {
    ctx.save();
    ctx.strokeStyle = col;
    ctx.lineWidth = 4.5;
    ctx.lineCap = 'round';
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(bx + Math.cos(a) * 14, by + Math.sin(a) * 14);
      ctx.lineTo(bx + Math.cos(a) * br, by + Math.sin(a) * br);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Fangqu Neon Sign Banner (100% English — lifted cleanly above Last Rite's crown!)
  roundRect(ctx, 290, 96, 380, 52, 12);
  ctx.fillStyle = '#182438';
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#63e6be';
  ctx.stroke();
  ctx.fillStyle = '#ffe066';
  ctx.font = '900 22px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('WITCHCRAFT HOUR PARADE', 480, 122);

  // Parade Street Steps
  ctx.fillStyle = '#26384a';
  ctx.fillRect(0, 416, 960, 124);
  ctx.fillStyle = '#ffd43b';
  for (let sx = 30; sx < 960; sx += 95) {
    ctx.fillRect(sx, 474, 52, 8);
  }

  // Parade Cast Conga Line!
  ctx.drawImage(getStandeeCanvas('injured_landbreaker', 'happy'), 25, 178, 280, 280);
  ctx.drawImage(getStandeeCanvas('lankybeast'), 228, 298, 180, 180);
  ctx.drawImage(getStandeeCanvas('last_rite', 'happy'), 355, 168, 312, 312);
  ctx.drawImage(getStandeeCanvas('rossi', 'wink'), 585, 170, 308, 308);
  ctx.drawImage(getStandeeCanvas('lollipop'), 535, 254, 142, 142);
  ctx.drawImage(getStandeeCanvas('lankybeast'), 790, 314, 162, 162);
}

function drawEnd4SauinAndSarkaz(ctx) {
  // Cosmic Silver-Violet Panorama under Colossal Talos + Ardashir holding "I AM NOT A SARKAZ" sign!
  const g = ctx.createLinearGradient(0, 0, 0, 540);
  g.addColorStop(0, '#070b1e');
  g.addColorStop(0.55, '#1d2b64');
  g.addColorStop(1, '#3b4d99');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 960, 540);

  // Starfield
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 60; i++) {
    const sx = (i * 173 + 29) % 960;
    const sy = (i * 97 + 17) % 360;
    const sr = (i % 3) + 1;
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.fill();
  }

  // Colossal Glowing Moon TALOS!
  const mg = ctx.createRadialGradient(470, 210, 30, 480, 225, 225);
  mg.addColorStop(0, '#ffffff');
  mg.addColorStop(0.7, '#e0e7ff');
  mg.addColorStop(0.92, '#a5b4fc');
  mg.addColorStop(1, 'rgba(165, 180, 252, 0)');
  ctx.fillStyle = mg;
  ctx.beginPath();
  ctx.arc(480, 225, 225, 0, Math.PI * 2);
  ctx.fill();

  // Left Cyan Originium Spire
  ctx.beginPath();
  ctx.moveTo(0, 450);
  ctx.lineTo(0, 80);
  ctx.lineTo(135, 0);
  ctx.lineTo(185, 140);
  ctx.lineTo(115, 450);
  ctx.closePath();
  ctx.fillStyle = '#253863';
  ctx.fill();
  ctx.strokeStyle = '#38e8ff';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(88, 25);
  ctx.lineTo(105, 130);
  ctx.lineTo(74, 235);
  ctx.lineTo(95, 360);
  ctx.stroke();

  // Alien Cliff Ridge
  ctx.beginPath();
  ctx.moveTo(0, 430);
  ctx.quadraticCurveTo(480, 385, 960, 425);
  ctx.lineTo(960, 540);
  ctx.lineTo(0, 540);
  ctx.closePath();
  ctx.fillStyle = '#1e2852';
  ctx.fill();

  // Cast under Talos
  ctx.drawImage(getStandeeCanvas('mysterious_sarkaz', 'neutral'), 38, 175, 285, 285);
  ctx.drawImage(getStandeeCanvas('camille', 'neutral'), 245, 185, 275, 275);
  ctx.drawImage(getStandeeCanvas('last_rite', 'happy'), 418, 170, 295, 295);
  ctx.drawImage(getStandeeCanvas('ardashir', 'deadpan'), 645, 170, 295, 295);

  // Ardashir's polite wooden placard sign: "I AM NOT A SARKAZ."
  ctx.save();
  ctx.translate(770, 128);
  ctx.rotate(0.05);
  ctx.fillStyle = '#4a3728';
  ctx.fillRect(-5, 20, 10, 95);
  roundRect(ctx, -132, -32, 264, 62, 10);
  ctx.fillStyle = '#f8fafc';
  ctx.fill();
  ctx.lineWidth = 4.5;
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.fillStyle = '#1e293b';
  ctx.font = '800 20px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('"I AM NOT A SARKAZ."', 0, -1);
  ctx.restore();
}

function drawEnd5SauinNeverExists(ctx) {
  // Glorious Studio Meltdown: Suppressor on Moon + Camille Grilling Steaks + Yvonne Cackling + Director!
  const g = ctx.createLinearGradient(0, 0, 0, 540);
  g.addColorStop(0, '#240b1c');
  g.addColorStop(0.5, '#6e1a2c');
  g.addColorStop(1, '#d94826');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 960, 540);

  // Moon with Giant Bolted Originium Suppressor in upper-right sky (cleanly separated from Yvonne's horns!)
  ctx.beginPath();
  ctx.arc(578, 134, 102, 0, Math.PI * 2);
  ctx.fillStyle = '#e0e7ff';
  ctx.fill();
  ctx.drawImage(getStandeeCanvas('suppressor'), 484, 38, 192, 192);

  // Sideways Ricocheting Fireworks Streaks!
  ctx.strokeStyle = '#ffe066';
  ctx.lineWidth = 6;
  ctx.setLineDash([18, 12]);
  ctx.beginPath();
  ctx.moveTo(40, 210);
  ctx.quadraticCurveTo(420, 90, 900, 240);
  ctx.stroke();
  ctx.setLineDash([]);

  // Chaotic Stage Floor
  ctx.fillStyle = '#2b161e';
  ctx.fillRect(0, 420, 960, 120);

  // Left: Camille calmly grilling Roast Burdenbeast Steaks amid smoke!
  ctx.drawImage(getStandeeCanvas('camille', 'deadpan'), 14, 175, 276, 276);
  ctx.drawImage(getStandeeCanvas('roast_steak'), 172, 318, 162, 162);

  // Center-Left: Yvonne cackling atop Candy Chest & Fireworks!
  ctx.drawImage(getStandeeCanvas('candy_chest'), 332, 318, 188, 188);
  ctx.drawImage(getStandeeCanvas('yvonne', 'happy'), 288, 124, 280, 280);
  ctx.drawImage(getStandeeCanvas('fireworks'), 522, 308, 168, 168);

  // Right: Panicking Sarkaz Director shouting "CUT?!!"
  ctx.drawImage(getStandeeCanvas('sarkaz_director', 'shocked'), 668, 175, 280, 280);

  ctx.save();
  ctx.translate(795, 126);
  ctx.rotate(0.08);
  roundRect(ctx, -84, -28, 168, 52, 14);
  ctx.fillStyle = '#fff5f5';
  ctx.fill();
  ctx.lineWidth = 4.5;
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.fillStyle = '#c92a2a';
  ctx.font = '900 22px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('CUT?! CUT!!', 0, -2);
  ctx.restore();
}

const ENDING_DRAWERS = {
  END1: drawEnd1StrangeSauin,
  END2: drawEnd2SauinUniverse,
  END3: drawEnd3UnendingParade,
  END4: drawEnd4SauinAndSarkaz,
  END5: drawEnd5SauinNeverExists,
};

function drawBatCornerSticker(ctx, x, y, scale = 1, rot = -0.18) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(scale, scale);

  // White die-cut sticker halo + crimson bat wings & little ears
  for (const pass of ['halo', 'fill']) {
    ctx.beginPath();
    ctx.moveTo(0, -14);
    ctx.quadraticCurveTo(18, -30, 42, -14);
    ctx.quadraticCurveTo(28, -2, 30, 10);
    ctx.quadraticCurveTo(14, 4, 0, 16);
    ctx.quadraticCurveTo(-14, 4, -30, 10);
    ctx.quadraticCurveTo(-28, -2, -42, -14);
    ctx.quadraticCurveTo(-18, -30, 0, -14);
    ctx.closePath();
    if (pass === 'halo') {
      ctx.lineWidth = 10;
      ctx.strokeStyle = '#fff9ee';
      ctx.stroke();
    } else {
      ctx.fillStyle = '#c92a2a';
      ctx.fill();
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = INK;
      ctx.stroke();
    }
  }
  // Cute bat ears & golden eyes
  for (const dir of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(dir * 4, -12);
    ctx.lineTo(dir * 10, -24);
    ctx.lineTo(dir * 13, -10);
    ctx.closePath();
    ctx.fillStyle = '#c92a2a';
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ffe066';
    ctx.beginPath();
    ctx.arc(dir * 6, -4, 2.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/**
 * Returns a cached 960x540 HTMLCanvasElement with the full Ending illustration.
 */
export function getEndingCanvas(endingId = 'END1') {
  const cleanId = ENDING_IDS.includes(endingId) ? endingId : 'END1';
  if (_endingCanvasCache.has(cleanId)) {
    return _endingCanvasCache.get(cleanId);
  }
  const canvas = document.createElement('canvas');
  canvas.width = 960;
  canvas.height = 540;
  const ctx = canvas.getContext('2d');
  const fn = ENDING_DRAWERS[cleanId] || drawEnd1StrangeSauin;
  fn(ctx);

  // Subtle cinema vignette & 35mm warm grain border
  const vig = ctx.createRadialGradient(480, 270, 280, 480, 270, 560);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(12, 6, 16, 0.34)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, 960, 540);

  // Cute die-cut crimson Sauin bat corner stickers matching video Polaroid frames
  drawBatCornerSticker(ctx, 48, 36, 0.78, -0.22);
  drawBatCornerSticker(ctx, 912, 38, 0.72, 0.2);

  _endingCanvasCache.set(cleanId, canvas);
  return canvas;
}

/**
 * Draws the Ending illustration cleanly onto any target <canvas>.
 */
export function drawEndingIllustration(canvas, endingId = 'END1') {
  if (!canvas || typeof canvas.getContext !== 'function') return canvas;
  if (!canvas.width) canvas.width = 960;
  if (!canvas.height) canvas.height = 540;
  const src = getEndingCanvas(endingId);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(src, 0, 0, canvas.width, canvas.height);
  return canvas;
}

/**
 * Returns a cached PNG DataURL (960x540) for <img src="..."> in ending_view / album_modal.
 */
export function getEndingDataURL(endingId = 'END1') {
  const cleanId = ENDING_IDS.includes(endingId) ? endingId : 'END1';
  if (_endingUrlCache.has(cleanId)) {
    return _endingUrlCache.get(cleanId);
  }
  const url = getEndingCanvas(cleanId).toDataURL('image/png');
  _endingUrlCache.set(cleanId, url);
  return url;
}

export const getEndingIllustrationDataURL = getEndingDataURL;

/**
 * Returns a pooled THREE.CanvasTexture in SRGBColorSpace for 3D stage Polaroid presentation.
 */
export function getEndingTexture(THREE, endingId = 'END1') {
  const cleanId = ENDING_IDS.includes(endingId) ? endingId : 'END1';
  if (_endingTexCache.has(cleanId)) {
    return _endingTexCache.get(cleanId);
  }
  const tex = new THREE.CanvasTexture(getEndingCanvas(cleanId));
  if (THREE.SRGBColorSpace) {
    tex.colorSpace = THREE.SRGBColorSpace;
  }
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  _endingTexCache.set(cleanId, tex);
  return tex;
}

export function disposeEndingTextures() {
  for (const tex of _endingTexCache.values()) {
    tex.dispose();
  }
  _endingTexCache.clear();
}
