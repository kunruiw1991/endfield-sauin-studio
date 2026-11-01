// Pure game constants, phase enums, mood metadata, and studio VO descriptors
// for "New Era for the Myriad Souls" (Endfield Sauin Film Studio).

export const GAME_TITLE = 'New Era for the Myriad Souls';
export const GAME_SUBTITLE = 'Endfield Sauin Film Studio';
export const EVENT_TAGLINE =
  'Traditions leap back to life in our memories. Once again, Sauin arrives—for the myriad souls, and for us, a new era of light and shadow.';

export const STORAGE_KEY = 'endfield_sauin_v1';
export const DEFAULT_SEED = 20261031;
export const FIXED_DT = 1 / 60;

export const MOOD_KEYS = Object.freeze(['love', 'joy', 'wonder', 'chaos']);
export const MOOD_MAX = 8;
export const MOOD_RAW_MAX = 10;
export const ENDING_THRESHOLD = 6;

export const TOTAL_ACTS = 5;
export const TOTAL_TAKES = 20;
export const TOTAL_ENDINGS = 5;
export const TOTAL_COMMISSIONS = 8;
export const TOTAL_OROBERYL = 300;
export const TOTAL_TCREDS = 40000;

export const CLAPPER_DURATION = 0.65;
export const TAKE_DURATION = 2.2;
export const TAKE_SKIP_AFTER = 0.5;

export const PHASES = Object.freeze({
  TITLE: 'title',
  CLAPPER: 'clapper',
  DIALOGUE: 'dialogue',
  BLOCKING: 'blocking',
  ROLLING: 'rolling',
  TAKE_RESULT: 'take_result',
  ENDING: 'ending',
});

export const PHASE_LIST = Object.freeze([
  PHASES.TITLE,
  PHASES.CLAPPER,
  PHASES.DIALOGUE,
  PHASES.BLOCKING,
  PHASES.ROLLING,
  PHASES.TAKE_RESULT,
  PHASES.ENDING,
]);

export const SLOT_KINDS = Object.freeze({
  ACTOR: 'actor',
  PROP: 'prop',
});

export const TABS = Object.freeze({
  ACTORS: 'actors',
  PROPS: 'props',
});

export const MODALS = Object.freeze({
  ALBUM: 'album',
  REWARDS: 'rewards',
  DIALOGUE_LOG: 'dialogue_log',
  GUIDE: 'guide',
});

export const MOOD_META = Object.freeze({
  love: Object.freeze({
    id: 'love',
    key: 'love',
    label: 'Love',
    shortLabel: 'LOVE',
    motif: 'Winged Heart',
    color: '#ff6fa9',
    glowColor: '#ff9ec6',
    darkColor: '#42162b',
    endingId: 'END2',
    description: 'Heartfelt warmth, shared sweets, and gentle Sauin camaraderie.',
  }),
  joy: Object.freeze({
    id: 'joy',
    key: 'joy',
    label: 'Joy',
    shortLabel: 'JOY',
    motif: 'Laughing Bunny',
    color: '#ffd24c',
    glowColor: '#ffe88a',
    darkColor: '#45350e',
    endingId: 'END3',
    description: 'Festive cheer, comedic charm, and all-night carnival spirit.',
  }),
  wonder: Object.freeze({
    id: 'wonder',
    key: 'wonder',
    label: 'Wonder',
    shortLabel: 'WONDER',
    motif: 'Azure Starburst',
    color: '#5ec8ff',
    glowColor: '#9ee2ff',
    darkColor: '#102e45',
    endingId: 'END4',
    description: 'Sarkaz folklore, starlit stagecraft, and cosmic awe beneath Talos.',
  }),
  chaos: Object.freeze({
    id: 'chaos',
    key: 'chaos',
    label: 'Chaos',
    shortLabel: 'CHAOS',
    motif: 'Wild Scribble',
    color: '#ffa630',
    glowColor: '#ffc978',
    darkColor: '#3d2108',
    endingId: 'END5',
    description: 'Off-script stunts, runaway pyrotechnics, and glorious set mayhem.',
  }),
});

export const TUTORIAL_STEPS = Object.freeze([
  Object.freeze({
    step: 1,
    key: 'cast_slot',
    title: 'Cast Actor & Prop',
    body: 'Drag or tap one Actor and one Prop onto the red stage marks.',
    voId: 'vo_tut_cast',
  }),
  Object.freeze({
    step: 2,
    key: 'mood_filmstrip',
    title: 'Preview Mood Gauges',
    body: 'Every pairing shifts Love, Joy, Wonder, or Chaos—reach 6+ to unlock special endings!',
    voId: null,
  }),
  Object.freeze({
    step: 3,
    key: 'roll_camera',
    title: 'Roll Camera!',
    body: 'Both marks are set! Press Roll Camera! to film the take, or Reshoot anytime to collect all 20 takes.',
    voId: null,
  }),
]);

export const GUIDE_SECTIONS = Object.freeze([
  Object.freeze({
    heading: '1. Direct Five Sauin Promo Acts',
    body: 'Watch or skip each pre-shoot cutscene, then place one Actor and one Prop onto the stage marks (drag-and-drop or single-tap). Pay attention in Acts 4 and 5 when the Actor and Prop marks swap sides!',
  }),
  Object.freeze({
    heading: '2. Shape the Four Studio Moods',
    body: 'Each filmed combination boosts Love, Joy, Wonder, or Chaos by +1 (^) or +2 (^^). Use Reshoot after any take to record alternate pairings for your Film Album before advancing.',
  }),
  Object.freeze({
    heading: '3. Unlock All Five Branching Endings',
    body: 'After Act 5, if any Mood reaches 6 or higher, the highest Mood determines your ending (END2..END5). Keep all four Moods below 6 to discover END1: Strange Sauin!',
  }),
  Object.freeze({
    heading: '4. Interactive Stage Gags & Commissions',
    body: 'Tap hidden stage details (curtain ghost-bunnies, neon signs, rustling bushes, Originium crystals) for bonus sparkles, and claim 300 Oroberyl across 8 Studio Commissions.',
  }),
]);

export const STUDIO_VO_LINES = Object.freeze({
  vo_title_welcome: Object.freeze({
    voId: 'vo_title_welcome',
    speakerId: 'sarkaz_director',
    speaker: 'Sarkaz Director',
    voicePersona: 'vanguard',
    priority: 2,
    text: 'Welcome to the Sauin promo shoot! Places, everyone—New Era for the Myriad Souls!',
  }),
  vo_clapper_start: Object.freeze({
    voId: 'vo_clapper_start',
    speakerId: 'sarkaz_director',
    speaker: 'Sarkaz Director',
    voicePersona: 'vanguard',
    priority: 3,
    text: 'Quiet on set! Scene one, rolling—and action!',
  }),
  vo_tut_cast: Object.freeze({
    voId: 'vo_tut_cast',
    speakerId: 'sarkaz_director',
    speaker: 'Sarkaz Director',
    voicePersona: 'vanguard',
    priority: 2,
    text: 'Drag or tap one actor and one prop onto their stage marks, then roll camera!',
  }),
  vo_roll_action: Object.freeze({
    voId: 'vo_roll_action',
    speakerId: 'sarkaz_director',
    speaker: 'Sarkaz Director',
    voicePersona: 'vanguard',
    priority: 2,
    text: 'Lights, camera—roll it!',
  }),
  vo_reshoot: Object.freeze({
    voId: 'vo_reshoot',
    speakerId: 'sarkaz_director',
    speaker: 'Sarkaz Director',
    voicePersona: 'vanguard',
    priority: 2,
    text: "Cut, cut! Reset the props—let's try another take!",
  }),
  vo_album_open: Object.freeze({
    voId: 'vo_album_open',
    speakerId: 'stage_narrator',
    speaker: 'Stage Narrator',
    voicePersona: 'narrator',
    priority: 1,
    text: 'The Film Album! Replay your favorite takes and track all five Sauin endings.',
  }),
  vo_rewards_claim: Object.freeze({
    voId: 'vo_rewards_claim',
    speakerId: 'last_rite',
    speaker: 'Last Rite',
    voicePersona: 'support',
    priority: 2,
    text: 'Oh, thank you! Here are your Sauin studio rewards!',
  }),
  vo_all_complete: Object.freeze({
    voId: 'vo_all_complete',
    speakerId: 'sarkaz_director',
    speaker: 'Sarkaz Director',
    voicePersona: 'vanguard',
    priority: 4,
    text: 'Bravo, Director! Every single take and ending is in the can—an absolute masterpiece!',
  }),
});

export function createEmptyMoods() {
  return { love: 0, joy: 0, wonder: 0, chaos: 0 };
}

export function clampMoodValue(value, max = MOOD_MAX) {
  const num = Number(value) || 0;
  return Math.min(max, Math.max(0, num));
}

export function formatMoodValue(value, max = MOOD_MAX) {
  return `${clampMoodValue(value, max)}/${max}`;
}

