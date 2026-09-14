# Filtertool melding van overlijden

Een prototype dat een voorlichter aan de telefoon vraag voor vraag naar één
besluit brengt: **moet ik overleggen, en met wie?** De tool combineert de drie
dingen waar dat besluit van afhangt — de situatie, het moment en de plaats — en
rekent zelf uit of het in het land van overlijden binnen lokale kantoortijden
is.

Twee werkinstructies zitten erin: **WI: Overlijden, stap 4** bepaalt of je
overlegt en hoe snel, **WI: Overleg met post of casemanagement** bepaalt met
wie. Stap 1 t/m 3 (checkvragen, Hermes) doet de voorlichter ervoor; stap 5
staat als laatste actie in elk advies.

> **Nog niet af op één punt.** De openingstijden in `data/posten.js` zijn
> voorbeelden, nog niet de echte postenlijst. "Binnen of buiten kantoortijd" is
> daarmee een aanname. Dat staat ook onder aan het scherm. Gebruik dit dus nog
> niet voor echte meldingen.

## Bekijken

Open `index.html` in een browser. Er is geen build, geen installatie en geen
server nodig; de tool is gewone HTML, CSS en JavaScript. Wil je hem delen, zet
het mapje dan op GitHub Pages (Settings → Pages → branch, map `/`).

`demo-artifact.html` is dezelfde tool in een omslag om als deelbare demopagina
te publiceren. Alleen de omslag verschilt; de tool zelf staat in `assets/` en
`data/` en wordt door beide pagina's gebruikt.

## Wat de tool doet

* **Eén vraag tegelijk.** Drie tot vijf vragen, met de cijfertoetsen te
  beantwoorden. Backspace gaat terug, Escape begint opnieuw bij de volgende
  beller. Een vraag wordt overgeslagen zodra het antwoord de uitkomst niet meer
  kan veranderen.
* **Met wie, niet alleen of.** De tool bepaalt zelf of je bij casemanagement,
  bij de post ter plaatse, bij de waarnemende post of bij de casemanager voor
  Oekraïne moet zijn — en buiten kantoortijd bij de DDA daarvan. Dat hangt af
  van waar de beller is, dus dat wordt apart gevraagd.
* **Caribische delen van het Koninkrijk** komen er als eigen uitkomst uit:
  geen consulaire bijstand, met de vertegenwoordiging of de lokale
  hulpdiensten erbij.
* **De klok en de postenlijst doen het rekenwerk.** De voorlichter hoeft niet
  te weten hoe laat het bij het aanspreekpunt is, of dat daar de werkweek van
  zondag tot donderdag loopt. Tijdzone, afwijkende werkweek, pauzes en lokale feestdagen
  zitten in de data.
* **De zijpaden uit de instructie staan erbij.** "Ik twijfel om de DDA te
  bellen" en "Ik krijg niemand aan de telefoon" verschijnen bij de adviezen
  waar ze horen, met de links uit de werkinstructie.
* **Een expliciet advies.** Wel of niet overleggen, met wie, en wat je in dit
  gesprek doet — geen instructie die nog geïnterpreteerd moet worden.
* **Navolgbaar.** Onder elk advies staat waaróm het eruit komt zoals het eruit
  komt: de antwoorden, de uitgerekende feiten, de regel die eraan ten grondslag
  ligt en de versie van de logica. "Kopieer notitie voor Hermes" zet dat als tekst
  op het klembord, klaar voor de Communication-tab.
* **Eerlijk over gaten.** Past geen enkele regel, of weet de voorlichter iets
  niet dat de instructie wél nodig heeft, dan zegt de tool dat en wijst ze naar
  de twijfelroute — in plaats van een advies te verzinnen.
* **Een ander moment kiezen.** Klik rechtsboven op de klok om te doen alsof het
  zondagnacht is. Zo laat je in een demo zien wat de tijd met het advies doet.

## Hoe het in elkaar zit

```
index.html              het scherm (leeg; de tool bouwt zichzelf op)
demo-artifact.html      dezelfde tool, als deelbare demopagina
assets/app.js           de motor: vragen stellen, regels toepassen, tekenen
assets/styles.css       vormgeving, licht en donker
data/beslislogica.js    de vragen en de regels: wél of niet overleggen
data/aanspreekpunt.js   met wie je overlegt, per soort plek
data/posten.js          kantoortijden en tijdzones per land
docs/beslislogica.md    alles in woorden, om naast de instructies te leggen
```

## De logica aanpassen

Beide databestanden zijn expres zo geschreven dat je er geen programmeur voor
hoeft te zijn.

**Een regel veranderen** in `data/beslislogica.js`: regels worden van boven
naar beneden doorlopen, de eerste die past geeft het advies. Een voorwaarde
leest als "elke sleutel moet kloppen, elke lijst is een keuze":

```js
wanneer: { begraven: ['ja'], kantoortijd: ['nee'], familie: ['ja'] }
```

Naast de antwoorden kun je drie feiten gebruiken die de tool zelf uitrekent:
`aanspreekpunt` (`casemanagement` / `post` / `waarnemend` / `regio` /
`geen-bijstand` / `onbekend`), `kantoortijd` (`ja` / `nee` / `onbekend` /
`nvt`) en `caribisch` (`ja` / `nee`). De laatste regel in de lijst heeft geen
voorwaarde en vangt alles op wat de instructies niet dekken — laat die staan.

Een regel noemt geen namen maar een soort: `metWieSoort: 'aanspreekpunt'`,
`'dda'` of `'auto'` (binnen kantoortijd het aanspreekpunt, daarbuiten de DDA).
Wie dat dan is, komt uit `data/aanspreekpunt.js`.

**Een land toevoegen of bijwerken** in `data/posten.js`: tijdzone als
IANA-naam, openingstijden per dag (`0` = zondag), lokale feestdagen als datum.
Zomertijd gaat vanzelf goed. Een plek met een eigen route (een regio-casemanager
of een Caribisch deel van het Koninkrijk) krijgt geen openingstijden maar een
`soort`.

Verhoog na een wijziging `versie` en `bijgewerkt` bovenin
`data/beslislogica.js`. Die verschijnen onder elk advies, zodat je later kunt
zien op welke versie een advies gebaseerd was.

## Wat er nog niet in zit

* De echte openingstijden van de posten.
* Stap 2 en 3 van de instructie (Hermes) — de tool filtert alleen op de
  situatie.
* Telefoonnummers: de tool wijst naar de landenpagina's, de client en de BOA,
  maar houdt zelf geen nummers bij.
* Een plek om te draaien: dit is een prototype om te laten zien, geen intern
  gehoste app.

`docs/beslislogica.md` beschrijft de logica in woorden, met de keuzes die we
hebben gemaakt waar de instructie geen uitsluitsel geeft.
