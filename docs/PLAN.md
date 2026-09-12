# PJ001 Development Plan

Version: 0.9  
Status: M1 complete — M2 decision gate active  
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
- Skills: larger pool with limited equipped set; prototype target 3 active skills
- Progression: level/stat growth + equipment loot
- Death: checkpoint respawn
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
- M1.5 soft aim assistance, device-tested OK
- M1.6 death/respawn + HUD + clean combat-state reset, device-accepted
- M1 combat sandbox sanity gate accepted by project owner

Accepted M1 tuning baseline:
- player move speed: 195
- enemy knockback speed: 255
- dodge speed: 450
- dodge duration / i-frame window: 150 ms
- dodge cooldown: 650 ms
- soft aim range: 155 px
- soft aim forward cone: 28 degrees
- soft aim correction cap: 14 degrees
- soft aim correction strength: 0.6
- respawn delay: about 1.2 seconds

Stable playtest URL:
`https://momentum448-glitch.github.io/PJ001/`

Current product gate:
**M2 — combat depth decisions before implementation.**

M2 validation question:
> Does adding distinct enemy roles and a small skill loadout create meaningful combat choices without making portrait touch controls cluttered or reducing readability?

## 5. Working assumptions
- Single-player, offline-first, melee-first combat
- No multiplayer/backend/account/monetization during prototype
- No crafting, elemental system, stamina, or complex combo tree initially
- Equipment initially weapon + armor only
- Placeholder visuals are acceptable until combat is validated
- Portrait encounter composition should avoid very wide horizontal sightlines
- Browser viewport resize must remain safe
- M1 tuning is now the baseline; future changes require a specific M2 reason or device feedback
- M2 should add depth through role interaction, not raw content volume

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
Status: Complete, device-accepted

Validated baseline:
- move, attack, dodge, take damage, kill, die, respawn
- touch controls usable in portrait
- readable attack and enemy telegraph timing
- no passive contact damage
- directional dodge with i-frames and cooldown
- soft aim reduces near-misses without lock-on
- strong hit feedback
- clean reset after death/respawn

### M2 — Combat depth
Status: Decision gate

Planned scope after decisions are locked:
- 3 enemy archetypes total
- 3 active prototype skills
- skill cooldowns
- clearer role-specific telegraphs
- small multi-enemy encounter composition

No M2 gameplay implementation should start until the foundational enemy/skill/control decisions below are locked.

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

### M1.2 — First enemy and damage model
Status: Complete, device-tuned

### M1.3 — Enemy telegraph and player damage
Status: Complete, device-tested OK

### M1.4 — Dodge dash
Status: Complete, device-tested and tuned

### M1.5 — Soft aim assistance
Status: Complete, device-tested OK

### M1.6 — Death, respawn, HUD, sandbox pass
Status: Complete, device-accepted

Implemented:
- automatic fixed-checkpoint respawn
- full HP restore
- clean reset of attack, dodge, input, enemy attack/hitbox, and transient combat state
- enemy reset to predictable fresh-fight state
- readable death/respawn HUD

## 11. M2 decision gate
The following must be locked before M2 gameplay code begins:
1. Enemy archetype roles for enemies #2 and #3.
2. Prototype skill identities for the 3 active skills.
3. Skill resource model: cooldown-only vs another resource layer.
4. Skill aiming/input model on portrait touch controls.
5. First multi-enemy encounter composition target.

Assistant can choose initial numeric tuning, cooldown durations, HP values, exact telegraph milliseconds, placeholder visuals, and implementation architecture after those five decisions are locked.

## 12. Open risks
- portrait has less horizontal visibility than landscape
- future skill buttons can crowd ATTACK/DODGE
- multiple enemies can reduce telegraph readability quickly
- soft aim must remain predictable when more than one target exists
- skill aiming can conflict with movement if input design is too complex
- final performance must be verified on target phone
- repository is currently Public

## 13. Definition of prototype success
PJ001 succeeds at prototype stage if, after a 10-20 minute portrait mobile session, combat is responsive, understandable, and enjoyable enough to justify producing more content.
