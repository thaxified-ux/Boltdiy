# Jaylinn Village

Speelbaar prototype van een stadsbouwspel voor kinderen. Jij bent de burgemeester: je werkt in mini-games, verdient munten, bouwt je stad en verwelkomt nieuwe gezinnen. Het spel heeft geen einde en slaat automatisch op.

## Spelen

Open `index.html` in een browser. Er is geen build-stap en er zijn geen afhankelijkheden; alleen de lettertypen komen van Google Fonts.

Voor een lokale server:

```sh
cd jaylinn-village
python3 -m http.server 8000
# open http://localhost:8000
```

## Wat zit erin (eerste versie)

- Poppetje maken (geslacht, huidskleur, 8 haarstijlen, kleuren, bril, baard, jurk) en een huis kiezen
- Stad op een rooster van 20 × 20: wegen tekenen (over water wordt het een brug), woningen, werkgebouwen en versiering plaatsen, verplaatsen, draaien, verkopen en ongedaan maken
- Nieuwe gezinnen bij elke woning, met dezelfde achternaam, verschillende gezinsvormen, kinderen en huisdieren
- Volwassenen kiezen een baan in een werkgebouw; peuters en baby's gaan naar de kinderopvang
- Bewoners lopen over de wegen naar hun werk en terug, en maken wandelingetjes
- Dag-en-nachtcyclus van 12 minuten, met lantaarns en verlichte ramen
- Drie mini-games: supermarkt (boodschappenlijstje), restaurant (koken en op tijd serveren) en kinderopvang (voor de kinderen zorgen)
- Munten, diamanten, XP en levels die nieuwe gebouwen vrijspelen
- Gebouwen met personeel verdienen elke dag munten; blije gezinnen geven cadeautjes
- Takenlijst, bewonersboek en tips van Jaylinn
- Automatisch opslaan in de browser (`localStorage`); als Claude-artifact ook in de privé-opslag van de speler

## Bestanden

| Bestand | Inhoud |
| --- | --- |
| `js/data.js` | Catalogus van gebouwen, levels, namen, producten en recepten |
| `js/avatar.js` | Poppetjes tekenen |
| `js/city.js` | Spelregels: bouwen, gezinnen, banen, wegen zoeken, bewoners, taken, ongedaan maken |
| `js/render.js` | De stad tekenen in schuin bovenaanzicht |
| `js/minigames.js` | De drie mini-games |
| `js/ui.js` | Schermen, kaartjes, bouwmodus en invoer |
| `js/storage.js` | Opslaan en laden |
| `js/main.js` | Opstarten en de spellus |

Het ontwerpdocument staat in Claude Docs: https://claude.ai/artifact/WfuRtBrqLfnVrbqft7rEiF
