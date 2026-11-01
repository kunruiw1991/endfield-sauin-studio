# New Era for the Myriad Souls — Endfield Sauin Film Studio (`endfield_halloween`)
**Binding Game Design & Technical Specification (Owner: `@director`)**

- **Source Video**: Bilibili `BV13Dxt6AERw` (*"万圣节小游戏"*, `cid=43243733636`, `184.37s`, `1280×720@30fps`)
- **Canonical Source Event**: *Arknights: Endfield* Version 1.6 seasonal **Sauin** (All Souls' Eve / Halloween) interactive stage-directing mini-game **《予众魂的新光影》** — official English title printed directly on the title crest at `[00:10–00:22]`: **"New Era for the Myriad Souls"**.
- **Target Remake**: A complete, zero-build, touch-and-desktop-ready **3D Pop-Up Puppet Theater & Interactive Filmmaking Puzzle Comedy** in **100% idiomatic English** with **52 expressive Neural English Voiceover clips (`assets/vo/*.mp3`)**, **20 animated stage takes**, **5 branching illustrated endings**, **Film Album (`20/20` + `5/5`)**, and **8 Studio Commissions (`300 Oroberyl`)**.

---

## 1. Video Forensics & Timestamped Breakdown (`BV13Dxt6AERw`)

Studied across 8 timestamped contact sheets (`/tmp/bv13d_halloween/sheet_01..08.jpg`) and 52 full-resolution frame extracts (`/tmp/bv13d_halloween/frames/*.jpg`):

| Video Timestamp | Screen / Beat | Observed Mechanics, Layout & Art Direction |
|---|---|---|
| `[00:00.5]` | Event Hub Banner | Haunted Talos-II graveyard silhouette with jack-o'-lanterns, white ghost-bunnies, crimson bats, crooked crosses, and chibi **Last Rite** (holding glowing lantern), **Mi Fu** (with lollipop), and **Camille**. Tagline: *"Traditions leap back to life in our memories. Once again, Sauin arrives—for the myriad souls, and for us, a new era of light and shadow."* |
| `[00:04–00:09]` | Velvet Curtain Loading | Pleated crimson velvet curtains with gold scalloped valance fringe, circular spotlight cone, drifting eerie green soul-lantern motes, progress bar (*"Entering the Sauin Promo Shoot Set..."*). |
| `[00:10–00:22]` | Title Screen | Bat-winged crest **"New Era for the Myriad Souls"** centered in spotlight; buttons **`Film Album`** (left), **`Event Rewards`** (right), **`▶ Start Filming`** (red primary CTA); top-left **`Back`**, top-right **`Music`** & **`Guide ?`**. |
| `[00:24.0]` | Clapperboard Wipe | Striped black-and-white cinema clapperboard snaps shut in the spotlight before Act 1 opens. |
| `[00:26–00:35]` | Act 1 Pre-Shoot Cutscene | Velvet curtains part onto a warm Victorian/Sarkaz study set; foreground row of dark theater-seat silhouettes. Burnt-celluloid dialogue bar at bottom with Polaroid chibi portraits (bat-wing stickers), `Skip ⏭` button top-right. **Mysterious Sarkaz** delivers dramatic lore about the "Sarkaz Princess" reclaiming Sauin; **Camille** dryly notes cameras are already rolling; **Last Rite** panics adorably. |
| `[00:36–01:02]` | Act 1 Director Viewfinder (`The Vanished Sauin`) | Center: perforated 35mm ivory film-frame stage with **two red-bracketed viewfinder slots** (`Prop` left, `Actor` right). Right parchment tray with **`Actors`** (`Last Rite`, `Camille`) and **`Props`** (`Sarkaz Mask`, `Roast Burdenbeast Steak`) tabs. Left vertical 35mm filmstrip with **4 Mood Gauges**: **Love** (pink winged heart), **Joy** (yellow laughing bunny), **Wonder** (blue starburst), **Chaos** (gold/black scribble). Three tutorial overlays (`[00:40]` drag-or-tap into slot, `[00:44]` combos shift mood gauges & determine ending, `[00:46]` press **`Roll Camera!`** when both slots are set). Top-right of frame: **`Dialogue Log`**; bottom-left: **`Reel Replay`** projector button; bottom strip: Director's cue prompt. |
| `[01:04–01:09]` | Act 1 Filmed Take | `Last Rite` + `Sarkaz Mask`: Mysterious Sarkaz throws arms up over a crystal ball (`?` mask bubble) while Last Rite blushes. Right Script Card reveals narration + mood badges **`Love ^^ (+2)`**, **`Joy ^ (+1)`**. Buttons: **`Reshoot`**, **`Next Act`**, **`Share`**. |
| `[01:10–01:39]` | Act 2 (`The Great Candy Heist`) | Cutscene on **Fangqu Street** at night: **Sarkaz Director** yells *"Commercial first! Princess, hit your mark!"*; **Last Rite** stiffly reads *"Unbeatable value—only at Witchcraft Hour!"*; ghost-bunny curtain transition (`[01:18]`). Blocking: `Prop` left (`Weeping Pop Loong`, `Lankybeast`), `Actor` right (`Last Rite`, `Chen Qianyu`). Video casts `Last Rite` + `Lankybeast` → **`Love ^ (+1)`**, **`Joy ^^ (+2)`**. |
| `[01:40–02:01]` | Act 3 (`It's a Landbreaker!`) | Moonlit wilderness camp with overflowing candy chest. **Injured Landbreaker** (giant `X` bandage) gulps through ad copy; **Last Rite** asks how they hired a real Landbreaker; **Rossi** winks (*"A fang of the Wolfpack has plenty of ways!"*). Blocking: `Prop` left (`One-Handed Sword`, `Giant Lollipop`), `Actor` right (`Last Rite`, `Rossi`). Video casts `Last Rite` + `One-Handed Sword` → **`Joy ^ (+1)`**, **`Chaos ^ (+1)`**. |
| `[02:02–02:27]` | Act 4 (`Where Is Sauin...?`) | Outpost avenue by night. **Mi Fu** deadpans about pitching coupons on set; **Last Rite** offers a Patrol Squad discount. Blocking swaps slot order: **`Actor` left** (`Last Rite`, `Mi Fu`), **`Prop` right** (`Candy Chest`, `Festive Fireworks`). Video casts `Mi Fu` + `Candy Chest` → **Yvonne** crashes the shot stomping on the candy chest laughing while **Last Rite** peeks from the bushes! Mood: **`Love ^ (+1)`**, **`Chaos ^^ (+2)`**. |
| `[02:28–02:56]` | Act 5 (`Talos Knows Everything`) | Alien cliffside beneath colossal glowing moon **Talos**. **Last Rite** mistakes **Ardashir** for a Sarkaz Banshee; **Ardashir** replies *"...No. You have the wrong person."* Blocking: **`Actor` left** (`Last Rite`, `Ardashir`), **`Prop` right** (`Sarkaz Mask`, `Originium Suppressor`). Video casts `Ardashir` + `Originium Suppressor` → dramatic blue-lit Ardashir profile while a **colossal Suppressor hovers across the moon Talos**! Mood: **`Wonder ^ (+1)`**, **`Chaos ^^ (+2)`**. Cumulative gauges `{Love:4, Joy:4, Wonder:1, Chaos:5}` (all `< 6`). Button becomes **`Reveal Ending`**. |
| `[02:58–03:04]` | Ending Polaroid (`//END1: Strange Sauin`) | Full-frame bat-winged 35mm Polaroid illustration: wide-eyed **Last Rite** surrounded by dozens of costumed Pop Loongs plotting mischief against Seš'qa because nobody gave them candy. Badge: *"Ending added to Film Album"*. Buttons: **`Play Again`**, **`Share`**, plus top-bar **`Film Album`** & **`Event Rewards`**. |

### Audio Forensics Summary (from `@vo-studio`)
- Source video had **zero spoken Chinese lines** (only a looped instrumental **E♭-minor 4/4 "Spooky-Cute" Halloween March / Polka at ~124.4 BPM**: staccato tuba oom-pah bass on beats 1 & 3, pizzicato strings/chords on 2 & 4, chromatic celesta/clarinet melody, and carnival sleigh-bell/flute bridge).
- Adding our **52-clip Neural English Voiceover Pack** voices **100% of pre-shoot cutscenes, studio tutorials, all 20 filmed takes, and all 5 endings** without clashing with original audio, paired with an original WebAudio E♭-minor 124.4 BPM Halloween March synthesizer that auto-ducks cleanly (`0.35×` gain) under VO!

---

## 2. Technical Architecture, Visual Elevation & Zero-Build Rules

1. **Zero-Build ES2022 Modules & Offline Safety**:
   - Relative imports ONLY (`./...` or `../../vendor/three.module.min.js`).
   - **NO** `<script type="importmap">`, **NO** bundler, **NO** external CDN scripts/fonts/images.
   - `#title` screen MUST be rendered and visible in initial HTML/CSS so the game never shows a blank screen even before JS finishes booting.
   - **100% English Localization**: `<html lang="en">`, zero Chinese/CJK characters (`[\u4e00-\u9fff]`) anywhere in HTML, CSS, JS strings, SVG, or Canvas-drawn textures (`hanziCount === 0`).
2. **Three.js r170 3D Pop-Up Puppet Proscenium + High-DPI Illustrated Cutout Art**:
   - **Strictly BAN** ugly programmer-art spheres/cones/capsules for characters AND ban flat minimal `ctx.arc` blobs!
   - **Outer 3D Theater (`theater_scene.js`)**: Real 3D crimson pleated velvet curtains (sliding open/closed on curtain rods with spring easing), golden valance fringe, haunted teal/indigo cyclorama sky with wrought-iron Gothic fence & crosses, animated flapping 3D bats, peeking 3D white ghost-bunnies, volumetric spotlight cone (`MeshBasicMaterial` additive gradient cone), drifting green/amber soul-lantern particles, and foreground 3D theater-seat silhouettes that bob/cheer on takes.
   - **Inner 3D Diorama Sets (`diorama_sets.js`)**: Multi-layered 3D stage box (`z = -4..+2`) for each of the 5 Acts with real depth, subtle camera breathing + pointer-tilt parallax (`±3.5°`), warm/cool theatrical lights, clickable stage gag props (ghost-bunny cameos, candy sparkles, crystal ball pulse, moon shimmer), and interactive 3D slot markers (`Actor Slot` & `Prop Slot` pedestals with red viewfinder brackets).
   - **High-DPI Illustrated Chibi Standees (`chibi_atlas.js` + `puppet_actors.js`)**: Every character (`10` cast/NPCs) and prop (`9` stage props) is procedurally illustrated onto crisp `512×512` offscreen canvases (cel-shaded hair highlights, Sarkaz horns/halos, iconic Endfield outfits, expressive multi-state faces `neutral | flustered | happy | deadpan | shocked | wink`, thick dark ink outlines + white paper-puppet die-cut sticker border) mounted on multi-part 3D hinged puppet planes (`body`, `head`, `armProp`, `speechBubble`) that drop in on theater strings with squash-and-stretch physics!
   - **iPad/Mobile GPU Safety**: **NEVER** call synchronous `renderer.compile(scene, camera)` at boot; build set geometries incrementally (`<= 8 ms` per frame slice); `setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))` with automatic step-down to `1.0` if rolling average frame > `22 ms`; pool particle `InstancedMesh` (`frustumCulled = false`).
3. **Deterministic 60 Hz Simulation**:
   - Fixed `DT = 1 / 60` accumulator loop (`<= 5` steps per `requestAnimationFrame`).
   - All simulation timers, animations, particle bursts, choreography beats, and solver logic use `ctx.time` (sim seconds), `ctx.frame`, and `ctx.rng` (seeded `mulberry32`) — never `Math.random()` or `Date.now()` inside simulation state.
4. **Touch-First & Dual Casting UX (Drag-and-Drop + 1-Tap Cast)**:
   - Every button binds `pointerup` (with `280 ms` debounce) + `click` fallback.
   - Casting supports **BOTH** smooth Pointer Events drag-and-drop (`pointerdown` → floating ghost card with `setPointerCapture` → stage slot highlight → drop snap) **AND** single-tap instant casting (tapping any Actor or Prop card flies it directly into the Act's Actor or Prop slot; tapping a filled stage slot swaps/clears it).
   - Responsive across **`1280×800`**, **`1024×768`**, **`844×390` (landscape phone)**, and **`390×844` (portrait phone)**: zero scrollbars (`overflow: hidden`), zero overlapping interactive rects, minimum interactive target `48×48 px` (primary CTAs `>= 68 px` wide).

---

## 3. Strict Non-Colliding File Ownership Table

Every file has **exactly one owner**. Builders MUST NOT edit files owned by another builder; request cross-module hooks on the board if needed.

| Owner | Exclusive File Ownership |
|---|---|
| **`director`** | `docs/DESIGN.md`, `.gitignore`, `.nojekyll`, `vendor/three.module.min.js`, `tests/cdp.py`, `README.md`, `screenshot.jpg` |
| **`vo-studio`** | `assets/vo/*.mp3` (`52` neural English MP3 clips), `assets/vo/manifest.json` |
| **`core`** | `index.html`, `src/main.js`, `src/core/loop.js`, `src/core/rng.js`, `src/core/events.js`, `src/core/state.js`, `src/core/input.js`, `src/core/persistence.js`, `src/core/seam.js` |
| **`levels`** | `src/levels/constants.js`, `src/levels/cast_catalog.js`, `src/levels/acts_data.js`, `src/levels/takes_matrix.js`, `src/levels/endings_data.js`, `src/levels/commissions.js` |
| **`mechanics`** | `src/mechanics/director_fsm.js`, `src/mechanics/casting.js`, `src/mechanics/mood_engine.js`, `src/mechanics/stage_choreo.js`, `src/mechanics/commissions_mgr.js`, `src/mechanics/solver.js` |
| **`world-render`** | `src/render/theater_scene.js`, `src/render/diorama_sets.js`, `src/render/chibi_atlas.js`, `src/render/puppet_actors.js`, `src/render/ending_illustrations.js`, `src/render/particles_fx.js`, `src/render/postcard_export.js` |
| **`ui-hud`** | `styles/main.css`, `src/ui/ui_manager.js`, `src/ui/title_view.js`, `src/ui/dialogue_box.js`, `src/ui/stage_hud.js`, `src/ui/drag_cast.js`, `src/ui/take_card.js`, `src/ui/ending_view.js`, `src/ui/album_modal.js`, `src/ui/rewards_modal.js`, `src/ui/captions_hud.js` |
| **`audio-vo`** | `src/audio/audio_engine.js`, `src/audio/vo_player.js`, `src/audio/bgm_halloween.js`, `src/audio/sfx_bank.js` |
| **`qa-e2e`** | `tests/smoke.py`, `tests/test_acts_and_endings.py`, `tests/test_vo_and_audio.py`, `tests/test_layout_and_english.py`, `tests/sim_gates.py` |

---

## 4. Binding Contracts (`ctx`, `events`, Module APIs & `window.__HALLOWEEN__`)

### 4.1 Shared Context Object (`ctx`, assembled in `src/main.js`)
```js
ctx = {
  THREE,                // Three.js r170 namespace
  DT: 1 / 60,           // Fixed 60 Hz simulation step
  seed: 20261031,       // Current deterministic run seed
  rng,                  // mulberry32(seed) -> { next(), range(a,b), pick(arr), reseed(s) }
  time: 0,              // Accumulated simulation seconds
  frame: 0,             // Accumulated simulation frames
  events,               // Pub/sub bus (§4.2)
  state,                // Canonical mutable game state (§4.3)
  persistence,          // Save/load localStorage['endfield_sauin_v1']
  levels,               // Pure data exports from src/levels/*
  mechanics,            // FSM, casting, mood, choreo, commissions, solver
  render,               // 3D theater + diorama + chibi puppets + FX + postcard export
  ui,                   // DOM views, HUD, drag controller, modals, captions
  audio                 // WebAudio BGM + SFX + Neural English VO player
};
```

### 4.2 Event Bus (`src/core/events.js`)
`events = createEventBus()` with `on(type, fn) -> off()`, `once(type, fn)`, `emit(type, payload)`:
- Lifecycle & Navigation:
  - `bootReady {}`
  - `phaseChange { from, to, actId }` (`'title' | 'clapper' | 'dialogue' | 'blocking' | 'rolling' | 'take_result' | 'ending'`)
  - `curtainMove { open: boolean, duration: number }`
  - `clapperSnap { label: string, actId: number }`
- Cutscene & Blocking:
  - `dialogueStep { actId, index, total, line: { speakerId, speakerName, portraitMood, text, voId } }`
  - `dialogueSkipped { actId }`
  - `tabChanged { tab: 'actors' | 'props' }`
  - `slotHover { slotKind: 'actor' | 'prop' | null, valid: boolean }`
  - `slotCast { actId, slotKind: 'actor' | 'prop', itemId: string, source: 'tap' | 'drag' | 'seam' }`
  - `slotCleared { actId, slotKind: 'actor' | 'prop' }`
  - `moodPreviewUpdated { committed: {love,joy,wonder,chaos}, previewDelta: {love,joy,wonder,chaos} }`
- Filming, Results & Endings:
  - `cameraRollStart { actId, takeId, actorId, propId, moodDelta }`
  - `choreoBeat { actId, takeId, beatIndex, kind, pos }`
  - `stageGagTriggered { actId, gagId, x, y, bonusSparkles }`
  - `takeCompleted { actId, takeId, isNewTake, moodDelta, totals }`
  - `reshootRequested { actId }`
  - `endingRevealed { endingId, isNewEnding, totals }`
- Meta, Audio & Feedback:
  - `modalOpened { modal: 'album' | 'rewards' | 'dialogue_log' | 'guide' }`
  - `modalClosed { modal }`
  - `commissionClaimed { commissionId, oroberyl, tCreds }`
  - `feedback { kind: 'ui' | 'cast' | 'gag' | 'roll' | 'blocked', x, y }`
  - `voPlay { voId, force?: boolean }`
  - `voStarted { voId, speaker, text, durationMs }`
  - `voEnded { voId }`
  - `sfx { name, pitch?: number, vol?: number }`

### 4.3 Canonical State Shape (`src/core/state.js` & `getState()`)
`window.__HALLOWEEN__.getState()` returns a deep JSON clone of:
```js
{
  v: 1,
  seed: 20261031,
  frame: 0,
  timeMs: 0,
  phase: 'title', // 'title' | 'clapper' | 'dialogue' | 'blocking' | 'rolling' | 'take_result' | 'ending'
  actId: 1,       // 1..5
  dialogue: { index: 0, total: 6, speaker: 'Mysterious Sarkaz', text: '...', voId: 'vo_s1_dlg_1' },
  activeTab: 'actors', // 'actors' | 'props'
  slots: {
    actorId: null,     // e.g. 'last_rite'
    propId: null,      // e.g. 'sarkaz_mask'
    leftKind: 'prop',  // 'prop' in Acts 1-3, 'actor' in Acts 4-5
    rightKind: 'actor' // 'actor' in Acts 1-3, 'prop' in Acts 4-5
  },
  moods: { love: 0, joy: 0, wonder: 0, chaos: 0 },          // Committed from completed prior acts in current run
  previewDelta: { love: 0, joy: 0, wonder: 0, chaos: 0 },   // Live preview of current slotted pair
  actChoices: {}, // { 1: { actorId, propId, takeId, delta }, ... }
  currentTake: null, // { takeId, actId, title, actorId, propId, scriptText, moodDelta, voId, animProgress }
  currentEnding: null, // { endingId, code, title, bodyText, voId, totals }
  modal: null, // null | 'album' | 'rewards' | 'dialogue_log' | 'guide'
  tutorialStep: 0, // 0=none/done, 1=cast_slot, 2=mood_filmstrip, 3=roll_camera
  progress: {
    runsCompleted: 0,
    unlockedTakes: [],     // subset of 20 takeIds ('take_1_1'..'take_5_4')
    unlockedEndings: [],   // subset of ['END1','END2','END3','END4','END5']
    claimedCommissions: [],// subset of 8 commissionIds
    oroberyl: 0,           // 0..300
    tCreds: 0              // 0..40000
  },
  feedback: { taps: 0, casts: 0, gags: 0, rolls: 0, dead: 0, firstActionMs: null },
  stats: { particles: 0, flashes: 0, shakes: 0, clappers: 0 },
  hanziCount: 0
}
```

### 4.4 Builder Module Signatures
- **`levels`**:
  - `src/levels/constants.js` exports `MOOD_KEYS = ['love','joy','wonder','chaos']`, `MOOD_MAX = 8`, `ENDING_THRESHOLD = 6`, `PHASES`.
  - `src/levels/cast_catalog.js` exports `CHARACTERS` (`10` entries) and `PROPS` (`9` entries).
  - `src/levels/acts_data.js` exports `ACTS` (`5` acts, indexed `1..5`, with `id`, `code`, `title`, `locationName`, `leftSlotKind`, `rightSlotKind`, `cuePrompt`, `actors: [id1, id2]`, `props: [id1, id2]`, `dialogue: [...]`, `setPalette`, `gags: [...]`).
  - `src/levels/takes_matrix.js` exports `TAKES` (`20` entries keyed by `takeId` and lookup `getTake(actId, actorId, propId)`).
  - `src/levels/endings_data.js` exports `ENDINGS` (`END1..END5`), `RECIPES` (canonical 5-act choice arrays for each ending + `VIDEO_RUN`), and `resolveEnding(moods)`.
  - `src/levels/commissions.js` exports `COMMISSIONS` (`8` milestone definitions).
- **`mechanics`**:
  - `createMechanics(ctx)` returns `{ startRun({seed, startAct, skipDialogue}), jumpToAct(actId, {keepMoods, skipDialogue}), advanceDialogue(), skipDialogue(), selectTab(tab), castSlot(slotKind, itemId, source), autoCastItem(itemId, source), clearSlot(slotKind), rollCamera(), reshoot(), nextAct(), revealEnding(), triggerStageGag(gagId, x, y), claimCommission(id), claimAllReady(), solveCurrentAct(preferredPair), solveRunForEnding(endingId), update(dt) }`.
- **`world-render`**:
  - `createWorldRender(ctx, mountEl)` returns `{ initSlice(), setActSet(actId), setCurtains(open, instant), setPreviewPuppet(slotKind, itemId), playTakeChoreo(take), showEndingBackdrop(endingId), pickStage(clientX, clientY) -> { kind: 'slot'|'gag'|'stage', slotKind?, gagId?, worldPos }, burstParticles(kind, worldPos, count), flashCamera(strength), shakeCamera(trauma), exportPostcardDataURL() -> string, update(dt), renderFrame(), getPerf() }`.
- **`ui-hud`**:
  - `createUI(ctx, rootEl)` returns `{ init(), sync(state), showCaption({speaker, text, voId, durationMs}), clearCaption(), openModal(name), closeModal(), showToast(text) }`.
- **`audio-vo`**:
  - `createAudioEngine(ctx)` returns `{ init(), unlock(), playVO(voId, opts) -> Promise<boolean>, stopVO(), playSFX(name, opts), setBGM(playing), setMuted({bgm, vo, sfx}), update(dt), getAudioStats() }`.

### 4.5 Frozen Test & Automation Seam (`window.__HALLOWEEN__`)
`src/core/seam.js` exposes `Object.freeze(window.__HALLOWEEN__)`:
- `startLevel(actOrOpts)` — accepts `1..5` or `{ act: 1..5, seed?: number, skipDialogue?: boolean, resetMoods?: boolean }`; transitions out of title immediately and loads that Act.
- `resetLevel()` — clears current Act slots (or triggers `reshoot()` if in `take_result`) so the current Act is ready in `blocking`.
- `act(type, payload)` — deterministic command dispatcher supporting:
  - `'startGame'` (`{seed?, skipDialogue?}`)
  - `'advanceDialogue'`, `'skipDialogue'`
  - `'cast'` (`{actorId?, propId?}` or `{slotKind, itemId}`)
  - `'rollCamera'`, `'reshoot'`, `'nextAct'`, `'revealEnding'`
  - `'jumpToAct'` (`{actId, skipDialogue?}`)
  - `'openModal'` (`{modal}`), `'closeModal'`
  - `'claimCommission'` (`{id}`), `'claimAll'`
  - `'gag'` (`{gagId?}`)
- `move(x, y)` — normalized `[-1, 1]` stage viewfinder / spotlight aim & parallax tilt.
- `pointer(eventType, clientX, clientY)` — dispatches stage/UI pointer interaction (`'down' | 'move' | 'up' | 'tap'`).
- `stepFrames(n)` — synchronously advances `n` fixed `1/60s` steps (including choreography timers, particles, clapper transitions, and simulated VO progress timers) and syncs UI/render once at the end.
- `getState()` — deep-cloned state (§4.3), including real-time DOM CJK character scan `hanziCount`.
- `getLevels()` — deep-cloned `{ acts: ACTS, takes: TAKES, endings: ENDINGS, recipes: RECIPES, commissions: COMMISSIONS }`.
- `solveCurrentLevel(strategy)` — if `strategy` is `'END1'..'END5'`, plays all remaining Acts from `state.actId..5` using `RECIPES[strategy]` through `revealEnding()`; otherwise completes the current Act (`skipDialogue` → `cast` → `rollCamera` → `stepFrames(200)`) and returns `getState()`.
- `playVO(voId, opts)` — triggers `audio.playVO(voId, opts)` and returns `{ ok, voId, durationMs, speaker, text }`.
- `getAudioStats()` — returns `{ unlocked, bgmPlaying, bgmDucked, bgmGain, bgmMuted, voMuted, sfxMuted, activeVoId, activeCaption, manifestLoaded, clipsTotal, clipsVerified, voPlayedIds: [...], sfxPlayedCount, speechSynthesisUsed: false }`.
- `perf()` — returns `{ fps, p50ms, p95ms, drawCalls, triangles, geometries, textures }`.

---

## 5. Cast Bible, Stage Props & 5-Act Theatrical Script

### 5.1 Illustrated Chibi Cast (`src/levels/cast_catalog.js`)
Every character is drawn in high-DPI Endfield Chibi Theater style (head ≈ 42% height, crisp dark ink outlines, glossy eye highlights, blush cheeks, white paper-cutout border):

| `id` | English Name | Role / Visual Silhouette |
|---|---|---|
| `last_rite` | **Last Rite** | Protagonist ("Sarkaz Princess"). Long cerulean-blue twin-tails, white pointed Sarkaz headdress/ears, orange-amber eyes, black-white-blue gothic frost striker dress, shy/earnest expressions (`blush`, `panic >_<`, `determined`). |
| `camille` | **Camille** | Cool Heat Vanguard co-star. Messy dark-teal hair, crimson Sarkaz halo/horns above head, sharp violet-grey eyes, black tailored coat with red glove finger on chin, composed deadpan smirk. |
| `chen_qianyu` | **Chen Qianyu** | Spirited Lung swordswoman. Dark charcoal twin-tails, cyan-tipped dragon horns, bright crimson eyes, navy Wuling martial uniform, enthusiastic heroic grin. |
| `rossi` | **Rossi** | Cheeky Wolfpack Lupo agent. Fluffy crimson Little-Red-Riding-Hood cloak with white wolf-ear trim, golden-blonde bangs, bright amber eye + playful wink, smug fang smile. |
| `mi_fu` | **Mi Fu** | Unimpressed Patrol Squad Guard. Pastel pink bob covering one eye, asymmetrical black-and-cyan horns, magenta eye, crimson-and-black street coat, arms crossed deadpan. |
| `yvonne` | **Yvonne** | Surprise cameo Sarkaz punk captain (Act 4). Two-tone ash-grey/pink hair, jagged crimson-spotted horns, heart eyepatch/wink, striped tail, exuberant open-mouthed laugh stomping on chests. |
| `ardashir` | **Ardashir** | Mysterious silver-haired gentleman under Talos (Act 5). Fluffy white hair, curved dark-tipped horns, calm cerulean eyes, dark aristocratic coat, polite deadpan sigh. |
| `mysterious_sarkaz` | **Mysterious Sarkaz** | Act 1 Elder NPC. Tall dark hooded robe wrapped in white mummy-like Sarkaz strips, curved dark horns, glowing horizontal visor slits, dramatic raised arms + crystal ball table. |
| `sarkaz_director` | **Sarkaz Director** | On-set Film Director NPC. Pointed witch-brim cap with a mini clapperboard badge, curved horns, boxy white-glint sunglasses, red tie, holding rolled script megaphone. |
| `injured_landbreaker` | **Injured Landbreaker** | Act 3 Reluctant Monster Actor NPC. Hulking hooded silhouette with vertical mask bars and a giant white `X` bandage plaster on his temple, flexing nervously beside the candy chest. |

### 5.2 Stage Props (`9` Props across Acts 1–5)
1. `sarkaz_mask` — **Sarkaz Mask**: Horned bone-white ritual skull mask with dark eye sockets.
2. `roast_steak` — **Roast Burdenbeast Steak**: Juicy glazed bone-in cartoon steak with rising aroma swirls.
3. `pop_loong` — **Weeping Pop Loong**: Round snowy-white chubby dragon mascot plush with tiny gold horns and `>_<` teardrops.
4. `lankybeast` — **Lankybeast**: Plump emerald-green Wuling frog beast with spotted yellow belly and blank unblinking stare.
5. `one_handed_sword` — **One-Handed Sword**: Gleaming silver-steel knight broadsword with crossguard glint.
6. `lollipop` — **Giant Swirl Lollipop**: Oversized pink-and-cream spiral candy pop on a white stick.
7. `candy_chest` — **Candy Treasure Chest**: Wooden pirate-style chest overflowing with rainbow wrappers, lollipops, and star candies.
8. `fireworks` — **Festive Fireworks**: Striped party box packed with magenta, cyan, and gold sky-rockets.
9. `suppressor` — **Originium Suppressor**: Sleek hexagonal gunmetal Endfield tech collar/module with glowing amber warning LEDs.

### 5.3 The 5 Acts — Pre-Shoot Cutscenes & Stage Layouts (`src/levels/acts_data.js`)

#### **Act 1 (`actId: 1`): "The Vanished Sauin"**
- **Set**: *Sarkaz Study* — Warm amber library, tall oak bookcase, gargoyle portrait frame, white-flower porcelain vase, plush velvet sofa, glowing windowpanes. Interactive background gag: `gag_curtain_bunny` (peeking white ghost-bunny behind right curtain).
- **Slot Order**: `Left = Prop`, `Right = Actor`.
- **Actors**: `['last_rite', 'camille']` · **Props**: `['sarkaz_mask', 'roast_steak']`.
- **Cue Prompt**: *"The Sarkaz Princess sets out to reclaim the vanished Sauin."*
- **Voiced Pre-Shoot Cutscene (`6` lines)**:
  1. `mysterious_sarkaz` (`vo_s1_dlg_1`): *"O most noble Sarkaz Princess! Where walk the Myriad Souls, Sauin must follow to guide them home—two halves bound by fate, forever inseparable!"*
  2. `camille` (`vo_s1_dlg_2`): *"Ahem. Operator Last Rite, the cameras are already rolling."*
  3. `last_rite` (`vo_s1_dlg_3`): *"R-Rolling already?! Oh, I'm so sorry! Please, carry right on!"*
  4. `mysterious_sarkaz` (`vo_s1_dlg_4`): *"From Terra to Talos-II, farewells never cease for the Sarkaz... yet the Sauin festival that lights their way has faded from memory."*
  5. `mysterious_sarkaz` (`vo_s1_dlg_5`): *"O noble heir of the Royal Court! A sacred duty rests upon your shoulders—reclaim Sauin! Bring back the festival!"*
  6. `mysterious_sarkaz` (`vo_s1_dlg_6`): *"Where walk the Myriad Souls... Sauin must shine again."*

#### **Act 2 (`actId: 2`): "The Great Candy Heist"**
- **Set**: *Fangqu Street by Night* — Starlit Wuling commercial steps, glowing mascot neon billboard, twin modern streetlamps, trimmed green hedges with pink blossoms, café umbrella. Interactive gag: `gag_neon_wink` (mascot billboard winks & drops candy).
- **Slot Order**: `Left = Prop`, `Right = Actor`.
- **Actors**: `['last_rite', 'chen_qianyu']` · **Props**: `['pop_loong', 'lankybeast']`.
- **Cue Prompt**: *"Sauin isn't complete without candy! The Sarkaz Princess arrives at candy-filled Fangqu Street."*
- **Voiced Pre-Shoot Cutscene (`2` lines)**:
  1. `sarkaz_director` (`vo_s2_dlg_1`): *"Sponsor plug first—places, everyone! Princess, hit your mark and read the cue card!"*
  2. `last_rite` (`vo_s2_dlg_2`): *"Unbeatable value, enchanting deals—only at Witchcraft Hour!"*

#### **Act 3 (`actId: 3`): "It's a Landbreaker!"**
- **Set**: *Moonlit Wilderness Camp* — Full silver moon, jagged dark crags, twisted spooky trees, pitched canvas tent, overflowing wooden candy chest. Interactive gag: `gag_tent_rustle` (ghost-bunnies pop out of the tent flap).
- **Slot Order**: `Left = Prop`, `Right = Actor`.
- **Actors**: `['last_rite', 'rossi']` · **Props**: `['one_handed_sword', 'lollipop']`.
- **Cue Prompt**: *"The Sarkaz Princess draws her weapon—she must defeat the Landbreaker!"*
- **Voiced Pre-Shoot Cutscene (`3` lines)**:
  1. `injured_landbreaker` (`vo_s3_dlg_1`): *"Witchcraft Hour's Sauin Mega-Bonanza... gulp... huge discounts, unbeatable bargains..."*
  2. `last_rite` (`vo_s3_dlg_2`): *"How on earth did you convince an actual Landbreaker to film a holiday commercial?!"*
  3. `rossi` (`vo_s3_dlg_3`): *"Heh! A fang of the Wolfpack has plenty of ways to be persuasive!"*

#### **Act 4 (`actId: 4`): "Where Is Sauin...?"**
- **Set**: *Endfield Outpost Avenue* — Industrial outpost facade with glowing lime charge strip, twin streetlamps, night trees, and rustling right-side bush (where Last Rite peeks out!). Interactive gag: `gag_bush_peek` (rustling bush pops Last Rite's ears).
- **Slot Order**: **`Left = Actor`, `Right = Prop`** (matches `[02:11]` swap!).
- **Actors**: `['last_rite', 'mi_fu']` · **Props**: `['candy_chest', 'fireworks']`.
- **Cue Prompt**: *"The Sarkaz Princess recovered the candy, yet the Patrol Squad's Sarkaz Captain doesn't look thrilled."*
- **Voiced Pre-Shoot Cutscene (`4` lines)**:
  1. `mi_fu` (`vo_s4_dlg_1`): *"Huh? A film shoot? So you're the crew the boss mentioned? Wait—Sauin?"*
  2. `last_rite` (`vo_s4_dlg_2`): *"Y-Yes! Witchcraft Hour is also running a special Sauin promotional event..."*
  3. `mi_fu` (`vo_s4_dlg_3`): *"Hah? A promo sale? All this buildup, and you're pitching coupons right on the film set."*
  4. `last_rite` (`vo_s4_dlg_4`): *"Um... I can even apply for an exclusive Patrol Squad discount for your whole team!"*

#### **Act 5 (`actId: 5`): "Talos Knows Everything"**
- **Set**: *Cliff Beneath Talos* — Fractured Originium crystal spire with glowing cyan veins on left, alien grass ridge, and the colossal luminous orb of **Talos** filling the starry cosmos. Interactive gag: `gag_crystal_chime` (Originium veins pulse a musical chord).
- **Slot Order**: **`Left = Actor`, `Right = Prop`** (matches `[02:37]`).
- **Actors**: `['last_rite', 'ardashir']` · **Props**: `['sarkaz_mask', 'suppressor']`.
- **Cue Prompt**: *"At last, the Sarkaz Princess found Talos—surely Talos knows where Sauin went."*
- **Voiced Pre-Shoot Cutscene (`4` lines)**:
  1. `last_rite` (`vo_s5_dlg_1`): *"H-Hello there! Excuse me, are you... a fellow Sarkaz?"*
  2. `last_rite` (`vo_s5_dlg_2`): *"Oh—a Banshee! Might you be interested in celebrating Sauin?"*
  3. `ardashir` (`vo_s5_dlg_3`): *"...No. I'm afraid you have the wrong person."*
  4. `last_rite` (`vo_s5_dlg_4`): *"Ack—sorry, my mistake! Still... any interest in Sauin? The discounts are seriously huge..."*

---

## 6. Complete 20-Take Matrix, Ending Formula & 8 Studio Commissions

### 6.1 All 20 Filmed Takes (`src/levels/takes_matrix.js`)
Every `(actId, actorId, propId)` pair produces an animated 3D stage performance (`~2.4s` choreographed beat, skippable after `0.5s`), unlocks its Film Album entry, awards exact Mood Deltas (`^` = `+1`, `^^` = `+2`), and plays its dedicated Narrator VO clip:

| `takeId` | Act | Actor + Prop | Mood Delta | Stage Choreography & Script Card Text (`voId`) |
|---|---|---|---|---|
| `take_1_1` | 1 | `last_rite` + `sarkaz_mask` | `love:+2, joy:+1` | *(Video `[01:05]`)* Mysterious Sarkaz raises arms over crystal ball (`?` mask bubble); Last Rite blushes holding hands. *"Wearing a borrowed ritual mask, the shy Sarkaz Princess vows to bring Sauin home—once she stops apologizing to the props!"* (`vo_take_1_1`) |
| `take_1_2` | 1 | `last_rite` + `roast_steak` | `love:+1, joy:+2` | Sizzling steak lands on the crystal-ball table; both Elder and Princess stare drooling as ghost-bunnies cheer. *"Forget ancient prophecies—the Sarkaz Princess discovers that sizzling roast steak summons departed appetites faster than any ritual!"* (`vo_take_1_2`) |
| `take_1_3` | 1 | `camille` + `sarkaz_mask` | `wonder:+2, love:+1` | Camille holds the horned mask like Shakespeare's Hamlet under a dramatic violet spotlight while the Elder applauds. *"Wait—since when was the Sarkaz Princess this suave?! Camille's brooding masked monologue turns the commercial into cinema!"* (`vo_take_1_3`) |
| `take_1_4` | 1 | `camille` + `roast_steak` | `chaos:+2, wonder:+1` | Camille calmly flambe-sears the Burdenbeast steak on set while the Elder waves away smoke with his script. *"Camille ignores the script entirely and turns Act One into a midnight cooking show. The crew is already lining up for seconds!"* (`vo_take_1_4`) |
| `take_2_1` | 2 | `last_rite` + `pop_loong` | `love:+2, wonder:+1` | Last Rite gently pats the weeping Pop Loong, offering a glowing candy lantern until hearts float up. *"On Fangqu Street, the Sarkaz Princess comforts a weeping Pop Loong—sharing her very first Sauin candy under the neon lights."* (`vo_take_2_1`) |
| `take_2_2` | 2 | `last_rite` + `lankybeast` | `love:+1, joy:+2` | *(Video `[01:36]`)* Last Rite waves arms frantically with sweat drops while green Lankybeast stares blankly and ribbits once. *"The Sarkaz Princess arrived at Fangqu Street hunting for candy, only to interrogate a silent Lankybeast... Did it understand a single word?"* (`vo_take_2_2`) |
| `take_2_3` | 2 | `chen_qianyu` + `pop_loong` | `wonder:+2, joy:+1` | Chen Qianyu strikes a martial pose beside Pop Loong, tossing candies like throwing stars into the crowd. *"Stand-in Princess Chen Qianyu teams up with Pop Loong for a dazzling Wuling sword-dance that showers the street in sweets!"* (`vo_take_2_3`) |
| `take_2_4` | 2 | `chen_qianyu` + `lankybeast` | `chaos:+2, wonder:+1` | Lankybeast leaps 3 meters high while Chen Qianyu chases it across the plaza steps in chaotic slapstick. *"Disaster on Fangqu Street! Chen Qianyu challenges the Lankybeast to a jumping contest, launching the prop crew into the hedges!"* (`vo_take_2_4`) |
| `take_3_1` | 3 | `last_rite` + `one_handed_sword` | `joy:+1, chaos:+1` | *(Video `[02:00]`)* Landbreaker flexes nervously in front of the candy chest while Last Rite brandishes the steel sword. *"To reclaim the stolen candy and save Sauin, the Sarkaz Princess draws cold steel—though the Landbreaker looks more scared of forgetting his lines!"* (`vo_take_3_1`) |
| `take_3_2` | 3 | `last_rite` + `lollipop` | `love:+2, joy:+1` | Last Rite holds up the giant pink swirl lollipop like a magic wand; the Landbreaker bursts into happy tears and hands over the chest. *"Instead of a blade, the Princess offers a giant swirl lollipop! Even the fiercest Landbreaker melts for Sauin sweetness."* (`vo_take_3_2`) |
| `take_3_3` | 3 | `rossi` + `one_handed_sword` | `joy:+2, wonder:+2` | Rossi vaults onto the campsite rock with the gleaming sword, winking at the camera as confetti bursts. *"Stunt-double Rossi steals the spotlight! With one flashy Wolfpack flourish, the Landbreaker surrenders every last piece of candy!"* (`vo_take_3_3`) |
| `take_3_4` | 3 | `rossi` + `lollipop` | `chaos:+2, love:+1` | Rossi spins the giant lollipop like a mafia boss and Taxes half the candy chest for herself while the Director yells cut. *"Wait a minute—Rossi uses the giant lollipop to extort BOTH the Landbreaker and the film crew's snack table!"* (`vo_take_3_4`) |
| `take_4_1` | 4 | `last_rite` + `candy_chest` | `love:+2, wonder:+1` | Last Rite proudly presents the glittering Candy Chest while Yvonne cheers beside her under floating lanterns. *"The Sarkaz Princess shares the recovered Candy Chest with the whole Patrol Squad—turning a late-night shift into a warm Sauin feast!"* (`vo_take_4_1`) |
| `take_4_2` | 4 | `last_rite` + `fireworks` | `joy:+2, love:+1` | Last Rite lights the fireworks crate; dazzling magenta/gold 3D fireworks bloom across the night sky while everyone claps. *"Boom! The Princess launches a sky full of Sauin fireworks over the outpost—even Witchcraft Hour couldn't buy better publicity!"* (`vo_take_4_2`) |
| `take_4_3` | 4 | `mi_fu` + `candy_chest` | `love:+1, chaos:+2` | *(Video `[02:25]`)* Mi Fu crosses arms as "Princess (?)", Yvonne stomps onto the Candy Chest cackling, and Last Rite peeks shyly from the right bush! *"The Sarkaz Princess—wait, Mi Fu?!—recovered the candy, while Captain Yvonne laughs maniacally on the chest... isn't she having WAY too much fun?!"* (`vo_take_4_3`) |
| `take_4_4` | 4 | `mi_fu` + `fireworks` | `chaos:+2, wonder:+1` | Fireworks spin wildly sideways across the set as Mi Fu sighs unbothered and Yvonne surfs the spark shower. *"Who aimed the fireworks indoors?! Rockets ricochet across the set while Mi Fu deadpans through absolute pyrotechnic pandemonium!"* (`vo_take_4_4`) |
| `take_5_1` | 5 | `last_rite` + `sarkaz_mask` | `love:+2, wonder:+1` | Last Rite lifts the Sarkaz Mask toward the glowing moon Talos as gentle soul-lanterns rise into the stars. *"Beneath the silver gaze of Talos, the Sarkaz Princess lifts her mask—realizing Sauin lives wherever friends gather to remember."* (`vo_take_5_1`) |
| `take_5_2` | 5 | `last_rite` + `suppressor` | `joy:+2, chaos:+1` | Last Rite holds up the Suppressor backwards like a walkie-talkie trying to call the moon Talos, making the crew burst out laughing. *"Um, hello, Mister Talos? Last Rite tries dialing the moon on an Originium Suppressor, cracking up the entire studio!"* (`vo_take_5_2`) |
| `take_5_3` | 5 | `ardashir` + `sarkaz_mask` | `wonder:+2, love:+1` | Ardashir gazes serenely at the Sarkaz Mask against the moonlit crystal spire as cosmic stardust swirls. *"Mistaken for royalty yet again, Ardashir contemplates the ancient mask beneath Talos—giving the finale unexpected mythic grandeur."* (`vo_take_5_3`) |
| `take_5_4` | 5 | `ardashir` + `suppressor` | `wonder:+1, chaos:+2` | *(Video `[02:52]`)* Blue-lit dramatic profile of Ardashir pondering while a **colossal 3D Originium Suppressor** eclipses the moon Talos! *"At last, the 'Sarkaz Princess' (?) found Talos! Orbiting high above Talos-II, why is a planetary-sized Suppressor bolted onto the moon?!"* (`vo_take_5_4`) |

### 6.2 Exact Ending Resolution Formula & The 5 Canonical Endings (`src/levels/endings_data.js`)
At the end of Act 5 (`revealEnding()`):
1. Sum `moods = { love, joy, wonder, chaos }` across Acts `1..5`.
2. Let `peak = Math.max(moods.love, moods.joy, moods.wonder, moods.chaos)`.
3. **If `peak < 6`**: unlock **`END1` (*Strange Sauin*)**.
4. **Else** (`peak >= 6`), pick the mood matching `peak` (deterministic tie-break order: `love -> END2`, `joy -> END3`, `wonder -> END4`, `chaos -> END5`):

| `endingId` | Code & Official Title | Trigger Rule | Illustrated Postcard & Story Summary (`voId`) |
|---|---|---|---|
| `END1` | `//END1` **Strange Sauin** | All 4 moods `< 6` *(matches Video `{4,4,1,5}`!)* | Wide-eyed **Last Rite** surrounded by dozens of costumed Pop Loongs (pumpkin hats, witch caps, Sarkaz horns) under orange party bunting. *"Did the Sarkaz Princess finally find Sauin...? Wait—everyone got candy EXCEPT the Sauin-exclusive Pop Loongs! Hey, Pop Loongs can be Sarkaz too! Left empty-handed, the Pop Loong army chooses TRICK—marching on Seš'qa to take over Talos-II!"* (`vo_end_1`) |
| `END2` | `//END2` **The Sauin Universe** | **Love `>= 6`** (highest) | Warm golden-pink lantern sky: **Last Rite** hugging a smiling Pop Loong surrounded by **Camille**, **Chen Qianyu**, **Rossi**, **Mi Fu**, and **Yvonne** sharing sweets. *"Drawn together by earnest warmth, every corner of Talos-II lights a lantern for the myriad souls! From Fangqu Street to the frontier outposts, a gentle Sauin Universe blooms—and Last Rite didn't even flub her final line!"* (`vo_end_2`) |
| `END3` | `//END3` **An Unending Parade** | **Joy `>= 6`** (highest) | Dazzling carnival parade float with fireworks, dancing Lankybeasts, Landbreakers tossing candy, and **Last Rite** & **Rossi** leading a conga line. *"Cut? Never! The commercial spills off the stage into an Unending Sauin Parade! Operators, Landbreakers, and Lankybeasts dance down Fangqu Street till dawn while Witchcraft Hour sells out of every last lollipop!"* (`vo_end_3`) |
| `END4` | `//END4` **Sauin & Sarkaz** | **Wonder `>= 6`** (highest) | Cosmic silver-violet panorama beneath **Talos**: **Last Rite**, **Camille**, the **Mysterious Sarkaz**, and a sighing **Ardashir** holding a disclaimer sign. *"From high above, Talos whispers the truth: so long as the Sarkaz endure, Sauin's light shall never fade! Everyone nods solemnly—except white-haired guest star Ardashir, who politely insists for the tenth time: 'I am NOT a Sarkaz.'"* (`vo_end_4`) |
| `END5` | `//END5` **Sauin Never Exists** | **Chaos `>= 6`** (highest) | Glorious studio meltdown: **Sarkaz Director** chasing runaway fireworks, a giant Suppressor on the moon, **Camille** grilling steaks, and **Yvonne** cackling atop the prop pile. *"Smoke fills the stage, fireworks orbit the moon, and nobody remembers what they were advertising! The Director tosses his megaphone into the air—maybe Sauin never existed at all, and this whole shoot was a fever dream!"* (`vo_end_5`) |

### 6.3 The 8 Sauin Studio Commissions (`src/levels/commissions.js` — `300 Oroberyl` Total)
1. `comm_act1` — **Quiet on Set!**: Complete Act 1 (`40 Oroberyl`, `5,000 T-Creds`)
2. `comm_first_wrap` — **That's a Wrap!**: Complete all 5 Acts and unlock any Ending (`60 Oroberyl`, `5,000 T-Creds`)
3. `comm_end2` — **Heart of the Myriad**: Unlock `//END2: The Sauin Universe` (`40 Oroberyl`, `5,000 T-Creds`)
4. `comm_end3` — **Carnival Director**: Unlock `//END3: An Unending Parade` (`40 Oroberyl`, `5,000 T-Creds`)
5. `comm_end4` — **Myth of Talos**: Unlock `//END4: Sauin & Sarkaz` (`40 Oroberyl`, `5,000 T-Creds`)
6. `comm_end5` — **Box-Office Chaos**: Unlock `//END5: Sauin Never Exists` (`40 Oroberyl`, `5,000 T-Creds`)
7. `comm_takes_10` — **Seasoned Filmmaker**: Record `10` distinct Takes in the Film Album (`20 Oroberyl`, `5,000 T-Creds`)
8. `comm_master_all` — **Auteur of All Souls**: Unlock all `20/20` Takes & all `5/5` Endings (`20 Oroberyl`, `5,000 T-Creds`)

---

## 7. Full Expressive Neural English Voiceover Spec (`52` Clips) & WebAudio Engine

### 7.1 Strict Voiceover & Synthesis Rules
- **STRICTLY BAN** robotic browser `window.speechSynthesis` (`SpeechSynthesisUtterance`)!
- `@vo-studio` pre-renders all **52** expressive neural English MP3s (`44.1 kHz`, `96 kbps`, `-16 LUFS` normalized, safe `45 ms` pre-roll / `110 ms` post-roll dead-air trim so zero consonants clip) into `assets/vo/<id>.mp3` and writes `assets/vo/manifest.json`:
```json
{
  "vo_title_welcome": {
    "file": "assets/vo/vo_title_welcome.mp3",
    "speaker": "Sarkaz Director",
    "voicePersona": "vanguard",
    "priority": 2,
    "durationMs": 3120,
    "text": "Welcome to the Sauin promo shoot! Places, everyone—New Era for the Myriad Souls!"
  }
}
```
- **Phonetic `ttsText` Rule for `@vo-studio`**: Pass the **`ttsText`** column to `edge-tts` so fantasy lore nouns (`Sauin` → `Sah-win`, `Talos-II` → `Talos Two`, `Seš'qa` → `Sesh-kah`, `Fangqu` → `Fahng-choo`, `Mi Fu` → `Mee Foo`, `Qianyu` → `Chyen-yoo`) are pronounced naturally with zero TTS garbling, while storing the clean canonical **`englishText`** in `manifest.json[id].text` for on-screen English subtitles!
- **Synchronized English Caption Banner (`src/ui/captions_hud.js`)**: Whenever any VO clip plays, display a sleek cinema subtitle pill (`[🎙 Speaker Name]: "English text..."`) with animated equalizer bars; auto-clears `250 ms` after clip end.
- **BGM Auto-Ducking & Priority Anti-Spam (`src/audio/vo_player.js`)**:
  - While VO is playing, `bgmGain` smoothly ducks to **`0.35×`** (`80 ms` attack, `280 ms` release after VO finishes).
  - Higher or equal `priority` preempts currently playing VO cleanly (`audioEl.pause()` + reset); lower priority is skipped if higher priority is active; identical `voId` has a `600 ms` anti-spam cooldown unless `{ force: true }`.
  - Top-right HUD has independent **`🎵 BGM`** and **`🎙 Voice`** toggle buttons (persisted in `localStorage`).

### 7.2 Complete 52-Clip Voiceover Script & Trigger Table (`@vo-studio` Master Script)

| # | `id` | `voicePersona` | `speaker` | `triggerEvent` | Prio | `englishText` (On-Screen Subtitle & `manifest.json`) | `ttsText` (Phonetic Input for Neural TTS) |
|---|---|---|---|---|---|---|---|
| 1 | `vo_title_welcome` | `vanguard` | Sarkaz Director | First gesture on Title / Audio unlock | 2 | Welcome to the Sauin promo shoot! Places, everyone—New Era for the Myriad Souls! | Welcome to the Sah-win promo shoot! Places, everyone—New Era for the Myriad Souls! |
| 2 | `vo_clapper_start` | `vanguard` | Sarkaz Director | `clapperSnap` (Start Filming) | 3 | Quiet on set! Scene one, rolling—and action! | Quiet on set! Scene one, rolling—and action! |
| 3 | `vo_tut_cast` | `vanguard` | Sarkaz Director | Act 1 `blocking` tutorial open | 2 | Drag or tap one actor and one prop onto their stage marks, then roll camera! | Drag or tap one actor and one prop onto their stage marks, then roll camera! |
| 4 | `vo_roll_action` | `vanguard` | Sarkaz Director | `cameraRollStart` (brief sting before take VO) | 2 | Lights, camera—roll it! | Lights, camera—roll it! |
| 5 | `vo_reshoot` | `vanguard` | Sarkaz Director | `reshootRequested` | 2 | Cut, cut! Reset the props—let's try another take! | Cut, cut! Reset the props—let's try another take! |
| 6 | `vo_album_open` | `narrator` | Stage Narrator | `modalOpened` (`album`) | 1 | The Film Album! Replay your favorite takes and track all five Sauin endings. | The Film Album! Replay your favorite takes and track all five Sah-win endings. |
| 7 | `vo_rewards_claim` | `support` | Last Rite | `commissionClaimed` | 2 | Oh, thank you! Here are your Sauin studio rewards! | Oh, thank you! Here are your Sah-win studio rewards! |
| 8 | `vo_all_complete` | `vanguard` | Sarkaz Director | `comm_master_all` unlocked | 4 | Bravo, Director! Every single take and ending is in the can—an absolute masterpiece! | Bravo, Director! Every single take and ending is in the can—an absolute masterpiece! |
| 9 | `vo_s1_dlg_1` | `phantom_boss` | Mysterious Sarkaz | Act 1 Dialogue 1 (`[00:26]`) | 3 | O most noble Sarkaz Princess! Where walk the Myriad Souls, Sauin must follow to guide them home—two halves bound by fate, forever inseparable! | Oh most noble Sahr-kahz Princess! Where walk the Myriad Souls, Sah-win must follow to guide them home—two halves bound by fate, forever inseparable! |
| 10 | `vo_s1_dlg_2` | `endministrator` | Camille | Act 1 Dialogue 2 (`[00:28]`) | 3 | Ahem. Operator Last Rite, the cameras are already rolling. | Ahem. Operator Last Rite, the cameras are already rolling. |
| 11 | `vo_s1_dlg_3` | `support` | Last Rite | Act 1 Dialogue 3 (`[00:30]`) | 3 | R-Rolling already?! Oh, I'm so sorry! Please, carry right on! | Rolling already?! Oh, I'm so sorry! Please, carry right on! |
| 12 | `vo_s1_dlg_4` | `phantom_boss` | Mysterious Sarkaz | Act 1 Dialogue 4 (`[00:32]`) | 3 | From Terra to Talos-II, farewells never cease for the Sarkaz... yet the Sauin festival that lights their way has faded from memory. | From Terra to Talos Two, farewells never cease for the Sahr-kahz... yet the Sah-win festival that lights their way has faded from memory. |
| 13 | `vo_s1_dlg_5` | `phantom_boss` | Mysterious Sarkaz | Act 1 Dialogue 5 (`[00:33]`) | 3 | O noble heir of the Royal Court! A sacred duty rests upon your shoulders—reclaim Sauin! Bring back the festival! | Oh noble heir of the Royal Court! A sacred duty rests upon your shoulders—reclaim Sah-win! Bring back the festival! |
| 14 | `vo_s1_dlg_6` | `phantom_boss` | Mysterious Sarkaz | Act 1 Dialogue 6 (`[00:34]`) | 3 | Where walk the Myriad Souls... Sauin must shine again. | Where walk the Myriad Souls... Sah-win must shine again. |
| 15 | `vo_s2_dlg_1` | `vanguard` | Sarkaz Director | Act 2 Dialogue 1 (`[01:10]`) | 3 | Sponsor plug first—places, everyone! Princess, hit your mark and read the cue card! | Sponsor plug first—places, everyone! Princess, hit your mark and read the cue card! |
| 16 | `vo_s2_dlg_2` | `support` | Last Rite | Act 2 Dialogue 2 (`[01:12]`) | 3 | Unbeatable value, enchanting deals—only at Witchcraft Hour! | Unbeatable value, enchanting deals—only at Witchcraft Hour! |
| 17 | `vo_s3_dlg_1` | `phantom_boss` | Injured Landbreaker | Act 3 Dialogue 1 (`[01:40]`) | 3 | Witchcraft Hour's Sauin Mega-Bonanza... gulp... huge discounts, unbeatable bargains... | Witchcraft Hour's Sah-win Mega Bonanza... gulp... huge discounts, unbeatable bargains... |
| 18 | `vo_s3_dlg_2` | `support` | Last Rite | Act 3 Dialogue 2 (`[01:44]`) | 3 | How on earth did you convince an actual Landbreaker to film a holiday commercial?! | How on earth did you convince an actual Landbreaker to film a holiday commercial?! |
| 19 | `vo_s3_dlg_3` | `pumpkin_sprite` | Rossi | Act 3 Dialogue 3 (`[01:46]`) | 3 | Heh! A fang of the Wolfpack has plenty of ways to be persuasive! | Heh! A fang of the Wolfpack has plenty of ways to be persuasive! |
| 20 | `vo_s4_dlg_1` | `announcer` | Mi Fu | Act 4 Dialogue 1 (`[02:02]`) | 3 | Huh? A film shoot? So you're the crew the boss mentioned? Wait—Sauin? | Huh? A film shoot? So you're the crew the boss mentioned? Wait—Sah-win? |
| 21 | `vo_s4_dlg_2` | `support` | Last Rite | Act 4 Dialogue 2 (`[02:04]`) | 3 | Y-Yes! Witchcraft Hour is also running a special Sauin promotional event... | Yes! Witchcraft Hour is also running a special Sah-win promotional event... |
| 22 | `vo_s4_dlg_3` | `announcer` | Mi Fu | Act 4 Dialogue 3 (`[02:06]`) | 3 | Hah? A promo sale? All this buildup, and you're pitching coupons right on the film set. | Hah? A promo sale? All this buildup, and you're pitching coupons right on the film set. |
| 23 | `vo_s4_dlg_4` | `support` | Last Rite | Act 4 Dialogue 4 (`[02:08]`) | 3 | Um... I can even apply for an exclusive Patrol Squad discount for your whole team! | Um... I can even apply for an exclusive Patrol Squad discount for your whole team! |
| 24 | `vo_s5_dlg_1` | `support` | Last Rite | Act 5 Dialogue 1 (`[02:28]`) | 3 | H-Hello there! Excuse me, are you... a fellow Sarkaz? | Hello there! Excuse me, are you... a fellow Sahr-kahz? |
| 25 | `vo_s5_dlg_2` | `support` | Last Rite | Act 5 Dialogue 2 (`[02:30]`) | 3 | Oh—a Banshee! Might you be interested in celebrating Sauin? | Oh—a Banshee! Might you be interested in celebrating Sah-win? |
| 26 | `vo_s5_dlg_3` | `endministrator` | Ardashir | Act 5 Dialogue 3 (`[02:32]`) | 3 | ...No. I'm afraid you have the wrong person. | No. I'm afraid you have the wrong person. |
| 27 | `vo_s5_dlg_4` | `support` | Last Rite | Act 5 Dialogue 4 (`[02:34]`) | 3 | Ack—sorry, my mistake! Still... any interest in Sauin? The discounts are seriously huge... | Ack—sorry, my mistake! Still... any interest in Sah-win? The discounts are seriously huge... |
| 28 | `vo_take_1_1` | `narrator` | Stage Narrator | `takeCompleted` (`take_1_1`) | 3 | Wearing a borrowed ritual mask, the shy Sarkaz Princess vows to bring Sauin home—once she stops apologizing to the props! | Wearing a borrowed ritual mask, the shy Sahr-kahz Princess vows to bring Sah-win home—once she stops apologizing to the props! |
| 29 | `vo_take_1_2` | `narrator` | Stage Narrator | `takeCompleted` (`take_1_2`) | 3 | Forget ancient prophecies—the Sarkaz Princess discovers that sizzling roast steak summons departed appetites faster than any ritual! | Forget ancient prophecies—the Sahr-kahz Princess discovers that sizzling roast steak summons departed appetites faster than any ritual! |
| 30 | `vo_take_1_3` | `narrator` | Stage Narrator | `takeCompleted` (`take_1_3`) | 3 | Wait—since when was the Sarkaz Princess this suave?! Camille's brooding masked monologue turns the commercial into cinema! | Wait—since when was the Sahr-kahz Princess this suave?! Camille's brooding masked monologue turns the commercial into cinema! |
| 31 | `vo_take_1_4` | `narrator` | Stage Narrator | `takeCompleted` (`take_1_4`) | 3 | Camille ignores the script entirely and turns Act One into a midnight cooking show. The crew is already lining up for seconds! | Camille ignores the script entirely and turns Act One into a midnight cooking show. The crew is already lining up for seconds! |
| 32 | `vo_take_2_1` | `narrator` | Stage Narrator | `takeCompleted` (`take_2_1`) | 3 | On Fangqu Street, the Sarkaz Princess comforts a weeping Pop Loong—sharing her very first Sauin candy under the neon lights. | On Fahng-choo Street, the Sahr-kahz Princess comforts a weeping Pop Loong—sharing her very first Sah-win candy under the neon lights. |
| 33 | `vo_take_2_2` | `narrator` | Stage Narrator | `takeCompleted` (`take_2_2`) | 3 | The Sarkaz Princess arrived at Fangqu Street hunting for candy, only to interrogate a silent Lankybeast... Did it understand a single word? | The Sahr-kahz Princess arrived at Fahng-choo Street hunting for candy, only to interrogate a silent Lanky-beast... Did it understand a single word? |
| 34 | `vo_take_2_3` | `narrator` | Stage Narrator | `takeCompleted` (`take_2_3`) | 3 | Stand-in Princess Chen Qianyu teams up with Pop Loong for a dazzling Wuling sword-dance that showers the street in sweets! | Stand-in Princess Chen Chyen-yoo teams up with Pop Loong for a dazzling Woo-ling sword-dance that showers the street in sweets! |
| 35 | `vo_take_2_4` | `narrator` | Stage Narrator | `takeCompleted` (`take_2_4`) | 3 | Disaster on Fangqu Street! Chen Qianyu challenges the Lankybeast to a jumping contest, launching the prop crew into the hedges! | Disaster on Fahng-choo Street! Chen Chyen-yoo challenges the Lanky-beast to a jumping contest, launching the prop crew into the hedges! |
| 36 | `vo_take_3_1` | `narrator` | Stage Narrator | `takeCompleted` (`take_3_1`) | 3 | To reclaim the stolen candy and save Sauin, the Sarkaz Princess draws cold steel—though the Landbreaker looks more scared of forgetting his lines! | To reclaim the stolen candy and save Sah-win, the Sahr-kahz Princess draws cold steel—though the Landbreaker looks more scared of forgetting his lines! |
| 37 | `vo_take_3_2` | `narrator` | Stage Narrator | `takeCompleted` (`take_3_2`) | 3 | Instead of a blade, the Princess offers a giant swirl lollipop! Even the fiercest Landbreaker melts for Sauin sweetness. | Instead of a blade, the Princess offers a giant swirl lollipop! Even the fiercest Landbreaker melts for Sah-win sweetness. |
| 38 | `vo_take_3_3` | `narrator` | Stage Narrator | `takeCompleted` (`take_3_3`) | 3 | Stunt-double Rossi steals the spotlight! With one flashy Wolfpack flourish, the Landbreaker surrenders every last piece of candy! | Stunt-double Rossi steals the spotlight! With one flashy Wolfpack flourish, the Landbreaker surrenders every last piece of candy! |
| 39 | `vo_take_3_4` | `narrator` | Stage Narrator | `takeCompleted` (`take_3_4`) | 3 | Wait a minute—Rossi uses the giant lollipop to extort both the Landbreaker and the film crew's snack table! | Wait a minute—Rossi uses the giant lollipop to extort both the Landbreaker and the film crew's snack table! |
| 40 | `vo_take_4_1` | `narrator` | Stage Narrator | `takeCompleted` (`take_4_1`) | 3 | The Sarkaz Princess shares the recovered Candy Chest with the whole Patrol Squad—turning a late-night shift into a warm Sauin feast! | The Sahr-kahz Princess shares the recovered Candy Chest with the whole Patrol Squad—turning a late-night shift into a warm Sah-win feast! |
| 41 | `vo_take_4_2` | `narrator` | Stage Narrator | `takeCompleted` (`take_4_2`) | 3 | Boom! The Princess launches a sky full of Sauin fireworks over the outpost—even Witchcraft Hour couldn't buy better publicity! | Boom! The Princess launches a sky full of Sah-win fireworks over the outpost—even Witchcraft Hour couldn't buy better publicity! |
| 42 | `vo_take_4_3` | `narrator` | Stage Narrator | `takeCompleted` (`take_4_3`) | 3 | The Sarkaz Princess—wait, Mi Fu?!—recovered the candy, while Captain Yvonne laughs maniacally on the chest... isn't she having way too much fun?! | The Sahr-kahz Princess—wait, Mee Foo?!—recovered the candy, while Captain Yvonne laughs maniacally on the chest... isn't she having way too much fun?! |
| 43 | `vo_take_4_4` | `narrator` | Stage Narrator | `takeCompleted` (`take_4_4`) | 3 | Who aimed the fireworks indoors?! Rockets ricochet across the set while Mi Fu deadpans through absolute pyrotechnic pandemonium! | Who aimed the fireworks indoors?! Rockets ricochet across the set while Mee Foo deadpans through absolute pyrotechnic pandemonium! |
| 44 | `vo_take_5_1` | `narrator` | Stage Narrator | `takeCompleted` (`take_5_1`) | 3 | Beneath the silver gaze of Talos, the Sarkaz Princess lifts her mask—realizing Sauin lives wherever friends gather to remember. | Beneath the silver gaze of Talos, the Sahr-kahz Princess lifts her mask—realizing Sah-win lives wherever friends gather to remember. |
| 45 | `vo_take_5_2` | `narrator` | Stage Narrator | `takeCompleted` (`take_5_2`) | 3 | Um, hello, Mister Talos? Last Rite tries dialing the moon on an Originium Suppressor, cracking up the entire studio! | Um, hello, Mister Talos? Last Rite tries dialing the moon on an Originium Suppressor, cracking up the entire studio! |
| 46 | `vo_take_5_3` | `narrator` | Stage Narrator | `takeCompleted` (`take_5_3`) | 3 | Mistaken for royalty yet again, Ardashir contemplates the ancient mask beneath Talos—giving the finale unexpected mythic grandeur. | Mistaken for royalty yet again, Ardashir contemplates the ancient mask beneath Talos—giving the finale unexpected mythic grandeur. |
| 47 | `vo_take_5_4` | `narrator` | Stage Narrator | `takeCompleted` (`take_5_4`) | 3 | At last, the Sarkaz Princess found Talos! Orbiting high above Talos-II, why is a planetary-sized Suppressor bolted onto the moon?! | At last, the Sahr-kahz Princess found Talos! Orbiting high above Talos Two, why is a planetary-sized Suppressor bolted onto the moon?! |
| 48 | `vo_end_1` | `narrator` | Stage Narrator | `endingRevealed` (`END1`) | 4 | Ending One: Strange Sauin! Everyone got candy except the Sauin-exclusive Pop Loongs! Left empty-handed, the Pop Loong army chooses trick—marching on Seš'qa to take over Talos-II! | Ending One: Strange Sah-win! Everyone got candy except the Sah-win-exclusive Pop Loongs! Left empty-handed, the Pop Loong army chooses trick—marching on Sesh-kah to take over Talos Two! |
| 49 | `vo_end_2` | `narrator` | Stage Narrator | `endingRevealed` (`END2`) | 4 | Ending Two: The Sauin Universe! Drawn together by earnest warmth, every corner of Talos-II lights a lantern for the myriad souls—and Last Rite nailed her final line! | Ending Two: The Sah-win Universe! Drawn together by earnest warmth, every corner of Talos Two lights a lantern for the myriad souls—and Last Rite nailed her final line! |
| 50 | `vo_end_3` | `narrator` | Stage Narrator | `endingRevealed` (`END3`) | 4 | Ending Three: An Unending Parade! The commercial spills off the stage into an all-night carnival down Fangqu Street while Witchcraft Hour sells out of every lollipop! | Ending Three: An Unending Parade! The commercial spills off the stage into an all-night carnival down Fahng-choo Street while Witchcraft Hour sells out of every lollipop! |
| 51 | `vo_end_4` | `narrator` | Stage Narrator | `endingRevealed` (`END4`) | 4 | Ending Four: Sauin and Sarkaz! Talos whispers that Sauin shall endure as long as the Sarkaz do—while poor Ardashir sighs, for the tenth time, I am not a Sarkaz! | Ending Four: Sah-win and Sahr-kahz! Talos whispers that Sah-win shall endure as long as the Sahr-kahz do—while poor Ardashir sighs, for the tenth time, I am not a Sahr-kahz! |
| 52 | `vo_end_5` | `narrator` | Stage Narrator | `endingRevealed` (`END5`) | 4 | Ending Five: Sauin Never Exists! Smoke fills the stage, fireworks orbit the moon, and the Director tosses his megaphone—maybe Sauin was a glorious fever dream all along! | Ending Five: Sah-win Never Exists! Smoke fills the stage, fireworks orbit the moon, and the Director tosses his megaphone—maybe Sah-win was a glorious fever dream all along! |

### 7.3 WebAudio BGM & Procedural SFX Spec (`src/audio/bgm_halloween.js`, `src/audio/sfx_bank.js`)
- **BGM (`bgm_halloween.js`)**: Original procedural WebAudio **E♭-minor 4/4 "Spooky-Cute" Halloween March** at **124.4 BPM** (`beat = 0.4823s`), recreating the source video's musical texture:
  - Section A (8 bars): Triangle+lowpass tuba oom-pah bass (`Eb2 / Bb1`) on beats 1 & 3, crisp pizzicato minor chord plucks on beats 2 & 4, and bell-like FM celesta/glockenspiel chromatic melody (`Eb5–F5–Gb5–F5–Eb5–D5–Eb5–Bb4`).
  - Section B (8 bars): Brighter `Gb major / Bb7` carnival bridge with filtered noise sleigh-bell shimmer + airy flute counter-melody, looping seamlessly!
- **Procedural SFX (`sfx_bank.js` — 18 named effects)**:
  `ui_click`, `tab_flip`, `curtain_swish`, `clapper_snap`, `card_pickup`, `slot_snap`, `slot_clear`, `camera_whir`, `shutter_flash`, `mood_up_1`, `mood_up_2`, `gag_pop`, `firework_burst`, `steak_sizzle`, `frog_ribbit`, `sword_ring`, `ending_fanfare`, `reward_chime`.

---

## 8. 14 Numeric Play-First Fun, Audio, Localization & Quality Gates

Enforced automatically by `qa-e2e` in `tests/sim_gates.py` (using `tests/cdp.py` against headless Chrome, scratch output strictly in `/tmp/bv13d_halloween/qa/`):

| Gate | Metric & Pass Threshold |
|---|---|
| **G1 — Instant Boot & Visible Title** | `#title` visible in initial HTML before JS finishes; `window.__HALLOWEEN__` ready `<= 1.5s`; `0` console errors, `0` uncaught exceptions, `0` HTTP 4xx/5xx responses. |
| **G2 — Time-to-First-Action Responsiveness** | Clicking `Start Filming` transitions to Act 1 (`clapper` → `dialogue` / `blocking`) with visual + audio event response `<= 120 ms` (`<= 0.3s` to interactive control). |
| **G3 — 100% Video Playthrough Parity (`END1`)** | Replaying the exact 5 video choices (`last_rite+sarkaz_mask`, `last_rite+lankybeast`, `last_rite+one_handed_sword`, `mi_fu+candy_chest`, `ardashir+suppressor`) yields exact per-act deltas and final `{love:4, joy:4, wonder:1, chaos:5}` → **`END1` (*Strange Sauin*)**. |
| **G4 — All 5 Branching Endings Reachable** | Executing `RECIPES.END1 .. RECIPES.END5` deterministically unlocks all 5 distinct endings (`END1`, `END2`, `END3`, `END4`, `END5`) and populates `progress.unlockedEndings.length === 5`. |
| **G5 — All 20 Stage Takes Completable & Distinct** | Cycling through all `5 Acts × 4 (Actor, Prop)` combinations via `reshoot` + `nextAct` unlocks `progress.unlockedTakes.length === 20`, each with unique `scriptText`, `voId`, and non-zero `particles`. |
| **G6 — Dual Casting UX (Drag & Tap + Slot Order)** | Both single-tap card casting AND CDP pointer drag-and-drop (`drag` card → stage slot) work across Acts 1–5, honoring `Prop=left, Actor=right` in Acts 1–3 and `Actor=left, Prop=right` in Acts 4–5. |
| **G7 — Zero Dead Taps & Interactive Stage Juice** | 200 taps across stage slots, background gags (`gag_curtain_bunny`, `gag_neon_wink`, `gag_tent_rustle`, `gag_bush_peek`, `gag_crystal_chime`), and UI controls produce `feedback.dead === 0`; rolling camera triggers clapper + camera flash + `>= 25` 3D particles per take. |
| **G8 — All 8 Studio Commissions & Persistence** | Completing `20/20` takes + `5/5` endings unlocks all 8 commissions totaling **`oroberyl === 300`** and **`tCreds === 40000`**, and reloading the page restores `unlockedTakes`, `unlockedEndings`, and `oroberyl` from `localStorage`. |
| **G9 — 100% English Localization (`Zero Hanzi`)** | Across Title, all 5 Act Cutscenes, Blocking UI, all 20 Take Cards, all 5 Ending Screens, Film Album, and Rewards Modal, regex `[\u4e00-\u9fff]` count across visible DOM text + `<canvas>` label registries is **`hanziCount === 0`**, and `document.documentElement.lang === 'en'`. |
| **G10 — 100% Neural English VO Integrity (`52/52`)** | `assets/vo/manifest.json` loads HTTP `200` with **`52` entries**; every `assets/vo/<id>.mp3` returns HTTP `200`, `size > 4000` bytes, `durationMs >= 400`; `speechSynthesisUsed === false`. |
| **G11 — VO Caption Sync & BGM Auto-Ducking** | Triggering `playVO` across cutscene, take, and ending clips updates the visible English caption banner to match `manifest[id].text`, sets `bgmDucked === true` (`bgmGain <= 0.40`) during playback, and restores `bgmGain` after completion. |
| **G12 — 60 Hz Seeded Determinism** | Two fresh runs with identical `seed` and identical command trace produce byte-for-byte identical `getState()` JSON snapshots after `600` frames (`3/3` seeds). |
| **G13 — 4-Viewport Responsive Layout** | At `1280×800`, `1024×768`, `844×390`, and `390×844`: `scrollWidth <= innerWidth`, `scrollHeight <= innerHeight`, zero overlapping interactive button rects, all primary buttons within viewport bounds. |
| **G14 — Render Performance & Memory Stability** | At `1280×800`, frame step `p95 <= 20 ms` (or `<= 2×` headless SwiftShader empty-scene baseline), `drawCalls <= 80`, `triangles <= 60000`, and `geometries`/`textures` count stable (`±5%`) across 10 consecutive reshoots. |
