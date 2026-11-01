// Complete 20-Take matrix (5 Acts x 2 Actors x 2 Props) with exact Mood Deltas,
// English script narration, VO IDs, SFX cues, and 3D choreography beat timelines
// (docs/DESIGN.md §6.1 & §7.2).

function makeMoodBadges(moodDelta) {
  const labels = {
    love: 'Love',
    joy: 'Joy',
    wonder: 'Wonder',
    chaos: 'Chaos',
  };
  const badges = [];
  for (const key of ['love', 'joy', 'wonder', 'chaos']) {
    const delta = moodDelta[key] || 0;
    if (delta > 0) {
      const arrows = delta >= 2 ? '^^' : '^';
      badges.push(
        Object.freeze({
          mood: key,
          label: labels[key],
          delta,
          arrows,
          display: `${labels[key]} ${arrows} (+${delta})`,
        }),
      );
    }
  }
  return Object.freeze(badges);
}

function makeBeats(spec) {
  return Object.freeze(
    spec.map((b, idx) =>
      Object.freeze({
        beatIndex: idx,
        t: b.t,
        kind: b.kind,
        target: b.target,
        action: b.action,
        expression: b.expression || 'happy',
        sfx: b.sfx || null,
        particleKind: b.particleKind || null,
        pos: Object.freeze(b.pos || { x: 0, y: 0.9, z: 0.35 }),
      }),
    ),
  );
}

function defineTake(raw) {
  const moodDelta = Object.freeze({
    love: raw.moodDelta.love || 0,
    joy: raw.moodDelta.joy || 0,
    wonder: raw.moodDelta.wonder || 0,
    chaos: raw.moodDelta.chaos || 0,
  });
  return Object.freeze({
    id: raw.takeId,
    takeId: raw.takeId,
    actId: raw.actId,
    indexInAct: raw.indexInAct,
    code: raw.code,
    title: raw.title,
    actorId: raw.actorId,
    propId: raw.propId,
    isVideoCanonical: Boolean(raw.isVideoCanonical),
    cameoIds: Object.freeze(raw.cameoIds || []),
    moodDelta,
    moodBadges: makeMoodBadges(moodDelta),
    scriptText: raw.scriptText,
    stageDirection: raw.stageDirection,
    voId: raw.voId,
    sfxCue: raw.sfxCue,
    particlePreset: raw.particlePreset,
    particleCount: raw.particleCount || 36,
    choreoBeats: makeBeats(raw.choreoBeats),
  });
}

export const TAKES = Object.freeze({
  // ======================== ACT 1: THE VANISHED SAUIN ========================
  take_1_1: defineTake({
    takeId: 'take_1_1',
    actId: 1,
    indexInAct: 1,
    code: 'TAKE 1-A',
    title: 'Apologies to the Mask',
    actorId: 'last_rite',
    propId: 'sarkaz_mask',
    isVideoCanonical: true,
    cameoIds: ['mysterious_sarkaz'],
    moodDelta: { love: 2, joy: 1, wonder: 0, chaos: 0 },
    scriptText:
      'Wearing a borrowed ritual mask, the shy Sarkaz Princess vows to bring Sauin home—once she stops apologizing to the props!',
    stageDirection:
      'Mysterious Sarkaz raises both arms dramatically over the crystal ball while Last Rite blushes holding the horned mask.',
    voId: 'vo_take_1_1',
    sfxCue: 'shutter_flash',
    particlePreset: 'hearts',
    particleCount: 36,
    choreoBeats: [
      { t: 0.08, kind: 'drop_in', target: 'actor', action: 'bow_shy', expression: 'flustered', sfx: 'slot_snap', pos: { x: 1.35, y: 0.85, z: 0.35 } },
      { t: 0.52, kind: 'npc_gesture', target: 'mysterious_sarkaz', action: 'raise_crystal_arms', expression: 'happy', particleKind: 'sparkles', pos: { x: 0.0, y: 1.1, z: -0.4 } },
      { t: 1.08, kind: 'prop_focus', target: 'prop', action: 'mask_question_bubble', expression: 'flustered', sfx: 'gag_pop', particleKind: 'hearts', pos: { x: -1.35, y: 0.95, z: 0.35 } },
      { t: 1.68, kind: 'pose_freeze', target: 'all', action: 'blush_clasp_hands', expression: 'happy', sfx: 'shutter_flash', particleKind: 'hearts', pos: { x: 0.2, y: 1.0, z: 0.2 } },
    ],
  }),

  take_1_2: defineTake({
    takeId: 'take_1_2',
    actId: 1,
    indexInAct: 2,
    code: 'TAKE 1-B',
    title: 'Midnight Steak Summoning',
    actorId: 'last_rite',
    propId: 'roast_steak',
    cameoIds: ['mysterious_sarkaz'],
    moodDelta: { love: 1, joy: 2, wonder: 0, chaos: 0 },
    scriptText:
      'Forget ancient prophecies—the Sarkaz Princess discovers that sizzling roast steak summons departed appetites faster than any ritual!',
    stageDirection:
      'Sizzling Burdenbeast steak lands on the crystal-ball table; both Elder and Princess stare drooling as ghost-bunnies cheer.',
    voId: 'vo_take_1_2',
    sfxCue: 'steak_sizzle',
    particlePreset: 'sparkles',
    particleCount: 38,
    choreoBeats: [
      { t: 0.08, kind: 'prop_focus', target: 'prop', action: 'platter_land_sizzle', expression: 'shocked', sfx: 'steak_sizzle', particleKind: 'sparkles', pos: { x: -1.2, y: 0.85, z: 0.35 } },
      { t: 0.56, kind: 'actor_move', target: 'actor', action: 'lean_in_starry_eyed', expression: 'happy', pos: { x: 1.15, y: 0.9, z: 0.35 } },
      { t: 1.12, kind: 'npc_gesture', target: 'mysterious_sarkaz', action: 'drool_nod_rapidly', expression: 'happy', sfx: 'gag_pop', particleKind: 'hearts', pos: { x: 0.0, y: 1.1, z: -0.4 } },
      { t: 1.7, kind: 'pose_freeze', target: 'all', action: 'bunny_feast_cheer', expression: 'happy', sfx: 'shutter_flash', particleKind: 'confetti', pos: { x: 0.0, y: 1.0, z: 0.25 } },
    ],
  }),

  take_1_3: defineTake({
    takeId: 'take_1_3',
    actId: 1,
    indexInAct: 3,
    code: 'TAKE 1-C',
    title: 'Soliloquy in Horned Bone',
    actorId: 'camille',
    propId: 'sarkaz_mask',
    cameoIds: ['mysterious_sarkaz'],
    moodDelta: { love: 1, joy: 0, wonder: 2, chaos: 0 },
    scriptText:
      "Wait—since when was the Sarkaz Princess this suave?! Camille's brooding masked monologue turns the commercial into cinema!",
    stageDirection:
      'Camille lifts the horned Sarkaz Mask like Hamlet beneath a dramatic violet spotlight while the Elder applauds.',
    voId: 'vo_take_1_3',
    sfxCue: 'shutter_flash',
    particlePreset: 'stars',
    particleCount: 36,
    choreoBeats: [
      { t: 0.08, kind: 'spotlight_shift', target: 'actor', action: 'violet_key_spot', expression: 'deadpan', sfx: 'curtain_swish', pos: { x: 1.3, y: 1.1, z: 0.35 } },
      { t: 0.55, kind: 'prop_focus', target: 'prop', action: 'hamlet_mask_lift', expression: 'deadpan', particleKind: 'stars', pos: { x: 0.65, y: 1.15, z: 0.45 } },
      { t: 1.15, kind: 'npc_gesture', target: 'mysterious_sarkaz', action: 'standing_ovation', expression: 'happy', sfx: 'mood_up_2', particleKind: 'sparkles', pos: { x: -0.2, y: 1.1, z: -0.4 } },
      { t: 1.72, kind: 'pose_freeze', target: 'all', action: 'suave_chin_smirk', expression: 'wink', sfx: 'shutter_flash', particleKind: 'stars', pos: { x: 0.5, y: 1.05, z: 0.3 } },
    ],
  }),

  take_1_4: defineTake({
    takeId: 'take_1_4',
    actId: 1,
    indexInAct: 4,
    code: 'TAKE 1-D',
    title: 'Late-Night Flambe Set',
    actorId: 'camille',
    propId: 'roast_steak',
    cameoIds: ['mysterious_sarkaz'],
    moodDelta: { love: 0, joy: 0, wonder: 1, chaos: 2 },
    scriptText:
      'Camille ignores the script entirely and turns Act One into a midnight cooking show. The crew is already lining up for seconds!',
    stageDirection:
      'Camille calmly flambe-sears the Burdenbeast steak on set while the Elder waves away aromatic smoke with his script.',
    voId: 'vo_take_1_4',
    sfxCue: 'steak_sizzle',
    particlePreset: 'smoke',
    particleCount: 40,
    choreoBeats: [
      { t: 0.08, kind: 'prop_focus', target: 'prop', action: 'ignite_flambe_pan', expression: 'deadpan', sfx: 'steak_sizzle', particleKind: 'smoke', pos: { x: -1.1, y: 0.9, z: 0.4 } },
      { t: 0.58, kind: 'actor_move', target: 'actor', action: 'chef_salt_flourish', expression: 'wink', particleKind: 'sparkles', pos: { x: 1.1, y: 0.95, z: 0.35 } },
      { t: 1.14, kind: 'npc_gesture', target: 'mysterious_sarkaz', action: 'fan_smoke_with_script', expression: 'shocked', sfx: 'gag_pop', particleKind: 'smoke', pos: { x: 0.0, y: 1.15, z: -0.35 } },
      { t: 1.72, kind: 'pose_freeze', target: 'all', action: 'gourmet_plate_present', expression: 'deadpan', sfx: 'shutter_flash', particleKind: 'sparkles', pos: { x: 0.0, y: 1.0, z: 0.3 } },
    ],
  }),

  // ======================== ACT 2: THE GREAT CANDY HEIST ========================
  take_2_1: defineTake({
    takeId: 'take_2_1',
    actId: 2,
    indexInAct: 1,
    code: 'TAKE 2-A',
    title: 'First Candy for Pop Loong',
    actorId: 'last_rite',
    propId: 'pop_loong',
    moodDelta: { love: 2, joy: 0, wonder: 1, chaos: 0 },
    scriptText:
      'On Fangqu Street, the Sarkaz Princess comforts a weeping Pop Loong—sharing her very first Sauin candy under the neon lights.',
    stageDirection:
      'Last Rite gently pats the weeping Pop Loong plush and offers a glowing candy lantern until pink hearts float upward.',
    voId: 'vo_take_2_1',
    sfxCue: 'reward_chime',
    particlePreset: 'hearts',
    particleCount: 36,
    choreoBeats: [
      { t: 0.08, kind: 'prop_focus', target: 'prop', action: 'sniffle_wobble', expression: 'flustered', sfx: 'gag_pop', pos: { x: -1.35, y: 0.75, z: 0.35 } },
      { t: 0.55, kind: 'actor_move', target: 'actor', action: 'kneel_pat_gently', expression: 'happy', particleKind: 'hearts', pos: { x: 0.9, y: 0.85, z: 0.35 } },
      { t: 1.12, kind: 'prop_focus', target: 'prop', action: 'cheer_bounce_hearts', expression: 'happy', sfx: 'reward_chime', particleKind: 'hearts', pos: { x: -0.95, y: 0.95, z: 0.4 } },
      { t: 1.7, kind: 'pose_freeze', target: 'all', action: 'warm_lantern_toast', expression: 'happy', sfx: 'shutter_flash', particleKind: 'lanterns', pos: { x: 0.0, y: 1.05, z: 0.3 } },
    ],
  }),

  take_2_2: defineTake({
    takeId: 'take_2_2',
    actId: 2,
    indexInAct: 2,
    code: 'TAKE 2-B',
    title: 'Interrogating a Lankybeast',
    actorId: 'last_rite',
    propId: 'lankybeast',
    isVideoCanonical: true,
    moodDelta: { love: 1, joy: 2, wonder: 0, chaos: 0 },
    scriptText:
      'The Sarkaz Princess arrived at Fangqu Street hunting for candy, only to interrogate a silent Lankybeast... Did it understand a single word?',
    stageDirection:
      'Last Rite waves her arms frantically with anime sweat drops while the plump green Lankybeast stares blankly and ribbits once.',
    voId: 'vo_take_2_2',
    sfxCue: 'frog_ribbit',
    particlePreset: 'sparkles',
    particleCount: 36,
    choreoBeats: [
      { t: 0.08, kind: 'actor_move', target: 'actor', action: 'frantic_hand_wave', expression: 'flustered', sfx: 'card_pickup', pos: { x: 1.35, y: 0.9, z: 0.35 } },
      { t: 0.6, kind: 'prop_focus', target: 'prop', action: 'blank_stare_still', expression: 'neutral', pos: { x: -1.35, y: 0.7, z: 0.35 } },
      { t: 1.18, kind: 'prop_focus', target: 'prop', action: 'single_ribbit_hop', expression: 'happy', sfx: 'frog_ribbit', particleKind: 'sparkles', pos: { x: -1.15, y: 0.95, z: 0.4 } },
      { t: 1.72, kind: 'pose_freeze', target: 'all', action: 'sweatdrop_question_mark', expression: 'shocked', sfx: 'shutter_flash', particleKind: 'confetti', pos: { x: 0.1, y: 1.0, z: 0.3 } },
    ],
  }),

  take_2_3: defineTake({
    takeId: 'take_2_3',
    actId: 2,
    indexInAct: 3,
    code: 'TAKE 2-C',
    title: 'Wuling Candy Sword-Dance',
    actorId: 'chen_qianyu',
    propId: 'pop_loong',
    moodDelta: { love: 0, joy: 1, wonder: 2, chaos: 0 },
    scriptText:
      'Stand-in Princess Chen Qianyu teams up with Pop Loong for a dazzling Wuling sword-dance that showers the street in sweets!',
    stageDirection:
      'Chen Qianyu strikes a heroic martial pose beside Pop Loong, spinning ribbons that shower wrapped candies across the plaza.',
    voId: 'vo_take_2_3',
    sfxCue: 'sword_ring',
    particlePreset: 'confetti',
    particleCount: 40,
    choreoBeats: [
      { t: 0.08, kind: 'actor_move', target: 'actor', action: 'martial_spin_leap', expression: 'happy', sfx: 'sword_ring', particleKind: 'stars', pos: { x: 1.25, y: 1.1, z: 0.35 } },
      { t: 0.58, kind: 'prop_focus', target: 'prop', action: 'drum_roll_bounce', expression: 'happy', particleKind: 'confetti', pos: { x: -1.25, y: 0.9, z: 0.35 } },
      { t: 1.14, kind: 'actor_move', target: 'actor', action: 'candy_star_fan_toss', expression: 'wink', sfx: 'gag_pop', particleKind: 'confetti', pos: { x: 0.35, y: 1.15, z: 0.45 } },
      { t: 1.72, kind: 'pose_freeze', target: 'all', action: 'twin_hero_salute', expression: 'happy', sfx: 'shutter_flash', particleKind: 'stars', pos: { x: 0.0, y: 1.0, z: 0.3 } },
    ],
  }),

  take_2_4: defineTake({
    takeId: 'take_2_4',
    actId: 2,
    indexInAct: 4,
    code: 'TAKE 2-D',
    title: 'High-Jump Hedge Disaster',
    actorId: 'chen_qianyu',
    propId: 'lankybeast',
    moodDelta: { love: 0, joy: 0, wonder: 1, chaos: 2 },
    scriptText:
      'Disaster on Fangqu Street! Chen Qianyu challenges the Lankybeast to a jumping contest, launching the prop crew into the hedges!',
    stageDirection:
      'The Lankybeast vaults three meters skyward while Chen Qianyu bounds after it across the plaza steps in chaotic slapstick.',
    voId: 'vo_take_2_4',
    sfxCue: 'frog_ribbit',
    particlePreset: 'confetti',
    particleCount: 42,
    choreoBeats: [
      { t: 0.08, kind: 'prop_focus', target: 'prop', action: 'crouch_charge_spring', expression: 'happy', sfx: 'frog_ribbit', pos: { x: -1.35, y: 0.65, z: 0.35 } },
      { t: 0.52, kind: 'prop_focus', target: 'prop', action: 'sky_high_super_leap', expression: 'shocked', particleKind: 'stars', pos: { x: -0.4, y: 2.15, z: 0.2 } },
      { t: 1.08, kind: 'actor_move', target: 'actor', action: 'competitive_vault_chase', expression: 'happy', sfx: 'gag_pop', particleKind: 'confetti', pos: { x: 0.7, y: 1.85, z: 0.3 } },
      { t: 1.7, kind: 'pose_freeze', target: 'all', action: 'hedge_crash_victory_v', expression: 'wink', sfx: 'shutter_flash', particleKind: 'confetti', pos: { x: 0.1, y: 1.0, z: 0.35 } },
    ],
  }),

  // ======================== ACT 3: IT'S A LANDBREAKER! ========================
  take_3_1: defineTake({
    takeId: 'take_3_1',
    actId: 3,
    indexInAct: 1,
    code: 'TAKE 3-A',
    title: 'Stage-Fright Duel',
    actorId: 'last_rite',
    propId: 'one_handed_sword',
    isVideoCanonical: true,
    cameoIds: ['injured_landbreaker'],
    moodDelta: { love: 0, joy: 1, wonder: 0, chaos: 1 },
    scriptText:
      'To reclaim the stolen candy and save Sauin, the Sarkaz Princess draws cold steel—though the Landbreaker looks more scared of forgetting his lines!',
    stageDirection:
      'The Injured Landbreaker flexes nervously beside the candy chest while Last Rite brandishes the gleaming steel broadsword.',
    voId: 'vo_take_3_1',
    sfxCue: 'sword_ring',
    particlePreset: 'sparkles',
    particleCount: 36,
    choreoBeats: [
      { t: 0.08, kind: 'prop_focus', target: 'prop', action: 'draw_blade_gleam', expression: 'flustered', sfx: 'sword_ring', particleKind: 'sparkles', pos: { x: -1.2, y: 0.95, z: 0.4 } },
      { t: 0.56, kind: 'actor_move', target: 'actor', action: 'heroic_point_tremble', expression: 'happy', pos: { x: 1.25, y: 0.9, z: 0.35 } },
      { t: 1.12, kind: 'npc_gesture', target: 'injured_landbreaker', action: 'nervous_cue_card_flex', expression: 'flustered', sfx: 'gag_pop', particleKind: 'sparkles', pos: { x: -0.1, y: 1.05, z: -0.45 } },
      { t: 1.7, kind: 'pose_freeze', target: 'all', action: 'duel_tableau_freeze', expression: 'happy', sfx: 'shutter_flash', particleKind: 'stars', pos: { x: 0.0, y: 1.0, z: 0.25 } },
    ],
  }),

  take_3_2: defineTake({
    takeId: 'take_3_2',
    actId: 3,
    indexInAct: 2,
    code: 'TAKE 3-B',
    title: 'Truce by Giant Lollipop',
    actorId: 'last_rite',
    propId: 'lollipop',
    cameoIds: ['injured_landbreaker'],
    moodDelta: { love: 2, joy: 1, wonder: 0, chaos: 0 },
    scriptText:
      'Instead of a blade, the Princess offers a giant swirl lollipop! Even the fiercest Landbreaker melts for Sauin sweetness.',
    stageDirection:
      'Last Rite raises the oversized pink swirl lollipop like a wand; the Landbreaker bursts into happy tears and hands over the candy chest.',
    voId: 'vo_take_3_2',
    sfxCue: 'reward_chime',
    particlePreset: 'hearts',
    particleCount: 38,
    choreoBeats: [
      { t: 0.08, kind: 'prop_focus', target: 'prop', action: 'twirl_lollipop_wand', expression: 'happy', sfx: 'gag_pop', particleKind: 'sparkles', pos: { x: -1.2, y: 1.0, z: 0.4 } },
      { t: 0.58, kind: 'actor_move', target: 'actor', action: 'present_sweet_gift', expression: 'happy', particleKind: 'hearts', pos: { x: 1.05, y: 0.9, z: 0.35 } },
      { t: 1.15, kind: 'npc_gesture', target: 'injured_landbreaker', action: 'happy_tears_salute', expression: 'happy', sfx: 'reward_chime', particleKind: 'hearts', pos: { x: -0.1, y: 1.05, z: -0.4 } },
      { t: 1.72, kind: 'pose_freeze', target: 'all', action: 'peace_treaty_toast', expression: 'happy', sfx: 'shutter_flash', particleKind: 'hearts', pos: { x: 0.0, y: 1.0, z: 0.3 } },
    ],
  }),

  take_3_3: defineTake({
    takeId: 'take_3_3',
    actId: 3,
    indexInAct: 3,
    code: 'TAKE 3-C',
    title: 'Wolfpack Stunt Flourish',
    actorId: 'rossi',
    propId: 'one_handed_sword',
    cameoIds: ['injured_landbreaker'],
    moodDelta: { love: 0, joy: 2, wonder: 2, chaos: 0 },
    scriptText:
      'Stunt-double Rossi steals the spotlight! With one flashy Wolfpack flourish, the Landbreaker surrenders every last piece of candy!',
    stageDirection:
      'Rossi vaults onto the campsite boulder with the gleaming broadsword, winking directly into the lens as starlight confetti erupts.',
    voId: 'vo_take_3_3',
    sfxCue: 'sword_ring',
    particlePreset: 'confetti',
    particleCount: 42,
    choreoBeats: [
      { t: 0.08, kind: 'actor_move', target: 'actor', action: 'wolfpack_boulder_vault', expression: 'wink', sfx: 'sword_ring', particleKind: 'stars', pos: { x: 1.1, y: 1.25, z: 0.4 } },
      { t: 0.56, kind: 'prop_focus', target: 'prop', action: 'starlight_blade_arc', expression: 'happy', particleKind: 'sparkles', pos: { x: -0.8, y: 1.15, z: 0.45 } },
      { t: 1.12, kind: 'npc_gesture', target: 'injured_landbreaker', action: 'instant_candy_surrender', expression: 'shocked', sfx: 'mood_up_2', particleKind: 'confetti', pos: { x: -0.2, y: 1.0, z: -0.4 } },
      { t: 1.72, kind: 'pose_freeze', target: 'all', action: 'camera_wink_confetti', expression: 'wink', sfx: 'shutter_flash', particleKind: 'confetti', pos: { x: 0.2, y: 1.1, z: 0.35 } },
    ],
  }),

  take_3_4: defineTake({
    takeId: 'take_3_4',
    actId: 3,
    indexInAct: 4,
    code: 'TAKE 3-D',
    title: 'Craft-Services Candy Tax',
    actorId: 'rossi',
    propId: 'lollipop',
    cameoIds: ['injured_landbreaker', 'sarkaz_director'],
    moodDelta: { love: 1, joy: 0, wonder: 0, chaos: 2 },
    scriptText:
      "Wait a minute—Rossi uses the giant lollipop to extort both the Landbreaker and the film crew's snack table!",
    stageDirection:
      'Rossi twirls the giant lollipop like a boss baton and claims half the candy chest for herself while the Director yells cut.',
    voId: 'vo_take_3_4',
    sfxCue: 'gag_pop',
    particlePreset: 'confetti',
    particleCount: 38,
    choreoBeats: [
      { t: 0.08, kind: 'actor_move', target: 'actor', action: 'smug_lollipop_spin', expression: 'wink', sfx: 'gag_pop', pos: { x: 1.2, y: 0.95, z: 0.4 } },
      { t: 0.58, kind: 'prop_focus', target: 'prop', action: 'boss_baton_tap', expression: 'happy', particleKind: 'sparkles', pos: { x: -1.1, y: 0.95, z: 0.4 } },
      { t: 1.14, kind: 'npc_gesture', target: 'injured_landbreaker', action: 'hand_over_snacks', expression: 'shocked', sfx: 'clapper_snap', particleKind: 'confetti', pos: { x: -0.1, y: 1.0, z: -0.4 } },
      { t: 1.7, kind: 'pose_freeze', target: 'all', action: 'loot_heist_grin', expression: 'wink', sfx: 'shutter_flash', particleKind: 'hearts', pos: { x: 0.15, y: 1.0, z: 0.35 } },
    ],
  }),

  // ======================== ACT 4: WHERE IS SAUIN...? ========================
  take_4_1: defineTake({
    takeId: 'take_4_1',
    actId: 4,
    indexInAct: 1,
    code: 'TAKE 4-A',
    title: 'Midnight Patrol Feast',
    actorId: 'last_rite',
    propId: 'candy_chest',
    cameoIds: ['yvonne'],
    moodDelta: { love: 2, joy: 0, wonder: 1, chaos: 0 },
    scriptText:
      'The Sarkaz Princess shares the recovered Candy Chest with the whole Patrol Squad—turning a late-night shift into a warm Sauin feast!',
    stageDirection:
      'Last Rite opens the glittering Candy Chest on the left mark while Captain Yvonne cheers under drifting soul-lanterns.',
    voId: 'vo_take_4_1',
    sfxCue: 'reward_chime',
    particlePreset: 'lanterns',
    particleCount: 38,
    choreoBeats: [
      { t: 0.08, kind: 'actor_move', target: 'actor', action: 'present_open_arms', expression: 'happy', sfx: 'slot_snap', pos: { x: -1.35, y: 0.9, z: 0.35 } },
      { t: 0.56, kind: 'prop_focus', target: 'prop', action: 'chest_lid_golden_burst', expression: 'happy', sfx: 'reward_chime', particleKind: 'sparkles', pos: { x: 1.35, y: 0.85, z: 0.35 } },
      { t: 1.12, kind: 'npc_gesture', target: 'yvonne', action: 'cheer_jump_high_five', expression: 'happy', particleKind: 'hearts', pos: { x: 0.15, y: 1.1, z: -0.3 } },
      { t: 1.7, kind: 'pose_freeze', target: 'all', action: 'lantern_squad_feast', expression: 'happy', sfx: 'shutter_flash', particleKind: 'lanterns', pos: { x: 0.0, y: 1.05, z: 0.3 } },
    ],
  }),

  take_4_2: defineTake({
    takeId: 'take_4_2',
    actId: 4,
    indexInAct: 2,
    code: 'TAKE 4-B',
    title: 'Outpost Sky-Rocket Salute',
    actorId: 'last_rite',
    propId: 'fireworks',
    cameoIds: ['yvonne'],
    moodDelta: { love: 1, joy: 2, wonder: 0, chaos: 0 },
    scriptText:
      "Boom! The Princess launches a sky full of Sauin fireworks over the outpost—even Witchcraft Hour couldn't buy better publicity!",
    stageDirection:
      'Last Rite lights the festive fireworks crate; magenta, cyan, and gold bursts bloom overhead while the squad claps.',
    voId: 'vo_take_4_2',
    sfxCue: 'firework_burst',
    particlePreset: 'fireworks',
    particleCount: 46,
    choreoBeats: [
      { t: 0.08, kind: 'actor_move', target: 'actor', action: 'sparkler_light_fuse', expression: 'flustered', sfx: 'steak_sizzle', pos: { x: -1.25, y: 0.9, z: 0.35 } },
      { t: 0.55, kind: 'prop_focus', target: 'prop', action: 'skyrocket_launch_trail', expression: 'shocked', sfx: 'firework_burst', particleKind: 'fireworks', pos: { x: 1.35, y: 1.6, z: -0.2 } },
      { t: 1.12, kind: 'prop_focus', target: 'prop', action: 'grand_canopy_bloom', expression: 'happy', sfx: 'firework_burst', particleKind: 'fireworks', pos: { x: 0.0, y: 2.25, z: -1.2 } },
      { t: 1.72, kind: 'pose_freeze', target: 'all', action: 'skyward_applause', expression: 'happy', sfx: 'shutter_flash', particleKind: 'stars', pos: { x: 0.0, y: 1.1, z: 0.3 } },
    ],
  }),

  take_4_3: defineTake({
    takeId: 'take_4_3',
    actId: 4,
    indexInAct: 3,
    code: 'TAKE 4-C',
    title: 'Captain Yvonne Crashes the Set',
    actorId: 'mi_fu',
    propId: 'candy_chest',
    isVideoCanonical: true,
    cameoIds: ['yvonne', 'last_rite'],
    moodDelta: { love: 1, joy: 0, wonder: 0, chaos: 2 },
    scriptText:
      "The Sarkaz Princess—wait, Mi Fu?!—recovered the candy, while Captain Yvonne laughs maniacally on the chest... isn't she having way too much fun?!",
    stageDirection:
      'Mi Fu crosses her arms deadpan as stand-in Princess, Yvonne stomps onto the Candy Chest cackling, and Last Rite peeks shyly from the right bush.',
    voId: 'vo_take_4_3',
    sfxCue: 'gag_pop',
    particlePreset: 'confetti',
    particleCount: 42,
    choreoBeats: [
      { t: 0.08, kind: 'actor_move', target: 'actor', action: 'deadpan_arms_crossed', expression: 'deadpan', sfx: 'slot_snap', pos: { x: -1.4, y: 0.9, z: 0.35 } },
      { t: 0.52, kind: 'npc_gesture', target: 'yvonne', action: 'stomp_candy_chest_laugh', expression: 'happy', sfx: 'gag_pop', particleKind: 'confetti', pos: { x: 1.25, y: 1.25, z: 0.4 } },
      { t: 1.12, kind: 'npc_gesture', target: 'last_rite', action: 'bush_peek_ears_pop', expression: 'flustered', sfx: 'gag_pop', particleKind: 'hearts', pos: { x: 2.75, y: 0.85, z: -0.9 } },
      { t: 1.72, kind: 'pose_freeze', target: 'all', action: 'maniacal_chest_tableau', expression: 'happy', sfx: 'shutter_flash', particleKind: 'confetti', pos: { x: 0.3, y: 1.05, z: 0.3 } },
    ],
  }),

  take_4_4: defineTake({
    takeId: 'take_4_4',
    actId: 4,
    indexInAct: 4,
    code: 'TAKE 4-D',
    title: 'Pyrotechnic Pandemonium',
    actorId: 'mi_fu',
    propId: 'fireworks',
    cameoIds: ['yvonne'],
    moodDelta: { love: 0, joy: 0, wonder: 1, chaos: 2 },
    scriptText:
      'Who aimed the fireworks indoors?! Rockets ricochet across the set while Mi Fu deadpans through absolute pyrotechnic pandemonium!',
    stageDirection:
      'The fireworks crate tips sideways, ricocheting neon sparks across the stage while Mi Fu sighs unbothered and Yvonne surfs the glitter storm.',
    voId: 'vo_take_4_4',
    sfxCue: 'firework_burst',
    particlePreset: 'fireworks',
    particleCount: 48,
    choreoBeats: [
      { t: 0.08, kind: 'prop_focus', target: 'prop', action: 'crate_tip_sideways', expression: 'shocked', sfx: 'clapper_snap', pos: { x: 1.35, y: 0.75, z: 0.35 } },
      { t: 0.52, kind: 'prop_focus', target: 'prop', action: 'ricochet_rockets_zig_zag', expression: 'shocked', sfx: 'firework_burst', particleKind: 'fireworks', pos: { x: 0.0, y: 1.3, z: 0.45 } },
      { t: 1.1, kind: 'actor_move', target: 'actor', action: 'unbothered_deadpan_sigh', expression: 'deadpan', sfx: 'firework_burst', particleKind: 'smoke', pos: { x: -1.35, y: 0.9, z: 0.35 } },
      { t: 1.7, kind: 'pose_freeze', target: 'all', action: 'spark_shower_surf', expression: 'wink', sfx: 'shutter_flash', particleKind: 'fireworks', pos: { x: 0.1, y: 1.1, z: 0.35 } },
    ],
  }),

  // ======================== ACT 5: TALOS KNOWS EVERYTHING ========================
  take_5_1: defineTake({
    takeId: 'take_5_1',
    actId: 5,
    indexInAct: 1,
    code: 'TAKE 5-A',
    title: 'Lanterns Beneath Talos',
    actorId: 'last_rite',
    propId: 'sarkaz_mask',
    moodDelta: { love: 2, joy: 0, wonder: 1, chaos: 0 },
    scriptText:
      'Beneath the silver gaze of Talos, the Sarkaz Princess lifts her mask—realizing Sauin lives wherever friends gather to remember.',
    stageDirection:
      'Last Rite lifts the bone-white Sarkaz Mask toward the colossal orb of Talos as warm soul-lanterns ascend into the starry sky.',
    voId: 'vo_take_5_1',
    sfxCue: 'reward_chime',
    particlePreset: 'lanterns',
    particleCount: 42,
    choreoBeats: [
      { t: 0.08, kind: 'actor_move', target: 'actor', action: 'step_to_cliff_edge', expression: 'neutral', sfx: 'curtain_swish', pos: { x: -1.2, y: 0.95, z: 0.35 } },
      { t: 0.56, kind: 'prop_focus', target: 'prop', action: 'skyward_mask_offering', expression: 'happy', particleKind: 'lanterns', pos: { x: 0.95, y: 1.2, z: 0.35 } },
      { t: 1.14, kind: 'spotlight_shift', target: 'stage', action: 'talos_silver_halo_pulse', expression: 'happy', sfx: 'reward_chime', particleKind: 'hearts', pos: { x: 0.0, y: 2.1, z: -2.2 } },
      { t: 1.72, kind: 'pose_freeze', target: 'all', action: 'serene_sauin_vow', expression: 'happy', sfx: 'shutter_flash', particleKind: 'lanterns', pos: { x: 0.0, y: 1.1, z: 0.3 } },
    ],
  }),

  take_5_2: defineTake({
    takeId: 'take_5_2',
    actId: 5,
    indexInAct: 2,
    code: 'TAKE 5-B',
    title: 'Long-Distance Moon Call',
    actorId: 'last_rite',
    propId: 'suppressor',
    moodDelta: { love: 0, joy: 2, wonder: 0, chaos: 1 },
    scriptText:
      'Um, hello, Mister Talos? Last Rite tries dialing the moon on an Originium Suppressor, cracking up the entire studio!',
    stageDirection:
      'Last Rite holds the hexagonal Originium Suppressor upside-down like a walkie-talkie aimed at Talos while the studio crew bursts out laughing.',
    voId: 'vo_take_5_2',
    sfxCue: 'gag_pop',
    particlePreset: 'sparkles',
    particleCount: 38,
    choreoBeats: [
      { t: 0.08, kind: 'prop_focus', target: 'prop', action: 'flip_upside_down_beep', expression: 'flustered', sfx: 'ui_click', pos: { x: 1.15, y: 1.0, z: 0.4 } },
      { t: 0.56, kind: 'actor_move', target: 'actor', action: 'walkie_talkie_to_moon', expression: 'flustered', sfx: 'gag_pop', particleKind: 'sparkles', pos: { x: -1.15, y: 1.0, z: 0.35 } },
      { t: 1.14, kind: 'actor_move', target: 'actor', action: 'shake_device_blush', expression: 'shocked', particleKind: 'confetti', pos: { x: -0.85, y: 1.05, z: 0.4 } },
      { t: 1.7, kind: 'pose_freeze', target: 'all', action: 'studio_laughter_bow', expression: 'happy', sfx: 'shutter_flash', particleKind: 'sparkles', pos: { x: 0.0, y: 1.0, z: 0.3 } },
    ],
  }),

  take_5_3: defineTake({
    takeId: 'take_5_3',
    actId: 5,
    indexInAct: 3,
    code: 'TAKE 5-C',
    title: 'Mistaken Royalty Beneath Stars',
    actorId: 'ardashir',
    propId: 'sarkaz_mask',
    moodDelta: { love: 1, joy: 0, wonder: 2, chaos: 0 },
    scriptText:
      'Mistaken for royalty yet again, Ardashir contemplates the ancient mask beneath Talos—giving the finale unexpected mythic grandeur.',
    stageDirection:
      'Ardashir gazes serenely at the Sarkaz Mask beside the glowing Originium crystal spire as cosmic stardust swirls across the cliff.',
    voId: 'vo_take_5_3',
    sfxCue: 'reward_chime',
    particlePreset: 'cosmic',
    particleCount: 42,
    choreoBeats: [
      { t: 0.08, kind: 'spotlight_shift', target: 'actor', action: 'azure_moonbeam_spot', expression: 'neutral', sfx: 'curtain_swish', pos: { x: -1.3, y: 1.1, z: 0.35 } },
      { t: 0.56, kind: 'prop_focus', target: 'prop', action: 'contemplate_ancient_mask', expression: 'neutral', particleKind: 'stars', pos: { x: 1.1, y: 1.05, z: 0.35 } },
      { t: 1.15, kind: 'spotlight_shift', target: 'stage', action: 'stardust_spiral_rise', expression: 'deadpan', sfx: 'reward_chime', particleKind: 'stars', pos: { x: 0.0, y: 1.8, z: -1.5 } },
      { t: 1.72, kind: 'pose_freeze', target: 'all', action: 'mythic_profile_still', expression: 'neutral', sfx: 'shutter_flash', particleKind: 'stars', pos: { x: -0.2, y: 1.05, z: 0.3 } },
    ],
  }),

  take_5_4: defineTake({
    takeId: 'take_5_4',
    actId: 5,
    indexInAct: 4,
    code: 'TAKE 5-D',
    title: 'Planetary-Scale Suppressor?!',
    actorId: 'ardashir',
    propId: 'suppressor',
    isVideoCanonical: true,
    moodDelta: { love: 0, joy: 0, wonder: 1, chaos: 2 },
    scriptText:
      'At last, the Sarkaz Princess found Talos! Orbiting high above Talos-II, why is a planetary-sized Suppressor bolted onto the moon?!',
    stageDirection:
      'Dramatic blue-lit profile of Ardashir pondering silently while a colossal 3D Originium Suppressor eclipses the moon Talos overhead!',
    voId: 'vo_take_5_4',
    sfxCue: 'shutter_flash',
    particlePreset: 'cosmic',
    particleCount: 46,
    choreoBeats: [
      { t: 0.08, kind: 'spotlight_shift', target: 'actor', action: 'deep_cerulean_profile_rim', expression: 'deadpan', sfx: 'camera_whir', pos: { x: -1.35, y: 1.05, z: 0.35 } },
      { t: 0.54, kind: 'prop_focus', target: 'prop', action: 'colossal_moon_suppressor_rise', expression: 'shocked', sfx: 'clapper_snap', particleKind: 'stars', pos: { x: 0.4, y: 2.35, z: -2.4 } },
      { t: 1.14, kind: 'prop_focus', target: 'prop', action: 'orbital_amber_beacon_pulse', expression: 'deadpan', sfx: 'mood_up_2', particleKind: 'sparkles', pos: { x: 0.4, y: 2.35, z: -2.4 } },
      { t: 1.72, kind: 'pose_freeze', target: 'all', action: 'cosmic_absurdity_tableau', expression: 'deadpan', sfx: 'shutter_flash', particleKind: 'confetti', pos: { x: 0.0, y: 1.25, z: -0.5 } },
    ],
  }),
});

export const TAKE_LIST = Object.freeze(Object.values(TAKES));

const PAIR_TO_TAKE = new Map();
for (const take of TAKE_LIST) {
  PAIR_TO_TAKE.set(`${take.actId}:${take.actorId}:${take.propId}`, take);
}

export function getTake(actId, actorId, propId) {
  if (!actId || !actorId || !propId) return null;
  return PAIR_TO_TAKE.get(`${Number(actId)}:${actorId}:${propId}`) || null;
}

export function getTakeById(takeId) {
  return (takeId && TAKES[takeId]) || null;
}

export function getTakesForAct(actId) {
  const n = Number(actId);
  return TAKE_LIST.filter((t) => t.actId === n);
}
