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

Eén vraag per scherm, keuzerondjes, "Volgende". Drie tot zes vragen.

| Vraag | Wanneer | Antwoorden |
| --- | --- | --- |
| Van wie komt de melding? | altijd | van een nabestaande of andere melder · van de lokale autoriteiten |
| Is de persoon al begraven of gecremeerd? | niet bij een melding van de lokale autoriteiten | nee · ja · weet ik niet |
| Waar is de beller op dit moment? | altijd | in Nederland · in het buitenland · in het Caribisch deel van het Koninkrijk · weet ik niet |
| Waar is de persoon overleden? | altijd | dezelfde vier antwoorden |
| Is het nu kantoortijd bij het aanspreekpunt? | tenzij het Caribisch deel van het Koninkrijk in beeld is, of onbekend is waar de beller is | ja · nee · weet ik niet |
| Zijn de directe nabestaanden al op de hoogte? | alleen bij: al begraven/gecremeerd én buiten kantoortijden | ja · nee · weet ik niet |

Een vraag wordt overgeslagen zodra het antwoord de uitkomst niet meer kan
veranderen.

## Met wie je overlegt

Uit WI: Overleg met post of casemanagement. Het hangt af van waar de beller is.

| Waar de beller is | Aanspreekpunt | Buiten kantoortijd |
| --- | --- | --- |
| Nederland | Casemanagement (CM) | De DDA van casemanagement |
| Buitenland | De Nederlandse post ter plaatse | De post-DDA, via de BOA |
| Caribische delen van het Koninkrijk | Geen consulaire bijstand — verwijs door | — |
| Weet ik niet | Nog niet te bepalen | — |

De tool maakt geen onderscheid meer tussen een land mét en een land zónder
Nederlandse post, en kent de casemanager voor Oekraïne niet apart. Wie in het
buitenland belt, krijgt "de Nederlandse post ter plaatse"; welke post dat is en
of die waarneemt, zoekt de voorlichter op de landenpagina's.

## Wat de tool adviseert

De regels worden van boven naar beneden doorlopen. De eerste die past, wint.
"Kantoortijd" is steeds die van het aanspreekpunt hierboven.

| # | Situatie | Advies | Uit de instructie |
| --- | --- | --- | --- |
| 1 | Beller of overlijden in de Caribische delen van het Koninkrijk | Geen consulaire bijstand, verwijs door | WI: Overleg — Caribische Koninkrijksdelen |
| 2 | Onbekend waar de beller is | Vraag dat eerst; zonder dat is er geen aanspreekpunt | WI: Overleg met post of casemanagement |
| 3 | Melding van de lokale autoriteiten | Altijd overleggen, ook buiten kantoortijden | Stap 4 — Melding van lokale autoriteiten |
| 4 | Nog niet begraven/gecremeerd, binnen kantoortijden | Overleg met het aanspreekpunt | Stap 4 — Recent overleden |
| 5 | Nog niet begraven/gecremeerd, buiten kantoortijden | Overleg met de DDA | Stap 4 — Recent overleden |
| 6 | Al begraven/gecremeerd, binnen kantoortijden | Overleg met het aanspreekpunt | Stap 4 — Al begraven/gecremeerd |
| 7 | Al begraven/gecremeerd, buiten kantoortijden, familie nog niet op de hoogte | Overleg met de DDA | Stap 4 — Al begraven/gecremeerd |
| 8 | Al begraven/gecremeerd, buiten kantoortijden, familie al op de hoogte | Geen overleg: laat de volgende werkdag terugbellen of mailen | Stap 4 — Al begraven/gecremeerd |
| 9 | Onbekend of de persoon al begraven/gecremeerd is | Zoek dit uit; lukt dat niet, de twijfelroute | Stap 4 — "Ik twijfel om de DDA te bellen" |
| 10 | Kantoortijden van het aanspreekpunt onbekend | Zoek op de landenpagina's welke post waarneemt | WI: Overleg — land zonder Nederlandse post |
| 11 | *alles wat hierboven niet past* | Overleggen, met de mededeling dat de tool dit niet dekt | Vangnet, niet uit de instructie |

Regel 2 staat bewust hoog: als onbekend is waar de beller is, slaat de tool de
vraag over de kantoortijd over, en dan kan geen enkele regel eronder nog een
zinnig aanspreekpunt noemen.

De zijpaden uit de instructie — "Ik twijfel om de DDA te bellen" (eerst de
vraagbaak, anders directe collega's) en "Ik krijg niemand aan de telefoon" (met
de link naar WI: Collega niet bereikbaar) — staan in `data/beslislogica.js` bij
de regels waar ze horen, als verantwoording. Het scherm toont ze niet: daar
staat alleen het advies.

## Wat de tool níét beslist

**De kantoortijden zelf.** De tool vraagt of het kantoortijd is bij het
aanspreekpunt; ze rekent dat niet meer uit. Een eerdere versie deed dat wel, met
een lijst posten, tijdzones, werkweken en feestdagen — maar die openingstijden
waren verzonnen voorbeelden, en de lijst maakte het scherm zwaar. De voorlichter
weet dit of zoekt het op.

**Telefoonnummers.** De tool houdt zelf geen nummers bij.

## Keuzes die we hebben gemaakt

Plekken waar de instructies geen uitsluitsel geven. Verandert het oordeel
hierover, dan verandert er één regel in `data/beslislogica.js`.

1. **"Weet ik niet" over de nabestaanden** telt als *nog niet op de hoogte*,
   dus als de DDA-tak. Uitstel tot de volgende werkdag mag alleen als je wéét
   dat de familie het weet.
2. **"Weet ik niet" over begraven of gecremeerd** leidt niet naar een van beide
   takken, maar naar de twijfelroute uit de instructie. De tool kiest hier niet
   voor de voorlichter.
3. **Welke klok telt.** WI: Overlijden zegt "lokale kantoortijden" zonder erbij
   te zeggen van welk land. De tool leest dat als: de kantoortijden van het
   aanspreekpunt, en zet dat ook zo in de vraag. Het land waar de persoon
   overleed doet daar niet aan mee — dat bepaalt welke post de zaak heeft, niet
   wie je nu belt.
4. **De beller, niet de overledene.** WI: Overleg spreekt over "waar de
   Caller/AP is". Bij een overlijden is de AP de overledene, dus leest de tool
   dit als: waar de persoon is die je aan de lijn hebt.
5. **Caribische delen van het Koninkrijk.** De instructie vraagt "Is de AP in
   de Caribische Koninkrijksdelen?". De tool laat deze regel afgaan als
   *de beller óf het overlijden* daar is, omdat het ministerie daar hoe dan ook
   geen consulaire bijstand verleent. Daarom vraagt de tool ook waar de persoon
   overleden is: die vraag dient alleen deze regel.

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

Deze drie stonden eerder op een startscherm vóór de eerste vraag. Dat scherm is
weg: de tool begint nu meteen met de eerste vraag.

## Wat er verandert als de instructie verandert

Alleen `data/beslislogica.js` hoeft mee te veranderen: de vragen (`stappen`),
met wie je overlegt (`aanspreekpunten`) en de adviezen (`regels`). De rest van
de tool weet niets van de inhoud. Verhoog bij een wijziging `versie` en
`bijgewerkt` onderin dat bestand.
