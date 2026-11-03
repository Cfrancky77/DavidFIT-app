/* Training : suivi des séances en salle.
 * Stockage local (localStorage) : historique, séance en cours, machines personnalisées, charges ajoutées. */
(function () {
  'use strict';

  const DATA = window.SEANCES_DATA;
  const BR = Object.assign({ nomApp: 'Training', coach: '', logo: null, accueil: '', contact: {} }, window.BRANDING || {});
  BR.contact = BR.contact || {};
  const hasContact = () => Object.values(BR.contact).some((v) => v && String(v).trim());
  document.title = BR.nomApp;
  if (BR.couleur) {
    const st = document.createElement('style');
    st.textContent = `:root { --accent: ${BR.couleur} !important; --on-accent: ${BR.couleurTexte || '#fff'} !important; --accent-soft: ${BR.couleur}29 !important; }`;
    document.head.appendChild(st);
  }
  const K = { history: 'tr_history', current: 'tr_current', machines: 'tr_machines', photos: 'tr_photos' };

  // ---------- stockage ----------
  function load(key, def) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; } catch (e) { return def; }
  }
  function save(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { alert('Sauvegarde impossible : ' + e.message); }
  }
  const getHistory = () => load(K.history, []);
  const setHistory = (h) => save(K.history, h);
  const getCurrent = () => load(K.current, null);
  const setCurrent = (c) => c ? save(K.current, c) : localStorage.removeItem(K.current);
  const getMachines = () => load(K.machines, {});
  const getPhotos = () => load(K.photos, {});

  // ---------- utilitaires ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const getCustom = () => load('tr_custom', []);
  const getCoach = () => load('tr_coach', { seances: [] }).seances || [];
  // Dès que les programmes du coach sont arrivés, ils remplacent les séances intégrées (gardées pour l'historique).
  const baseSeances = () => (getCoach().length ? getCoach() : DATA.seances);
  const allSeances = () => baseSeances().concat(getCustom());
  const knownSeances = () => DATA.seances.concat(getCoach(), getCustom());
  const isCoach = (id) => getCoach().some((s) => s.id === id);
  const isCustom = (id) => getCustom().some((s) => s.id === id);
  const seanceById = (id) => knownSeances().find((s) => s.id === id);
  const nomSeance = (x) => (seanceById(x.seanceId) || {}).nom || x.seanceNom || 'Séance supprimée';
  const allExercices = () => knownSeances().flatMap((s) => s.exercices.map((e) => ({ ...e, seance: s })));
  const exById = (id) => allExercices().find((e) => e.id === id);
  const machineName = (key) => DATA.machines[key] || key;
  const fmtTime = (s) => `${Math.floor(s / 60)}:${String(Math.max(0, s % 60)).padStart(2, '0')}`;
  const pad = (n) => String(n).padStart(2, '0');
  const dayKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const fmtDate = (iso) => new Date(iso).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  const fmtShort = (iso) => new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  const repsMin = (r) => (timedSec(r) || parseInt(String(r), 10) || '');
  // Exercice en durée (gainage…) : Reps = « 45 s », « 1 min », « 1 min 30 », « 0:45 ». Renvoie les secondes, sinon 0.
  function timedSec(r) {
    const t = String(r ?? '').trim().toLowerCase();
    let m = t.match(/^(\d+)\s*:\s*(\d{2})$/); if (m) return +m[1] * 60 + +m[2];
    m = t.match(/^(\d+)\s*(?:min|mn)\s*(\d+)?\s*(?:s|sec)?$/); if (m) return +m[1] * 60 + (+m[2] || 0);
    m = t.match(/^(\d+)\s*(?:s|sec|secondes?|")$/); return m ? +m[1] : 0;
  }
  // Affichage d'une série enregistrée (st.sec = série en durée)
  const fmtSet = (st, sep = '×') => (st.sec ? `${num(st.kg) ? st.kg + ' kg · ' : ''}${fmtTime(num(st.reps) || 0)}` : `${st.kg || 0}${sep}${st.reps}`);
  const num = (v) => { const n = parseFloat(String(v).replace(',', '.')); return isFinite(n) ? n : null; };

  // Réglage machine/photo d'un exercice ; à défaut, celui du même exercice des séances intégrées (même nom).
  const twinId = (ex) => { const k = String(ex.nom || '').trim().toLowerCase(); const t = DATA.seances.flatMap((s) => s.exercices).find((e) => e.id !== ex.id && e.nom.trim().toLowerCase() === k); return t && t.id; };
  function machineFor(ex) {
    // Exercice remplacé en séance : ni réglage machine, ni photo, ni image de l'exercice d'origine.
    const M = getMachines(); const P = getPhotos(); const tw = ex.remplace ? null : twinId(ex);
    const custom = ex.remplace ? null : (M[ex.id] || (tw && M[tw]));
    return {
      main: custom || machineName(ex.machine),
      custom: !!custom,
      alts: (ex.alternatives || []).map(machineName),
      photo: ex.remplace ? null : (P[ex.id] || (tw && P[tw]) || null),
      stock: ex.remplace ? (ex.img || null) : (ex.img || ex.id),
    };
  }

  // ---------- photos de machines ----------
  // Réduit l'image (côté max 640 px, JPEG) pour tenir dans le stockage local.
  function pickPhoto(exId, done) {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = 'image/*';
    inp.onchange = () => {
      const f = inp.files && inp.files[0];
      if (!f) return;
      const url = URL.createObjectURL(f);
      const img = new Image();
      img.onload = () => {
        const r = Math.min(1, 640 / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * r); c.height = Math.round(img.height * r);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        const ph = getPhotos(); ph[exId] = c.toDataURL('image/jpeg', 0.75);
        save(K.photos, ph); done();
      };
      img.onerror = () => alert('Image illisible.');
      img.src = url;
    };
    inp.click();
  }
  function removePhoto(exId, done) {
    if (!confirm('Supprimer la photo de cette machine ?')) return;
    const ph = getPhotos(); delete ph[exId]; save(K.photos, ph); done();
  }
  // Images par défaut : Free Exercise DB (domaine public), position de départ (_0) et d'arrivée (_1).
  const STOCK = ['front_squat', 'deadlift', 'hip_thrust', 'fente_bulgare', 'leg_extension', 'tirage_vertical', 'rowing_ez',
    'retropulsion_corde', 'tirage_bucheron', 'curl_poulie_basse', 'dev_couche', 'dev_incline_halteres', 'dev_militaire',
    'ecarte_vis_a_vis', 'extension_triceps', 'rameur', 'elliptique', 'velo', 'pompes'].concat(window.STOCK_EXTRA || [])
    .concat(((window.REPLACEMENTS || {}).groupes || []).flatMap((g) => g.exercices.map((e) => e.img)).filter(Boolean));
  const stockKey = (name) => { const k = String(name).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); return STOCK.includes(k) ? k : null; };
  function showPhoto(src, stock) {
    const o = document.createElement('div');
    o.className = 'photo-overlay';
    const close = () => { o.remove(); document.removeEventListener('keydown', onKey); };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    o.innerHTML = `<button class="photo-close" aria-label="Fermer l'image">✕ Fermer</button><div class="stock-pair">${stock
      ? `<img src="img/${stock}_0.jpg" alt="Départ"><img src="img/${stock}_1.jpg" alt="Arrivée"><p class="photo-hint">Image indicative</p>`
      : `<img src="${src}" alt="Photo de la machine">`}
      <p class="photo-hint">Touche l'écran ou « Fermer » pour revenir</p></div>`;
    o.onclick = close;
    document.addEventListener('keydown', onKey);
    document.body.appendChild(o);
  }
  const thumbHtml = (m, cls = 'thumb') => m.photo
    ? `<img class="${cls}" src="${m.photo}" alt="Machine" data-photo>`
    : (m.stock && STOCK.includes(m.stock) ? `<img class="${cls}" src="img/${m.stock}_0.jpg" alt="Exercice" data-photo data-stock="${m.stock}">` : '');
  const thumb = (m) => thumbHtml(m);
  function bindThumbs(root) {
    root.querySelectorAll('img[data-photo]').forEach((im) => { im.onclick = (e) => { e.preventDefault(); showPhoto(im.src, im.dataset.stock); }; });
  }

  // Clé de regroupement : même nom d'exercice = même suivi, quel que soit le programme.
  const nameKey = (n) => String(n || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  const exName = (x, exId) => (x.exNoms && x.exNoms[exId]) || (exById(exId) || {}).nom || null;
  // Dernières séries faites pour cet exercice (même id, sinon même nom dans un autre programme).
  // `nom` : nom de l'exercice quand il a été remplacé en séance (on cherche alors seulement par ce nom).
  function lastSetsFor(exId, nom) {
    const h = getHistory();
    const orig = (exById(exId) || {}).nom;
    const swapped = !!nom && nameKey(nom) !== nameKey(orig);
    const key = nameKey(nom || orig);
    for (let i = h.length - 1; i >= 0; i--) {
      const x = h[i];
      for (const [id, sets] of Object.entries(x.exercices || {})) {
        if (((!swapped && id === exId) || (key && nameKey(exName(x, id)) === key)) && sets.some((st) => st.done)) return { date: x.date, sets };
      }
    }
    return null;
  }
  // Toutes les séances regroupées par nom d'exercice : { key: { nom, pts: [{date,id,sets}] } }
  function progressByName() {
    const map = {};
    getHistory().forEach((x) => {
      Object.entries(x.exercices || {}).forEach(([id, sets]) => {
        const nom = exName(x, id); if (!nom) return;
        const k = nameKey(nom);
        const done = sets.filter((st) => st.done);
        if (!done.length) return;
        (map[k] = map[k] || { nom, pts: [] }).pts.push({ date: x.date, id: x.id, kg: bestKg(sets), sets: done, seance: nomSeance(x) });
        map[k].nom = nom;
      });
    });
    return map;
  }

  function bestKg(sets) {
    const kgs = (sets || []).filter((s) => s.done && num(s.kg) !== null).map((s) => num(s.kg));
    return kgs.length ? Math.max(...kgs) : null;
  }

  // ---------- vibration / bip ----------
  function buzz() {
    try {
      const H = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Haptics;
      if (H) H.vibrate({ duration: 800 }); else if (navigator.vibrate) navigator.vibrate([400, 150, 400]);
    } catch (e) { /* ignore */ }
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      [0, 0.35].forEach((t) => {
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.frequency.value = 880; o.connect(g); g.connect(ctx.destination);
        g.gain.setValueAtTime(0.3, ctx.currentTime + t);
        o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + 0.25);
      });
    } catch (e) { /* ignore */ }
  }

  // ---------- minuteur de repos (popup) ----------
  // opts.label : titre (« Repos » par défaut) ; opts.onDone : appelé à la fin au lieu du « Go ! »
  // (sert à enchaîner échauffement → récupération). Au-delà d'une minute, affichage m:ss.
  const timer = { end: 0, tick: null, paused: 0, onDone: null, long: false };
  function startTimer(seconds, next, opts = {}) {
    timer.end = Date.now() + seconds * 1000;
    timer.paused = 0; timer.onDone = opts.onDone || null; timer.long = seconds >= 60;
    $('#timer-label').textContent = opts.label || 'Repos';
    $('#timer-unit').textContent = timer.long ? 'minutes' : 'secondes';
    $('#timer-next').innerHTML = next ? 'Ensuite : <b>' + esc(next) + '</b>' : '';
    $('#timer-pause').textContent = 'Pause';
    $('#timer').hidden = false;
    $('#timer').classList.remove('finished', 'paused');
    clearInterval(timer.tick);
    timer.tick = setInterval(updateTimer, 250);
    updateTimer();
  }
  function closeTimer() { clearInterval(timer.tick); timer.onDone = null; $('#timer').hidden = true; }
  function updateTimer() {
    if (timer.paused) return;
    const left = Math.ceil((timer.end - Date.now()) / 1000);
    if (left <= 0) {
      clearInterval(timer.tick);
      buzz();
      const done = timer.onDone; timer.onDone = null;
      if (done) { done(); return; }
      $('#timer-value').textContent = 'Go !';
      $('#timer').classList.add('finished');
      setTimeout(() => { if (!timer.paused && Date.now() >= timer.end && $('#timer').classList.contains('finished')) closeTimer(); }, 3000);
      return;
    }
    $('#timer-value').textContent = timer.long ? fmtTime(left) : left;
  }
  function shiftTimer(delta) {
    if ($('#timer').classList.contains('finished')) { if (delta > 0) startTimer(delta, null); return; }
    if (timer.paused) { timer.paused = Math.max(1000, timer.paused + delta * 1000); $('#timer-value').textContent = timer.long ? fmtTime(Math.ceil(timer.paused / 1000)) : Math.ceil(timer.paused / 1000); return; }
    timer.end = Math.max(Date.now() + 1000, timer.end + delta * 1000); updateTimer();
  }
  function togglePause() {
    if ($('#timer').classList.contains('finished')) return;
    if (timer.paused) {
      timer.end = Date.now() + timer.paused; timer.paused = 0;
      $('#timer-pause').textContent = 'Pause'; $('#timer').classList.remove('paused');
      timer.tick = setInterval(updateTimer, 250); updateTimer();
    } else {
      timer.paused = Math.max(1000, timer.end - Date.now()); clearInterval(timer.tick);
      $('#timer-pause').textContent = 'Reprendre'; $('#timer').classList.add('paused');
    }
  }
  $('#timer-plus').onclick = () => shiftTimer(15);
  $('#timer-minus').onclick = () => shiftTimer(-15);
  $('#timer-pause').onclick = togglePause;
  $('#timer-skip').onclick = () => {
    // « Passer » pendant l'échauffement saute directement à la récupération
    const done = timer.onDone; closeTimer(); if (done) done();
  };

  // ---------- partage de la progression avec le coach (facultatif, choix de l'élève) ----------
  // Après chaque séance, un résumé est envoyé à BR.partageUrl (script Google du coach). File d'attente locale :
  // un envoi raté (hors ligne…) repart au prochain lancement ou bouton « Envoyer maintenant ». Le script ignore les doublons (id).
  const shareOn = () => !!BR.partageUrl && !!load('tr_partage', false) && !!load('tr_client', '');
  function sharePayload(x) {
    const exercices = Object.entries(x.exercices || {}).map(([id, sets]) => ({
      nom: exName(x, id) || id,
      series: sets.filter((st) => st.done).map((st) => ({ kg: num(st.kg) || 0, reps: num(st.reps) || 0, duree: !!st.sec })),
    })).filter((e) => e.series.length);
    return { v: 1, id: x.id, client: load('tr_client', ''), date: x.date, fin: x.fin || '', seance: nomSeance(x), echauffement: !!x.echauffement, finisher: !!x.finisher, note: x.note || '', exercices };
  }
  async function postShare(p) {
    const opts = { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(p) };
    try {
      const r = await fetch(BR.partageUrl, opts);
      if (!r.ok) return false;
      try { const j = await r.json(); return !!(j && j.ok); } catch (e) { return true; }
    } catch (e) {
      // réponse illisible (CORS) mais envoi possible : on renvoie sans lire la réponse ; un doublon est ignoré côté script
      try { await fetch(BR.partageUrl, { ...opts, mode: 'no-cors' }); return true; } catch (e2) { return false; }
    }
  }
  let sharing = false;
  async function flushShare() {
    if (sharing || !shareOn()) return 0;
    sharing = true; let sent = 0;
    try {
      let q = load('tr_outbox', []);
      while (q.length) {
        const first = q[0];
        if (!(await postShare(first))) break;
        q = load('tr_outbox', []).filter((x) => x.id !== first.id); save('tr_outbox', q); sent++;
      }
    } finally { sharing = false; }
    return sent;
  }
  function queueShare(x) {
    if (!shareOn()) return;
    const q = load('tr_outbox', []);
    if (!q.some((p) => p.id === x.id)) { q.push(sharePayload(x)); save('tr_outbox', q); }
    flushShare();
  }
  window.addEventListener('online', () => { flushShare(); });

  // ---------- séance en cours ----------
  // Séries vierges d'un exercice, charge reprise de la dernière fois (n séries, par défaut ex.series).
  function freshSets(ex, n) {
    const last = lastSetsFor(ex.id, ex.nom);
    return Array.from({ length: n || ex.series }, (_, i) => {
      const prev = last && last.sets[i];
      return { kg: prev && prev.kg !== '' ? prev.kg : '', reps: repsMin(ex.reps), done: false, ...(timedSec(ex.reps) ? { sec: true } : {}) };
    });
  }
  function newSession(seance) {
    const exercices = {};
    seance.exercices.forEach((ex) => { exercices[ex.id] = freshSets(ex); });
    return { id: 'S' + Date.now(), seanceId: seance.id, seanceNom: seance.nom, exNoms: Object.fromEntries(seance.exercices.map((e) => [e.id, e.nom])), date: new Date().toISOString(), exercices, echauffement: false, finisher: false, note: '' };
  }

  // ---------- vues ----------
  const view = $('#view');
  function setTitle(t, back) {
    $('#title').textContent = t;
    $('#btn-back').hidden = !back;
    $('#btn-back').onclick = () => { location.hash = back || '#/'; };
  }
  function setTab(tab) {
    document.querySelectorAll('.tabbar a').forEach((a) => a.classList.toggle('active', a.dataset.tab === tab));
  }

  // durée estimée : ~45 s par série + repos, + 5 min échauffement + 10 min finisher
  const estimMin = (s) => Math.round(s.exercices.reduce((t, e) => t + e.series * ((timedSec(e.reps) || 45) + e.repos_s) * (e.par_cote ? 1.6 : 1), 0) / 60 + 15);
  const lastOf = (h, sid) => [...h].reverse().find((x) => x.seanceId === sid);
  function suggestedSeance(h) {
    // la séance faite il y a le plus longtemps (ou jamais faite)
    return [...allSeances()].sort((a, b) => ((lastOf(h, a.id) || {}).date || '').localeCompare((lastOf(h, b.id) || {}).date || ''))[0];
  }

  function viewHome() {
    setTitle(BR.nomApp); setTab('home');
    const cur = getCurrent();
    const h = getHistory();
    const now = new Date();
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
    const doneDays = new Set(h.map((x) => dayKey(new Date(x.date))));
    const weekCount = h.filter((x) => new Date(x.date) >= monday).length;
    const monthCount = h.filter((x) => { const d = new Date(x.date); return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth(); }).length;
    const hour = now.getHours();
    const goal = load('tr_goal', 3);
    const prenom = load('tr_prenom', '');
    let html = `${BR.logo ? `<div class="brand"><img src="${esc(BR.logo)}" alt="${esc(BR.nomApp)}" onerror="this.parentNode.remove()">
        <div><div class="brand-name">${esc(BR.nomApp)}</div>${BR.coach ? `<div class="muted">par ${esc(BR.coach)}</div>` : ''}</div></div>` : ''}
      <div class="hello">${hour < 18 ? 'Bonjour' : 'Bonsoir'}${prenom ? ' ' + esc(prenom) : ''} 👋</div>
      <div class="muted">${BR.accueil ? esc(BR.accueil) + ' · ' : ''}${now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
      <p></p>${updateHtml()}<div class="card"><div class="row between"><b>Cette semaine</b><a class="link-accent" href="#/agenda">Agenda ›</a></div>
      <div class="row between" style="margin-top:8px"><span>Objectif : <b class="${weekCount >= goal ? 'goal-ok' : ''}" style="font-size:18px">${weekCount}</b> / ${goal} séances</span>
      <button class="btn small ghost" id="goal">Modifier</button></div>
      <div class="progress"><div style="width:${Math.min(100, Math.round(100 * weekCount / goal))}%"></div></div><div class="week">`;
    ['L', 'M', 'M', 'J', 'V', 'S', 'D'].forEach((d, i) => {
      const day = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
      const k = dayKey(day);
      html += `<div class="${doneDays.has(k) ? 'done' : ''} ${k === dayKey(now) ? 'today' : ''}"><div class="wd">${d}</div><div class="wn">${day.getDate()}</div><div class="mark">${doneDays.has(k) ? '✓' : ''}</div></div>`;
    });
    html += `</div><div class="stats"><div class="stat"><b>${weekCount}</b><span>cette semaine</span></div>
      <div class="stat"><b>${monthCount}</b><span>ce mois-ci</span></div><div class="stat"><b>${h.length}</b><span>au total</span></div></div></div>`;
    if (cur) {
      const s = seanceById(cur.seanceId);
      const all = Object.values(cur.exercices).flat();
      const pct = Math.round(100 * all.filter((x) => x.done).length / Math.max(1, all.length));
      html += `<a class="card link suggest" href="#/seance/${s.id}"><div class="row between"><h3>En cours : ${esc(s.nom)}</h3><span class="badge accent">Reprendre</span></div>
        <div class="progress"><div style="width:${pct}%"></div></div><div class="muted" style="margin-top:4px">${pct} % des séries faites</div></a>`;
    } else {
      const s = suggestedSeance(h);
      const last = lastOf(h, s.id);
      html += `<a class="card link suggest" href="#/seance/${s.id}"><div class="muted">Prochaine séance conseillée</div>
        <div class="row between"><h3 style="font-size:19px">${esc(s.nom)}</h3><span class="badge accent">Go</span></div>
        <div class="muted">≈ ${estimMin(s)} min · ${s.exercices.length} exercices · ${last ? 'dernière fois ' + fmtDate(last.date) : 'jamais faite'}</div></a>`;
    }
    html += `<div class="row between"><h2>Dernières séances</h2>${h.length ? '<a class="link-accent" href="#/agenda">Tout voir ›</a>' : ''}</div>`;
    if (!h.length) html += `<p class="muted">Aucune séance enregistrée pour l'instant. Lance ta première depuis l'onglet Entraînement.</p>`;
    [...h].reverse().slice(0, 3).forEach((x) => {
      const nb = Object.values(x.exercices).flat().filter((st) => st.done).length;
      html += `<a class="card link" href="#/historique/${x.id}"><div class="row between"><b>${esc(nomSeance(x))}</b><span class="muted">${fmtDate(x.date)}</span></div><div class="muted">${nb} séries</div></a>`;
    });
    view.innerHTML = html;
    $('#goal').onclick = () => {
      const v = prompt('Objectif de séances par semaine', goal);
      const n = parseInt(v, 10);
      if (v !== null && n >= 1 && n <= 14) { save('tr_goal', n); viewHome(); }
    };
  }

  function viewEntrainement() {
    setTitle('Entraînement'); setTab('train');
    const h = getHistory();
    const cur = getCurrent();
    let html = `<div class="row" style="gap:8px;margin-bottom:12px">
      <a class="btn small" href="#/editer/new">+ Créer</a>
      <a class="btn small ghost" href="#/bibliotheque">Bibliothèque</a>
      <button class="btn small ghost" id="impfile">Importer</button></div>${coachSyncHtml()}`;
    const card = (s) => {
      const last = lastOf(h, s.id);
      return `<a class="card link scard" href="#/seance/${s.id}">
        <div class="banner" style="${bannerStyle(s)}"><h3>${esc(s.nom)}</h3></div>
        <div class="body"><div class="chips"><span class="badge">≈ ${estimMin(s)} min</span>${s.niveau ? `<span class="badge">${esc(s.niveau)}</span>` : ''}<span class="badge">${s.exercices.length} exercices</span>
        ${cur && cur.seanceId === s.id ? '<span class="badge accent">En cours</span>' : ''}</div>
        <div class="muted" style="margin-top:6px">${s.exercices.map((e) => esc(e.nom)).join(' · ')}</div>
        <div class="muted" style="margin-top:4px">${last ? 'Dernière fois : ' + fmtDate(last.date) : 'Jamais faite'}</div></div></a>`;
    };
    const base = baseSeances();
    const mine = base.filter((s) => s.perso);
    const common = base.filter((s) => !s.perso);
    const sec = (t, sub, list) => (list.length ? `<h2 class="sec">${t}</h2>${sub ? `<p class="muted sec-sub">${sub}</p>` : ''}` + list.map(card).join('') : '');
    html += sec('Mon programme', `Préparé pour toi par ${esc(BR.coach || 'ton coach')}`, mine);
    html += sec(`Programmes de ${esc(BR.coach || 'ton coach')}`, mine.length ? 'Pour tous les élèves' : '', common);
    html += sec('Mes programmes', 'Créés ou importés par toi', getCustom());
    view.innerHTML = html;
    $('#impfile').onclick = importFile;
    bindCoachSync(viewEntrainement);
    syncCoach(false).then((changed) => { if (changed && location.hash === '#/entrainement') viewEntrainement(); });
  }

  function viewSeance(id) {
    const s = seanceById(id);
    if (!s) return viewHome();
    setTitle(s.nom, '#/entrainement'); setTab('train');
    let cur = getCurrent();
    if (cur && cur.seanceId !== id) {
      const other = seanceById(cur.seanceId);
      view.innerHTML = `<div class="card"><p>Une séance <b>${esc(other.nom)}</b> est déjà en cours.</p>
        <div class="row"><a class="btn" href="#/seance/${other.id}">La reprendre</a>
        <button class="btn ghost" id="drop">L'abandonner</button></div></div>`;
      $('#drop').onclick = () => { if (confirm('Abandonner la séance en cours ? Les saisies seront perdues.')) { setCurrent(null); viewSeance(id); } };
      return;
    }
    if (!cur) {
      view.innerHTML = `<div class="card"><h3>${esc(s.nom)}</h3>
        <p class="muted">${esc(s.consigne || '')}</p>
        ${s.note ? `<p class="muted">${esc(s.note)}</p>` : ''}
        <button class="btn block" id="start">Commencer la séance</button>
        <div class="row" style="margin-top:8px;flex-wrap:wrap">
          ${isCustom(s.id) ? `<a class="btn small ghost" href="#/editer/${s.id}">Modifier</a>` : ''}
          <button class="btn small ghost" id="dup">Dupliquer</button>
          <button class="btn small ghost" id="share">Partager</button>
          <button class="btn small ghost" id="csv">Exporter en tableau</button>
          ${isCustom(s.id) ? '<button class="btn small ghost" id="delprog">Supprimer</button>' : ''}
        </div></div>` + previewList(s);
      $('#start').onclick = () => { setCurrent(newSession(s)); viewSeance(id); };
      $('#dup').onclick = () => { const c = cloneSeance(s, s.nom + ' (copie)'); location.hash = '#/editer/' + c.id; };
      $('#share').onclick = () => shareSeance(s);
      $('#csv').onclick = () => exportCsv([s], s.nom);
      if ($('#delprog')) $('#delprog').onclick = () => {
        if (!confirm(`Supprimer le programme « ${s.nom} » ? L'historique des séances faites est conservé.`)) return;
        setCustom(getCustom().filter((x) => x.id !== s.id)); location.hash = '#/entrainement';
      };
      bindThumbs(view);
      return;
    }
    renderSession(s, cur);
  }

  function previewList(s) {
    return s.exercices.map((ex) => {
      const m = machineFor(ex);
      return `<div class="card"><h3>${esc(ex.nom)}</h3><div class="muted">${ex.series} × ${esc(ex.reps)}${ex.par_cote ? ' par côté' : ''} · repos ${fmtTime(ex.repos_s)}</div>${ex.note ? `<div class="muted">💬 ${esc(ex.note)}</div>` : ''}
        <div class="machine"><div class="row">${thumb(m)}<span>Machine : <b>${esc(m.main)}</b></span></div></div></div>`;
    }).join('');
  }

  // Programme tel qu'il est suivi dans cette séance : exercices remplacés (cur.remplace), retirés (cur.retires)
  // et ajoutés (cur.ajouts) appliqués. Le programme lui-même n'est jamais modifié. Toujours appelé avec le programme d'origine.
  const withRemplace = (base, cur) => {
    const rem = (cur && cur.remplace) || {}; const ret = new Set((cur && cur.retires) || []); const aj = (cur && cur.ajouts) || [];
    if (!Object.keys(rem).length && !ret.size && !aj.length) return base;
    return { ...base, exercices: base.exercices.filter((e) => !ret.has(e.id)).map((e) => (rem[e.id] ? { ...e, ...rem[e.id] } : e)).concat(aj) };
  };

  function renderSession(base, cur) {
    const s = withRemplace(base, cur);
    const persist = () => setCurrent(cur);
    let html = `<div class="card"><div class="row between"><b>Progression</b><span class="muted" id="prog-txt"></span></div><div class="progress"><div id="prog-bar"></div></div></div>
      ${hasWarm(s) || s.consigne ? `<div class="card">${hasWarm(s) ? `<label class="row"><input type="checkbox" id="warm" ${cur.echauffement ? 'checked' : ''}>
      <span><b>Échauffement</b> : ${esc(s.echauffement.exercice)}${s.echauffement.duree_min ? ' ' + s.echauffement.duree_min + ' min' : ''}${s.echauffement.resistance ? ', résistance ' + esc(s.echauffement.resistance.toLowerCase()) : ''}${warmRest(s) ? ` · récupération ${fmtTime(warmRest(s))}` : ''}
      <div class="machine" style="margin:4px 0 0"><div class="row">${thumbHtml({ stock: stockKey(s.echauffement.exercice) })}<b>${esc(machineName(s.echauffement.exercice.toLowerCase()))}</b></div></div></span></label>
      ${s.echauffement.duree_min || warmRest(s) ? `<div class="row" style="margin-top:8px">${s.echauffement.duree_min ? `<button class="btn small" id="warm-go">▶ Chrono ${s.echauffement.duree_min} min</button>` : ''}${warmRest(s) ? `<button class="btn small ghost" id="warm-rest">Récupération ${fmtTime(warmRest(s))}</button>` : ''}</div>` : ''}` : ''}
      ${s.consigne ? `<p class="muted">${esc(s.consigne)}</p>` : ''}</div>` : ''}`;

    s.exercices.forEach((ex) => {
      const m = machineFor(ex);
      const last = lastSetsFor(ex.id, ex.nom);
      const sets = cur.exercices[ex.id];
      html += `<div class="card" data-ex="${ex.id}">
        <div class="row between"><h3>${esc(ex.nom)}</h3><span class="badge">${ex.series} × ${esc(ex.reps)}${ex.par_cote ? '/côté' : ''}</span></div>${ex.ajoute ? `<div class="muted">＋ Ajouté pour cette séance</div>` : ex.remplace ? `<div class="muted">↻ Remplace : ${esc(ex.de)}</div>` : ''}${ex.note ? `<div class="muted">💬 ${esc(ex.note)}</div>` : ''}
        ${last ? `<div class="muted">Précédent (${fmtShort(last.date)}) : ${esc(last.sets.filter((x) => x.done).map((x) => fmtSet(x)).join(', '))}</div>` : ''}
        <div class="machine"><div class="row">${thumb(m)}<span>Machine : <b>${esc(m.main)}</b>${m.custom ? ' <span class="muted">(perso)</span>' : ''}</span>
          <button class="btn small ghost" data-edit-machine="${ex.id}">Modifier</button></div>
          ${m.alts.length ? `<div class="alt">Si occupée : ${esc(m.alts.join(' · '))}</div>` : ''}
          <div class="row" style="margin-top:6px;flex-wrap:wrap"><button class="btn small ghost" data-replace="${ex.id}">⇄ Remplacer</button><button class="btn small ghost" data-remove="${ex.id}">✕ Retirer</button></div></div>
        <table class="sets"><thead><tr><th>Série</th><th>Kg</th><th>${timedSec(ex.reps) ? 'Durée' : 'Reps'}</th><th></th><th>Repos</th></tr></thead><tbody>
        ${sets.map((st, i) => `<tr class="${st.done ? 'done' : ''}" data-i="${i}">
          <td>${i + 1}</td>
          <td><input inputmode="decimal" data-f="kg" value="${esc(st.kg)}" placeholder="kg"></td>
          <td>${timedSec(ex.reps) ? `<button class="work" aria-label="Lancer le chrono de la série">▶ ${fmtTime(num(st.reps) || timedSec(ex.reps))}</button>` : `<input inputmode="numeric" data-f="reps" value="${esc(st.reps)}">`}</td>
          <td><button class="check" aria-label="Série faite">✓</button></td>
          <td><button class="rest" aria-label="Lancer le repos">${fmtTime(ex.repos_s)}</button></td></tr>`).join('')}
        </tbody></table>
        <div class="row" style="margin-top:6px"><button class="btn small ghost" data-add>+ Série</button><button class="btn small ghost" data-del>− Série</button></div>
      </div>`;
    });

    html += `<button class="btn block ghost" id="add-ex">+ Ajouter un exercice</button><p></p>`;
    html += `<div class="card">${hasFin(s) ? `<label class="row"><input type="checkbox" id="fin" ${cur.finisher ? 'checked' : ''}>
      <span><b>Finisher</b> : ${esc(s.finisher.exercice)}<div class="muted">${esc(s.finisher.objectif || '')}</div>
      <div class="row" style="margin-top:6px">${thumbHtml({ stock: stockKey(s.finisher.exercice) })}</div></span></label>` : ''}
      <h2>Notes</h2><textarea id="note" placeholder="Ressenti, watts atteints, temps…">${esc(cur.note)}</textarea></div>
      <button class="btn block" id="finish">Terminer et enregistrer</button>
      <p></p><button class="btn block ghost" id="abandon">Abandonner la séance</button>`;
    view.innerHTML = html;
    bindThumbs(view);
    const updateProg = () => {
      const all = Object.values(cur.exercices).flat(); const d = all.filter((x) => x.done).length;
      $('#prog-txt').textContent = `${d}/${all.length} séries`;
      $('#prog-bar').style.width = `${Math.round(100 * d / Math.max(1, all.length))}%`;
    };
    updateProg();

    if ($('#warm')) $('#warm').onchange = (e) => { cur.echauffement = e.target.checked; persist(); };
    // Chrono d'échauffement puis récupération, enchaînés ; l'échauffement est coché à la fin.
    const firstEx = s.exercices[0] ? s.exercices[0].nom : null;
    const warmRestTimer = () => {
      if (warmRest(s)) startTimer(warmRest(s), firstEx, { label: 'Récupération' }); else closeTimer();
    };
    const warmDone = () => {
      cur.echauffement = true; persist(); if ($('#warm')) $('#warm').checked = true;
      warmRestTimer();
    };
    if ($('#warm-go')) $('#warm-go').onclick = () => startTimer(s.echauffement.duree_min * 60, warmRest(s) ? `récupération ${fmtTime(warmRest(s))}` : firstEx, { label: 'Échauffement', onDone: warmDone });
    if ($('#warm-rest')) $('#warm-rest').onclick = warmRestTimer;
    if ($('#fin')) $('#fin').onchange = (e) => { cur.finisher = e.target.checked; persist(); };
    $('#note').oninput = (e) => { cur.note = e.target.value; persist(); };
    $('#add-ex').onclick = () => openReplace(base, null, cur, () => renderSession(base, cur), 'add');

    view.querySelectorAll('[data-ex]').forEach((card) => {
      const exId = card.dataset.ex;
      const ex = s.exercices.find((e) => e.id === exId);
      card.querySelectorAll('tr[data-i]').forEach((tr) => {
        const i = +tr.dataset.i;
        tr.querySelectorAll('input').forEach((inp) => {
          inp.oninput = () => { cur.exercices[exId][i][inp.dataset.f] = inp.value.trim(); persist(); };
        });
        const check = () => {
          const st = cur.exercices[exId][i];
          st.done = !st.done; persist();
          tr.classList.toggle('done', st.done);
          updateProg();
          if (st.done) {
            // pré-remplit la charge des séries suivantes vides
            cur.exercices[exId].forEach((n, j) => { if (j > i && !n.done && n.kg === '' && st.kg !== '') n.kg = st.kg; });
            persist();
            card.querySelectorAll('tr[data-i]').forEach((t2) => { const j = +t2.dataset.i; t2.querySelector('[data-f=kg]').value = cur.exercices[exId][j].kg; });
            startTimer(ex.repos_s, nextLabel(s, ex, i));
          }
        };
        tr.querySelector('.check').onclick = check;
        tr.querySelector('.rest').onclick = () => startTimer(ex.repos_s, nextLabel(s, ex, i));
        // Série en durée : chrono de la série, puis série cochée et repos lancé automatiquement
        const work = tr.querySelector('.work');
        if (work) work.onclick = () => {
          const st = cur.exercices[exId][i];
          const sec = num(st.reps) || timedSec(ex.reps);
          startTimer(sec, `repos ${fmtTime(ex.repos_s)}`, { label: `${ex.nom} · série ${i + 1}`, onDone: () => { st.reps = sec; st.sec = true; if (!st.done) check(); else closeTimer(); } });
        };
      });
      card.querySelector('[data-add]').onclick = () => {
        const sets = cur.exercices[exId]; const l = sets[sets.length - 1] || { kg: '', reps: repsMin(ex.reps) };
        sets.push({ kg: l.kg, reps: l.reps, done: false }); persist(); renderSession(base, cur);
      };
      card.querySelector('[data-del]').onclick = () => {
        if (cur.exercices[exId].length > 1) { cur.exercices[exId].pop(); persist(); renderSession(base, cur); }
      };
      card.querySelector('[data-edit-machine]').onclick = () => {
        if (!ex.remplace) return editMachine(ex, () => renderSession(base, cur));
        const v = prompt(`Machine pour « ${ex.nom} »`, ex.machine || '');
        if (v === null) return;
        const ov = ex.ajoute ? cur.ajouts.find((a) => a.id === exId) : cur.remplace[exId];
        ov.machine = v.trim(); persist(); renderSession(base, cur);
      };
      card.querySelector('[data-replace]').onclick = () => openReplace(base, ex, cur, () => renderSession(base, cur));
      card.querySelector('[data-remove]').onclick = () => {
        if (s.exercices.length <= 1) return alert('Il faut garder au moins un exercice dans la séance.');
        const done = (cur.exercices[exId] || []).some((x) => x.done);
        if (!confirm(`Retirer « ${ex.nom} » de cette séance ?${done ? '\nLes séries déjà cochées seront perdues.' : ''}\nLe programme n'est pas modifié.`)) return;
        removeExercise(cur, exId); persist(); renderSession(base, cur);
      };
    });

    $('#finish').onclick = () => {
      const nbDone = Object.values(cur.exercices).flat().filter((x) => x.done).length;
      if (!nbDone && !confirm('Aucune série cochée. Enregistrer quand même ?')) return;
      cur.fin = new Date().toISOString();
      const h = getHistory(); h.push(cur); setHistory(h); setCurrent(null);
      queueShare(cur);
      location.hash = '#/historique/' + cur.id;
    };
    $('#abandon').onclick = () => { if (confirm('Abandonner la séance ? Les saisies seront perdues.')) { setCurrent(null); location.hash = '#/'; } };
  }

  // libellé de ce qui suit la série i de l'exercice ex
  function nextLabel(s, ex, i) {
    const sets = getCurrent()?.exercices[ex.id] || [];
    if (i + 1 < sets.length) return `${ex.nom}, série ${i + 2}/${sets.length}`;
    const idx = s.exercices.indexOf(ex);
    const nx = s.exercices[idx + 1];
    return nx ? `${nx.nom} (${machineFor(nx).main})` : (hasFin(s) ? `Finisher : ${s.finisher.exercice}` : 'Fin de la séance');
  }

  // ---------- remplacer un exercice (cette séance seulement) ----------
  const REPL = window.REPLACEMENTS || { groupes: [] };
  // Groupe musculaire d'un exercice : par son image, sinon par un mot de son nom.
  function groupOf(ex) {
    const img = ex.img || ex.id;
    const byImg = REPL.groupes.find((g) => g.exercices.some((e) => e.img === img));
    if (byImg) return byImg.id;
    const words = nameKey(ex.nom).split(' ');
    const byWord = REPL.groupes.find((g) => g.mots.some((m) => words.some((w) => w.startsWith(m))));
    return byWord ? byWord.id : null;
  }
  // Retire un exercice de la séance en cours (un exercice ajouté est simplement supprimé).
  function removeExercise(cur, exId) {
    if ((cur.ajouts || []).some((a) => a.id === exId)) cur.ajouts = cur.ajouts.filter((a) => a.id !== exId);
    else { cur.retires = (cur.retires || []).concat(exId); if (cur.remplace) delete cur.remplace[exId]; }
    delete cur.exercices[exId]; delete cur.exNoms[exId];
  }
  // Ajoute un exercice à la fin de la séance : 3 séries (réglables avec + / − Série), 90 s de repos (45 s en durée).
  function addExercise(cur, rep) {
    const id = 'x' + Date.now().toString(36);
    const timed = timedSec(rep.reps) > 0;
    const ex = { id, nom: rep.nom, machine: rep.machine || '', img: rep.img || '', series: 3, reps: rep.reps || '10', repos_s: timed ? 45 : 90, par_cote: !!rep.par_cote, alternatives: [], note: '', remplace: true, ajoute: true };
    cur.ajouts = (cur.ajouts || []).concat(ex);
    cur.exNoms[id] = ex.nom; cur.exercices[id] = freshSets(ex);
  }
  // Remet dans la séance un exercice du programme qu'on avait retiré.
  function restoreExercise(base, cur, exId) {
    const ex = base.exercices.find((e) => e.id === exId); if (!ex) return;
    cur.retires = (cur.retires || []).filter((id) => id !== exId);
    cur.exNoms[exId] = ex.nom; cur.exercices[exId] = freshSets(ex);
  }
  function applyReplacement(base, cur, exId, rep) {
    const ex = base.exercices.find((e) => e.id === exId) || (cur.ajouts || []).find((a) => a.id === exId);
    const sets = cur.exercices[exId] || [];
    if (sets.some((x) => x.done) && !confirm('Les séries déjà cochées de cet exercice seront perdues. Continuer ?')) return false;
    if (ex.ajoute) { // exercice ajouté : on le modifie directement
      ex.reps = timedSec(rep.reps) ? rep.reps : (timedSec(ex.reps) ? (rep.reps || '10') : ex.reps);
      Object.assign(ex, { nom: rep.nom, machine: rep.machine || '', img: rep.img || '', par_cote: !!rep.par_cote });
      cur.exNoms[exId] = rep.nom; cur.exercices[exId] = freshSets(ex, sets.length);
      return true;
    }
    cur.remplace = cur.remplace || {};
    if (!rep) { // retour à l'exercice d'origine
      delete cur.remplace[exId]; cur.exNoms[exId] = ex.nom;
      cur.exercices[exId] = freshSets(ex, sets.length);
      return true;
    }
    // Séries et repos conservés ; reps conservées sauf passage répétitions ↔ durée.
    const reps = timedSec(rep.reps) ? rep.reps : (timedSec(ex.reps) ? (rep.reps || '10') : ex.reps);
    cur.remplace[exId] = { nom: rep.nom, machine: rep.machine || '', img: rep.img || '', reps, par_cote: !!rep.par_cote, alternatives: [], note: '', remplace: true, de: ex.nom };
    cur.exNoms[exId] = rep.nom;
    cur.exercices[exId] = freshSets({ ...ex, ...cur.remplace[exId] }, sets.length);
    return true;
  }
  // mode 'add' : ajoute un exercice à la séance (ex = null) ; sinon remplace ex.
  function openReplace(base, ex, cur, done, mode) {
    const add = mode === 'add';
    const orig = ex && base.exercices.find((e) => e.id === ex.id);
    // exercices déjà présents dans la séance : pas proposés
    const cour = withRemplace(base, cur).exercices;
    const used = new Set(cour.map((e) => nameKey(e.nom)));
    const retires = add ? base.exercices.filter((e) => (cur.retires || []).includes(e.id)) : [];
    let gid = (add ? groupOf(cour[cour.length - 1] || {}) : groupOf(ex)) || (REPL.groupes[0] || {}).id;
    const o = document.createElement('div'); o.className = 'sheet-overlay';
    const close = () => o.remove();
    const choose = (rep) => {
      if (add) { addExercise(cur, rep); setCurrent(cur); close(); done(); return; }
      if (applyReplacement(base, cur, ex.id, rep)) { setCurrent(cur); close(); done(); }
    };
    o.innerHTML = `<div class="sheet" role="dialog" aria-label="${add ? 'Ajouter un exercice' : 'Remplacer l\'exercice'}">
      <div class="row between"><h3>${add ? 'Ajouter un exercice' : `Remplacer « ${esc(ex.nom)} »`}</h3><button class="btn small ghost" data-close aria-label="Fermer">✕</button></div>
      <p class="muted">Pour cette séance seulement : le programme n'est pas modifié. ${add ? '3 séries au départ : « + Série » / « − Série » les ajustent.' : 'Séries et repos conservés.'}</p>
      ${retires.length ? `<h4 style="margin:6px 0">Remettre un exercice retiré</h4><div class="chips">${retires.map((e) => `<button class="chip" data-back="${e.id}">↩ ${esc(e.nom)}</button>`).join('')}</div>` : ''}
      <div id="rep-dyn"></div>
      <h4 style="margin:14px 0 6px">Autre exercice</h4>
      <input class="field" id="rep-nom" placeholder="Nom de l'exercice">
      <input class="field" id="rep-mach" placeholder="Machine (facultatif)" style="margin-top:6px">
      <button class="btn block" id="rep-own" style="margin-top:8px">Utiliser cet exercice</button>
      ${!add && ex.remplace && !ex.ajoute && orig ? `<p></p><button class="btn block ghost" id="rep-reset">Remettre « ${esc(orig.nom)} »</button>` : ''}</div>`;
    const dyn = o.querySelector('#rep-dyn');
    let query = '';
    const drawList = () => {
      const g = REPL.groupes.find((x) => x.id === gid) || { exercices: [] };
      const q = nameKey(query);
      const list = (q ? REPL.groupes.flatMap((x) => x.exercices) : g.exercices)
        .filter((e) => !used.has(nameKey(e.nom)) && (!q || nameKey(e.nom + ' ' + (e.machine || '')).includes(q)));
      dyn.innerHTML = `<input class="field" id="rep-q" type="search" placeholder="Rechercher (nom, machine…)" value="${esc(query)}" autocomplete="off">
        <div class="chips" style="${q ? 'opacity:.5' : ''}">${REPL.groupes.map((x) => `<button class="chip ${x.id === gid && !q ? 'on' : ''}" data-g="${x.id}">${esc(x.nom)}</button>`).join('')}</div>
        ${list.map((e, i) => `<button class="rep-item" data-i="${i}">${STOCK.includes(e.img) ? `<img class="thumb" src="img/${e.img}_0.jpg" alt="">` : ''}<span><b>${esc(e.nom)}</b><br><span class="muted">${esc(e.machine || '')}</span></span></button>`).join('') || `<p class="muted">${q ? 'Aucun résultat : utilise « Autre exercice » plus bas.' : 'Rien d\'autre dans ce groupe.'}</p>`}`;
      const qi = dyn.querySelector('#rep-q');
      qi.oninput = () => { query = qi.value; const pos = qi.selectionStart; drawList(); const n = dyn.querySelector('#rep-q'); n.focus(); n.setSelectionRange(pos, pos); };
      dyn.querySelectorAll('[data-g]').forEach((b) => { b.onclick = () => { gid = b.dataset.g; query = ''; drawList(); }; });
      dyn.querySelectorAll('[data-i]').forEach((b) => { b.onclick = () => choose(list[+b.dataset.i]); });
    };
    drawList();
    o.querySelector('[data-close]').onclick = close;
    o.onclick = (e) => { if (e.target === o) close(); };
    o.querySelector('#rep-own').onclick = () => {
      const nom = o.querySelector('#rep-nom').value.trim();
      if (!nom) return alert('Donne un nom à l\'exercice.');
      choose({ nom: nom.slice(0, 80), machine: o.querySelector('#rep-mach').value.trim().slice(0, 80), img: imgByName(nom) || '' });
    };
    o.querySelectorAll('[data-back]').forEach((b) => { b.onclick = () => { restoreExercise(base, cur, b.dataset.back); setCurrent(cur); close(); done(); }; });
    const resetBtn = o.querySelector('#rep-reset');
    if (resetBtn) resetBtn.onclick = () => choose(null);
    document.body.appendChild(o);
  }

  function editMachine(ex, done) {
    const m = getMachines();
    const v = prompt(`Machine pour « ${ex.nom} » (vide = valeur par défaut : ${machineName(ex.machine)})`, m[ex.id] || '');
    if (v === null) return;
    if (v.trim()) m[ex.id] = v.trim(); else delete m[ex.id];
    save(K.machines, m); done();
  }

  function viewHistorique(hid) {
    const x = getHistory().find((e) => e.id === hid);
    if (!x) return viewHome();
    const s = seanceById(x.seanceId);
    setTitle(s ? s.nom : 'Séance', '#/agenda'); setTab('home');
    const dur = x.fin ? Math.round((new Date(x.fin) - new Date(x.date)) / 60000) : null;
    let html = `<div class="card"><h3>${fmtDate(x.date)}</h3><div class="muted">${dur !== null ? 'Durée : ' + dur + ' min · ' : ''}Échauffement ${x.echauffement ? 'fait' : 'non coché'} · finisher ${x.finisher ? 'fait' : 'non coché'}</div>
      ${x.note ? `<p>${esc(x.note)}</p>` : ''}</div>`;
    Object.entries(x.exercices).forEach(([exId, sets]) => {
      const ex = exById(exId);
      const done = sets.filter((st) => st.done);
      const vol = done.filter((st) => !st.sec).reduce((a, st) => a + (num(st.kg) || 0) * (num(st.reps) || 0), 0);
      const nm = exName(x, exId) || exId;
      html += `<a class="card link" href="#/progres/${encodeURIComponent(nameKey(nm))}"><div class="row between"><b>${esc(nm)}</b><span class="muted">${done.length}/${sets.length} séries</span></div>
        <div class="muted">${done.map((st) => fmtSet(st, ' kg × ')).join(' · ') || '—'}</div>
        ${vol ? `<div class="muted">Volume : ${Math.round(vol)} kg</div>` : ''}</a>`;
    });
    html += `<button class="btn block danger" id="del">Supprimer cette séance</button>`;
    view.innerHTML = html;
    $('#del').onclick = () => {
      if (confirm('Supprimer définitivement cette séance de l\'historique ?')) { setHistory(getHistory().filter((e) => e.id !== hid)); location.hash = '#/agenda'; }
    };
  }

  let calMonth = null;
  function viewAgenda() {
    setTitle('Agenda', '#/'); setTab('home');
    const now = new Date();
    if (!calMonth) calMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const h = getHistory();
    const byDay = {};
    h.forEach((x) => { const k = dayKey(new Date(x.date)); (byDay[k] = byDay[k] || []).push(x); });
    const y = calMonth.getFullYear(), mo = calMonth.getMonth();
    const first = (new Date(y, mo, 1).getDay() + 6) % 7; // lundi = 0
    const nbDays = new Date(y, mo + 1, 0).getDate();
    const monthLabel = calMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    const inMonth = h.filter((x) => { const d = new Date(x.date); return d.getFullYear() === y && d.getMonth() === mo; });
    let html = `<div class="row between"><button class="btn small ghost" id="prev">‹</button><b style="text-transform:capitalize">${monthLabel}</b><button class="btn small ghost" id="next">›</button></div>
      <p class="muted">${inMonth.length} séance${inMonth.length > 1 ? 's' : ''} ce mois-ci</p><div class="cal">`;
    ['L', 'M', 'M', 'J', 'V', 'S', 'D'].forEach((d) => { html += `<div class="dow">${d}</div>`; });
    for (let i = 0; i < first; i++) html += `<div class="day empty"></div>`;
    for (let d = 1; d <= nbDays; d++) {
      const k = `${y}-${pad(mo + 1)}-${pad(d)}`;
      html += `<button class="day ${byDay[k] ? 'has' : ''} ${k === dayKey(now) ? 'today' : ''}" data-k="${k}">${d}</button>`;
    }
    html += `</div><div id="daylist"><h2>Séances du mois</h2>`;
    if (!inMonth.length) html += `<p class="muted">Aucune.</p>`;
    [...inMonth].reverse().forEach((x) => {
      html += `<a class="card link" href="#/historique/${x.id}"><div class="row between"><b>${esc(nomSeance(x))}</b><span class="muted">${fmtDate(x.date)}</span></div></a>`;
    });
    html += `</div>`;
    view.innerHTML = html;
    $('#prev').onclick = () => { calMonth = new Date(y, mo - 1, 1); viewAgenda(); };
    $('#next').onclick = () => { calMonth = new Date(y, mo + 1, 1); viewAgenda(); };
    view.querySelectorAll('.day.has').forEach((b) => {
      b.onclick = () => {
        const list = byDay[b.dataset.k];
        if (list.length === 1) location.hash = '#/historique/' + list[0].id;
        else $('#daylist').innerHTML = `<h2>${fmtDate(list[0].date)}</h2>` + list.map((x) => `<a class="card link" href="#/historique/${x.id}"><b>${esc(nomSeance(x))}</b></a>`).join('');
      };
    });
  }

  function viewProgres() {
    setTitle('Progression'); setTab('progres');
    const map = progressByName();
    const keys = Object.keys(map).sort((a, b) => map[b].pts[map[b].pts.length - 1].date.localeCompare(map[a].pts[map[a].pts.length - 1].date));
    let html = `<p class="muted">Un même nom d'exercice est suivi ensemble, quel que soit le programme.</p>`;
    if (keys.length) html += `<h2>Exercices suivis</h2>`;
    keys.forEach((k) => {
      const { nom, pts } = map[k];
      const kg = pts.map((p) => p.kg).filter((v) => v !== null);
      const lastV = kg[kg.length - 1], diff = kg.length > 1 ? Math.round((lastV - kg[0]) * 10) / 10 : null;
      html += `<a class="card link" href="#/progres/${encodeURIComponent(k)}"><div class="row between"><b>${esc(nom)}</b>
        <span class="muted">${kg.length ? lastV + ' kg' : 'sans charge'}${diff ? ` <span class="${diff > 0 ? 'goal-ok' : ''}">(${diff > 0 ? '+' : ''}${diff} kg)</span>` : ''}</span></div>
        <div class="muted">${pts.length} séance${pts.length > 1 ? 's' : ''} · dernière ${fmtDate(pts[pts.length - 1].date)}</div></a>`;
    });
    const todo = [];
    allSeances().forEach((s) => s.exercices.forEach((e) => { const k = nameKey(e.nom); if (!map[k] && !todo.some((t) => t.k === k)) todo.push({ k, nom: e.nom }); }));
    if (todo.length) html += `<h2>Pas encore faits</h2><div class="card">${todo.map((t) => `<div class="list-item"><span>${esc(t.nom)}</span><span class="muted">—</span></div>`).join('')}</div>`;
    view.innerHTML = html;
  }

  function viewProgresEx(param) {
    let key = decodeURIComponent(param || '');
    const byId = exById(key); if (byId) key = nameKey(byId.nom); // anciens liens par identifiant
    const entry = progressByName()[key];
    if (!entry) return viewProgres();
    setTitle(entry.nom, '#/progres'); setTab('progres');
    const pts = entry.pts.filter((p) => p.kg !== null);
    let html = `<p class="muted">Charge maximale par séance (séries cochées).</p>${chart(pts)}`;
    if (pts.length) {
      const best = Math.max(...pts.map((p) => p.kg));
      html += `<div class="stats"><div class="stat"><b>${pts[pts.length - 1].kg}</b><span>dernière (kg)</span></div><div class="stat"><b>${best}</b><span>record (kg)</span></div><div class="stat"><b>${entry.pts.length}</b><span>séances</span></div></div>`;
    }
    html += `<h2>Historique</h2>`;
    [...entry.pts].reverse().forEach((p) => {
      html += `<a class="list-item" href="#/historique/${p.id}" style="color:inherit;text-decoration:none"><span>${fmtDate(p.date)}<br><span class="muted">${esc(p.seance)}</span></span><span>${p.sets.map((st) => fmtSet(st)).join(' · ')}</span></a>`;
    });
    view.innerHTML = html;
  }

  function chart(pts) {
    if (pts.length < 1) return '';
    const W = 340, H = 180, L = 36, R = 12, T = 14, B = 26;
    const vals = pts.map((p) => p.kg);
    let min = Math.min(...vals), max = Math.max(...vals);
    if (min === max) { min -= 5; max += 5; }
    const pad = (max - min) * 0.1; min = Math.max(0, min - pad); max += pad;
    const x = (i) => pts.length === 1 ? (L + W - R) / 2 : L + (i * (W - L - R)) / (pts.length - 1);
    const yv = (v) => T + (H - T - B) * (1 - (v - min) / (max - min));
    const line = pts.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${yv(p.kg).toFixed(1)}`).join(' ');
    let svg = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Évolution de la charge">`;
    [min, (min + max) / 2, max].forEach((v) => {
      svg += `<line x1="${L}" x2="${W - R}" y1="${yv(v)}" y2="${yv(v)}" style="stroke:var(--line)"/><text x="4" y="${yv(v) + 4}">${Math.round(v)}</text>`;
    });
    svg += `<path d="${line}" fill="none" style="stroke:var(--accent)" stroke-width="2.5"/>`;
    pts.forEach((p, i) => { svg += `<circle cx="${x(i)}" cy="${yv(p.kg)}" r="4" style="fill:var(--accent)"/>`; });
    const step = Math.ceil(pts.length / 5);
    pts.forEach((p, i) => { if (i % step === 0 || i === pts.length - 1) svg += `<text x="${x(i)}" y="${H - 8}" text-anchor="middle">${fmtShort(p.date)}</text>`; });
    return svg + '</svg>';
  }

  function viewReglages() {
    setTitle('Réglages'); setTab('reglages');
    const h = getHistory();
    let theme = 'system'; try { theme = localStorage.getItem('tr_theme') || 'system'; } catch (e) { /* ignore */ }
    view.innerHTML = `${hasContact() ? `<a class="card link" href="#/contact"><div class="row between"><h3>Contacter ${esc(BR.coach || 'le coach')}</h3><span class="link-accent">›</span></div></a>` : ''}
      <div class="card"><h3>Profil</h3><label class="lbl" for="prenom">Ton prénom (affiché après « Bonjour »)</label>
      <input class="field" id="prenom" maxlength="30" autocomplete="given-name" value="${esc(load('tr_prenom', ''))}" placeholder="ex. Alex">
      <div class="grid2" style="grid-template-columns:1fr 1fr"><div><label class="lbl" for="taille">Taille (cm)</label><input class="field" id="taille" inputmode="numeric" value="${esc(load('tr_taille', ''))}" placeholder="facultatif"></div>
      <div><label class="lbl" for="poids">Poids (kg)</label><input class="field" id="poids" inputmode="decimal" value="${esc(load('tr_poids', ''))}" placeholder="facultatif"></div></div>
      <div class="muted" id="imc" style="margin-top:8px"></div>
      ${hasCoachSource() ? `<label class="lbl" for="client">Code client (donné par ${esc(BR.coach || 'ton coach')})</label>
      <input class="field" id="client" maxlength="60" autocapitalize="none" value="${esc(load('tr_client', ''))}" placeholder="ex. MD202615">
      <div class="muted" style="font-size:12px">Sert à recevoir ton programme personnalisé. Vide : seulement les programmes communs.</div>` : ''}</div>
      ${BR.partageUrl ? `<div class="card"><h3>Partage avec ${esc(BR.coach || 'ton coach')}</h3>
      <label class="row"><input type="checkbox" id="share" ${load('tr_partage', false) ? 'checked' : ''} ${load('tr_client', '') ? '' : 'disabled'}> <span>Partager ma progression avec mon coach</span></label>
      <div class="muted" style="font-size:12px;margin-top:6px">${load('tr_client', '') ? '' : 'Renseigne d\'abord ton code client. '}Après chaque séance, l'appli envoie ton code client, la date, les exercices, les charges, répétitions ou durées et ta note. Rien d'autre : ni prénom, ni taille, ni poids. Tu peux arrêter quand tu veux ; ce qui a déjà été envoyé reste chez ton coach.</div>
      ${shareOn() ? `<div class="row between" style="margin-top:8px"><span class="muted" id="share-state"></span><button class="btn small ghost" id="share-now">Envoyer maintenant</button></div>` : ''}</div>` : ''}
      <div class="card"><h3>Apparence</h3><div class="seg" id="theme">
      ${[['system', 'Système'], ['light', 'Clair'], ['dark', 'Sombre']].map(([k, l]) => `<button data-t="${k}" class="${theme === k ? 'on' : ''}">${l}</button>`).join('')}
      </div></div>
      <div class="card"><h3>Sauvegarde</h3>
      <p class="muted">${h.length} séance(s) enregistrée(s). Les données restent sur le téléphone : exporte-les de temps en temps (copier puis coller dans une note ou un mail).</p>
      <button class="btn block" id="exp">Exporter (copier)</button><p></p>
      <textarea id="io" placeholder="Colle ici une sauvegarde pour l'importer"></textarea><p></p>
      <button class="btn block ghost" id="imp">Importer depuis le texte collé</button></div>
      <a class="card link" href="#/machines"><div class="row between"><h3>Machines et photos</h3><span class="badge accent">Modifier</span></div>
      <div class="muted">Nom de la machine et photo pour chaque exercice.</div></a>
      ${BR.logoComplet ? `<div class="card" style="text-align:center;background:#fff"><img src="${esc(BR.logoComplet)}" alt="${esc(BR.coach || BR.nomApp)}" style="max-width:100%;max-height:140px"></div>` : ''}
      <p class="muted" style="text-align:center">${esc(BR.nomApp)} v${esc(window.APP_VERSION || 'dev')}${hasContact() ? '' : ' · coordonnées du coach à venir'}</p>
      ${BR.majDepot ? `${updateHtml(true)}<p style="text-align:center"><button class="link-btn" id="chk-upd">Rechercher une mise à jour</button></p>` : ''}
      <p style="text-align:center"><button class="link-btn" id="replay-ob">Relancer la configuration de départ</button></p>
      <p style="text-align:center"><button class="link-btn" id="chg-sheet">Changer le tableau du coach</button></p>`;
    $('#prenom').oninput = (e) => save('tr_prenom', e.target.value.trim());
    if ($('#client')) $('#client').onchange = (e) => { save('tr_client', e.target.value.trim()); syncCoach(true).then(() => {}); };
    $('#replay-ob').onclick = () => { save('tr_onboarded', false); route(); };
    $('#chg-sheet').onclick = changeSheet;
    if ($('#share')) {
      $('#share').onchange = (e) => {
        save('tr_partage', e.target.checked);
        if (e.target.checked && h.length && confirm(`Envoyer aussi tes ${h.length} séance(s) déjà enregistrée(s) à ton coach ?\n\nOK = les envoyer\nAnnuler = seulement les prochaines`)) {
          const q = load('tr_outbox', []); const ids = new Set(q.map((p) => p.id));
          h.forEach((x) => { if (!ids.has(x.id)) q.push(sharePayload(x)); });
          save('tr_outbox', q);
        }
        viewReglages(); flushShare().then(() => { if (location.hash === '#/reglages') viewReglages(); });
      };
    }
    if ($('#share-state')) {
      const left = () => load('tr_outbox', []).length;
      $('#share-state').textContent = left() ? `${left()} séance(s) en attente d'envoi` : 'Tout est envoyé ✓';
      $('#share-now').onclick = async () => {
        $('#share-now').disabled = true; $('#share-state').textContent = 'Envoi…';
        await flushShare();
        $('#share-state').textContent = left() ? `${left()} séance(s) pas encore envoyée(s) : vérifie la connexion.` : 'Tout est envoyé ✓';
        $('#share-now').disabled = false;
      };
    }
    if ($('#chk-upd')) $('#chk-upd').onclick = () => checkUpdate(true).then((u) => { if (!u) alert(navigator.onLine === false ? 'Pas de connexion.' : `Tu as la dernière version (v${window.APP_VERSION || 'dev'}).`); viewReglages(); });
    const showImc = () => { $('#imc').innerHTML = imcHtml(); };
    $('#taille').oninput = (e) => { save('tr_taille', e.target.value.trim()); showImc(); };
    $('#poids').oninput = (e) => { save('tr_poids', e.target.value.trim()); showImc(); };
    showImc();
    view.querySelectorAll('#theme button').forEach((b) => {
      b.onclick = () => { setTheme(b.dataset.t); viewReglages(); };
    });
    $('#exp').onclick = async () => {
      const txt = JSON.stringify({ app: 'training', v: 1, exportedAt: new Date().toISOString(), history: getHistory(), machines: getMachines(), photos: getPhotos() });
      $('#io').value = txt;
      try { await navigator.clipboard.writeText(txt); alert('Sauvegarde copiée dans le presse-papiers.'); }
      catch (e) { $('#io').select(); alert('Copie automatique impossible : le texte est sélectionné, copie-le à la main.'); }
    };
    $('#imp').onclick = () => {
      let d;
      try { d = JSON.parse($('#io').value); } catch (e) { return alert('Texte invalide.'); }
      if (!d || d.app !== 'training' || !Array.isArray(d.history)) return alert('Ce n\'est pas une sauvegarde Training.');
      const cur = getHistory(); const ids = new Set(cur.map((x) => x.id));
      const added = d.history.filter((x) => !ids.has(x.id));
      const merged = cur.concat(added).sort((a, b) => a.date.localeCompare(b.date));
      setHistory(merged);
      save(K.machines, { ...(d.machines || {}), ...getMachines() });
      save(K.photos, { ...(d.photos || {}), ...getPhotos() });
      alert(`${added.length} séance(s) importée(s).`); viewReglages();
    };
  }

  function viewMachines() {
    setTitle('Machines et photos', '#/reglages'); setTab('reglages');
    let html = `<p class="muted">Images indicatives : Free Exercise DB (domaine public). Touche « Nom » pour indiquer la machine de ton club, « Ma photo » pour la remplacer par ta photo ou une capture.</p>`;
    allSeances().forEach((s) => {
      html += `<h2>${esc(s.nom)}</h2>`;
      s.exercices.forEach((ex) => {
        const m = machineFor(ex);
        html += `<div class="card" data-mx="${ex.id}"><div class="row">
          ${thumbHtml(m, 'thumb big') || '<div class="thumb big empty">📷</div>'}
          <div style="flex:1;min-width:0"><b>${esc(ex.nom)}</b>
          <div class="muted">${esc(m.main)}${m.custom ? ' (perso)' : ''}</div>
          <div class="muted" style="font-size:12px">${m.photo ? 'Ta photo' : 'Image indicative'}</div></div></div>
          <div class="row" style="margin-top:8px;flex-wrap:wrap">
            <button class="btn small ghost" data-name>Nom</button>
            <button class="btn small ghost" data-pic>${m.photo ? 'Changer ma photo' : 'Ma photo'}</button>
            ${m.photo ? '<button class="btn small ghost" data-rm>Revenir à l\'image indicative</button>' : ''}
          </div></div>`;
      });
    });
    view.innerHTML = html;
    bindThumbs(view);
    view.querySelectorAll('[data-mx]').forEach((card) => {
      const ex = exById(card.dataset.mx);
      card.querySelector('[data-name]').onclick = () => editMachine(ex, viewMachines);
      card.querySelector('[data-pic]').onclick = () => pickPhoto(ex.id, viewMachines);
      const rm = card.querySelector('[data-rm]'); if (rm) rm.onclick = () => removePhoto(ex.id, viewMachines);
    });
  }

  function setTheme(t) {
    try { if (t === 'system') localStorage.removeItem('tr_theme'); else localStorage.setItem('tr_theme', t); } catch (e) { /* ignore */ }
    if (t === 'system') delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = t;
  }

  // ---------- programmes perso : création, bibliothèque, import / export ----------
  const setCustom = (c) => save('tr_custom', c);
  const hasWarm = (s) => !!(s.echauffement && s.echauffement.exercice);
  // Récupération après l'échauffement (s) : 60 s si non précisée, 0 = aucune.
  const warmRest = (s) => { const r = s.echauffement && s.echauffement.repos_s; return r === undefined || r === null || r === '' ? 60 : Math.max(0, parseInt(r, 10) || 0); };
  const hasFin = (s) => !!(s.finisher && s.finisher.exercice);
  const uid = (p) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  function bannerStyle(s) {
    const e = s.exercices.find((x) => STOCK.includes(x.img || x.id));
    return e ? `background-image:url('img/${e.img || e.id}_0.jpg')` : 'background:linear-gradient(135deg,var(--accent),#7a2f00)';
  }
  // Normalise un programme (saisi, importé ou copié) et lui donne des identifiants neufs.
  function normalizeSeance(src, nom) {
    const n = (v, d) => { const x = parseInt(v, 10); return x > 0 ? x : d; };
    return {
      id: uid('p_'),
      nom: String(nom || src.nom || 'Programme').slice(0, 60),
      niveau: src.niveau ? String(src.niveau).slice(0, 30) : '',
      description: src.description ? String(src.description).slice(0, 300) : '',
      consigne: src.consigne ? String(src.consigne).slice(0, 300) : '',
      echauffement: { exercice: String((src.echauffement || {}).exercice || ''), duree_min: n((src.echauffement || {}).duree_min, 0), repos_s: warmRest(src), resistance: String((src.echauffement || {}).resistance || '') },
      finisher: { exercice: String((src.finisher || {}).exercice || ''), objectif: String((src.finisher || {}).objectif || '') },
      exercices: (src.exercices || []).filter((e) => e && e.nom).map((e) => ({
        id: uid('e_'),
        nom: String(e.nom).slice(0, 80),
        series: n(e.series, 3),
        reps: String(e.reps || '10').slice(0, 12),
        par_cote: !!e.par_cote,
        repos_s: n(e.repos_s, 60),
        charge: true,
        machine: String(machineName(e.machine || '') || '').slice(0, 80),
        alternatives: (e.alternatives || []).map((a) => String(machineName(a))).slice(0, 3),
        note: e.note ? String(e.note).slice(0, 200) : '',
        img: STOCK.includes(e.img) ? e.img : (STOCK.includes(e.id) ? e.id : imgByName(e.nom)),
      })),
    };
  }
  // Image indicative retrouvée d'après le nom (exercices des fiches et de la bibliothèque).
  function imgByName(nom) {
    const k = String(nom || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
    const pool = DATA.seances.concat(window.LIBRARY || []).flatMap((s) => s.exercices);
    const hit = pool.find((e) => String(e.nom).normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase() === k);
    const key = hit && (hit.img || hit.id);
    return key && STOCK.includes(key) ? key : undefined;
  }
  function cloneSeance(src, nom) {
    const c = normalizeSeance(src, nom);
    setCustom(getCustom().concat(c));
    return c;
  }
  function exportable(s) {
    const { id, ...rest } = s;
    return { ...rest, exercices: s.exercices.map(({ id: _i, charge, ...e }) => ({ ...e, machine: machineFor({ ...e, id: _i }).main })) };
  }
  async function shareSeance(s) {
    const txt = JSON.stringify({ app: 'training', type: 'programmes', v: 1, seances: [exportable(s)] }, null, 1);
    try { await navigator.clipboard.writeText(txt); alert('Programme copié : colle-le dans un message ou une note. Il s\'importe avec Entraînement → Importer.'); }
    catch (e) { prompt('Copie ce texte :', txt); }
  }
  function importText(txt) {
    let d;
    if (!/^\s*[\[{]/.test(txt)) {
      let list;
      try { list = csvToSeances(txt, { all: true }); } catch (e) { return alert(e.message); }
      const ok = list.map((x) => normalizeSeance(x));
      setCustom(getCustom().concat(ok));
      alert(`${ok.length} programme(s) importé(s) : ${ok.map((x) => x.nom).join(', ')}`);
      return viewEntrainement();
    }
    try { d = JSON.parse(txt); } catch (e) { return alert('Fichier ou texte illisible (JSON attendu).'); }
    const list = Array.isArray(d) ? d : (d && Array.isArray(d.seances) ? d.seances : (d && d.exercices ? [d] : null));
    if (!list || !list.length) return alert('Aucun programme trouvé dans ce fichier.');
    const ok = list.filter((x) => x && Array.isArray(x.exercices) && x.exercices.length).map((x) => normalizeSeance(x));
    if (!ok.length) return alert('Aucun programme valide (il faut au moins un exercice).');
    setCustom(getCustom().concat(ok));
    alert(`${ok.length} programme(s) importé(s) : ${ok.map((x) => x.nom).join(', ')}`);
    viewEntrainement();
  }
  function importFile() {
    const choice = confirm('Importer un fichier (tableau .csv ou .json) ?\n\nOK = choisir un fichier\nAnnuler = coller un texte');
    if (!choice) { const t = prompt('Colle le programme (lignes du tableau ou texte partagé depuis l\'appli) :'); if (t) importText(t); return; }
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = '.csv,.json,.txt,text/csv,application/json,text/plain';
    inp.onchange = () => { const f = inp.files && inp.files[0]; if (!f) return; f.text().then(importText); };
    inp.click();
  }

  // ---------- tableau CSV (Excel, LibreOffice, Google Sheets) ----------
  const CSV_COLS = ['Client', 'Séance', 'Type', 'Exercice', 'Séries', 'Reps', 'Repos', 'Machine', 'Par côté', 'Note'];
  const fold = (v) => String(v ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();
  const slug = (v) => fold(v).replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 40) || 'x';
  function parseCsv(txt) {
    txt = String(txt).replace(/^﻿/, '');
    const first = txt.split(/\r?\n/)[0] || '';
    const sep = [';', '\t', ','].map((c) => [c, first.split(c).length]).sort((a, b) => b[1] - a[1])[0][0];
    const rows = []; let row = []; let f = ''; let q = false;
    for (let i = 0; i < txt.length; i++) {
      const c = txt[i];
      if (q) { if (c === '"') { if (txt[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
      else if (c === '"' && f === '') q = true;
      else if (c === sep) { row.push(f); f = ''; }
      else if (c === '\n' || c === '\r') { if (c === '\r' && txt[i + 1] === '\n') i++; row.push(f); rows.push(row); row = []; f = ''; }
      else f += c;
    }
    if (f !== '' || row.length) { row.push(f); rows.push(row); }
    return rows.filter((r) => r.some((x) => x.trim()));
  }
  // Repos : « 90 », « 1:30 », « 1 min 30 », « 2 min », « 45 s ».
  function parseRest(v) {
    const t = fold(v); if (!t) return 0;
    let m = t.match(/^(\d+)\s*[:']\s*(\d{1,2})/); if (m) return +m[1] * 60 + +m[2];
    m = t.match(/(\d+)\s*(min|mn|m)\b\s*(\d+)?/); if (m) return +m[1] * 60 + (+m[3] || 0);
    m = t.match(/(\d+)/); return m ? +m[1] : 0;
  }
  const yes = (v) => ['oui', 'o', 'x', 'yes', 'y', '1', 'vrai', 'true'].includes(fold(v));
  // Lignes → programmes. opts.all : tout importer ; sinon seulement les lignes pour tous + celles du client.
  function csvToSeances(txt, opts = {}) {
    const rows = parseCsv(txt);
    if (rows.length < 2) throw new Error('Tableau vide : il faut une ligne d\'en-têtes puis au moins un exercice.');
    const head = rows[0].map(fold);
    const col = (name) => head.indexOf(fold(name));
    const ix = Object.fromEntries(CSV_COLS.map((c) => [c, col(c)]));
    if (ix['Exercice'] < 0) throw new Error('Colonne « Exercice » introuvable. Pars du modèle : programmes/modele.csv.');
    const get = (r, c) => (ix[c] >= 0 ? String(r[ix[c]] ?? '').trim() : '');
    const me = (opts.client || '').split(/[,;]/).map(fold).filter(Boolean);
    const map = new Map(); let lastNom = 'Programme';
    rows.slice(1).forEach((r) => {
      const cl = get(r, 'Client');
      if (!opts.all && cl && !cl.split(/[,;]/).map(fold).some((x) => me.includes(x))) return;
      const nom = get(r, 'Séance') || lastNom; lastNom = nom;
      const key = fold(nom) + '|' + fold(cl);
      if (!map.has(key)) map.set(key, { nom, client: cl, consigne: '', echauffement: {}, finisher: {}, exercices: [] });
      const s = map.get(key);
      const type = fold(get(r, 'Type')); const ex = get(r, 'Exercice'); const note = get(r, 'Note');
      // Échauffement : durée dans Reps, récupération après l'échauffement dans Repos (anciens tableaux : durée dans Repos si Reps vide).
      if (type.startsWith('echauf')) {
        const reps = get(r, 'Reps'), rest = get(r, 'Repos');
        s.echauffement = { exercice: ex, duree_min: parseInt(reps || rest, 10) || 5, repos_s: reps && rest ? parseRest(rest) : 60, resistance: note || get(r, 'Machine') };
      }
      else if (type.startsWith('finish') || type.startsWith('fin')) s.finisher = { exercice: ex, objectif: [get(r, 'Reps'), note].filter(Boolean).join(' · ') };
      else if (type.startsWith('consigne') || (!ex && note)) s.consigne = [s.consigne, note || ex].filter(Boolean).join(' ');
      else if (ex) s.exercices.push({ nom: ex, series: get(r, 'Séries'), reps: get(r, 'Reps') || '10', repos_s: parseRest(get(r, 'Repos')) || 60, machine: get(r, 'Machine'), par_cote: yes(get(r, 'Par côté')), note });
    });
    const list = [...map.values()].filter((s) => s.exercices.length);
    if (!list.length) throw new Error(opts.all ? 'Aucun exercice trouvé dans le tableau.' : 'Aucun programme pour ce code client.');
    // Si une même séance existe pour tous et pour le client, la version du client l'emporte.
    const perso = new Set(list.filter((s) => s.client).map((s) => fold(s.nom)));
    return list.filter((s) => s.client || !perso.has(fold(s.nom)));
  }
  const csvCell = (v) => { const t = String(v ?? ''); return /[;"\n\r]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t; };
  function seancesToCsv(list) {
    const out = [CSV_COLS];
    list.forEach((s) => {
      if (s.consigne) out.push(['', s.nom, 'Consigne', '', '', '', '', '', '', s.consigne]);
      if (hasWarm(s)) out.push(['', s.nom, 'Échauffement', s.echauffement.exercice, '', s.echauffement.duree_min ? s.echauffement.duree_min + ' min' : '', fmtTime(warmRest(s)), '', '', s.echauffement.resistance || '']);
      s.exercices.forEach((e) => out.push(['', s.nom, 'Exercice', e.nom, e.series, e.reps, fmtTime(e.repos_s || 0), machineFor(e).main, e.par_cote ? 'oui' : 'non', e.note || '']));
      if (hasFin(s)) out.push(['', s.nom, 'Finisher', s.finisher.exercice, '', '', '', '', '', s.finisher.objectif || '']);
    });
    return '﻿' + out.map((r) => r.map(csvCell).join(';')).join('\r\n') + '\r\n';
  }
  async function exportCsv(list, nom) {
    const txt = seancesToCsv(list);
    const name = slug(nom) + '.csv';
    try {
      if (navigator.canShare && navigator.canShare({ files: [new File([txt], name, { type: 'text/csv' })] })) {
        return await navigator.share({ files: [new File([txt], name, { type: 'text/csv' })], title: nom });
      }
    } catch (e) { if (e && e.name === 'AbortError') return; }
    try { await navigator.clipboard.writeText(txt.replace(/^﻿/, '')); alert('Tableau copié : colle-le dans un tableur (Excel, LibreOffice, Google Sheets), il se répartit en colonnes.'); }
    catch (e) { prompt('Copie ce texte :', txt); }
  }

  // ---------- programmes du coach : récupérés depuis un tableau en ligne ----------
  // Deux réglages possibles dans branding.js :
  //  - programmesSheet : identifiant d'un Google Sheets partagé « lecteur avec le lien ».
  //    Onglet « Commun » (ou BR.ongletCommun) pour tous + un onglet par élève nommé avec son code client.
  //  - programmesUrl : un seul lien CSV (colonne Client pour cibler un élève).
  // Lien du tableau modifiable sans nouvel APK (Réglages → Changer le tableau du coach).
  try { const o = JSON.parse(localStorage.getItem('tr_sheet') || 'null'); if (o) BR.programmesSheet = o; } catch (e) { /* ignore */ }
  function changeSheet() {
    const v = prompt('Colle le lien du Google Sheets du coach (vide = tableau d\'origine) :', BR.programmesSheet ? `https://docs.google.com/spreadsheets/d/${BR.programmesSheet}/edit` : '');
    if (v === null) return;
    const m = v.match(/\/d\/([\w-]{20,})/) || v.trim().match(/^([\w-]{20,})$/);
    if (v.trim() && !m) return alert('Lien non reconnu : il doit contenir /spreadsheets/d/…');
    if (m) save('tr_sheet', m[1]); else localStorage.removeItem('tr_sheet');
    location.reload();
  }
  const hasCoachSource = () => !!(BR.programmesSheet || BR.programmesUrl);
  const sheetUrl = (tab) => `https://docs.google.com/spreadsheets/d/${encodeURIComponent(BR.programmesSheet)}/gviz/tq?tqx=out:csv&headers=1&sheet=${encodeURIComponent(tab)}&_=${Date.now()}`;
  const getText = (url) => fetch(url, { cache: 'no-store' }).then((r) => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); });
  const tryList = (txt, opts) => { try { return csvToSeances(txt, opts); } catch (e) { return []; } };
  function toCoachSeance(x, prefix) {
    const n = normalizeSeance(x);
    const base = prefix + slug(x.nom);
    n.id = base; n.coach = true;
    n.exercices.forEach((e, i) => { e.id = base + '_' + slug(e.nom) + (n.exercices.findIndex((y) => slug(y.nom) === slug(e.nom)) < i ? '_' + i : ''); });
    return n;
  }
  async function fetchCoach(client) {
    if (!BR.programmesSheet) {
      const url = BR.programmesUrl + (BR.programmesUrl.includes('?') ? '&' : '?') + '_=' + Date.now();
      return { seances: tryList(await getText(url), { client: client || load('tr_prenom', '') }).map((x) => toCoachSeance(x, 'c_')), perso: false };
    }
    const commun = await getText(sheetUrl(BR.ongletCommun || 'Commun'));
    let seances = tryList(commun, { client }).map((x) => toCoachSeance(x, 'c_'));
    let perso = false;
    if (client) {
      // Google renvoie le 1er onglet quand le nom n'existe pas : on l'écarte s'il est identique à « Commun ».
      for (const tab of [...new Set([client, client.toUpperCase()])]) {
        const txt = await getText(sheetUrl(tab)).catch(() => '');
        if (!txt || txt === commun) continue;
        const mine = tryList(txt, { all: true }).map((x) => { const n = toCoachSeance(x, 'cp_'); n.perso = true; return n; });
        if (mine.length) { seances = mine.concat(seances); perso = true; break; }
      }
    }
    return { seances, perso };
  }
  let syncing = null;
  function syncCoach(force) {
    if (!hasCoachSource()) return Promise.resolve(false);
    const st = load('tr_coach', { seances: [] });
    const client = load('tr_client', '');
    if (!force && st.at && Date.now() - Date.parse(st.at) < 3600e3 && st.client === client && st.sheet === BR.programmesSheet) return Promise.resolve(false);
    if (syncing) return syncing;
    syncing = fetchCoach(client)
      .then(({ seances, perso }) => { save('tr_coach', { at: new Date().toISOString(), client, sheet: BR.programmesSheet, seances, perso, error: '' }); return true; })
      .catch((e) => { save('tr_coach', { ...st, error: e.message || String(e), tried: new Date().toISOString() }); return false; })
      .finally(() => { syncing = null; });
    return syncing;
  }
  function coachSyncHtml() {
    if (!hasCoachSource()) return '';
    const st = load('tr_coach', { seances: [] });
    const when = st.at ? new Date(st.at).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'jamais';
    return `<div class="card"><div class="row between"><div><b>Synchronisation avec ${esc(BR.coach || 'ton coach')}</b>
      <div class="muted" style="font-size:12px">${(st.seances || []).length} programme(s)${st.client ? (st.perso ? ' · dont ton programme perso' : ' · onglet « ' + esc(st.client) + ' » introuvable dans le tableau') : ''} · mis à jour : ${esc(when)}${st.error ? ' · <span style="color:var(--danger,#d33)">hors ligne ou lien invalide</span>' : ''}</div></div>
      <button class="btn small ghost" id="coach-sync">Actualiser</button></div></div>`;
  }
  function bindCoachSync(redraw) {
    const b = $('#coach-sync');
    if (b) b.onclick = () => { b.disabled = true; b.textContent = '…'; syncCoach(true).then(redraw); };
  }

  function viewBibliotheque() {
    setTitle('Bibliothèque', '#/entrainement'); setTab('train');
    const lib = window.LIBRARY || [];
    const have = new Set(getCustom().map((s) => s.nom));
    let html = `<p class="muted">Programmes génériques à ajouter puis adapter (charges, séries, machines). Ils ne remplacent pas l'avis de ton coach.</p>`;
    lib.forEach((s, i) => {
      html += `<div class="card scard"><div class="banner" style="${bannerStyle(s)}"><h3>${esc(s.nom)}</h3></div>
        <div class="body"><div class="chips"><span class="badge">${esc(s.niveau)}</span><span class="badge">≈ ${estimMin(s)} min</span><span class="badge">${s.exercices.length} exercices</span></div>
        <p class="muted">${esc(s.description)}</p><div class="muted">${s.exercices.map((e) => esc(e.nom)).join(' · ')}</div><p></p>
        ${have.has(s.nom) ? '<span class="badge accent">Déjà ajouté</span>' : `<button class="btn small" data-add="${i}">Ajouter à mes programmes</button>`}</div></div>`;
    });
    view.innerHTML = html;
    view.querySelectorAll('[data-add]').forEach((b) => {
      b.onclick = () => { const c = cloneSeance(lib[+b.dataset.add]); location.hash = '#/seance/' + c.id; };
    });
  }

  // Éditeur : le brouillon vit en mémoire tant que la page est ouverte.
  let draft = null;
  function viewEditer(id) {
    const existing = id !== 'new' ? getCustom().find((s) => s.id === id) : null;
    if (id !== 'new' && !existing) return viewEntrainement();
    if (!draft || draft._for !== id) {
      draft = existing ? JSON.parse(JSON.stringify(existing)) : {
        nom: '', niveau: '', consigne: '', echauffement: { exercice: 'Vélo', duree_min: 5, repos_s: 60, resistance: 'Modérée' },
        finisher: { exercice: '', objectif: '' }, exercices: [{ nom: '', series: 3, reps: '10', repos_s: 90, machine: '' }],
      };
      draft._for = id;
    }
    setTitle(existing ? 'Modifier le programme' : 'Nouveau programme', existing ? '#/seance/' + id : '#/entrainement'); setTab('train');
    const d = draft;
    const f = (path, val, ph, type = 'text', mode = '') => `<input class="field" data-p="${path}" type="${type}" ${mode ? `inputmode="${mode}"` : ''} value="${esc(val ?? '')}" placeholder="${esc(ph)}">`;
    let html = `<div class="card"><label class="lbl">Nom du programme</label>${f('nom', d.nom, 'ex. Push lundi')}
      <label class="lbl">Niveau (facultatif)</label>${f('niveau', d.niveau, 'Débutant, Intermédiaire…')}
      <label class="lbl">Consigne (facultatif)</label>${f('consigne', d.consigne, 'ex. montée en charge sur le 1er exercice')}</div>
      <div class="card"><b>Échauffement</b><div class="grid2">
      <div><label class="lbl">Exercice</label>${f('echauffement.exercice', d.echauffement.exercice, 'Vélo, rameur… (vide = aucun)')}</div>
      <div><label class="lbl">Durée (min)</label>${f('echauffement.duree_min', d.echauffement.duree_min, '5', 'text', 'numeric')}</div></div>
      <label class="lbl">Récupération après l'échauffement (s)</label>${f('echauffement.repos_s', warmRest(d), '60', 'text', 'numeric')}</div>`;
    d.exercices.forEach((e, i) => {
      html += `<div class="card"><div class="row between"><b>Exercice ${i + 1}</b><span class="row" style="gap:4px">
        <button class="btn small ghost" data-up="${i}" ${i === 0 ? 'disabled' : ''}>↑</button>
        <button class="btn small ghost" data-down="${i}" ${i === d.exercices.length - 1 ? 'disabled' : ''}>↓</button>
        <button class="btn small ghost" data-rmex="${i}">✕</button></span></div>
        <label class="lbl">Nom</label>${f(`exercices.${i}.nom`, e.nom, 'ex. Développé couché')}
        <label class="lbl">Machine</label>${f(`exercices.${i}.machine`, machineName(e.machine || ''), 'ex. Banc + barre')}
        <div class="grid3"><div><label class="lbl">Séries</label>${f(`exercices.${i}.series`, e.series, '3', 'text', 'numeric')}</div>
        <div><label class="lbl"><select class="mode" data-mode="${i}" aria-label="Répétitions ou durée"><option value="reps">Reps</option><option value="sec" ${timedSec(e.reps) ? 'selected' : ''}>Durée (s)</option></select></label>${timedSec(e.reps) ? `<input class="field" data-sec="${i}" inputmode="numeric" value="${timedSec(e.reps)}" placeholder="45">` : f(`exercices.${i}.reps`, e.reps, '10')}</div>
        <div><label class="lbl">Repos (s)</label>${f(`exercices.${i}.repos_s`, e.repos_s, '90', 'text', 'numeric')}</div></div>
        <label class="row" style="margin-top:8px"><input type="checkbox" data-cote="${i}" ${e.par_cote ? 'checked' : ''}> Par côté (fentes, unilatéral…)</label></div>`;
    });
    html += `<button class="btn block ghost" id="addex">+ Ajouter un exercice</button><p></p>
      <div class="card"><b>Finisher (facultatif)</b>
      <label class="lbl">Exercice</label>${f('finisher.exercice', d.finisher.exercice, 'ex. Rameur')}
      <label class="lbl">Objectif</label>${f('finisher.objectif', d.finisher.objectif, 'ex. 3 km')}</div>
      <button class="btn block" id="saveprog">Enregistrer</button><p></p>
      <button class="btn block ghost" id="cancelprog">Annuler</button>`;
    view.innerHTML = html;
    view.querySelectorAll('[data-p]').forEach((inp) => {
      inp.oninput = () => {
        const parts = inp.dataset.p.split('.'); let o = d;
        while (parts.length > 1) o = o[parts.shift()];
        o[parts[0]] = inp.value;
      };
    });
    view.querySelectorAll('[data-mode]').forEach((m) => {
      m.onchange = () => { const e = d.exercices[+m.dataset.mode]; e.reps = m.value === 'sec' ? '30 s' : '10'; viewEditer(id); };
    });
    view.querySelectorAll('[data-sec]').forEach((inp) => {
      inp.oninput = () => { d.exercices[+inp.dataset.sec].reps = (parseInt(inp.value, 10) || 30) + ' s'; };
    });
    view.querySelectorAll('[data-cote]').forEach((c) => { c.onchange = () => { d.exercices[+c.dataset.cote].par_cote = c.checked; }; });
    const move = (i, j) => { const a = d.exercices; [a[i], a[j]] = [a[j], a[i]]; viewEditer(id); };
    view.querySelectorAll('[data-up]').forEach((b) => { b.onclick = () => move(+b.dataset.up, +b.dataset.up - 1); });
    view.querySelectorAll('[data-down]').forEach((b) => { b.onclick = () => move(+b.dataset.down, +b.dataset.down + 1); });
    view.querySelectorAll('[data-rmex]').forEach((b) => { b.onclick = () => { d.exercices.splice(+b.dataset.rmex, 1); viewEditer(id); }; });
    $('#addex').onclick = () => { const l = d.exercices[d.exercices.length - 1] || {}; d.exercices.push({ nom: '', series: l.series || 3, reps: l.reps || '10', repos_s: l.repos_s || 90, machine: '' }); viewEditer(id); };
    $('#cancelprog').onclick = () => { draft = null; history.back(); };
    $('#saveprog').onclick = () => {
      if (!String(d.nom).trim()) return alert('Donne un nom au programme.');
      if (!d.exercices.some((e) => String(e.nom).trim())) return alert('Ajoute au moins un exercice avec un nom.');
      const clean = normalizeSeance(d);
      const list = getCustom();
      if (existing) {
        // garde les identifiants des exercices existants (historique et photos rattachés)
        clean.id = existing.id;
        clean.exercices.forEach((e, i) => { const src = d.exercices.filter((x) => String(x.nom).trim())[i]; if (src && src.id) e.id = src.id; if (src && src.img) e.img = src.img; });
        setCustom(list.map((s) => (s.id === existing.id ? clean : s)));
      } else setCustom(list.concat(clean));
      draft = null;
      location.hash = '#/seance/' + clean.id;
    };
  }

  function viewContact() {
    setTitle('Contact', '#/reglages'); setTab('reglages');
    const c = BR.contact;
    const items = [
      c.email && ['E-mail', c.email, `mailto:${encodeURIComponent(c.email)}?subject=${encodeURIComponent(BR.nomApp + ' : question')}`],
      c.telephone && ['Téléphone', c.telephone, 'tel:' + String(c.telephone).replace(/[^+0-9]/g, '')],
      c.site && ['Site', c.site.replace(/^https?:\/\//, ''), /^https?:/.test(c.site) ? c.site : 'https://' + c.site],
      c.instagram && ['Instagram', '@' + c.instagram.replace(/^@/, ''), 'https://instagram.com/' + encodeURIComponent(c.instagram.replace(/^@/, ''))],
      c.adresse && ['Adresse', c.adresse, 'https://www.openstreetmap.org/search?query=' + encodeURIComponent(c.adresse)],
    ].filter(Boolean);
    view.innerHTML = `${BR.logoComplet ? `<div class="card" style="text-align:center;background:#fff"><img src="${esc(BR.logoComplet)}" alt="${esc(BR.coach || BR.nomApp)}" style="max-width:100%;max-height:160px"></div>` : ''}
      <div class="card">${items.length ? items.map(([l, v, href]) => `<a class="list-item" href="${esc(href)}" style="color:inherit;text-decoration:none"><span class="muted">${l}</span><span class="link-accent">${esc(v)}</span></a>`).join('') : '<p class="muted">Aucune coordonnée renseignée.</p>'}</div>`;
  }

  // ---------- profil : IMC ----------
  function imcHtml() {
    const t = num(load('tr_taille', '')), p = num(load('tr_poids', ''));
    if (!t || !p || t < 100 || t > 250 || p < 30 || p > 300) return '';
    const v = p / Math.pow(t / 100, 2);
    const cat = v < 18.5 ? 'insuffisance pondérale' : v < 25 ? 'corpulence normale' : v < 30 ? 'surpoids' : 'obésité';
    return `IMC : <b>${v.toFixed(1)}</b> (${cat}). Indicatif seulement : l'IMC ne distingue pas muscle et graisse, il surestime donc les profils musclés.`;
  }

  // ---------- premier lancement ----------
  let obStep = 0;
  function viewOnboarding() {
    setTitle(BR.nomApp); document.body.classList.add('onboarding');
    const steps = 3;
    const dots = `<div class="dots">${Array.from({ length: steps }, (_, i) => `<span class="${i === obStep ? 'on' : ''}"></span>`).join('')}</div>`;
    const logo = BR.logo ? `<img class="ob-logo" src="${esc(BR.logo)}" alt="" onerror="this.remove()">` : '';
    let body = '';
    if (obStep === 0) {
      body = `${logo}<h2 class="ob-title">Bienvenue sur ${esc(BR.nomApp)}</h2>
        <p class="muted">Comment t'appelles-tu ?</p>
        <input class="field" id="ob-prenom" maxlength="30" autocomplete="given-name" placeholder="Ton prénom" value="${esc(load('tr_prenom', ''))}">
        ${hasCoachSource() ? `<p class="muted" style="margin-top:14px">Code client donné par ${esc(BR.coach || 'ton coach')} (facultatif)</p>
        <input class="field" id="ob-client" maxlength="60" autocapitalize="characters" placeholder="ex. MD202615" value="${esc(load('tr_client', ''))}">` : ''}`;
    } else if (obStep === 1) {
      let theme = 'system'; try { theme = localStorage.getItem('tr_theme') || 'system'; } catch (e) { /* ignore */ }
      body = `<h2 class="ob-title">Quel affichage préfères-tu ?</h2>
        <div class="ob-themes">${[['system', 'Comme le téléphone', '◐'], ['light', 'Clair', '☀'], ['dark', 'Sombre', '☾']].map(([k, l, i]) =>
          `<button class="ob-theme ${theme === k ? 'on' : ''}" data-t="${k}"><span>${i}</span>${l}</button>`).join('')}</div>`;
    } else {
      body = `<h2 class="ob-title">Ta taille et ton poids</h2>
        <p class="muted">Facultatif : sert à afficher ton IMC dans Réglages. Tu peux passer et le remplir plus tard.</p>
        <div class="grid2" style="grid-template-columns:1fr 1fr"><div><label class="lbl" for="ob-taille">Taille (cm)</label><input class="field" id="ob-taille" inputmode="numeric" value="${esc(load('tr_taille', ''))}"></div>
        <div><label class="lbl" for="ob-poids">Poids (kg)</label><input class="field" id="ob-poids" inputmode="decimal" value="${esc(load('tr_poids', ''))}"></div></div>
        <div class="muted" id="ob-imc" style="margin-top:10px"></div>`;
    }
    view.innerHTML = `<div class="ob">${dots}<div class="ob-body">${body}</div>
      <div class="ob-actions">${obStep > 0 ? '<button class="btn ghost" id="ob-prev">Retour</button>' : '<span></span>'}
      <button class="btn" id="ob-next">${obStep === steps - 1 ? 'C\'est parti' : 'Suivant'}</button></div>
      ${obStep === steps - 1 ? '<button class="link-btn" id="ob-skip">Passer cette étape</button>' : ''}</div>`;
    const keep = () => {
      if ($('#ob-prenom')) save('tr_prenom', $('#ob-prenom').value.trim());
      if ($('#ob-client')) save('tr_client', $('#ob-client').value.trim());
      if ($('#ob-taille')) { save('tr_taille', $('#ob-taille').value.trim()); save('tr_poids', $('#ob-poids').value.trim()); }
    };
    if ($('#ob-prenom')) { $('#ob-prenom').focus(); $('#ob-prenom').onkeydown = (e) => { if (e.key === 'Enter') $('#ob-next').click(); }; }
    view.querySelectorAll('.ob-theme').forEach((b) => { b.onclick = () => { setTheme(b.dataset.t); viewOnboarding(); }; });
    if ($('#ob-taille')) {
      const upd = () => { save('tr_taille', $('#ob-taille').value.trim()); save('tr_poids', $('#ob-poids').value.trim()); $('#ob-imc').innerHTML = imcHtml(); };
      $('#ob-taille').oninput = upd; $('#ob-poids').oninput = upd; upd();
    }
    const finish = () => { save('tr_onboarded', true); obStep = 0; document.body.classList.remove('onboarding'); location.hash = '#/'; route(); };
    if ($('#ob-prev')) $('#ob-prev').onclick = () => { keep(); obStep--; viewOnboarding(); };
    $('#ob-next').onclick = () => { keep(); if (obStep < steps - 1) { obStep++; viewOnboarding(); } else finish(); };
    if ($('#ob-skip')) $('#ob-skip').onclick = () => { save('tr_taille', ''); save('tr_poids', ''); finish(); };
  }

  // ---------- mises à jour (APK publiés sur un dépôt GitHub public) ----------
  const verNum = (v) => String(v || '').replace(/^v/, '').split('.').map((x) => parseInt(x, 10) || 0);
  const newer = (a, b) => { const x = verNum(a), y = verNum(b); for (let i = 0; i < Math.max(x.length, y.length); i++) { if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0); } return false; };
  function pendingUpdate() {
    const u = load('tr_upd', null);
    return u && window.APP_VERSION && window.APP_VERSION !== 'dev' && newer(u.version, window.APP_VERSION) ? u : null;
  }
  function checkUpdate(force) {
    if (!BR.majDepot) return Promise.resolve(null);
    const last = load('tr_upd_at', 0);
    if (!force && Date.now() - last < 6 * 3600e3) return Promise.resolve(pendingUpdate());
    return fetch(`https://api.github.com/repos/${BR.majDepot}/releases/latest`, { cache: 'no-store', headers: { Accept: 'application/vnd.github+json' } })
      .then((r) => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then((rel) => {
        const apk = (rel.assets || []).find((a) => /\.apk$/i.test(a.name));
        save('tr_upd_at', Date.now());
        if (apk) save('tr_upd', { version: String(rel.tag_name || '').replace(/^v/, ''), url: apk.browser_download_url });
        return pendingUpdate();
      })
      .catch(() => pendingUpdate());
  }
  function updateHtml(inSettings) {
    const u = pendingUpdate();
    if (!u) return '';
    return `<div class="card upd"><div class="row between"><div><b>Nouvelle version ${esc(u.version)}</b>
      <div class="muted" style="font-size:12px">Tes séances et réglages sont conservés.${inSettings ? '' : ' Android te demandera de confirmer l\'installation.'}</div></div>
      <a class="btn small" data-upd href="${esc(u.url)}" target="_blank" rel="noopener">Mettre à jour</a></div></div>`;
  }
  // Le téléchargement doit se faire dans le navigateur du téléphone (la vue de l'appli ne sait pas enregistrer de fichier).
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[data-upd]');
    if (!a) return;
    const L = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AppLauncher;
    if (!L) return; // version web : lien normal
    e.preventDefault();
    L.openUrl({ url: a.href }).catch(() => { window.location.href = a.href; });
  });

  // ---------- routeur ----------
  function route() {
    const parts = (location.hash || '#/').slice(2).split('/');
    window.scrollTo(0, 0);
    if (!load('tr_onboarded', false)) return viewOnboarding();
    switch (parts[0]) {
      case 'seance': return viewSeance(parts[1]);
      case 'historique': return viewHistorique(parts[1]);
      case 'agenda': return viewAgenda();
      case 'progres': return parts[1] ? viewProgresEx(parts[1]) : viewProgres();
      case 'reglages': return viewReglages();
      case 'contact': return viewContact();
      case 'entrainement': return viewEntrainement();
      case 'bibliotheque': return viewBibliotheque();
      case 'editer': return viewEditer(parts[1] || 'new');
      case 'machines': return viewMachines();
      default: return viewHome();
    }
  }
  window.addEventListener('hashchange', route);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && !$('#timer').hidden && !$('#timer').classList.contains('finished')) updateTimer(); });
  route();
  flushShare();
  checkUpdate(false).then((u) => { if (u && /^#\/?$|^$/.test(location.hash)) route(); });
  syncCoach(false).then((changed) => { if (changed && /^#\/(entrainement)?$|^$/.test(location.hash)) route(); });
})();
