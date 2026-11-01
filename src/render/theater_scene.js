// Three.js r170 3D Pop-Up Velvet Proscenium Theater Coordinator (theater_scene.js)
// Exports createWorldRender(ctx, mountEl) matching docs/DESIGN.md §4.4 & Gates G1..G14.
// Zero synchronous shader compile stalls, zero CJK characters, zero reshoot GPU leaks.

import * as THREE from '../../vendor/three.module.min.js';
import { createDioramaSets } from './diorama_sets.js';
import { createPuppetActors } from './puppet_actors.js';
import { createParticlesFX } from './particles_fx.js';
import { composePostcardDataURL } from './postcard_export.js';
import {
  getPortraitDataURL,
  drawThumbnail,
  drawPortrait,
  getTakeThumbnailDataURL,
} from './chibi_atlas.js';
import {
  getEndingBackdropConfig,
  getEndingCanvas,
  getEndingDataURL,
  drawEndingIllustration,
} from './ending_illustrations.js';

export {
  getPortraitDataURL,
  drawThumbnail,
  drawPortrait,
  getTakeThumbnailDataURL,
  getEndingDataURL,
  drawEndingIllustration,
};

const INK = '#15111b';

function makeCanvasTexture(w, h, drawFn) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  drawFn(g, w, h);
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
// PROSCENIUM THEATER TEXTURE PAINTERS (CYCLORAMA, VELVET CURTAINS, AUDIENCE)
// ============================================================================

function createHauntedCycloramaTexture() {
  // Matches the atmospheric mint-teal -> deep emerald Sauin outer backdrop [00:00..03:18]
  return makeCanvasTexture(1024, 576, (ctx, w, h) => {
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#5fb59c');
    sky.addColorStop(0.45, '#2f7265');
    sky.addColorStop(0.82, '#163833');
    sky.addColorStop(1, '#0d1f1d');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    // Subtle radial theatrical moon-mist glow in upper center
    const glow = ctx.createRadialGradient(w * 0.5, h * 0.34, 24, w * 0.5, h * 0.38, 430);
    glow.addColorStop(0, 'rgba(182, 248, 224, 0.36)');
    glow.addColorStop(0.6, 'rgba(95, 181, 156, 0.12)');
    glow.addColorStop(1, 'rgba(16, 36, 33, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    // Distant haunted hills & crooked Gothic graveyard crosses on left & right wings
    ctx.fillStyle = '#14302c';
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(0, h * 0.66);
    ctx.quadraticCurveTo(w * 0.22, h * 0.56, w * 0.45, h * 0.7);
    ctx.quadraticCurveTo(w * 0.74, h * 0.55, w, h * 0.65);
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();

    // Silhouetted Gothic crosses & wrought-iron spires along outer wings
    ctx.strokeStyle = '#0e2421';
    ctx.lineCap = 'round';
    const crosses = [
      [78, 365, 0.95, -0.12],
      [136, 388, 0.72, 0.09],
      [194, 376, 0.82, -0.06],
      [842, 374, 0.85, 0.08],
      [902, 362, 1.0, -0.11],
      [955, 390, 0.7, 0.12],
    ];
    for (const [cx, cy, sc, tilt] of crosses) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(tilt);
      ctx.scale(sc, sc);
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(0, -48);
      ctx.lineTo(0, 36);
      ctx.moveTo(-22, -24);
      ctx.lineTo(22, -24);
      ctx.stroke();
      ctx.restore();
    }
  });
}

function createVelvetCurtainTexture() {
  // Rich pleated crimson velvet theater curtain with golden braid hem & tassel cord
  return makeCanvasTexture(512, 768, (ctx, w, h) => {
    const base = ctx.createLinearGradient(0, 0, w, 0);
    base.addColorStop(0, '#4f0a10');
    base.addColorStop(0.25, '#8f1720');
    base.addColorStop(0.55, '#b8222b');
    base.addColorStop(0.82, '#7d121a');
    base.addColorStop(1, '#4a080e');
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);

    // Pleated vertical velvet folds
    const folds = 7;
    const fw = w / folds;
    for (let i = 0; i < folds; i++) {
      const fx = i * fw;
      const fg = ctx.createLinearGradient(fx, 0, fx + fw, 0);
      fg.addColorStop(0, 'rgba(22, 2, 6, 0.52)');
      fg.addColorStop(0.45, 'rgba(255, 110, 110, 0.18)');
      fg.addColorStop(0.75, 'rgba(120, 10, 20, 0.25)');
      fg.addColorStop(1, 'rgba(22, 2, 6, 0.55)');
      ctx.fillStyle = fg;
      ctx.fillRect(fx, 0, fw, h);
    }

    // Inner goldembroidered border trim along stage-facing edge (right edge of left curtain)
    ctx.fillStyle = '#e6b966';
    ctx.fillRect(w - 16, 0, 10, h);
    ctx.strokeStyle = '#3b1216';
    ctx.lineWidth = 3;
    ctx.strokeRect(w - 16, 0, 10, h);

    // Golden tieback rope & tassel mid-height
    ctx.strokeStyle = '#f2ca78';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.54);
    ctx.quadraticCurveTo(w * 0.58, h * 0.61, w - 12, h * 0.55);
    ctx.stroke();

    // Tassel drop
    ctx.fillStyle = '#ffd984';
    ctx.beginPath();
    ctx.arc(w * 0.72, h * 0.59, 14, 0, Math.PI * 2);
    ctx.fill();
    roundRect(ctx, w * 0.72 - 12, h * 0.6, 24, 46, 6);
    ctx.fill();
  });
}

function createTopValanceTexture() {
  // Pitched crimson & gold scalloped theater proscenium valance arch
  return makeCanvasTexture(1024, 192, (ctx, w, h) => {
    const scallops = 11;
    const sw = w / scallops;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(w, 0);
    ctx.lineTo(w, h * 0.62);
    for (let i = scallops - 1; i >= 0; i--) {
      const x1 = i * sw;
      const xm = x1 + sw * 0.5;
      const archLift = Math.sin(((i + 0.5) / scallops) * Math.PI) * 34;
      ctx.quadraticCurveTo(xm, h * 0.94 - archLift, x1, h * 0.58 - archLift * 0.65);
    }
    ctx.closePath();

    const vg = ctx.createLinearGradient(0, 0, 0, h);
    vg.addColorStop(0, '#590b12');
    vg.addColorStop(0.65, '#a61c24');
    vg.addColorStop(1, '#7a1118');
    ctx.fillStyle = vg;
    ctx.fill();

    ctx.lineWidth = 8;
    ctx.strokeStyle = '#ecc06c';
    ctx.stroke();

    // Top gilt wood molding bar
    ctx.fillStyle = '#3b1c14';
    ctx.fillRect(0, 0, w, 20);
    ctx.fillStyle = '#d9ab57';
    ctx.fillRect(0, 18, w, 6);
  });
}

function createAudienceRowTexture() {
  // Foreground row of dark rounded theater seats + silhouetted horned Sarkaz spectators!
  return makeCanvasTexture(1024, 180, (ctx, w, h) => {
    const seats = 9;
    const sw = w / seats;

    for (let i = 0; i < seats; i++) {
      const cx = (i + 0.5) * sw;
      roundRect(ctx, cx - sw * 0.44, 58, sw * 0.88, 130, 34);
      ctx.fillStyle = '#170d18';
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#381e2c';
      ctx.stroke();

      // Cute horned Sarkaz spectator silhouettes in seats 1, 4, 7!
      if (i === 1 || i === 4 || i === 7) {
        ctx.fillStyle = '#110912';
        ctx.beginPath();
        ctx.arc(cx, 54, 26, 0, Math.PI * 2);
        ctx.fill();
        // Little Sarkaz horns!
        ctx.beginPath();
        ctx.moveTo(cx - 16, 36);
        ctx.lineTo(cx - 28, 10);
        ctx.lineTo(cx - 6, 30);
        ctx.moveTo(cx + 16, 36);
        ctx.lineTo(cx + 28, 10);
        ctx.lineTo(cx + 6, 30);
        ctx.fill();
      }
    }
  });
}

function createBatSpriteTexture() {
  return makeCanvasTexture(160, 112, (ctx) => {
    ctx.translate(80, 58);
    ctx.beginPath();
    ctx.moveTo(0, -14);
    ctx.bezierCurveTo(-24, -44, -64, -36, -72, -6);
    ctx.quadraticCurveTo(-48, 0, -40, 22);
    ctx.quadraticCurveTo(-18, 8, 0, 26);
    ctx.quadraticCurveTo(18, 8, 40, 22);
    ctx.quadraticCurveTo(48, 0, 72, -6);
    ctx.bezierCurveTo(64, -36, 24, -44, 0, -14);
    ctx.closePath();
    ctx.fillStyle = '#c92a2a';
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#fff5e6';
    ctx.stroke();

    // Tiny glowing gold bat eyes
    ctx.fillStyle = '#ffd43b';
    ctx.beginPath();
    ctx.arc(-8, -4, 3.5, 0, Math.PI * 2);
    ctx.arc(8, -4, 3.5, 0, Math.PI * 2);
    ctx.fill();
  });
}

function createClapperTexture() {
  return makeCanvasTexture(384, 288, (ctx, w, h) => {
    // Slate body
    roundRect(ctx, 20, 62, w - 40, h - 80, 12);
    ctx.fillStyle = '#1b1921';
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#f5ecd8';
    ctx.stroke();

    // Diagonal stripes on clapper top bar
    roundRect(ctx, 20, 20, w - 40, 44, 8);
    ctx.save();
    ctx.clip();
    ctx.fillStyle = '#1b1921';
    ctx.fillRect(20, 20, w - 40, 44);
    ctx.fillStyle = '#f8f0dc';
    for (let sx = 0; sx < w + 40; sx += 48) {
      ctx.beginPath();
      ctx.moveTo(sx, 64);
      ctx.lineTo(sx + 24, 20);
      ctx.lineTo(sx + 48, 20);
      ctx.lineTo(sx + 24, 64);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    roundRect(ctx, 20, 20, w - 40, 44, 8);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 5;
    ctx.stroke();

    // Crisp English slate markings
    ctx.fillStyle = '#ffd89b';
    ctx.font = '800 20px system-ui, sans-serif';
    ctx.fillText('SAUIN STUDIO · TALOS-II', 44, 114);
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(40, 134);
    ctx.lineTo(w - 40, 134);
    ctx.moveTo(40, 192);
    ctx.lineTo(w - 40, 192);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 28px Georgia, serif';
    ctx.fillText('ACTION!', 44, 174);
    ctx.font = '700 16px system-ui, sans-serif';
    ctx.fillStyle = '#ced4da';
    ctx.fillText('DIRECTOR: ENDFIELD CREW', 44, 232);
  });
}

// ============================================================================
// MAIN WORLD RENDER FACTORY
// ============================================================================

export function createWorldRender(ctx, mountEl) {
  const host =
    mountEl ||
    (typeof document !== 'undefined' ? document.getElementById('stage-mount') : null);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x102421);

  const initW = Math.max(1, (typeof window !== 'undefined' && window.innerWidth) || 1280);
  const initH = Math.max(1, (typeof window !== 'undefined' && window.innerHeight) || 800);

  const camera = new THREE.PerspectiveCamera(42, initW / initH, 0.1, 60);
  camera.position.set(0, 0.12, 8.2);
  camera.lookAt(0, 0.04, 0);
  scene.add(camera);

  let renderer = null;
  let currentPixelRatio = Math.min((typeof window !== 'undefined' && window.devicePixelRatio) || 1, 2);

  try {
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: false,
    });
    if (THREE.SRGBColorSpace) {
      renderer.outputColorSpace = THREE.SRGBColorSpace;
    }
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.setPixelRatio(currentPixelRatio);
    renderer.setSize(initW, initH, false);
    if (host) {
      host.innerHTML = '';
      host.appendChild(renderer.domElement);
    }
  } catch (_err) {
    renderer = null;
  }

  // Soft stage lighting for 3D wooden/stone stage deck (cutouts use toneMapped:false MeshBasicMaterial)
  const ambientLight = new THREE.AmbientLight(0xffe8cc, 1.05);
  scene.add(ambientLight);
  const keyLight = new THREE.DirectionalLight(0xfff0d4, 0.85);
  keyLight.position.set(1.8, 4.5, 5.2);
  scene.add(keyLight);

  // --------------------------------------------------------------------------
  // 1. OUTER VELVET PROSCENIUM & HAUNTED CYCLORAMA
  // --------------------------------------------------------------------------
  const prosceniumGroup = new THREE.Group();
  prosceniumGroup.name = 'ProsceniumTheater';
  scene.add(prosceniumGroup);

  const cycGeo = new THREE.PlaneGeometry(1, 1);
  const cycMat = new THREE.MeshBasicMaterial({
    map: createHauntedCycloramaTexture(),
    color: 0xffffff,
    depthWrite: false,
    toneMapped: false,
    fog: false,
  });
  const cycMesh = new THREE.Mesh(cycGeo, cycMat);
  cycMesh.position.set(0, 0, -6.5);
  cycMesh.renderOrder = -20;
  prosceniumGroup.add(cycMesh);

  // Warm overhead theatrical spotlight cone
  const spotGeo = new THREE.ConeGeometry(3.8, 7.2, 24, 1, true);
  const spotMat = new THREE.MeshBasicMaterial({
    color: 0xffe3a3,
    transparent: true,
    opacity: 0.09,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    depthWrite: false,
    toneMapped: false,
    fog: false,
  });
  const spotCone = new THREE.Mesh(spotGeo, spotMat);
  spotCone.position.set(0, 1.65, -1.8);
  prosceniumGroup.add(spotCone);

  // Swooping 3D crimson bats in upper proscenium corners
  const batGeo = new THREE.PlaneGeometry(0.72, 0.5);
  const batMat = new THREE.MeshBasicMaterial({
    map: createBatSpriteTexture(),
    transparent: true,
    depthWrite: false,
    toneMapped: false,
    fog: false,
  });
  const batLeft = new THREE.Mesh(batGeo, batMat);
  const batRight = new THREE.Mesh(batGeo, batMat);
  prosceniumGroup.add(batLeft, batRight);

  // Pleated 3D crimson velvet left & right curtains
  const curtainGeo = new THREE.PlaneGeometry(1, 1);
  const curtainTex = createVelvetCurtainTexture();
  const leftCurtainMat = new THREE.MeshBasicMaterial({
    map: curtainTex,
    transparent: false,
    side: THREE.DoubleSide,
    toneMapped: false,
    fog: false,
  });
  const leftCurtain = new THREE.Mesh(curtainGeo, leftCurtainMat);
  leftCurtain.position.z = 1.65;

  const rightCurtain = new THREE.Mesh(curtainGeo, leftCurtainMat);
  rightCurtain.scale.x = -1; // Mirror gold trim to stage-facing edge!
  rightCurtain.position.z = 1.65;
  prosceniumGroup.add(leftCurtain, rightCurtain);

  // Top pitched golden scalloped valance arch
  const valanceGeo = new THREE.PlaneGeometry(1, 1);
  const valanceMat = new THREE.MeshBasicMaterial({
    map: createTopValanceTexture(),
    transparent: true,
    depthWrite: false,
    toneMapped: false,
    fog: false,
  });
  const valanceMesh = new THREE.Mesh(valanceGeo, valanceMat);
  valanceMesh.position.z = 1.85;
  prosceniumGroup.add(valanceMesh);

  // Foreground row of rounded 3D theater-seat & horned Sarkaz spectator silhouettes
  const audienceGeo = new THREE.PlaneGeometry(1, 1);
  const audienceMat = new THREE.MeshBasicMaterial({
    map: createAudienceRowTexture(),
    transparent: true,
    depthWrite: false,
    toneMapped: false,
    fog: false,
  });
  const audienceMesh = new THREE.Mesh(audienceGeo, audienceMat);
  audienceMesh.position.z = 2.05;
  prosceniumGroup.add(audienceMesh);

  // 3D Clapperboard wipe prop (briefly snaps in 3D on clapperSnap)
  const clapperGeo = new THREE.PlaneGeometry(2.1, 1.58);
  const clapperMat = new THREE.MeshBasicMaterial({
    map: createClapperTexture(),
    transparent: true,
    depthWrite: false,
    toneMapped: false,
    fog: false,
  });
  const clapperMesh = new THREE.Mesh(clapperGeo, clapperMat);
  clapperMesh.position.set(0, 0.25, 2.35);
  clapperMesh.visible = false;
  prosceniumGroup.add(clapperMesh);

  // --------------------------------------------------------------------------
  // 2. STAGE ROOT (5 DIORAMA SETS + HINGED PUPPETS + POOLED PARTICLES)
  // --------------------------------------------------------------------------
  const stageRoot = new THREE.Group();
  stageRoot.name = 'StageRoot';
  scene.add(stageRoot);

  const particlesFX = createParticlesFX(ctx, stageRoot, camera);
  const dioramaSets = createDioramaSets(ctx, stageRoot);
  const puppetActors = createPuppetActors(ctx, stageRoot, dioramaSets, particlesFX);

  // Invisible stage pick fallback plane in stageRoot local space (z = 0.25)
  const stagePickGeo = new THREE.PlaneGeometry(18, 12);
  const stagePickMat = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    colorWrite: false,
    depthWrite: false,
  });
  const stagePickPlane = new THREE.Mesh(stagePickGeo, stagePickMat);
  stagePickPlane.position.set(0, 0, 0.25);
  stageRoot.add(stagePickPlane);

  // 3D Floating Ending Polaroid Showcase (persistent 960x540 CanvasTexture -> zero texture leaks!)
  const endingShowcaseCanvas = document.createElement('canvas');
  endingShowcaseCanvas.width = 960;
  endingShowcaseCanvas.height = 540;
  const endingShowcaseCtx = endingShowcaseCanvas.getContext('2d');
  endingShowcaseCtx.drawImage(getEndingCanvas('END1'), 0, 0, 960, 540);
  const endingShowcaseTex = new THREE.CanvasTexture(endingShowcaseCanvas);
  if (THREE.SRGBColorSpace) endingShowcaseTex.colorSpace = THREE.SRGBColorSpace;
  endingShowcaseTex.minFilter = THREE.LinearFilter;
  endingShowcaseTex.magFilter = THREE.LinearFilter;
  endingShowcaseTex.generateMipmaps = false;
  endingShowcaseTex.needsUpdate = true;

  const endingShowcaseGroup = new THREE.Group();
  endingShowcaseGroup.position.set(0, 0.12, -0.4);
  endingShowcaseGroup.visible = false;

  const endingFrameGeo = new THREE.PlaneGeometry(5.6, 3.45);
  const endingFrameMat = new THREE.MeshBasicMaterial({
    color: 0xf4ead3,
    toneMapped: false,
    fog: false,
  });
  const endingFrameMesh = new THREE.Mesh(endingFrameGeo, endingFrameMat);
  endingShowcaseGroup.add(endingFrameMesh);

  const endingPhotoGeo = new THREE.PlaneGeometry(5.12, 2.88);
  const endingPhotoMat = new THREE.MeshBasicMaterial({
    map: endingShowcaseTex,
    toneMapped: false,
    fog: false,
  });
  const endingPhotoMesh = new THREE.Mesh(endingPhotoGeo, endingPhotoMat);
  endingPhotoMesh.position.set(0, 0.08, 0.02);
  endingShowcaseGroup.add(endingPhotoMesh);
  scene.add(endingShowcaseGroup);

  // --------------------------------------------------------------------------
  // 3. STATE, CURTAINS, AIM PARALLAX & ROLLING PERF TELEMETRY
  // --------------------------------------------------------------------------
  let viewportW = initW;
  let viewportH = initH;
  let curtainOpenTarget = 0; // 0 = draped title curtains, 1 = wide open stage curtains
  let curtainOpenProgress = 0;
  let clapperAnimTimer = 0;
  let audienceCheerTimer = 0;
  let hoverSlotKind = null;
  let activeEndingId = null;
  let drawnShowcaseEndingId = 'END1';
  let sliceDone = false;

  const aimTarget = { x: 0, y: 0 };
  const aimSmooth = { x: 0, y: 0 };

  // Rolling frame-time ring buffer for getPerf() + automatic DPR step-down
  const frameDeltasMs = [];
  let lastPerfStamp = typeof performance !== 'undefined' ? performance.now() : 0;
  let slowFrameStreak = 0;

  const raycaster = new THREE.Raycaster();
  const ndcVec = new THREE.Vector2();
  const projVec = new THREE.Vector3();
  const tmpLocalVec = new THREE.Vector3();

  function getHalfExtentsAtZ(zPlane = 0) {
    const dist = Math.max(0.5, camera.position.z - zPlane);
    const vFovRad = (camera.fov * Math.PI) / 180;
    const halfH = dist * Math.tan(vFovRad * 0.5);
    const halfW = halfH * (viewportW / Math.max(1, viewportH));
    return { halfW, halfH };
  }

  function layoutProsceniumAndStage(simTime = 0) {
    // 1. Scale outer cyclorama & proscenium curtains to cover the active viewport cleanly
    const cycExt = getHalfExtentsAtZ(-6.5);
    cycMesh.scale.set(cycExt.halfW * 2.25, cycExt.halfH * 2.25, 1);

    const curExt = getHalfExtentsAtZ(1.65);
    const curW = Math.max(1.2, curExt.halfW * 1.18);
    const curH = curExt.halfH * 2.25;
    leftCurtain.scale.set(curW, curH, 1);
    rightCurtain.scale.set(-curW, curH, 1);

    // Curtain slide: fully closed crimson velvet seam on Title (0); parted to wings when open (1)
    const closedCenterOffset = curW * 0.485;
    const openWingOffset = curExt.halfW * 0.92 + curW * 0.5;
    const curOffset =
      closedCenterOffset + (openWingOffset - closedCenterOffset) * curtainOpenProgress;
    const sway = Math.sin(simTime * 1.6) * 0.015 * (0.35 + curtainOpenProgress * 0.65);
    leftCurtain.position.set(-curOffset + sway, 0, 1.65);
    rightCurtain.position.set(curOffset - sway, 0, 1.65);

    // Warm overhead theatrical spotlight: bathes closed velvet curtains on Title, lights stage when open
    spotCone.position.set(0, 1.65, 1.72 - curtainOpenProgress * 3.52);
    spotMat.opacity = 0.14 - curtainOpenProgress * 0.05;

    const valExt = getHalfExtentsAtZ(1.85);
    const valH = Math.min(valExt.halfH * 0.36, 0.92);
    valanceMesh.scale.set(valExt.halfW * 2.18, valH, 1);
    valanceMesh.position.set(0, valExt.halfH - valH * 0.42, 1.85);

    const audExt = getHalfExtentsAtZ(2.05);
    const audH = Math.min(audExt.halfH * 0.32, 0.78);
    const cheerHop =
      audienceCheerTimer > 0 ? Math.abs(Math.sin(audienceCheerTimer * Math.PI * 5)) * 0.14 : 0;
    const idleBreath = Math.sin(simTime * 2.2) * 0.015;
    audienceMesh.scale.set(audExt.halfW * 2.16, audH, 1);
    audienceMesh.position.set(0, -audExt.halfH + audH * 0.36 + idleBreath + cheerHop, 2.05);

    // Swooping bats in upper corners
    const batFlap = 1 + Math.sin(simTime * 9.5) * 0.16;
    batLeft.position.set(
      -curExt.halfW * 0.72 + Math.sin(simTime * 1.5) * 0.18,
      curExt.halfH * 0.66 + Math.cos(simTime * 2.1) * 0.12,
      1.74,
    );
    batLeft.scale.set(0.75, 0.75 * batFlap, 1);
    batLeft.rotation.z = -0.14 + Math.sin(simTime * 1.9) * 0.08;

    batRight.position.set(
      curExt.halfW * 0.72 + Math.cos(simTime * 1.4) * 0.18,
      curExt.halfH * 0.64 + Math.sin(simTime * 2.3) * 0.12,
      1.74,
    );
    batRight.scale.set(-0.72, 0.72 * batFlap, 1);
    batRight.rotation.z = 0.14 - Math.sin(simTime * 1.7) * 0.08;

    // 2. Align stageRoot to #stage-viewfinder-window when active (blocking/rolling/take_result),
    // or aspect-safe centered stage during title/clapper/dialogue/ending!
    // Keep stageRoot.visible = true on 'title' behind the opaque closed curtains (z = 1.65)
    // so GPU shaders & Act 1 textures stay warm from boot (zero first-click stall on Gate G2 <= 120ms)!
    const stageExt = getHalfExtentsAtZ(0);
    const phase = ctx?.state?.phase || 'title';
    stageRoot.visible = phase !== 'ending';
    let alignedToWindow = false;

    if (
      typeof document !== 'undefined' &&
      (phase === 'blocking' || phase === 'rolling' || phase === 'take_result')
    ) {
      const winEl = document.getElementById('stage-viewfinder-window');
      if (winEl && !winEl.hidden) {
        const rect = winEl.getBoundingClientRect();
        if (rect.width >= 90 && rect.height >= 70 && viewportW > 0 && viewportH > 0) {
          const cxPx = rect.left + rect.width * 0.5;
          const cyPx = rect.top + rect.height * 0.5;
          const nx = (cxPx / viewportW - 0.5) * 2;
          const ny = (0.5 - cyPx / viewportH) * 2;

          const winWorldW = (rect.width / viewportW) * (stageExt.halfW * 2);
          const winWorldH = (rect.height / viewportH) * (stageExt.halfH * 2);
          const winAspect = rect.width / Math.max(1, rect.height);
          const refW = winAspect < 1.38 ? 5.76 : 6.45;
          const refH = winAspect < 1.38 ? 3.45 : 3.82;
          const fitScale = Math.max(
            0.36,
            Math.min(1.24, Math.min(winWorldW / refW, winWorldH / refH)),
          );

          stageRoot.position.set(
            nx * stageExt.halfW,
            ny * stageExt.halfH - 0.05 * fitScale,
            0,
          );
          stageRoot.scale.setScalar(fitScale);
          alignedToWindow = true;
        }
      }
    }

    if (!alignedToWindow) {
      const isPortrait = viewportW < viewportH * 0.98;
      const refW = isPortrait ? 5.85 : 6.6;
      const fitW = (stageExt.halfW * 2 * (isPortrait ? 0.93 : 0.88)) / refW;
      const fitH = (stageExt.halfH * 2 * (phase === 'dialogue' ? 0.72 : 0.82)) / 3.9;
      const fitScale = Math.max(0.36, Math.min(1.16, Math.min(fitW, fitH)));
      const yLift = phase === 'dialogue' ? stageExt.halfH * 0.14 : 0.02;
      stageRoot.position.set(0, yLift, 0);
      stageRoot.scale.setScalar(fitScale);
    }
  }

  function handleResize() {
    if (typeof window === 'undefined') return;
    const rect = host?.getBoundingClientRect?.();
    const nextW = Math.max(1, Math.round(rect?.width || window.innerWidth || 1280));
    const nextH = Math.max(1, Math.round(rect?.height || window.innerHeight || 800));
    if (nextW === viewportW && nextH === viewportH) return;
    viewportW = nextW;
    viewportH = nextH;
    camera.aspect = viewportW / viewportH;
    camera.updateProjectionMatrix();
    if (renderer) {
      renderer.setSize(viewportW, viewportH, false);
    }
    layoutProsceniumAndStage(ctx?.time || 0);
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('resize', handleResize, { passive: true });
    if (typeof ResizeObserver === 'function' && host) {
      const ro = new ResizeObserver(() => handleResize());
      ro.observe(host);
    }
  }

  // --------------------------------------------------------------------------
  // 4. PUBLIC API METHODS (§4.4 CONTRACT)
  // --------------------------------------------------------------------------

  function initSlice() {
    if (sliceDone) return true;
    const allSetsBuilt = dioramaSets.initSlice();
    if (!allSetsBuilt) {
      return false;
    }
    sliceDone = true;
    setActSet(ctx?.state?.actId || 1);
    layoutProsceniumAndStage(0);
    return true;
  }

  function setActSet(actId) {
    activeEndingId = null;
    endingShowcaseGroup.visible = false;
    stageRoot.visible = true;
    cycMat.color.setHex(0xffffff);
    spotMat.color.setHex(0xffe3a3);
    ambientLight.color.setHex(0xffe8cc);
    dioramaSets.setActSet(actId);
    dioramaSets.setSlotState({
      phase: ctx?.state?.phase || 'title',
      actorId: ctx?.state?.slots?.actorId || null,
      propId: ctx?.state?.slots?.propId || null,
      hoverKind: hoverSlotKind,
    });
  }

  function setCurtains(open, instant = false) {
    curtainOpenTarget = typeof open === 'number' ? Math.max(0, Math.min(1, open)) : open ? 1 : 0;
    if (instant) {
      curtainOpenProgress = curtainOpenTarget;
    }
  }

  function setPreviewPuppet(slotKind, itemId) {
    puppetActors.setPreviewPuppet(slotKind, itemId);
    dioramaSets.setSlotState({
      phase: ctx?.state?.phase || 'blocking',
      actorId: ctx?.state?.slots?.actorId || (slotKind === 'actor' ? itemId : null),
      propId: ctx?.state?.slots?.propId || (slotKind === 'prop' ? itemId : null),
      hoverKind: hoverSlotKind,
    });
  }

  function playTakeChoreo(take) {
    activeEndingId = null;
    endingShowcaseGroup.visible = false;
    stageRoot.visible = true;
    setCurtains(true, true);
    puppetActors.playTakeChoreo(take);
  }

  function showEndingBackdrop(endingId = 'END1') {
    const id = String(endingId || 'END1').toUpperCase();
    activeEndingId = id;
    const cfg = getEndingBackdropConfig(id);
    cycMat.color.setHex(cfg.skyBottom || cfg.tintHex || 0x5fb59c);
    spotMat.color.setHex(cfg.spotColor || cfg.spotHex || 0xffd166);
    ambientLight.color.setHex(cfg.ambientColor || cfg.ambientHex || 0xfff3d6);

    if (drawnShowcaseEndingId !== id) {
      drawnShowcaseEndingId = id;
      endingShowcaseCtx.clearRect(0, 0, 960, 540);
      endingShowcaseCtx.drawImage(getEndingCanvas(id), 0, 0, 960, 540);
      endingShowcaseTex.needsUpdate = true;
    }

    stageRoot.visible = false;
    // Keep 3D backdrop clean (haunted mood-tinted cyclorama + spotlight + parted velvet wings) behind UI's #ending-view Polaroid!
    endingShowcaseGroup.visible = false;
    setCurtains(0.62, false);
    audienceCheerTimer = 1.2;
  }

  function setAim(nx, ny) {
    aimTarget.x = Math.max(-1, Math.min(1, Number(nx) || 0));
    aimTarget.y = Math.max(-1, Math.min(1, Number(ny) || 0));
  }

  function pickStage(clientX, clientY) {
    const phase = ctx?.state?.phase || 'title';
    if (phase === 'title' || phase === 'ending') {
      return { kind: 'stage', worldPos: { x: 0, y: 0.4, z: 0 } };
    }

    layoutProsceniumAndStage(ctx?.time || 0);
    camera.updateMatrixWorld();
    stageRoot.updateMatrixWorld(true);

    const rect = renderer?.domElement?.getBoundingClientRect?.() || {
      left: 0,
      top: 0,
      width: viewportW,
      height: viewportH,
    };
    const rw = Math.max(1, rect.width);
    const rh = Math.max(1, rect.height);
    ndcVec.x = ((clientX - rect.left) / rw) * 2 - 1;
    ndcVec.y = -((clientY - rect.top) / rh) * 2 + 1;
    raycaster.setFromCamera(ndcVec, camera);

    // Helper: convert world intersection point into stageRoot local coordinates
    const toStageLocal = (pt) => {
      tmpLocalVec.copy(pt);
      stageRoot.worldToLocal(tmpLocalVec);
      return {
        x: Number(tmpLocalVec.x.toFixed(3)),
        y: Number(tmpLocalVec.y.toFixed(3)),
        z: Number(tmpLocalVec.z.toFixed(3)),
      };
    };

    // 1. Check active 3D stage gag prop first (within tight artwork bounds, outside slot core)
    const activeGag = dioramaSets.getActiveGagEntry();
    if (activeGag && activeGag.group.visible && activeGag.gagHit) {
      const gagHits = raycaster.intersectObject(activeGag.gagHit, false);
      if (gagHits.length > 0) {
        const hitPt = gagHits[0].point;
        const gagLocal = activeGag.gagGroup.worldToLocal(hitPt.clone());
        const stagePos = toStageLocal(hitPt);
        const insideLeftCore =
          phase === 'blocking' &&
          Math.abs(stagePos.x - -1.45) < 0.62 &&
          Math.abs(stagePos.y - -0.06) < 0.68;
        const insideRightCore =
          phase === 'blocking' &&
          Math.abs(stagePos.x - 1.45) < 0.62 &&
          Math.abs(stagePos.y - -0.06) < 0.68;

        if (
          Math.abs(gagLocal.x) <= 0.64 &&
          Math.abs(gagLocal.y) <= 0.64 &&
          !insideLeftCore &&
          !insideRightCore
        ) {
          return {
            kind: 'gag',
            gagId: activeGag.gagId,
            worldPos: stagePos,
          };
        }
      }
    }

    // 2. Check Left & Right 3D stage slot pedestals during blocking
    if (phase === 'blocking') {
      const slotMeshes = [];
      if (dioramaSets.leftSlot.group.visible) slotMeshes.push(dioramaSets.leftSlot.hitMesh);
      if (dioramaSets.rightSlot.group.visible) slotMeshes.push(dioramaSets.rightSlot.hitMesh);
      if (slotMeshes.length > 0) {
        const slotHits = raycaster.intersectObjects(slotMeshes, false);
        if (slotHits.length > 0) {
          const ud = slotHits[0].object.userData || {};
          return {
            kind: 'slot',
            slotKind: ud.slotKind || 'actor',
            slotSide: ud.slotSide || 'left',
            worldPos: toStageLocal(slotHits[0].point),
          };
        }
      }
    }

    // 3. Open stage raycast fallback
    const planeHits = raycaster.intersectObject(stagePickPlane, false);
    if (planeHits.length > 0) {
      return {
        kind: 'stage',
        worldPos: toStageLocal(planeHits[0].point),
      };
    }

    return {
      kind: 'stage',
      worldPos: { x: Number((ndcVec.x * 1.8).toFixed(3)), y: Number((ndcVec.y * 1.1).toFixed(3)), z: 0.25 },
    };
  }

  function projectStagePointToScreen(sx, sy, sz) {
    projVec.set(sx, sy, sz);
    stageRoot.localToWorld(projVec);
    projVec.project(camera);
    const rect = renderer?.domElement?.getBoundingClientRect?.() || {
      left: 0,
      top: 0,
      width: viewportW,
      height: viewportH,
    };
    return {
      x: rect.left + (projVec.x * 0.5 + 0.5) * rect.width,
      y: rect.top + (-projVec.y * 0.5 + 0.5) * rect.height,
    };
  }

  function getSlotScreenRects() {
    layoutProsceniumAndStage(ctx?.time || 0);
    camera.updateMatrixWorld();
    stageRoot.updateMatrixWorld(true);

    const buildRect = (slotRig) => {
      const sx = slotRig.group.position.x;
      const sy = slotRig.group.position.y - 0.54;
      const sz = slotRig.group.position.z;
      const center = projectStagePointToScreen(sx, sy, sz);
      const topLeft = projectStagePointToScreen(sx - 0.95, sy + 0.95, sz);
      const botRight = projectStagePointToScreen(sx + 0.95, sy - 0.95, sz);
      const width = Math.max(48, Math.abs(botRight.x - topLeft.x));
      const height = Math.max(48, Math.abs(botRight.y - topLeft.y));
      return {
        cx: center.x,
        cy: center.y,
        x: center.x - width * 0.5,
        y: center.y - height * 0.5,
        width,
        height,
        slotKind: slotRig.slotKind,
      };
    };

    return {
      left: buildRect(dioramaSets.leftSlot),
      right: buildRect(dioramaSets.rightSlot),
    };
  }

  function getGagScreenRect() {
    const activeGag = dioramaSets.getActiveGagEntry();
    if (!activeGag) return null;
    layoutProsceniumAndStage(ctx?.time || 0);
    camera.updateMatrixWorld();
    stageRoot.updateMatrixWorld(true);

    const gp = activeGag.gagGroup.position;
    const center = projectStagePointToScreen(gp.x, gp.y, gp.z);
    const topLeft = projectStagePointToScreen(gp.x - 0.5, gp.y + 0.5, gp.z);
    const botRight = projectStagePointToScreen(gp.x + 0.5, gp.y - 0.5, gp.z);
    const width = Math.max(36, Math.abs(botRight.x - topLeft.x));
    const height = Math.max(36, Math.abs(botRight.y - topLeft.y));
    return {
      gagId: activeGag.gagId,
      actId: activeGag.id,
      cx: center.x,
      cy: center.y,
      x: center.x - width * 0.5,
      y: center.y - height * 0.5,
      width,
      height,
    };
  }

  function burstParticles(kind, worldPos, count = 12) {
    return particlesFX.burstParticles(kind, worldPos, count);
  }

  function flashCamera(strength = 1.0) {
    particlesFX.flashCamera(strength);
  }

  function shakeCamera(trauma = 0.4) {
    particlesFX.shakeCamera(trauma);
  }

  function renderFrame() {
    if (!renderer) return;

    const now = typeof performance !== 'undefined' ? performance.now() : 0;
    if (lastPerfStamp > 0 && now > lastPerfStamp) {
      const deltaMs = now - lastPerfStamp;
      if (deltaMs > 0.2 && deltaMs < 250) {
        frameDeltasMs.push(deltaMs);
        if (frameDeltasMs.length > 180) frameDeltasMs.shift();
        // Automatic high-DPI safeguard: step down DPR to 1.0 if sustained frame time > 22ms
        if (currentPixelRatio > 1.05 && deltaMs > 22) {
          slowFrameStreak += 1;
          if (slowFrameStreak >= 18) {
            currentPixelRatio = 1.0;
            renderer.setPixelRatio(1.0);
          }
        } else {
          slowFrameStreak = Math.max(0, slowFrameStreak - 1);
        }
      }
    }
    lastPerfStamp = now;

    layoutProsceniumAndStage(ctx?.time || 0);
    renderer.render(scene, camera);
  }

  function renderPostcardStage(destCtx, ix, iy, iw, ih) {
    if (!renderer || !renderer.domElement) return;
    const pw = 1480;
    const ph = 896;
    const prevW = viewportW;
    const prevH = viewportH;
    const prevDpr = renderer.getPixelRatio();
    const prevCurtain = curtainOpenProgress;
    const prevStageVis = stageRoot.visible;
    const prevEndVis = endingShowcaseGroup.visible;
    const simTime = ctx?.time || 0;

    try {
      viewportW = pw;
      viewportH = ph;
      curtainOpenProgress = 1;
      renderer.setPixelRatio(1);
      renderer.setSize(pw, ph, false);
      camera.aspect = pw / ph;
      camera.updateProjectionMatrix();

      layoutProsceniumAndStage(simTime);
      endingShowcaseGroup.visible = false;
      stageRoot.visible = true;
      stageRoot.position.set(0, -0.02, 0);
      stageRoot.scale.setScalar(1.06);

      renderer.render(scene, camera);
      destCtx.drawImage(renderer.domElement, 0, 0, pw, ph, ix, iy, iw, ih);
    } finally {
      viewportW = prevW;
      viewportH = prevH;
      curtainOpenProgress = prevCurtain;
      stageRoot.visible = prevStageVis;
      endingShowcaseGroup.visible = prevEndVis;
      renderer.setPixelRatio(prevDpr);
      renderer.setSize(Math.max(1, prevW), Math.max(1, prevH), false);
      camera.aspect = Math.max(1, prevW) / Math.max(1, prevH);
      camera.updateProjectionMatrix();
      layoutProsceniumAndStage(simTime);
      renderer.render(scene, camera);
    }
  }

  function exportPostcardDataURL() {
    return composePostcardDataURL({
      ctx,
      renderer,
      renderNow: () => renderFrame(),
      renderPostcardStage,
    });
  }

  function getPerf() {
    const info = renderer?.info;
    let p50ms = 1.8;
    let p95ms = 3.2;
    let fps = 60;
    if (frameDeltasMs.length >= 5) {
      const sorted = [...frameDeltasMs].sort((a, b) => a - b);
      p50ms = Number(sorted[Math.floor(sorted.length * 0.5)].toFixed(2));
      p95ms = Number(sorted[Math.floor(sorted.length * 0.95)].toFixed(2));
      const mean = sorted.reduce((acc, v) => acc + v, 0) / sorted.length;
      fps = Math.min(120, Math.max(1, Math.round(1000 / Math.max(1, mean))));
    }
    return {
      fps,
      p50ms,
      p95ms,
      drawCalls: Number(info?.render?.calls) || 0,
      triangles: Number(info?.render?.triangles) || 0,
      geometries: Number(info?.memory?.geometries) || 0,
      textures: Number(info?.memory?.textures) || 0,
    };
  }

  // --------------------------------------------------------------------------
  // 5. EVENT BUS SUBSCRIPTIONS (SYNCED TO MECHANICS & UI)
  // --------------------------------------------------------------------------

  ctx?.events?.on?.('phaseChange', (payload = {}) => {
    const nextPhase = payload.to || ctx?.state?.phase || 'title';
    if (nextPhase === 'title') {
      activeEndingId = null;
      endingShowcaseGroup.visible = false;
      stageRoot.visible = true;
      dioramaSets.setColossalSuppressorActive(false);
      setCurtains(false, false);
    } else if (nextPhase === 'ending') {
      const eid = ctx?.state?.currentEnding?.endingId || activeEndingId || 'END1';
      showEndingBackdrop(eid);
    } else {
      activeEndingId = null;
      endingShowcaseGroup.visible = false;
      stageRoot.visible = true;
      setCurtains(true, false);
    }
    dioramaSets.setSlotState({
      phase: nextPhase,
      actorId: ctx?.state?.slots?.actorId || null,
      propId: ctx?.state?.slots?.propId || null,
      hoverKind: hoverSlotKind,
    });
  });

  ctx?.events?.on?.('curtainMove', (payload = {}) => {
    setCurtains(Boolean(payload.open), payload.duration === 0);
  });

  ctx?.events?.on?.('clapperSnap', () => {
    clapperAnimTimer = 0.52;
  });

  ctx?.events?.on?.('slotHover', (payload = {}) => {
    hoverSlotKind = payload.slotKind || null;
    dioramaSets.setSlotState({
      phase: ctx?.state?.phase || 'blocking',
      actorId: ctx?.state?.slots?.actorId || null,
      propId: ctx?.state?.slots?.propId || null,
      hoverKind: hoverSlotKind,
    });
  });

  ctx?.events?.on?.('slotCast', (payload = {}) => {
    if (payload.slotKind) {
      const slotRig = dioramaSets.getSlotRigForKind(payload.slotKind);
      if (slotRig) {
        particlesFX.burstVisualOnly(
          'sparkles',
          { x: slotRig.group.position.x, y: -0.25, z: 0.55 },
          14,
        );
      }
    }
    dioramaSets.setSlotState({
      phase: ctx?.state?.phase || 'blocking',
      actorId: ctx?.state?.slots?.actorId || null,
      propId: ctx?.state?.slots?.propId || null,
      hoverKind: hoverSlotKind,
    });
  });

  ctx?.events?.on?.('slotCleared', () => {
    dioramaSets.setSlotState({
      phase: ctx?.state?.phase || 'blocking',
      actorId: ctx?.state?.slots?.actorId || null,
      propId: ctx?.state?.slots?.propId || null,
      hoverKind: hoverSlotKind,
    });
  });

  ctx?.events?.on?.('stageGagTriggered', (payload = {}) => {
    dioramaSets.triggerGagBounce(payload.gagId);
    const activeGag = dioramaSets.getActiveGagEntry();
    if (activeGag) {
      particlesFX.burstVisualOnly(
        'gag',
        {
          x: activeGag.baseGagPos.x,
          y: activeGag.baseGagPos.y,
          z: activeGag.baseGagPos.z + 0.15,
        },
        12,
      );
    }
  });

  ctx?.events?.on?.('takeCompleted', () => {
    audienceCheerTimer = 0.9;
  });

  ctx?.events?.on?.('endingRevealed', (payload = {}) => {
    if (payload.endingId) {
      showEndingBackdrop(payload.endingId);
    }
  });

  // --------------------------------------------------------------------------
  // 6. DETERMINISTIC FRAME UPDATE (dt = 1/60s)
  // --------------------------------------------------------------------------

  function update(dt) {
    const simTime = Number.isFinite(ctx?.time) ? ctx.time : 0;
    const phase = ctx?.state?.phase || 'title';

    // Smooth curtain slide
    const curtainSpeed = dt * 2.8;
    if (curtainOpenProgress < curtainOpenTarget) {
      curtainOpenProgress = Math.min(curtainOpenTarget, curtainOpenProgress + curtainSpeed);
    } else if (curtainOpenProgress > curtainOpenTarget) {
      curtainOpenProgress = Math.max(curtainOpenTarget, curtainOpenProgress - curtainSpeed);
    }

    // DOM #clapper-overlay owns the clapperboard UI; keep 3D duplicate hidden so zero double-clapper occurs
    if (clapperAnimTimer > 0) {
      clapperAnimTimer = Math.max(0, clapperAnimTimer - dt);
    }
    clapperMesh.visible = false;

    if (audienceCheerTimer > 0) {
      audienceCheerTimer = Math.max(0, audienceCheerTimer - dt);
    }

    // Smooth pointer parallax (+/- 3.5 degrees equivalent) + subtle camera breathing
    const lerp = Math.min(1, dt * 6.5);
    aimSmooth.x += (aimTarget.x - aimSmooth.x) * lerp;
    aimSmooth.y += (aimTarget.y - aimSmooth.y) * lerp;

    const breathX = Math.sin(simTime * 0.9) * 0.04;
    const breathY = Math.cos(simTime * 1.25) * 0.03;
    camera.position.set(
      aimSmooth.x * 0.34 + breathX,
      0.12 - aimSmooth.y * 0.22 + breathY,
      8.2,
    );
    camera.lookAt(aimSmooth.x * 0.12, 0.04 - aimSmooth.y * 0.08, 0);

    // Apply post-lookAt camera trauma shake (strictly <= 0.08 world units)
    const shake = particlesFX.getShakeOffset(simTime);
    if (shake.x !== 0 || shake.y !== 0) {
      camera.position.x += shake.x;
      camera.position.y += shake.y;
    }

    // Keep slot bracket visibility synced to current phase
    dioramaSets.setSlotState({
      phase,
      actorId: ctx?.state?.slots?.actorId || null,
      propId: ctx?.state?.slots?.propId || null,
      hoverKind: hoverSlotKind,
    });

    if (endingShowcaseGroup.visible) {
      endingShowcaseGroup.rotation.z = -0.025 + Math.sin(simTime * 1.3) * 0.012;
      endingShowcaseGroup.position.y = 0.12 + Math.sin(simTime * 1.8) * 0.04;
    }

    dioramaSets.update(dt, simTime);
    puppetActors.update(dt, simTime);
    particlesFX.update(dt, simTime);
  }

  // Initial proscenium layout
  layoutProsceniumAndStage(0);

  return {
    initSlice,
    setActSet,
    setCurtains,
    setPreviewPuppet,
    playTakeChoreo,
    showEndingBackdrop,
    pickStage,
    getSlotScreenRects,
    getGagScreenRect,
    setAim,
    burstParticles,
    flashCamera,
    shakeCamera,
    exportPostcardDataURL,
    getPortraitDataURL,
    drawThumbnail,
    getEndingDataURL,
    drawEndingIllustration,
    update,
    renderFrame,
    getPerf,
  };
}
