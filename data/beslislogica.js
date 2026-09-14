/*
 * Beslislogica van de filtertool.
 *
 * Twee werkinstructies komen hier samen:
 *
 *   WI: Overlijden, stap 4 — "Bepaal de vervolgstap: overleggen of later
 *   terugbellen". Die bepaalt of je overlegt, en of dat nu moet of tijdens
 *   kantoortijd kan. Dat zijn de regels hieronder.
 *
 *   WI: Overleg met post of casemanagement. Die bepaalt met wie. Dat hangt af
 *   van waar de beller is en staat in data/aanspreekpunt.js. De regels
 *   hieronder noemen dus geen namen, maar een soort:
 *       metWieSoort: 'aanspreekpunt'  het eerste aanspreekpunt zelf
 *       metWieSoort: 'dda'            de DDA daarvan
 *       metWieSoort: 'auto'           binnen kantoortijd het aanspreekpunt,
 *                                     daarbuiten de DDA
 *   Staat er een vaste `metWie` in het advies, dan wint die.
 *
 * Stap 1 t/m 3 van WI: Overlijden (checkvragen, Hermes) doet de voorlichter
 * hiervoor, stap 5 (afronding noteren) staat als laatste actie in elk advies.
 *
 * De logica bestaat uit twee delen:
 *
 *  1. stappen — de vragen die de voorlichter krijgt, in volgorde. Een stap met
 *     een `als` wordt alleen gesteld als die voorwaarde klopt.
 *
 *  2. regels — van boven naar beneden doorlopen; de eerste regel die past,
 *     geeft het advies. De laatste regel heeft geen voorwaarde en vangt alles
 *     op wat de instructies niet dekken.
 *
 * Een voorwaarde is een object: elke sleutel moet kloppen (EN), elke lijst met
 * waarden is een keuze (OF). Bijvoorbeeld:
 *     { begraven: ['ja'], kantoortijd: ['nee'] }
 *
 * Staat er een lijst van zulke objecten, dan hoeft er maar één te kloppen:
 *     [ { melder: ['autoriteiten'] }, { begraven: ['nee', 'ja'] } ]
 *
 * Naast de antwoorden kun je drie afgeleide feiten gebruiken, die de tool zelf
 * uitrekent uit de klok, de postenlijst en de plek van de beller:
 *     aanspreekpunt — 'casemanagement' | 'post' | 'waarnemend' | 'regio' |
 *                     'geen-bijstand' | 'onbekend'
 *     kantoortijd   — 'ja' | 'nee' | 'onbekend' | 'nvt'   (van het aanspreekpunt)
 *     caribisch     — 'ja' | 'nee'  (beller of overlijden in de Caribische
 *                                    delen van het Koninkrijk)
 *
 * LET OP: de openingstijden in data/posten.js zijn nog voorbeelden. Daarmee is
 * "binnen of buiten kantoortijd" nu een aanname.
 */
window.FILTERLOGICA = (function () {
  'use strict';

  var WI = 'https://voorlichting.nederlandwereldwijd.nl/voorlichting/werkinstructies-consulaire-bijstand/';

  var LINK = {
    bijstand: WI + 'aanmerking-consulaire-bijstand',
    whatsapp: WI + 'hulpvraag-via-whatsapp',
    email: WI + 'hulpvraag-via-email',
    nietBereikbaar: WI + 'collega-niet-bereikbaar-voor-een-consulair-geval'
  };

  /* De twee zijpaden die de instructie onder stap 4 noemt. */
  var TWIJFEL = {
    vraag: 'Ik twijfel om de DDA te bellen',
    antwoord: 'Overleg eerst met de vraagbaak. Is er geen vraagbaak? Overleg dan met je directe collega’s en besluit samen.'
  };

  var NIEMAND = {
    vraag: 'Ik krijg niemand aan de telefoon',
    antwoord: 'Volg de werkinstructie voor een onbereikbare collega.',
    link: { tekst: 'WI: Collega niet bereikbaar', url: LINK.nietBereikbaar }
  };

  var NOTEER = 'Noteer in de Communication-tab van Hermes hoe je het gesprek hebt afgerond (stap 5).';
  var WACHT = 'Vraag of je de beller in de wacht mag zetten en zeg dat je gaat overleggen met een collega.';

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
      id: 'bellerLand',
      type: 'post',
      als: [{ melder: ['autoriteiten'] }, { begraven: ['nee', 'ja'] }],
      vraag: 'Waar is de beller?',
      hint: 'Hier hangt aan vast met wie je overlegt, en welke klok telt.',
      snelkeuzes: [
        { waarde: 'nederland', label: 'In Nederland', toelichting: 'Dan is casemanagement het aanspreekpunt.' }
      ],
      extraRijen: [
        { waarde: 'waarnemend', label: 'Een ander land, staat niet in de lijst', toelichting: 'De tool wijst je naar de landenpagina’s.' },
        { waarde: 'onbekend', label: 'Weet ik niet', toelichting: 'Zonder dit kan de tool geen aanspreekpunt bepalen.' }
      ]
    },
    {
      id: 'overlijdenLand',
      type: 'post',
      als: [{ melder: ['autoriteiten'] }, { begraven: ['nee', 'ja'] }],
      vraag: 'In welk land is de persoon overleden?',
      hint: 'Checkvraag uit stap 1. Bepaalt niet met wie je overlegt, wel welke post de zaak heeft.',
      snelkeuzes: [
        { waarde: 'zelfde', label: 'In hetzelfde land als de beller', alsNiet: { bellerLand: ['onbekend', 'waarnemend'] } }
      ],
      extraRijen: [
        { waarde: 'onbekend', label: 'Weet ik niet of het land staat er niet bij' }
      ]
    },
    {
      id: 'familie',
      type: 'keuze',
      als: { melder: ['anders'], begraven: ['ja'], kantoortijd: ['nee'] },
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
  var toonFeiten = ['kantoortijd'];

  var feitLabels = {
    kantoortijd: {
      label: 'Kantoortijd bij het aanspreekpunt',
      waardes: {
        ja: 'binnen kantoortijden',
        nee: 'buiten kantoortijden',
        onbekend: 'onbekend',
        nvt: 'niet van toepassing'
      }
    },
    aanspreekpunt: {
      label: 'Aanspreekpunt',
      waardes: {
        casemanagement: 'casemanagement',
        post: 'de post ter plaatse',
        waarnemend: 'de waarnemende post',
        regio: 'de regio-casemanager',
        'geen-bijstand': 'geen consulaire bijstand',
        onbekend: 'nog niet te bepalen'
      }
    }
  };

  var regels = [
    {
      id: 'caribische-koninkrijksdelen',
      naam: 'Caribische delen van het Koninkrijk',
      grondslag: 'WI: Overleg met post of casemanagement — Caribische Koninkrijksdelen',
      wanneer: { caribisch: ['ja'] },
      advies: {
        niveau: 'geen',
        kop: 'Geen consulaire bijstand — verwijs door',
        metWieSoort: 'aanspreekpunt',
        stappen: [
          'Leg uit dat het ministerie van Buitenlandse Zaken hier geen consulaire bijstand verleent.',
          'Verwijs door. Geef in een noodgeval het nummer van de lokale hulpdiensten uit het reisadvies.',
          NOTEER
        ],
        toelichting: 'Dit geldt voor de Caribische landen (Aruba, Curaçao, Sint Maarten) en de bijzondere openbare lichamen (Bonaire, Sint Eustatius, Saba).'
      }
    },
    {
      id: 'lokale-autoriteiten',
      naam: 'Melding van lokale autoriteiten',
      grondslag: 'WI: Overlijden, stap 4 — Melding van lokale autoriteiten',
      wanneer: { melder: ['autoriteiten'] },
      advies: {
        niveau: 'direct',
        kop: 'Altijd overleggen',
        metWieSoort: 'auto',
        stappen: [WACHT, 'Overleg, ook buiten reguliere kantoortijden.', NOTEER],
        toelichting: 'Bij een melding van de lokale autoriteiten overleg je altijd, ongeacht het tijdstip.',
        anders: [NIEMAND]
      }
    },
    {
      id: 'recent-binnen-kantoortijd',
      naam: 'Recent overleden, binnen kantoortijden',
      grondslag: 'WI: Overlijden, stap 4 — Recent overleden, tijdens lokale kantoortijden',
      wanneer: { melder: ['anders'], begraven: ['nee'], kantoortijd: ['ja'] },
      advies: {
        niveau: 'overleg',
        kop: 'Overleggen',
        metWieSoort: 'aanspreekpunt',
        stappen: [WACHT, 'Overleg nu.', NOTEER],
        anders: [NIEMAND]
      }
    },
    {
      id: 'recent-buiten-kantoortijd',
      naam: 'Recent overleden, buiten kantoortijden',
      grondslag: 'WI: Overlijden, stap 4 — Recent overleden, buiten lokale kantoortijden',
      wanneer: { melder: ['anders'], begraven: ['nee'], kantoortijd: ['nee'] },
      advies: {
        niveau: 'direct',
        kop: 'Overleggen met de DDA',
        metWieSoort: 'dda',
        stappen: [WACHT, 'Bel de DDA; dit wacht niet tot morgen.', NOTEER],
        toelichting: 'De persoon is nog niet begraven of gecremeerd; dat wacht niet tot het aanspreekpunt weer open is.',
        anders: [TWIJFEL, NIEMAND]
      }
    },
    {
      id: 'begraven-binnen-kantoortijd',
      naam: 'Al begraven of gecremeerd, binnen kantoortijden',
      grondslag: 'WI: Overlijden, stap 4 — Al begraven/gecremeerd, tijdens lokale kantoortijden',
      wanneer: { melder: ['anders'], begraven: ['ja'], kantoortijd: ['ja'] },
      advies: {
        niveau: 'overleg',
        kop: 'Overleggen',
        metWieSoort: 'aanspreekpunt',
        stappen: [WACHT, 'Overleg nu.', NOTEER],
        anders: [NIEMAND]
      }
    },
    {
      id: 'begraven-buiten-kantoortijd-familie-onwetend',
      naam: 'Al begraven of gecremeerd, buiten kantoortijden, familie nog niet op de hoogte',
      grondslag: 'WI: Overlijden, stap 4 — Al begraven/gecremeerd, buiten lokale kantoortijden',
      wanneer: { melder: ['anders'], begraven: ['ja'], kantoortijd: ['nee'], familie: ['nee', 'onbekend'] },
      advies: {
        niveau: 'direct',
        kop: 'Overleggen met de DDA',
        metWieSoort: 'dda',
        stappen: [WACHT, 'Bel de DDA; de familie weet het nog niet.', NOTEER],
        toelichting: 'Uitstel tot de volgende werkdag mag alleen als je wéét dat de familie al op de hoogte is. Weet je dat niet zeker, dan volgt de tool deze tak.',
        anders: [TWIJFEL, NIEMAND]
      }
    },
    {
      id: 'begraven-buiten-kantoortijd-familie-weet-het',
      naam: 'Al begraven of gecremeerd, buiten kantoortijden, familie is op de hoogte',
      grondslag: 'WI: Overlijden, stap 4 — Al begraven/gecremeerd, buiten lokale kantoortijden',
      wanneer: { melder: ['anders'], begraven: ['ja'], kantoortijd: ['nee'], familie: ['ja'] },
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
      grondslag: 'WI: Overlijden, stap 4 — "Ik twijfel om de DDA te bellen"',
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
      id: 'beller-onbekend',
      naam: 'Onbekend waar de beller is',
      grondslag: 'WI: Overleg met post of casemanagement',
      wanneer: { aanspreekpunt: ['onbekend'] },
      advies: {
        niveau: 'overleg',
        kop: 'Vraag eerst waar de beller is',
        metWie: 'Nog niet te bepalen',
        stappen: [
          'Vraag in welk land de beller op dit moment is.',
          'Daarna zegt de tool met wie je overlegt en of dat nu moet.',
          NOTEER
        ],
        toelichting: 'Met wie je overlegt hangt af van waar de beller is: in Nederland casemanagement, in het buitenland de post daar.',
        anders: [NIEMAND]
      }
    },
    {
      id: 'kantoortijd-onbekend',
      naam: 'Kantoortijden van het aanspreekpunt niet vast te stellen',
      grondslag: 'WI: Overleg met post of casemanagement — land zonder Nederlandse post',
      wanneer: { kantoortijd: ['onbekend'] },
      advies: {
        niveau: 'overleg',
        kop: 'Zoek eerst uit welke post waarneemt',
        metWieSoort: 'aanspreekpunt',
        stappen: [
          'Kijk bij de resortlanden op de landenpagina’s welke post verantwoordelijk is.',
          'Bel die post binnen kantoortijd; daarbuiten de post-DDA via de BOA.',
          NOTEER
        ],
        toelichting: 'Zonder de kantoortijden van die post kan de tool niet zeggen of dit tot morgen kan wachten. Twijfel je: eerst de vraagbaak.',
        anders: [TWIJFEL, NIEMAND]
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
        toelichting: 'De tool geeft hier geen zelfstandig advies: geen enkele regel past op deze antwoorden.',
        anders: [NIEMAND]
      }
    }
  ];

  return {
    versie: '2.0',
    bijgewerkt: '2026-09-14',
    bron: 'WI: Overlijden (stap 4) en WI: Overleg met post of casemanagement',
    links: LINK,
    start: start,
    stappen: stappen,
    toonFeiten: toonFeiten,
    feitLabels: feitLabels,
    regels: regels
  };
})();
