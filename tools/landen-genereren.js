/*
 * Maakt data/landen.js uit de IANA-tijdzonedatabase.
 *
 * Draaien:  node tools/landen-genereren.js
 *
 * Bron is /usr/share/zoneinfo/zone1970.tab, die op elk Linux- en macOS-systeem
 * staat. Per land pakt dit script de eerste tijdzone die de tabel noemt.
 *
 * Die volgorde is geografisch, niet op inwonertal, en dat gaat mis bij landen
 * met meerdere zones: Oekraïne zou op Simferopol uitkomen en Rusland op
 * Kaliningrad. Voor die landen staat de zone van de hoofdstad daarom hieronder
 * in HOOFDSTAD. Het gaat om de tijd bij de post, en de post zit in de
 * hoofdstad.
 *
 * Nederland zelf staat niet in de uitvoer: de landenselector verschijnt alleen
 * als de beller "in het buitenland" heeft gekozen.
 */
'use strict';

var fs = require('fs');
var path = require('path');

var BRON = '/usr/share/zoneinfo/zone1970.tab';
var DOEL = path.join(__dirname, '..', 'data', 'landen.js');

/* Landen waar de eerste zone uit de tabel niet die van de hoofdstad is. De
 * overige landen met meerdere zones (VS, Mexico, Argentinië, Indonesië,
 * Chili, Spanje, China …) beginnen al met de juiste zone. */
var HOOFDSTAD = {
  AU: 'Australia/Sydney',       // Canberra
  BR: 'America/Sao_Paulo',      // Brasília
  CA: 'America/Toronto',        // Ottawa
  CD: 'Africa/Kinshasa',        // Kinshasa
  DE: 'Europe/Berlin',          // Berlijn
  FM: 'Pacific/Guadalcanal',    // Palikir, op Pohnpei
  MH: 'Pacific/Majuro',         // Majuro
  MY: 'Asia/Kuala_Lumpur',      // Kuala Lumpur
  PS: 'Asia/Hebron',            // Ramallah
  RU: 'Europe/Moscow',          // Moskou
  UA: 'Europe/Kyiv',            // Kyiv
  UZ: 'Asia/Tashkent',          // Tasjkent
  VN: 'Asia/Ho_Chi_Minh'        // Hanoi
};

/* Geen land, geen post, geen beller: onbewoond of alleen onderzoeksstations. */
var GEEN_LAND = ['AQ', 'UM', 'TF'];

/* Aruba, Curaçao, Sint Maarten en Caribisch Nederland (Bonaire, Sint
 * Eustatius, Saba). Deze staan NIET in de selector: het Caribisch deel van het
 * Koninkrijk is een eigen antwoord op de vraag waar de beller is, en daar
 * verleent Buitenlandse Zaken geen consulaire bijstand. Ze staan hier zodat de
 * tool ze blijft herkennen als ze ooit toch in de lijst belanden. */
var CARIBISCH_NL = ['AW', 'CW', 'SX', 'BQ'];

function lees() {
  var regels = fs.readFileSync(BRON, 'utf8').split('\n');
  var zones = {};
  regels.forEach(function (regel) {
    if (!regel || regel[0] === '#') return;
    var kolommen = regel.split('\t');
    if (kolommen.length < 3) return;
    kolommen[0].split(',').forEach(function (code) {
      if (!zones[code]) zones[code] = kolommen[2];
    });
  });
  Object.keys(HOOFDSTAD).forEach(function (code) { zones[code] = HOOFDSTAD[code]; });
  GEEN_LAND.forEach(function (code) { delete zones[code]; });
  CARIBISCH_NL.forEach(function (code) { delete zones[code]; });
  delete zones.NL;
  return zones;
}

function schrijf(zones) {
  var codes = Object.keys(zones).sort();
  var regels = codes.map(function (code) {
    return '    ' + code + ": '" + zones[code] + "'";
  });

  var uit = [
    '/*',
    ' * Landen en hun tijdzone.',
    ' *',
    ' * LET OP: dit bestand is gegenereerd door tools/landen-genereren.js uit de',
    ' * IANA-tijdzonedatabase. Pas het niet met de hand aan — draai het script',
    ' * opnieuw als de tijdzonegegevens veranderen.',
    ' *',
    ' * Heeft een land meerdere tijdzones, dan staat hier die van de meest bevolkte',
    ' * plaats. Voor de Verenigde Staten is dat America/New_York, voor Brazilië',
    ' * America/Sao_Paulo. De aanname is dat de Nederlandse post daar zit.',
    ' *',
    ' * De landnamen staan er niet in: die haalt de tool in het Nederlands op met',
    ' * Intl.DisplayNames, zodat ze niet met de hand vertaald hoeven te worden.',
    ' *',
    ' * Nederland ontbreekt met opzet — de landenselector is voor het buitenland.',
    ' * De Caribische delen van het Koninkrijk ontbreken ook: die zijn een eigen',
    ' * antwoord op de vraag waar de beller is.',
    ' *',
    ' * Gegenereerd uit tzdata op ' + new Date().toISOString().slice(0, 10) + '.',
    ' */',
    'window.FILTERLANDEN = (function () {',
    "  'use strict';",
    '',
    '  var landen = {',
    regels.join(',\n'),
    '  };',
    '',
    '  /* Caribische delen van het Koninkrijk: geen consulaire bijstand. */',
    '  var caribischNL = [' + CARIBISCH_NL.map(function (c) { return "'" + c + "'"; }).join(', ') + '];',
    '',
    '  return { landen: landen, caribischNL: caribischNL };',
    '})();',
    ''
  ].join('\n');

  fs.writeFileSync(DOEL, uit);
  return codes.length;
}

var aantal = schrijf(lees());
console.log('data/landen.js geschreven: ' + aantal + ' landen.');
