# Beslislogica in woorden

Dit document beschrijft dezelfde logica als `data/beslislogica.js`, maar dan
leesbaar voor wie de werkinstructie beheert. Leg het naast **WI: Overlijden**:
staat er iets in deze lijst dat niet in de instructie staat, of andersom, dan
klopt de tool niet meer.

De filter dekt **stap 4 — Bepaal de vervolgstap: overleggen of later
terugbellen**. Stap 1 t/m 3 (checkvragen, zoeken in Hermes, case aanmaken of
aanvullen) doet de voorlichter ervoor; stap 5 (de afronding noteren) staat als
laatste actie in elk advies.

## Wat de tool vraagt

| Vraag | Wanneer | Antwoorden |
| --- | --- | --- |
| Van wie komt de melding? | altijd | van een nabestaande of andere melder · van de lokale autoriteiten |
| Is de persoon al begraven of gecremeerd? | niet bij een melding van de lokale autoriteiten | nee · ja · weet ik niet |
| In welk land is de persoon overleden? | tenzij de route al vastligt ("weet ik niet" over begraven) | een post uit de lijst · onbekend |
| Zijn de directe nabestaanden al op de hoogte? | alleen bij: al begraven/gecremeerd én buiten lokale kantoortijden | ja · nee · weet ik niet |

De tool vraagt niet hoe laat het is. Ze leidt uit de klok en de postenlijst af
of het in het land van overlijden binnen lokale kantoortijden is — inclusief
tijdzone, afwijkende werkweek, pauzes en lokale feestdagen.

Een vraag wordt overgeslagen zodra het antwoord de uitkomst niet meer kan
veranderen. Een melding van de lokale autoriteiten is in twee vragen klaar.

## Wat de tool adviseert

De regels worden van boven naar beneden doorlopen. De eerste die past, wint.

| # | Situatie | Advies | Uit de instructie |
| --- | --- | --- | --- |
| 1 | Melding van de lokale autoriteiten | Altijd overleggen met de post/casemanagement, ook buiten kantoortijden | Stap 4 — Melding van lokale autoriteiten |
| 2 | Nog niet begraven/gecremeerd, binnen lokale kantoortijden | Overleg met de post/casemanagement | Stap 4 — Recent overleden |
| 3 | Nog niet begraven/gecremeerd, buiten lokale kantoortijden | Overleg met de DDA van de post/casemanagement | Stap 4 — Recent overleden |
| 4 | Al begraven/gecremeerd, binnen lokale kantoortijden | Overleg met de post/casemanagement | Stap 4 — Al begraven/gecremeerd |
| 5 | Al begraven/gecremeerd, buiten lokale kantoortijden, familie nog niet op de hoogte | Overleg met de DDA van de post/casemanagement | Stap 4 — Al begraven/gecremeerd |
| 6 | Al begraven/gecremeerd, buiten lokale kantoortijden, familie al op de hoogte | Geen overleg: laat de volgende werkdag terugbellen of mailen | Stap 4 — Al begraven/gecremeerd |
| 7 | Onbekend of de persoon al begraven/gecremeerd is | Zoek dit uit; lukt dat niet, gebruik de twijfelroute | Stap 4 — "Ik twijfel om de DDA te bellen" |
| 8 | Land niet in de postenlijst | Zoek de lokale kantoortijd op; lukt dat niet, gebruik de twijfelroute | Stap 4 — "Ik twijfel om de DDA te bellen" |
| 9 | *alles wat hierboven niet past* | Overleggen, met de mededeling dat de tool dit niet dekt | Vangnet, niet uit de instructie |

Bij elk advies dat op overleggen uitkomt, staan de twee zijpaden uit de
instructie: "Ik twijfel om de DDA te bellen" (eerst de vraagbaak, anders
directe collega's) en "Ik krijg niemand aan de telefoon" (met de link naar
WI: Collega niet bereikbaar).

## Wat de tool níét beslist

**Met wie precies: de post of casemanagement.** De instructie verwijst daarvoor
naar een aparte pagina ("Bekijk met wie je overlegt"). Die pagina zit niet in
de tool; elk advies linkt ernaar. Dit is het grootste openstaande gat: de vraag
"met wie" is precies wat de voorlichter wil weten. Zodra die pagina er is, kan
de tool dat zelf bepalen.

**De lokale kantoortijden zelf.** `data/posten.js` bevat nu voorbeelden. Tot de
echte postenlijst erin staat, is "binnen of buiten lokale kantoortijden" een
aanname. Dat staat ook onder aan het scherm.

## Keuzes die we hebben gemaakt

Drie plekken waar de instructie geen uitsluitsel geeft. Verandert het oordeel
hierover, dan verandert er één regel in `data/beslislogica.js`.

1. **"Weet ik niet" over de nabestaanden** telt als *nog niet op de hoogte*,
   dus als de DDA-tak. Uitstel tot de volgende werkdag mag alleen als je wéét
   dat de familie het weet.
2. **"Weet ik niet" over begraven of gecremeerd** leidt niet naar een van beide
   takken, maar naar de twijfelroute uit de instructie. De tool kiest hier niet
   voor de voorlichter.
3. **"Lokale kantoortijden"** lezen we als de kantoortijden van de post in het
   land van overlijden.

## Bewust buiten de filter

* **Stap 2 en 3 (Hermes).** Zoeken, case aanmaken of aanvullen. Hierin zit één
  beslissing die op overleg lijkt: een gesloten case → overleg met
  casemanagement, en buiten kantoortijd een nieuwe case aanmaken. Die valt
  buiten de afspraak "we filteren nu alleen op de situatie", en het is bovendien
  niet duidelijk of het daar om Nederlandse of lokale kantoortijden gaat.
* **WhatsApp en e-mail.** Die hebben een eigen werkinstructie; de tool linkt
  ernaar op het startscherm.
* **De SOS-waarschuwing** staat op het startscherm, niet als vraag: het is een
  eigenschap van wie de tool gebruikt, niet van het geval.

## Wat er verandert als de instructie verandert

Alleen `data/beslislogica.js` (vragen en regels) en `data/posten.js`
(openingstijden) hoeven mee te veranderen. De rest van de tool weet niets van
de inhoud. Verhoog bij een wijziging `versie` en `bijgewerkt` in
`data/beslislogica.js`: die staan onder elk advies, zodat je terug kunt zien op
welke versie van de logica een advies gebaseerd was.
