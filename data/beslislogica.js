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
 *   van waar de beller is en staat in `aanspreekpunten`. De regels hieronder
 *   noemen dus geen namen, maar een soort:
 *       metWieSoort: 'aanspreekpunt'  het aanspreekpunt zelf
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
 * Naast de antwoorden zijn er twee afgeleide feiten, die de tool zelf uitrekent:
 *     caribisch   — 'ja' | 'nee'  (de beller of het overlijden is in de
 *                                  Caribische delen van het Koninkrijk)
 *     kantoortijd — 'ja' | 'nee' | 'nvt'  (is het nu tussen 9 en 17 uur bij het
 *                                  aanspreekpunt? 'nvt' in de Caribische delen)
 *
 * LET OP: de tool rekent met de aanname dat élke post elke dag van 9 tot 17 uur
 * lokale tijd open is, ook in het weekend. Echte openingstijden per post zitten
 * er niet in.
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

  /* De twee zijpaden die de instructie onder stap 4 noemt. Ze staan hier als
   * verantwoording bij de regel; het scherm toont ze niet. */
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

  /* Nergens een "weet ik niet": dat kan de voorlichter aan de beller vragen.
   * De tool dwingt dus een keuze af. */
  var stappen = [
    {
      id: 'melder',
      vraag: 'Van wie komt de melding?',
      opties: [
        { waarde: 'anders', label: 'Van een nabestaande of andere melder' },
        { waarde: 'autoriteiten', label: 'Van de lokale autoriteiten' }
      ]
    },
    {
      id: 'begraven',
      als: { melder: ['anders'] },
      vraag: 'Is de persoon al begraven of gecremeerd?',
      opties: [
        { waarde: 'nee', label: 'Nee, nog niet' },
        { waarde: 'ja', label: 'Ja, al begraven of gecremeerd' }
      ]
    },
    {
      id: 'bellerLand',
      vraag: 'Waar is de beller op dit moment?',
      opties: [
        { waarde: 'nederland', label: 'In Nederland' },
        { waarde: 'buitenland', label: 'In het buitenland' },
        { waarde: 'caribisch', label: 'In het Caribisch deel van het Koninkrijk' }
      ]
    },
    {
      /* De landenselector. Hieruit komt de tijdzone, en daarmee of de post
       * open is. */
      id: 'bellerLandCode',
      type: 'land',
      als: { bellerLand: ['buitenland'] },
      vraag: 'In welk land is de beller?'
    },
    {
      /* Alleen een overlijden buiten Nederland is voor Buitenlandse Zaken
       * relevant; "in Nederland" staat er daarom niet bij. Deze vraag bestaat
       * alleen nog om de Caribische regel te laten afgaan. */
      id: 'overlijdenLand',
      vraag: 'Waar is de persoon overleden?',
      opties: [
        { waarde: 'buitenland', label: 'In het buitenland' },
        { waarde: 'caribisch', label: 'In het Caribisch deel van het Koninkrijk' }
      ]
    },
    {
      id: 'familie',
      als: { melder: ['anders'], begraven: ['ja'], kantoortijd: ['nee'] },
      vraag: 'Zijn de directe nabestaanden al op de hoogte?',
      opties: [
        { waarde: 'ja', label: 'Ja, de familie weet het' },
        { waarde: 'nee', label: 'Nee, nog niet' }
      ]
    }
  ];

  /* Met wie je overlegt, afgeleid van waar de beller is.
   * Uit WI: Overleg met post of casemanagement.
   *
   * Een regel kan dit overrulen met `metWiePlek`: dan telt niet waar de beller
   * is, maar de plek die de regel noemt. Dat is nodig bij een melding van de
   * lokale autoriteiten, waar je altijd bij de post moet zijn. */
  var aanspreekpunten = {
    nederland: {
      naam: 'casemanagement',
      dda: 'de DDA van casemanagement'
    },
    buitenland: {
      naam: 'de Nederlandse post ter plaatse',
      dda: 'de post-DDA, via de BOA'
    },
    caribisch: {
      naam: 'niemand — hier is geen consulaire bijstand',
      dda: 'niemand — hier is geen consulaire bijstand'
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
        metWie: 'Niemand — verwijs door naar de lokale hulpdiensten',
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
        kop: 'Altijd overleggen met de post',
        metWiePlek: 'buitenland',
        metWieSoort: 'auto',
        stappen: [
          WACHT,
          'Overleg met de post, ook als die nu dicht is. Bel dan de post-DDA via de BOA.',
          NOTEER
        ],
        toelichting: 'Bij een melding van de lokale autoriteiten overleg je altijd met de post, ongeacht het tijdstip. Is de post gesloten, dan gaat het overleg via de DDA — het wacht niet tot morgen.',
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
      wanneer: { melder: ['anders'], begraven: ['ja'], kantoortijd: ['nee'], familie: ['nee'] },
      advies: {
        niveau: 'direct',
        kop: 'Overleggen met de DDA',
        metWieSoort: 'dda',
        stappen: [WACHT, 'Bel de DDA; de familie weet het nog niet.', NOTEER],
        toelichting: 'Uitstel tot de volgende werkdag mag alleen als je wéét dat de familie al op de hoogte is. Weet je dat niet zeker, vraag het dan na — de tool kent hier geen derde antwoord.',
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
    versie: '4.0',
    bijgewerkt: '2026-09-15',
    bron: 'WI: Overlijden (stap 4) en WI: Overleg met post of casemanagement',
    links: LINK,
    stappen: stappen,
    aanspreekpunten: aanspreekpunten,
    regels: regels
  };
})();
