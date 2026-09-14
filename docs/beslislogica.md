# Beslislogica in woorden

Dit document beschrijft dezelfde logica als `data/beslislogica.js`,
`data/aanspreekpunt.js` en `data/posten.js`, maar dan leesbaar voor wie de
werkinstructies beheert. Leg het ernaast: staat er iets in deze lijst dat niet
in de instructie staat, of andersom, dan klopt de tool niet meer.

Twee instructies komen samen:

* **WI: Overlijden, stap 4** — bepaalt *of* je overlegt, en of dat nu moet of
  tijdens kantoortijd kan.
* **WI: Overleg met post of casemanagement** — bepaalt *met wie*.

Stap 1 t/m 3 van WI: Overlijden (checkvragen, Hermes) doet de voorlichter
ervoor; stap 5 (de afronding noteren) staat als laatste actie in elk advies.

## Wat de tool vraagt

| Vraag | Wanneer | Antwoorden |
| --- | --- | --- |
| Van wie komt de melding? | altijd | van een nabestaande of andere melder · van de lokale autoriteiten |
| Is de persoon al begraven of gecremeerd? | niet bij een melding van de lokale autoriteiten | nee · ja · weet ik niet |
| Waar is de beller? | tenzij de route al vastligt | in Nederland · een land uit de lijst · een ander land · weet ik niet |
| In welk land is de persoon overleden? | idem | hetzelfde land als de beller · een land uit de lijst · weet ik niet |
| Zijn de directe nabestaanden al op de hoogte? | alleen bij: al begraven/gecremeerd én buiten kantoortijden | ja · nee · weet ik niet |

De tool vraagt niet hoe laat het is. Ze leidt uit de klok en de postenlijst af
of het bij het aanspreekpunt kantoortijd is — inclusief tijdzone, afwijkende
werkweek, pauzes en lokale feestdagen.

Een vraag wordt overgeslagen zodra het antwoord de uitkomst niet meer kan
veranderen.

## Met wie je overlegt

Uit WI: Overleg met post of casemanagement. Het hangt af van waar de beller is.

| Waar de beller is | Aanspreekpunt | Buiten kantoortijd | Kantoortijden van |
| --- | --- | --- | --- |
| Nederland | Casemanagement (CM) | De DDA van casemanagement | Nederland |
| Land met Nederlandse post | De post in dat land | De post-DDA (via de BOA) | die post |
| Land zonder post of niet in de lijst | De post die waarneemt (landenpagina's) | De DDA van die post | onbekend |
| Oekraïne | De casemanager voor Oekraïne, niet de post | idem | Nederland |
| Caribische delen van het Koninkrijk | Geen consulaire bijstand — verwijs door | — | — |

Bij de Caribische landen krijgt de voorlichter de vertegenwoordiging te zien
(VNO, VNW of VNP); bij Bonaire, Sint Eustatius en Saba de lokale hulpdiensten
met de link naar het reisadvies.

## Wat de tool adviseert

De regels worden van boven naar beneden doorlopen. De eerste die past, wint.
"Kantoortijd" is steeds die van het aanspreekpunt hierboven.

| # | Situatie | Advies | Uit de instructie |
| --- | --- | --- | --- |
| 1 | Beller of overlijden in de Caribische delen van het Koninkrijk | Geen consulaire bijstand, verwijs door | WI: Overleg — Caribische Koninkrijksdelen |
| 2 | Melding van de lokale autoriteiten | Altijd overleggen, ook buiten kantoortijden | Stap 4 — Melding van lokale autoriteiten |
| 3 | Nog niet begraven/gecremeerd, binnen kantoortijden | Overleg met het aanspreekpunt | Stap 4 — Recent overleden |
| 4 | Nog niet begraven/gecremeerd, buiten kantoortijden | Overleg met de DDA | Stap 4 — Recent overleden |
| 5 | Al begraven/gecremeerd, binnen kantoortijden | Overleg met het aanspreekpunt | Stap 4 — Al begraven/gecremeerd |
| 6 | Al begraven/gecremeerd, buiten kantoortijden, familie nog niet op de hoogte | Overleg met de DDA | Stap 4 — Al begraven/gecremeerd |
| 7 | Al begraven/gecremeerd, buiten kantoortijden, familie al op de hoogte | Geen overleg: laat de volgende werkdag terugbellen of mailen | Stap 4 — Al begraven/gecremeerd |
| 8 | Onbekend of de persoon al begraven/gecremeerd is | Zoek dit uit; lukt dat niet, de twijfelroute | Stap 4 — "Ik twijfel om de DDA te bellen" |
| 9 | Onbekend waar de beller is | Vraag dat eerst; zonder dat is er geen aanspreekpunt | WI: Overleg met post of casemanagement |
| 10 | Kantoortijden van het aanspreekpunt onbekend | Zoek op de landenpagina's welke post waarneemt | WI: Overleg — land zonder Nederlandse post |
| 11 | *alles wat hierboven niet past* | Overleggen, met de mededeling dat de tool dit niet dekt | Vangnet, niet uit de instructie |

Bij elk advies dat op overleggen uitkomt, staan de zijpaden uit de instructie:
"Ik twijfel om de DDA te bellen" (eerst de vraagbaak, anders directe
collega's) en "Ik krijg niemand aan de telefoon" (met de link naar
WI: Collega niet bereikbaar).

## Wat de tool níét beslist

**De kantoortijden zelf.** `data/posten.js` bevat nu voorbeelden. Tot de echte
postenlijst erin staat, is "binnen of buiten kantoortijd" een aanname. Dat
staat ook onder aan het scherm.

**Telefoonnummers.** De tool wijst naar de landenpagina's, de client en de BOA;
ze houdt zelf geen nummers bij.

## Keuzes die we hebben gemaakt

Vijf plekken waar de instructies geen uitsluitsel geven. Verandert het oordeel
hierover, dan verandert er één regel in de databestanden.

1. **"Weet ik niet" over de nabestaanden** telt als *nog niet op de hoogte*,
   dus als de DDA-tak. Uitstel tot de volgende werkdag mag alleen als je wéét
   dat de familie het weet.
2. **"Weet ik niet" over begraven of gecremeerd** leidt niet naar een van beide
   takken, maar naar de twijfelroute uit de instructie. De tool kiest hier niet
   voor de voorlichter.
3. **Welke klok telt.** WI: Overlijden zegt "lokale kantoortijden" zonder erbij
   te zeggen van welk land. De tool leest dat als: de kantoortijden van het
   aanspreekpunt. Belt iemand uit Nederland, dan is dat de Nederlandse werkdag;
   belt iemand uit Egypte, dan die van de post in Caïro. Het land waar de
   persoon overleed doet daar niet aan mee — dat bepaalt welke post de zaak
   heeft, niet wie je nu belt.
4. **De beller, niet de overledene.** WI: Overleg spreekt over "waar de
   Caller/AP is". Bij een overlijden is de AP de overledene, dus leest de tool
   dit als: waar de persoon is die je aan de lijn hebt. De opmerking over
   Oekraïne ("bij een beller uit Oekraïne") wijst dezelfde kant op.
5. **Caribische delen van het Koninkrijk.** De instructie vraagt "Is de AP in
   de Caribische Koninkrijksdelen?". De tool laat deze regel afgaan als
   *de beller óf het overlijden* daar is, omdat het ministerie daar hoe dan ook
   geen consulaire bijstand verleent.

Daarnaast: de casemanager voor Oekraïne werkt vanuit Nederland, dus de tool
rekent daar met de Nederlandse kantoortijden.

## Bewust buiten de filter

* **Stap 2 en 3 (Hermes).** Zoeken, case aanmaken of aanvullen. Hierin zit één
  beslissing die op overleg lijkt: een gesloten case → overleg met
  casemanagement, en buiten kantoortijd een nieuwe case aanmaken. Die valt
  buiten de afspraak "we filteren nu alleen op de situatie".
* **WhatsApp en e-mail.** Die hebben een eigen werkinstructie; de tool linkt
  ernaar op het startscherm.
* **De SOS-waarschuwing** staat op het startscherm, niet als vraag: het is een
  eigenschap van wie de tool gebruikt, niet van het geval.

## Wat er verandert als de instructie verandert

Alleen de bestanden in `data/` hoeven mee te veranderen:

* `beslislogica.js` — de vragen en de regels (wél of niet overleggen).
* `aanspreekpunt.js` — met wie je overlegt, per soort plek.
* `posten.js` — de landen, hun kantoortijden en de plekken met een eigen route.

De rest van de tool weet niets van de inhoud. Verhoog bij een wijziging
`versie` en `bijgewerkt` in `data/beslislogica.js`: die staan onder elk advies,
zodat je terug kunt zien op welke versie een advies gebaseerd was.
