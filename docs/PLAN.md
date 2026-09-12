# PJ001 Development Plan

Version: 0.5  
Status: M1 combat sandbox in implementation — M1.3 active  
Source of truth: this repository

## 1. Problem and outcome
PJ001 is one concrete mobile-first 2D top-down action RPG prototype.

The first objective is to validate whether the core combat feels fun on a phone before investing in content, art, economy, story, backend, monetization, or release engineering.

Primary success question:

> Is the combat responsive, readable, and enjoyable enough that the player wants to keep fighting and progressing?

Primary stakeholder: project owner/player-tester.  
Implementation role: AI-led development, with the project owner making product/design decisions.

## 2. Locked product decisions
- Genre: RPG
- Combat: real-time action, Zelda-like
- Camera: 2D top-down
- Player: one controllable character
- Core loop: explore -> fight -> loot -> upgrade -> explore further
- Primary target: Android
- Development/testing: web-first through a stable Chrome playtest URL; Android packaging later
- Orientation: portrait
- Reference design space: 720 x 1280 only as a design reference, not a fixed runtime aspect ratio
- Runtime display: responsive to the actual mobile browser viewport
- Gameplay fills the viewport; touch controls overlay the lower gameplay area
- Controls: virtual joystick lower-left; attack/dodge/skills lower-right
- Basic attack: manual tap, follows current facing direction
- Dodge: directional dash from movement intent with short invulnerability window
- Enemy contact alone does not damage the player; damage must come from explicit enemy attacks
- Hit feedback: intentionally arcade-heavy
- Aim assist: soft correction only, no hard lock-on
- Skills later: larger pool with limited equipped set; prototype target 3 active skills
- Progression: level/stat growth + equipment loot
- Death: checkpoint respawn later in M1.6
- Source of truth: GitHub
- Stack: Phaser 3 + TypeScript + Vite

## 3. Prototype scope
Target playtime: approximately 10-20 minutes.

Prototype content target:
- 1 player character
- 1 small map
- 3 enemy types
- 1 boss
- 3-5 skills total
- limited equipment/items
- simple level/stat progression
- checkpoint respawn

The prototype is not content-complete. Its job is to test combat feel and the minimum progression loop.

## 4. Current state
Completed:
- M0 technical bootstrap
- M0.5 GitHub Pages continuous browser playtest deployment
- M0.6 portrait direction test
- M0.7 responsive portrait shell, device-accepted as the combat foundation
- M1.1 facing + timed melee attack with startup/active/recovery and active-only hitbox
- M1.2 first enemy + enemy HP + real melee damage + knockback + arcade hit feedback
- M1.2 device tuning: player move speed reduced from 235 to 205; enemy knockback reduced from 360 to 255

Stable playtest URL:
`https://momentum448-glitch.github.io/PJ001/`

Current implementation target:
**M1.3 — enemy telegraph + explicit enemy attack + player HP/damage.**

M1.3 validation question:
> Can the player clearly read an enemy attack before damage happens, and can we guarantee that merely touching the enemy never causes damage?

## 5. Working assumptions
- Single-player
- Offline-first
- Melee-first combat
- No multiplayer/backend/account/monetization during prototype
- No crafting, elemental system, stamina, or complex combo tree initially
- Equipment initially weapon + armor only
- Placeholder/procedural visuals are acceptable until combat is validated
- Portrait encounter composition should avoid relying on very wide horizontal sightlines
- Browser chrome and phone aspect ratios vary; viewport resize must remain safe
- Combat tuning values remain provisional and should change from device feedback without reopening product decisions

## 6. Development principles
1. Validate feel before content volume.
2. Build the smallest playable experiment for each uncertain mechanic.
3. Avoid systems that do not affect the current validation question.
4. Treat mobile touch ergonomics as first-class.
5. Prefer simple, inspectable architecture over premature abstraction.
6. Every milestone needs observable acceptance criteria.
7. Update this plan before meaningful gameplay implementation.
8. Use branches and pull requests; `main` remains reviewed source of truth.
9. Before important work, re-read PLAN and inspect current GitHub state rather than relying on chat memory.
10. Keep the public playtest URL usable after meaningful merges.

## 7. Milestones

### M0 — Technical bootstrap
Status: Complete

### M0.5 — Continuous browser playtest deployment
Status: Complete

### M0.6 — Portrait mobile shell
Status: Complete

### M0.7 — Responsive portrait shell
Status: Complete

Result:
- portrait retained
- fixed 9:16 runtime sizing rejected
- responsive full-viewport gameplay accepted
- lighter overlaid touch controls accepted as the combat foundation

### M1 — Combat sandbox
Status: In progress

Goal: determine whether movement, attack, dodge, and enemy interaction can feel responsive and readable on a phone.

M1 acceptance criteria:
- player can move, attack, dodge, take damage, kill an enemy, die, and respawn
- controls are usable with two thumbs in portrait orientation
- attacks have readable startup/contact/recovery
- enemy attacks are readable before they deal damage
- touching an enemy alone causes no damage
- dash follows movement intent and includes a short invulnerability window
- soft aim helps near misses without feeling like hard lock
- successful hits have strong arcade-style feedback
- no game-breaking input/state bug during a 3-minute continuous fight test

Decision gate after M1:
- if combat does not feel promising, tune/rework before adding systems
- if promising, proceed to enemy variety and skills

### M2 — Combat depth
Status: Planned

Scope: 3 enemy archetypes total, 3 active prototype skills, cooldowns, clearer telegraphs, encounter composition.

### M3 — Reward and progression loop
Status: Planned

Scope: XP/levels, basic stats, weapon + armor, loot, simple inventory/equipment UI, checkpoint progression.

### M4 — Prototype map and boss
Status: Planned

Scope: one portrait-oriented map, encounter flow, checkpoint, one boss, 10-20 minute prototype session.

### M5 — Mobile prototype validation
Status: Planned

Output: go / revise / stop decision based on combat fun, ergonomics, readability, pacing, progression motivation, and phone performance.

## 8. Explicitly out of scope until prototype validation
- story campaign / large world
- multiplayer / online services / accounts / cloud saves
- monetization / ads / IAP
- extensive crafting / large item database / large skill tree
- production-quality art pipeline
- localization
- Play Store release work
- APK packaging beyond later validation needs

## 9. Workflow for every milestone
Before implementation:
1. Re-read this plan and inspect current repository state.
2. Define the validation question.
3. Identify only decisions that materially change implementation.
4. Record assumptions and acceptance criteria.
5. Break work into the smallest testable slice.

During implementation:
1. Create a milestone branch.
2. Keep commits focused.
3. Run build/CI checks.
4. Avoid unrelated refactors.

Before merge:
1. Verify machine-testable acceptance criteria.
2. Record device-test items.
3. Open/review PR.
4. Merge only when coherent.

After device testing:
1. Record what was learned.
2. Tune or lock decisions.
3. Update this plan.
4. Continue to the next slice.

## 10. M1 implementation breakdown

### M1.1 — Facing and attack state
Status: Complete

Implemented:
- facing tracked separately from instantaneous velocity
- startup / active / recovery attack phases
- real melee hitbox active only during intended window
- state gating prevents overlapping attack spam

### M1.2 — First enemy and damage model
Status: Complete, device-tuned

Implemented:
- one enemy with HP
- melee hit detection and player-to-enemy damage
- one hit per attack
- knockback + flash + impact + damage number + camera feedback
- enemy respawns for repeated test cycles

Current tuned values:
- player move speed: 205
- enemy knockback speed: 255

### M1.3 — Enemy telegraph and player damage
Status: In implementation

Scope:
- readable enemy wind-up/telegraph
- explicit enemy attack window and hitbox
- player HP HUD
- player damage response
- each enemy attack can damage player at most once
- passive enemy/player body contact causes no damage

Done when:
- player can identify an incoming attack before its damage window
- damage occurs only inside the explicit enemy attack window
- standing against/touching the enemy without an attack does not reduce HP
- hit response is visible on a phone

Intentionally deferred:
- dodge and i-frames (M1.4)
- soft aim (M1.5)
- player death/respawn loop (M1.6)

### M1.4 — Dodge dash
Status: Planned

- dedicated dodge control
- dash in movement direction, facing fallback when neutral
- short i-frames
- cooldown/state gating

### M1.5 — Soft aim assistance
Status: Planned

- narrow nearby target detection
- small directional correction only
- no persistent lock-on/camera behavior

### M1.6 — Death, respawn, HUD, sandbox pass
Status: Planned

- complete HP/death/checkpoint respawn loop
- tune attack/dash/enemy timing/hit-stop/knockback
- 3-minute continuous combat sanity test

## 11. Tunable M1 parameters — not design-blocking
- player move speed
- player/enemy HP and damage
- player attack startup/active/recovery
- melee range/size
- enemy wind-up/active/recovery timing
- enemy attack range/size
- dash distance/speed/i-frame duration/cooldown
- soft aim angle/range
- hit-stop, shake, knockback

## 12. Open risks
- portrait provides less horizontal visibility than landscape
- browser viewport can change while playing
- lower overlay controls can visually compete with combat near the bottom
- enemy telegraph must remain legible under hit effects
- soft aim can become intrusive if too generous
- final performance must be verified on target phone
- repository is currently Public

## 13. Definition of prototype success
PJ001 succeeds at prototype stage if, after a 10-20 minute portrait mobile session, combat is responsive, understandable, and enjoyable enough to justify producing more content.
