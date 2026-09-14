# Filtertool melding van overlijden

Een prototype dat een voorlichter aan de telefoon vraag voor vraag naar één
besluit brengt: **moet ik overleggen, en met wie?** De tool combineert de drie
dingen waar dat besluit van afhangt — de situatie, het moment en de plaats — en
rekent zelf uit of het in het land van overlijden binnen lokale kantoortijden
is.

De beslislogica volgt **WI: Overlijden, stap 4 — Bepaal de vervolgstap:
overleggen of later terugbellen**. Stap 1 t/m 3 (checkvragen, Hermes) doet de
voorlichter ervoor; stap 5 staat als laatste actie in elk advies.

> **Nog niet af, op twee punten.**
> 1. De openingstijden in `data/posten.js` zijn voorbeelden, nog niet de echte
>    postenlijst. "Binnen of buiten lokale kantoortijden" is daarmee een
>    aanname. Dat staat ook onder aan het scherm.
> 2. Wie je precies belt — de post of casemanagement — staat in de instructie
>    op een aparte pagina die hier nog niet in zit. De tool linkt ernaar in
>    plaats van het zelf te bepalen.
>
> Gebruik dit dus nog niet voor echte meldingen.

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
* **De beller en het overlijden worden apart gevraagd.** Zit de beller ergens
  anders, dan zet de tool die klok er apart bij — want de Nederlandse klok, de
  klok van de beller en die van de post kunnen alle drie verschillen.
* **De klok en de postenlijst doen het rekenwerk.** De voorlichter hoeft niet
  te weten hoe laat het in Caïro is of dat daar de werkweek van zondag tot
  donderdag loopt. Tijdzone, afwijkende werkweek, pauzes en lokale feestdagen
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
wanneer: { begraven: ['ja'], lokaleKantoortijd: ['nee'], familie: ['ja'] }
```

Naast de antwoorden kun je één feit gebruiken dat de tool zelf uitrekent:
`lokaleKantoortijd` (`ja` / `nee` / `onbekend`). De laatste regel in de lijst
heeft geen voorwaarde en vangt alles op wat de instructie niet dekt — laat die
staan.

**Een post toevoegen of bijwerken** in `data/posten.js`: tijdzone als
IANA-naam, openingstijden per dag (`0` = zondag), lokale feestdagen als datum.
Zomertijd gaat vanzelf goed.

Verhoog na een wijziging `versie` en `bijgewerkt` bovenin
`data/beslislogica.js`. Die verschijnen onder elk advies, zodat je later kunt
zien op welke versie een advies gebaseerd was.

## Wat er nog niet in zit

* De echte openingstijden van de posten.
* Wie je precies belt: de post of casemanagement.
* Welke klok telt als de beller in een ander land zit dan het overlijden — de
  tool rekent met het land van overlijden en laat de rest zien.
* Stap 2 en 3 van de instructie (Hermes) — de tool filtert alleen op de
  situatie.
* Telefoonnummers en doorkiesnummers per post.
* Een plek om te draaien: dit is een prototype om te laten zien, geen intern
  gehoste app.

`docs/beslislogica.md` beschrijft de logica in woorden, met de keuzes die we
hebben gemaakt waar de instructie geen uitsluitsel geeft.
