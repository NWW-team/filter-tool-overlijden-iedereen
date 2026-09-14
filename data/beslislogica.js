/*
 * Beslislogica van de filtertool.
 *
 * LET OP: dit is VOORBEELDLOGICA, geen beleid. Ze is gemaakt om de vorm van
 * de tool te kunnen laten zien. Vervang de vragen en regels hieronder door de
 * uitgeschreven werkinstructie voordat iemand hier een besluit op baseert.
 *
 * De logica bestaat uit twee delen:
 *
 *  1. stappen — de vragen die de voorlichter krijgt, in volgorde. Een stap met
 *     een `als` wordt alleen gesteld als die voorwaarde klopt, zodat niemand
 *     vragen krijgt die er voor zijn situatie niet toe doen.
 *
 *  2. regels — van boven naar beneden doorlopen; de eerste regel die past,
 *     geeft het advies. De laatste regel heeft geen voorwaarde en vangt alles
 *     op wat de logica niet dekt.
 *
 * Een voorwaarde is een object: elke sleutel moet kloppen (EN), elke lijst met
 * waarden is een keuze (OF). Bijvoorbeeld:
 *     { situatie: ['nieuw'], urgentie: ['ja', 'onbekend'], postOpen: ['nee'] }
 *
 * Staat er een lijst van zulke objecten, dan hoeft er maar één te kloppen:
 *     [ { situatie: ['bijzonder'] }, { situatie: ['nieuw'], urgentie: ['ja'] } ]
 *
 * Naast de antwoorden kun je twee afgeleide feiten gebruiken, die de tool zelf
 * uitrekent uit de klok en de postenlijst:
 *     postOpen        — 'ja' | 'nee' | 'onbekend' | 'nvt'
 *     nlKantoortijd   — 'ja' | 'nee'
 */
window.FILTERLOGICA = (function () {
  'use strict';

  var stappen = [
    {
      id: 'situatie',
      type: 'keuze',
      vraag: 'Waarover belt de melder?',
      hint: 'Kies wat er het dichtst bij komt. Twijfel je tussen twee opties, kies dan de zwaarste.',
      opties: [
        { waarde: 'nieuw', label: 'Nieuwe melding van een overlijden', toelichting: 'Een Nederlander is in het buitenland overleden en dat is bij ons nog niet bekend.' },
        { waarde: 'vervolg', label: 'Vraag over een overlijden dat al bekend is', toelichting: 'Er loopt al een dossier of er is al een casemanager op gezet.' },
        { waarde: 'niet-nl', label: 'Overledene is geen Nederlander', toelichting: 'Geen Nederlandse nationaliteit en geen dubbele nationaliteit.' },
        { waarde: 'bijzonder', label: 'Bijzondere omstandigheden', toelichting: 'Misdrijf, vermissing, minderjarige, groepsongeval of media-aandacht.' }
      ]
    },
    {
      id: 'urgentie',
      type: 'keuze',
      als: { situatie: ['nieuw'] },
      vraag: 'Moet er binnen 24 uur een onomkeerbare beslissing vallen?',
      hint: 'Denk aan een begrafenis volgens lokaal gebruik, sectie, identificatie of vervoer van het lichaam.',
      opties: [
        { waarde: 'ja', label: 'Ja', toelichting: 'Er ligt nu een beslissing die niet kan wachten.' },
        { waarde: 'nee', label: 'Nee, er is tijd', toelichting: 'Niets hoeft vandaag onomkeerbaar te gebeuren.' },
        { waarde: 'onbekend', label: 'Weet ik niet', toelichting: 'De tool behandelt dit verder als urgent.' }
      ]
    },
    {
      id: 'nabestaanden',
      type: 'keuze',
      als: { situatie: ['nieuw'], urgentie: ['nee'] },
      vraag: 'Zijn er nabestaanden ter plaatse die nu hulp nodig hebben?',
      hint: 'Bijvoorbeeld een reisgenoot of familielid dat in het land achterblijft.',
      opties: [
        { waarde: 'ja', label: 'Ja, iemand ter plaatse heeft hulp nodig' },
        { waarde: 'nee', label: 'Nee, de melder belt vanuit Nederland of redt zich' }
      ]
    },
    {
      id: 'post',
      type: 'post',
      /* Alleen vragen als het antwoord het advies kan veranderen: bij een
       * rustige melding zonder nabestaanden ter plaatse doet het land niet
       * mee, en dan scheelt dat een vraag in de wachtstand. */
      als: [
        { situatie: ['bijzonder'] },
        { situatie: ['nieuw'], urgentie: ['ja', 'onbekend'] },
        { situatie: ['nieuw'], urgentie: ['nee'], nabestaanden: ['ja'] }
      ],
      vraag: 'In welk land is de klant?',
      hint: 'Je ziet meteen hoe laat het daar is en of de post nu open is.'
    }
  ];

  /* Hoe de tool feiten in het scherm benoemt bij "Waarom dit advies". */
  var feitLabels = {
    postOpen: {
      label: 'Bereikbaarheid van de post',
      waardes: {
        ja: 'de post is nu open',
        nee: 'de post is nu dicht',
        onbekend: 'bereikbaarheid onbekend',
        nvt: 'niet van toepassing'
      }
    },
    nlKantoortijd: {
      label: 'Moment in Nederland',
      waardes: { ja: 'binnen kantoortijd', nee: 'buiten kantoortijd' }
    }
  };

  var regels = [
    {
      id: 'bijzonder-kantoortijd',
      naam: 'Bijzondere omstandigheden, binnen Nederlandse kantoortijd',
      grondslag: 'Voorbeeldinstructie §1.1',
      wanneer: { situatie: ['bijzonder'], nlKantoortijd: ['ja'] },
      advies: {
        niveau: 'direct',
        kop: 'Direct overleggen',
        metWie: 'Casemanagement consulaire zaken',
        stappen: [
          'Zet de beller in de wacht en bel casemanagement nu.',
          'Zeg niets toe over onderzoek, repatriëring of woordvoering.',
          'Leg vast wie er belde, met welk nummer je kunt terugbellen.'
        ],
        toelichting: 'Bij een misdrijf, vermissing, minderjarige, groepsongeval of media-aandacht beslist de voorlichter nooit zelf, ook niet als de post open is.'
      }
    },
    {
      id: 'bijzonder-buiten-kantoortijd',
      naam: 'Bijzondere omstandigheden, buiten Nederlandse kantoortijd',
      grondslag: 'Voorbeeldinstructie §1.2',
      wanneer: { situatie: ['bijzonder'], nlKantoortijd: ['nee'] },
      advies: {
        niveau: 'direct',
        kop: 'Direct overleggen',
        metWie: 'Dienstdoend consulair medewerker (24/7-lijn)',
        stappen: [
          'Bel de dienstdoend medewerker; wacht niet tot de volgende werkdag.',
          'Zeg niets toe over onderzoek, repatriëring of woordvoering.',
          'Leg vast wie er belde, met welk nummer je kunt terugbellen.'
        ],
        toelichting: 'Deze categorie wacht niet op kantoortijd. Of de post open is, doet hier niet ter zake.'
      }
    },
    {
      id: 'geen-nederlander',
      naam: 'Overledene is geen Nederlander',
      grondslag: 'Voorbeeldinstructie §2.1',
      wanneer: { situatie: ['niet-nl'] },
      advies: {
        niveau: 'geen',
        kop: 'Geen overleg nodig',
        metWie: 'Niemand — je handelt dit zelf af',
        stappen: [
          'Leg uit dat er geen Nederlandse consulaire taak is.',
          'Verwijs naar de lokale autoriteiten, de reisverzekeraar en de uitvaartonderneming.',
          'Leg de melding kort vast.'
        ],
        toelichting: 'Twijfel je over de nationaliteit of hoor je later over een verblijfsstatus of dubbele nationaliteit? Loop de filter dan opnieuw door.'
      }
    },
    {
      id: 'vervolg-kantoortijd',
      naam: 'Vraag over een bekend dossier, binnen Nederlandse kantoortijd',
      grondslag: 'Voorbeeldinstructie §2.2',
      wanneer: { situatie: ['vervolg'], nlKantoortijd: ['ja'] },
      advies: {
        niveau: 'geen',
        kop: 'Geen overleg nodig',
        metWie: 'Verbind door met de behandelend casemanager',
        stappen: [
          'Zoek het dossier op en verbind door met de casemanager die erop zit.',
          'Is die er niet, noteer de vraag en laat terugbellen binnen de werkdag.'
        ],
        toelichting: 'Doorverbinden is geen overleg: je hoeft de vraag niet eerst zelf te wegen.'
      }
    },
    {
      id: 'vervolg-buiten-kantoortijd',
      naam: 'Vraag over een bekend dossier, buiten Nederlandse kantoortijd',
      grondslag: 'Voorbeeldinstructie §2.3',
      wanneer: { situatie: ['vervolg'], nlKantoortijd: ['nee'] },
      advies: {
        niveau: 'geen',
        kop: 'Geen overleg nodig',
        metWie: 'Niemand — de casemanager pakt het op',
        stappen: [
          'Noteer de vraag in het dossier.',
          'Zeg toe dat de casemanager op de eerstvolgende werkdag terugbelt.'
        ],
        toelichting: 'Hoor je nieuwe feiten die de situatie urgent maken, begin de filter dan opnieuw met "Nieuwe melding".'
      }
    },
    {
      id: 'urgent-post-open',
      naam: 'Urgent en de post is open',
      grondslag: 'Voorbeeldinstructie §3.1',
      wanneer: { situatie: ['nieuw'], urgentie: ['ja', 'onbekend'], postOpen: ['ja'] },
      advies: {
        niveau: 'overleg',
        kop: 'Overleggen met de post',
        metWie: 'De post in het land zelf',
        stappen: [
          'Bel de post nu; die kan ter plaatse handelen.',
          'Geef door: naam en geboortedatum, plaats van overlijden, contactgegevens van de melder.',
          'Leg de melding vast; casemanagement pakt het op tijdens Nederlandse kantoortijd.'
        ],
        toelichting: 'De post is open en kan dit zelf. Casemanagement hoeft er nu niet bij.'
      }
    },
    {
      id: 'urgent-post-dicht-kantoortijd',
      naam: 'Urgent, post dicht, binnen Nederlandse kantoortijd',
      grondslag: 'Voorbeeldinstructie §3.2',
      wanneer: { situatie: ['nieuw'], urgentie: ['ja', 'onbekend'], postOpen: ['nee'], nlKantoortijd: ['ja'] },
      advies: {
        niveau: 'overleg',
        kop: 'Overleggen met casemanagement',
        metWie: 'Casemanagement consulaire zaken',
        stappen: [
          'Bel casemanagement; zij beslissen of de post buiten openingstijd wordt gewekt.',
          'Geef door: naam en geboortedatum, plaats van overlijden, contactgegevens van de melder.',
          'Noem erbij hoe laat de post weer opengaat (zie het kader hieronder).'
        ],
        toelichting: 'Niet zelf de post proberen te bereiken: buiten openingstijd loopt dat via casemanagement.'
      }
    },
    {
      id: 'urgent-post-dicht-buiten-kantoortijd',
      naam: 'Urgent, post dicht, buiten Nederlandse kantoortijd',
      grondslag: 'Voorbeeldinstructie §3.3',
      wanneer: { situatie: ['nieuw'], urgentie: ['ja', 'onbekend'], postOpen: ['nee'], nlKantoortijd: ['nee'] },
      advies: {
        niveau: 'direct',
        kop: 'Direct overleggen',
        metWie: 'Dienstdoend consulair medewerker (24/7-lijn)',
        stappen: [
          'Bel de dienstdoend medewerker; niemand anders is nu bereikbaar.',
          'Geef door: naam en geboortedatum, plaats van overlijden, contactgegevens van de melder.',
          'Noem erbij hoe laat de post weer opengaat (zie het kader hieronder).'
        ],
        toelichting: 'Zowel de post als casemanagement is nu dicht, en de zaak kan niet wachten.'
      }
    },
    {
      id: 'urgent-post-onbekend-kantoortijd',
      naam: 'Urgent, bereikbaarheid post onbekend, binnen Nederlandse kantoortijd',
      grondslag: 'Voorbeeldinstructie §3.4',
      wanneer: { situatie: ['nieuw'], urgentie: ['ja', 'onbekend'], postOpen: ['onbekend'], nlKantoortijd: ['ja'] },
      advies: {
        niveau: 'overleg',
        kop: 'Overleggen met casemanagement',
        metWie: 'Casemanagement consulaire zaken',
        stappen: [
          'Bel casemanagement en zeg erbij dat je de bereikbaarheid van de post niet kunt vaststellen.',
          'Geef door: land en plaats, naam en geboortedatum, contactgegevens van de melder.'
        ],
        toelichting: 'De post staat niet in de lijst of het land is onbekend. Zoek dat niet zelf uit terwijl de beller wacht.'
      }
    },
    {
      id: 'urgent-post-onbekend-buiten-kantoortijd',
      naam: 'Urgent, bereikbaarheid post onbekend, buiten Nederlandse kantoortijd',
      grondslag: 'Voorbeeldinstructie §3.5',
      wanneer: { situatie: ['nieuw'], urgentie: ['ja', 'onbekend'], postOpen: ['onbekend'], nlKantoortijd: ['nee'] },
      advies: {
        niveau: 'direct',
        kop: 'Direct overleggen',
        metWie: 'Dienstdoend consulair medewerker (24/7-lijn)',
        stappen: [
          'Bel de dienstdoend medewerker en zeg erbij dat de bereikbaarheid van de post onbekend is.',
          'Geef door: land en plaats, naam en geboortedatum, contactgegevens van de melder.'
        ],
        toelichting: 'De post staat niet in de lijst of het land is onbekend. Zoek dat niet zelf uit terwijl de beller wacht.'
      }
    },
    {
      id: 'rustig-nabestaanden-post-open',
      naam: 'Niet urgent, nabestaanden ter plaatse, post open',
      grondslag: 'Voorbeeldinstructie §4.1',
      wanneer: { situatie: ['nieuw'], urgentie: ['nee'], nabestaanden: ['ja'], postOpen: ['ja'] },
      advies: {
        niveau: 'overleg',
        kop: 'Overleggen met de post',
        metWie: 'De post in het land zelf',
        stappen: [
          'Bel de post; die kan de nabestaanden ter plaatse verder helpen.',
          'Geef de contactgegevens van de nabestaande door.',
          'Leg de melding vast voor casemanagement.'
        ],
        toelichting: 'Niet urgent, maar er is iemand ter plaatse en de post is open — dan gaat het daarheen.'
      }
    },
    {
      id: 'rustig-nabestaanden-post-dicht',
      naam: 'Niet urgent, nabestaanden ter plaatse, post niet bereikbaar',
      grondslag: 'Voorbeeldinstructie §4.2',
      wanneer: { situatie: ['nieuw'], urgentie: ['nee'], nabestaanden: ['ja'], postOpen: ['nee', 'onbekend'] },
      advies: {
        niveau: 'geen',
        kop: 'Nu geen overleg',
        metWie: 'Niemand — casemanagement pakt het op',
        stappen: [
          'Leg de melding vast met de contactgegevens van de nabestaande ter plaatse.',
          'Vertel de nabestaande hoe laat de post weer opengaat (zie het kader hieronder).',
          'Casemanagement pakt de melding op tijdens Nederlandse kantoortijd.'
        ],
        toelichting: 'Er is geen onomkeerbare beslissing aanstaande, dus niemand hoeft hiervoor gewekt te worden.'
      }
    },
    {
      id: 'rustig-geen-nabestaanden',
      naam: 'Niet urgent, niemand ter plaatse die hulp nodig heeft',
      grondslag: 'Voorbeeldinstructie §4.3',
      wanneer: { situatie: ['nieuw'], urgentie: ['nee'], nabestaanden: ['nee'] },
      advies: {
        niveau: 'geen',
        kop: 'Geen overleg nodig',
        metWie: 'Niemand — je handelt dit zelf af',
        stappen: [
          'Neem de melding op: naam en geboortedatum, plaats en datum van overlijden, contactgegevens van de melder.',
          'Zeg toe dat casemanagement op de eerstvolgende werkdag contact opneemt.'
        ],
        toelichting: 'Verandert er iets — bijvoorbeeld een begrafenis die ineens morgen is — loop de filter dan opnieuw door.'
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
        metWie: 'Casemanagement, of buiten kantoortijd de dienstdoend consulair medewerker',
        stappen: [
          'Overleg, en zeg erbij dat de filtertool deze combinatie niet dekt.',
          'Meld de combinatie bij de beheerder van de tool, zodat de logica kan worden aangevuld.'
        ],
        toelichting: 'De tool geeft hier geen zelfstandig advies: geen enkele regel past op deze antwoorden.'
      }
    }
  ];

  return {
    versie: '0.1 — voorbeeldlogica',
    bijgewerkt: '2026-09-14',
    bron: 'Fictieve werkinstructie "Melding van overlijden" (voorbeeld, geen beleid)',
    stappen: stappen,
    feitLabels: feitLabels,
    regels: regels
  };
})();
