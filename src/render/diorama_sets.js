// 5 Multi-Layer 3D Pop-Up Diorama Stage Sets + Interactive 3D Stage Gags + Dynamic Viewfinder Slots
// Built incrementally via initSlice() (zero sync compile stall) and pooled cleanly (zero reshoot leaks).

import * as THREE from '../../vendor/three.module.min.js';
import { getStandeeTexture } from './chibi_atlas.js';

const INK = '#18151e';

function makeCanvasTexture(w, h, drawFn) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  drawFn(ctx, w, h);
  const tex = new THREE.CanvasTexture(c);
  if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return tex;
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

// ============================================================================
// BESPOKE LAYERED POP-UP BACKDROP PAINTERS FOR ACTS 1..5
// ============================================================================

function buildAct1SarkazStudyLayers() {
  // Back Wall: Warm Victorian-Sarkaz amber study, glowing lattice windows, gargoyle frame
  const backTex = makeCanvasTexture(1024, 576, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#6e3d28');
    g.addColorStop(0.65, '#9c5c3c');
    g.addColorStop(1, '#593120');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // Wainscoting wood panels
    ctx.fillStyle = '#522b1b';
    ctx.fillRect(0, h * 0.68, w, h * 0.32);
    ctx.strokeStyle = '#3b1d11';
    ctx.lineWidth = 4;
    for (let px = 40; px < w; px += 160) {
      ctx.strokeRect(px, h * 0.72, 125, h * 0.22);
    }

    // Glowing tall amber window on right half (matching [00:26] & [01:05])
    roundRect(ctx, 540, 48, 390, 340, 8);
    const wg = ctx.createLinearGradient(540, 48, 540, 388);
    wg.addColorStop(0, '#ffe8ba');
    wg.addColorStop(1, '#f5b06c');
    ctx.fillStyle = wg;
    ctx.fill();
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#5c321e';
    ctx.stroke();

    // Window mullions
    ctx.fillStyle = '#6e3b23';
    ctx.fillRect(728, 48, 14, 340);
    ctx.fillRect(540, 175, 390, 12);
    ctx.fillRect(540, 285, 390, 12);

    // Warm draped curtains flanking the study window
    ctx.fillStyle = '#b56d45';
    ctx.beginPath();
    ctx.moveTo(520, 38);
    ctx.quadraticCurveTo(615, 200, 565, 405);
    ctx.lineTo(510, 405);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(950, 38);
    ctx.quadraticCurveTo(860, 200, 905, 405);
    ctx.lineTo(960, 405);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Framed Spooky Gargoyle Silhouette Painting on Left Wall!
    roundRect(ctx, 88, 56, 175, 220, 6);
    ctx.fillStyle = '#f2dec4';
    ctx.fill();
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#6b3b24';
    ctx.stroke();
    // Cute horned silhouette inside portrait
    ctx.fillStyle = '#b89272';
    ctx.beginPath();
    ctx.arc(175, 165, 42, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(145, 132);
    ctx.lineTo(122, 95);
    ctx.lineTo(162, 124);
    ctx.moveTo(205, 132);
    ctx.lineTo(228, 95);
    ctx.lineTo(188, 124);
    ctx.fill();
  });

  // Mid Pop-Up Cutout: Tall Oak Bookcase + Porcelain Flower Vase + Plush Study Sofa
  const midTex = makeCanvasTexture(1024, 576, (ctx) => {
    // Tall Oak Bookcase in center-left
    roundRect(ctx, 310, 108, 200, 370, 6);
    ctx.fillStyle = '#8c5334';
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#3d2012';
    ctx.stroke();

    const shelfY = [130, 215, 300, 385];
    const bookCols = ['#c96f4b', '#d9a76c', '#6e4730', '#b5835a', '#8a4236'];
    shelfY.forEach((sy, sIdx) => {
      ctx.fillStyle = '#4f2a18';
      ctx.fillRect(324, sy, 172, 72);
      for (let bx = 330, i = 0; bx < 482; bx += 22, i++) {
        const bh = 52 + ((i + sIdx) % 3) * 7;
        ctx.fillStyle = bookCols[(i + sIdx) % bookCols.length];
        ctx.fillRect(bx, sy + (70 - bh), 18, bh);
        ctx.strokeStyle = '#2e180d';
        ctx.lineWidth = 2;
        ctx.strokeRect(bx, sy + (70 - bh), 18, bh);
      }
    });

    // Side Cabinet + White Porcelain Flower Vase on left
    roundRect(ctx, 140, 330, 155, 148, 6);
    ctx.fillStyle = '#7d462b';
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(218, 302, 26, 32, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#efe5dc';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.stroke();
    // Tiny white flowers
    ctx.fillStyle = '#ffffff';
    for (const [fx, fy] of [[204, 255], [220, 246], [234, 258]]) {
      ctx.beginPath();
      ctx.arc(fx, fy, 9, 0, Math.PI * 2);
      ctx.fill();
    }

    // Plush Warm Sofa on right
    roundRect(ctx, 520, 295, 395, 178, 32);
    ctx.fillStyle = '#a86844';
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#4a2716';
    ctx.stroke();
    roundRect(ctx, 500, 345, 435, 132, 24);
    ctx.fillStyle = '#915535';
    ctx.fill();
    ctx.stroke();
  });

  // Gag Texture: Cute White Ghost-Bunny peeking out!
  const gagTex = makeCanvasTexture(256, 256, (ctx) => {
    ctx.translate(128, 148);
    // Bunny ears
    for (const dir of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(dir * 26, -78, 16, 42, dir * 0.14, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.lineWidth = 6;
      ctx.strokeStyle = INK;
      ctx.stroke();
    }
    // Sheet body
    ctx.beginPath();
    ctx.moveTo(-58, 72);
    ctx.quadraticCurveTo(-62, -56, 0, -56);
    ctx.quadraticCurveTo(62, -56, 58, 72);
    ctx.quadraticCurveTo(32, 54, 16, 72);
    ctx.quadraticCurveTo(0, 86, -18, 70);
    ctx.quadraticCurveTo(-38, 54, -58, 72);
    ctx.closePath();
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.stroke();

    // Glowing yellow oval eyes!
    ctx.fillStyle = '#fcc419';
    ctx.beginPath();
    ctx.ellipse(-18, -14, 8, 14, 0, 0, Math.PI * 2);
    ctx.ellipse(18, -14, 8, 14, 0, 0, Math.PI * 2);
    ctx.fill();
  });

  return { backTex, midTex, gagTex, floorColor: 0xc99b78 };
}

function buildAct2FangquStreetLayers() {
  // Back Sky: Starry night Wuling skyline, glowing candy shopfront with tiled eaves & striped awning, festival lanterns
  const backTex = makeCanvasTexture(1024, 576, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#0d1526');
    g.addColorStop(0.6, '#1a2f45');
    g.addColorStop(1, '#2b4a5e');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // Twinkling stars
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 48; i++) {
      const sx = (i * 197 + 41) % w;
      const sy = (i * 89 + 19) % 240;
      ctx.fillRect(sx, sy, (i % 2) + 2, (i % 2) + 2);
    }

    // Distant Wuling commercial skyline silhouettes on right
    ctx.fillStyle = '#16283b';
    ctx.fillRect(760, 95, 115, 290);
    ctx.fillRect(885, 130, 110, 255);
    ctx.fillStyle = 'rgba(255, 240, 179, 0.45)';
    for (let wy = 120; wy < 310; wy += 32) {
      ctx.fillRect(782, wy, 24, 14);
      ctx.fillRect(826, wy, 24, 14);
      ctx.fillRect(908, wy + 16, 26, 14);
    }

    // Left Wuling Candy & Tea Pavilion Shopfront!
    roundRect(ctx, 42, 74, 368, 316, 8);
    ctx.fillStyle = '#243f4d';
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#13242e';
    ctx.stroke();

    // Sweeping dark-teal Wuling tiled roof eaves
    ctx.beginPath();
    ctx.moveTo(22, 86);
    ctx.quadraticCurveTo(226, 48, 430, 86);
    ctx.lineTo(416, 108);
    ctx.lineTo(36, 108);
    ctx.closePath();
    ctx.fillStyle = '#183642';
    ctx.fill();
    ctx.stroke();

    // Glowing golden paned shop windows with colorful candy jars!
    for (const wx of [74, 240]) {
      roundRect(ctx, wx, 188, 138, 128, 8);
      ctx.fillStyle = '#ffe8a3';
      ctx.fill();
      ctx.lineWidth = 4.5;
      ctx.strokeStyle = '#3b2820';
      ctx.stroke();
      // Candy jars on sill
      const jarCols = ['#ff6b9d', '#63e6be', '#ffa94d'];
      for (let j = 0; j < 3; j++) {
        roundRect(ctx, wx + 18 + j * 38, 272, 26, 36, 6);
        ctx.fillStyle = jarCols[j];
        ctx.fill();
        ctx.stroke();
      }
      // Window mullions
      ctx.beginPath();
      ctx.moveTo(wx + 69, 188);
      ctx.lineTo(wx + 69, 316);
      ctx.moveTo(wx, 246);
      ctx.lineTo(wx + 138, 246);
      ctx.stroke();
    }

    // Scalloped crimson & cream striped shop awning!
    const awX = 56;
    const awY = 148;
    const stripes = 8;
    const sw = 340 / stripes;
    for (let i = 0; i < stripes; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#d94848' : '#fff4e0';
      ctx.beginPath();
      ctx.rect(awX + i * sw, awY, sw, 36);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(awX + (i + 0.5) * sw, awY + 36, sw * 0.5, 0, Math.PI);
      ctx.fill();
    }
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#2b1b18';
    ctx.strokeRect(awX, awY, 340, 36);

    // Warm festival string lights & hanging Sauin lanterns across plaza!
    ctx.strokeStyle = '#5c7c8a';
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.moveTo(410, 175);
    ctx.quadraticCurveTo(640, 238, 960, 168);
    ctx.stroke();
    for (let i = 0; i < 8; i++) {
      const t = (i + 0.5) / 8;
      const lx = 410 + t * 550;
      const ly = (1 - t) * (1 - t) * 175 + 2 * (1 - t) * t * 238 + t * t * 168;
      roundRect(ctx, lx - 11, ly + 4, 22, 28, 8);
      ctx.fillStyle = i % 2 === 0 ? '#ffd43b' : '#ff8787';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#2b1b18';
      ctx.stroke();
    }
  });

  // Mid Pop-Up Cutout: Wide Plaza Stone Steps + Twin Modern Streetlamps + Blossom Hedge + Striped Cafe Parasol
  const midTex = makeCanvasTexture(1024, 576, (ctx) => {
    // Trimmed lush green hedge dotted with pink Wuling blossoms
    ctx.beginPath();
    ctx.arc(625, 322, 74, Math.PI, 0);
    ctx.arc(720, 330, 58, Math.PI, 0);
    ctx.closePath();
    ctx.fillStyle = '#74b816';
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#233d1b';
    ctx.stroke();
    for (const [bx, by] of [[595, 286], [635, 272], [672, 294], [718, 292], [748, 308]]) {
      ctx.fillStyle = '#ff85a1';
      ctx.beginPath();
      ctx.arc(bx, by, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Fangqu Night Cafe Striped Parasol + Pole + Bistro Table on right
    ctx.fillStyle = '#475569';
    ctx.fillRect(884, 198, 10, 175);
    ctx.beginPath();
    ctx.ellipse(889, 346, 56, 14, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#cbd5e1';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#2c4240';
    ctx.stroke();

    // Ribbed Cafe Umbrella Canopy
    const ribs = [
      [768, 208, 845, 208, '#38b2ac'],
      [845, 208, 932, 208, '#fff9db'],
      [932, 208, 1008, 208, '#38b2ac'],
    ];
    for (const [x1, y1, x2, y2, col] of ribs) {
      ctx.beginPath();
      ctx.moveTo(889, 126);
      ctx.lineTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.closePath();
      ctx.fillStyle = col;
      ctx.fill();
      ctx.lineWidth = 4.5;
      ctx.strokeStyle = '#1f3338';
      ctx.stroke();
    }

    // Wide Commercial Plaza Steps
    const steps = [
      [250, 325, 560, 42, '#d8e6eb'],
      [220, 367, 620, 44, '#bfd6de'],
      [180, 411, 700, 48, '#a3c1cc'],
    ];
    for (const [sx, sy, sw, sh, col] of steps) {
      ctx.fillStyle = col;
      ctx.fillRect(sx, sy, sw, sh);
      ctx.strokeStyle = '#3d5a68';
      ctx.lineWidth = 4;
      ctx.strokeRect(sx, sy, sw, sh);
    }

    // Twin Modern Square-Halo Streetlamps
    for (const lx of [395, 748]) {
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(lx - 5, 195, 10, 140);
      ctx.fillStyle = 'rgba(255, 243, 191, 0.35)';
      ctx.beginPath();
      ctx.arc(lx, 192, 34, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff3bf';
      ctx.lineWidth = 5;
      ctx.strokeRect(lx - 24, 184, 48, 14);
    }
  });

  // Gag Texture: Glowing Winking Mascot Neon Sign!
  const gagTex = makeCanvasTexture(256, 256, (ctx) => {
    ctx.translate(128, 128);
    ctx.beginPath();
    ctx.arc(0, 0, 88, 0, Math.PI * 2);
    ctx.fillStyle = '#e3f2fd';
    ctx.fill();
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#38d9a9';
    ctx.stroke();

    // Cute mascot wink > o + blush
    ctx.strokeStyle = '#2b4a5e';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-42, -14);
    ctx.lineTo(-18, 0);
    ctx.lineTo(-42, 14);
    ctx.stroke();
    ctx.fillStyle = '#2b4a5e';
    ctx.beginPath();
    ctx.arc(28, 0, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffa8a8';
    ctx.beginPath();
    ctx.arc(-34, 28, 12, 0, Math.PI * 2);
    ctx.arc(34, 28, 12, 0, Math.PI * 2);
    ctx.fill();
  });

  return { backTex, midTex, gagTex, floorColor: 0x5c7d8a };
}

function buildAct3WildernessCampLayers() {
  // Back Sky: Full glowing silver moon, dark jagged crags, misty indigo valley
  const backTex = makeCanvasTexture(1024, 576, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#0e131f');
    g.addColorStop(0.55, '#3b4968');
    g.addColorStop(1, '#263547');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // Jagged upper dark crag canopy matching [01:46]
    ctx.fillStyle = '#12151c';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(w, 0);
    ctx.lineTo(w, 110);
    ctx.lineTo(840, 40);
    ctx.lineTo(720, 130);
    ctx.lineTo(540, 55);
    ctx.lineTo(390, 120);
    ctx.lineTo(180, 45);
    ctx.lineTo(0, 135);
    ctx.closePath();
    ctx.fill();

    // Full Silver Moon
    const mg = ctx.createRadialGradient(640, 118, 8, 640, 118, 68);
    mg.addColorStop(0, '#ffffff');
    mg.addColorStop(0.5, '#f8fafc');
    mg.addColorStop(1, 'rgba(203, 213, 225, 0)');
    ctx.fillStyle = mg;
    ctx.beginPath();
    ctx.arc(640, 118, 68, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(640, 118, 26, 0, Math.PI * 2);
    ctx.fill();

    // Fluffy moonlit forest foliage mounds
    ctx.fillStyle = '#5c727d';
    for (const [fx, fy, fr] of [[280, 290, 110], [420, 250, 125], [850, 295, 115]]) {
      ctx.beginPath();
      ctx.arc(fx, fy, fr, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  // Mid Pop-Up Cutout: Pitched Canvas Tent + Warm Campfire & Logs (clear of Landbreaker on left!)
  const midTex = makeCanvasTexture(1024, 576, (ctx) => {
    // Far-left silhouette camp pines (clear of Landbreaker at x ~ 220..340)
    for (const [px, py, pw, ph] of [[58, 228, 52, 198], [108, 268, 42, 158]]) {
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + pw, py + ph);
      ctx.lineTo(px - pw, py + ph);
      ctx.closePath();
      ctx.fillStyle = '#1c2b38';
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#111a24';
      ctx.stroke();
    }

    // Pitched A-Frame Canvas Camp Tent matching [01:46]!
    ctx.beginPath();
    ctx.moveTo(435, 425);
    ctx.lineTo(575, 185);
    ctx.lineTo(685, 178);
    ctx.lineTo(835, 415);
    ctx.closePath();
    ctx.fillStyle = '#aec2cf';
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#25303b';
    ctx.stroke();

    // Tent dark interior triangle flap
    ctx.beginPath();
    ctx.moveTo(595, 425);
    ctx.lineTo(682, 182);
    ctx.lineTo(768, 420);
    ctx.closePath();
    ctx.fillStyle = '#4c5b69';
    ctx.fill();
    ctx.stroke();
    // Wooden tent pole
    ctx.fillStyle = '#e9ecef';
    ctx.fillRect(678, 165, 9, 268);

    // Warm crackling campfire + wooden log seat in center-left clearing (x = 355..465)
    const fg = ctx.createRadialGradient(408, 392, 6, 408, 392, 64);
    fg.addColorStop(0, 'rgba(255, 224, 102, 0.85)');
    fg.addColorStop(0.55, 'rgba(255, 135, 55, 0.42)');
    fg.addColorStop(1, 'rgba(255, 135, 55, 0)');
    ctx.fillStyle = fg;
    ctx.beginPath();
    ctx.arc(408, 392, 64, 0, Math.PI * 2);
    ctx.fill();

    // Crossed firewood logs
    ctx.fillStyle = '#6e4228';
    ctx.strokeStyle = '#24150e';
    ctx.lineWidth = 4;
    roundRect(ctx, 368, 408, 82, 18, 7);
    ctx.fill();
    ctx.stroke();
    // Campfire flame
    ctx.beginPath();
    ctx.moveTo(392, 410);
    ctx.quadraticCurveTo(408, 352, 424, 410);
    ctx.closePath();
    ctx.fillStyle = '#ff922b';
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(399, 410);
    ctx.quadraticCurveTo(408, 372, 417, 410);
    ctx.closePath();
    ctx.fillStyle = '#ffe066';
    ctx.fill();

    // Stolen Candy Chest tucked beside right tent edge (x = 852..972, clear of Landbreaker & right slot!)
    ctx.beginPath();
    ctx.arc(912, 358, 56, Math.PI, 0);
    ctx.closePath();
    ctx.fillStyle = '#7c5338';
    ctx.fill();
    ctx.lineWidth = 4.5;
    ctx.strokeStyle = '#24150e';
    ctx.stroke();
    for (const [cx, cy, cr, col] of [
      [876, 360, 12, '#ff85a1'],
      [898, 352, 13, '#ffe066'],
      [922, 352, 13, '#74c0fc'],
      [944, 360, 12, '#63e6be'],
      [910, 364, 12, '#b197fc'],
    ]) {
      ctx.beginPath();
      ctx.arc(cx, cy, cr, 0, Math.PI * 2);
      ctx.fillStyle = col;
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#24150e';
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(852, 366);
    ctx.lineTo(972, 366);
    ctx.lineTo(960, 424);
    ctx.lineTo(864, 424);
    ctx.closePath();
    ctx.fillStyle = '#9c6f4f';
    ctx.fill();
    ctx.lineWidth = 4.5;
    ctx.strokeStyle = '#24150e';
    ctx.stroke();
    roundRect(ctx, 901, 362, 22, 18, 4);
    ctx.fillStyle = '#ffd43b';
    ctx.fill();
    ctx.stroke();
  });

  // Gag Texture: Trio of Ghost-Bunnies in Pumpkin Caps peeking from the tent!
  const gagTex = makeCanvasTexture(256, 256, (ctx) => {
    for (const [bx, by, sc] of [[76, 155, 0.72], [180, 160, 0.72], [128, 138, 0.9]]) {
      ctx.save();
      ctx.translate(bx, by);
      ctx.scale(sc, sc);
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = INK;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.ellipse(-16, -62, 11, 30, -0.1, 0, Math.PI * 2);
      ctx.ellipse(16, -62, 11, 30, 0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, 44, Math.PI, 0);
      ctx.lineTo(44, 52);
      ctx.lineTo(-44, 52);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Tiny pumpkin hat
      ctx.fillStyle = '#f76707';
      ctx.beginPath();
      ctx.ellipse(0, -38, 22, 13, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Eyes
      ctx.fillStyle = '#fcc419';
      ctx.beginPath();
      ctx.arc(-14, -8, 6, 0, Math.PI * 2);
      ctx.arc(14, -8, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  });

  return { backTex, midTex, gagTex, floorColor: 0x2c3638 };
}

function buildAct4OutpostAvenueLayers() {
  // Back Sky: Starlit night + sleek Endfield Outpost Industrial Building with glowing lime strip!
  const backTex = makeCanvasTexture(1024, 576, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#0f1322');
    g.addColorStop(0.65, '#1d2740');
    g.addColorStop(1, '#2b3852');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 42; i++) {
      ctx.fillRect((i * 211 + 33) % w, (i * 79 + 15) % 270, 2.5, 2.5);
    }

    // Sleek angled Endfield Outpost Depot Building on right matching [02:10] & [02:25]!
    ctx.beginPath();
    ctx.moveTo(520, 420);
    ctx.lineTo(520, 145);
    ctx.lineTo(890, 48);
    ctx.lineTo(980, 48);
    ctx.lineTo(980, 420);
    ctx.closePath();
    ctx.fillStyle = '#6c7c8c';
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#25303d';
    ctx.stroke();

    // Glowing Lime-Yellow Endfield Vertical Energy Strip!
    ctx.fillStyle = '#d8f564';
    ctx.fillRect(838, 68, 42, 345);
    ctx.fillStyle = '#94d82d';
    ctx.fillRect(838, 175, 42, 95);
  });

  // Mid Pop-Up Cutout: Rounded Emerald Night Trees + Cyan Streetlamps + Sidewalk
  const midTex = makeCanvasTexture(1024, 576, (ctx, w) => {
    // Lush stylized rounded night trees on left matching [02:25]
    const trees = [
      [145, 290, 68, 125, '#2b6e44'],
      [255, 275, 62, 138, '#378c56'],
      [365, 300, 56, 118, '#409e63'],
      [485, 310, 52, 108, '#4eb373'],
    ];
    for (const [tx, ty, rx, ry, col] of trees) {
      ctx.fillStyle = '#2d2320';
      ctx.fillRect(tx - 8, ty + 30, 16, 110);
      ctx.beginPath();
      ctx.ellipse(tx, ty, rx, ry, 0, 0, Math.PI * 2);
      ctx.fillStyle = col;
      ctx.fill();
      ctx.lineWidth = 4.5;
      ctx.strokeStyle = '#183824';
      ctx.stroke();
    }

    // Cyan-lit Outpost Streetlamp
    ctx.fillStyle = '#9be7ff';
    ctx.fillRect(455, 205, 10, 215);
    roundRect(ctx, 434, 194, 52, 14, 5);
    ctx.fillStyle = '#e3fafc';
    ctx.fill();

    // Outpost Avenue Curb
    ctx.fillStyle = '#5c6b7d';
    ctx.fillRect(0, 418, w, 46);
  });

  // Gag Texture: Dark-Teal Outpost Shrub with Last Rite's Peeking White Sarkaz Ears & Blush Eyes!
  const gagTex = makeCanvasTexture(256, 256, (ctx) => {
    ctx.translate(128, 152);
    // Pointed white Sarkaz ears poking out top of bush!
    for (const dir of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(dir * 16, -54);
      ctx.lineTo(dir * 52, -112);
      ctx.lineTo(dir * 62, -42);
      ctx.closePath();
      ctx.fillStyle = '#f8fafc';
      ctx.fill();
      ctx.lineWidth = 6;
      ctx.strokeStyle = INK;
      ctx.stroke();
    }
    // Fluffy dark-teal bush mound matching [02:25] (clean outer outline without inner circle seams!)
    for (const pass of ['outline', 'fill']) {
      for (const [bx, by, br] of [[-38, 12, 54], [38, 14, 52], [0, -18, 62]]) {
        ctx.beginPath();
        ctx.arc(bx, by, pass === 'outline' ? br + 5.5 : br, 0, Math.PI * 2);
        ctx.fillStyle = pass === 'outline' ? '#142925' : '#2b524a';
        ctx.fill();
      }
    }

    // Little shy peeking window inside bush showing Last Rite's bangs & eyes!
    roundRect(ctx, -34, -28, 68, 40, 14);
    ctx.fillStyle = '#fff0e6';
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#142925';
    ctx.stroke();
    ctx.fillStyle = '#22a2e8';
    ctx.fillRect(-32, -28, 64, 15);
    ctx.fillStyle = '#ea5b1c';
    ctx.beginPath();
    ctx.arc(-15, -4, 7, 0, Math.PI * 2);
    ctx.arc(15, -4, 7, 0, Math.PI * 2);
    ctx.fill();
  });

  // Plain Shrub Texture (shown when Last Rite IS already standing on stage, so she isn't duplicated!)
  const gagPlainTex = makeCanvasTexture(256, 256, (ctx) => {
    ctx.translate(128, 152);
    for (const pass of ['outline', 'fill']) {
      for (const [bx, by, br] of [[-38, 12, 54], [38, 14, 52], [0, -18, 62]]) {
        ctx.beginPath();
        ctx.arc(bx, by, pass === 'outline' ? br + 5.5 : br, 0, Math.PI * 2);
        ctx.fillStyle = pass === 'outline' ? '#142925' : '#2b524a';
        ctx.fill();
      }
    }
    // Subtle glowing lime-gold fireflies / foliage highlights
    for (const [fx, fy] of [[-26, -12], [22, -24], [8, 14], [-14, 22]]) {
      ctx.fillStyle = '#d8f564';
      ctx.beginPath();
      ctx.arc(fx, fy, 5.5, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  return { backTex, midTex, gagTex, gagPlainTex, floorColor: 0x495668 };
}

function buildAct5CliffTalosLayers() {
  // Back Sky: Starry Cosmos + Colossal Luminous Moon TALOS matching [02:30] & [02:52]!
  const backTex = makeCanvasTexture(1024, 576, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#070b1c');
    g.addColorStop(0.55, '#162454');
    g.addColorStop(1, '#2b3f82');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // Starfield
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 65; i++) {
      ctx.fillRect((i * 163 + 17) % w, (i * 97 + 11) % 420, (i % 2) + 1.8, (i % 2) + 1.8);
    }

    // Distant monolith silhouettes
    ctx.fillStyle = '#1c2c5e';
    ctx.beginPath();
    ctx.moveTo(410, 440);
    ctx.lineTo(422, 210);
    ctx.lineTo(440, 210);
    ctx.lineTo(455, 440);
    ctx.fill();

    // Colossal Luminous Moon TALOS filling right-center sky!
    const mx = 710;
    const my = 248;
    const mr = 238;
    const halo = ctx.createRadialGradient(mx, my, mr * 0.7, mx, my, mr * 1.25);
    halo.addColorStop(0, 'rgba(224, 235, 255, 0.95)');
    halo.addColorStop(0.65, 'rgba(165, 188, 255, 0.45)');
    halo.addColorStop(1, 'rgba(120, 145, 255, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(mx, my, mr * 1.25, 0, Math.PI * 2);
    ctx.fill();

    const moonGrad = ctx.createRadialGradient(mx - 60, my - 60, 20, mx, my, mr);
    moonGrad.addColorStop(0, '#ffffff');
    moonGrad.addColorStop(0.7, '#eef2ff');
    moonGrad.addColorStop(1, '#c7d2fe');
    ctx.fillStyle = moonGrad;
    ctx.beginPath();
    ctx.arc(mx, my, mr, 0, Math.PI * 2);
    ctx.fill();

    // Subtle lunar mare craters
    ctx.fillStyle = 'rgba(165, 180, 225, 0.28)';
    ctx.beginPath();
    ctx.ellipse(mx + 45, my - 35, 68, 42, 0.3, 0, Math.PI * 2);
    ctx.ellipse(mx - 35, my + 65, 52, 34, -0.2, 0, Math.PI * 2);
    ctx.fill();
  });

  // Mid Pop-Up Cutout: Fractured Left Originium Spire with Electric-Cyan Veins + Alien Ridge
  const midTex = makeCanvasTexture(1024, 576, (ctx, w) => {
    // Left Fractured Cliff & Originium Spire matching [02:30]!
    ctx.beginPath();
    ctx.moveTo(0, 460);
    ctx.lineTo(0, 0);
    ctx.lineTo(395, 0);
    ctx.lineTo(275, 165);
    ctx.lineTo(220, 315);
    ctx.lineTo(165, 460);
    ctx.closePath();
    ctx.fillStyle = '#33466e';
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#1b2642';
    ctx.stroke();

    // Glowing Electric-Cyan Originium Crystal Veins!
    ctx.strokeStyle = '#38e8ff';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(155, 10);
    ctx.lineTo(185, 95);
    ctx.lineTo(168, 165);
    ctx.lineTo(205, 245);
    ctx.lineTo(162, 375);
    ctx.stroke();

    // Windswept Indigo Alien Grass Ridge across bottom
    ctx.beginPath();
    ctx.moveTo(0, 425);
    ctx.quadraticCurveTo(480, 385, w, 405);
    ctx.lineTo(w, 576);
    ctx.lineTo(0, 576);
    ctx.closePath();
    ctx.fillStyle = '#3b4e82';
    ctx.fill();

    // Glowing cyan grass tufts (`vvv` matching [02:30]!)
    ctx.strokeStyle = '#66f2ff';
    ctx.lineWidth = 3.5;
    for (const [gx, gy] of [[380, 432], [530, 422], [685, 438], [820, 418], [910, 445]]) {
      ctx.beginPath();
      ctx.moveTo(gx - 8, gy - 10);
      ctx.lineTo(gx - 3, gy);
      ctx.lineTo(gx + 2, gy - 11);
      ctx.lineTo(gx + 7, gy);
      ctx.lineTo(gx + 12, gy - 9);
      ctx.stroke();
    }
  });

  // Gag Texture: Resonant Glowing Cyan Originium Crystal Cluster!
  const gagTex = makeCanvasTexture(256, 256, (ctx) => {
    ctx.translate(128, 175);
    const shards = [
      [-42, 0, -68, -95, -14, -82, '#22b8cf'],
      [38, 0, 68, -88, 16, -75, '#15aabf'],
      [-18, 8, 0, -138, 24, -108, '#66f2ff'],
    ];
    for (const [x1, y1, x2, y2, x3, y3, col] of shards) {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.lineTo(x3, y3);
      ctx.lineTo(x1 + 26, y1);
      ctx.closePath();
      ctx.fillStyle = col;
      ctx.fill();
      ctx.lineWidth = 5.5;
      ctx.strokeStyle = INK;
      ctx.stroke();
    }
  });

  return { backTex, midTex, gagTex, floorColor: 0x2b3b66 };
}

const SET_BUILDERS = {
  1: buildAct1SarkazStudyLayers,
  2: buildAct2FangquStreetLayers,
  3: buildAct3WildernessCampLayers,
  4: buildAct4OutpostAvenueLayers,
  5: buildAct5CliffTalosLayers,
};

const GAG_PLACEMENTS = {
  1: { id: 'gag_curtain_bunny', x: 2.38, y: -0.35, z: 0.42, w: 1.05, h: 1.15 },
  2: { id: 'gag_neon_wink', x: -1.85, y: 1.05, z: -1.15, w: 1.15, h: 1.15 },
  3: { id: 'gag_tent_rustle', x: 0.42, y: 0.72, z: -1.1, w: 1.25, h: 1.15 },
  4: { id: 'gag_bush_peek', x: 2.28, y: -0.42, z: 0.38, w: 1.25, h: 1.15 },
  5: { id: 'gag_crystal_chime', x: -2.25, y: 0.48, z: -0.85, w: 1.2, h: 1.25 },
};

// ============================================================================
// 3D STAGE SLOT VIEWFINDER TEXTURE BUILDERS (ACTOR MARK vs PROP MARK)
// ============================================================================

function createSlotFrameCanvas(slotKind, highlighted = false) {
  // Subtle 3D stage floor chalk mark & spotlight aura (complements @ui-hud's DOM viewfinder brackets cleanly without double text!)
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  const cx = 128;
  const cy = 128;
  const rg = ctx.createRadialGradient(cx, cy, 12, cx, cy, 112);
  if (highlighted) {
    rg.addColorStop(0, 'rgba(255, 224, 102, 0.52)');
    rg.addColorStop(0.65, 'rgba(255, 169, 77, 0.25)');
    rg.addColorStop(1, 'rgba(255, 169, 77, 0)');
  } else {
    rg.addColorStop(0, 'rgba(255, 238, 196, 0.28)');
    rg.addColorStop(0.65, 'rgba(224, 49, 49, 0.12)');
    rg.addColorStop(1, 'rgba(0, 0, 0, 0)');
  }
  ctx.fillStyle = rg;
  ctx.beginPath();
  ctx.arc(cx, cy, 112, 0, Math.PI * 2);
  ctx.fill();

  // Crisp theatrical chalk X + dashed stage mark circle!
  ctx.strokeStyle = highlighted ? '#ffe066' : slotKind === 'actor' ? '#ffa8a8' : '#ffd8a8';
  ctx.lineWidth = 5;
  ctx.setLineDash([14, 10]);
  ctx.beginPath();
  ctx.arc(cx, cy, 88, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - 24, cy - 24);
  ctx.lineTo(cx + 24, cy + 24);
  ctx.moveTo(cx + 24, cy - 24);
  ctx.lineTo(cx - 24, cy + 24);
  ctx.stroke();
  return c;
}

export function createDioramaSets(ctx, stageRoot) {
  const setsContainer = new THREE.Group();
  setsContainer.name = 'DioramaSetsContainer';
  stageRoot.add(setsContainer);

  // Shared geometries across all 5 sets so geometry count stays tiny!
  const backGeo = new THREE.PlaneGeometry(7.2, 4.05);
  const midGeo = new THREE.PlaneGeometry(6.7, 3.78);
  const floorGeo = new THREE.BoxGeometry(7.2, 0.22, 4.2);
  const slotPlaneGeo = new THREE.PlaneGeometry(2.18, 1.76);
  const slotHitGeo = new THREE.PlaneGeometry(2.5, 2.25);
  const gagHitGeo = new THREE.PlaneGeometry(1.55, 1.55);

  const builtSets = new Map();
  let nextSliceAct = 1;
  let activeActId = 1;

  // Colossal Suppressor for Act 5 take_5_4 (orbiting across Talos!)
  let colossalSuppressor = null;
  let colossalProgress = 0;
  let colossalTarget = 0;

  // Slot Viewfinder Frames (Left & Right) — persistent CanvasTexture per slot rig
  const slotCanvasMap = {
    actor_idle: createSlotFrameCanvas('actor', false),
    actor_hover: createSlotFrameCanvas('actor', true),
    prop_idle: createSlotFrameCanvas('prop', false),
    prop_hover: createSlotFrameCanvas('prop', true),
  };

  function makeSlotRig(side, xPos) {
    const g = new THREE.Group();
    g.position.set(xPos, -0.06, 0.36);

    const slotCanvas = document.createElement('canvas');
    slotCanvas.width = 256;
    slotCanvas.height = 256;
    const slotCtx = slotCanvas.getContext('2d');
    slotCtx.drawImage(slotCanvasMap.prop_idle, 0, 0, 256, 256);
    const slotTex = new THREE.CanvasTexture(slotCanvas);
    if (THREE.SRGBColorSpace) slotTex.colorSpace = THREE.SRGBColorSpace;
    slotTex.minFilter = THREE.LinearFilter;
    slotTex.magFilter = THREE.LinearFilter;
    slotTex.generateMipmaps = false;
    slotTex.needsUpdate = true;

    const visualMat = new THREE.MeshBasicMaterial({
      map: slotTex,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
      fog: false,
    });
    const visualMesh = new THREE.Mesh(slotPlaneGeo, visualMat);
    visualMesh.rotation.x = -Math.PI * 0.44;
    visualMesh.position.set(0, -1.24, 0.12);
    g.add(visualMesh);

    const hitMat = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      colorWrite: false,
      depthWrite: false,
    });
    const hitMesh = new THREE.Mesh(slotHitGeo, hitMat);
    hitMesh.position.z = 0.08;
    hitMesh.userData = {
      pickKind: 'slot',
      slotSide: side,
    };
    g.add(hitMesh);

    stageRoot.add(g);
    return {
      side,
      group: g,
      visualMesh,
      visualMat,
      slotCanvas,
      slotCtx,
      slotTex,
      drawnKey: 'prop_idle',
      hitMesh,
      slotKind: side === 'left' ? 'prop' : 'actor',
      hovered: false,
      filled: false,
    };
  }

  const leftSlot = makeSlotRig('left', -1.45);
  const rightSlot = makeSlotRig('right', 1.45);

  function syncSlotVisual(slotRig) {
    const key = `${slotRig.slotKind}_${slotRig.hovered ? 'hover' : 'idle'}`;
    if (slotRig.drawnKey !== key) {
      slotRig.drawnKey = key;
      slotRig.slotCtx.clearRect(0, 0, 256, 256);
      slotRig.slotCtx.drawImage(slotCanvasMap[key] || slotCanvasMap.actor_idle, 0, 0, 256, 256);
      slotRig.slotTex.needsUpdate = true;
    }
    // When filled with a puppet standee, keep subtle frame behind at reduced opacity
    slotRig.visualMat.opacity = slotRig.filled ? (slotRig.hovered ? 0.65 : 0.35) : 1.0;
  }

  function ensureSetBuilt(actId) {
    const id = Math.max(1, Math.min(5, Number(actId) || 1));
    if (builtSets.has(id)) return builtSets.get(id);

    const builder = SET_BUILDERS[id] || SET_BUILDERS[1];
    const { backTex, midTex, gagTex, gagPlainTex, floorColor } = builder();

    const group = new THREE.Group();
    group.name = `ActSet_${id}`;
    group.visible = id === activeActId;

    // Layer 1: Back Cyclorama
    const backMat = new THREE.MeshBasicMaterial({
      map: backTex,
      toneMapped: false,
      fog: false,
    });
    const backMesh = new THREE.Mesh(backGeo, backMat);
    backMesh.position.set(0, 0.38, -2.55);
    group.add(backMesh);

    // Act 5 Special: Colossal Orbiting Originium Suppressor eclipsing Moon Talos (for take_5_4)!
    if (id === 5) {
      const supTex = getStandeeTexture(THREE, 'suppressor', 'neutral');
      const supGeo = new THREE.PlaneGeometry(4.15, 4.15);
      const supMat = new THREE.MeshBasicMaterial({
        map: supTex,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        toneMapped: false,
        fog: false,
      });
      colossalSuppressor = new THREE.Mesh(supGeo, supMat);
      colossalSuppressor.position.set(1.12, 0.68, -2.12);
      colossalSuppressor.visible = false;
      group.add(colossalSuppressor);
    }

    // Layer 2: Mid Pop-Up Cutout
    const midMat = new THREE.MeshBasicMaterial({
      map: midTex,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
      fog: false,
    });
    const midMesh = new THREE.Mesh(midGeo, midMat);
    midMesh.position.set(0, 0.25, -1.45);
    group.add(midMesh);

    // Stage Deck Floor
    const floorMat = new THREE.MeshLambertMaterial({ color: floorColor });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.position.set(0, -1.48, -0.65);
    group.add(floorMesh);

    // Interactive 3D Stage Gag Prop + Generous Raycast Hit Plane!
    const gagSpec = GAG_PLACEMENTS[id] || GAG_PLACEMENTS[1];
    const gagGroup = new THREE.Group();
    gagGroup.position.set(gagSpec.x, gagSpec.y, gagSpec.z);

    const gagGeo = new THREE.PlaneGeometry(gagSpec.w, gagSpec.h);
    const gagMat = new THREE.MeshBasicMaterial({
      map: gagTex,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
      fog: false,
    });
    const gagVisual = new THREE.Mesh(gagGeo, gagMat);
    gagGroup.add(gagVisual);

    let gagPlainVisual = null;
    if (gagPlainTex) {
      const gagPlainMat = new THREE.MeshBasicMaterial({
        map: gagPlainTex,
        transparent: true,
        depthWrite: false,
        toneMapped: false,
        fog: false,
      });
      gagPlainVisual = new THREE.Mesh(gagGeo, gagPlainMat);
      gagPlainVisual.visible = false;
      gagGroup.add(gagPlainVisual);
    }

    const gagHitMat = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    const gagHit = new THREE.Mesh(gagHitGeo, gagHitMat);
    gagHit.position.z = 0.08;
    gagHit.userData = {
      pickKind: 'gag',
      gagId: gagSpec.id,
      actId: id,
    };
    gagGroup.add(gagHit);
    group.add(gagGroup);

    setsContainer.add(group);
    const entry = {
      id,
      group,
      gagGroup,
      gagVisual,
      gagPlainVisual,
      gagHit,
      gagId: gagSpec.id,
      baseGagPos: { x: gagSpec.x, y: gagSpec.y, z: gagSpec.z },
      gagBounce: 0,
    };
    builtSets.set(id, entry);
    return entry;
  }

  function initSlice() {
    if (nextSliceAct <= 5) {
      ensureSetBuilt(nextSliceAct);
      nextSliceAct += 1;
    }
    return nextSliceAct > 5;
  }

  function setActSet(actId) {
    const id = Math.max(1, Math.min(5, Number(actId) || 1));
    activeActId = id;
    ensureSetBuilt(id);

    for (const [k, entry] of builtSets.entries()) {
      entry.group.visible = k === id;
    }

    // Reset colossal moon suppressor unless triggered by take_5_4
    colossalTarget = 0;
    colossalProgress = 0;
    if (colossalSuppressor) {
      colossalSuppressor.visible = false;
      colossalSuppressor.material.opacity = 0;
    }

    // Dynamic Slot Order: Prop=left, Actor=right in Acts 1-3; Actor=left, Prop=right in Acts 4-5!
    const actDef = ctx?.levels?.ACTS?.[id];
    leftSlot.slotKind = actDef?.leftSlotKind || (id <= 3 ? 'prop' : 'actor');
    rightSlot.slotKind = actDef?.rightSlotKind || (id <= 3 ? 'actor' : 'prop');
    leftSlot.hitMesh.userData.slotKind = leftSlot.slotKind;
    rightSlot.hitMesh.userData.slotKind = rightSlot.slotKind;
    syncSlotVisual(leftSlot);
    syncSlotVisual(rightSlot);
  }

  function setColossalSuppressorActive(active) {
    colossalTarget = active ? 1 : 0;
    if (active) {
      ensureSetBuilt(5);
      if (colossalSuppressor) colossalSuppressor.visible = true;
    }
  }

  function triggerGagBounce(gagId) {
    for (const entry of builtSets.values()) {
      if (!gagId || entry.gagId === gagId || entry.id === activeActId) {
        entry.gagBounce = 1.0;
      }
    }
  }

  function setSlotState({ phase, actorId, propId, hoverKind }) {
    const showBrackets = phase === 'blocking';
    leftSlot.group.visible = showBrackets;
    rightSlot.group.visible = showBrackets;

    for (const rig of [leftSlot, rightSlot]) {
      rig.filled = rig.slotKind === 'actor' ? Boolean(actorId) : Boolean(propId);
      rig.hovered = Boolean(hoverKind && hoverKind === rig.slotKind);
      syncSlotVisual(rig);
    }
  }

  function getPickTargets() {
    const targets = [];
    if (leftSlot.group.visible) targets.push(leftSlot.hitMesh);
    if (rightSlot.group.visible) targets.push(rightSlot.hitMesh);
    const activeEntry = builtSets.get(activeActId);
    if (activeEntry && activeEntry.group.visible) {
      targets.push(activeEntry.gagHit);
    }
    return targets;
  }

  function getSlotRigForKind(slotKind) {
    return leftSlot.slotKind === slotKind ? leftSlot : rightSlot;
  }

  function getActiveGagEntry() {
    return builtSets.get(activeActId) || null;
  }

  function update(dt, simTime = 0) {
    const entry = builtSets.get(activeActId);
    if (entry) {
      // In Act 4, hide peeking Last Rite inside the shrub whenever Last Rite is currently standing on stage!
      if (entry.id === 4 && entry.gagPlainVisual) {
        const phase = ctx?.state?.phase || 'title';
        const onStageActor =
          phase === 'rolling' || phase === 'take_result'
            ? ctx?.state?.currentTake?.actorId || ctx?.state?.slots?.actorId
            : ctx?.state?.slots?.actorId;
        const lastRiteOnStage = phase === 'dialogue' || onStageActor === 'last_rite';
        entry.gagVisual.visible = !lastRiteOnStage;
        entry.gagPlainVisual.visible = lastRiteOnStage;
      }

      // Subtle lively idle float + joyful bounce when gag is tapped!
      if (entry.gagBounce > 0) {
        entry.gagBounce = Math.max(0, entry.gagBounce - dt * 2.4);
      }
      const b = entry.gagBounce;
      const idleBob = Math.sin(simTime * 2.8 + entry.id) * 0.04;
      const popY = Math.sin(b * Math.PI) * 0.34;
      const popScale = 1 + Math.sin(b * Math.PI * 2) * 0.16 * b;
      const rot = Math.sin(simTime * 2.1) * 0.04 + Math.sin(b * Math.PI * 4) * 0.18 * b;
      entry.gagGroup.position.set(
        entry.baseGagPos.x,
        entry.baseGagPos.y + idleBob + popY,
        entry.baseGagPos.z,
      );
      entry.gagVisual.scale.set(popScale, popScale, 1);
      entry.gagVisual.rotation.z = rot;
      if (entry.gagPlainVisual) {
        entry.gagPlainVisual.scale.set(popScale, popScale, 1);
        entry.gagPlainVisual.rotation.z = rot;
      }
    }

    // Pulse viewfinder slot frames gently during blocking
    for (const rig of [leftSlot, rightSlot]) {
      if (!rig.group.visible) continue;
      const s = rig.hovered
        ? 1.05 + Math.sin(simTime * 7.0) * 0.025
        : 1.0 + Math.sin(simTime * 3.0 + (rig.side === 'left' ? 0 : 1.5)) * 0.012;
      rig.visualMesh.scale.set(s, s, 1);
    }

    // Animate Colossal Orbiting Suppressor in Act 5 take_5_4!
    if (colossalSuppressor) {
      const rate = dt * 2.6;
      if (colossalProgress < colossalTarget) {
        colossalProgress = Math.min(colossalTarget, colossalProgress + rate);
      } else if (colossalProgress > colossalTarget) {
        colossalProgress = Math.max(colossalTarget, colossalProgress - rate);
      }
      colossalSuppressor.visible = colossalProgress > 0.01;
      colossalSuppressor.material.opacity = colossalProgress * 0.96;
      const hoverY = 0.62 + (1 - colossalProgress) * 1.15 + Math.sin(simTime * 1.8) * 0.05;
      colossalSuppressor.position.set(1.12, hoverY, -2.12);
      colossalSuppressor.rotation.z = -0.14 + Math.sin(simTime * 1.2) * 0.03;
    }
  }

  // Ensure Act 1 is ready right away
  setActSet(1);

  return {
    initSlice,
    setActSet,
    setColossalSuppressorActive,
    triggerGagBounce,
    setSlotState,
    getPickTargets,
    getSlotRigForKind,
    getActiveGagEntry,
    leftSlot,
    rightSlot,
    update,
  };
}
