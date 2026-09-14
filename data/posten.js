/*
 * Bereikbaarheid van posten.
 *
 * LET OP: dit zijn VOORBEELDGEGEVENS. Openingstijden, werkweken en
 * telefoonnummers zijn niet gecontroleerd en mogen niet als bron worden
 * gebruikt. Vervang dit bestand door de echte postenlijst voordat de tool
 * ergens in gebruik wordt genomen.
 *
 * Hoe pas je dit aan?
 *   - tijdzone : IANA-naam (bv. 'Africa/Cairo'). Zomertijd gaat vanzelf goed.
 *   - uren     : per dag (0 = zondag ... 6 = zaterdag) een lijst met blokken
 *                ['09:00', '17:00']. Een dag die ontbreekt, is gesloten.
 *   - sluiting : lokale feestdagen als 'JJJJ-MM-DD'.
 */
window.FILTERDATA = (function () {
  'use strict';

  function werkweek(dagen, van, tot) {
    var uren = {};
    dagen.forEach(function (dag) { uren[dag] = [[van, tot]]; });
    return uren;
  }

  var MA_VR = [1, 2, 3, 4, 5];
  var ZO_DO = [0, 1, 2, 3, 4];

  var posten = [
    {
      id: 'madrid', naam: 'Ambassade Madrid', land: 'Spanje',
      tijdzone: 'Europe/Madrid', werkweekTekst: 'ma t/m vr',
      uren: werkweek(MA_VR, '09:00', '17:00'),
      sluiting: ['2026-10-12', '2026-12-25']
    },
    {
      id: 'berlijn', naam: 'Ambassade Berlijn', land: 'Duitsland',
      tijdzone: 'Europe/Berlin', werkweekTekst: 'ma t/m vr',
      uren: werkweek(MA_VR, '09:00', '17:00'),
      sluiting: ['2026-10-03', '2026-12-25']
    },
    {
      id: 'londen', naam: 'Ambassade Londen', land: 'Verenigd Koninkrijk',
      tijdzone: 'Europe/London', werkweekTekst: 'ma t/m vr',
      uren: werkweek(MA_VR, '09:00', '17:00'),
      sluiting: ['2026-12-25', '2026-12-28']
    },
    {
      id: 'cairo', naam: 'Ambassade Caïro', land: 'Egypte',
      tijdzone: 'Africa/Cairo', werkweekTekst: 'zo t/m do',
      uren: werkweek(ZO_DO, '08:30', '15:30'),
      sluiting: ['2026-10-06'],
      opmerking: 'Afwijkende werkweek: vrijdag en zaterdag gesloten.'
    },
    {
      id: 'riyad', naam: 'Ambassade Riyad', land: 'Saoedi-Arabië',
      tijdzone: 'Asia/Riyadh', werkweekTekst: 'zo t/m do',
      uren: werkweek(ZO_DO, '08:30', '15:30'),
      sluiting: [],
      opmerking: 'Afwijkende werkweek: vrijdag en zaterdag gesloten.'
    },
    {
      id: 'telaviv', naam: 'Ambassade Tel Aviv', land: 'Israël',
      tijdzone: 'Asia/Jerusalem', werkweekTekst: 'zo t/m do',
      uren: werkweek(ZO_DO, '08:30', '16:00'),
      sluiting: [],
      opmerking: 'Afwijkende werkweek: vrijdag en zaterdag gesloten.'
    },
    {
      id: 'ankara', naam: 'Ambassade Ankara', land: 'Turkije',
      tijdzone: 'Europe/Istanbul', werkweekTekst: 'ma t/m vr',
      uren: werkweek(MA_VR, '09:00', '17:30'),
      sluiting: ['2026-10-29']
    },
    {
      id: 'rabat', naam: 'Ambassade Rabat', land: 'Marokko',
      tijdzone: 'Africa/Casablanca', werkweekTekst: 'ma t/m vr',
      uren: werkweek(MA_VR, '08:30', '16:30'),
      sluiting: []
    },
    {
      id: 'bangkok', naam: 'Ambassade Bangkok', land: 'Thailand',
      tijdzone: 'Asia/Bangkok', werkweekTekst: 'ma t/m vr',
      uren: { 1: [['08:30', '12:00'], ['13:00', '16:30']], 2: [['08:30', '12:00'], ['13:00', '16:30']], 3: [['08:30', '12:00'], ['13:00', '16:30']], 4: [['08:30', '12:00'], ['13:00', '16:30']], 5: [['08:30', '12:00'], ['13:00', '16:30']] },
      sluiting: ['2026-12-05'],
      opmerking: 'Gesloten tussen de middag (12:00–13:00 lokale tijd).'
    },
    {
      id: 'jakarta', naam: 'Ambassade Jakarta', land: 'Indonesië',
      tijdzone: 'Asia/Jakarta', werkweekTekst: 'ma t/m vr',
      uren: werkweek(MA_VR, '08:00', '16:00'),
      sluiting: ['2026-08-17']
    },
    {
      id: 'nairobi', naam: 'Ambassade Nairobi', land: 'Kenia',
      tijdzone: 'Africa/Nairobi', werkweekTekst: 'ma t/m vr',
      uren: werkweek(MA_VR, '08:00', '16:00'),
      sluiting: []
    },
    {
      id: 'paramaribo', naam: 'Ambassade Paramaribo', land: 'Suriname',
      tijdzone: 'America/Paramaribo', werkweekTekst: 'ma t/m vr',
      uren: werkweek(MA_VR, '07:30', '15:00'),
      sluiting: ['2026-11-25']
    },
    {
      id: 'washington', naam: 'Ambassade Washington', land: 'Verenigde Staten',
      tijdzone: 'America/New_York', werkweekTekst: 'ma t/m vr',
      uren: werkweek(MA_VR, '09:00', '17:00'),
      sluiting: ['2026-11-26']
    },
    {
      id: 'sydney', naam: 'Consulaat-generaal Sydney', land: 'Australië',
      tijdzone: 'Australia/Sydney', werkweekTekst: 'ma t/m vr',
      uren: werkweek(MA_VR, '09:00', '17:00'),
      sluiting: []
    }
  ];

  /* Het Nederlandse deel: wanneer is casemanagement zelf bereikbaar? */
  var casemanagement = {
    id: 'casemanagement',
    naam: 'Casemanagement consulaire zaken',
    land: 'Nederland',
    tijdzone: 'Europe/Amsterdam',
    werkweekTekst: 'ma t/m vr',
    uren: werkweek(MA_VR, '09:00', '17:00'),
    sluiting: ['2026-12-25', '2026-12-26'],
    buitenUren: 'Buiten kantoortijd: dienstdoend consulair medewerker via de 24/7-lijn.'
  };

  return {
    posten: posten,
    casemanagement: casemanagement,
    /* Verwijder deze regel zodra de echte postenlijst erin staat; hij staat
     * dan ook niet meer onderaan het scherm. */
    waarschuwing: 'De openingstijden en werkweken in deze tool zijn voorbeelden, nog niet de echte postgegevens. "Binnen of buiten lokale kantoortijden" is daarmee nu een aanname.'
  };
})();
