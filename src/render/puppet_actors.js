// 3D Hinged Paper-Puppet Standee Rigs on Marionette Strings + Emote Bubbles + 20-Take Choreography
// Reuses 3 pooled rigs + 5 pooled emote textures -> zero geometry/texture allocations on reshoot!

import * as THREE from '../../vendor/three.module.min.js';
import { getStandeeCanvas } from './chibi_atlas.js';

const INK = '#19161d';
const _propGroundShiftCache = new WeakMap();

// Computes exact downward pixel shift so every prop standee's bottom sticker rim rests at y = 498
// (matching character boot grounding and eliminating floor-shadow float on 3D stage!)
function getPropGroundShiftPx(srcCanvas) {
  if (!srcCanvas) return 0;
  if (_propGroundShiftCache.has(srcCanvas)) {
    return _propGroundShiftCache.get(srcCanvas);
  }
  const w = srcCanvas.width;
  const h = srcCanvas.height;
  const data = srcCanvas.getContext('2d').getImageData(0, 0, w, h).data;
  let maxBottomY = h - 1;
  outer: for (let y = h - 1; y >= 0; y--) {
    const rowOff = y * w * 4;
    for (let x = 0; x < w; x++) {
      if (data[rowOff + x * 4 + 3] >= 110) {
        maxBottomY = y;
        break outer;
      }
    }
  }
  const shift = Math.max(0, Math.min(136, 498 - maxBottomY));
  _propGroundShiftCache.set(srcCanvas, shift);
  return shift;
}

function drawStandeeToRigCanvas(destCtx, itemId, mood, isProp) {
  destCtx.clearRect(0, 0, 512, 512);
  const src = getStandeeCanvas(itemId, mood);
  const shiftY = isProp ? getPropGroundShiftPx(src) : 0;
  destCtx.drawImage(src, 0, shiftY, 512, 512);
}

function createBubbleCanvas(kind) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');

  // Speech/thought cloud circle + tail
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.35)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 5;
  ctx.beginPath();
  ctx.ellipse(128, 114, 92, 78, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.lineWidth = 7;
  ctx.strokeStyle = INK;
  ctx.stroke();

  // Tail dots
  for (const [tx, ty, tr] of [[92, 204, 14], [74, 228, 9]]) {
    ctx.beginPath();
    ctx.arc(tx, ty, tr, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.lineWidth = 5.5;
    ctx.stroke();
  }
  ctx.restore();

  if (kind === 'mask_q') {
    // Matches [01:05] take_1_1: Sarkaz Mask inside bubble + purple '?'!
    const maskImg = getStandeeCanvas('sarkaz_mask', 'neutral');
    ctx.drawImage(maskImg, 44, 34, 148, 148);
    ctx.font = '900 72px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 9;
    ctx.strokeStyle = INK;
    ctx.strokeText('?', 188, 92);
    ctx.fillStyle = '#ae3ec9';
    ctx.fillText('?', 188, 92);
  } else if (kind === 'heart') {
    ctx.translate(128, 112);
    ctx.beginPath();
    ctx.arc(-22, -12, 26, 0, Math.PI * 2);
    ctx.arc(22, -12, 26, 0, Math.PI * 2);
    ctx.moveTo(-46, -4);
    ctx.lineTo(0, 48);
    ctx.lineTo(46, -4);
    ctx.closePath();
    ctx.fillStyle = '#ff6b9d';
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = INK;
    ctx.stroke();
  } else if (kind === 'question') {
    ctx.font = '900 104px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 10;
    ctx.strokeStyle = INK;
    ctx.strokeText('?', 128, 116);
    ctx.fillStyle = '#339af0';
    ctx.fillText('?', 128, 116);
  } else if (kind === 'exclaim') {
    ctx.font = '900 108px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 10;
    ctx.strokeStyle = INK;
    ctx.strokeText('!!', 128, 116);
    ctx.fillStyle = '#fa5252';
    ctx.fillText('!!', 128, 116);
  } else {
    // 'music' / joyful laugh
    ctx.font = '900 44px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 8;
    ctx.strokeStyle = INK;
    ctx.strokeText('HAHA!', 128, 114);
    ctx.fillStyle = '#f59f00';
    ctx.fillText('HAHA!', 128, 114);
  }

  return c;
}

export function createPuppetActors(ctx, stageRoot, dioramaSets, particlesFX) {
  const puppetsGroup = new THREE.Group();
  puppetsGroup.name = 'PuppetActorsGroup';
  stageRoot.add(puppetsGroup);

  // Shared geometries across all puppet standees
  // Pivot at bottom-center (y = 0..2.25) so squash-and-stretch anchors cleanly to stage floor!
  const standeeGeo = new THREE.PlaneGeometry(2.25, 2.25);
  standeeGeo.translate(0, 1.125, 0);

  const propStandeeGeo = new THREE.PlaneGeometry(1.72, 1.72);
  propStandeeGeo.translate(0, 0.86, 0);

  const largePropStandeeGeo = new THREE.PlaneGeometry(2.12, 2.12);
  largePropStandeeGeo.translate(0, 1.06, 0);

  const LARGE_PROPS = new Set([
    'lankybeast',
    'pop_loong',
    'candy_chest',
    'fireworks',
    'roast_steak',
    'suppressor',
  ]);

  const stringGeo = new THREE.CylinderGeometry(0.008, 0.008, 3.6, 4);
  stringGeo.translate(0, 1.8, 0);
  const stringMat = new THREE.MeshBasicMaterial({
    color: 0xf3d9a4,
    transparent: true,
    opacity: 0.42,
    toneMapped: false,
    fog: false,
  });

  const shadowGeo = new THREE.CircleGeometry(0.68, 20);
  shadowGeo.rotateX(-Math.PI * 0.5);
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x0b0812,
    transparent: true,
    opacity: 0.36,
    depthWrite: false,
    toneMapped: false,
    fog: false,
  });

  const bubbleGeo = new THREE.PlaneGeometry(0.95, 0.95);
  const bubbleCanvases = {
    mask_q: createBubbleCanvas('mask_q'),
    heart: createBubbleCanvas('heart'),
    question: createBubbleCanvas('question'),
    exclaim: createBubbleCanvas('exclaim'),
    music: createBubbleCanvas('music'),
  };

  function makePuppetSlot(name, isPropDefault = false) {
    const root = new THREE.Group();
    root.name = name;
    root.visible = false;

    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.position.y = 0.02;
    root.add(shadow);

    const pivot = new THREE.Group();
    root.add(pivot);

    // Persistent 512x512 CanvasTexture per rig -> ZERO new GPU textures on cast/shoot/reshoot!
    const standeeCanvas = document.createElement('canvas');
    standeeCanvas.width = 512;
    standeeCanvas.height = 512;
    const standeeCtx = standeeCanvas.getContext('2d');
    drawStandeeToRigCanvas(
      standeeCtx,
      isPropDefault ? 'sarkaz_mask' : 'last_rite',
      'neutral',
      isPropDefault,
    );
    const standeeTex = new THREE.CanvasTexture(standeeCanvas);
    if (THREE.SRGBColorSpace) standeeTex.colorSpace = THREE.SRGBColorSpace;
    standeeTex.minFilter = THREE.LinearFilter;
    standeeTex.magFilter = THREE.LinearFilter;
    standeeTex.generateMipmaps = false;
    standeeTex.needsUpdate = true;

    const mat = new THREE.MeshBasicMaterial({
      map: standeeTex,
      transparent: true,
      alphaTest: 0.04,
      side: THREE.DoubleSide,
      toneMapped: false,
      fog: false,
    });
    const plane = new THREE.Mesh(isPropDefault ? propStandeeGeo : standeeGeo, mat);
    pivot.add(plane);

    // Two subtle golden theater marionette strings going up to rigging loft
    const strL = new THREE.Mesh(stringGeo, stringMat);
    strL.position.set(-0.34, 1.4, -0.02);
    const strR = new THREE.Mesh(stringGeo, stringMat);
    strR.position.set(0.34, 1.4, -0.02);
    pivot.add(strL, strR);

    // Persistent 256x256 emote bubble CanvasTexture per rig
    const bubbleCanvas = document.createElement('canvas');
    bubbleCanvas.width = 256;
    bubbleCanvas.height = 256;
    const bubbleCtx = bubbleCanvas.getContext('2d');
    bubbleCtx.drawImage(bubbleCanvases.heart, 0, 0, 256, 256);
    const bubbleTex = new THREE.CanvasTexture(bubbleCanvas);
    if (THREE.SRGBColorSpace) bubbleTex.colorSpace = THREE.SRGBColorSpace;
    bubbleTex.minFilter = THREE.LinearFilter;
    bubbleTex.magFilter = THREE.LinearFilter;
    bubbleTex.generateMipmaps = false;
    bubbleTex.needsUpdate = true;

    const bubMat = new THREE.MeshBasicMaterial({
      map: bubbleTex,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
      fog: false,
    });
    const bubble = new THREE.Mesh(bubbleGeo, bubMat);
    bubble.position.set(0.68, 2.15, 0.12);
    bubble.visible = false;
    root.add(bubble);

    puppetsGroup.add(root);

    return {
      root,
      shadow,
      pivot,
      plane,
      strL,
      strR,
      mat,
      standeeCanvas,
      standeeCtx,
      standeeTex,
      bubble,
      bubMat,
      bubbleCanvas,
      bubbleCtx,
      bubbleTex,
      bubbleKind: 'heart',
      bubbleBaseX: 0.68,
      bubbleBaseY: 2.15,
      drawnKey: '',
      itemId: null,
      mood: 'neutral',
      isProp: isPropDefault,
      baseX: 0,
      baseY: -1.36,
      baseZ: 0.48,
      liftY: 0,
      customScale: 1,
      hideShadow: false,
      isSpeaking: false,
      dropTimer: 1,
      hopOffset: 0,
      rotZ: 0,
      flipX: 1,
    };
  }

  const actorRig = makePuppetSlot('PuppetActor', false);
  const propRig = makePuppetSlot('PuppetProp', true);
  const npcRig = makePuppetSlot('PuppetNPC', false);

  let activeChoreo = null; // { take, elapsed, duration, firedBeats: Set }

  function resetRigTransform(rig) {
    rig.baseY = -1.36;
    rig.liftY = 0;
    rig.customScale = 1;
    rig.hideShadow = false;
    rig.isSpeaking = false;
    rig.rotZ = 0;
    rig.flipX = 1;
  }

  function assignRigVisual(rig, itemId, mood = 'neutral', isProp = false, triggerDrop = false) {
    if (!itemId) {
      rig.root.visible = false;
      rig.itemId = null;
      rig.bubble.visible = false;
      return;
    }
    rig.root.visible = true;
    rig.itemId = itemId;
    rig.mood = mood;
    rig.isProp = isProp;
    rig.plane.geometry = isProp
      ? LARGE_PROPS.has(itemId)
        ? largePropStandeeGeo
        : propStandeeGeo
      : standeeGeo;
    const nextKey = `${itemId}__${mood}__${isProp ? 'prop' : 'char'}`;
    if (rig.drawnKey !== nextKey) {
      rig.drawnKey = nextKey;
      drawStandeeToRigCanvas(rig.standeeCtx, itemId, mood, isProp);
      rig.standeeTex.needsUpdate = true;
    }
    if (triggerDrop) {
      rig.dropTimer = 0;
    }
  }

  function setBubble(rig, kind, offsetX = 0.68, offsetY = 2.15) {
    if (!kind || !bubbleCanvases[kind]) {
      rig.bubble.visible = false;
      return;
    }
    if (rig.bubbleKind !== kind) {
      rig.bubbleKind = kind;
      rig.bubbleCtx.clearRect(0, 0, 256, 256);
      rig.bubbleCtx.drawImage(bubbleCanvases[kind], 0, 0, 256, 256);
      rig.bubbleTex.needsUpdate = true;
    }
    rig.bubbleBaseX = offsetX;
    rig.bubbleBaseY = offsetY;
    rig.bubble.position.set(offsetX, offsetY + rig.liftY, 0.14);
    rig.bubble.visible = true;
  }

  function clearAllBubbles() {
    actorRig.bubble.visible = false;
    propRig.bubble.visible = false;
    npcRig.bubble.visible = false;
  }

  function setPreviewPuppet(slotKind, itemId) {
    activeChoreo = null;
    clearAllBubbles();
    npcRig.root.visible = false;

    const targetRig = slotKind === 'prop' ? propRig : actorRig;
    const slotInfo = dioramaSets.getSlotRigForKind(slotKind);
    const slotX = slotInfo ? slotInfo.group.position.x : slotKind === 'prop' ? -1.45 : 1.45;

    if (!itemId) {
      assignRigVisual(targetRig, null);
      return;
    }

    resetRigTransform(targetRig);
    targetRig.baseX = slotX;
    targetRig.baseY = -1.36;
    targetRig.baseZ = 0.52;
    assignRigVisual(targetRig, itemId, 'neutral', slotKind === 'prop', true);
  }

  // Sync stage standees during 'dialogue' (pre-shoot cutscene!) with live per-line expressions
  function syncDialogueCast(actId, dialogueState) {
    if (activeChoreo) return;
    clearAllBubbles();

    const actLines = ctx?.levels?.ACTS?.[actId]?.dialogue || [];
    const curIdx = Math.max(0, Math.min(actLines.length - 1, Number(dialogueState?.index) || 0));
    const moodByChar = {};
    for (let i = 0; i <= curIdx; i++) {
      const ln = actLines[i];
      if (ln?.speakerId) {
        moodByChar[ln.speakerId] = ln.portraitMood || 'neutral';
      }
    }
    const activeLine = actLines[curIdx] || null;
    const activeSpeaker = dialogueState?.speakerId || activeLine?.speakerId || null;
    if (activeSpeaker && dialogueState?.portraitMood) {
      moodByChar[activeSpeaker] = dialogueState.portraitMood;
    }

    // Show the Act's duo on stage during pre-shoot dialogue, swapping active cameos (Camille in Act 1 line 1, Last Rite -> Rossi in Act 3)
    const stagePairs = {
      1: [curIdx === 1 ? 'camille' : 'mysterious_sarkaz', 'last_rite'],
      2: ['sarkaz_director', 'last_rite'],
      3: ['injured_landbreaker', curIdx >= 2 ? 'rossi' : 'last_rite'],
      4: ['mi_fu', 'last_rite'],
      5: ['last_rite', 'ardashir'],
    };
    const [leftChar, rightChar] = stagePairs[actId] || stagePairs[1];

    resetRigTransform(npcRig);
    npcRig.baseX = -1.35;
    npcRig.baseY = -1.36;
    npcRig.baseZ = 0.42;
    npcRig.isSpeaking = activeSpeaker === leftChar;
    assignRigVisual(
      npcRig,
      leftChar,
      moodByChar[leftChar] || 'neutral',
      false,
      npcRig.itemId !== leftChar,
    );

    resetRigTransform(actorRig);
    actorRig.baseX = 1.35;
    actorRig.baseY = -1.36;
    actorRig.baseZ = 0.48;
    actorRig.isSpeaking = activeSpeaker === rightChar;
    assignRigVisual(
      actorRig,
      rightChar,
      moodByChar[rightChar] || 'neutral',
      false,
      actorRig.itemId !== rightChar,
    );

    propRig.root.visible = false;
  }

  function playTakeChoreo(take) {
    if (!take) return;
    const actId = Number(take.actId) || ctx?.state?.actId || 1;
    const actorFirst = actId >= 4;
    const actorId = take.actorId || ctx?.state?.slots?.actorId || 'last_rite';
    const propId = take.propId || ctx?.state?.slots?.propId || 'sarkaz_mask';
    const takeId = take.takeId || `take_${actId}_1`;

    clearAllBubbles();
    dioramaSets.setColossalSuppressorActive(false);

    // Base grounded positions per take so canonical video takes match the exact Bilibili frames!
    resetRigTransform(actorRig);
    actorRig.baseX = actorFirst ? -1.35 : 1.28;
    actorRig.baseZ = 0.56;
    assignRigVisual(actorRig, actorId, 'happy', false, true);

    resetRigTransform(propRig);
    propRig.baseX = actorFirst ? 1.25 : -1.28;
    propRig.baseZ = 0.52;
    assignRigVisual(propRig, propId, 'neutral', true, true);

    resetRigTransform(npcRig);
    npcRig.root.visible = false;

    // Specific canonical stage compositions across all 5 Acts!
    if (actId === 1) {
      npcRig.baseX = -1.28;
      npcRig.baseZ = 0.45;
      assignRigVisual(npcRig, 'mysterious_sarkaz', 'happy', false, true);
      actorRig.baseX = 1.25;
      if (takeId === 'take_1_1') {
        // Video [01:05]: Elder on left with mask '?' thought bubble, blushing Last Rite on right!
        propRig.root.visible = false;
        assignRigVisual(actorRig, 'last_rite', 'flustered', false, true);
        setBubble(npcRig, 'mask_q', 0.92, 2.22);
      } else {
        propRig.baseX = 0.02;
        propRig.baseZ = 0.62;
      }
    } else if (actId === 2) {
      propRig.baseX = -1.18;
      actorRig.baseX = 1.18;
      if (takeId === 'take_2_2') {
        assignRigVisual(actorRig, 'last_rite', 'flustered', false, true);
        setBubble(actorRig, 'question', -0.72, 2.22);
      } else if (takeId === 'take_2_1') {
        setBubble(propRig, 'heart', 0.58, 2.02);
      } else if (takeId === 'take_2_4') {
        setBubble(actorRig, 'exclaim', -0.68, 2.22);
      }
    } else if (actId === 3) {
      // Video [02:00]: Landbreaker on left, weapon clearly separated center-right, Princess on right!
      npcRig.baseX = -1.38;
      npcRig.baseZ = 0.46;
      assignRigVisual(npcRig, 'injured_landbreaker', 'flustered', false, true);
      actorRig.baseX = 1.32;
      propRig.baseX = 0.16;
      propRig.liftY = 0.36;
      propRig.baseZ = 0.64;
      propRig.hideShadow = true;
      if (takeId === 'take_3_2') {
        setBubble(npcRig, 'heart', 0.72, 2.15);
      } else if (takeId === 'take_3_4') {
        setBubble(actorRig, 'music', -0.7, 2.2);
      }
    } else if (actId === 4) {
      // Video [02:25] take_4_3: Mi Fu left, Candy Chest right-center, Yvonne stomping ON TOP of chest, Last Rite peeking from bush!
      actorRig.baseX = -1.48;
      if (takeId === 'take_4_3') {
        assignRigVisual(actorRig, 'mi_fu', 'deadpan', false, true);
        propRig.baseX = 0.42;
        propRig.baseZ = 0.46;
        propRig.customScale = 1.04;
        npcRig.baseX = 0.42;
        npcRig.liftY = 0.62;
        npcRig.baseZ = 0.58;
        npcRig.customScale = 0.96;
        npcRig.hideShadow = true;
        assignRigVisual(npcRig, 'yvonne', 'happy', false, true);
        setBubble(npcRig, 'music', 0.94, 1.36);
        dioramaSets.triggerGagBounce('gag_bush_peek');
      } else {
        propRig.baseX = -0.06;
        propRig.baseZ = 0.48;
        npcRig.baseX = 1.28;
        npcRig.baseZ = 0.56;
        const yvMood =
          takeId === 'take_4_1' ? 'deadpan' : takeId === 'take_4_2' ? 'shocked' : 'happy';
        assignRigVisual(npcRig, 'yvonne', yvMood, false, true);
        if (takeId === 'take_4_1') {
          setBubble(actorRig, 'heart', 0.68, 2.2);
        } else if (takeId === 'take_4_2') {
          assignRigVisual(actorRig, 'last_rite', 'flustered', false, true);
          setBubble(npcRig, 'exclaim', -0.68, 2.2);
        } else if (takeId === 'take_4_4') {
          assignRigVisual(actorRig, 'mi_fu', 'deadpan', false, true);
          setBubble(npcRig, 'exclaim', -0.68, 2.2);
        }
      }
    } else if (actId === 5) {
      actorRig.baseX = -1.32;
      propRig.baseX = 0.95;
      if (takeId === 'take_5_4') {
        // Video [02:52]: Blue-lit Ardashir on left gazing at Colossal Suppressor eclipsing Moon Talos!
        assignRigVisual(actorRig, 'ardashir', 'deadpan', false, true);
        propRig.root.visible = false;
        dioramaSets.setColossalSuppressorActive(true);
        setBubble(actorRig, 'question', 0.74, 2.2);
      } else if (takeId === 'take_5_1') {
        setBubble(actorRig, 'heart', 0.7, 2.2);
      } else if (takeId === 'take_5_2') {
        // Last Rite holding the Originium Suppressor upside-down beside her ear like a walkie-talkie!
        actorRig.baseX = -1.16;
        assignRigVisual(actorRig, 'last_rite', 'flustered', false, true);
        propRig.baseX = -0.22;
        propRig.liftY = 1.94;
        propRig.baseZ = 0.66;
        propRig.rotZ = Math.PI - 0.18;
        propRig.customScale = 0.78;
        propRig.hideShadow = true;
        setBubble(actorRig, 'question', 0.78, 2.2);
      }
    }

    activeChoreo = {
      take,
      takeId,
      actId,
      elapsed: 0,
      duration: 2.2,
      firedBeats: new Set(),
    };

    // Visual burst synced to choreography (stats.particles is authoritatively tracked via stage_choreo -> render.burstParticles)
    particlesFX.burstVisualOnly(
      take.particlePreset || 'sparkles',
      { x: 0, y: 0.35, z: 0.65 },
      18,
    );
  }

  function animateSingleRig(rig, dt, simTime, choreoT = 0, takeId = '') {
    if (!rig.root.visible) return;

    // Squash-and-stretch drop-in on marionette strings
    if (rig.dropTimer < 1) {
      rig.dropTimer = Math.min(1, rig.dropTimer + dt * 3.4);
    }
    const d = rig.dropTimer;
    let dropY = 0;
    let sx = 1;
    let sy = 1;
    if (d < 1) {
      // Drop from above + elastic bounce
      const ease = 1 - Math.pow(1 - d, 3);
      dropY = (1 - ease) * 2.1;
      const bounce = Math.sin(d * Math.PI * 2.5) * (1 - d) * 0.24;
      sx = 1 + bounce;
      sy = 1 - bounce;
    }

    // Idle paper-puppet breathing & string sway
    const idleBob = Math.sin(simTime * 3.2 + rig.baseX) * 0.03;
    const idleSway = Math.sin(simTime * 2.1 + rig.baseX * 1.3) * 0.025;

    // Extra choreography motion during active take!
    let extraX = 0;
    let extraY = 0;
    let extraRot = rig.rotZ;

    if (choreoT > 0 && choreoT < 1) {
      const pulse = Math.sin(choreoT * Math.PI * 4);
      if (rig === propRig && (takeId === 'take_2_4' || takeId === 'take_2_2')) {
        // Lankybeast super-hop!
        extraY = Math.abs(Math.sin(choreoT * Math.PI * 3)) * (takeId === 'take_2_4' ? 1.25 : 0.45);
      } else if (rig === propRig && takeId === 'take_4_4') {
        // Sideways ricocheting fireworks crate!
        extraX = Math.sin(choreoT * Math.PI * 5) * 0.85;
        extraRot = -0.65 + pulse * 0.35;
      } else if (rig === npcRig && takeId === 'take_4_3') {
        // Yvonne gleefully stomping ON TOP of the Candy Chest!
        extraY = Math.abs(Math.sin(choreoT * Math.PI * 6)) * 0.24;
      } else if (rig === propRig && takeId === 'take_5_2') {
        // Last Rite shaking the upside-down Originium Suppressor like a walkie-talkie!
        extraRot = rig.rotZ + Math.sin(choreoT * Math.PI * 8) * 0.14;
        extraY = Math.sin(choreoT * Math.PI * 6) * 0.08;
      } else {
        extraY = Math.abs(Math.sin(choreoT * Math.PI * 3)) * 0.16;
        extraRot += pulse * 0.06;
      }
    }

    const talkBob = rig.isSpeaking ? Math.abs(Math.sin(simTime * 8.5)) * 0.055 : 0;
    const totalLift = rig.liftY + dropY + idleBob + extraY + talkBob;
    const cs = rig.customScale || 1;

    // Keep root grounded on floor so shadow never floats; lift pivot & bubble cleanly above floor!
    rig.root.position.set(rig.baseX + extraX, rig.baseY, rig.baseZ);
    rig.pivot.position.set(0, totalLift, 0);
    rig.pivot.scale.set(sx * rig.flipX * cs, sy * cs, 1);
    rig.pivot.rotation.z = idleSway + extraRot;
    const showStrings = Math.abs(rig.rotZ) < 1.5;
    rig.strL.visible = showStrings;
    rig.strR.visible = showStrings;

    rig.shadow.visible = !rig.hideShadow && rig.liftY < 0.45;
    if (rig.shadow.visible) {
      const shScale = Math.max(0.42, (1 - Math.max(0, rig.liftY + dropY + extraY) * 0.22) * cs);
      rig.shadow.scale.set(shScale, shScale, 1);
    }

    if (rig.bubble.visible) {
      const bs = 1 + Math.sin(simTime * 5.2) * 0.06;
      const bubExtraFollow = rig === npcRig && takeId === 'take_4_3' ? 0.18 : 0.42;
      rig.bubble.position.set(
        rig.bubbleBaseX,
        rig.bubbleBaseY + rig.liftY + extraY * bubExtraFollow,
        0.14,
      );
      rig.bubble.scale.set(bs, bs, 1);
    }
  }

  function hideAll() {
    activeChoreo = null;
    actorRig.root.visible = false;
    propRig.root.visible = false;
    npcRig.root.visible = false;
    clearAllBubbles();
  }

  function update(dt, simTime = 0) {
    const phase = ctx?.state?.phase || 'title';

    if (phase === 'title' || phase === 'clapper' || phase === 'ending') {
      hideAll();
      return;
    }

    if (phase === 'dialogue') {
      activeChoreo = null;
      syncDialogueCast(ctx?.state?.actId || 1, ctx?.state?.dialogue);
    } else if (phase === 'blocking') {
      activeChoreo = null;
      npcRig.root.visible = false;
      clearAllBubbles();
      // Sync slotted preview puppets if state changed externally (e.g. via seam / reset)
      const wantActor = ctx?.state?.slots?.actorId || null;
      const wantProp = ctx?.state?.slots?.propId || null;
      if (actorRig.itemId !== wantActor) {
        setPreviewPuppet('actor', wantActor);
      }
      if (propRig.itemId !== wantProp) {
        setPreviewPuppet('prop', wantProp);
      }
    }

    let choreoT = 0;
    let takeId = '';
    if (activeChoreo) {
      activeChoreo.elapsed += dt;
      choreoT = Math.min(1, activeChoreo.elapsed / activeChoreo.duration);
      takeId = activeChoreo.takeId;

      const beats = activeChoreo.take?.choreoBeats || [];
      for (const b of beats) {
        if (activeChoreo.elapsed >= b.t && !activeChoreo.firedBeats.has(b.beatIndex)) {
          activeChoreo.firedBeats.add(b.beatIndex);
          if (b.expression && actorRig.itemId) {
            assignRigVisual(actorRig, actorRig.itemId, b.expression, false, false);
          }
          if (b.particleKind) {
            particlesFX.burstVisualOnly(b.particleKind, { x: b.pos?.x || 0, y: 0.4, z: 0.6 }, 12);
          }
          if (b.action === 'steak_sizzle' || activeChoreo.takeId === 'take_1_2' || activeChoreo.takeId === 'take_1_4') {
            particlesFX.burstVisualOnly('steam', { x: 0.05, y: -0.35, z: 0.65 }, 10);
          }
        }
      }
    }

    animateSingleRig(actorRig, dt, simTime, choreoT, takeId);
    animateSingleRig(propRig, dt, simTime, choreoT, takeId);
    animateSingleRig(npcRig, dt, simTime, choreoT, takeId);
  }

  return {
    setPreviewPuppet,
    playTakeChoreo,
    hideAll,
    update,
    actorRig,
    propRig,
    npcRig,
  };
}
