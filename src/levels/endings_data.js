// Canonical 5 Branching Endings (END1..END5), deterministic 5-Act RECIPES
// (including exact Bilibili VIDEO_RUN -> {love:4, joy:4, wonder:1, chaos:5} -> END1),
// and exact mood resolution formula (docs/DESIGN.md §6.2 & §7.2).

import { ENDING_THRESHOLD } from './constants.js';

export const ENDINGS = Object.freeze({
  END1: Object.freeze({
    id: 'END1',
    endingId: 'END1',
    code: '//END1',
    number: 1,
    title: 'Strange Sauin',
    dominantMood: null,
    triggerRule: 'All four Studio Moods below 6',
    unlockHint: 'Keep Love, Joy, Wonder, and Chaos balanced below 6 across all five Acts.',
    bodyText:
      "Did the Sarkaz Princess finally find Sauin...? Wait—everyone got candy EXCEPT the Sauin-exclusive Pop Loongs! Hey, Pop Loongs can be Sarkaz too! Left empty-handed, the Pop Loong army chooses TRICK—marching on Seš'qa to take over Talos-II!",
    voText:
      "Ending One: Strange Sauin! Everyone got candy except the Sauin-exclusive Pop Loongs! Left empty-handed, the Pop Loong army chooses trick—marching on Seš'qa to take over Talos-II!",
    voId: 'vo_end_1',
    featuredCast: Object.freeze(['last_rite', 'pop_loong']),
    polaroidScene: Object.freeze({
      theme: 'pop_loong_uprising',
      skyTop: '#2b1638',
      skyBottom: '#612d4b',
      accentColor: '#ff9642',
      frameStamp: 'SAUIN ARCHIVE · REEL 01',
      composition:
        'Wide-eyed Last Rite surrounded by dozens of costumed white Pop Loongs in pumpkin hats, witch caps, and paper Sarkaz horns beneath orange party bunting.',
    }),
  }),

  END2: Object.freeze({
    id: 'END2',
    endingId: 'END2',
    code: '//END2',
    number: 2,
    title: 'The Sauin Universe',
    dominantMood: 'love',
    triggerRule: 'Love >= 6 (highest Studio Mood)',
    unlockHint: 'Fill the Love gauge to 6 or higher as your leading Studio Mood.',
    bodyText:
      "Drawn together by earnest warmth, every corner of Talos-II lights a lantern for the myriad souls! From Fangqu Street to the frontier outposts, a gentle Sauin Universe blooms—and Last Rite didn't even flub her final line!",
    voText:
      'Ending Two: The Sauin Universe! Drawn together by earnest warmth, every corner of Talos-II lights a lantern for the myriad souls—and Last Rite nailed her final line!',
    voId: 'vo_end_2',
    featuredCast: Object.freeze([
      'last_rite',
      'pop_loong',
      'camille',
      'chen_qianyu',
      'rossi',
      'mi_fu',
      'yvonne',
    ]),
    polaroidScene: Object.freeze({
      theme: 'warm_lantern_reunion',
      skyTop: '#3b1838',
      skyBottom: '#8f3b68',
      accentColor: '#ff6fa9',
      frameStamp: 'SAUIN ARCHIVE · REEL 02',
      composition:
        'Golden-pink lantern sky as Last Rite hugs a smiling Pop Loong surrounded by Camille, Chen Qianyu, Rossi, Mi Fu, and Yvonne sharing Sauin sweets.',
    }),
  }),

  END3: Object.freeze({
    id: 'END3',
    endingId: 'END3',
    code: '//END3',
    number: 3,
    title: 'An Unending Parade',
    dominantMood: 'joy',
    triggerRule: 'Joy >= 6 (highest Studio Mood)',
    unlockHint: 'Fill the Joy gauge to 6 or higher as your leading Studio Mood.',
    bodyText:
      'Cut? Never! The commercial spills off the stage into an Unending Sauin Parade! Operators, Landbreakers, and Lankybeasts dance down Fangqu Street till dawn while Witchcraft Hour sells out of every last lollipop!',
    voText:
      'Ending Three: An Unending Parade! The commercial spills off the stage into an all-night carnival down Fangqu Street while Witchcraft Hour sells out of every lollipop!',
    voId: 'vo_end_3',
    featuredCast: Object.freeze([
      'last_rite',
      'rossi',
      'chen_qianyu',
      'injured_landbreaker',
      'lankybeast',
    ]),
    polaroidScene: Object.freeze({
      theme: 'fangqu_carnival_parade',
      skyTop: '#1d2452',
      skyBottom: '#593678',
      accentColor: '#ffd24c',
      frameStamp: 'SAUIN ARCHIVE · REEL 03',
      composition:
        'Dazzling carnival parade float under fireworks with dancing Lankybeasts, candy-tossing Landbreakers, and Last Rite and Rossi leading a festive conga line.',
    }),
  }),

  END4: Object.freeze({
    id: 'END4',
    endingId: 'END4',
    code: '//END4',
    number: 4,
    title: 'Sauin & Sarkaz',
    dominantMood: 'wonder',
    triggerRule: 'Wonder >= 6 (highest Studio Mood)',
    unlockHint: 'Fill the Wonder gauge to 6 or higher as your leading Studio Mood.',
    bodyText:
      "From high above, Talos whispers the truth: so long as the Sarkaz endure, Sauin's light shall never fade! Everyone nods solemnly—except white-haired guest star Ardashir, who politely insists for the tenth time: 'I am NOT a Sarkaz.'",
    voText:
      'Ending Four: Sauin and Sarkaz! Talos whispers that Sauin shall endure as long as the Sarkaz do—while poor Ardashir sighs, for the tenth time, I am not a Sarkaz!',
    voId: 'vo_end_4',
    featuredCast: Object.freeze(['last_rite', 'camille', 'mysterious_sarkaz', 'ardashir']),
    polaroidScene: Object.freeze({
      theme: 'cosmic_talos_tableau',
      skyTop: '#0b1433',
      skyBottom: '#2b3e78',
      accentColor: '#5ec8ff',
      frameStamp: 'SAUIN ARCHIVE · REEL 04',
      composition:
        'Cosmic silver-violet panorama beneath luminous Talos featuring Last Rite, Camille, the Mysterious Sarkaz, and a sighing Ardashir holding a NOT A SARKAZ sign.',
    }),
  }),

  END5: Object.freeze({
    id: 'END5',
    endingId: 'END5',
    code: '//END5',
    number: 5,
    title: 'Sauin Never Exists',
    dominantMood: 'chaos',
    triggerRule: 'Chaos >= 6 (highest Studio Mood)',
    unlockHint: 'Fill the Chaos gauge to 6 or higher as your leading Studio Mood.',
    bodyText:
      'Smoke fills the stage, fireworks orbit the moon, and nobody remembers what they were advertising! The Director tosses his megaphone into the air—maybe Sauin never existed at all, and this whole shoot was a fever dream!',
    voText:
      'Ending Five: Sauin Never Exists! Smoke fills the stage, fireworks orbit the moon, and the Director tosses his megaphone—maybe Sauin was a glorious fever dream all along!',
    voId: 'vo_end_5',
    featuredCast: Object.freeze(['sarkaz_director', 'camille', 'yvonne', 'ardashir', 'suppressor']),
    polaroidScene: Object.freeze({
      theme: 'studio_meltdown_fever_dream',
      skyTop: '#29121c',
      skyBottom: '#632819',
      accentColor: '#ffa630',
      frameStamp: 'SAUIN ARCHIVE · REEL 05',
      composition:
        'Glorious studio meltdown: Sarkaz Director chasing runaway skyrockets, a giant Suppressor bolted onto Talos, Camille grilling steaks, and Yvonne cackling atop the prop pile.',
    }),
  }),
});

export const ENDING_LIST = Object.freeze([
  ENDINGS.END1,
  ENDINGS.END2,
  ENDINGS.END3,
  ENDINGS.END4,
  ENDINGS.END5,
]);

function freezeRecipe(steps) {
  return Object.freeze(steps.map((s) => Object.freeze({ ...s })));
}

// Verified deterministic 5-act choice arrays:
// - VIDEO_RUN & END1 -> { love: 4, joy: 4, wonder: 1, chaos: 5 } (all < 6) -> END1
// - END2             -> { love: 8, joy: 2, wonder: 3, chaos: 1 }           -> END2
// - END3             -> { love: 4, joy: 8, wonder: 4, chaos: 0 }           -> END3
// - END4             -> { love: 3, joy: 3, wonder: 8, chaos: 2 }           -> END4
// - END5             -> { love: 3, joy: 0, wonder: 4, chaos: 8 }           -> END5
const VIDEO_RUN_STEPS = freezeRecipe([
  { actId: 1, actorId: 'last_rite', propId: 'sarkaz_mask', takeId: 'take_1_1' },
  { actId: 2, actorId: 'last_rite', propId: 'lankybeast', takeId: 'take_2_2' },
  { actId: 3, actorId: 'last_rite', propId: 'one_handed_sword', takeId: 'take_3_1' },
  { actId: 4, actorId: 'mi_fu', propId: 'candy_chest', takeId: 'take_4_3' },
  { actId: 5, actorId: 'ardashir', propId: 'suppressor', takeId: 'take_5_4' },
]);

export const RECIPES = Object.freeze({
  VIDEO_RUN: VIDEO_RUN_STEPS,
  END1: VIDEO_RUN_STEPS,
  END2: freezeRecipe([
    { actId: 1, actorId: 'last_rite', propId: 'sarkaz_mask', takeId: 'take_1_1' },
    { actId: 2, actorId: 'last_rite', propId: 'pop_loong', takeId: 'take_2_1' },
    { actId: 3, actorId: 'last_rite', propId: 'one_handed_sword', takeId: 'take_3_1' },
    { actId: 4, actorId: 'last_rite', propId: 'candy_chest', takeId: 'take_4_1' },
    { actId: 5, actorId: 'last_rite', propId: 'sarkaz_mask', takeId: 'take_5_1' },
  ]),
  END3: freezeRecipe([
    { actId: 1, actorId: 'last_rite', propId: 'roast_steak', takeId: 'take_1_2' },
    { actId: 2, actorId: 'last_rite', propId: 'lankybeast', takeId: 'take_2_2' },
    { actId: 3, actorId: 'rossi', propId: 'one_handed_sword', takeId: 'take_3_3' },
    { actId: 4, actorId: 'last_rite', propId: 'fireworks', takeId: 'take_4_2' },
    { actId: 5, actorId: 'ardashir', propId: 'sarkaz_mask', takeId: 'take_5_3' },
  ]),
  END4: freezeRecipe([
    { actId: 1, actorId: 'camille', propId: 'sarkaz_mask', takeId: 'take_1_3' },
    { actId: 2, actorId: 'chen_qianyu', propId: 'pop_loong', takeId: 'take_2_3' },
    { actId: 3, actorId: 'rossi', propId: 'one_handed_sword', takeId: 'take_3_3' },
    { actId: 4, actorId: 'mi_fu', propId: 'candy_chest', takeId: 'take_4_3' },
    { actId: 5, actorId: 'ardashir', propId: 'sarkaz_mask', takeId: 'take_5_3' },
  ]),
  END5: freezeRecipe([
    { actId: 1, actorId: 'camille', propId: 'roast_steak', takeId: 'take_1_4' },
    { actId: 2, actorId: 'chen_qianyu', propId: 'lankybeast', takeId: 'take_2_4' },
    { actId: 3, actorId: 'rossi', propId: 'lollipop', takeId: 'take_3_4' },
    { actId: 4, actorId: 'mi_fu', propId: 'fireworks', takeId: 'take_4_4' },
    { actId: 5, actorId: 'last_rite', propId: 'sarkaz_mask', takeId: 'take_5_1' },
  ]),
});

export function resolveEndingId(moods = {}) {
  const love = Number(moods.love) || 0;
  const joy = Number(moods.joy) || 0;
  const wonder = Number(moods.wonder) || 0;
  const chaos = Number(moods.chaos) || 0;

  const peak = Math.max(love, joy, wonder, chaos);
  if (peak < ENDING_THRESHOLD) {
    return 'END1';
  }
  // Deterministic tie-break order per docs/DESIGN.md §6.2:
  // love -> END2, joy -> END3, wonder -> END4, chaos -> END5
  if (love === peak) return 'END2';
  if (joy === peak) return 'END3';
  if (wonder === peak) return 'END4';
  return 'END5';
}

export function resolveEnding(moods = {}) {
  const endingId = resolveEndingId(moods);
  return ENDINGS[endingId];
}

export function getEnding(endingId) {
  return (endingId && ENDINGS[endingId]) || null;
}
