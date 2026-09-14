/*
 * Beslislogica van de filtertool.
 *
 * Bron: WI: Overlijden, stap 4 — "Bepaal de vervolgstap: overleggen of later
 * terugbellen". De filter dekt alleen die stap. Stap 1 t/m 3 (checkvragen,
 * zoeken in Hermes, case aanmaken of aanvullen) doet de voorlichter ervoor,
 * stap 5 (afronding noteren) erna.
 *
 * De logica bestaat uit twee delen:
 *
 *  1. stappen — de vragen die de voorlichter krijgt, in volgorde. Een stap met
 *     een `als` wordt alleen gesteld als die voorwaarde klopt, zodat niemand
 *     vragen krijgt die er voor zijn situatie niet toe doen.
 *
 *  2. regels — van boven naar beneden doorlopen; de eerste regel die past,
 *     geeft het advies. De laatste regel heeft geen voorwaarde en vangt alles
 *     op wat de instructie niet dekt.
 *
 * Een voorwaarde is een object: elke sleutel moet kloppen (EN), elke lijst met
 * waarden is een keuze (OF). Bijvoorbeeld:
 *     { begraven: ['ja'], lokaleKantoortijd: ['nee'] }
 *
 * Staat er een lijst van zulke objecten, dan hoeft er maar één te kloppen:
 *     [ { melder: ['autoriteiten'] }, { begraven: ['onbekend'] } ]
 *
 * Naast de antwoorden kun je één afgeleid feit gebruiken, dat de tool zelf
 * uitrekent uit de klok en de postenlijst:
 *     lokaleKantoortijd — 'ja' | 'nee' | 'onbekend'
 *
 * Dat feit komt uit het LAND VAN OVERLIJDEN, want daar zit de zaak. Waar de
 * beller is, staat los daarvan: de tool laat die klok zien, maar laat er geen
 * regel op draaien. Zie docs/beslislogica.md — dit is een openstaande vraag.
 *
 * LET OP: de openingstijden in data/posten.js zijn nog voorbeelden. Daarmee is
 * "lokale kantoortijd" nu een aanname, niet een feit.
 */
window.FILTERLOGICA = (function () {
  'use strict';

  var WI = 'https://voorlichting.nederlandwereldwijd.nl/voorlichting/werkinstructies-consulaire-bijstand/';

  var LINK = {
    overleg: WI + 'overleg-met-post-of-casemanagement',
    nietBereikbaar: WI + 'collega-niet-bereikbaar-voor-een-consulair-geval',
    bijstand: WI + 'aanmerking-consulaire-bijstand',
    whatsapp: WI + 'hulpvraag-via-whatsapp',
    email: WI + 'hulpvraag-via-email'
  };

  /* De twee zijpaden die de instructie onder stap 4 noemt. */
  var TWIJFEL = {
    vraag: 'Ik twijfel om de DDA te bellen',
    antwoord: 'Overleg eerst met de vraagbaak. Is er geen vraagbaak? Overleg dan met je directe collega’s en besluit samen of je de DDA van de post of van casemanagement belt.'
  };

  var NIEMAND = {
    vraag: 'Ik krijg niemand aan de telefoon',
    antwoord: 'Volg de werkinstructie voor een onbereikbare collega.',
    link: { tekst: 'WI: Collega niet bereikbaar', url: LINK.nietBereikbaar }
  };

  var NOTEER = 'Noteer in de Communication-tab van Hermes hoe je het gesprek hebt afgerond (stap 5).';

  var stappen = [
    {
      id: 'melder',
      type: 'keuze',
      vraag: 'Van wie komt de melding?',
      hint: 'Een melding van de lokale autoriteiten volgt een eigen route.',
      opties: [
        { waarde: 'anders', label: 'Van een nabestaande of andere melder', toelichting: 'Familie, reisgenoot, werkgever of reisorganisatie.' },
        { waarde: 'autoriteiten', label: 'Van de lokale autoriteiten', toelichting: 'De melding komt uit het land zelf.' }
      ]
    },
    {
      id: 'begraven',
      type: 'keuze',
      als: { melder: ['anders'] },
      vraag: 'Is de persoon al begraven of gecremeerd?',
      hint: 'Checkvraag uit stap 1. Hier splitst de instructie de route.',
      opties: [
        { waarde: 'nee', label: 'Nee, nog niet', toelichting: 'Recent overleden.' },
        { waarde: 'ja', label: 'Ja, al begraven of gecremeerd' },
        { waarde: 'onbekend', label: 'Weet ik niet' }
      ]
    },
    {
      id: 'post',
      type: 'post',
      /* Niet vragen als de route al vastligt zonder het land: bij "weet ik
       * niet" over begraven of gecremeerd wijst de instructie sowieso naar
       * de twijfelroute. */
      als: [{ melder: ['autoriteiten'] }, { begraven: ['nee', 'ja'] }],
      vraag: 'In welk land is de persoon overleden?',
      hint: 'Je ziet meteen hoe laat het daar is en of het daar kantoortijd is.'
    },
    {
      id: 'bellerLand',
      type: 'post',
      als: [{ melder: ['autoriteiten'] }, { begraven: ['nee', 'ja'] }],
      vraag: 'Waar is de beller?',
      hint: 'Bellers uit het buitenland komen ook bij ons uit, dus de Nederlandse klok zegt niets over hun dag.',
      /* Twee snelkeuzes boven de landenlijst. Een snelkeuze met `alsNiet`
       * verdwijnt als die voorwaarde klopt. */
      snelkeuzes: [
        { waarde: 'zelfde', label: 'In hetzelfde land als het overlijden', alsNiet: { post: ['onbekend'] } },
        { waarde: 'nederland', label: 'In Nederland' }
      ]
    },
    {
      id: 'familie',
      type: 'keuze',
      /* Alleen nodig in de tak waar de instructie erop splitst. */
      als: { melder: ['anders'], begraven: ['ja'], lokaleKantoortijd: ['nee'] },
      vraag: 'Zijn de directe nabestaanden al op de hoogte?',
      hint: 'Partner, kinderen of andere directe familie.',
      opties: [
        { waarde: 'ja', label: 'Ja, de familie weet het' },
        { waarde: 'nee', label: 'Nee, nog niet' },
        { waarde: 'onbekend', label: 'Weet ik niet' }
      ]
    }
  ];

  /* Wat er op het startscherm staat, uit de kop en stap 1 van de instructie. */
  var start = {
    waarschuwing: 'Voorlichters van SOS mogen geen vragen over dit onderwerp beantwoorden.',
    positie: 'Deze filter is stap 4 van de werkinstructie. Stap 1 t/m 3 — checkvragen, zoeken in Hermes, case aanmaken of aanvullen — doe je hiervoor.',
    kanalen: [
      { tekst: 'Komt het verzoek via WhatsApp?', link: { tekst: 'WhatsApp-instructie', url: LINK.whatsapp } },
      { tekst: 'Komt het verzoek via e-mail?', link: { tekst: 'E-mailinstructie', url: LINK.email } }
    ],
    checkvragenKop: 'Checkvragen bij de hand (stap 1)',
    checkvragenUitleg: 'Hulpmiddel — je hoeft ze niet allemaal te stellen.',
    checkvragen: [
      'Wat is uw relatie tot de overledene?',
      'Wat is de naam van de overleden persoon? Spel met het telefoonalfabet en controleer het voorvoegsel (Da Costa of Dacosta?).',
      'Wat is uw naam, telefoonnummer en e-mailadres?',
      'Zijn er andere directe nabestaanden (partner, kinderen) op de hoogte? Zijn zij ter plaatse?',
      'Wat is de geboortedatum van de overleden persoon?',
      'In welk land en welke plaats is de persoon overleden?',
      'Wanneer is de persoon overleden?',
      'Weet u waar het lichaam nu is (ziekenhuis, mortuarium)?',
      'Is de persoon al begraven of gecremeerd?'
    ],
    checkvragenLink: { tekst: 'Check of de AP in aanmerking komt voor consulair maatschappelijke bijstand', url: LINK.bijstand }
  };

  /* Welke afgeleide feiten onder "Waarom dit advies" komen te staan. */
  var toonFeiten = ['lokaleKantoortijd'];

  var feitLabels = {
    lokaleKantoortijd: {
      label: 'Lokale kantoortijd',
      waardes: {
        ja: 'binnen lokale kantoortijden',
        nee: 'buiten lokale kantoortijden',
        onbekend: 'onbekend — land niet in de lijst'
      }
    }
  };

  var regels = [
    {
      id: 'lokale-autoriteiten',
      naam: 'Melding van lokale autoriteiten',
      grondslag: 'Stap 4 — Melding van lokale autoriteiten',
      wanneer: { melder: ['autoriteiten'] },
      advies: {
        niveau: 'direct',
        kop: 'Altijd overleggen',
        metWie: 'De post of casemanagement — ook buiten reguliere kantoortijden',
        metWieLink: { tekst: 'Bekijk met wie je overlegt', url: LINK.overleg },
        stappen: [
          'Vraag of je de beller in de wacht mag zetten en zeg dat je gaat overleggen met een collega.',
          'Overleg met de post of casemanagement.',
          NOTEER
        ],
        toelichting: 'Bij een melding van de lokale autoriteiten overleg je altijd, ongeacht het tijdstip.',
        anders: [NIEMAND]
      }
    },
    {
      id: 'recent-binnen-kantoortijd',
      naam: 'Recent overleden, binnen lokale kantoortijden',
      grondslag: 'Stap 4 — Recent overleden, tijdens lokale kantoortijden',
      wanneer: { melder: ['anders'], begraven: ['nee'], lokaleKantoortijd: ['ja'] },
      advies: {
        niveau: 'overleg',
        kop: 'Overleggen met de post of casemanagement',
        metWie: 'De post of casemanagement',
        metWieLink: { tekst: 'Bekijk met wie je overlegt', url: LINK.overleg },
        stappen: [
          'Vraag of je de beller in de wacht mag zetten en zeg dat je gaat overleggen met een collega.',
          'Overleg met de post of casemanagement.',
          NOTEER
        ],
        anders: [NIEMAND]
      }
    },
    {
      id: 'recent-buiten-kantoortijd',
      naam: 'Recent overleden, buiten lokale kantoortijden',
      grondslag: 'Stap 4 — Recent overleden, buiten lokale kantoortijden',
      wanneer: { melder: ['anders'], begraven: ['nee'], lokaleKantoortijd: ['nee'] },
      advies: {
        niveau: 'direct',
        kop: 'Overleggen met de DDA',
        metWie: 'De DDA van de post of van casemanagement',
        metWieLink: { tekst: 'Bekijk met welke DDA je overlegt', url: LINK.overleg },
        stappen: [
          'Vraag of je de beller in de wacht mag zetten en zeg dat je gaat overleggen met een collega.',
          'Overleg met de DDA van de post of van casemanagement.',
          NOTEER
        ],
        toelichting: 'De persoon is nog niet begraven of gecremeerd; dat wacht niet tot de post weer opengaat.',
        anders: [TWIJFEL, NIEMAND]
      }
    },
    {
      id: 'begraven-binnen-kantoortijd',
      naam: 'Al begraven of gecremeerd, binnen lokale kantoortijden',
      grondslag: 'Stap 4 — Persoon is al begraven/gecremeerd, tijdens lokale kantoortijden',
      wanneer: { melder: ['anders'], begraven: ['ja'], lokaleKantoortijd: ['ja'] },
      advies: {
        niveau: 'overleg',
        kop: 'Overleggen met de post of casemanagement',
        metWie: 'De post of casemanagement',
        metWieLink: { tekst: 'Bekijk met wie je overlegt', url: LINK.overleg },
        stappen: [
          'Vraag of je de beller in de wacht mag zetten en zeg dat je gaat overleggen met een collega.',
          'Overleg met de post of casemanagement.',
          NOTEER
        ],
        anders: [NIEMAND]
      }
    },
    {
      id: 'begraven-buiten-kantoortijd-familie-onwetend',
      naam: 'Al begraven of gecremeerd, buiten lokale kantoortijden, familie nog niet op de hoogte',
      grondslag: 'Stap 4 — Persoon is al begraven/gecremeerd, buiten lokale kantoortijden',
      wanneer: { melder: ['anders'], begraven: ['ja'], lokaleKantoortijd: ['nee'], familie: ['nee', 'onbekend'] },
      advies: {
        niveau: 'direct',
        kop: 'Overleggen met de DDA',
        metWie: 'De DDA van de post of van casemanagement',
        metWieLink: { tekst: 'Bekijk met welke DDA je overlegt', url: LINK.overleg },
        stappen: [
          'Vraag of je de beller in de wacht mag zetten en zeg dat je gaat overleggen met een collega.',
          'Overleg met de DDA van de post of van casemanagement.',
          NOTEER
        ],
        toelichting: 'Uitstel tot de volgende werkdag mag alleen als je wéét dat de familie al op de hoogte is. Weet je dat niet zeker, dan volgt de tool deze tak.',
        anders: [TWIJFEL, NIEMAND]
      }
    },
    {
      id: 'begraven-buiten-kantoortijd-familie-weet-het',
      naam: 'Al begraven of gecremeerd, buiten lokale kantoortijden, familie is op de hoogte',
      grondslag: 'Stap 4 — Persoon is al begraven/gecremeerd, buiten lokale kantoortijden',
      wanneer: { melder: ['anders'], begraven: ['ja'], lokaleKantoortijd: ['nee'], familie: ['ja'] },
      advies: {
        niveau: 'geen',
        kop: 'Geen overleg — laat terugbellen of mailen',
        metWie: 'Niemand — de beller komt de volgende werkdag terug',
        stappen: [
          'Vraag de beller om de volgende werkdag terug te bellen, of de vraag op de mail te zetten.',
          NOTEER
        ],
        toelichting: 'De familie is op de hoogte en de persoon is al begraven of gecremeerd: hiervoor hoeft niemand buiten kantoortijd gebeld te worden.'
      }
    },
    {
      id: 'begraven-onbekend',
      naam: 'Onbekend of de persoon al begraven of gecremeerd is',
      grondslag: 'Stap 4 — "Ik twijfel om de DDA te bellen"',
      wanneer: { melder: ['anders'], begraven: ['onbekend'] },
      advies: {
        niveau: 'overleg',
        kop: 'Zoek dit uit, of gebruik de twijfelroute',
        metWie: 'Eerst de vraagbaak; is die er niet, je directe collega’s',
        stappen: [
          'Vraag de beller of de persoon al begraven of gecremeerd is — hierop splitst de instructie.',
          'Krijg je dat niet helder: overleg met de vraagbaak, of anders met je directe collega’s.',
          NOTEER
        ],
        toelichting: 'De instructie kent alleen de route "nog niet begraven" en de route "al begraven of gecremeerd". Zonder dat antwoord kiest de tool geen van beide voor je.',
        anders: [NIEMAND]
      }
    },
    {
      id: 'land-onbekend',
      naam: 'Lokale kantoortijd niet vast te stellen',
      grondslag: 'Stap 4 — "Ik twijfel om de DDA te bellen"',
      wanneer: { lokaleKantoortijd: ['onbekend'] },
      advies: {
        niveau: 'overleg',
        kop: 'Zoek de lokale kantoortijd op, of gebruik de twijfelroute',
        metWie: 'Eerst de vraagbaak; is die er niet, je directe collega’s',
        stappen: [
          'Zoek op wat de kantoortijden van de post in dat land zijn — daar hangt de hele vervolgstap van af.',
          'Lukt dat niet snel: overleg met de vraagbaak, of anders met je directe collega’s.',
          NOTEER
        ],
        toelichting: 'Dit land staat niet in de postenlijst van de tool, dus ze kan niet uitrekenen of het daar kantoortijd is.',
        anders: [NIEMAND]
      }
    },
    {
      id: 'niet-gedekt',
      naam: 'Deze combinatie staat niet in de instructie',
      grondslag: 'Vangnet',
      wanneer: null,
      advies: {
        niveau: 'overleg',
        kop: 'Overleggen',
        metWie: 'Eerst de vraagbaak; is die er niet, je directe collega’s',
        stappen: [
          'Overleg, en zeg erbij dat de filtertool deze combinatie niet dekt.',
          'Meld de combinatie bij de beheerder van de tool, zodat de logica kan worden aangevuld.',
          NOTEER
        ],
        toelichting: 'De tool geeft hier geen zelfstandig advies: geen enkele regel uit stap 4 past op deze antwoorden.',
        anders: [NIEMAND]
      }
    }
  ];

  return {
    versie: '1.0',
    bijgewerkt: '2026-09-14',
    bron: 'WI: Overlijden — stap 4: Bepaal de vervolgstap: overleggen of later terugbellen',
    links: LINK,
    start: start,
    stappen: stappen,
    toonFeiten: toonFeiten,
    feitLabels: feitLabels,
    regels: regels
  };
})();
