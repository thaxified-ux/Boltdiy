# Custom 3D models

Every building in Jaylinn Village is built from code, but you can replace any of them with your own
model (for example one you generated with an AI 3D tool or made in Blender).

## How to add a model

1. Export the model as **glTF binary (`.glb`)** (or `.gltf`). Keep it low poly (roughly 300 to 3000 triangles) and use one to three materials.
2. Put the file in this folder, for example `models/bakkerij.glb`.
3. Register it in `js/data.js`:

```js
JV.MODELS = {
  bakkerij: 'models/bakkerij.glb',
  house_small: { url: 'models/house_small.glb', rotY: 0, scale: 1 },
};
```

The keys are the building ids: `house_small`, `house_big`, `apartment`, `villa`, `super`, `bakkerij`, `kapper`, `cafe`,
`dierenopvang`, `restaurant`, `opvang`, `bloemen`, `ziekenhuis`, `school`, `dierenarts`, `ijssalon`, `brandweer`, `bus`,
and the decorations `fountain`, `speeltuin`, `park`, `strand`, `standbeeld`, `bench`, `lantern`, `tree`, `bush`, `rock`, `flowers`.

## What the game does with a model

- The model is **scaled to fit the footprint** of the building (1 tile = 1 unit; a bakkerij is 2 × 2 tiles, a supermarkt 3 × 3, a ziekenhuis 4 × 4) and sits on the ground, centred.
- The **front (door) should face +x** in the model. When the player flips the building the game rotates it by 90 degrees. Use `rotY` (radians) to correct a model that faces another way.
- Meshes cast and receive shadows. Colours and textures from the file are kept.
- Work buildings still get their name sign floating above the roof.
- Windows in a model do not light up at night (the built-in buildings do). Give glass an emissive material if you want that.

`_voorbeeld.gltf` is a tiny example. Try it with `JV.MODELS = { house_small: 'models/_voorbeeld.gltf' }`.

You can also try a model without editing code: open the browser console and run `JV.setModel('bakkerij', 'models/bakkerij.glb')`.
