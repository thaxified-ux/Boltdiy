# Lantern Road on Android: app wrapper and Google Play Billing

The game is one HTML file. To sell items on Android, it runs inside an app that
reaches Google Play Billing and passes purchases to the game through a small
bridge object, `window.LanternBilling`. The game already handles everything
else: the Shop tab, prices, granting items, the looks, Restore purchases, and
messages for cancelled purchases.

Status: the game side is built and tested in a browser with a fake bridge. The
Android steps below are a starting point. They have not been built or run here,
because this environment has no Android SDK.

## 1. The bridge contract

The game looks for this object when it starts and each time the Shop opens:

```js
window.LanternBilling = {
  available: true,
  prices: { supporter_pack: '€4.99', ... },   // localized price strings from Google Play
  purchase(productId) { /* -> Promise<{ ok: boolean, error?: string }> */ },
  restore()           { /* -> Promise<string[]> of one-time product ids the player owns */ },
};
```

- `ok: true` means Google Play reports the purchase as paid. The game then grants the item and saves.
- `ok: false` with an `error` shows "Purchase not completed: …" in the Journal. Nothing is granted.
- Without the bridge, buy buttons say "Coming soon". Journal → Settings → Developer has a
  test mode that fakes a store. Keep it off in release builds; you can also remove that
  checkbox from `renderJournal` before shipping.

## 2. Products to create in Google Play Console

| Product id | Type in Play Console | Price | What the game gives |
|---|---|---|---|
| `embers_5` | One-time, **consumable** | €0.99 | 5 Lantern Embers: rise again on the spot when a guardian wins |
| `embers_20` | One-time, **consumable** | €2.99 | 20 Lantern Embers |
| `hourglass_3` | One-time, **consumable** | €1.99 | 3 Hourglasses: each collects 2 hours of rewards instantly |
| `starter_bundle` | One-time, non-consumable | €2.99 | Unlocks `stash_page_1`, `company_slot_1` and `lantern_blue` together. Only offered while the player owns none of the three. |
| `supporter_pack` | One-time, non-consumable | €4.99 | +10 bag slots, +1 company slot, 24 h offline rewards, Supporter Gold lantern |
| `road_pass` | One-time, **consumable** | €3.99 | 30 days of +25% gold and XP (buying again adds 30 days) |
| `ember_charm` | One-time, **consumable** | €1.49 | 7 days of +50% gold (buying again adds 7 days) |
| `lantern_blue`, `lantern_green`, `lantern_red`, `lantern_violet` | One-time, non-consumable | €1.99 each | Lantern colors |
| `company_banners` | One-time, non-consumable | €2.99 | Follower outfits |
| `char_glacier`, `char_scout`, `char_plague` | One-time, non-consumable | €1.99 each | Playable heroes with their own animations. The Swordswoman is free and not a product. `char_glacier`: a second Sword hero. `char_scout` unlocks the Bow path and `char_plague` the Lantern Staff path. Players can try each one for 5 minutes first. |
| `company_slot_1`, `company_slot_2`, `company_slot_3` | One-time, non-consumable | €1.99 each | One more follower walking with you per slot. The game sells them in order. |
| `stash_page_1`, `stash_page_2`, `stash_page_3` | One-time, non-consumable | €0.99 / $0.99 each | Stash pages of 30 slots each; page 1 unlocks the stash. Sold in order. |

`road_pass` is sold as a 30-day consumable, not a Play subscription, so it never renews
by itself. To turn it into an auto-renewing subscription later, the game would need to
check the subscription state on start instead of storing an end date.

Prices: set a base price (for example US$0.99) in Play Console and let Google fill in local
prices, or set them per country (for example €0.99 for euro countries). The game always shows
the price string Google Play sends, so players see their own currency.

## 3. Wrap the game with Capacitor

```bash
mkdir lantern-road-android && cd lantern-road-android
npm init -y
npm install @capacitor/core @capacitor/cli @capacitor/android cordova-plugin-purchase
npx cap init "Lantern Road" com.example.lanternroad --web-dir www
mkdir www && cp ../games/lantern-road/index.html www/index.html
npx cap add android
npx cap sync
npx cap open android   # opens Android Studio
```

Replace `com.example.lanternroad` with your own application id. It cannot change after
you publish.

The page loads its fonts from Google Fonts. That works online. For an app that also
works offline, download the two fonts (Pixelify Sans and Atkinson Hyperlegible, both
under the SIL Open Font License) into `www/fonts/` and point the `<link>` at a local
stylesheet.

## 4. The bridge, using cordova-plugin-purchase

Add this as `www/billing.js` and load it before the game's script in `index.html`
(`<script src="billing.js"></script>`). It uses the plugin's v13 API.

```js
document.addEventListener('deviceready', async () => {
  const { store, ProductType, Platform } = CdvPurchase;
  const once = ['starter_bundle', 'supporter_pack', 'lantern_blue', 'lantern_green', 'lantern_red', 'lantern_violet',
    'company_banners',
    'char_glacier', 'char_scout', 'char_plague',
    'company_slot_1', 'company_slot_2', 'company_slot_3',
    'stash_page_1', 'stash_page_2', 'stash_page_3'];
  const repeat = ['road_pass', 'ember_charm', 'embers_5', 'embers_20', 'hourglass_3'];
  store.register([
    ...once.map(id => ({ id, type: ProductType.NON_CONSUMABLE, platform: Platform.GOOGLE_PLAY })),
    ...repeat.map(id => ({ id, type: ProductType.CONSUMABLE, platform: Platform.GOOGLE_PLAY })),
  ]);
  // Verify every purchase on your own server before granting it (see section 5).
  store.validator = 'https://YOUR-SERVER.example/verify-purchase';
  const pending = {};
  store.when()
    .approved(t => t.verify())
    .verified(receipt => receipt.finish())
    .finished(t => t.products.forEach(p => { if (pending[p.id]) { pending[p.id]({ ok: true }); delete pending[p.id]; } }));
  await store.initialize([Platform.GOOGLE_PLAY]);

  window.LanternBilling = {
    available: true,
    get prices() { return Object.fromEntries(store.products.map(p => [p.id, p.pricing && p.pricing.price])); },
    purchase(id) {
      return new Promise(resolve => {
        const offer = store.get(id, Platform.GOOGLE_PLAY)?.getOffer();
        if (!offer) return resolve({ ok: false, error: 'this item is not available right now' });
        pending[id] = resolve;
        offer.order().then(err => { if (err) { delete pending[id]; resolve({ ok: false, error: err.message || 'cancelled' }); } });
      });
    },
    async restore() {
      await store.restorePurchases();
      return store.products.filter(p => p.owned && once.includes(p.id)).map(p => p.id);
    },
  };
});
```

If the bridge appears after the game has started, the Shop picks it up the next time
it is opened.

## 5. Before release

- **Verify purchases on a server.** The app sends each purchase token to your server,
  which checks it with the Google Play Developer API and acknowledges it. Without this,
  a modified app can fake purchases. A service such as RevenueCat can do this for you.
- **Saves live on the phone.** Progress and purchase flags are stored in the app's
  local storage. If the app is reinstalled, Restore purchases brings back one-time
  items. Active Road Pass and Ember Charm time is lost; account-based cloud saves would fix that.
- **Store listing:** a privacy policy URL, the Data safety form, the content rating
  questionnaire, and target audience. No ads and no random paid items keeps all of these simpler.
- **Fees:** Google takes 15% on your first US$1M in earnings each year when you enroll in the
  reduced service fee program.
- **Test:** add license testers in Play Console and use an internal testing track to
  buy every product with test cards before going live.

## 6. Later: the game as a live wallpaper

Running the game behind the home screen, like the original idea, needs a native
Android `WallpaperService` that draws the road. That is a separate, larger piece of
work. Launching first as a normal app with the Shop is the faster way to start earning.
