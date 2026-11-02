/**
 * Neural English Voiceover Player, Manifest Verifier & BGM Ducking Controller.
 * Owner: audio-vo
 *
 * Strictly uses pre-rendered Neural English MP3s (assets/vo/*.mp3 + manifest.json)
 * via HTML5 Audio + WebAudio MediaElementAudioSourceNode with deterministic
 * simulation-step fallback when WebAudio/autoplay is locked in headless browsers.
 * NEVER uses browser speechSynthesis (speechSynthesisUsed === false always).
 */

const COOLDOWN_MS = 600;
const MANIFEST_URL = './assets/vo/manifest.json';

// Canonical 52-clip metadata fallback matching assets/vo/manifest.json 1-to-1
// so synchronous playVO() calls at frame 0 always have exact speaker, text,
// priority, and durationMs even while fetch() is still in flight.
export const FALLBACK_VO_MANIFEST = Object.freeze({
  vo_title_welcome: {
    file: 'assets/vo/vo_title_welcome.mp3',
    speaker: 'Sarkaz Director',
    voicePersona: 'vanguard',
    priority: 2,
    durationMs: 5493,
    text: 'Welcome to the Sauin promo shoot! Places, everyone—New Era for the Myriad Souls!',
  },
  vo_clapper_start: {
    file: 'assets/vo/vo_clapper_start.mp3',
    speaker: 'Sarkaz Director',
    voicePersona: 'vanguard',
    priority: 3,
    durationMs: 3748,
    text: 'Quiet on set! Scene one, rolling—and action!',
  },
  vo_tut_cast: {
    file: 'assets/vo/vo_tut_cast.mp3',
    speaker: 'Sarkaz Director',
    voicePersona: 'vanguard',
    priority: 2,
    durationMs: 4082,
    text: 'Drag or tap one actor and one prop onto their stage marks, then roll camera!',
  },
  vo_roll_action: {
    file: 'assets/vo/vo_roll_action.mp3',
    speaker: 'Sarkaz Director',
    voicePersona: 'vanguard',
    priority: 2,
    durationMs: 1625,
    text: 'Lights, camera—roll it!',
  },
  vo_reshoot: {
    file: 'assets/vo/vo_reshoot.mp3',
    speaker: 'Sarkaz Director',
    voicePersona: 'vanguard',
    priority: 2,
    durationMs: 4095,
    text: "Cut, cut! Reset the props—let's try another take!",
  },
  vo_album_open: {
    file: 'assets/vo/vo_album_open.mp3',
    speaker: 'Stage Narrator',
    voicePersona: 'narrator',
    priority: 1,
    durationMs: 5264,
    text: 'The Film Album! Replay your favorite takes and track all five Sauin endings.',
  },
  vo_rewards_claim: {
    file: 'assets/vo/vo_rewards_claim.mp3',
    speaker: 'Last Rite',
    voicePersona: 'support',
    priority: 2,
    durationMs: 3822,
    text: 'Oh, thank you! Here are your Sauin studio rewards!',
  },
  vo_all_complete: {
    file: 'assets/vo/vo_all_complete.mp3',
    speaker: 'Sarkaz Director',
    voicePersona: 'vanguard',
    priority: 4,
    durationMs: 5770,
    text: 'Bravo, Director! Every single take and ending is in the can—an absolute masterpiece!',
  },
  vo_s1_dlg_1: {
    file: 'assets/vo/vo_s1_dlg_1.mp3',
    speaker: 'Mysterious Sarkaz',
    voicePersona: 'phantom_boss',
    priority: 3,
    durationMs: 10800,
    text: 'O most noble Sarkaz Princess! Where walk the Myriad Souls, Sauin must follow to guide them home—two halves bound by fate, forever inseparable!',
  },
  vo_s1_dlg_2: {
    file: 'assets/vo/vo_s1_dlg_2.mp3',
    speaker: 'Camille',
    voicePersona: 'endministrator',
    priority: 3,
    durationMs: 3724,
    text: 'Ahem. Operator Last Rite, the cameras are already rolling.',
  },
  vo_s1_dlg_3: {
    file: 'assets/vo/vo_s1_dlg_3.mp3',
    speaker: 'Last Rite',
    voicePersona: 'support',
    priority: 3,
    durationMs: 5450,
    text: "R-Rolling already?! Oh, I'm so sorry! Please, carry right on!",
  },
  vo_s1_dlg_4: {
    file: 'assets/vo/vo_s1_dlg_4.mp3',
    speaker: 'Mysterious Sarkaz',
    voicePersona: 'phantom_boss',
    priority: 3,
    durationMs: 7800,
    text: 'From Terra to Talos-II, farewells never cease for the Sarkaz... yet the Sauin festival that lights their way has faded from memory.',
  },
  vo_s1_dlg_5: {
    file: 'assets/vo/vo_s1_dlg_5.mp3',
    speaker: 'Mysterious Sarkaz',
    voicePersona: 'phantom_boss',
    priority: 3,
    durationMs: 9120,
    text: 'O noble heir of the Royal Court! A sacred duty rests upon your shoulders—reclaim Sauin! Bring back the festival!',
  },
  vo_s1_dlg_6: {
    file: 'assets/vo/vo_s1_dlg_6.mp3',
    speaker: 'Mysterious Sarkaz',
    voicePersona: 'phantom_boss',
    priority: 3,
    durationMs: 4548,
    text: 'Where walk the Myriad Souls... Sauin must shine again.',
  },
  vo_s2_dlg_1: {
    file: 'assets/vo/vo_s2_dlg_1.mp3',
    speaker: 'Sarkaz Director',
    voicePersona: 'vanguard',
    priority: 3,
    durationMs: 5676,
    text: 'Sponsor plug first—places, everyone! Princess, hit your mark and read the cue card!',
  },
  vo_s2_dlg_2: {
    file: 'assets/vo/vo_s2_dlg_2.mp3',
    speaker: 'Last Rite',
    voicePersona: 'support',
    priority: 3,
    durationMs: 3645,
    text: 'Unbeatable value, enchanting deals—only at Witchcraft Hour!',
  },
  vo_s3_dlg_1: {
    file: 'assets/vo/vo_s3_dlg_1.mp3',
    speaker: 'Injured Landbreaker',
    voicePersona: 'phantom_boss',
    priority: 3,
    durationMs: 6025,
    text: "Witchcraft Hour's Sauin Mega-Bonanza... gulp... huge discounts, unbeatable bargains...",
  },
  vo_s3_dlg_2: {
    file: 'assets/vo/vo_s3_dlg_2.mp3',
    speaker: 'Last Rite',
    voicePersona: 'support',
    priority: 3,
    durationMs: 3807,
    text: 'How on earth did you convince an actual Landbreaker to film a holiday commercial?!',
  },
  vo_s3_dlg_3: {
    file: 'assets/vo/vo_s3_dlg_3.mp3',
    speaker: 'Rossi',
    voicePersona: 'pumpkin_sprite',
    priority: 3,
    durationMs: 4972,
    text: 'Heh! A fang of the Wolfpack has plenty of ways to be persuasive!',
  },
  vo_s4_dlg_1: {
    file: 'assets/vo/vo_s4_dlg_1.mp3',
    speaker: 'Mi Fu',
    voicePersona: 'announcer',
    priority: 3,
    durationMs: 5671,
    text: "Huh? A film shoot? So you're the crew the boss mentioned? Wait—Sauin?",
  },
  vo_s4_dlg_2: {
    file: 'assets/vo/vo_s4_dlg_2.mp3',
    speaker: 'Last Rite',
    voicePersona: 'support',
    priority: 3,
    durationMs: 4869,
    text: 'Y-Yes! Witchcraft Hour is also running a special Sauin promotional event...',
  },
  vo_s4_dlg_3: {
    file: 'assets/vo/vo_s4_dlg_3.mp3',
    speaker: 'Mi Fu',
    voicePersona: 'announcer',
    priority: 3,
    durationMs: 6048,
    text: "Hah? A promo sale? All this buildup, and you're pitching coupons right on the film set.",
  },
  vo_s4_dlg_4: {
    file: 'assets/vo/vo_s4_dlg_4.mp3',
    speaker: 'Last Rite',
    voicePersona: 'support',
    priority: 3,
    durationMs: 4998,
    text: 'Um... I can even apply for an exclusive Patrol Squad discount for your whole team!',
  },
  vo_s5_dlg_1: {
    file: 'assets/vo/vo_s5_dlg_1.mp3',
    speaker: 'Last Rite',
    voicePersona: 'support',
    priority: 3,
    durationMs: 4182,
    text: 'H-Hello there! Excuse me, are you... a fellow Sarkaz?',
  },
  vo_s5_dlg_2: {
    file: 'assets/vo/vo_s5_dlg_2.mp3',
    speaker: 'Last Rite',
    voicePersona: 'support',
    priority: 3,
    durationMs: 4278,
    text: 'Oh—a Banshee! Might you be interested in celebrating Sauin?',
  },
  vo_s5_dlg_3: {
    file: 'assets/vo/vo_s5_dlg_3.mp3',
    speaker: 'Ardashir',
    voicePersona: 'endministrator',
    priority: 3,
    durationMs: 2307,
    text: "...No. I'm afraid you have the wrong person.",
  },
  vo_s5_dlg_4: {
    file: 'assets/vo/vo_s5_dlg_4.mp3',
    speaker: 'Last Rite',
    voicePersona: 'support',
    priority: 3,
    durationMs: 7408,
    text: 'Ack—sorry, my mistake! Still... any interest in Sauin? The discounts are seriously huge...',
  },
  vo_take_1_1: {
    file: 'assets/vo/vo_take_1_1.mp3',
    speaker: 'Stage Narrator',
    voicePersona: 'narrator',
    priority: 3,
    durationMs: 7391,
    text: 'Wearing a borrowed ritual mask, the shy Sarkaz Princess vows to bring Sauin home—once she stops apologizing to the props!',
  },
  vo_take_1_2: {
    file: 'assets/vo/vo_take_1_2.mp3',
    speaker: 'Stage Narrator',
    voicePersona: 'narrator',
    priority: 3,
    durationMs: 7640,
    text: 'Forget ancient prophecies—the Sarkaz Princess discovers that sizzling roast steak summons departed appetites faster than any ritual!',
  },
  vo_take_1_3: {
    file: 'assets/vo/vo_take_1_3.mp3',
    speaker: 'Stage Narrator',
    voicePersona: 'narrator',
    priority: 3,
    durationMs: 7290,
    text: "Wait—since when was the Sarkaz Princess this suave?! Camille's brooding masked monologue turns the commercial into cinema!",
  },
  vo_take_1_4: {
    file: 'assets/vo/vo_take_1_4.mp3',
    speaker: 'Stage Narrator',
    voicePersona: 'narrator',
    priority: 3,
    durationMs: 7717,
    text: 'Camille ignores the script entirely and turns Act One into a midnight cooking show. The crew is already lining up for seconds!',
  },
  vo_take_2_1: {
    file: 'assets/vo/vo_take_2_1.mp3',
    speaker: 'Stage Narrator',
    voicePersona: 'narrator',
    priority: 3,
    durationMs: 7626,
    text: 'On Fangqu Street, the Sarkaz Princess comforts a weeping Pop Loong—sharing her very first Sauin candy under the neon lights.',
  },
  vo_take_2_2: {
    file: 'assets/vo/vo_take_2_2.mp3',
    speaker: 'Stage Narrator',
    voicePersona: 'narrator',
    priority: 3,
    durationMs: 8792,
    text: 'The Sarkaz Princess arrived at Fangqu Street hunting for candy, only to interrogate a silent Lankybeast... Did it understand a single word?',
  },
  vo_take_2_3: {
    file: 'assets/vo/vo_take_2_3.mp3',
    speaker: 'Stage Narrator',
    voicePersona: 'narrator',
    priority: 3,
    durationMs: 6647,
    text: 'Stand-in Princess Chen Qianyu teams up with Pop Loong for a dazzling Wuling sword-dance that showers the street in sweets!',
  },
  vo_take_2_4: {
    file: 'assets/vo/vo_take_2_4.mp3',
    speaker: 'Stage Narrator',
    voicePersona: 'narrator',
    priority: 3,
    durationMs: 8226,
    text: 'Disaster on Fangqu Street! Chen Qianyu challenges the Lankybeast to a jumping contest, launching the prop crew into the hedges!',
  },
  vo_take_3_1: {
    file: 'assets/vo/vo_take_3_1.mp3',
    speaker: 'Stage Narrator',
    voicePersona: 'narrator',
    priority: 3,
    durationMs: 8331,
    text: 'To reclaim the stolen candy and save Sauin, the Sarkaz Princess draws cold steel—though the Landbreaker looks more scared of forgetting his lines!',
  },
  vo_take_3_2: {
    file: 'assets/vo/vo_take_3_2.mp3',
    speaker: 'Stage Narrator',
    voicePersona: 'narrator',
    priority: 3,
    durationMs: 7784,
    text: 'Instead of a blade, the Princess offers a giant swirl lollipop! Even the fiercest Landbreaker melts for Sauin sweetness.',
  },
  vo_take_3_3: {
    file: 'assets/vo/vo_take_3_3.mp3',
    speaker: 'Stage Narrator',
    voicePersona: 'narrator',
    priority: 3,
    durationMs: 8226,
    text: 'Stunt-double Rossi steals the spotlight! With one flashy Wolfpack flourish, the Landbreaker surrenders every last piece of candy!',
  },
  vo_take_3_4: {
    file: 'assets/vo/vo_take_3_4.mp3',
    speaker: 'Stage Narrator',
    voicePersona: 'narrator',
    priority: 3,
    durationMs: 6047,
    text: "Wait a minute—Rossi uses the giant lollipop to extort both the Landbreaker and the film crew's snack table!",
  },
  vo_take_4_1: {
    file: 'assets/vo/vo_take_4_1.mp3',
    speaker: 'Stage Narrator',
    voicePersona: 'narrator',
    priority: 3,
    durationMs: 7443,
    text: 'The Sarkaz Princess shares the recovered Candy Chest with the whole Patrol Squad—turning a late-night shift into a warm Sauin feast!',
  },
  vo_take_4_2: {
    file: 'assets/vo/vo_take_4_2.mp3',
    speaker: 'Stage Narrator',
    voicePersona: 'narrator',
    priority: 3,
    durationMs: 8078,
    text: "Boom! The Princess launches a sky full of Sauin fireworks over the outpost—even Witchcraft Hour couldn't buy better publicity!",
  },
  vo_take_4_3: {
    file: 'assets/vo/vo_take_4_3.mp3',
    speaker: 'Stage Narrator',
    voicePersona: 'narrator',
    priority: 3,
    durationMs: 8873,
    text: "The Sarkaz Princess—wait, Mi Fu?!—recovered the candy, while Captain Yvonne laughs maniacally on the chest... isn't she having way too much fun?!",
  },
  vo_take_4_4: {
    file: 'assets/vo/vo_take_4_4.mp3',
    speaker: 'Stage Narrator',
    voicePersona: 'narrator',
    priority: 3,
    durationMs: 8021,
    text: 'Who aimed the fireworks indoors?! Rockets ricochet across the set while Mi Fu deadpans through absolute pyrotechnic pandemonium!',
  },
  vo_take_5_1: {
    file: 'assets/vo/vo_take_5_1.mp3',
    speaker: 'Stage Narrator',
    voicePersona: 'narrator',
    priority: 3,
    durationMs: 7443,
    text: 'Beneath the silver gaze of Talos, the Sarkaz Princess lifts her mask—realizing Sauin lives wherever friends gather to remember.',
  },
  vo_take_5_2: {
    file: 'assets/vo/vo_take_5_2.mp3',
    speaker: 'Stage Narrator',
    voicePersona: 'narrator',
    priority: 3,
    durationMs: 8225,
    text: 'Um, hello, Mister Talos? Last Rite tries dialing the moon on an Originium Suppressor, cracking up the entire studio!',
  },
  vo_take_5_3: {
    file: 'assets/vo/vo_take_5_3.mp3',
    speaker: 'Stage Narrator',
    voicePersona: 'narrator',
    priority: 3,
    durationMs: 7847,
    text: 'Mistaken for royalty yet again, Ardashir contemplates the ancient mask beneath Talos—giving the finale unexpected mythic grandeur.',
  },
  vo_take_5_4: {
    file: 'assets/vo/vo_take_5_4.mp3',
    speaker: 'Stage Narrator',
    voicePersona: 'narrator',
    priority: 3,
    durationMs: 8710,
    text: 'At last, the Sarkaz Princess found Talos! Orbiting high above Talos-II, why is a planetary-sized Suppressor bolted onto the moon?!',
  },
  vo_end_1: {
    file: 'assets/vo/vo_end_1.mp3',
    speaker: 'Stage Narrator',
    voicePersona: 'narrator',
    priority: 4,
    durationMs: 12641,
    text: "Ending One: Strange Sauin! Everyone got candy except the Sauin-exclusive Pop Loongs! Left empty-handed, the Pop Loong army chooses trick—marching on Seš'qa to take over Talos-II!",
  },
  vo_end_2: {
    file: 'assets/vo/vo_end_2.mp3',
    speaker: 'Stage Narrator',
    voicePersona: 'narrator',
    priority: 4,
    durationMs: 10448,
    text: 'Ending Two: The Sauin Universe! Drawn together by earnest warmth, every corner of Talos-II lights a lantern for the myriad souls—and Last Rite nailed her final line!',
  },
  vo_end_3: {
    file: 'assets/vo/vo_end_3.mp3',
    speaker: 'Stage Narrator',
    voicePersona: 'narrator',
    priority: 4,
    durationMs: 9800,
    text: 'Ending Three: An Unending Parade! The commercial spills off the stage into an all-night carnival down Fangqu Street while Witchcraft Hour sells out of every lollipop!',
  },
  vo_end_4: {
    file: 'assets/vo/vo_end_4.mp3',
    speaker: 'Stage Narrator',
    voicePersona: 'narrator',
    priority: 4,
    durationMs: 11173,
    text: 'Ending Four: Sauin and Sarkaz! Talos whispers that Sauin shall endure as long as the Sarkaz do—while poor Ardashir sighs, for the tenth time, I am not a Sarkaz!',
  },
  vo_end_5: {
    file: 'assets/vo/vo_end_5.mp3',
    speaker: 'Stage Narrator',
    voicePersona: 'narrator',
    priority: 4,
    durationMs: 11216,
    text: 'Ending Five: Sauin Never Exists! Smoke fills the stage, fireworks orbit the moon, and the Director tosses his megaphone—maybe Sauin was a glorious fever dream all along!',
  },
});

function nowWallMs() {
  return typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
}

function normalizeClipPath(filePath) {
  if (!filePath) return '';
  if (filePath.startsWith('./') || filePath.startsWith('/') || filePath.startsWith('blob:')) {
    return filePath;
  }
  return `./${filePath}`;
}

export function createVoPlayer({ getContext, isUnlocked, events, onDuckChange }) {
  let manifest = { ...FALLBACK_VO_MANIFEST };
  let manifestLoaded = false;
  let clipsTotal = Object.keys(manifest).length;
  const verifiedSet = new Set();
  const blobUrls = new Map();
  let initPromise = null;

  let voMuted = false;
  let simTimeMs = 0;
  let playToken = 0;
  let active = null; // { token, voId, speaker, text, priority, durationMs, remainingMs }
  let lastVoId = null;

  const lastPlayedAt = new Map(); // voId -> { simMs, wallMs }
  const playedIds = [];
  const playedIdSet = new Set();

  let audioEl = null;
  let mediaSourceConnected = false;
  let voGainNode = null;

  function ensureAudioElement() {
    if (audioEl || typeof Audio === 'undefined') return audioEl;
    audioEl = new Audio();
    audioEl.preload = 'auto';
    audioEl.crossOrigin = 'anonymous';
    audioEl.addEventListener('ended', () => {
      if (active) {
        finishActive(active.token);
      }
    });
    return audioEl;
  }

  function connectWebAudioGraphIfUnlocked() {
    const audioCtx = getContext ? getContext() : null;
    const el = ensureAudioElement();
    if (!audioCtx || !el || audioCtx.state !== 'running') return;
    if (mediaSourceConnected) {
      if (voGainNode) {
        voGainNode.gain.setValueAtTime(voMuted ? 0.0 : 1.0, audioCtx.currentTime);
      }
      return;
    }
    try {
      const srcNode = audioCtx.createMediaElementSource(el);
      voGainNode = audioCtx.createGain();
      voGainNode.gain.setValueAtTime(voMuted ? 0.0 : 1.0, audioCtx.currentTime);
      srcNode.connect(voGainNode);
      voGainNode.connect(audioCtx.destination);
      mediaSourceConnected = true;
    } catch (_) {
      // Fallback safely to direct HTMLAudioElement output if MediaElementSource fails.
    }
  }

  async function verifySingleClip(voId, entry) {
    if (verifiedSet.has(voId)) return true;
    if (typeof fetch !== 'function' || !entry || !entry.file) return false;
    try {
      const url = normalizeClipPath(entry.file);
      const res = await fetch(url);
      if (!res.ok) return false;
      const blob = await res.blob();
      if (blob.size > 4000 && Number(entry.durationMs) >= 400) {
        verifiedSet.add(voId);
        if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function' && !blobUrls.has(voId)) {
          blobUrls.set(voId, URL.createObjectURL(blob));
        }
        return true;
      }
    } catch (_) {
      // Ignore offline/early-boot network errors cleanly.
    }
    return false;
  }

  async function loadAndVerifyManifest() {
    if (typeof fetch !== 'function') return false;
    try {
      const res = await fetch(MANIFEST_URL);
      if (!res.ok) return false;
      const data = await res.json();
      if (data && typeof data === 'object') {
        manifest = { ...FALLBACK_VO_MANIFEST, ...data };
        manifestLoaded = true;
        const ids = Object.keys(data);
        clipsTotal = ids.length;

        // Verify all 52 MP3 files in fast concurrent batches of 8 over localhost.
        const concurrency = 8;
        let cursor = 0;
        const workers = Array.from({ length: Math.min(concurrency, ids.length) }, async () => {
          while (cursor < ids.length) {
            const id = ids[cursor++];
            await verifySingleClip(id, manifest[id]);
          }
        });
        await Promise.all(workers);
        return true;
      }
    } catch (_) {
      // Safe fallback to built-in metadata table when manifest is unavailable.
    }
    return false;
  }

  function init() {
    ensureAudioElement();
    if (!initPromise) {
      initPromise = loadAndVerifyManifest();
    }
    return initPromise;
  }

  function finishActive(token, { emitEnded = true } = {}) {
    if (!active || active.token !== token) return;
    const endedVoId = active.voId;
    active = null;

    if (audioEl) {
      try {
        audioEl.pause();
        audioEl.currentTime = 0;
      } catch (_) {
        // Ignore media reset errors.
      }
    }

    if (onDuckChange) {
      onDuckChange(false);
    }

    if (emitEnded && events && typeof events.emit === 'function') {
      events.emit('voEnded', { voId: endedVoId });
    }
  }

  function stopVO() {
    if (!active) return;
    finishActive(active.token, { emitEnded: true });
  }

  function playVO(voId, opts = {}) {
    if (!voId || typeof voId !== 'string') {
      return Promise.resolve(false);
    }
    const entry = manifest[voId] || FALLBACK_VO_MANIFEST[voId];
    if (!entry) {
      return Promise.resolve(false);
    }

    const force = Boolean(opts && opts.force);
    if (opts && opts.unmute && voMuted) {
      setMuted(false);
    }
    if (voMuted) {
      lastVoId = voId;
      return Promise.resolve(false);
    }

    const incomingPriority = Number.isFinite(opts?.priority)
      ? opts.priority
      : Number.isFinite(entry.priority)
        ? entry.priority
        : 2;

    const wallMs = nowWallMs();

    // 600 ms anti-spam cooldown for identical clip unless { force: true }
    if (!force && lastPlayedAt.has(voId)) {
      const prev = lastPlayedAt.get(voId);
      const elapsedMs = Math.max(simTimeMs - prev.simMs, wallMs - prev.wallMs);
      if (elapsedMs < COOLDOWN_MS) {
        return Promise.resolve(false);
      }
    }

    // Priority check: higher or equal priority preempts active VO; lower priority skips.
    if (active && !force && incomingPriority < active.priority) {
      return Promise.resolve(false);
    }

    // Preempt any active clip cleanly without firing a stale voEnded clear-caption event.
    if (active) {
      const oldToken = active.token;
      active = null;
      if (audioEl) {
        try {
          audioEl.pause();
          audioEl.currentTime = 0;
        } catch (_) {
          // Ignore pause errors.
        }
      }
      void oldToken;
    }

    const token = ++playToken;
    const durationMs = Math.max(400, Number(entry.durationMs) || 3000);
    const speaker = entry.speaker || 'Stage Narrator';
    const text = entry.text || '';

    active = {
      token,
      voId,
      speaker,
      text,
      priority: incomingPriority,
      durationMs,
      remainingMs: durationMs,
    };
    lastVoId = voId;

    lastPlayedAt.set(voId, { simMs: simTimeMs, wallMs });
    if (!playedIdSet.has(voId)) {
      playedIdSet.add(voId);
      playedIds.push(voId);
    }

    // Duck BGM immediately (80 ms smooth WebAudio attack + instant logical duck state)
    if (onDuckChange) {
      onDuckChange(!voMuted);
    }

    // Emit voStarted synchronously so captions_hud and getAudioStats() update immediately
    if (events && typeof events.emit === 'function') {
      events.emit('voStarted', {
        voId,
        speaker,
        text,
        durationMs,
      });
    }

    // Trigger clip verification if not yet verified
    if (!manifestLoaded) {
      init();
    } else if (!verifiedSet.has(voId)) {
      verifySingleClip(voId, entry);
    }

    const el = ensureAudioElement();
    if (el && !voMuted) {
      if (isUnlocked && isUnlocked()) {
        connectWebAudioGraphIfUnlocked();
      }
      const srcUrl = blobUrls.get(voId) || normalizeClipPath(entry.file);
      try {
        el.muted = voMuted;
        el.volume = voMuted ? 0.0 : 1.0;
        if (el.src !== srcUrl) {
          el.src = srcUrl;
        }
        try {
          el.currentTime = 0;
        } catch (_) {
          // Ignore seek before metadata ready; fresh src starts at 0.
        }
        const playPromise = el.play();
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(() => {
            // Autoplay-restricted headless browsers reject play() before gesture;
            // deterministic update(dt) timer handles caption & duck lifecycle cleanly.
          });
        }
      } catch (_) {
        // Safe fallback to deterministic timer.
      }
    }

    return Promise.resolve(true);
  }

  function setMuted(flag) {
    voMuted = Boolean(flag);
    const audioCtx = getContext ? getContext() : null;
    if (voGainNode && audioCtx) {
      const now = audioCtx.currentTime;
      voGainNode.gain.cancelScheduledValues(now);
      voGainNode.gain.setValueAtTime(voGainNode.gain.value, now);
      voGainNode.gain.linearRampToValueAtTime(voMuted ? 0.0 : 1.0, now + 0.03);
    }
    if (audioEl) {
      audioEl.muted = voMuted;
      audioEl.volume = voMuted ? 0.0 : 1.0;
    }
    if (voMuted && active) {
      stopVO();
    }
  }

  function onUnlock() {
    connectWebAudioGraphIfUnlocked();
    if (active && audioEl && !voMuted && audioEl.paused) {
      try {
        const p = audioEl.play();
        if (p && typeof p.catch === 'function') {
          p.catch(() => {});
        }
      } catch (_) {
        // Ignore resume errors.
      }
    }
  }

  function update(dt) {
    const stepMs = (Number.isFinite(dt) ? dt : 1 / 60) * 1000;
    simTimeMs += stepMs;
    if (active) {
      active.remainingMs -= stepMs;
      if (active.remainingMs <= 0) {
        finishActive(active.token, { emitEnded: true });
      }
    }
  }

  function getClipMeta(voId) {
    const entry = manifest[voId] || FALLBACK_VO_MANIFEST[voId];
    if (!entry) return null;
    return {
      voId,
      file: entry.file,
      speaker: entry.speaker,
      voicePersona: entry.voicePersona,
      priority: entry.priority,
      durationMs: entry.durationMs,
      text: entry.text,
    };
  }

  function replayLastVO(opts = {}) {
    const targetVoId = opts?.voId || (active ? active.voId : null) || lastVoId;
    if (!targetVoId) {
      return Promise.resolve(false);
    }
    if (opts && opts.unmute && voMuted) {
      setMuted(false);
    }
    return playVO(targetVoId, {
      force: true,
      unmute: Boolean(opts?.unmute),
      priority: opts?.priority,
    });
  }

  function getStats() {
    return {
      voMuted,
      activeVoId: active ? active.voId : null,
      lastVoId,
      activeCaption: active ? active.text : null,
      activeSpeaker: active ? active.speaker : null,
      manifestLoaded,
      clipsTotal,
      clipsVerified: verifiedSet.size,
      voPlayedIds: [...playedIds],
      speechSynthesisUsed: false,
    };
  }

  return {
    init,
    playVO,
    replayLastVO,
    stopVO,
    setMuted,
    onUnlock,
    update,
    getClipMeta,
    getManifest: () => ({ ...manifest }),
    getStats,
  };
}
