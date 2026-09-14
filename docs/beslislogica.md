# Beslislogica in woorden

Dit document beschrijft dezelfde logica als `data/beslislogica.js`, maar dan
leesbaar voor wie de werkinstructie beheert. Loop het naast de instructie door:
staat er iets in deze lijst dat niet in de instructie staat, of andersom, dan
klopt de tool niet meer.

> **Voorbeeldlogica.** De regels hieronder zijn verzonnen om de vorm van de tool
> te laten zien. Ze zijn geen beleid.

## Wat de tool vraagt

| Vraag | Wanneer | Antwoorden |
| --- | --- | --- |
| Waarover belt de melder? | altijd | nieuwe melding · vraag over bekend dossier · geen Nederlander · bijzondere omstandigheden |
| Moet er binnen 24 uur een onomkeerbare beslissing vallen? | bij een nieuwe melding | ja · nee · weet ik niet |
| Zijn er nabestaanden ter plaatse die nu hulp nodig hebben? | bij een nieuwe melding die niet urgent is | ja · nee |
| In welk land is de klant? | bij bijzondere omstandigheden, en bij een nieuwe melding tenzij die niet urgent is én er niemand ter plaatse is | een post uit de lijst · onbekend |

Een vraag wordt overgeslagen zodra het antwoord het advies niet meer kan
veranderen. Bij een niet-urgente melding zonder nabestaanden ter plaatse is de
voorlichter er in drie vragen doorheen.

De tool vraagt niet hoe laat het is. Dat leidt ze af uit de klok: of het in
Nederland kantoortijd is, en of de post in dat land op dat moment open is —
inclusief tijdzone, afwijkende werkweek en lokale feestdagen.

## Wat de tool adviseert

De regels worden van boven naar beneden doorlopen. De eerste die past, wint.

| # | Situatie | Advies |
| --- | --- | --- |
| 1 | Bijzondere omstandigheden, Nederlandse kantoortijd | Direct overleggen met casemanagement |
| 2 | Bijzondere omstandigheden, daarbuiten | Direct overleggen met de dienstdoend medewerker |
| 3 | Overledene is geen Nederlander | Geen overleg; verwijzen en vastleggen |
| 4 | Bekend dossier, Nederlandse kantoortijd | Geen overleg; doorverbinden met de casemanager |
| 5 | Bekend dossier, daarbuiten | Geen overleg; noteren, casemanager belt terug |
| 6 | Nieuw en urgent, post open | Overleggen met de post |
| 7 | Nieuw en urgent, post dicht, Nederlandse kantoortijd | Overleggen met casemanagement |
| 8 | Nieuw en urgent, post dicht, daarbuiten | Direct overleggen met de dienstdoend medewerker |
| 9 | Nieuw en urgent, post onbekend, Nederlandse kantoortijd | Overleggen met casemanagement |
| 10 | Nieuw en urgent, post onbekend, daarbuiten | Direct overleggen met de dienstdoend medewerker |
| 11 | Niet urgent, nabestaanden ter plaatse, post open | Overleggen met de post |
| 12 | Niet urgent, nabestaanden ter plaatse, post niet bereikbaar | Nu geen overleg; casemanagement pakt het op |
| 13 | Niet urgent, niemand ter plaatse | Geen overleg; melding opnemen |
| 14 | *alles wat hierboven niet past* | Overleggen, met de mededeling dat de tool dit niet dekt |

"Weet ik niet" op de urgentievraag telt overal als urgent.

## Randgevallen

* **De tool dekt het niet.** Regel 14 vangt elke combinatie op die niet in de
  lijst staat. De voorlichter krijgt dan geen zelfstandig advies maar de
  opdracht te overleggen, met de reden erbij. Zo wordt een gat in de logica
  zichtbaar in plaats van stilletjes opgevuld.
* **Land onbekend.** Kiest de voorlichter "land staat er niet bij", dan rekent
  de tool niets uit over de post en zegt ze dat er ook bij.
* **De situatie verandert tijdens het gesprek.** Elk advies eindigt met wat er
  moet gebeuren als er nieuwe feiten bij komen: opnieuw door de filter.

## Wat er verandert als het beleid verandert

Alleen `data/beslislogica.js` (vragen en regels) en `data/posten.js`
(openingstijden) hoeven mee te veranderen. De rest van de tool weet niets van
de inhoud. Verhoog bij een wijziging `versie` en `bijgewerkt` in
`data/beslislogica.js`: die staan onder elk advies, zodat je terug kunt zien op
welke versie van de logica een advies gebaseerd was.
