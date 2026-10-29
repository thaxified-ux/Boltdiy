# Jaylinn Village

Stadsbouwspel voor kinderen. Jij bent de burgemeester: je werkt in mini-games, verdient munten, bouwt je stad en verwelkomt nieuwe gezinnen. Het spel heeft geen einde en slaat automatisch op.

## Spelen

Open `index.html` in een browser. Er is geen build-stap en er zijn geen afhankelijkheden; alleen de lettertypen komen van Google Fonts.

Voor een lokale server:

```sh
cd jaylinn-village
python3 -m http.server 8000
# open http://localhost:8000
```

## Wat zit erin

- **Poppetje en huis:** je maakt je eigen poppetje (geslacht, huidskleur, 8 haarstijlen, kleuren, bril, baard, jurk), kiest een huis en kunt later de kleuren van je huis aanpassen. Je woont alleen, als burgemeester.
- **3D-weergave:** de stad is een echte 3D-wereld (three.js) met schaduwen, een zon die over de dag beweegt, 's nachts verlichte ramen en lantaarns, en gebouwen en bewoners van lage-poly blokjes. Je kunt de camera draaien (knoppen ⟲ ⟳, twee vingers draaien, of rechtermuisknop slepen), zoomen en schuiven. Werkt WebGL niet, dan valt het spel terug op de schuine 2D-weergave. Voeg `#2d` aan de link toe om die te forceren.
- **Stadsbouw:** een kaart van 28 × 28 vakjes waarvan je 20 × 20 bezit. Teken wegen (over water wordt het een brug), plaats woningen, werkgebouwen en versiering, verplaats, draai, verkoop en maak ongedaan. Koop in 4 stappen extra grond.
- **Gezinnen:** elke woning (rijtjeshuis, vrijstaand huis, appartement, villa) brengt een nieuw gezin met dezelfde achternaam: één of twee ouders (ook twee vaders of twee moeders), kinderen en soms een huisdier. Er is ook een verjaardag en een cadeautje voor blije gezinnen.
- **Banen:** volwassenen werken in jouw gebouwen, peuters en baby's gaan naar de kinderopvang en schoolkinderen naar school. Je ziet ze over de wegen lopen.
- **14 gebouwen met een eigen mini-game:** supermarkt, bakkerij, kapper, café, dierenopvang, restaurant, kinderopvang, bloemenwinkel, ziekenhuis, school, dierenarts, ijssalon, brandweer en busstation. Alle mini-games duren 1 tot 2 minuten, geven 1 tot 3 sterren en worden moeilijker naarmate je vaker werkt.
- **Doorgroeien:** munten, diamanten, XP en levels (nieuwe gebouwen per level), upgrades van gebouwen tot niveau 5 (meer munten en werkplekken), dagelijkse opbrengst van gebouwen met personeel, takenlijst en tips van Jaylinn.
- **Versiering:** bomen, bloemperken, bankjes, lantaarns, fontein, speeltuin, park, standbeeld en strand.
- **Huisdier:** adopteer er een bij de dierenopvang.
- **Wereld:** dag en nacht (12 minuten per dag), vier seizoenen (lente, zomer, herfst met vallende bladeren en winter met sneeuw) met een seizoensfeest.
- **Opslaan:** automatisch na elke actie. In de browser (`localStorage`) en, als Claude-artifact, ook in de privé-opslag van de speler.

## Bestanden

| Bestand | Inhoud |
| --- | --- |
| `js/data.js` | Catalogus van gebouwen, levels, namen, producten en recepten |
| `js/avatar.js` | Poppetjes tekenen |
| `js/city.js` | Spelregels: bouwen, gezinnen, banen, wegen zoeken, bewoners, taken, ongedaan maken |
| `js/render3d.js` | De stad in 3D tekenen (three.js): gebouwen, bewoners, licht, seizoenen, camera |
| `js/render.js` | De stad tekenen in schuin 2D-bovenaanzicht (terugvaloptie) |
| `vendor/three.min.js` | three.js r128 (MIT-licentie, zie `vendor/three.LICENSE`) |
| `js/minigames.js` | Mini-games: supermarkt, restaurant, kinderopvang, en het scherm eromheen |
| `js/minigames2.js` | Mini-games: bakkerij, ijssalon, café, bloemen, kapper, dierenopvang, school, ziekenhuis, dierenarts, brandweer, bus |
| `js/ui.js` | Schermen, kaartjes, bouwmodus en invoer |
| `js/storage.js` | Opslaan en laden |
| `js/main.js` | Opstarten en de spellus |

Het ontwerpdocument staat in Claude Docs: https://claude.ai/artifact/WfuRtBrqLfnVrbqft7rEiF
