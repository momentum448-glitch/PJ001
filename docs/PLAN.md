# PJ001 Development Plan

Version: 0.1  
Status: Draft for review  
Source of truth: this repository

## 1. Problem and outcome
PJ001 is one concrete game project, not a reusable engine or framework.

The first objective is to validate whether the core combat feels fun on a phone before investing in content, art, economy, story, backend, monetization, or release engineering.

Primary success question:

> Is the combat fun enough that the player wants to keep moving, attacking, dodging, looting, and upgrading?

Primary stakeholder: project owner/player-tester.  
Implementation role: AI-led development, with the project owner making product/design decisions.

## 2. Locked product decisions
- Genre: RPG
- Combat: real-time action
- Camera: 2D top-down
- Combat style: Zelda-like
- Player structure: one controllable character
- Core loop: explore -> fight -> loot -> upgrade -> explore further
- Primary target: Android
- Development/testing strategy: web-first, then Android packaging later
- Early play-test method: open a URL in Chrome on Android
- Orientation: landscape
- Controls: virtual joystick on the left; attack/skill controls on the right
- Basic attack: manual tap
- Skills: larger skill pool later, limited equipped active skills; prototype target is 3 active skills
- Progression: level/stat growth + equipment loot
- Death: respawn at checkpoint
- Source of truth: GitHub repository
- Implementation stack: Phaser 3 + TypeScript + Vite

## 3. Prototype scope
Target playtime: approximately 10-20 minutes.

Prototype content target:
- 1 player character
- 1 small playable map
- 3 enemy types
- 1 boss
- 3-5 skills total
- limited equipment/items
- simple level/stat progression
- checkpoint respawn

The prototype is not a content-complete game. Its job is to test combat feel and the minimum progression loop.

## 4. Current state
Milestone 0 technical bootstrap already exists on `main`:
- Phaser + TypeScript + Vite project
- landscape game shell
- placeholder player
- touch joystick movement
- keyboard movement for desktop debugging
- basic ATTACK button feedback
- mobile-first CSS shell
- GitHub Actions build workflow

This bootstrap was created before this formal plan. It is retained as infrastructure, but future gameplay implementation must follow the planning workflow below.

## 5. Working assumptions
These are temporary until explicitly changed or validated.

- Single-player
- Offline-first
- Melee-first player combat
- No multiplayer
- No backend/account system
- No monetization in prototype
- No crafting in prototype
- No elemental interaction system in prototype
- No complex combo tree in prototype
- No stamina system initially
- Equipment slots initially limited to weapon + armor unless testing proves more depth is needed
- Placeholder/procedural/simple assets are acceptable until combat is validated

## 6. Development principles
1. Validate feel before content volume.
2. Build the smallest playable experiment for each uncertain mechanic.
3. Avoid implementing systems that do not affect the current validation question.
4. Keep mobile touch ergonomics as a first-class requirement.
5. Prefer simple, inspectable architecture over premature abstraction.
6. Every milestone must have observable acceptance criteria.
7. Plan/document the next milestone before writing gameplay code for it.
8. Use branches and pull requests for meaningful changes; `main` should remain the reviewed source of truth.

## 7. Milestones

### M0 - Technical bootstrap
Status: Complete

Goal: establish a browser-playable mobile-first project skeleton.

Acceptance criteria:
- project builds
- game renders in landscape
- player placeholder is visible
- touch joystick can drive movement
- attack control responds to touch
- source is on GitHub

### M1 - Combat sandbox
Status: Planned

Goal: determine whether basic movement, attack, dodge, and enemy interaction can feel responsive on a phone.

Planned scope:
- player facing direction
- real melee attack with range/hitbox
- attack timing/cooldown
- 1 simple enemy archetype
- enemy HP
- player HP
- damage handling
- knockback/hit feedback
- dodge
- basic death/respawn loop
- minimal combat HUD

Acceptance criteria:
- player can move, attack, dodge, take damage, kill an enemy, die, and respawn
- controls are usable with two thumbs in landscape
- attacks have clearly readable startup/contact/recovery feedback
- enemy contact and player hits are understandable without text instructions
- no game-breaking input/state bug during a 3-minute continuous fight test

Decision gate after M1:
- If combat does not feel promising, tune/rework controls and timings before adding more systems.
- If combat feels promising, proceed to enemy variety and skills.

### M2 - Combat depth
Status: Planned

Goal: test whether combat remains interesting beyond one repeated attack pattern.

Planned scope:
- 3 enemy archetypes total
- 3 active prototype skills
- skill cooldowns
- clearer telegraphs
- stronger hit feedback
- simple combat encounter composition

Acceptance criteria:
- enemy types demand meaningfully different reactions
- skills create tactical choices rather than acting as cosmetic variants
- touch UI remains readable and comfortable

### M3 - Reward and progression loop
Status: Planned

Goal: validate fight -> loot -> upgrade -> fight motivation.

Planned scope:
- XP/level growth
- basic stats
- weapon + armor equipment
- loot drops
- simple inventory/equipment UI
- checkpoint progression

Acceptance criteria:
- upgrades produce noticeable but controlled power growth
- player can understand why an item is better/worse
- the progression loop does not interrupt combat excessively

### M4 - Prototype map and boss
Status: Planned

Goal: assemble the mechanics into one 10-20 minute prototype session.

Planned scope:
- one small exploration/combat map
- encounter flow
- checkpoint placement
- one boss
- boss telegraphs/patterns
- prototype start/end flow

Acceptance criteria:
- full session can be completed from start to boss
- boss tests movement, attack, dodge, and skill use
- no required mechanic is introduced only during the boss

### M5 - Mobile prototype validation
Status: Planned

Goal: decide whether PJ001 should advance beyond prototype.

Validation areas:
- combat fun
- touch ergonomics
- clarity/readability
- pacing
- progression motivation
- Android/mobile browser performance

Output:
- go / revise / stop decision
- prioritized findings
- updated roadmap only if the prototype passes the gate

## 8. Explicitly out of scope until prototype validation
- story campaign
- large world
- multiplayer
- online services
- accounts/cloud saves
- monetization
- ads/IAP
- extensive crafting
- large item database
- large skill tree
- production-quality art pipeline
- localization
- Play Store release work
- APK packaging beyond what is needed for later validation

## 9. Workflow for every milestone
Before implementation:
1. Define the validation question.
2. Identify only the decisions that can materially change implementation.
3. Record assumptions.
4. Define scope and acceptance criteria.
5. Break work into small implementation tasks.

During implementation:
1. Create a milestone branch.
2. Implement the smallest testable slice first.
3. Keep commits focused.
4. Run build/CI checks.
5. Avoid unrelated refactors.

Before merge:
1. Verify acceptance criteria.
2. Record unresolved issues.
3. Open/review PR.
4. Merge only when the milestone state is coherent.

After testing:
1. Record what was learned.
2. Lock or revise decisions.
3. Update this plan.
4. Only then plan the next milestone.

## 10. Immediate next planning round: M1
No additional gameplay code should be added before the following M1 decisions are reviewed.

Highest-impact decisions:
1. Attack model: fixed directional slash vs aim-to-touch/auto-facing assistance.
2. Dodge behavior: directional dash vs short invulnerability roll; initial recommendation is directional dash with brief invulnerability.
3. Enemy contact model: enemies damage on touch vs explicit enemy attack animation; initial recommendation is explicit attack animation.
4. Hit-stop/hit feedback intensity: subtle vs arcade-heavy; initial recommendation is moderate.
5. Mobile aim assistance: none vs soft auto-facing/target assistance; initial recommendation is soft assistance because phone controls are less precise.

These decisions should be settled with the smallest possible test, not by designing the full combat system in advance.

## 11. Open issues and risks
- The repository is currently Public. This is a project/account setting rather than a gameplay decision.
- A stable public browser-play URL has not yet been configured.
- Actual touch feel on the owner's Android phone has not yet been validated.
- Placeholder controls may need substantial tuning after device testing.
- Performance must eventually be verified on the target phone, not inferred from desktop/browser tests.

## 12. Definition of prototype success
PJ001 prototype succeeds if, after a 10-20 minute mobile session, the combat is responsive, understandable, and enjoyable enough to justify producing more content.

Content quantity, polish, monetization potential, and visual fidelity are secondary until that condition is met.
