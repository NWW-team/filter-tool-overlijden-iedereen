/*
 * Met wie je overlegt.
 *
 * Bron: WI: Overleg met post of casemanagement. Dat hangt af van waar de
 * beller (Caller/AP) is:
 *
 *   - in Nederland            -> casemanagement (CM)
 *   - in het buitenland       -> de post in dat land
 *   - land zonder post        -> de post die waarneemt, via de landenpagina's
 *   - Oekraïne                -> de casemanager voor Oekraïne, niet de post
 *   - Caribische delen van het Koninkrijk -> geen consulaire bijstand
 *
 * Welke van de vijf het is, leidt de tool af uit het antwoord op "waar is de
 * beller?". Wat er dan op het scherm komt, staat hieronder. {land} wordt
 * vervangen door het land zelf.
 */
window.FILTERWAAR = (function () {
  'use strict';

  var landenpaginas = { tekst: 'Landenpagina’s', url: 'https://voorlichting.nederlandwereldwijd.nl/voorlichting/landenpaginas' };
  var boa = { tekst: 'Telefoonnummer van de post-DDA in de BOA', url: 'https://247.plaza.buzaservices.nl/subject/BOAapp/Lists/Bereikbaarheidsgegevens/SelectieScherm.aspx' };
  var regioverdeling = { tekst: 'Casemanagers regioverdeling', url: 'https://247.plaza.buzaservices.nl/subject/Casemanagement-Regio/_layouts/15/WopiFrame.aspx?sourcedoc=%7BA96613A1-8B45-48FC-93C1-B196859444E1%7D&file=casemanager-regioverdeling.xlsx&action=default&IsList=1&ListId=%7BAA5C41D4-A49C-48BB-B50E-FE2B9F45D762%7D&ListItemId=6' };
  var vnacs = { tekst: 'Contactgegevens VNO, VNW en VNP', url: 'https://www.vnacs.nl/service/contact' };

  var soorten = {
    casemanagement: {
      naam: 'Casemanagement (CM)',
      dda: 'De DDA van casemanagement',
      uitleg: 'De beller is in Nederland. Dan is casemanagement het eerste aanspreekpunt.',
      links: []
    },
    post: {
      naam: 'De post in {land}',
      dda: 'De DDA van de post in {land}',
      uitleg: 'De beller is in het buitenland. Dan is de post in dat land het eerste aanspreekpunt.',
      links: [
        { tekst: 'Nummer van de post: in de client en op de landenpagina', url: landenpaginas.url },
        boa
      ]
    },
    waarnemend: {
      naam: 'De post die voor dat land waarneemt',
      dda: 'De DDA van de post die waarneemt',
      uitleg: 'Staat het land niet in de lijst of zit er geen Nederlandse post? Kijk bij de resortlanden op de landenpagina’s welke post verantwoordelijk is.',
      links: [landenpaginas, boa]
    },
    regio: {
      naam: 'De casemanager voor {land}',
      dda: 'De casemanager voor {land}',
      uitleg: 'Let op: bij een beller uit {land} overleg je met de casemanager, niet met de post.',
      links: [regioverdeling]
    },
    'geen-bijstand': {
      naam: '{naam}',
      dda: '{naam}',
      uitleg: 'Het ministerie van Buitenlandse Zaken verleent geen consulaire bijstand in de Caribische landen en de bijzondere openbare lichamen. Verwijs door.',
      links: [vnacs]
    },
    onbekend: {
      naam: 'Nog niet te bepalen',
      dda: 'Nog niet te bepalen',
      uitleg: 'Zonder te weten waar de beller is, valt niet te zeggen of je bij casemanagement of bij een post moet zijn.',
      links: [landenpaginas]
    }
  };

  return {
    bron: 'WI: Overleg met post of casemanagement',
    links: { landenpaginas: landenpaginas, boa: boa, regioverdeling: regioverdeling, vnacs: vnacs },
    soorten: soorten
  };
})();
