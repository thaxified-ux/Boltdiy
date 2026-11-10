# Lantern Road

An original idle road-battler in one HTML file. Open `index.html` in a browser.

A lantern-bearing wanderer auto-fights along a strip
through ten night zones of five stages each: Mossbarrow Lane, Saltmarsh Causeway,
Cinder Steppe, Glasswind Dunes, Starfall Ruins, Frostfang Pass, Sunken Archive,
Thornveil Woods, Ashen Citadel and The Hollow Sky (endless after Stage 50). Each stage has 15 waves of up to 4 foes, and the 15th wave is a guardian. Elite foes (gold glow and crown) have 2.5× HP and drop better loot.

- **Paths:** Blade (melee, tougher), Bow (ranged; arrows hit before foes arrive) and Lamp (radiant bolts that splash 40%). You can switch any time. A weapon only gives full damage on its own path.
- **Elements:** Physical, Fire, Frost, Shadow and Radiant. Foes resist or are weak to elements, and they hit with their zone's element. Weapons can carry an element, and gear rolls resistances.
- **Loot:** 10 gear slots and 8 rarities (Worn to Starborn). Each item shows a gearscore, a stat-by-stat comparison and an overall power change. "Equip best" and bulk sell are available, and bulk sell never sells an upgrade.
- **Special attacks:** every foe has one, and the Brine Matron, Kiln Golem and Unlit King have two. Examples: poison, burn, root (you can't attack), blind (half your attacks miss), shells, dodging, reflected damage, frenzy, shield walls and summoned minions. The Map lists them all.
- **Feats:** 26 goals. Each one you claim gives permanent renown (+2% damage and gold) plus gold.
- **Offline progress:** a "While you were away" report (up to 12 h) that includes found gear and new followers.
- **Strip mode:** hides the menus so the road can sit in a pinned tab or a side window.
- **Every stage looks different:** each zone cycles through a clear night, mist, its own weather (rain, blizzard, ashfall, spore drift, sandstorm or starfall), dusk, and a blood moon with lightning on the guardian stage. Foes grow fiercer deeper into a zone, gaining a darker coat and a Feral, Elder or Dread title.
- **Textures:** dithered pixel-band skies with drifting clouds, a skyline per zone (hills, snowy peaks, dunes, spires, bookshelves, thorns, castle walls, floating islands), textured ground with tufts, pebbles and soil layers, and dark grass in the foreground.
- **16-bit look:** the world renders at double resolution. Every sprite is drawn in the code as a grid of colour letters, then smoothed with Scale2x, shaded with a light ramp, and given a selective outline (dark versions of the colours it borders). There are five parallax layers, smooth sky gradients with a horizon glow, a moon halo, glowing fireflies, contact shadows and a walking bob. Sprites have two-frame animation. That covers the hero with all three path weapons, 7 follower kinds, 10 foes, 5 guardians and the scenery for each zone. `sprite-sheet.png` shows all of it, and `screenshots-zones.png` and `screenshots-zones-6-10.png` show every zone in three of its stage looks. Run `window.lanternRoadArt(4)` in the browser console to regenerate the sheet at any scale.
- **Six tabs:** Hero (one gold Upgrades list, hero picker, stats), Gear (equipment and bag), Company, Map, Quests (daily quests and feats) and Shop, plus a small Menu tab for the journal, settings and save codes. Attribute points, Waystones and Forge were removed; old saves get their bonuses back as free upgrade levels.
- **Company:** lost travellers follow your light, most often after a guardian. There are 7 kinds: Archer, Firecaller, Frostweaver, Hexer, Ferry Warden, Herbalist and Lamplighter. You can train them and keep up to 12 at camp. One walks with you for free; each extra walking slot is bought in the Shop (three slots, plus one from the Supporter Pack).
- **Upgrades:** Damage, Health, Attack speed, Critical hits, Gold find and Guardian slayer, paid with gold; each level costs 15% more.
- **Guardian gate:** the guardian of a stage you have not beaten is a 30 second fight you must be there for. It starts by itself only if you touched the game in the last minute; otherwise the road farms the earlier waves until you press "Fight the guardian". Losing keeps the stage. A Lantern Ember gives 20 more seconds.
- **Rekindle (prestige):** from Stage 10 on you can start again at Stage 1 for Lantern Flames, each worth +3% damage, health and gold for good (Stage 10 gives 3, Stage 13 gives 13, Stage 20 gives 53). Level, gold and upgrades reset; gear, heroes, followers, feats and purchases stay. An idle player is not made to wait at guardians of stages beaten in an earlier run.
- **Idle mode (Menu tab)** equips better gear and claims rewards. Buying upgrades and fighting new guardians stay with the player.
- **Reasons to buy, shown fairly:** offers appear only at the moment of need (bag overflowing, three falls on one stage), at most one per visit (shown after the away report, never on top of it), each kind at most once a day and once a week after three "Not now" in a row, and always with a "Not now". Reasons that happen while the game is closed, such as items sold from a full bag, count toward the next visit. The away report shows what the Road Pass would have added. Any lantern or hero can be tried for 5 minutes. A one-time Starter Bundle (stash + company slot + blue lantern) costs €2.99 instead of €4.97. A free daily chest gives gold and shards; the Road Pass doubles it and adds starglass.
- **Second chances and time:** when a guardian beats you, a Rise again button lets you spend a Lantern Ember to continue the fight without losing the stage (one free Ember a day from the daily chest; packs of 5 and 20 in the Shop). Hourglasses collect 2 hours of rewards instantly. Offline rewards last 6 hours for free, 12 with the Road Pass and 24 with the Supporter Pack, and the away report says when the lantern burned out. The Company tab shows how much power waits unused at camp.
- **Stash:** pages of 30 safe slots (€0.99 / $0.99 each, up to 3). Items in the stash are never sold by the sell buttons or by automatic play, and can be equipped straight from it.
- **Shop:** company slots (one follower is free, each extra walking follower is a €1.99 slot), a supporter pack (+10 bag slots, +1 company slot, 24 h offline rewards, gold lantern), a 30-day Road Pass (+25% gold and XP), a 7-day Ember Charm (+50% gold), lantern colors that light the whole road, heroes (the Swordswoman is free; the Glacierbreaker, the Elven Scout, which unlocks the Bow, and the Plague Doctor, which unlocks the Lantern Staff, are €1.99 each) and company outfits. Nothing is random and nothing blocks free players. Purchases go through `window.LanternBilling`, which the Android app provides; see `ANDROID.md`. Without it, buttons say "Coming soon". Journal → Settings has a developer test mode that fakes the store.
- **Guidance and feedback:** one-time tips point at the tab to open next (Gear, Company, Map, Quests). Pop-up notices announce new foes, zones and completed feats. Foes burst into pixels when they fall, level-ups sparkle, and big hits shake the screen.
- **Bestiary:** each foe shows as "???" on the Map until you defeat one; the Map counts how many of the 30 you have met.
- **Graphics settings:** damage numbers, weather and bursts, screen shake, a 30 FPS battery saver and larger text, all in Journal → Settings.
- **Save codes:** Journal → Settings → Save code turns the whole game into one line of text (about 4 KB, gzipped) to copy to another device or share, and loads such a code back.
- **Game-style menus:** every panel sits in a pixel wood-and-brass frame (gold for offers and the away report) on a plank texture, with a pixel icon tab bar, chunky pixel buttons, recessed slots and segmented bars. Frames, planks and icons are drawn by the game at start. `screenshot-menus.png` shows the phone layout.
- **Phone layout:** one screen. A tall battle scene on top and one wood console below it with the HUD, an icon bar and the menu, which scrolls inside the console. The Hero screen shows the 10 gear slots around a large hero with the bag underneath; items open as floating popups. `screenshot-phone.png` shows it.
- **Day and night:** the first three stages of each zone are daylight (sun, big clouds, brighter scenery), then dusk, then the blood-moon guardian stage.
- **Stage complete:** clearing all 15 waves shows a "Stage N complete" notice; the first clear of each stage pays a gold bonus.
- **Tips:** the "Show me" button on a tip opens the menu it points to.
- **Saving:** progress saves to `localStorage` in this browser only. Saves from the first version upgrade automatically.

## Sound

- **Sound effects** are short recorded samples (29 of them, about 210 KB) embedded in `index.html`: a different hit sound per weapon (sword slash, hammer thud, bow twang and arrow thunk, fire cast and burn), swings, getting hurt, monster deaths, guardian roars, loot, coins, skills and parries. Each sound has several takes and is pitched slightly at random so it does not get repetitive. Level-up and stage-clear jingles are synthesized.
- **Music** is streamed from `audio/`: one track per zone and a boss theme on guardian waves, with a crossfade between them. It gets quieter while the hero is down and pauses when the tab is hidden. If a music file is missing, a synthesized tune plays instead, so `index.html` still works on its own.
- Sound effects and music each have an on/off switch in Log -> Settings. Audio starts on the first tap, as browsers require.

All audio is CC0 (public domain), from OpenGameArt:
- Music: JRPG Music Packs 1-3 (Exploration, Towns, Evil) and Epic Boss Battle by Juhani Junkala (SubspaceAudio).
- Sound effects: 80 CC0 RPG SFX (rubberduck), RPG Sound Pack (artisticdude), 50 RPG sound effects (Kenney), Battle Sound Effects, 3 Melee sounds (remaxim) and Metal Impact Sounds (BMacZero).

## Heroes and skills

Every hero stands the same height and follows one setup taken from the pack's skill art: the first card is the
**basic attack**, the second is the hero's **one skill** (a button on the road with its animation and icon), and the
rest are **passives**. Passives show as small badges next to the skill button; a badge lights up while the passive is
working, and tapping it shows exactly what it gives. The Hero tab lists the basic attack, the skill and the passives
with their stats, and the stat list shows what the passives add. With AUTO on, the skill casts by itself only when a
foe is in reach. All hero animations use only the east-facing frames.

| Hero | Basic attack | Skill | Passives |
|---|---|---|---|
| Swordswoman (free, Sword) | Downward Sword Slash | Rising Sword Slash: every 8 s, 300% to the foe in front, knocked down for 1 s | Spell Chant (below 50% HP: heals 25% and +40% damage for 6 s, every 20 s), Quick Blade (+8% crit) |
| Glacierbreaker (€1.99, Sword) | Glacial Hammerfall (ice effects removed) | Frozen Cyclone: every 10 s, 220% frost to every foe, 40% slower attacks for 3 s | Permafrost (foes next to him attack 20% slower), Rime Bastion (+15% block) |
| Elven Scout (€1.99, unlocks Bow) | Piercing Arrow | Wind Dash: every 20 s, no damage for 1.5 s (by itself below 40% HP) | Leaf Vortex (every 6th arrow: 120% to every foe plus poison), Keen Sight (+10% crit) |
| Plague Doctor (€1.99, unlocks Lantern Staff) | Lantern Flame | Miasma: every 11 s, 300% poison to every foe over 4 s | Remedies (1% of max HP regenerated per second) |

The Plague Doctor's pack has no Art folder, so his skill and passive have no pack icons.

## Credits

- Glacierbreaker Knight, Young Swordswoman, Elven Bow Scout and Plague Doctor art by **elie automata**, used under their
  license: commercial use allowed with credit, shipped only inside the game. The original packs are not in this repository
  and must not be shared on their own. The game shows this credit in the Hero tab, the Shop and the Journal.
- Thornveil Woods monsters (Blightbloat, Thorncap, Bloodstalker, Lanterncap and the Ironcap guardian) come from the Fungal Horde pack, used under its license (commercial use allowed, not redistributed on its own; only the west-facing frames the game uses are embedded).
- The monsters of the other zones (1-7, 9, 10) were generated with Replit in a 16-bit style and converted to game sprites with tools/convert_mon.py; they move with the game's code animation.
- The crew, backgrounds and icons are drawn in code.
