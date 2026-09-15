/*
 * Filtertool melding van overlijden — motor en scherm.
 *
 * Dit bestand bevat geen beleid. Alle vragen en regels staan in
 * data/beslislogica.js, de landen en hun tijdzones in data/landen.js. Wie de
 * instructie beheert, hoeft dit bestand niet aan te raken.
 *
 * Eén vraag per scherm, keuzerondjes, Volgende. Aan het eind één advies.
 */
(function () {
  'use strict';

  var L = window.FILTERLOGICA;
  var LAND = window.FILTERLANDEN;

  /* ------------------------------------------------------------------ tijd */

  /* De aanname van deze tool: elke post is elke dag van 9 tot 17 uur lokale
   * tijd open, ook in het weekend. Echte openingstijden zitten er niet in. */
  function isOpen(tijdzone, moment) {
    var uur = parseInt(new Intl.DateTimeFormat('en-US', {
      timeZone: tijdzone, hourCycle: 'h23', hour: '2-digit'
    }).format(moment), 10) % 24;
    return uur >= 9 && uur < 17;
  }

  function tijdTekst(tijdzone, moment) {
    return new Intl.DateTimeFormat('nl-NL', {
      timeZone: tijdzone, weekday: 'long', hour: '2-digit', minute: '2-digit'
    }).format(moment).replace(' om ', ' ');
  }

  /* De Nederlandse landnaam komt uit de browser, zodat data/landen.js geen
   * vertaalde namen hoeft bij te houden. Kan de browser het niet, dan is de
   * landcode het etiket. */
  var landnamen = (function () {
    try {
      return new Intl.DisplayNames(['nl'], { type: 'region' });
    } catch (e) {
      return null;
    }
  })();

  function landnaam(code) {
    if (!landnamen) return code;
    try {
      return landnamen.of(code) || code;
    } catch (e) {
      return code;
    }
  }

  /* --------------------------------------------------------------- toestand */

  var state = {
    antwoorden: {},
    volgorde: [],
    fout: false
  };

  var eersteScherm = true;

  /* ---------------------------------------------------------------- feiten */

  /* Welke klok telt: die van het aanspreekpunt. Belt iemand uit Nederland, dan
   * is dat casemanagement; belt iemand uit het buitenland, dan de post in het
   * gekozen land. */
  function tijdzoneVanAanspreekpunt(f) {
    if (f.bellerLand === 'nederland') return 'Europe/Amsterdam';
    if (f.bellerLand === 'buitenland' && f.bellerLandCode) return LAND.landen[f.bellerLandCode];
    return null;
  }

  /* De twee feiten die de tool zelf afleidt. */
  function feiten() {
    var f = {};
    for (var k in state.antwoorden) f[k] = state.antwoorden[k];

    /* De Caribische delen van het Koninkrijk staan niet in de landenselector —
     * ze zijn een eigen antwoord. Deze check is het slot op de deur voor het
     * geval ze ooit toch in de lijst belanden. */
    var caribischLand = f.bellerLandCode && LAND.caribischNL.indexOf(f.bellerLandCode) !== -1;
    f.caribisch = (f.bellerLand === 'caribisch' || f.overlijdenLand === 'caribisch' || caribischLand)
      ? 'ja' : 'nee';

    if (f.caribisch === 'ja') {
      f.kantoortijd = 'nvt';
    } else {
      var zone = tijdzoneVanAanspreekpunt(f);
      if (zone) f.kantoortijd = isOpen(zone, new Date()) ? 'ja' : 'nee';
    }
    return f;
  }

  /* Elke sleutel moet kloppen (EN), elke lijst is een keuze (OF).
   * Een lijst van voorwaarden telt als: één ervan hoeft te kloppen. */
  function voldoet(conditie, f) {
    if (!conditie) return true;
    if (Array.isArray(conditie)) {
      return conditie.some(function (c) { return voldoet(c, f); });
    }
    for (var sleutel in conditie) {
      if (conditie[sleutel].indexOf(f[sleutel]) === -1) return false;
    }
    return true;
  }

  /* Zoals voldoet(), maar een nog onbekend feit telt als "kan nog". */
  function mogelijk(conditie, f) {
    if (!conditie) return true;
    if (Array.isArray(conditie)) {
      return conditie.some(function (c) { return mogelijk(c, f); });
    }
    for (var sleutel in conditie) {
      if (f[sleutel] === undefined) continue;
      if (conditie[sleutel].indexOf(f[sleutel]) === -1) return false;
    }
    return true;
  }

  function volgendeStap() {
    var f = feiten();
    for (var i = 0; i < L.stappen.length; i++) {
      var stap = L.stappen[i];
      if (stap.id in state.antwoorden) continue;
      if (voldoet(stap.als, f)) return stap;
    }
    return null;
  }

  function stappenTelling() {
    var f = feiten();
    var totaal = L.stappen.filter(function (stap) {
      return (stap.id in state.antwoorden) || mogelijk(stap.als, f);
    }).length;
    return { huidig: state.volgorde.length + 1, totaal: Math.max(totaal, state.volgorde.length + 1) };
  }

  function beoordeel() {
    var f = feiten();
    for (var i = 0; i < L.regels.length; i++) {
      if (voldoet(L.regels[i].wanneer, f)) return L.regels[i];
    }
    return L.regels[L.regels.length - 1];
  }

  function metWieTekst(advies) {
    if (advies.metWie) return advies.metWie;
    /* Een regel mag de plek overrulen: bij de lokale autoriteiten is het
     * altijd de post, waar de beller ook is. */
    var punt = L.aanspreekpunten[advies.metWiePlek || state.antwoorden.bellerLand];
    if (!punt) return 'Nog niet te bepalen';
    if (advies.metWieSoort === 'dda') return punt.dda;
    if (advies.metWieSoort === 'auto') {
      return feiten().kantoortijd === 'nee' ? punt.dda : punt.naam;
    }
    return punt.naam;
  }

  /* ------------------------------------------------------------- hulpjes UI */

  function el(tag, klasse, tekst) {
    var n = document.createElement(tag);
    if (klasse) n.className = klasse;
    if (tekst !== undefined && tekst !== null) n.textContent = tekst;
    return n;
  }

  function antwoord(stapId, waarde) {
    state.antwoorden[stapId] = waarde;
    if (state.volgorde.indexOf(stapId) === -1) state.volgorde.push(stapId);
    state.fout = false;
    teken();
  }

  function terug() {
    var laatste = state.volgorde.pop();
    if (laatste === undefined) return;
    delete state.antwoorden[laatste];
    state.fout = false;
    teken();
  }

  function opnieuw() {
    state.antwoorden = {};
    state.volgorde = [];
    state.fout = false;
    teken();
  }

  /* --------------------------------------------------------------- balkje */

  function tekenBalk(percentage) {
    var balk = el('div', 'balk');
    balk.setAttribute('role', 'progressbar');
    balk.setAttribute('aria-label', 'Voortgang');
    balk.setAttribute('aria-valuemin', '0');
    balk.setAttribute('aria-valuemax', '100');
    balk.setAttribute('aria-valuenow', String(Math.round(percentage)));
    var vulling = el('div', 'balk-vulling');
    vulling.style.width = percentage + '%';
    balk.appendChild(vulling);
    return balk;
  }

  /* ---------------------------------------------------------------- vragen */

  function tekenVraag(stap) {
    var telling = stappenTelling();
    var scherm = el('div', 'scherm');
    scherm.appendChild(tekenBalk((telling.huidig - 1) / telling.totaal * 100));

    var formulier = el('form', 'vraagform');
    var veld = el('fieldset', 'veld');
    veld.tabIndex = -1;

    var legenda = el('legend', 'vraag', stap.vraag);
    veld.appendChild(legenda);

    var isLand = stap.type === 'land';
    if (state.fout) {
      var fout = el('p', 'fout', isLand ? 'Kies een land.' : 'Kies een antwoord.');
      fout.setAttribute('role', 'alert');
      veld.appendChild(fout);
    }

    /* gekozen() geeft de waarde terug, of een lege string als er nog niets
     * gekozen is. Beide staptypes leveren die functie. */
    var gekozen = isLand ? tekenLandKeuze(veld, stap) : tekenOpties(veld, stap);
    formulier.appendChild(veld);

    var knoppen = el('div', 'knoppen');
    if (state.volgorde.length) {
      var vorige = el('button', 'knop knop--vorige', 'Vorige');
      vorige.type = 'button';
      vorige.addEventListener('click', terug);
      knoppen.appendChild(vorige);
    }
    var volgende = el('button', 'knop knop--volgende', 'Volgende');
    volgende.type = 'submit';
    knoppen.appendChild(volgende);
    formulier.appendChild(knoppen);

    /* Zolang er niets gekozen is, staat de knop grijs en gestippeld. Klikbaar
     * blijft hij wel: een uitgezette knop zegt niet wat eraan schort. */
    formulier.addEventListener('change', function () {
      volgende.classList.toggle('knop--klaar', !!gekozen());
    });

    formulier.addEventListener('submit', function (e) {
      e.preventDefault();
      var waarde = gekozen();
      if (!waarde) {
        state.fout = true;
        teken();
        return;
      }
      antwoord(stap.id, waarde);
    });

    scherm.appendChild(formulier);
    return scherm;
  }

  function tekenOpties(veld, stap) {
    var lijst = el('div', 'opties');
    stap.opties.forEach(function (optie, i) {
      var rij = el('div', 'optie');
      var keuze = document.createElement('input');
      keuze.type = 'radio';
      keuze.name = stap.id;
      keuze.id = 'optie-' + i;
      keuze.value = optie.waarde;
      var label = el('label', 'optie-label', optie.label);
      label.htmlFor = keuze.id;
      rij.appendChild(keuze);
      rij.appendChild(label);
      lijst.appendChild(rij);
    });
    veld.appendChild(lijst);

    return function () {
      var aan = lijst.querySelector('input:checked');
      return aan ? aan.value : '';
    };
  }

  /* Een gewone <select>: typen springt naar het land, hij werkt op een
   * telefoon, en een schermlezer kent hem. Daaronder de lokale tijd daar. */
  function tekenLandKeuze(veld, stap) {
    var doos = el('div', 'landkeuze');

    var keuze = document.createElement('select');
    keuze.className = 'landselect';
    keuze.id = 'land-' + stap.id;
    keuze.name = stap.id;

    var leeg = document.createElement('option');
    leeg.value = '';
    leeg.textContent = 'Kies een land…';
    keuze.appendChild(leeg);

    Object.keys(LAND.landen)
      .map(function (code) { return { code: code, naam: landnaam(code) }; })
      .sort(function (a, b) { return a.naam.localeCompare(b.naam, 'nl'); })
      .forEach(function (land) {
        var optie = document.createElement('option');
        optie.value = land.code;
        optie.textContent = land.naam;
        keuze.appendChild(optie);
      });

    doos.appendChild(keuze);

    var regel = el('p', 'landtijd');
    regel.setAttribute('aria-live', 'polite');
    doos.appendChild(regel);

    function toonTijd() {
      regel.textContent = '';
      var zone = LAND.landen[keuze.value];
      if (!zone) return;
      var moment = new Date();
      regel.appendChild(document.createTextNode(
        'Lokale tijd in ' + landnaam(keuze.value) + ': ' + tijdTekst(zone, moment) + ' — '));
      var open = isOpen(zone, moment);
      regel.appendChild(el('span', 'vlag ' + (open ? 'vlag--open' : 'vlag--dicht'),
        open ? 'de post is nu open' : 'de post is nu dicht'));
    }

    keuze.addEventListener('change', toonTijd);
    toonTijd();
    veld.appendChild(doos);

    return function () { return keuze.value; };
  }

  /* --------------------------------------------------------------- uitkomst */

  function tekenAdvies() {
    var regel = beoordeel();
    var advies = regel.advies;

    var scherm = el('div', 'scherm');
    scherm.appendChild(tekenBalk(100));

    var doos = el('div', 'advies niveau-' + advies.niveau);
    doos.tabIndex = -1;
    doos.appendChild(el('h2', 'advieskop', advies.kop));

    var metWie = el('p', 'metwie');
    metWie.appendChild(el('span', 'metwie-label', 'Overleg met'));
    metWie.appendChild(el('span', 'metwie-waarde', metWieTekst(advies)));
    doos.appendChild(metWie);

    if (advies.stappen && advies.stappen.length) {
      var ol = el('ol', 'doenlijst');
      advies.stappen.forEach(function (s) { ol.appendChild(el('li', null, s)); });
      doos.appendChild(ol);
    }
    scherm.appendChild(doos);

    var knoppen = el('div', 'knoppen');
    var opnieuwKnop = el('button', 'knop knop--volgende knop--klaar', 'Opnieuw beginnen');
    opnieuwKnop.type = 'button';
    opnieuwKnop.addEventListener('click', opnieuw);
    knoppen.appendChild(opnieuwKnop);
    scherm.appendChild(knoppen);

    return scherm;
  }

  /* ---------------------------------------------------------------- tekenen */

  function teken() {
    var app = document.getElementById('app');
    app.textContent = '';
    var stap = volgendeStap();
    var scherm = stap ? tekenVraag(stap) : tekenAdvies();
    app.appendChild(scherm);

    /* Na een klik de focus meenemen naar de nieuwe vraag, zodat een
     * schermlezer hem voorleest. Bij het eerste scherm niet: dan springt de
     * pagina zonder dat iemand iets deed. */
    if (!eersteScherm) {
      var doel = scherm.querySelector('.veld, .advies');
      if (doel) doel.focus();
    }
    eersteScherm = false;
  }

  teken();
})();
