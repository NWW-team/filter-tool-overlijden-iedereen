/*
 * Filtertool melding van overlijden — motor en scherm.
 *
 * Dit bestand bevat geen beleid. Alle vragen, regels en openingstijden staan
 * in data/beslislogica.js en data/posten.js. Wie de instructie beheert, hoeft
 * dit bestand niet aan te raken.
 */
(function () {
  'use strict';

  var L = window.FILTERLOGICA;
  var D = window.FILTERDATA;

  /* ------------------------------------------------------------------ tijd */

  var DAG_INDEX = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

  function delen(tijdzone, datum) {
    var dtf = new Intl.DateTimeFormat('en-US', {
      timeZone: tijdzone, hourCycle: 'h23', weekday: 'short',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });
    var p = {};
    dtf.formatToParts(datum).forEach(function (o) { p[o.type] = o.value; });
    var uur = parseInt(p.hour, 10) % 24;
    var minuut = parseInt(p.minute, 10);
    return {
      dagIndex: DAG_INDEX[p.weekday],
      uur: uur, minuut: minuut, minuten: uur * 60 + minuut,
      datum: p.year + '-' + p.month + '-' + p.day,
      jaar: parseInt(p.year, 10), maand: parseInt(p.month, 10), dag: parseInt(p.day, 10)
    };
  }

  function naarMinuten(hhmm) {
    var d = hhmm.split(':');
    return parseInt(d[0], 10) * 60 + parseInt(d[1], 10);
  }

  function blokken(org, d) {
    if (org.sluiting && org.sluiting.indexOf(d.datum) !== -1) return [];
    return org.uren[d.dagIndex] || [];
  }

  function isOpen(org, datum) {
    var d = delen(org.tijdzone, datum);
    return blokken(org, d).some(function (b) {
      return d.minuten >= naarMinuten(b[0]) && d.minuten < naarMinuten(b[1]);
    });
  }

  function offsetMs(tijdzone, datum) {
    var d = delen(tijdzone, datum);
    var alsUtc = Date.UTC(d.jaar, d.maand - 1, d.dag, d.uur, d.minuut);
    return alsUtc - Math.floor(datum.getTime() / 60000) * 60000;
  }

  /* Een lokale wandkloktijd terugrekenen naar een echt moment. */
  function lokaalMoment(tijdzone, jaar, maand, dag, minuten) {
    var gok = Date.UTC(jaar, maand - 1, dag, Math.floor(minuten / 60), minuten % 60);
    var ts = gok - offsetMs(tijdzone, new Date(gok));
    return new Date(gok - offsetMs(tijdzone, new Date(ts)));
  }

  function volgendeOpening(org, datum) {
    var gezien = {};
    for (var i = 0; i < 21; i++) {
      var d = delen(org.tijdzone, new Date(datum.getTime() + i * 86400000));
      if (gezien[d.datum]) continue;
      gezien[d.datum] = true;
      var lijst = blokken(org, d);
      for (var j = 0; j < lijst.length; j++) {
        var start = lokaalMoment(org.tijdzone, d.jaar, d.maand, d.dag, naarMinuten(lijst[j][0]));
        if (start.getTime() > datum.getTime()) return start;
      }
    }
    return null;
  }

  function tijdTekst(tijdzone, datum) {
    return new Intl.DateTimeFormat('nl-NL', {
      timeZone: tijdzone, weekday: 'short', day: 'numeric', month: 'short',
      hour: '2-digit', minute: '2-digit'
    }).format(datum).replace(' om ', ' ');
  }

  function klokTekst(tijdzone, datum) {
    return new Intl.DateTimeFormat('nl-NL', {
      timeZone: tijdzone, hour: '2-digit', minute: '2-digit'
    }).format(datum);
  }

  function urenTekst(org) {
    var perDag = {};
    for (var dag in org.uren) {
      perDag[dag] = org.uren[dag].map(function (b) { return b[0] + '–' + b[1]; }).join(' en ');
    }
    var waarden = Object.keys(perDag).map(function (k) { return perDag[k]; });
    var gelijk = waarden.every(function (w) { return w === waarden[0]; });
    if (gelijk && waarden.length) return org.werkweekTekst + ' ' + waarden[0] + ' (lokale tijd)';
    return org.werkweekTekst + ' (lokale tijd, wisselende uren)';
  }

  /* --------------------------------------------------------------- toestand */

  var state = {
    antwoorden: {},
    volgorde: [],
    basis: new Date(),
    gesimuleerd: false,
    klokOpen: false,
    postFilter: ''
  };

  function nu() {
    return state.gesimuleerd ? state.basis : new Date();
  }

  function zoekPost(id) {
    return D.posten.filter(function (p) { return p.id === id; })[0] || null;
  }

  /* ---------------------------------------------------------------- feiten */

  function feiten() {
    var f = {};
    for (var k in state.antwoorden) f[k] = state.antwoorden[k];
    if ('post' in state.antwoorden) {
      var post = zoekPost(state.antwoorden.post);
      f.lokaleKantoortijd = !post ? 'onbekend' : (isOpen(post, nu()) ? 'ja' : 'nee');
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
      if (voldoet(L.regels[i].wanneer, f)) return { regel: L.regels[i], feiten: f };
    }
    return { regel: L.regels[L.regels.length - 1], feiten: f };
  }

  /* ------------------------------------------------------------- hulpjes UI */

  function el(tag, klasse, tekst) {
    var n = document.createElement(tag);
    if (klasse) n.className = klasse;
    if (tekst !== undefined && tekst !== null) n.textContent = tekst;
    return n;
  }

  function labelVanStap(stapId) {
    var stap = L.stappen.filter(function (s) { return s.id === stapId; })[0];
    var waarde = state.antwoorden[stapId];
    if (!stap) return waarde;
    if (stap.type === 'post') {
      var post = zoekPost(waarde);
      return post ? post.land : 'Land onbekend';
    }
    var optie = stap.opties.filter(function (o) { return o.waarde === waarde; })[0];
    return optie ? optie.label : waarde;
  }

  function antwoord(stapId, waarde) {
    state.antwoorden[stapId] = waarde;
    if (state.volgorde.indexOf(stapId) === -1) state.volgorde.push(stapId);
    state.postFilter = '';
    teken();
  }

  function terug() {
    var laatste = state.volgorde.pop();
    if (laatste === undefined) return;
    delete state.antwoorden[laatste];
    state.postFilter = '';
    teken();
  }

  function terugNaar(stapId) {
    var index = state.volgorde.indexOf(stapId);
    if (index === -1) return;
    state.volgorde.slice(index).forEach(function (id) { delete state.antwoorden[id]; });
    state.volgorde = state.volgorde.slice(0, index);
    state.postFilter = '';
    teken();
  }

  function opnieuw() {
    state.antwoorden = {};
    state.volgorde = [];
    state.postFilter = '';
    teken();
  }

  /* ------------------------------------------------------------------ kop */

  function tekenKop() {
    var kop = el('header', 'kop');

    var merk = el('div', 'merk');
    merk.appendChild(el('span', 'merk-naam', 'Melding van overlijden'));
    merk.appendChild(el('span', 'merk-sub', 'overleggen of niet, en met wie'));
    kop.appendChild(merk);

    var rechts = el('div', 'kop-rechts');

    var klokKnop = el('button', 'klok' + (state.gesimuleerd ? ' klok--gesimuleerd' : ''));
    klokKnop.type = 'button';
    klokKnop.setAttribute('aria-expanded', String(state.klokOpen));
    klokKnop.appendChild(el('span', 'klok-plek', state.gesimuleerd ? 'Gekozen moment' : 'Nu in Nederland'));
    klokKnop.appendChild(el('span', 'klok-tijd', tijdTekst(D.casemanagement.tijdzone, nu())));
    klokKnop.addEventListener('click', function () {
      state.klokOpen = !state.klokOpen;
      teken();
    });
    rechts.appendChild(klokKnop);
    kop.appendChild(rechts);

    if (state.klokOpen) kop.appendChild(tekenKlokPaneel());
    return kop;
  }

  function tekenKlokPaneel() {
    var paneel = el('div', 'klokpaneel');
    paneel.appendChild(el('p', 'klokpaneel-uitleg',
      'Om de tool te kunnen laten zien kun je doen alsof het een ander moment is. Het advies verandert mee.'));

    var rij = el('div', 'klokpaneel-rij');
    var invoer = document.createElement('input');
    invoer.type = 'datetime-local';
    invoer.className = 'invoer';
    invoer.setAttribute('aria-label', 'Ander moment (Nederlandse tijd)');
    var d = delen(D.casemanagement.tijdzone, nu());
    invoer.value = d.jaar + '-' + String(d.maand).padStart(2, '0') + '-' + String(d.dag).padStart(2, '0') +
      'T' + String(d.uur).padStart(2, '0') + ':' + String(d.minuut).padStart(2, '0');
    invoer.addEventListener('change', function () {
      if (!invoer.value) return;
      var delenVanInvoer = invoer.value.split('T');
      var datumDelen = delenVanInvoer[0].split('-');
      var tijdDelen = delenVanInvoer[1].split(':');
      state.basis = lokaalMoment(D.casemanagement.tijdzone,
        parseInt(datumDelen[0], 10), parseInt(datumDelen[1], 10), parseInt(datumDelen[2], 10),
        parseInt(tijdDelen[0], 10) * 60 + parseInt(tijdDelen[1], 10));
      state.gesimuleerd = true;
      teken();
    });
    rij.appendChild(invoer);

    var herstel = el('button', 'knop knop--stil', 'Terug naar nu');
    herstel.type = 'button';
    herstel.addEventListener('click', function () {
      state.gesimuleerd = false;
      state.basis = new Date();
      state.klokOpen = false;
      teken();
    });
    rij.appendChild(herstel);
    paneel.appendChild(rij);
    return paneel;
  }

  /* ---------------------------------------------------------------- spoor */

  function tekenSpoor() {
    if (!state.volgorde.length) return null;
    var spoor = el('nav', 'spoor');
    spoor.setAttribute('aria-label', 'Gegeven antwoorden');
    state.volgorde.forEach(function (stapId) {
      var chip = el('button', 'chip');
      chip.type = 'button';
      chip.title = 'Terug naar deze vraag';
      chip.appendChild(el('span', 'chip-waarde', labelVanStap(stapId)));
      chip.appendChild(el('span', 'chip-kruis', '×'));
      chip.addEventListener('click', function () { terugNaar(stapId); });
      spoor.appendChild(chip);
    });
    return spoor;
  }

  /* ------------------------------------------------------------ startscherm */

  function tekenStartBoven() {
    var s = L.start;
    var doos = el('div', 'startboven');
    if (s.waarschuwing) doos.appendChild(el('p', 'startwaarschuwing', s.waarschuwing));
    if (s.positie) doos.appendChild(el('p', 'startpositie', s.positie));
    return doos;
  }

  function tekenStartOnder() {
    var s = L.start;
    var doos = el('div', 'startonder');

    if (s.kanalen && s.kanalen.length) {
      var kanalen = el('p', 'startkanalen');
      s.kanalen.forEach(function (k) {
        var regel = el('span', 'kanaal');
        regel.appendChild(document.createTextNode(k.tekst + ' '));
        regel.appendChild(link(k.link));
        kanalen.appendChild(regel);
      });
      doos.appendChild(kanalen);
    }

    if (s.checkvragen && s.checkvragen.length) {
      var uitklap = document.createElement('details');
      uitklap.className = 'checkvragen';
      var kop = document.createElement('summary');
      kop.textContent = s.checkvragenKop;
      uitklap.appendChild(kop);
      if (s.checkvragenUitleg) uitklap.appendChild(el('p', 'checkvragen-uitleg', s.checkvragenUitleg));
      var lijst = el('ul', 'checkvragen-lijst');
      s.checkvragen.forEach(function (v) { lijst.appendChild(el('li', null, v)); });
      uitklap.appendChild(lijst);
      if (s.checkvragenLink) {
        var p = el('p', 'checkvragen-link');
        p.appendChild(link(s.checkvragenLink));
        uitklap.appendChild(p);
      }
      doos.appendChild(uitklap);
    }
    return doos;
  }

  function link(gegevens) {
    var a = document.createElement('a');
    a.href = gegevens.url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = gegevens.tekst;
    return a;
  }

  /* ---------------------------------------------------------------- vragen */

  function tekenVraag(stap) {
    var kaart = el('section', 'kaart');
    var telling = stappenTelling();
    kaart.appendChild(el('p', 'stapteller', 'Vraag ' + telling.huidig + ' van ' + telling.totaal));
    kaart.appendChild(el('h1', 'vraag', stap.vraag));
    if (stap.hint) kaart.appendChild(el('p', 'hint', stap.hint));

    if (stap.type === 'post') kaart.appendChild(tekenPostKeuze(stap));
    else kaart.appendChild(tekenOpties(stap));

    if (state.volgorde.length) {
      var terugKnop = el('button', 'knop knop--stil terugknop', '← Vorige vraag');
      terugKnop.type = 'button';
      terugKnop.addEventListener('click', terug);
      kaart.appendChild(terugKnop);
    }
    return kaart;
  }

  function tekenOpties(stap) {
    var lijst = el('div', 'opties');
    stap.opties.forEach(function (optie, i) {
      var knop = el('button', 'optie');
      knop.type = 'button';
      knop.dataset.sneltoets = String(i + 1);
      knop.appendChild(el('span', 'optie-nummer', String(i + 1)));
      var tekst = el('span', 'optie-tekst');
      tekst.appendChild(el('span', 'optie-label', optie.label));
      if (optie.toelichting) tekst.appendChild(el('span', 'optie-toelichting', optie.toelichting));
      knop.appendChild(tekst);
      knop.addEventListener('click', function () { antwoord(stap.id, optie.waarde); });
      lijst.appendChild(knop);
    });
    return lijst;
  }

  function tekenPostKeuze(stap) {
    var doos = el('div', 'postkeuze');
    var moment = nu();

    var zoek = document.createElement('input');
    zoek.type = 'search';
    zoek.className = 'invoer invoer--zoek';
    zoek.placeholder = 'Typ een land of post…';
    zoek.value = state.postFilter;
    zoek.setAttribute('aria-label', 'Zoek land of post');
    zoek.addEventListener('input', function () {
      state.postFilter = zoek.value;
      vulLijst();
    });
    doos.appendChild(zoek);

    var lijst = el('div', 'postlijst');
    doos.appendChild(lijst);

    function vulLijst() {
      lijst.textContent = '';
      var term = state.postFilter.trim().toLowerCase();
      var treffers = D.posten.filter(function (p) {
        return !term || p.land.toLowerCase().indexOf(term) !== -1 || p.naam.toLowerCase().indexOf(term) !== -1;
      });
      treffers.forEach(function (post) {
        var open = isOpen(post, moment);
        var knop = el('button', 'postregel');
        knop.type = 'button';
        var links = el('span', 'postregel-links');
        links.appendChild(el('span', 'postregel-land', post.land));
        links.appendChild(el('span', 'postregel-naam', post.naam));
        knop.appendChild(links);
        var rechts = el('span', 'postregel-rechts');
        rechts.appendChild(el('span', 'postregel-tijd', klokTekst(post.tijdzone, moment)));
        rechts.appendChild(el('span', 'vlag ' + (open ? 'vlag--open' : 'vlag--dicht'), open ? 'open' : 'dicht'));
        knop.appendChild(rechts);
        knop.addEventListener('click', function () { antwoord(stap.id, post.id); });
        lijst.appendChild(knop);
      });

      var onbekend = el('button', 'postregel postregel--onbekend');
      onbekend.type = 'button';
      var l = el('span', 'postregel-links');
      l.appendChild(el('span', 'postregel-land', 'Land staat er niet bij of is onbekend'));
      l.appendChild(el('span', 'postregel-naam', 'De tool rekent de bereikbaarheid dan niet uit'));
      onbekend.appendChild(l);
      onbekend.addEventListener('click', function () { antwoord(stap.id, 'onbekend'); });
      lijst.appendChild(onbekend);
    }

    vulLijst();
    setTimeout(function () { zoek.focus(); }, 0);
    return doos;
  }

  /* --------------------------------------------------------------- uitkomst */

  function tekenUitkomst() {
    var uitkomst = beoordeel();
    var regel = uitkomst.regel;
    var advies = regel.advies;
    var f = uitkomst.feiten;

    var wrap = el('div', 'uitkomst');

    var kaart = el('section', 'kaart kaart--advies niveau-' + advies.niveau);
    kaart.appendChild(el('p', 'adviesmerk', niveauTekst(advies.niveau)));
    kaart.appendChild(el('h1', 'advieskop', advies.kop));
    var metWie = el('div', 'metwie');
    metWie.appendChild(el('span', 'metwie-label', 'Met wie'));
    metWie.appendChild(el('span', 'metwie-waarde', advies.metWie));
    if (advies.metWieLink) {
      var linkRegel = el('span', 'metwie-link');
      linkRegel.appendChild(link(advies.metWieLink));
      metWie.appendChild(linkRegel);
    }
    kaart.appendChild(metWie);

    if (advies.stappen && advies.stappen.length) {
      var ol = el('ol', 'doenlijst');
      advies.stappen.forEach(function (s) { ol.appendChild(el('li', null, s)); });
      kaart.appendChild(ol);
    }
    wrap.appendChild(kaart);

    if (advies.anders && advies.anders.length) wrap.appendChild(tekenAnders(advies.anders));
    wrap.appendChild(tekenWaarom(regel, f));

    var bereik = el('div', 'bereikbaarheid');
    bereik.appendChild(tekenBereikbaarheid(D.casemanagement, 'Nederland'));
    if ('post' in state.antwoorden) {
      var post = zoekPost(state.antwoorden.post);
      if (post) bereik.appendChild(tekenBereikbaarheid(post, 'In het land'));
      else bereik.appendChild(tekenOnbekendePost());
    }
    wrap.appendChild(bereik);

    var acties = el('div', 'acties');
    var opnieuwKnop = el('button', 'knop knop--hoofd', 'Volgende beller');
    opnieuwKnop.type = 'button';
    opnieuwKnop.addEventListener('click', opnieuw);
    acties.appendChild(opnieuwKnop);

    var terugKnop = el('button', 'knop knop--stil', '← Vorige vraag');
    terugKnop.type = 'button';
    terugKnop.addEventListener('click', terug);
    acties.appendChild(terugKnop);

    var kopieer = el('button', 'knop knop--stil', 'Kopieer notitie voor Hermes');
    kopieer.type = 'button';
    kopieer.addEventListener('click', function () {
      var tekst = adviesAlsTekst(regel, f);
      var klaar = function () { kopieer.textContent = 'Gekopieerd'; setTimeout(function () { kopieer.textContent = 'Kopieer notitie voor Hermes'; }, 1800); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(tekst).then(klaar, function () { window.prompt('Kopieer met Ctrl/Cmd + C', tekst); });
      } else {
        window.prompt('Kopieer met Ctrl/Cmd + C', tekst);
      }
    });
    acties.appendChild(kopieer);
    wrap.appendChild(acties);

    return wrap;
  }

  function tekenAnders(anders) {
    var doos = el('section', 'kaart kaart--anders');
    doos.appendChild(el('h2', 'kaartkop', 'Loopt het anders?'));
    var lijst = el('dl', 'anderslijst');
    anders.forEach(function (geval) {
      lijst.appendChild(el('dt', null, geval.vraag));
      var dd = el('dd', null, geval.antwoord);
      if (geval.link) {
        dd.appendChild(document.createTextNode(' '));
        dd.appendChild(link(geval.link));
      }
      lijst.appendChild(dd);
    });
    doos.appendChild(lijst);
    return doos;
  }

  function niveauTekst(niveau) {
    if (niveau === 'direct') return 'Nu handelen';
    if (niveau === 'overleg') return 'Overleggen';
    return 'Zelf afhandelen';
  }

  function tekenWaarom(regel, f) {
    var doos = el('section', 'kaart kaart--waarom');
    doos.appendChild(el('h2', 'kaartkop', 'Waarom dit advies'));
    doos.appendChild(el('p', 'regelnaam', regel.naam));

    var lijst = el('ul', 'feitenlijst');
    var getoond = {};

    state.volgorde.forEach(function (stapId) {
      getoond[stapId] = true;
      var stap = L.stappen.filter(function (s) { return s.id === stapId; })[0];
      lijst.appendChild(feitRegel(stap ? stap.vraag : stapId, labelVanStap(stapId)));
    });

    (L.toonFeiten || []).forEach(function (sleutel) {
      if (f[sleutel] === undefined) return;
      var meta = L.feitLabels[sleutel];
      lijst.appendChild(feitRegel(meta.label, meta.waardes[f[sleutel]] || f[sleutel]));
    });

    doos.appendChild(lijst);
    if (regel.advies.toelichting) doos.appendChild(el('p', 'toelichting', regel.advies.toelichting));
    doos.appendChild(el('p', 'grondslag', 'Grondslag: ' + regel.grondslag + ' · logica ' + L.versie + ', bijgewerkt ' + L.bijgewerkt));
    return doos;
  }

  function feitRegel(vraag, waarde) {
    var li = el('li', 'feit');
    li.appendChild(el('span', 'feit-vraag', vraag));
    li.appendChild(el('span', 'feit-waarde', waarde));
    return li;
  }

  function tekenBereikbaarheid(org, kopje) {
    var moment = nu();
    var open = isOpen(org, moment);
    var kaart = el('section', 'kaart kaart--bereik');
    kaart.appendChild(el('p', 'bereik-kopje', kopje));

    var rij = el('div', 'bereik-rij');
    rij.appendChild(el('span', 'bereik-naam', org.naam));
    rij.appendChild(el('span', 'vlag ' + (open ? 'vlag--open' : 'vlag--dicht'), open ? 'nu open' : 'nu dicht'));
    kaart.appendChild(rij);

    var zelfdeZone = org.tijdzone === D.casemanagement.tijdzone;
    kaart.appendChild(el('p', 'bereik-tijd',
      (zelfdeZone ? 'Het is nu ' : 'Daar is het ') + tijdTekst(org.tijdzone, moment)));
    kaart.appendChild(el('p', 'bereik-uren', urenTekst(org)));

    if (!open) {
      var volgende = volgendeOpening(org, moment);
      if (volgende) {
        kaart.appendChild(el('p', 'bereik-volgende', zelfdeZone
          ? 'Weer open: ' + tijdTekst(org.tijdzone, volgende)
          : 'Weer open: ' + tijdTekst(org.tijdzone, volgende) + ' daar — ' +
            tijdTekst(D.casemanagement.tijdzone, volgende) + ' in Nederland'));
      }
      if (org.buitenUren) kaart.appendChild(el('p', 'bereik-nood', org.buitenUren));
    }
    if (org.opmerking) kaart.appendChild(el('p', 'bereik-opmerking', org.opmerking));
    return kaart;
  }

  function tekenOnbekendePost() {
    var kaart = el('section', 'kaart kaart--bereik');
    kaart.appendChild(el('p', 'bereik-kopje', 'In het land'));
    var rij = el('div', 'bereik-rij');
    rij.appendChild(el('span', 'bereik-naam', 'Post onbekend'));
    rij.appendChild(el('span', 'vlag vlag--onbekend', 'niet uitgerekend'));
    kaart.appendChild(rij);
    kaart.appendChild(el('p', 'bereik-uren', 'De tool kent dit land niet, dus ze doet geen uitspraak over de openingstijd daar.'));
    return kaart;
  }

  function adviesAlsTekst(regel, f) {
    var post = 'post' in state.antwoorden ? zoekPost(state.antwoorden.post) : null;
    var r = [];
    r.push('Subject: Melding van overlijden - ' + regel.advies.kop);
    r.push('');
    r.push('Vervolgstap volgens de filtertool: ' + regel.advies.kop + '.');
    r.push('Met wie: ' + regel.advies.metWie + '.');
    r.push('Moment: ' + tijdTekst(D.casemanagement.tijdzone, nu()) + ' (NL)' +
      (post ? ', ter plaatse ' + tijdTekst(post.tijdzone, nu()) : '') +
      (state.gesimuleerd ? ' [gesimuleerd moment]' : ''));
    r.push('');
    r.push('Antwoorden:');
    state.volgorde.forEach(function (stapId) {
      var stap = L.stappen.filter(function (s) { return s.id === stapId; })[0];
      r.push('- ' + (stap ? stap.vraag : stapId) + ' ' + labelVanStap(stapId));
    });
    (L.toonFeiten || []).forEach(function (sleutel) {
      if (f[sleutel] === undefined) return;
      r.push('- ' + L.feitLabels[sleutel].label + ': ' +
        (L.feitLabels[sleutel].waardes[f[sleutel]] || f[sleutel]));
    });
    r.push('');
    r.push('Regel: ' + regel.naam + ' (' + regel.grondslag + ', filtertool ' + L.versie + ')');
    return r.join('\n');
  }

  /* ------------------------------------------------------------------ voet */

  function tekenVoet() {
    var voet = el('footer', 'voet');
    if (D.waarschuwing) voet.appendChild(el('p', 'waarschuwing', D.waarschuwing));
    voet.appendChild(el('p', 'voet-bron', 'Volgt: ' + L.bron + ' · filtertool ' + L.versie + ', bijgewerkt ' + L.bijgewerkt));
    return voet;
  }

  /* ---------------------------------------------------------------- tekenen */

  function teken() {
    var app = document.getElementById('app');
    app.textContent = '';
    app.appendChild(tekenKop());

    var hoofd = el('main', 'hoofd');
    var spoor = tekenSpoor();
    if (spoor) hoofd.appendChild(spoor);

    var stap = volgendeStap();
    if (stap) {
      var beginscherm = !state.volgorde.length;
      if (beginscherm) hoofd.appendChild(tekenStartBoven());
      hoofd.appendChild(tekenVraag(stap));
      if (beginscherm) hoofd.appendChild(tekenStartOnder());
    } else {
      hoofd.appendChild(tekenUitkomst());
    }
    app.appendChild(hoofd);
    app.appendChild(tekenVoet());
  }

  /* Sneltoetsen: cijfers kiezen een optie, Backspace gaat terug. */
  document.addEventListener('keydown', function (e) {
    var actief = document.activeElement;
    var inInvoer = actief && (actief.tagName === 'INPUT' || actief.tagName === 'TEXTAREA');
    if (e.key === 'Backspace' && !inInvoer) { e.preventDefault(); terug(); return; }
    if (e.key === 'Escape') { opnieuw(); return; }
    if (inInvoer) return;
    if (/^[1-9]$/.test(e.key)) {
      var knop = document.querySelector('.optie[data-sneltoets="' + e.key + '"]');
      if (knop) { e.preventDefault(); knop.click(); }
    }
  });

  /* Loopt de klok door een openingstijd heen, dan klopt het scherm vanzelf
   * weer bij. Alleen opnieuw tekenen als er echt iets verandert, anders
   * springt de voorlichter midden in een vraag uit zijn focus. */
  function bereikbaarheidsVingerafdruk() {
    var moment = nu();
    return [isOpen(D.casemanagement, moment)].concat(D.posten.map(function (p) {
      return isOpen(p, moment) ? 1 : 0;
    })).join('');
  }

  var laatsteVingerafdruk = bereikbaarheidsVingerafdruk();
  setInterval(function () {
    if (state.gesimuleerd || state.klokOpen) return;
    var huidig = bereikbaarheidsVingerafdruk();
    if (huidig === laatsteVingerafdruk) return;
    laatsteVingerafdruk = huidig;
    teken();
  }, 30000);

  teken();
})();
