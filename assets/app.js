/*
 * Filtertool melding van overlijden — motor en scherm.
 *
 * Dit bestand bevat geen beleid. Alle vragen en regels staan in
 * data/beslislogica.js. Wie de instructie beheert, hoeft dit bestand niet aan
 * te raken.
 *
 * Eén vraag per scherm, keuzerondjes, Volgende. Aan het eind één advies.
 */
(function () {
  'use strict';

  var L = window.FILTERLOGICA;

  /* --------------------------------------------------------------- toestand */

  var state = {
    antwoorden: {},
    volgorde: [],
    fout: false
  };

  var eersteScherm = true;

  /* ---------------------------------------------------------------- feiten */

  /* Het enige feit dat de tool zelf afleidt. */
  function feiten() {
    var f = {};
    for (var k in state.antwoorden) f[k] = state.antwoorden[k];
    f.caribisch = (f.bellerLand === 'caribisch' || f.overlijdenLand === 'caribisch') ? 'ja' : 'nee';
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
    var punt = L.aanspreekpunten[state.antwoorden.bellerLand] || L.aanspreekpunten.onbekend;
    if (advies.metWieSoort === 'dda') return punt.dda;
    if (advies.metWieSoort === 'auto') {
      return state.antwoorden.kantoortijd === 'nee' ? punt.dda : punt.naam;
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

    if (state.fout) {
      var fout = el('p', 'fout', 'Kies een antwoord.');
      fout.setAttribute('role', 'alert');
      veld.appendChild(fout);
    }

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
      volgende.classList.toggle('knop--klaar', !!formulier.querySelector('input:checked'));
    });

    formulier.addEventListener('submit', function (e) {
      e.preventDefault();
      var gekozen = formulier.querySelector('input:checked');
      if (!gekozen) {
        state.fout = true;
        teken();
        return;
      }
      antwoord(stap.id, gekozen.value);
    });

    scherm.appendChild(formulier);
    return scherm;
  }

  /* --------------------------------------------------------------- uitkomst */

  function tekenAdvies() {
    var regel = beoordeel();
    var advies = regel.advies;

    var scherm = el('div', 'scherm');
    scherm.appendChild(tekenBalk(100));

    var doos = el('div', 'advies niveau-' + advies.niveau);
    doos.tabIndex = -1;
    doos.appendChild(el('h1', 'advieskop', advies.kop));

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
