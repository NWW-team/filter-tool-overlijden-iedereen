# Filtertool melding van overlijden

Een prototype dat een voorlichter aan de telefoon vraag voor vraag naar één
besluit brengt: **moet ik overleggen, en met wie?** Eén vraag per scherm, een
paar keuzes, en aan het eind een advies. Meer niet.

Twee werkinstructies zitten erin: **WI: Overlijden, stap 4** bepaalt of je
overlegt en hoe snel, **WI: Overleg met post of casemanagement** bepaalt met
wie. Stap 1 t/m 3 (checkvragen, Hermes) doet de voorlichter ervoor; stap 5
staat als laatste actie in elk advies.

## Bekijken

Open `index.html` in een browser. Er is geen build, geen installatie en geen
server nodig; de tool is gewone HTML, CSS en JavaScript. Wil je hem delen, zet
het mapje dan op GitHub Pages (Settings → Pages → branch, map `/`).

`demo-artifact.html` is dezelfde tool in een omslag om als deelbare demopagina
te publiceren. Alleen de omslag verschilt; de tool zelf staat in `assets/` en
`data/` en wordt door beide pagina's gebruikt.

## Wat de tool doet

* **Eén vraag per scherm.** Drie tot zes vragen met keuzerondjes, en daaronder
  "Volgende". Een vraag wordt overgeslagen zodra het antwoord de uitkomst niet
  meer kan veranderen; de balk bovenaan laat zien hoe ver je bent.
* **Met wie, niet alleen of.** Uit "waar is de beller?" volgt met wie je
  overlegt: casemanagement of de post ter plaatse, en buiten kantoortijd de DDA
  daarvan.
* **Caribische delen van het Koninkrijk** komen er als eigen uitkomst uit: geen
  consulaire bijstand, verwijs door.
* **Een expliciet advies.** Wel of niet overleggen, met wie, en wat je in dit
  gesprek doet — geen instructie die nog geïnterpreteerd moet worden.
* **Eerlijk over gaten.** Past geen enkele regel, of weet de voorlichter iets
  niet dat de instructie wél nodig heeft, dan zegt de tool dat en wijst ze naar
  de twijfelroute — in plaats van een advies te verzinnen.

## Hoe het in elkaar zit

```
index.html              het scherm (leeg; de tool bouwt zichzelf op)
demo-artifact.html      dezelfde tool, als deelbare demopagina
assets/app.js           de motor: vragen stellen, regels toepassen, tekenen
assets/styles.css       vormgeving
data/beslislogica.js    de vragen, de aanspreekpunten en de regels
docs/beslislogica.md    alles in woorden, om naast de instructies te leggen
datastromen.html        achtergrondpagina over een eerdere, uitgebreidere versie
```

## De logica aanpassen

`data/beslislogica.js` is expres zo geschreven dat je er geen programmeur voor
hoeft te zijn. Alle vragen, antwoorden en regels staan erin; `assets/app.js`
bevat geen beleid.

**Een vraag veranderen**: elke stap in `stappen` heeft een `id`, een `vraag` en
een lijst `opties` met een `waarde` en een `label`. Een stap met een `als` wordt
alleen gesteld als die voorwaarde klopt.

**Een regel veranderen**: regels worden van boven naar beneden doorlopen, de
eerste die past geeft het advies. Een voorwaarde leest als "elke sleutel moet
kloppen, elke lijst is een keuze":

```js
wanneer: { begraven: ['ja'], kantoortijd: ['nee'], familie: ['ja'] }
```

In een voorwaarde gebruik je de `id` van een stap met een van de `waarde`s die
daarbij horen. Daarnaast is er één feit dat de tool zelf afleidt: `caribisch`
(`ja` / `nee`), waar als de beller óf het overlijden in het Caribisch deel van
het Koninkrijk is. De laatste regel in de lijst heeft geen voorwaarde en vangt
alles op wat de instructies niet dekken — laat die staan.

Een regel noemt geen namen maar een soort: `metWieSoort: 'aanspreekpunt'`,
`'dda'` of `'auto'` (binnen kantoortijd het aanspreekpunt, daarbuiten de DDA).
Wie dat dan is, staat in `aanspreekpunten`, per antwoord op "waar is de beller?".
Staat er een vaste `metWie` in een advies, dan wint die.

Verhoog na een wijziging `versie` en `bijgewerkt` onderin
`data/beslislogica.js`, zodat je later kunt zien op welke versie een advies
gebaseerd was.

## Wat er nog niet in zit

* **De tool kijkt niet meer zelf op de klok.** Of het bij het aanspreekpunt
  kantoortijd is, vraagt de tool gewoon aan de voorlichter. Een eerdere versie
  rekende dat uit met een postenlijst vol tijdzones en openingstijden; die data
  waren verzonnen voorbeelden, en het scherm werd er vol van.
* Stap 2 en 3 van de instructie (Hermes) — de tool filtert alleen op de
  situatie.
* Telefoonnummers: de tool houdt geen nummers bij.
* De zijpaden "Ik twijfel om de DDA te bellen" en "Ik krijg niemand aan de
  telefoon" staan wel in `data/beslislogica.js` als verantwoording bij de regel,
  maar het scherm toont ze niet.
* Een plek om te draaien: dit is een prototype om te laten zien, geen intern
  gehoste app.

`docs/beslislogica.md` beschrijft de logica in woorden, met de keuzes die we
hebben gemaakt waar de instructie geen uitsluitsel geeft.
