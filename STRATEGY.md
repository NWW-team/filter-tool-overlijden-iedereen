---
name: Filtertool melding van overlijden
last_updated: 2026-09-14
---

# Filtertool melding van overlijden — Strategie

## Doelprobleem

Een voorlichter moet bij een melding van overlijden bepalen of hij moet overleggen en met wie: casemanagement of de post in het land waar de klant is. Dat hangt van drie dingen tegelijk af — de situatie (hoe urgent is het), de tijd (hoe laat is het, tijdens of buiten kantoortijd) en de locatie (waar is het). Bellers uit het buitenland bellen de ambassade maar komen in Nederland uit, dus zegt de Nederlandse klok en werkweek niets over of de post open is. Omdat de voorlichter bang is om het fout te doen, overlegt hij dan maar.

## Onze aanpak

We bouwen de al uitgeschreven logica om tot een vraag-voor-vraag filter dat eindigt in een expliciet advies over wel of niet overleggen en met wie, zodat de voorlichter niet meer een instructie hoeft te lezen en te interpreteren om tot een besluit te komen. Randvoorwaarden: bouwen kan alleen in de browser (Claude Code + GitHub) zonder lokale ontwikkelsoftware, en het doel is nu een demonstreerbaar prototype, geen intern gehoste app. Nog onbevestigd: of de beslislogica en de openingstijden van posten als interne data gelden en waar het prototype mag draaien — tot dat helder is werken we met fictieve of publieke voorbeelden.

## Voor wie

**Primair:** Voorlichters aan de telefoon — Ze zetten de beller even in de wacht en huren de filtertool in om binnen die wachtstand te bepalen of ze moeten overleggen, en met wie.

## Sporen

### Beslislogica

De uitgeschreven instructie omzetten in vragen en uitkomsten over situatie, tijd en locatie, inclusief wat er gebeurt met randgevallen die de logica niet dekt, en kloppend houden als het beleid verandert.

_Waarom het de aanpak dient:_ Zonder een logica die één op één klopt met de instructie geeft de tool adviezen die niemand kan navolgen.

### Bereikbaarheid van posten

Openingstijden, tijdzones en afwijkende werkweken per post actueel houden en op het juiste moment toepassen.

_Waarom het de aanpak dient:_ Dit is precies waar de voorlichter zelf de mist in gaat — zondagmiddag in Nederland zegt niets over of Caïro open is.

### Snelheid in de wachtstand

Het aantal vragen, de formulering en de weergave van het advies zo vormgeven dat een voorlichter er binnen een korte wachtstand doorheen is.

_Waarom het de aanpak dient:_ Duurt het langer dan even zelf nadenken of bellen, dan grijpt de voorlichter terug op wat hij al deed.

### Vertrouwen en dekking

Zichtbaar maken waaróm het advies eruit komt zoals het eruit komt, zodat de voorlichter erop durft af te gaan.

_Waarom het de aanpak dient:_ Het probleem is niet dat ze het antwoord niet weten, maar dat ze bang zijn om het fout te doen; een advies zonder onderbouwing neemt die angst niet weg.

## Niet aan werken

- Wat er in het systeem verwerkt moet worden — de logica zegt daar iets over, maar we filteren nu alleen op de situatie.
