# Filtertool melding van overlijden

Een prototype dat een voorlichter aan de telefoon vraag voor vraag naar één
besluit brengt: **moet ik overleggen, en met wie?** De tool combineert de drie
dingen waar dat besluit van afhangt — de situatie, het moment en de plaats — en
rekent zelf uit of de post in dat land nu open is.

> **Dit is een prototype met voorbeeldlogica.** De beslisregels en de
> openingstijden in `data/` zijn verzonnen om de vorm te kunnen laten zien. Ze
> zijn geen beleid en mogen niet worden gebruikt voor echte meldingen. Vervang
> beide databestanden door de echte werkinstructie en postenlijst voordat
> iemand hier een besluit op baseert.

## Bekijken

Open `index.html` in een browser. Er is geen build, geen installatie en geen
server nodig; de tool is gewone HTML, CSS en JavaScript. Wil je hem delen, zet
het mapje dan op GitHub Pages (Settings → Pages → branch, map `/`).

## Wat de tool doet

* **Eén vraag tegelijk.** Drie tot vier vragen, met de cijfertoetsen te
  beantwoorden. Backspace gaat terug, Escape begint opnieuw bij de volgende
  beller.
* **De klok en de postenlijst doen het rekenwerk.** De voorlichter hoeft niet
  te weten hoe laat het in Caïro is of dat daar de werkweek van zondag tot
  donderdag loopt. Tijdzone, afwijkende werkweek, pauzes en lokale feestdagen
  zitten in de data.
* **Een expliciet advies.** Wel of niet overleggen, met wie, en wat je in dit
  gesprek doet — geen instructie die nog geïnterpreteerd moet worden.
* **Navolgbaar.** Onder elk advies staat waaróm het eruit komt zoals het eruit
  komt: de antwoorden, de uitgerekende feiten, de regel die eraan ten grondslag
  ligt en de versie van de logica. "Kopieer voor het dossier" zet dat als tekst
  op het klembord.
* **Eerlijk over gaten.** Past geen enkele regel, dan zegt de tool dat en
  adviseert ze overleg — in plaats van een advies te verzinnen.
* **Een ander moment kiezen.** Klik rechtsboven op de klok om te doen alsof het
  zondagnacht is. Zo laat je in een demo zien wat de tijd met het advies doet.

## Hoe het in elkaar zit

```
index.html              het scherm (leeg; de tool bouwt zichzelf op)
assets/app.js           de motor: vragen stellen, regels toepassen, tekenen
assets/styles.css       vormgeving, licht en donker
data/beslislogica.js    de vragen en de regels  ← hier past de instructie in
data/posten.js          openingstijden en tijdzones per post
docs/beslislogica.md    dezelfde logica in woorden, om naast de instructie te leggen
```

## De logica aanpassen

Beide databestanden zijn expres zo geschreven dat je er geen programmeur voor
hoeft te zijn.

**Een regel veranderen** in `data/beslislogica.js`: regels worden van boven
naar beneden doorlopen, de eerste die past geeft het advies. Een voorwaarde
leest als "elke sleutel moet kloppen, elke lijst is een keuze":

```js
wanneer: { situatie: ['nieuw'], urgentie: ['ja', 'onbekend'], postOpen: ['nee'] }
```

Naast de antwoorden kun je twee feiten gebruiken die de tool zelf uitrekent:
`postOpen` (`ja` / `nee` / `onbekend` / `nvt`) en `nlKantoortijd` (`ja` / `nee`).
De laatste regel in de lijst heeft geen voorwaarde en vangt alles op wat de
logica niet dekt — laat die staan.

**Een post toevoegen of bijwerken** in `data/posten.js`: tijdzone als
IANA-naam, openingstijden per dag (`0` = zondag), lokale feestdagen als datum.
Zomertijd gaat vanzelf goed.

Verhoog na een wijziging `versie` en `bijgewerkt` bovenin
`data/beslislogica.js`. Die verschijnen onder elk advies, zodat je later kunt
zien op welke versie een advies gebaseerd was.

## Wat er nog niet in zit

* De echte beslislogica en de echte openingstijden.
* Wat er in het systeem verwerkt moet worden — de tool filtert alleen op de
  situatie.
* Telefoonnummers en doorkiesnummers per post.
* Een plek om te draaien: dit is een prototype om te laten zien, geen intern
  gehoste app.
