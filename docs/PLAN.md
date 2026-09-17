# PJ001 Development Plan

Version: 2.0  
Status: Cultivation ARPG pivot locked — implementation next  
Source of truth: this repository

## 1. Product goal
PJ001 is a mobile-first portrait 2D/2.5D cultivation action RPG for the browser. It takes structural inspiration from cultivation sandbox/action RPGs while using original worldbuilding, characters, UI language, names, art, and content.

Target MVP session: **15–30 minutes**.

Core loop:
**explore open map -> encounter enemies/events -> fight -> collect spirit energy/materials -> interact/upgrade -> breakthrough -> push into dangerous zone -> boss**.

The MVP must answer one question:
> Does a portrait mobile browser game combining responsive action combat with a compact cultivation/progression loop feel satisfying enough to justify expanding the world and systems?

## 2. Locked product decisions
- Platform: mobile browser first
- Orientation: portrait, 9:16 reference composition
- Runtime: responsive to actual mobile viewport
- Genre: real-time top-down cultivation ARPG
- World structure: one continuous open-map-lite region, not node-based and not room/dungeon instanced
- Map shape: one small but dense region with settlement -> wilderness -> forest -> danger zone -> boss area
- Controls: joystick lower-left; combat controls lower-right
- Basic attack: automatic targeting/attacking of the nearest valid enemy when in combat range
- Active combat: player movement + 3 active skills + dodge
- Aim support: soft aim/target assistance appropriate for portrait touch play
- Progression emphasis: combat + cultivation, approximately balanced with combat slightly dominant
- Cultivation scope: 2 realms in MVP with 1–2 meaningful breakthroughs
- Breakthrough model: spirit energy/XP + required materials -> breakthrough trial -> new realm/reward
- World life: small settlement/hub area embedded in the map, 2–3 NPCs, merchant/elder functions, and several short random events
- Player choice: male or female at game start
- Art direction: readable 2D/2.5D xianxia presentation with stylized ink-wash influence
- IP: original characters, environment, UI, terminology, writing, and assets; inspiration is structural, not copied content
- Save: local/offline-first for MVP
- Backend/login/monetization: out of scope for MVP
- Repository visibility: public
- Stack: Phaser 3 + TypeScript + Vite
- GitHub is the source of truth

## 3. Existing reusable foundation
The repository already contains a playable combat prototype. Preserve and reuse what still fits the new direction instead of rebuilding from zero.

Accepted/reusable pieces:
- portrait mobile shell
- virtual joystick
- dodge with i-frames
- soft aim infrastructure
- melee enemy
- ranged enemy
- charger enemy
- hit/telegraph feedback foundations
- Cleave skill implementation
- GitHub Pages deployment workflow
- current responsive browser bootstrap

Current main baseline before pivot:
`08d0a97758f047112a4dade603be62331fc3b5e5`

Existing public playtest URL:
`https://momentum448-glitch.github.io/PJ001/`

Important control change from the old prototype:
- old baseline used manual basic attack
- cultivation MVP uses auto basic attack/nearest-target behavior so the right thumb can focus on dodge and active skills

## 4. MVP content budget
Keep the first vertical slice deliberately small.

### Player
- 2 selectable visual identities: male / female
- shared collision, stats, combat logic, timing, and animation schema wherever possible
- 3 active skills + dodge
- auto basic attack

### Enemies
- 3 normal archetypes total
- 1 boss
- reuse existing melee/ranged/charger roles when suitable, reskinned/re-tuned for cultivation fantasy

### World
- 1 continuous region
- settlement/hub zone
- wilderness transition
- forest/combat zone
- dangerous inner zone
- boss arena integrated into the same map
- 2–3 NPCs
- 1 merchant or equivalent resource sink
- 3–5 short random events

### Cultivation
- 2 realms
- 1–2 breakthrough moments
- spirit energy/XP
- small material set
- breakthrough requirement UI
- short breakthrough trial
- clear power increase after breakthrough

### Art
- player male/female base sprites
- shared animation template where possible
- 3 enemy families
- 1 boss
- terrain/environment kit for the single region
- settlement props
- portrait HUD
- skill/item/cultivation icons
- restrained ink-wash overlays, VFX, and UI motifs

## 5. Game pillars
1. **Cultivation fantasy must be visible in play, not only in menus.** Exploration, resources, combat rewards, breakthrough, and VFX should reinforce the fantasy.
2. **Portrait touch combat must remain readable.** Fewer thumb demands are better than more buttons.
3. **Every 3–5 minutes should produce a meaningful change.** New resource, event, skill decision, equipment/stat gain, route choice, or breakthrough progress.
4. **The map should feel like a place, not a sequence of menus.** Settlement, danger gradient, NPCs, events, enemies, and boss all live in one traversable region.
5. **Prototype before content multiplication.** Validate the loop before adding sects, relationships, crafting trees, large inventories, or procedural world generation.

## 6. Implementation milestones

### C0 — Pivot foundation
Status: Next

Goal: adapt the existing combat prototype to the locked cultivation-MVP direction without losing stable combat work.

Scope:
- preserve current movement/dodge/enemy foundations
- replace manual basic attack with auto basic attack + nearest-target selection
- keep soft aim for active skills
- introduce clean player-combat state boundaries for auto attack, skills, dodge, death
- establish portrait HUD zones for 3 skills + dodge without clutter
- add data-driven player identity selection stub for male/female sharing one gameplay profile

Acceptance:
- player can move freely while auto basic attack engages only valid nearby targets
- auto attack never steals movement control
- dodge and active skills override/cancel attack state safely
- no duplicate hit from one attack cycle
- controls remain comfortable in portrait

### C1 — Cultivation progression skeleton
Status: Planned

Scope:
- spirit energy/XP resource
- basic material inventory
- realm state
- breakthrough requirements
- breakthrough trial
- stat/power reward after successful breakthrough

Acceptance:
- player can complete one full gather -> qualify -> breakthrough -> stronger loop
- progress is readable without opening a complex menu tree

### C2 — Continuous MVP map
Status: Planned

Scope:
- settlement -> wilderness -> forest -> danger zone -> boss path
- camera/world bounds tuned for portrait
- 2–3 NPC interactions
- merchant/elder function
- encounter spawning by region
- 3–5 short events

Acceptance:
- player can traverse the full region without scene transitions between core zones
- danger and reward escalate spatially
- settlement provides a recognizable safe anchor

### C3 — Character + art integration
Status: Planned

Scope:
- male/female player visuals
- xianxia enemy reskin pass
- environment art kit
- initial ink-influenced VFX/UI treatment
- icon pass

Acceptance:
- game no longer reads as a generic placeholder action prototype
- male/female options share gameplay behavior and comparable readability

### C4 — Boss + full 15–30 minute loop
Status: Planned

Scope:
- one boss with readable multi-phase or escalating pattern
- final progression tuning
- route pacing
- breakthrough placement
- reward/boss gate

Acceptance:
- a fresh run reaches a coherent ending in roughly 15–30 minutes
- player experiences exploration, combat, reward, NPC interaction, cultivation, breakthrough, and boss

### C5 — Mobile validation
Status: Planned

Validate on target phones:
- touch ergonomics
- portrait readability
- frame pacing
- enemy/projectile/VFX budget
- progression motivation
- clarity of breakthrough requirements
- session pacing

## 7. Out of scope until MVP proves itself
- large procedural world
- sect/faction simulation
- deep relationship system
- large dialogue trees
- online accounts/cloud saves
- multiplayer
- monetization
- dozens of realms
- complex alchemy/crafting trees
- large equipment rarity ecosystem
- multiple maps/biomes beyond what the MVP loop requires

## 8. Main risks to test, not debate
1. Auto attack may reduce agency too much; validate whether movement + skills + dodge still feels active.
2. Five right-side combat controls can overcrowd portrait UI; test button size and spacing on a real phone.
3. A continuous world may increase render/collision cost; profile on target Android hardware.
4. Male/female art choice can double production cost; enforce shared timing, hitboxes, skeleton schema, and reusable effects.
5. Cultivation progression can feel like generic leveling if breakthrough presentation and power jump are weak.
6. Ink-wash styling can hurt combat readability if used as a full-screen aesthetic rather than targeted accents.

## 9. Definition of MVP success
PJ001 succeeds at MVP stage if a first-time player can complete a 15–30 minute portrait-mobile session and clearly understand and enjoy this chain:

**move/explore -> detect danger -> fight -> earn cultivation resources -> make a small progression choice -> satisfy breakthrough conditions -> survive breakthrough -> feel substantially stronger -> enter the dangerous inner zone -> defeat the boss**.

Only after this loop is device-validated should the project expand into deeper sandbox systems.
