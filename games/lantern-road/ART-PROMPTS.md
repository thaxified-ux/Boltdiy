# Lantern Road art pack: prompts for AI image tools

The plan: you make the art with an image tool, upload the PNGs in the Claude chat (or
put them in `games/lantern-road/art/`), and Claude cleans them up and wires them into the game.
Any sprite without new art keeps its current look, so the art can arrive a few at a time.

## 1. Do a pilot first

Make these four before anything else:

1. Hero with sword (`hero-blade.png`)
2. Moss Slime (`moss-slime.png`)
3. Burrow Rat (`burrow-rat.png`)
4. Old Stump, the first guardian (`old-stump.png`)

Claude puts them in the game and sends screenshots. If the style works on the real road at
phone size, make the rest with the same tool, settings and reference image. If not, you have
lost an hour, not a week.

## 2. Which tool

- **Best fit: a pixel-art tool** such as PixelLab or Retro Diffusion. They make true pixel art
  at an exact size with a transparent background, and some can animate a sprite you already made.
- **Works with cleanup:** general image tools (ChatGPT images, Midjourney, Gemini, Leonardo).
  They make large, soft "pixel-style" pictures. Send them anyway: Claude can remove the
  background, crop, shrink to the right size and reduce the colors, but results vary.
- **Consistency:** once the pilot looks right, give that image to the tool as a style
  reference for every later sprite (most tools have an image-reference or "style" input).
- **License:** before selling the game on Google Play, check that your tool's plan allows
  commercial use of what it makes.

## 3. Rules for every sprite

| Thing | Rule |
|---|---|
| Background | Transparent PNG. If the tool can't, use one flat color that is not in the sprite (pure magenta #FF00FF works). |
| View | Side view, the whole body visible, feet touching the bottom edge. |
| Facing | Hero and crew face **right**. Monsters face **left** (toward the hero). |
| Size | Hero and crew: 64×64. Regular monsters: 64×64. Guardians: 128×128. Item icons: 32×32. Bigger is fine; Claude will shrink it. |
| Look | No text, no frame, no ground, no shadow under the feet, one character per image. |
| Hero outfits | The hero's cloak and hood must be **flat neutral gray**. The game recolors gray to the outfit the player owns (outfits are sold in the Shop). |
| Animation (optional, later) | One horizontal strip per action, frames the same size, left to right: idle 2 frames, attack 3 frames, hurt 1 frame, death 3 frames. |

File names: the name in lowercase with dashes, for example `glass-scarab.png`. Animations add
the action: `glass-scarab-attack.png`.

## 4. The style text

Paste this at the start of every prompt, then add the line for the sprite:

> 16-bit SNES-era pixel art game sprite, side view, crisp pixels, clean 1-pixel dark outline,
> limited palette of about 16 colors, soft light from the top left with 2 to 3 shades per color,
> no anti-aliasing, no blur, no gradients, transparent background, single character centered,
> feet on the bottom edge, no text, no ground shadow. Cozy dark-fantasy style, readable at small size.

For a tool that takes a "negative prompt", use:
`blurry, smooth shading, 3d render, photo, text, watermark, frame, border, ground, shadow, multiple characters, cropped`

## 5. Hero and crew (64×64, facing right)

| File | Add to the style text |
|---|---|
| `hero-blade.png` | a young hooded wanderer in a long flat neutral-gray cloak and hood, brown leather boots and belt, holding a short steel sword forward in the right hand and a small glowing amber lantern on a hook in the left hand, facing right |
| `hero-bow.png` | the same hooded wanderer in a flat neutral-gray cloak, drawing a wooden longbow, small amber lantern hanging at the belt, facing right |
| `hero-lamp.png` | the same hooded wanderer in a flat neutral-gray cloak, holding a tall wooden staff topped with a glowing lantern, facing right |
| `crew-archer.png` | a small travelling archer in a moss-green hooded cloak with a short bow, facing right |
| `crew-fire.png` | a small fire mage in a rust-red hooded robe, a flame floating above one hand, facing right |
| `crew-frost.png` | a small frost mage in a steel-blue hooded robe holding a pale ice orb, facing right |
| `crew-hex.png` | a small hexer in a dusky purple hooded robe with a shadowy violet orb, facing right |
| `crew-warden.png` | a small ferry warden in gray armor with a round shield and a lantern pole, facing right |
| `crew-herb.png` | a small herbalist in a leaf-green cloak carrying a basket of glowing herbs, facing right |
| `crew-lamp.png` | a small lamplighter in an ochre coat holding a long pole with a lit lamp, facing right |

After the pilot, generate the other two hero files from `hero-blade.png` as an image
reference so they look like the same person.

## 6. Monsters (64×64, facing left) and guardians (128×128, facing left)

"Floating" means the monster flies; draw it in the middle of the image instead of at the bottom.

**Zone 1 · Mossbarrow Lane** (green mossy forest lane at night)
- `moss-slime.png`: a round green gelatinous slime with moss and tiny sprouts on top and two dark eyes
- `burrow-rat.png`: a big gray-brown rat on all fours, pink ears and long pink tail, beady black eyes
- `thornback-boar.png`: a brown wild boar with pale thorny spines along its back and ivory tusks
- `old-stump.png` (guardian, 128): a giant living tree stump with a carved bark face, glowing amber eyes, root legs and moss on top

**Zone 2 · Saltmarsh Causeway** (misty teal marsh)
- `reed-crab.png`: an orange-red crab with one oversized claw and marsh reeds stuck to its shell
- `bog-lantern.png`: floating will-o'-wisp, a pale mint-green ghostly flame with a hollow face
- `mire-leech.png`: a fat olive-green leech with segmented bands, a round red mouth full of tiny teeth and small yellow eyes
- `brine-matron.png` (guardian, 128): a towering sea hag of teal kelp and barnacles with a coral crown and long dripping arms

**Zone 3 · Cinder Steppe** (red ash plains with embers)
- `ember-wisp.png`: floating orange fire spirit with a bright yellow core and two dark eyes
- `ash-hound.png`: a lean charcoal-gray hound with glowing ember cracks in its fur and orange eyes
- `cinder-tick.png`: a small dark-brown armored tick with a glowing orange egg sac and cracks on its back
- `kiln-golem.png` (guardian, 128): a hulking golem of red brick and clay with a glowing furnace in its belly

**Zone 4 · Glasswind Dunes** (golden sand and glass shards)
- `glass-scarab.png`: a beetle with a translucent pale-cyan glass shell
- `mirage.png`: a shimmering translucent lilac slime ghost, partly see-through
- `dune-stinger.png`: a sand-colored scorpion with big pincers and its tail curled over its back, red stinger tip
- `prism-wyrm.png` (guardian, 128): a serpentine dragon made of pale-blue crystal prisms that split light into rainbows

**Zone 5 · Starfall Ruins** (violet stone ruins under the stars)
- `star-moth.png`: floating large moth with pale-yellow glowing wings dotted with tiny stars
- `lost-sentinel.png`: a hollow suit of ancient lavender-gray armor with a tower shield and a glowing visor slit
- `comet-acolyte.png`: a hooded cultist in deep-violet robes with glowing cyan eyes and a staff topped with a star
- `the-unlit-king.png` (guardian, 128): a tall dark king in violet-black robes and a broken crown, a dark void where the face should be

**Zone 6 · Frostfang Pass** (snowy mountain pass)
- `snow-wolf.png`: a white-gray wolf with icy blue eyes and frost on its fur
- `frost-wraith.png`: floating translucent icy-blue ghost with tattered trailing robes
- `ice-howler.png`: a small white yeti with blue face markings and dark claws, mouth open in a howl
- `glacier-troll.png` (guardian, 128): a huge blue-gray troll with ice chunks on its shoulders carrying a frozen club

**Zone 7 · Sunken Archive** (flooded library, teal water)
- `ink-slime.png`: a black-blue ink slime with torn page scraps floating inside it
- `page-swarm.png`: floating swarm of loose paper pages with tiny eyes
- `candle-ghost.png`: a pale ghost made of melted white wax with a lit candle flame on its head
- `the-drowned-librarian.png` (guardian, 128): a tall drowned scholar in waterlogged robes with seaweed hair, carrying a giant soggy book

**Zone 8 · Thornveil Woods** (purple thorny forest with spores)
- `spore-toad.png`: a squat green toad with yellow eyes and puffy spore pustules on its back
- `thorn-stalker.png`: a lean four-legged predator made of brambles and thorns, red eyes
- `mantis-reaper.png`: a tall green praying mantis with bone-white scythe arms and red eyes
- `briar-mother.png` (guardian, 128): a giant bramble creature with vine arms and a dark-red rose blooming on its chest

**Zone 9 · Ashen Citadel** (dark castle, ash and embers)
- `cinder-knight.png`: a knight in soot-black plate armor with glowing orange seams, sword and shield
- `ash-bat.png`: floating bat with charred black wings glowing orange at the edges
- `ash-priest.png`: a hooded priest in ash-gray and rust robes with glowing orange eyes and a burning censer staff
- `the-warden-of-ash.png` (guardian, 128): a towering warden in charcoal plate armor with molten gold trim and a burning greatsword

**Zone 10 · The Hollow Sky** (floating islands in a starry void)
- `void-eye.png`: floating giant eyeball with a purple void iris and dark tendrils
- `sky-serpent.png`: floating long pale-blue cloud serpent coiling in the air
- `rift-spawn.png`: a jagged violet crystal blob with a glowing pink crack for a mouth and small white eyes
- `the-light-eater.png` (guardian, 128): a colossal shadow beast with a gaping maw full of stars, swallowing light

## 7. Item icons (32×32, no background)

Use the style text, but replace "game sprite, side view … feet on the bottom edge" with
"inventory item icon, centered, slight 3/4 angle". Rarity colors come from the slot border in
the game, so draw the items in natural colors.

| File | Item |
|---|---|
| `icon-blade.png` | a steel short sword with a brass hilt, diagonal |
| `icon-bow.png` | a wooden longbow with a string, diagonal |
| `icon-lamp.png` | a wooden staff topped with a glowing lantern, diagonal |
| `icon-helm.png` | a steel helmet with a nose guard |
| `icon-armor.png` | a chest plate over a leather jerkin |
| `icon-gloves.png` | a pair of leather gauntlets |
| `icon-belt.png` | a leather belt with a brass buckle |
| `icon-boots.png` | a pair of brown leather boots |
| `icon-cloak.png` | a folded deep-red cloak with a clasp |
| `icon-amulet.png` | a gold amulet with a glowing gem |
| `icon-ring.png` | a gold ring with a blue gem |
| `icon-charm.png` | a small carved lantern charm on a cord |

## 8. Later: backgrounds

Backgrounds are wide scrolling layers (sky, far hills, near trees, ground) for each of the
10 zones. They take more planning, so leave them until the characters look right.

## 9. Gemini: 14 sprite sheets instead of 60 images

Gemini makes one picture per message, so ask for a sheet of 3 to 12 sprites at a time. Paste one
block, save the image, start the next. Upload the sheets here; Claude cuts them into the single
files listed in sections 5 to 7. Sheets marked green use a green background because those
sprites are pink or purple. If Gemini merges two characters or adds labels, ask it to redo the
sheet with "more space between them, no text".

### Sheet 1 · Hero
Saves as: hero-blade, hero-bow, hero-lamp

```
Create a game sprite sheet: a single row of 3 separate poses of the SAME hero character (identical face, clothes and proportions), evenly spaced with plenty of empty space between them, each one complete and not touching any other, all on one solid flat pure magenta (#FF00FF) background. No grid lines, no labels, no text, no ground, no shadows, no scenery. Side view, full body, every character faces RIGHT (toward the right edge of the image). 16-bit SNES-era pixel art, crisp pixels, clean 1-pixel dark outline, limited palette, soft light from the top left with 2 to 3 shades per color, no anti-aliasing, no blur, no gradients. Cozy dark-fantasy style, readable at small size. All of them in exactly the same style, scale and lighting. The cloak and hood must stay flat neutral gray in all three.

Left: a young hooded wanderer in a long flat neutral-gray cloak and hood, brown leather boots and belt, holding a short steel sword forward in the right hand and a small glowing amber lantern in the left hand
Middle: the same wanderer drawing a wooden longbow, small amber lantern hanging at the belt
Right: the same wanderer holding a tall wooden staff topped with a glowing lantern
```

### Sheet 2 · Crew A
Saves as: crew-archer, crew-fire, crew-frost, crew-herb

```
Create a game sprite sheet: a 2×2 grid of 4 separate small companion characters, evenly spaced with plenty of empty space between them, each one complete and not touching any other, all on one solid flat pure magenta (#FF00FF) background. No grid lines, no labels, no text, no ground, no shadows, no scenery. Side view, full body, every character faces RIGHT (toward the right edge of the image). 16-bit SNES-era pixel art, crisp pixels, clean 1-pixel dark outline, limited palette, soft light from the top left with 2 to 3 shades per color, no anti-aliasing, no blur, no gradients. Cozy dark-fantasy style, readable at small size. All of them in exactly the same style, scale and lighting.

Top-left: a travelling archer in a moss-green hooded cloak with a short bow
Top-right: a fire mage in a rust-red hooded robe, a flame floating above one hand
Bottom-left: a frost mage in a steel-blue hooded robe holding a pale ice orb
Bottom-right: a herbalist in a leaf-green cloak carrying a basket of glowing herbs
```

### Sheet 3 · Crew B (green)
Saves as: crew-hex, crew-warden, crew-lamp

```
Create a game sprite sheet: a single row of 3 separate small companion characters, evenly spaced with plenty of empty space between them, each one complete and not touching any other, all on one solid flat pure green (#00FF00) background. No grid lines, no labels, no text, no ground, no shadows, no scenery. Side view, full body, every character faces RIGHT (toward the right edge of the image). 16-bit SNES-era pixel art, crisp pixels, clean 1-pixel dark outline, limited palette, soft light from the top left with 2 to 3 shades per color, no anti-aliasing, no blur, no gradients. Cozy dark-fantasy style, readable at small size. All of them in exactly the same style, scale and lighting.

Left: a hexer in a dusky purple hooded robe with a shadowy violet orb
Middle: a ferry warden in gray armor with a round shield and a lantern pole
Right: a lamplighter in an ochre coat holding a long pole with a lit lamp
```

### Sheet 4 · Zone 1: Mossbarrow Lane
Saves as: moss-slime, burrow-rat, thornback-boar, old-stump

```
Create a game sprite sheet: a 2×2 grid of 4 separate monsters, evenly spaced with plenty of empty space between them, each one complete and not touching any other, all on one solid flat pure magenta (#FF00FF) background. No grid lines, no labels, no text, no ground, no shadows, no scenery. Side view, full body, every character faces LEFT (toward the left edge of the image). 16-bit SNES-era pixel art, crisp pixels, clean 1-pixel dark outline, limited palette, soft light from the top left with 2 to 3 shades per color, no anti-aliasing, no blur, no gradients. Cozy dark-fantasy style, readable at small size. All of them in exactly the same style, scale and lighting. The bottom-right one is the guardian boss: draw it about twice as big as the others, filling its whole cell.

Top-left: a round green gelatinous slime with moss and sprouts on top and two dark eyes
Top-right: a big gray-brown rat on all fours, pink ears and long pink tail, beady black eyes
Bottom-left: a brown wild boar with pale thorny spines along its back and ivory tusks
Bottom-right: a giant living tree stump with a carved bark face, glowing amber eyes, root legs and moss on top
```

### Sheet 5 · Zone 2: Saltmarsh Causeway
Saves as: reed-crab, bog-lantern, mire-leech, brine-matron

```
Create a game sprite sheet: a 2×2 grid of 4 separate monsters, evenly spaced with plenty of empty space between them, each one complete and not touching any other, all on one solid flat pure magenta (#FF00FF) background. No grid lines, no labels, no text, no ground, no shadows, no scenery. Side view, full body, every character faces LEFT (toward the left edge of the image). 16-bit SNES-era pixel art, crisp pixels, clean 1-pixel dark outline, limited palette, soft light from the top left with 2 to 3 shades per color, no anti-aliasing, no blur, no gradients. Cozy dark-fantasy style, readable at small size. All of them in exactly the same style, scale and lighting. The bottom-right one is the guardian boss: draw it about twice as big as the others, filling its whole cell.

Top-left: an orange-red crab with one oversized claw and marsh reeds stuck to its shell
Top-right: a floating will-o'-wisp, a pale mint-green ghostly flame with a hollow face, hovering
Bottom-left: a fat olive-green leech with segmented bands, a round red mouth full of teeth and yellow eyes
Bottom-right: a towering sea hag of teal kelp and barnacles with a coral crown and long dripping arms
```

### Sheet 6 · Zone 3: Cinder Steppe
Saves as: ember-wisp, ash-hound, cinder-tick, kiln-golem

```
Create a game sprite sheet: a 2×2 grid of 4 separate monsters, evenly spaced with plenty of empty space between them, each one complete and not touching any other, all on one solid flat pure magenta (#FF00FF) background. No grid lines, no labels, no text, no ground, no shadows, no scenery. Side view, full body, every character faces LEFT (toward the left edge of the image). 16-bit SNES-era pixel art, crisp pixels, clean 1-pixel dark outline, limited palette, soft light from the top left with 2 to 3 shades per color, no anti-aliasing, no blur, no gradients. Cozy dark-fantasy style, readable at small size. All of them in exactly the same style, scale and lighting. The bottom-right one is the guardian boss: draw it about twice as big as the others, filling its whole cell.

Top-left: a floating orange fire spirit with a bright yellow core and two dark eyes, hovering
Top-right: a lean charcoal-gray hound with glowing ember cracks in its fur and orange eyes
Bottom-left: a dark-brown armored tick with a glowing orange egg sac and cracks on its back
Bottom-right: a hulking golem of red brick and clay with a glowing furnace in its belly
```

### Sheet 7 · Zone 4: Glasswind Dunes (green)
Saves as: glass-scarab, mirage, dune-stinger, prism-wyrm

```
Create a game sprite sheet: a 2×2 grid of 4 separate monsters, evenly spaced with plenty of empty space between them, each one complete and not touching any other, all on one solid flat pure green (#00FF00) background. No grid lines, no labels, no text, no ground, no shadows, no scenery. Side view, full body, every character faces LEFT (toward the left edge of the image). 16-bit SNES-era pixel art, crisp pixels, clean 1-pixel dark outline, limited palette, soft light from the top left with 2 to 3 shades per color, no anti-aliasing, no blur, no gradients. Cozy dark-fantasy style, readable at small size. All of them in exactly the same style, scale and lighting. The bottom-right one is the guardian boss: draw it about twice as big as the others, filling its whole cell.

Top-left: a beetle with a translucent pale-cyan glass shell
Top-right: a shimmering translucent lilac slime ghost, partly see-through
Bottom-left: a sand-colored scorpion with big pincers and its tail curled over its back, red stinger tip
Bottom-right: a serpentine dragon made of pale-blue crystal prisms that split light into rainbows
```

### Sheet 8 · Zone 5: Starfall Ruins (green)
Saves as: star-moth, lost-sentinel, comet-acolyte, the-unlit-king

```
Create a game sprite sheet: a 2×2 grid of 4 separate monsters, evenly spaced with plenty of empty space between them, each one complete and not touching any other, all on one solid flat pure green (#00FF00) background. No grid lines, no labels, no text, no ground, no shadows, no scenery. Side view, full body, every character faces LEFT (toward the left edge of the image). 16-bit SNES-era pixel art, crisp pixels, clean 1-pixel dark outline, limited palette, soft light from the top left with 2 to 3 shades per color, no anti-aliasing, no blur, no gradients. Cozy dark-fantasy style, readable at small size. All of them in exactly the same style, scale and lighting. The bottom-right one is the guardian boss: draw it about twice as big as the others, filling its whole cell.

Top-left: a large moth with pale-yellow glowing wings dotted with stars, hovering
Top-right: a hollow suit of ancient lavender-gray armor with a tower shield and a glowing visor slit
Bottom-left: a hooded cultist in deep-violet robes with glowing cyan eyes and a staff topped with a star
Bottom-right: a tall dark king in violet-black robes and a broken crown, a dark void where the face should be
```

### Sheet 9 · Zone 6: Frostfang Pass
Saves as: snow-wolf, frost-wraith, ice-howler, glacier-troll

```
Create a game sprite sheet: a 2×2 grid of 4 separate monsters, evenly spaced with plenty of empty space between them, each one complete and not touching any other, all on one solid flat pure magenta (#FF00FF) background. No grid lines, no labels, no text, no ground, no shadows, no scenery. Side view, full body, every character faces LEFT (toward the left edge of the image). 16-bit SNES-era pixel art, crisp pixels, clean 1-pixel dark outline, limited palette, soft light from the top left with 2 to 3 shades per color, no anti-aliasing, no blur, no gradients. Cozy dark-fantasy style, readable at small size. All of them in exactly the same style, scale and lighting. The bottom-right one is the guardian boss: draw it about twice as big as the others, filling its whole cell.

Top-left: a white-gray wolf with icy blue eyes and frost on its fur
Top-right: a translucent icy-blue ghost with tattered trailing robes, hovering
Bottom-left: a white yeti with blue face markings and dark claws, mouth open in a howl
Bottom-right: a huge blue-gray troll with ice chunks on its shoulders carrying a frozen club
```

### Sheet 10 · Zone 7: Sunken Archive
Saves as: ink-slime, page-swarm, candle-ghost, the-drowned-librarian

```
Create a game sprite sheet: a 2×2 grid of 4 separate monsters, evenly spaced with plenty of empty space between them, each one complete and not touching any other, all on one solid flat pure magenta (#FF00FF) background. No grid lines, no labels, no text, no ground, no shadows, no scenery. Side view, full body, every character faces LEFT (toward the left edge of the image). 16-bit SNES-era pixel art, crisp pixels, clean 1-pixel dark outline, limited palette, soft light from the top left with 2 to 3 shades per color, no anti-aliasing, no blur, no gradients. Cozy dark-fantasy style, readable at small size. All of them in exactly the same style, scale and lighting. The bottom-right one is the guardian boss: draw it about twice as big as the others, filling its whole cell.

Top-left: a black-blue ink slime with torn page scraps floating inside it
Top-right: a swarm of loose flying paper pages with eyes, hovering
Bottom-left: a pale ghost made of melted white wax with a lit candle flame on its head
Bottom-right: a tall drowned scholar in waterlogged robes with seaweed hair, carrying a giant soggy book
```

### Sheet 11 · Zone 8: Thornveil Woods
Saves as: spore-toad, thorn-stalker, mantis-reaper, briar-mother

```
Create a game sprite sheet: a 2×2 grid of 4 separate monsters, evenly spaced with plenty of empty space between them, each one complete and not touching any other, all on one solid flat pure magenta (#FF00FF) background. No grid lines, no labels, no text, no ground, no shadows, no scenery. Side view, full body, every character faces LEFT (toward the left edge of the image). 16-bit SNES-era pixel art, crisp pixels, clean 1-pixel dark outline, limited palette, soft light from the top left with 2 to 3 shades per color, no anti-aliasing, no blur, no gradients. Cozy dark-fantasy style, readable at small size. All of them in exactly the same style, scale and lighting. The bottom-right one is the guardian boss: draw it about twice as big as the others, filling its whole cell.

Top-left: a squat green toad with yellow eyes and puffy spore pustules on its back
Top-right: a lean four-legged predator made of brambles and thorns, red eyes
Bottom-left: a tall green praying mantis with bone-white scythe arms and red eyes
Bottom-right: a giant bramble creature with vine arms and a dark-red rose blooming on its chest
```

### Sheet 12 · Zone 9: Ashen Citadel
Saves as: cinder-knight, ash-bat, ash-priest, the-warden-of-ash

```
Create a game sprite sheet: a 2×2 grid of 4 separate monsters, evenly spaced with plenty of empty space between them, each one complete and not touching any other, all on one solid flat pure magenta (#FF00FF) background. No grid lines, no labels, no text, no ground, no shadows, no scenery. Side view, full body, every character faces LEFT (toward the left edge of the image). 16-bit SNES-era pixel art, crisp pixels, clean 1-pixel dark outline, limited palette, soft light from the top left with 2 to 3 shades per color, no anti-aliasing, no blur, no gradients. Cozy dark-fantasy style, readable at small size. All of them in exactly the same style, scale and lighting. The bottom-right one is the guardian boss: draw it about twice as big as the others, filling its whole cell.

Top-left: a knight in soot-black plate armor with glowing orange seams, sword and shield
Top-right: a bat with charred black wings glowing orange at the edges, flying
Bottom-left: a hooded priest in ash-gray and rust robes with glowing orange eyes and a burning censer staff
Bottom-right: a towering warden in charcoal plate armor with molten gold trim and a burning greatsword
```

### Sheet 13 · Zone 10: The Hollow Sky (green)
Saves as: void-eye, sky-serpent, rift-spawn, the-light-eater

```
Create a game sprite sheet: a 2×2 grid of 4 separate monsters, evenly spaced with plenty of empty space between them, each one complete and not touching any other, all on one solid flat pure green (#00FF00) background. No grid lines, no labels, no text, no ground, no shadows, no scenery. Side view, full body, every character faces LEFT (toward the left edge of the image). 16-bit SNES-era pixel art, crisp pixels, clean 1-pixel dark outline, limited palette, soft light from the top left with 2 to 3 shades per color, no anti-aliasing, no blur, no gradients. Cozy dark-fantasy style, readable at small size. All of them in exactly the same style, scale and lighting. The bottom-right one is the guardian boss: draw it about twice as big as the others, filling its whole cell.

Top-left: a giant floating eyeball with a purple void iris and dark tendrils, hovering
Top-right: a long pale-blue cloud serpent coiling in the air, flying
Bottom-left: a jagged violet crystal blob with a glowing pink crack for a mouth and white eyes
Bottom-right: a colossal shadow beast with a gaping maw full of stars, swallowing light
```

### Sheet 14 · Item icons
Saves as: icon-blade, icon-bow, icon-lamp, icon-helm, icon-armor, icon-gloves, icon-belt, icon-boots, icon-cloak, icon-amulet, icon-ring, icon-charm

```
Create a game sprite sheet: a 4×3 grid of 12 (4 across, 3 down) separate inventory item icons, evenly spaced with plenty of empty space between them, each one complete and not touching any other, all on one solid flat pure magenta (#FF00FF) background. No grid lines, no labels, no text, no ground, no shadows, no scenery. Each icon centered in its cell at a slight 3/4 angle, all the same size. 16-bit SNES-era pixel art, crisp pixels, clean 1-pixel dark outline, limited palette, soft light from the top left with 2 to 3 shades per color, no anti-aliasing, no blur, no gradients. Cozy dark-fantasy style, readable at small size. All of them in exactly the same style, scale and lighting.

1. a steel short sword with a brass hilt, diagonal
2. a wooden longbow with a string, diagonal
3. a wooden staff topped with a glowing lantern, diagonal
4. a steel helmet with a nose guard
5. a chest plate over a leather jerkin
6. a pair of leather gauntlets
7. a leather belt with a brass buckle
8. a pair of brown leather boots
9. a folded deep-red cloak with a clasp
10. a gold amulet with a glowing gem
11. a gold ring with a blue gem
12. a small carved lantern charm on a cord
```
