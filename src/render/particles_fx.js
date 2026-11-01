// Pooled InstancedMesh 3D Stage Particles + Camera Shutter Flash + Post-lookAt Trauma Shake
// Strictly deterministic (uses ctx.rng & ctx.time, zero Math.random()), frustumCulled = false.

import * as THREE from '../../vendor/three.module.min.js';

const MAX_GLOW_PARTICLES = 220;
const MAX_SHAPE_PARTICLES = 160;

// Shape atlas sprite indices in a 2x2 256x256 canvas:
// 0: Heart, 1: Starburst, 2: Wrapped Candy, 3: Soul Lantern
function createParticleSpriteTexture(kind) {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext('2d');

  if (kind === 'glow') {
    const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 60);
    g.addColorStop(0, 'rgba(255, 255, 255, 1)');
    g.addColorStop(0.35, 'rgba(255, 250, 225, 0.85)');
    g.addColorStop(0.7, 'rgba(255, 220, 160, 0.28)');
    g.addColorStop(1, 'rgba(255, 220, 160, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    // Crisp 4-point star core
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      const r = i % 2 === 0 ? 44 : 11;
      const x = 64 + Math.cos(a) * r;
      const y = 64 + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  } else {
    // Crisp stylized heart/star/candy emblem with white sticker rim
    ctx.translate(64, 64);
    ctx.beginPath();
    ctx.arc(-16, -10, 20, 0, Math.PI * 2);
    ctx.arc(16, -10, 20, 0, Math.PI * 2);
    ctx.moveTo(-35, -4);
    ctx.lineTo(0, 38);
    ctx.lineTo(35, -4);
    ctx.closePath();
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#ffffff';
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(c);
  if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
  tex.generateMipmaps = false;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

const PALETTES = {
  lanterns: [0x63e6be, 0x96f2d7, 0xffd43b, 0xffa94d],
  soul: [0x63e6be, 0x38d9a9, 0xa9e34b, 0xffe066],
  hearts: [0xff6b9d, 0xff85a1, 0xffb3c6, 0xffd6e0],
  love: [0xff6b9d, 0xff85a1, 0xffdeeb, 0xffa8c5],
  candy: [0xffd43b, 0xff85a1, 0x74c0fc, 0x63e6be, 0xb197fc],
  confetti: [0xffd43b, 0xff85a1, 0x74c0fc, 0x63e6be, 0xb197fc],
  joy: [0xffe066, 0xffa94d, 0x63e6be, 0xff8787],
  stardust: [0x74c0fc, 0x91a7ff, 0xe5dbff, 0xffe066],
  stars: [0x74c0fc, 0x91a7ff, 0xffe066, 0xffffff],
  sparkle: [0xffe066, 0xfff3bf, 0x63e6be, 0xffa8c5],
  sparkles: [0xffe066, 0xfff3bf, 0x63e6be, 0xffa8c5],
  cosmic: [0x4dabf7, 0x91a7ff, 0xbac8ff, 0x38e8ff],
  wonder: [0x4dabf7, 0x9775fa, 0x66d9e8, 0xffffff],
  fireworks: [0xff6b6b, 0xffd43b, 0xcc5de8, 0x339af0, 0x51cf66],
  chaos: [0xff6b6b, 0xff922b, 0xfcc419, 0xbe4bdb],
  steam: [0xfff9db, 0xf8f9fa, 0xffe8cc],
  smoke: [0xfff9db, 0xe9ecef, 0xffd8a8],
  gag: [0xffe066, 0x63e6be, 0xff85a1, 0x74c0fc],
};

export function createParticlesFX(ctx, scene, camera) {
  const group = new THREE.Group();
  group.name = 'ParticlesFXGroup';
  scene.add(group);

  const planeGeo = new THREE.PlaneGeometry(1, 1);
  const glowTex = createParticleSpriteTexture('glow');
  const shapeTex = createParticleSpriteTexture('shape');

  const glowMat = new THREE.MeshBasicMaterial({
    map: glowTex,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
    fog: false,
  });

  const shapeMat = new THREE.MeshBasicMaterial({
    map: shapeTex,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
    fog: false,
  });

  const glowMesh = new THREE.InstancedMesh(planeGeo, glowMat, MAX_GLOW_PARTICLES);
  glowMesh.frustumCulled = false;
  glowMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

  const shapeMesh = new THREE.InstancedMesh(planeGeo, shapeMat, MAX_SHAPE_PARTICLES);
  shapeMesh.frustumCulled = false;
  shapeMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

  // Initialize instance color buffers cleanly
  const tmpColor = new THREE.Color(0xffffff);
  const zeroMat = new THREE.Matrix4().makeScale(0, 0, 0);
  for (let i = 0; i < MAX_GLOW_PARTICLES; i++) {
    glowMesh.setMatrixAt(i, zeroMat);
    glowMesh.setColorAt(i, tmpColor);
  }
  for (let i = 0; i < MAX_SHAPE_PARTICLES; i++) {
    shapeMesh.setMatrixAt(i, zeroMat);
    shapeMesh.setColorAt(i, tmpColor);
  }
  glowMesh.instanceMatrix.needsUpdate = true;
  if (glowMesh.instanceColor) glowMesh.instanceColor.needsUpdate = true;
  shapeMesh.instanceMatrix.needsUpdate = true;
  if (shapeMesh.instanceColor) shapeMesh.instanceColor.needsUpdate = true;

  group.add(glowMesh);
  group.add(shapeMesh);

  // Camera shutter flash quad attached to camera
  const flashGeo = new THREE.PlaneGeometry(24, 16);
  const flashMat = new THREE.MeshBasicMaterial({
    color: 0xfff8e7,
    transparent: true,
    opacity: 0,
    depthTest: false,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
    fog: false,
  });
  const flashQuad = new THREE.Mesh(flashGeo, flashMat);
  flashQuad.position.set(0, 0, -1.5);
  flashQuad.renderOrder = 999;
  flashQuad.visible = false;
  camera.add(flashQuad);

  // Particle state arrays
  const glowPool = Array.from({ length: MAX_GLOW_PARTICLES }, () => ({
    active: false,
    x: 0, y: 0, z: 0,
    vx: 0, vy: 0, vz: 0,
    gravity: 0,
    age: 0, life: 1,
    size: 0.2,
    spin: 0, rot: 0,
    swayAmp: 0, swayFreq: 2, phase: 0,
    ambient: false,
    colorHex: 0xffffff,
  }));

  const shapePool = Array.from({ length: MAX_SHAPE_PARTICLES }, () => ({
    active: false,
    x: 0, y: 0, z: 0,
    vx: 0, vy: 0, vz: 0,
    gravity: 0,
    age: 0, life: 1,
    size: 0.22,
    spin: 0, rot: 0,
    swayAmp: 0, swayFreq: 2, phase: 0,
    colorHex: 0xff85a1,
  }));

  let glowCursor = 0;
  let shapeCursor = 0;
  let flashStrength = 0;
  let shakeTrauma = 0;
  let ambientSpawnTimer = 0;

  // Private deterministic PRNG (never mutates ctx.rng so Gate G12 stays 100% deterministic!)
  let fxSeedState = ((Number(ctx?.seed) || 20261031) ^ 0x9e3779b9) >>> 0;
  let lastSeenStateSeed = ctx?.state?.seed ?? ctx?.seed ?? 20261031;

  function reseedFX(seedVal) {
    fxSeedState = ((Number(seedVal) || 20261031) ^ 0x9e3779b9) >>> 0;
    if (fxSeedState === 0) fxSeedState = 0x6d2b79f5;
  }

  function rand() {
    let t = (fxSeedState += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  function range(a, b) {
    return a + (b - a) * rand();
  }

  function spawnOne(useShape, opts) {
    const pool = useShape ? shapePool : glowPool;
    const max = pool.length;
    let idx = useShape ? shapeCursor : glowCursor;
    for (let step = 0; step < max; step++) {
      const cand = (idx + step) % max;
      if (!pool[cand].active) {
        idx = cand;
        break;
      }
    }
    if (useShape) shapeCursor = (idx + 1) % max;
    else glowCursor = (idx + 1) % max;

    const p = pool[idx];
    p.active = true;
    p.x = opts.x;
    p.y = opts.y;
    p.z = opts.z;
    p.vx = opts.vx;
    p.vy = opts.vy;
    p.vz = opts.vz;
    p.gravity = opts.gravity ?? 0;
    p.age = 0;
    p.life = opts.life ?? 1.2;
    p.size = opts.size ?? 0.22;
    p.rot = opts.rot ?? 0;
    p.spin = opts.spin ?? 0;
    p.swayAmp = opts.swayAmp ?? 0;
    p.swayFreq = opts.swayFreq ?? 2.5;
    p.phase = opts.phase ?? 0;
    p.ambient = Boolean(opts.ambient);
    p.colorHex = opts.colorHex ?? 0xffffff;

    tmpColor.setHex(p.colorHex);
    if (useShape) {
      shapeMesh.setColorAt(idx, tmpColor);
      if (shapeMesh.instanceColor) shapeMesh.instanceColor.needsUpdate = true;
    } else {
      glowMesh.setColorAt(idx, tmpColor);
      if (glowMesh.instanceColor) glowMesh.instanceColor.needsUpdate = true;
    }
  }

  // Seed gentle drifting Sauin soul-lantern motes right away
  function seedAmbientMotes() {
    for (let i = 0; i < 26; i++) {
      spawnOne(false, {
        x: range(-4.6, 4.6),
        y: range(-2.4, 2.6),
        z: range(-1.8, 2.2),
        vx: range(-0.06, 0.06),
        vy: range(0.12, 0.28),
        vz: range(-0.04, 0.04),
        gravity: 0,
        life: range(3.5, 6.5),
        size: range(0.11, 0.24),
        rot: range(0, Math.PI * 2),
        spin: range(-0.8, 0.8),
        swayAmp: range(0.12, 0.3),
        swayFreq: range(1.2, 2.4),
        phase: range(0, Math.PI * 2),
        ambient: true,
        colorHex: i % 3 === 0 ? 0xffd43b : 0x63e6be,
      });
    }
  }
  seedAmbientMotes();

  function burstParticles(kind = 'gag', worldPos = { x: 0, y: 0, z: 0.5 }, count = 28, opts = {}) {
    const cleanKind = String(kind || 'gag').toLowerCase();
    const pal = PALETTES[cleanKind] || PALETTES.gag;
    const n = Math.max(1, Math.min(80, Math.floor(count || 28)));
    const ox = Number(worldPos?.x) || 0;
    const oy = Number(worldPos?.y) || 0;
    const oz = Number(worldPos?.z ?? 0.5);

    const isHeartOrCandy =
      cleanKind === 'hearts' ||
      cleanKind === 'love' ||
      cleanKind === 'candy' ||
      cleanKind === 'confetti' ||
      cleanKind === 'joy';
    const isFirework = cleanKind === 'fireworks' || cleanKind === 'chaos';
    const isSteam = cleanKind === 'steam' || cleanKind === 'smoke';

    for (let i = 0; i < n; i++) {
      const useShape = isHeartOrCandy && i % 2 === 0;
      const colorHex = pal[Math.floor(rand() * pal.length)];

      if (isFirework) {
        const ang = range(0, Math.PI * 2);
        const spd = range(1.4, 3.8);
        spawnOne(useShape, {
          x: ox + range(-0.15, 0.15),
          y: oy + range(-0.15, 0.15),
          z: oz + range(-0.1, 0.2),
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd + 0.6,
          vz: range(-0.5, 0.6),
          gravity: -3.2,
          life: range(0.75, 1.45),
          size: range(0.18, 0.36),
          rot: range(0, Math.PI * 2),
          spin: range(-5, 5),
          colorHex,
        });
      } else if (isSteam) {
        spawnOne(false, {
          x: ox + range(-0.35, 0.35),
          y: oy + range(-0.1, 0.2),
          z: oz + 0.15,
          vx: range(-0.22, 0.22),
          vy: range(0.65, 1.35),
          vz: range(-0.08, 0.12),
          gravity: 0.15,
          life: range(0.9, 1.6),
          size: range(0.28, 0.52),
          rot: range(0, Math.PI * 2),
          spin: range(-1.5, 1.5),
          swayAmp: 0.22,
          swayFreq: 3.0,
          phase: range(0, Math.PI * 2),
          colorHex,
        });
      } else if (isHeartOrCandy) {
        const ang = range(-Math.PI * 0.85, -Math.PI * 0.15);
        const spd = range(0.9, 2.6);
        spawnOne(useShape, {
          x: ox + range(-0.4, 0.4),
          y: oy + range(-0.2, 0.3),
          z: oz + range(0, 0.25),
          vx: Math.cos(ang) * spd * 0.85,
          vy: Math.abs(Math.sin(ang)) * spd + 0.45,
          vz: range(-0.25, 0.35),
          gravity: cleanKind === 'hearts' || cleanKind === 'love' ? -0.35 : -2.4,
          life: range(0.95, 1.75),
          size: range(0.2, 0.36),
          rot: range(-0.4, 0.4),
          spin: range(-3.2, 3.2),
          swayAmp: 0.18,
          swayFreq: 3.5,
          phase: range(0, Math.PI * 2),
          colorHex,
        });
      } else {
        // Stardust / lanterns / gag burst
        const ang = range(0, Math.PI * 2);
        const spd = range(0.6, 2.3);
        spawnOne(false, {
          x: ox + range(-0.25, 0.25),
          y: oy + range(-0.25, 0.25),
          z: oz + range(-0.1, 0.25),
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd + 0.4,
          vz: range(-0.25, 0.35),
          gravity: -0.6,
          life: range(0.85, 1.65),
          size: range(0.18, 0.35),
          rot: range(0, Math.PI * 2),
          spin: range(-4, 4),
          swayAmp: 0.14,
          swayFreq: 2.8,
          phase: range(0, Math.PI * 2),
          colorHex,
        });
      }
    }

    if (!opts.visualOnly && ctx?.state?.stats && typeof ctx.state.stats.particles === 'number') {
      ctx.state.stats.particles += n;
    }
    return n;
  }

  function burstVisualOnly(kind, worldPos, count = 16) {
    return burstParticles(kind, worldPos, count, { visualOnly: true });
  }

  function flashCamera(strength = 1.0) {
    flashStrength = Math.min(1.0, Math.max(flashStrength, Number(strength) || 0.85));
    flashQuad.visible = true;
    flashMat.opacity = flashStrength * 0.48;
    if (ctx?.state?.stats && typeof ctx.state.stats.flashes === 'number') {
      ctx.state.stats.flashes += 1;
    }
  }

  function shakeCamera(trauma = 0.5) {
    shakeTrauma = Math.min(1.0, Math.max(shakeTrauma, Number(trauma) || 0.45));
    if (ctx?.state?.stats && typeof ctx.state.stats.shakes === 'number') {
      ctx.state.stats.shakes += 1;
    }
  }

  const dummy = new THREE.Object3D();

  function stepPool(pool, mesh, dt) {
    let dirty = false;
    for (let i = 0; i < pool.length; i++) {
      const p = pool[i];
      if (!p.active) continue;
      dirty = true;
      p.age += dt;
      if (p.age >= p.life) {
        p.active = false;
        mesh.setMatrixAt(i, zeroMat);
        continue;
      }
      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      p.rot += p.spin * dt;

      const t = p.age / p.life;
      const env = t < 0.15 ? t / 0.15 : 1 - (t - 0.15) / 0.85;
      const scale = Math.max(0.001, p.size * env);
      const swayX = p.swayAmp ? Math.sin(p.age * p.swayFreq + p.phase) * p.swayAmp : 0;

      dummy.position.set(p.x + swayX, p.y, p.z);
      dummy.rotation.set(0, 0, p.rot);
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    if (dirty) {
      mesh.instanceMatrix.needsUpdate = true;
    }
  }

  function update(dt) {
    const curSeed = ctx?.state?.seed ?? ctx?.seed ?? 20261031;
    if (curSeed !== lastSeenStateSeed) {
      lastSeenStateSeed = curSeed;
      reseedFX(curSeed);
    }
    // Respawn gentle ambient soul-lantern motes continuously
    ambientSpawnTimer += dt;
    if (ambientSpawnTimer >= 0.22) {
      ambientSpawnTimer = 0;
      spawnOne(false, {
        x: range(-4.8, 4.8),
        y: -2.6,
        z: range(-1.6, 2.2),
        vx: range(-0.08, 0.08),
        vy: range(0.28, 0.55),
        vz: range(-0.04, 0.04),
        gravity: 0,
        life: range(4.5, 7.5),
        size: range(0.1, 0.22),
        rot: 0,
        spin: range(-0.7, 0.7),
        swayAmp: range(0.14, 0.32),
        swayFreq: range(1.2, 2.2),
        phase: range(0, Math.PI * 2),
        ambient: true,
        colorHex: rand() < 0.35 ? 0xffd43b : 0x63e6be,
      });
    }

    stepPool(glowPool, glowMesh, dt);
    stepPool(shapePool, shapeMesh, dt);

    if (flashStrength > 0) {
      flashStrength = Math.max(0, flashStrength - dt * 4.2);
      flashMat.opacity = flashStrength * 0.48;
      flashQuad.visible = flashStrength > 0.005;
    }

    if (shakeTrauma > 0) {
      shakeTrauma = Math.max(0, shakeTrauma - dt * 2.8);
    }
  }

  // Returns subtle post-lookAt camera shake offset strictly <= 0.08 world units!
  function getShakeOffset(simTime = 0) {
    if (shakeTrauma <= 0.001) return { x: 0, y: 0, rotZ: 0 };
    const mag = Math.min(0.08, shakeTrauma * shakeTrauma * 0.08);
    return {
      x: Math.sin(simTime * 43.0) * mag,
      y: Math.cos(simTime * 51.0) * mag * 0.85,
      rotZ: Math.sin(simTime * 37.0) * mag * 0.18,
    };
  }

  return {
    burstParticles,
    burstVisualOnly,
    reseedFX,
    flashCamera,
    shakeCamera,
    update,
    getShakeOffset,
  };
}
