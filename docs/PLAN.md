# PJ001 Development Plan

Version: 0.7  
Status: M1 combat sandbox in implementation — M1.5 active  
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

Prototype target: 1 player, 1 small map, 3 enemy types, 1 boss, 3-5 skills, limited equipment/items, simple progression, checkpoint respawn.

The prototype is not content-complete. Its job is to test combat feel and the minimum progression loop.

## 4. Current state
Completed:
- M0 technical bootstrap
- M0.5 continuous GitHub Pages deployment
- M0.6 portrait direction test
- M0.7 responsive portrait shell, device-accepted
- M1.1 facing + timed melee attack
- M1.2 first enemy + HP + damage + tuned knockback
- M1.3 enemy telegraph + explicit enemy attack + player HP/damage, device-tested OK
- M1.4 dodge dash + i-frames + cooldown/state gating, device-tested and tuned

Current tuned values from device feedback:
- player move speed: 195
- enemy knockback speed: 255
- dodge speed: 450
- dodge duration / i-frame window: 150 ms
- dodge cooldown: 650 ms

Stable playtest URL:
`https://momentum448-glitch.github.io/PJ001/`

Current implementation target:
**M1.5 — soft aim assistance for melee attacks.**

M1.5 validation question:
> Can a small aim correction reduce frustrating near-misses on touch controls without taking attack direction control away from the player?

## 5. Working assumptions
- Single-player, offline-first, melee-first combat
- No multiplayer/backend/account/monetization during prototype
- No crafting, elemental system, stamina, or complex combo tree initially
- Equipment initially weapon + armor only
- Placeholder visuals are acceptable until combat is validated
- Portrait encounter composition should avoid very wide horizontal sightlines
- Browser viewport resize must remain safe
- Combat tuning values remain provisional and can change from device feedback without reopening product decisions

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

### M1 — Combat sandbox
Status: In progress

Goal: determine whether movement, attack, dodge, and enemy interaction can feel responsive and readable on a phone.

M1 acceptance criteria:
- player can move, attack, dodge, take damage, kill an enemy, die, and respawn
- controls are usable with two thumbs in portrait orientation
- attacks have readable startup/contact/recovery
- enemy attacks are readable before damage
- touching an enemy alone causes no damage
- dash follows movement intent and includes a short invulnerability window
- soft aim helps near misses without feeling like hard lock
- successful hits have strong arcade-style feedback
- no game-breaking input/state bug during a 3-minute continuous fight test

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

Output: go / revise / stop based on combat fun, ergonomics, readability, pacing, progression motivation, and phone performance.

## 8. Explicitly out of scope until prototype validation
Story campaign, large world, multiplayer, online services, accounts/cloud saves, monetization, extensive crafting, large item/skill databases, production art pipeline, localization, Play Store release work, and early APK packaging.

## 9. Workflow for every milestone
Before implementation: re-read plan/repo, define validation question, identify material decisions, record assumptions/acceptance criteria, and choose the smallest testable slice.

During implementation: create milestone branch, keep commits focused, run build/CI, avoid unrelated refactors.

Before merge: verify machine-testable criteria, record device-test items, review PR, merge only when coherent.

After device testing: record findings, tune/lock decisions, update plan, then continue.

## 10. M1 implementation breakdown
### M1.1 — Facing and attack state
Status: Complete

Implemented: independent facing, startup/active/recovery, active-only melee hitbox, anti-spam state gating.

### M1.2 — First enemy and damage model
Status: Complete, device-tuned

Implemented: enemy HP, melee damage, one hit per attack, knockback, flash/impact/damage number/camera feedback, repeated enemy respawn.

### M1.3 — Enemy telegraph and player damage
Status: Complete, device-tested OK

Implemented: enemy windup -> active -> recovery, readable telegraph, explicit active-only hitbox, player HP/hit response, one hit maximum per enemy attack, and no passive contact damage.

### M1.4 — Dodge dash
Status: Complete, device-tested and tuned

Locked behavior:
- dedicated DODGE touch control
- dash uses current movement input; facing fallback when neutral
- player invulnerable only during dash
- explicit cooldown/state gating
- attack and dodge cannot start on top of each other

Accepted tuned values:
- player move speed: 195
- dash speed: 450
- dash duration / i-frame: 150 ms
- cooldown: 650 ms

### M1.5 — Soft aim assistance
Status: In implementation

Locked behavior:
- attack still starts from the player's manual facing direction
- only a nearby living enemy inside a narrow forward cone is eligible
- correction is partial and capped; attack never fully snaps to a target
- no persistent target selection, lock-on marker, camera rotation, or automatic player facing change
- correction is chosen when the attack begins and remains stable for that attack

Initial tunable values:
- eligibility range: ~155 px
- forward cone: ~28 degrees from facing
- maximum correction: ~14 degrees
- correction strength: partial toward target, capped by the maximum correction

Done when:
- a small near-miss toward a nearby enemy is more likely to connect
- attacks clearly outside the forward cone do not bend toward the enemy
- the player still feels responsible for attack direction
- there is no persistent lock-on behavior

### M1.6 — Death, respawn, HUD, sandbox pass
Status: Planned

Complete HP/death/checkpoint respawn; tune combat timings; run 3-minute continuous sanity test.

## 11. Tunable M1 parameters — not design-blocking
Player speed/HP, attack timings/range, enemy HP/attack timings/range, dash speed/duration/i-frame/cooldown, soft aim angle/range/correction cap, hit-stop, shake, knockback.

## 12. Open risks
- portrait has less horizontal visibility than landscape
- browser viewport can change while playing
- lower controls can compete visually with combat
- dodge button must fit future skill controls
- soft aim can become intrusive if range/cone/correction is too generous
- final performance must be verified on target phone
- repository is currently Public

## 13. Definition of prototype success
PJ001 succeeds at prototype stage if, after a 10-20 minute portrait mobile session, combat is responsive, understandable, and enjoyable enough to justify producing more content.
