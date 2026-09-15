# Beslislogica in woorden

Dit document beschrijft dezelfde logica als `data/beslislogica.js`, maar dan
leesbaar voor wie de werkinstructies beheert. Leg het ernaast: staat er iets in
deze lijst dat niet in de instructie staat, of andersom, dan klopt de tool niet
meer.

Twee instructies komen samen:

* **WI: Overlijden, stap 4** — bepaalt *of* je overlegt, en of dat nu moet of
  tijdens kantoortijd kan.
* **WI: Overleg met post of casemanagement** — bepaalt *met wie*.

Stap 1 t/m 3 van WI: Overlijden (checkvragen, Hermes) doet de voorlichter
ervoor; stap 5 (de afronding noteren) staat als laatste actie in elk advies.

## Wat de tool vraagt

Eén vraag per scherm, "Volgende" eronder. Drie tot zes vragen.

| Vraag | Wanneer | Antwoorden |
| --- | --- | --- |
| Van wie komt de melding? | altijd | van een nabestaande of andere melder · van de lokale autoriteiten |
| Is de persoon al begraven of gecremeerd? | niet bij een melding van de lokale autoriteiten | nee · ja |
| Waar is de beller op dit moment? | altijd | in Nederland · in het buitenland · in het Caribisch deel van het Koninkrijk |
| In welk land is de beller? | alleen bij "in het buitenland" | een keuzelijst met alle landen, zonder Nederland en zonder de Caribische delen van het Koninkrijk |
| Waar is de persoon overleden? | altijd | in het buitenland · in het Caribisch deel van het Koninkrijk |
| Zijn de directe nabestaanden al op de hoogte? | alleen bij: al begraven/gecremeerd én buiten kantoortijden | ja · nee |

**Geen enkele vraag heeft een "weet ik niet".** Dat is een bewuste keuze: het is
steeds iets dat de voorlichter aan de beller kan vragen. De tool dwingt dus een
antwoord af, ook als dat betekent dat er eerst doorgevraagd moet worden.

**"In Nederland" ontbreekt bij de overlijdensvraag.** Alleen een overlijden
buiten Nederland is voor Buitenlandse Zaken relevant. Bij de bellervraag staat
die keuze er wél: de beller kan hier gewoon zijn.

Een vraag wordt overgeslagen zodra het antwoord de uitkomst niet meer kan
veranderen.

## Wat de tool zelf uitrekent

De tool vraagt niet of het kantoortijd is; ze leidt dat af uit de klok:

| Waar de beller is | Welke klok telt |
| --- | --- |
| Nederland | Europe/Amsterdam (casemanagement) |
| Het gekozen land | de tijdzone van dat land, uit de IANA-database |
| Caribisch deel van het Koninkrijk | geen — hier geldt "niet van toepassing" |

De aanname: **elke post is elke dag van 9 tot 17 uur lokale tijd open**, ook in
het weekend. Op het landenscherm ziet de voorlichter meteen hoe laat het daar is
en of de post open is.

## Met wie je overlegt

Uit WI: Overleg met post of casemanagement. Het hangt af van waar de beller is.

| Waar de beller is | Aanspreekpunt | Buiten kantoortijd |
| --- | --- | --- |
| Nederland | Casemanagement (CM) | De DDA van casemanagement |
| Buitenland | De Nederlandse post ter plaatse | De post-DDA, via de BOA |
| Caribische delen van het Koninkrijk | Geen consulaire bijstand — verwijs door | — |

Eén regel wijkt hiervan af: bij een melding van de **lokale autoriteiten** is het
altijd de post, waar de beller ook is. Dat staat in de regel zelf als
`metWiePlek`.

De tool maakt geen onderscheid tussen een land mét en een land zónder
Nederlandse post, en kent geen regio-casemanagers. Welke post waarneemt, zoekt
de voorlichter op de landenpagina's op.

## Wat de tool adviseert

De regels worden van boven naar beneden doorlopen. De eerste die past, wint.

| # | Situatie | Advies | Uit de instructie |
| --- | --- | --- | --- |
| 1 | Beller of overlijden in de Caribische delen van het Koninkrijk | Geen consulaire bijstand, verwijs door | WI: Overleg — Caribische Koninkrijksdelen |
| 2 | Melding van de lokale autoriteiten | Altijd overleggen met de post; is die dicht, dan met de post-DDA | Stap 4 — Melding van lokale autoriteiten |
| 3 | Nog niet begraven/gecremeerd, post open | Overleg met het aanspreekpunt | Stap 4 — Recent overleden |
| 4 | Nog niet begraven/gecremeerd, post dicht | Overleg met de DDA | Stap 4 — Recent overleden |
| 5 | Al begraven/gecremeerd, post open | Overleg met het aanspreekpunt | Stap 4 — Al begraven/gecremeerd |
| 6 | Al begraven/gecremeerd, post dicht, familie nog niet op de hoogte | Overleg met de DDA | Stap 4 — Al begraven/gecremeerd |
| 7 | Al begraven/gecremeerd, post dicht, familie al op de hoogte | Geen overleg: laat de volgende werkdag terugbellen of mailen | Stap 4 — Al begraven/gecremeerd |
| 8 | *alles wat hierboven niet past* | Overleggen, met de mededeling dat de tool dit niet dekt | Vangnet, niet uit de instructie |

Regel 8 is met de huidige vragen niet te bereiken: elke combinatie van
antwoorden valt onder een van de regels erboven. Hij blijft staan als vangnet
voor het moment dat er een vraag of antwoord bij komt.

De zijpaden uit de instructie — "Ik twijfel om de DDA te bellen" (eerst de
vraagbaak, anders directe collega's) en "Ik krijg niemand aan de telefoon" (met
de link naar WI: Collega niet bereikbaar) — staan in `data/beslislogica.js` bij
de regels waar ze horen, als verantwoording. Het scherm toont ze niet: daar
staat alleen het advies.

## Wat de tool níét beslist

**De echte openingstijden.** 9 tot 17 uur, elke dag, voor elke post. Geen
weekenden, geen feestdagen, geen afwijkende werkweken. De tijdzones kloppen wel.

**Welke post verantwoordelijk is** in een land zonder Nederlandse post.

**Telefoonnummers.** De tool houdt zelf geen nummers bij.

## Keuzes die we hebben gemaakt

Plekken waar de instructies geen uitsluitsel geven. Verandert het oordeel
hierover, dan verandert er één regel in `data/beslislogica.js`.

1. **Welke klok telt.** WI: Overlijden zegt "lokale kantoortijden" zonder erbij
   te zeggen van welk land. De tool leest dat als: de kantoortijden van het
   aanspreekpunt, dus van het land waar de beller is. Het land waar de persoon
   overleed doet daar niet aan mee.
2. **De beller, niet de overledene.** WI: Overleg spreekt over "waar de
   Caller/AP is". Bij een overlijden is de AP de overledene, dus leest de tool
   dit als: waar de persoon is die je aan de lijn hebt.
3. **Caribische delen van het Koninkrijk.** De instructie vraagt "Is de AP in de
   Caribische Koninkrijksdelen?". De tool laat deze regel afgaan als *de beller
   óf het overlijden* daar is, omdat het ministerie daar hoe dan ook geen
   consulaire bijstand verleent. Daarom bestaat de overlijdensvraag nog: die
   dient alleen deze regel. Aruba, Curaçao, Sint Maarten en Caribisch Nederland
   staan niet in de landenselector — het Caribisch deel is een eigen antwoord,
   zodat er maar één manier is om er te komen.
4. **De hoofdstad bij meerdere tijdzones.** Heeft een land meerdere tijdzones,
   dan rekent de tool met die van de hoofdstad, want daar zit de post. Voor de
   Verenigde Staten is dat de oostkust, voor Brazilië Brasília.
5. **Geen derde antwoord.** Waar de tool eerder "weet ik niet" kende — bij
   begraven of gecremeerd, en bij de nabestaanden — dwingt ze nu een keuze af.
   Daarmee verviel de twijfelroute ("zoek dit eerst uit") als eigen uitkomst, en
   ook de veiligheidsklep dat twijfel over de nabestaanden als *nog niet op de
   hoogte* telde. Twijfelt de voorlichter, dan is doorvragen de bedoeling.

## Bewust buiten de filter

* **Stap 2 en 3 (Hermes).** Zoeken, case aanmaken of aanvullen. Hierin zit één
  beslissing die op overleg lijkt: een gesloten case → overleg met
  casemanagement, en buiten kantoortijd een nieuwe case aanmaken. Die valt
  buiten de afspraak "we filteren nu alleen op de situatie".
* **WhatsApp en e-mail.** Die hebben een eigen werkinstructie.
* **De SOS-waarschuwing** ("voorlichters van SOS mogen geen vragen over dit
  onderwerp beantwoorden"): een eigenschap van wie de tool gebruikt, niet van
  het geval.
* **De checkvragen uit stap 1.** Die doet de voorlichter vóór deze filter.

## Wat er verandert als de instructie verandert

`data/beslislogica.js` bevat de vragen (`stappen`), met wie je overlegt
(`aanspreekpunten`) en de adviezen (`regels`). De rest van de tool weet niets
van de inhoud. Verhoog bij een wijziging `versie` en `bijgewerkt` onderin dat
bestand.

`data/landen.js` is gegenereerd en wordt niet met de hand aangepast; draai
`node tools/landen-genereren.js` opnieuw als de tijdzonegegevens veranderen.
