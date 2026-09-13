# PJ001 Development Plan

Version: 1.2  
Status: M2 combat depth in implementation — M2.3 active  
Source of truth: this repository

## 1. Product goal
PJ001 is one concrete mobile-first 2D top-down action RPG prototype. The first objective is to validate whether combat is responsive, readable, and enjoyable enough on a phone to justify producing more content.

Core loop: explore -> fight -> loot -> upgrade -> explore further.

## 2. Locked product decisions
- Genre: RPG
- Combat: real-time action, Zelda-like
- Camera: 2D top-down
- Player: one controllable character
- Target: Android, web-first playtest
- Orientation: portrait
- Runtime: responsive to actual mobile browser viewport
- Controls: joystick lower-left; attack/dodge/skills lower-right
- Basic attack: manual tap from facing
- Dodge: directional dash with short i-frame window
- Enemy body contact alone does not damage player
- Hit feedback: arcade-heavy
- Aim assist: soft correction only, no hard lock
- Death: checkpoint respawn
- Stack: Phaser 3 + TypeScript + Vite
- GitHub and this PLAN are the dynamic source of truth

## 3. Prototype scope
Target session: 10–20 minutes.

Prototype target: 1 player, 1 small map, 3 enemy types, 1 boss, 3–5 skills, limited equipment/items, simple progression, checkpoint respawn.

## 4. Accepted M1 baseline
M1 combat sandbox is complete and device-accepted.

Accepted tuning baseline:
- player move speed: 195
- enemy knockback speed: 255
- dodge speed: 450
- dodge duration / i-frame: 150 ms
- dodge cooldown: 650 ms
- soft aim range: 155 px
- soft aim forward cone: 28 degrees
- soft aim correction cap: 14 degrees
- soft aim correction strength: 0.6
- respawn delay: ~1.2 s

Stable playtest URL:
`https://momentum448-glitch.github.io/PJ001/`

## 5. Locked M2 decisions
1. Enemy archetypes: existing melee + **Ranged shooter + Charger**.
2. Three active skills: **Cleave + Projectile + Guard/Parry**.
3. Skill resource model: **cooldown-only**.
4. Skill aiming/input: **tap -> cast from facing with soft aim**.
5. First mixed encounter: **1 melee + 1 ranged**.

Assistant may choose initial HP, damage, speeds, cooldowns, telegraph timings, placeholder visuals, and implementation architecture, then tune from device feedback.

## 6. Current state
Completed:
- M0 bootstrap and GitHub Pages deployment
- M0.7 responsive portrait shell
- M1.1–M1.6 combat sandbox
- M2.1 ranged enemy + first mixed encounter, device-accepted
- M2.2 charger enemy, device-accepted after charger movement hotfix

Current implementation target:
**M2.3 — Cleave skill.**

M2 validation question:
> Do distinct enemy roles plus a small skill loadout create meaningful combat choices without making portrait touch controls cluttered or reducing readability?

M2.3 validation question:
> Does one wide frontal cooldown skill create a useful multi-target choice without making basic attack feel obsolete or cluttering portrait controls?

## 7. Development principles
1. Validate feel before content volume.
2. Build the smallest playable experiment for each uncertain mechanic.
3. Avoid systems that do not affect the current validation question.
4. Treat mobile touch ergonomics as first-class.
5. Prefer simple, inspectable architecture over premature abstraction.
6. Every milestone needs observable acceptance criteria.
7. Update this plan before meaningful gameplay implementation.
8. Use branches and pull requests; `main` remains reviewed source of truth.
9. Before important work, re-read PLAN and inspect current GitHub state.
10. Keep the public playtest URL usable after meaningful merges.

## 8. Milestones
### M0 — Technical bootstrap
Status: Complete

### M1 — Combat sandbox
Status: Complete, device-accepted

### M2 — Combat depth
Status: In progress

Scope:
- melee, ranged, charger archetypes
- Cleave, Projectile, Guard/Parry
- cooldown-only skills
- facing + soft-aim skill casting
- role-specific telegraphs
- portrait multi-enemy encounter composition

### M3 — Reward and progression loop
Status: Planned

XP/levels, basic stats, weapon + armor, loot, simple inventory/equipment UI, checkpoint progression.

### M4 — Prototype map and boss
Status: Planned

One portrait-oriented map, encounter flow, checkpoint, one boss, 10–20 minute prototype session.

### M5 — Mobile prototype validation
Status: Planned

Go / revise / stop decision based on combat fun, ergonomics, readability, pacing, progression motivation, and phone performance.

## 9. M2 implementation breakdown
### M2.1 — Ranged enemy and first mixed encounter
Status: Complete, device-accepted

### M2.2 — Charger enemy
Status: Complete, device-accepted after hotfix

Accepted behavior:
- ~650 ms wind-up
- committed non-homing charge
- charge-only damage; passive contact remains safe
- dodge i-frames avoid charge damage
- basic attack damages/kills charger
- respawn resets charger state cleanly

### M2.3 — Cleave skill
Status: In implementation

Scope:
- add one dedicated CLEAVE touch button without redesigning the full future 3-skill layout
- cooldown-only; no mana/energy
- tap casts from current facing with the same soft-aim correction used by basic attack
- wide frontal hit area can damage multiple living enemies in one cast
- skill is state-gated against attack/dodge/death and cannot overlap itself
- clear startup/impact/recovery feedback
- respawn clears transient Cleave state and restores the skill to a safe usable state

Initial tunable values:
- cooldown: ~2.8 s
- startup: ~120 ms
- recovery: ~260 ms
- range: ~130 px
- frontal arc: ~110 degrees
- damage: 1 per enemy per cast

Done when:
- Cleave can hit two or more enemies when they are grouped in front of the player
- targets behind the player or clearly outside the frontal arc are not hit
- one enemy cannot be damaged twice by a single Cleave cast
- skill cannot be activated during dodge, death, or another attack/skill state
- cooldown is readable on the button
- basic attack still has a faster single-target role
- control placement remains usable in portrait

### M2.4 — Projectile skill
Status: Planned

Player ranged skill with cooldown-only cast, facing + soft aim, readable projectile and hit feedback.

### M2.5 — Guard/Parry skill
Status: Planned

Short defensive timing tool; reward timing will be tested without adding mana/energy.

### M2.6 — Three-skill control layout and encounter pass
Status: Planned

Fit ATTACK + DODGE + 3 active skills in portrait and validate mixed melee/ranged/charger encounter readability and stability.

## 10. Working assumptions and risks
- Single-player, offline-first, melee-first
- Placeholder visuals remain acceptable until combat is validated
- Portrait encounter composition should avoid very wide sightlines
- Browser resize must remain safe
- M1 tuning remains baseline unless M2 feedback gives a specific reason to change it
- Multiple simultaneous telegraphs can become visually noisy
- Future skill buttons can crowd ATTACK/DODGE
- Cleave must not become a strictly better basic attack; cooldown and width should create a situational multi-target role
- final performance must be verified on target phone
- repository is currently Public

## 11. Definition of prototype success
PJ001 succeeds at prototype stage if, after a 10–20 minute portrait mobile session, combat is responsive, understandable, and enjoyable enough to justify producing more content.
