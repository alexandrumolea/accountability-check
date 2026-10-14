import { CONDITIONS, SCALE, TOTAL_ITEMS, LEVELS, DIVERGENCE, OUTLIER } from "./data.js";
import * as store from "./store.js";

const $app = document.getElementById("app");
const params = new URLSearchParams(location.search);
const CODE = (params.get("s") || "").toUpperCase();
const KEY = params.get("k") || "";

// ---------- utilitare ----------
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN);
const fmt = (n) => (Number.isFinite(n) ? n.toFixed(1).replace(".", ",") : "–");
const level = (avg) => LEVELS.find((l) => avg >= l.min);
const ls = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
};
const offsets = CONDITIONS.reduce((acc, c, i) => (acc.push(i ? acc[i - 1] + CONDITIONS[i - 1].items.length : 0), acc), []);
const baseUrl = () => location.origin + location.pathname;
const participantUrl = (code) => `${baseUrl()}?s=${code}`;
const adminUrl = (code, key) => `${baseUrl()}?s=${code}&k=${key}`;
const fmtDate = (ts) => new Date(ts).toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric" });

const header = (extra = "") => `
  <header class="topbar no-print">
    <a class="brand" href="${baseUrl()}"><img src="assets/innersis-logo.png" alt="Innersis" width="94" height="33"></a>
    ${extra}
    ${store.isDemo ? `<span class="demo-pill" title="Firebase nu este configurat. Datele stau doar în acest browser.">Mod demo</span>` : ""}
  </header>`;

// ======================================================================
// ACASĂ: sesiune nouă / intrare în sesiune
// ======================================================================
function renderHome() {
  const mine = ls.get("acc5_my", []);
  $app.innerHTML = `
    ${header()}
    <main class="home">
      <section class="hero">
        <p class="eyebrow gold">Evaluare de echipă</p>
        <h1>Cele 5 condiții ale accountability-ului</h1>
        <p class="lead">Claritate, Capabilitate, Autoritate, Vizibilitate, Consecințe. Fiecare participant evaluează ${TOTAL_ITEMS} afirmații pe o scală de la 1 la 5. Rezultatele arată media fiecărei condiții și unde vă vedeți diferit.</p>
      </section>
      <section class="cards">
        <form class="card" id="newForm">
          <p class="eyebrow">Facilitator</p>
          <h2>Sesiune nouă</h2>
          <label>Numele sesiunii / echipei<input name="name" required maxlength="80" placeholder="ex. Echipa de vânzări, octombrie"></label>
          <label>Câți participanți așteptați?<input name="expected" type="number" min="1" max="200" value="8" required></label>
          <button class="btn primary" type="submit">Creează sesiunea</button>
        </form>
        <form class="card" id="joinForm">
          <p class="eyebrow">Participant</p>
          <h2>Intră într-o sesiune</h2>
          <label>Codul sesiunii<input name="code" required maxlength="6" placeholder="ex. K7M2QX" class="code-input" autocomplete="off"></label>
          <button class="btn" type="submit">Continuă</button>
          <p class="hint" id="joinErr"></p>
        </form>
      </section>
      ${mine.length ? `
      <section class="mine">
        <p class="eyebrow">Sesiunile create în acest browser</p>
        <ul>${mine.slice().reverse().map((s) => `
          <li><a href="${adminUrl(s.code, s.adminKey)}"><strong>${esc(s.name)}</strong><span>${s.code} · ${fmtDate(s.createdAt)}</span></a></li>`).join("")}
        </ul>
      </section>` : ""}
    </main>`;

  document.getElementById("newForm").onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const btn = e.target.querySelector("button");
    btn.disabled = true; btn.textContent = "Se creează…";
    try {
      const name = fd.get("name").trim();
      const expected = Math.max(1, parseInt(fd.get("expected"), 10) || 1);
      const { code, adminKey } = await store.createSession({ name, expected });
      ls.set("acc5_my", [...ls.get("acc5_my", []), { code, adminKey, name, createdAt: Date.now() }]);
      location.href = adminUrl(code, adminKey);
    } catch (err) {
      console.error(err);
      btn.disabled = false; btn.textContent = "Creează sesiunea";
      alert("Sesiunea nu a putut fi creată. Verifică configurația Firebase.");
    }
  };
  document.getElementById("joinForm").onsubmit = async (e) => {
    e.preventDefault();
    const code = new FormData(e.target).get("code").trim().toUpperCase();
    if (await store.getSession(code)) location.href = participantUrl(code);
    else document.getElementById("joinErr").textContent = "Nu există o sesiune cu acest cod.";
  };
}

// ======================================================================
// PARTICIPANT: nume → 5 condiții → trimitere
// ======================================================================
async function renderParticipant() {
  const session = await store.getSession(CODE);
  if (!session) return renderMissing();
  const LKEY = `acc5_p_${CODE}`;
  const me = ls.get(LKEY, { pid: null, name: "", answers: Array(TOTAL_ITEMS).fill(null), submitted: false });
  if (!Array.isArray(me.answers) || me.answers.length !== TOTAL_ITEMS) me.answers = Array(TOTAL_ITEMS).fill(null);
  const save = () => ls.set(LKEY, me);
  let step = me.submitted ? "done" : me.pid ? firstIncomplete() : "name";

  function firstIncomplete() {
    const i = CONDITIONS.findIndex((c, ci) => c.items.some((_, ii) => me.answers[offsets[ci] + ii] == null));
    return i === -1 ? "review" : i;
  }

  function draw() {
    window.scrollTo(0, 0);
    if (step === "name") return drawName();
    if (step === "review") return drawReview();
    if (step === "done") return drawDone();
    drawCondition(step);
  }

  function drawName() {
    $app.innerHTML = `
      ${header()}
      <main class="center">
        <form class="card narrow" id="nameForm">
          <p class="eyebrow gold">${esc(session.meta.name)}</p>
          <h1 class="serif">Bun venit</h1>
          <p>Vei evalua ${TOTAL_ITEMS} afirmații, grupate în cele 5 condiții ale accountability-ului. Gândește-te la echipa ta, așa cum funcționează azi, nu cum ar trebui să funcționeze.</p>
          <label>Numele tău<input name="name" required maxlength="60" value="${esc(me.name)}" autocomplete="name"></label>
          <button class="btn primary" type="submit">Începe evaluarea</button>
        </form>
      </main>`;
    document.getElementById("nameForm").onsubmit = async (e) => {
      e.preventDefault();
      me.name = new FormData(e.target).get("name").trim();
      me.pid ||= store.randomId(12);
      save();
      await store.joinSession(CODE, me.pid, me.name);
      step = firstIncomplete();
      draw();
    };
  }

  function drawCondition(ci) {
    const c = CONDITIONS[ci];
    $app.innerHTML = `
      ${header(`<div class="steps">${CONDITIONS.map((x, i) => `<span class="${i === ci ? "on" : i < ci ? "past" : ""}" title="${x.title}"></span>`).join("")}</div>`)}
      <main class="slide">
        <aside class="slide-left">
          <div class="orb"></div>
          <p class="eyebrow gold spaced">Condiția ${ci + 1} din ${CONDITIONS.length}</p>
          <h1 class="serif">${c.title}</h1>
          <p class="desc">${c.desc}</p>
          <div class="reflect"><p>${c.question}</p></div>
        </aside>
        <section class="slide-right">
          <p class="eyebrow teal spaced">Cât de mult este adevărat pentru echipa ta?</p>
          <ol class="items">
            ${c.items.map((t, ii) => {
              const idx = offsets[ci] + ii;
              return `
              <li class="item">
                <span class="num">${ii + 1}</span>
                <div class="item-body">
                  <p>${t}</p>
                  <div class="scale" role="radiogroup" aria-label="Afirmația ${ii + 1}">
                    ${SCALE.map((s) => `<button type="button" role="radio" aria-checked="${me.answers[idx] === s.v}" class="${me.answers[idx] === s.v ? "sel" : ""}" data-idx="${idx}" data-v="${s.v}" title="${s.label}">${s.v}</button>`).join("")}
                  </div>
                  <div class="scale-labels"><span>${SCALE[0].label}</span><span>${SCALE[4].label}</span></div>
                </div>
              </li>`;
            }).join("")}
          </ol>
          <div class="nav">
            <button class="btn ghost" id="back">${ci === 0 ? "Schimbă numele" : "Înapoi"}</button>
            <span class="hint" id="navHint"></span>
            <button class="btn primary" id="next">${ci === CONDITIONS.length - 1 ? "Verifică răspunsurile" : "Următoarea condiție"}</button>
          </div>
        </section>
      </main>`;
    $app.querySelectorAll(".scale button").forEach((b) => (b.onclick = () => {
      me.answers[+b.dataset.idx] = +b.dataset.v;
      save();
      b.parentElement.querySelectorAll("button").forEach((x) => { x.classList.toggle("sel", x === b); x.setAttribute("aria-checked", x === b); });
      b.closest(".item").classList.remove("missing");
    }));
    document.getElementById("back").onclick = () => { step = ci === 0 ? "name" : ci - 1; draw(); };
    document.getElementById("next").onclick = () => {
      const missing = c.items.map((_, ii) => offsets[ci] + ii).filter((i) => me.answers[i] == null);
      if (missing.length) {
        $app.querySelectorAll(".item").forEach((el, ii) => el.classList.toggle("missing", me.answers[offsets[ci] + ii] == null));
        document.getElementById("navHint").textContent = "Alege o notă pentru fiecare afirmație.";
        return;
      }
      step = ci === CONDITIONS.length - 1 ? "review" : ci + 1;
      draw();
    };
  }

  function drawReview() {
    $app.innerHTML = `
      ${header()}
      <main class="page">
        <p class="eyebrow gold">${esc(session.meta.name)}</p>
        <h1 class="serif dark">Verifică și trimite</h1>
        <p>${esc(me.name)}, acestea sunt răspunsurile tale. Apasă pe o condiție ca să modifici ceva.</p>
        <div class="review">
          ${CONDITIONS.map((c, ci) => `
            <button class="review-row" data-ci="${ci}">
              <strong>${c.title}</strong>
              <span class="dots">${c.items.map((_, ii) => `<i class="s${me.answers[offsets[ci] + ii]}">${me.answers[offsets[ci] + ii]}</i>`).join("")}</span>
            </button>`).join("")}
        </div>
        <div class="nav">
          <button class="btn ghost" id="back">Înapoi</button>
          <span class="hint" id="navHint"></span>
          <button class="btn primary" id="submit">Trimite evaluarea</button>
        </div>
      </main>`;
    $app.querySelectorAll(".review-row").forEach((b) => (b.onclick = () => { step = +b.dataset.ci; draw(); }));
    document.getElementById("back").onclick = () => { step = CONDITIONS.length - 1; draw(); };
    document.getElementById("submit").onclick = async (e) => {
      e.target.disabled = true; e.target.textContent = "Se trimite…";
      try {
        if (!(await store.getSession(CODE))?.participants?.[me.pid]) await store.joinSession(CODE, me.pid, me.name);
        await store.submitAnswers(CODE, me.pid, me.answers);
        me.submitted = true; save();
        step = "done"; draw();
      } catch (err) {
        console.error(err);
        e.target.disabled = false; e.target.textContent = "Trimite evaluarea";
        document.getElementById("navHint").textContent = "Nu s-a putut trimite. Verifică conexiunea și încearcă din nou.";
      }
    };
  }

  function drawDone() {
    $app.innerHTML = `
      ${header()}
      <main class="center">
        <div class="card narrow done">
          <div class="check">✓</div>
          <h1 class="serif">Mulțumim, ${esc(me.name)}!</h1>
          <p>Răspunsurile tale au fost înregistrate în sesiunea <strong>${esc(session.meta.name)}</strong>. Facilitatorul va prezenta rezultatele echipei.</p>
          <button class="btn ghost" id="edit">Modifică răspunsurile</button>
        </div>
      </main>`;
    document.getElementById("edit").onclick = () => { me.submitted = false; save(); step = "review"; draw(); };
  }

  draw();
}

function renderMissing() {
  $app.innerHTML = `${header()}<main class="center"><div class="card narrow"><h1 class="serif">Sesiunea nu există</h1><p>Verifică linkul sau codul primit de la facilitator.</p><a class="btn" href="${baseUrl()}">Pagina principală</a></div></main>`;
}

// ======================================================================
// FACILITATOR: status live + rezultate pe condiții + sumar + PDF
// ======================================================================
function renderAdmin() {
  let anon = false;
  let last = null;
  let firstRender = true;

  store.watchSession(CODE, (session) => {
    if (!session) return renderMissing();
    if (session.meta.adminKey !== KEY) {
      $app.innerHTML = `${header()}<main class="center"><div class="card narrow"><h1 class="serif">Acces restricționat</h1><p>Linkul de facilitator nu este valid.</p></div></main>`;
      return;
    }
    last = session;
    const y = window.scrollY;
    draw(session);
    if (!firstRender) window.scrollTo(0, y);
    firstRender = false;
  });

  function draw(session) {
    const { meta } = session;
    const all = Object.entries(session.participants || {}).map(([pid, p]) => ({ pid, ...p })).sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0));
    const done = all.filter((p) => Array.isArray(p.answers) && p.answers.length === TOTAL_ITEMS);
    const people = done.map((p, i) => ({ ...p, label: anon ? `P${i + 1}` : p.name }));
    const pct = Math.min(100, Math.round((done.length / meta.expected) * 100));
    const link = participantUrl(CODE);

    $app.innerHTML = `
      ${header(`<nav class="topnav">
        <a href="#status">Status</a>
        ${CONDITIONS.map((c) => `<a href="#c-${c.id}">${c.title}</a>`).join("")}
        <a href="#sumar">Sumar</a>
      </nav>`)}
      <main class="report">
        <section class="print-cover">
          <img class="cover-logo" src="assets/innersis-logo.png" alt="Innersis" width="141" height="50">
          <p class="eyebrow gold spaced">Evaluare accountability · 5 condiții</p>
          <h1 class="serif">${esc(meta.name)}</h1>
          <p>${fmtDate(Date.now())} · ${done.length} ${done.length === 1 ? "participant" : "participanți"}${anon ? "" : `: ${people.map((p) => esc(p.name)).join(", ")}`}</p>
        </section>

        <section id="status" class="status no-print">
          <div class="status-head">
            <div>
              <p class="eyebrow gold spaced">Sesiune · cod ${CODE}</p>
              <h1 class="serif">${esc(meta.name)}</h1>
              <p class="muted">Creată pe ${fmtDate(meta.createdAt)}</p>
            </div>
            <div class="status-actions">
              <label class="toggle"><input type="checkbox" id="anon" ${anon ? "checked" : ""}> Ascunde numele</label>
              <button class="btn primary" id="pdf" ${done.length ? "" : "disabled"}>Salvează PDF</button>
            </div>
          </div>
          <div class="status-grid">
            <div class="share">
              <div id="qr" class="qr"></div>
              <div>
                <p class="eyebrow">Link pentru participanți</p>
                <div class="linkbox"><input readonly value="${link}" id="plink"><button class="btn" id="copy">Copiază</button></div>
                <p class="muted small">Sau codul <strong class="code">${CODE}</strong> pe pagina principală. Păstrează linkul acestei pagini: este linkul tău de facilitator.</p>
              </div>
            </div>
            <div class="counter">
              <div class="counter-nums">
                <div><strong>${all.length}</strong><span>înregistrați</span></div>
                <div><strong>${done.length}</strong><span>au completat</span></div>
                <div><strong>${meta.expected}</strong><span>așteptați</span></div>
              </div>
              <div class="bar"><span style="width:${pct}%"></span></div>
              <p class="muted small">${done.length >= meta.expected ? "Toți participanții așteptați au completat." : `Mai așteptăm ${meta.expected - done.length}.`} Pagina se actualizează automat.</p>
              <ul class="plist">
                ${all.map((p) => `<li><span class="st ${p.answers ? "ok" : ""}"></span>${esc(p.name)}<em>${p.answers ? "a completat" : "în lucru"}</em><button class="x" data-pid="${p.pid}" title="Elimină din sesiune">×</button></li>`).join("") || `<li class="muted">Încă nu s-a înregistrat nimeni.</li>`}
              </ul>
            </div>
          </div>
        </section>

        ${done.length ? CONDITIONS.map((c, ci) => conditionSection(c, ci, people)).join("") + summarySection(people) : `<section class="empty no-print"><p>Rezultatele apar aici imediat ce primul participant trimite evaluarea.</p></section>`}
      </main>`;

    // QR
    if (window.QRCode) new QRCode(document.getElementById("qr"), { text: link, width: 132, height: 132, colorDark: "#1b2f4a", colorLight: "#ffffff" });
    document.getElementById("copy").onclick = async (e) => {
      try { await navigator.clipboard.writeText(link); } catch { document.getElementById("plink").select(); document.execCommand("copy"); }
      e.target.textContent = "Copiat ✓"; setTimeout(() => (e.target.textContent = "Copiază"), 1500);
    };
    document.getElementById("anon").onchange = (e) => { anon = e.target.checked; draw(last); };
    document.getElementById("pdf").onclick = () => {
      const prev = document.title;
      document.title = `Accountability - ${meta.name}`;
      window.print();
      document.title = prev;
    };
    $app.querySelectorAll(".plist .x").forEach((b) => (b.onclick = () => {
      const p = all.find((x) => x.pid === b.dataset.pid);
      if (confirm(`Elimini pe ${p.name} din sesiune? Răspunsurile lui/ei vor fi șterse.`)) store.removeParticipant(CODE, p.pid);
    }));
  }
}

// ---------- calcule ----------
function statsFor(ci, people) {
  const c = CONDITIONS[ci];
  const rows = c.items.map((text, ii) => {
    const scores = people.map((p) => p.answers[offsets[ci] + ii]);
    const m = mean(scores);
    const spread = Math.max(...scores) - Math.min(...scores);
    return { text, ii, scores, mean: m, spread, min: Math.min(...scores), max: Math.max(...scores) };
  });
  const personAvg = people.map((_, pi) => mean(rows.map((r) => r.scores[pi])));
  const avg = mean(rows.flatMap((r) => r.scores));
  return { rows, personAvg, avg, maxSpread: Math.max(...rows.map((r) => r.spread)) };
}

const divClass = (spread) => (spread >= DIVERGENCE.high ? "div-high" : spread >= DIVERGENCE.medium ? "div-med" : "");
const divLabel = (spread) => (spread >= DIVERGENCE.high ? "Divergență mare" : spread >= DIVERGENCE.medium ? "Divergență" : "Aliniere");

function conditionSection(c, ci, people) {
  const s = statsFor(ci, people);
  const lv = level(s.avg);
  return `
  <section class="cond page-break" id="c-${c.id}">
    <div class="cond-head">
      <div class="cond-title">
        <p class="eyebrow gold spaced">Condiția ${ci + 1} din ${CONDITIONS.length}</p>
        <h2 class="serif">${c.title}</h2>
        <p class="desc">${c.desc}</p>
      </div>
      <div class="avg-badge ${lv.cls}">
        <strong>${fmt(s.avg)}</strong>
        <span>media condiției</span>
        <em>${lv.label}</em>
      </div>
    </div>
    <div class="table-wrap">
      <table class="scores">
        <thead>
          <tr>
            <th class="stmt">Afirmație</th>
            ${people.map((p) => `<th class="person"><span>${esc(p.label)}</span></th>`).join("")}
            <th class="agg">Media</th>
            <th class="agg">Dif.</th>
          </tr>
        </thead>
        <tbody>
          ${s.rows.map((r) => `
          <tr class="${divClass(r.spread)}">
            <td class="stmt"><span class="n">${r.ii + 1}</span>${r.text}${r.spread >= DIVERGENCE.medium ? `<span class="flag">${divLabel(r.spread)}</span>` : ""}</td>
            ${r.scores.map((v) => `<td class="sc s${v}${people.length > 1 && Math.abs(v - r.mean) >= OUTLIER ? " outlier" : ""}">${v}</td>`).join("")}
            <td class="agg strong">${fmt(r.mean)}</td>
            <td class="agg"><span class="spread ${divClass(r.spread)}">${r.spread}</span></td>
          </tr>`).join("")}
        </tbody>
        <tfoot>
          <tr>
            <td class="stmt">Media persoanei</td>
            ${s.personAvg.map((v) => `<td class="sc avg">${fmt(v)}</td>`).join("")}
            <td class="agg strong">${fmt(s.avg)}</td>
            <td class="agg"></td>
          </tr>
        </tfoot>
      </table>
    </div>
    <div class="legend">
      <span><i class="sw s1"></i>1</span><span><i class="sw s2"></i>2</span><span><i class="sw s3"></i>3</span><span><i class="sw s4"></i>4</span><span><i class="sw s5"></i>5</span>
      <span><i class="sw outlier-sw"></i>notă departe de medie (±${String(OUTLIER).replace(".", ",")})</span>
      <span><i class="sw div-med-sw"></i>diferență ≥ ${DIVERGENCE.medium}</span>
      <span><i class="sw div-high-sw"></i>diferență ≥ ${DIVERGENCE.high}</span>
    </div>
    <div class="keymsg"><i></i><p>${c.key}</p></div>
  </section>`;
}

function summarySection(people) {
  const stats = CONDITIONS.map((c, ci) => ({ c, ci, ...statsFor(ci, people) }));
  const overall = mean(stats.map((s) => s.avg));
  const sorted = [...stats].sort((a, b) => b.avg - a.avg);
  const strongest = sorted[0], weakest = sorted[sorted.length - 1];
  const allRows = stats.flatMap((s) => s.rows.map((r) => ({ ...r, cond: s.c.title, ci: s.ci })));
  const divergent = allRows.filter((r) => r.spread >= DIVERGENCE.medium).sort((a, b) => b.spread - a.spread || a.mean - b.mean).slice(0, 6);
  const lowest = [...allRows].sort((a, b) => a.mean - b.mean).slice(0, 3);
  const highest = [...allRows].sort((a, b) => b.mean - a.mean).slice(0, 3);
  const stmtLine = (r, val) => `<li><span class="pill">${r.cond} · ${r.ii + 1}</span><p>${r.text}</p><strong>${val}</strong></li>`;

  return `
  <section class="summary page-break" id="sumar">
    <p class="eyebrow gold spaced">Sumar</p>
    <h2 class="serif">Imaginea de ansamblu</h2>
    <div class="sum-top">
      <div class="avg-badge big ${level(overall).cls}">
        <strong>${fmt(overall)}</strong><span>indicele general</span><em>${level(overall).label}</em>
      </div>
      <div class="sum-text">
        <p>Pe baza a <strong>${people.length}</strong> ${people.length === 1 ? "evaluare" : "evaluări"}, cea mai puternică condiție este <strong>${strongest.c.title}</strong> (${fmt(strongest.avg)}), iar cea mai fragilă este <strong>${weakest.c.title}</strong> (${fmt(weakest.avg)}).</p>
        <p>${divergent.length ? `Echipa se vede diferit pe <strong>${divergent.length}</strong> ${divergent.length === 1 ? "afirmație" : "afirmații"} (diferență de cel puțin ${DIVERGENCE.medium} puncte între note). Acolo merită început dialogul.` : "Nu există diferențe mari între participanți: echipa are o imagine comună asupra situației."}</p>
      </div>
    </div>

    <div class="bars">
      ${stats.map((s) => `
        <div class="bar-row">
          <span class="bar-label">${s.ci + 1}. ${s.c.title}</span>
          <div class="bar-track"><span class="${level(s.avg).cls}" style="width:${(s.avg / 5) * 100}%"></span>${[1, 2, 3, 4].map((t) => `<i style="left:${t * 20}%"></i>`).join("")}</div>
          <strong>${fmt(s.avg)}</strong>
          <span class="bar-div ${divClass(s.maxSpread)}">${s.maxSpread >= DIVERGENCE.medium ? `dif. max ${s.maxSpread}` : "aliniere"}</span>
        </div>`).join("")}
    </div>

    <h3>Media fiecărei persoane, pe condiții</h3>
    <div class="table-wrap">
      <table class="scores matrix">
        <thead><tr><th class="stmt">Participant</th>${stats.map((s) => `<th>${s.c.title}</th>`).join("")}<th class="agg">Total</th></tr></thead>
        <tbody>
          ${people.map((p, pi) => {
            const vals = stats.map((s) => s.personAvg[pi]);
            return `<tr><td class="stmt">${esc(p.label)}</td>${vals.map((v) => `<td class="sc s${Math.round(v)}">${fmt(v)}</td>`).join("")}<td class="agg strong">${fmt(mean(vals))}</td></tr>`;
          }).join("")}
        </tbody>
        <tfoot><tr><td class="stmt">Media echipei</td>${stats.map((s) => `<td class="sc avg">${fmt(s.avg)}</td>`).join("")}<td class="agg strong">${fmt(overall)}</td></tr></tfoot>
      </table>
    </div>

    <div class="sum-lists">
      <div>
        <h3>Unde vă vedeți cel mai diferit</h3>
        ${divergent.length ? `<ul class="stmts">${divergent.map((r) => stmtLine(r, `${r.min}–${r.max}`)).join("")}</ul>` : `<p class="muted">Nicio afirmație cu diferență de ${DIVERGENCE.medium}+ puncte.</p>`}
      </div>
      <div>
        <h3>Cele mai scăzute afirmații</h3>
        <ul class="stmts">${lowest.map((r) => stmtLine(r, fmt(r.mean))).join("")}</ul>
        <h3>Cele mai puternice afirmații</h3>
        <ul class="stmts">${highest.map((r) => stmtLine(r, fmt(r.mean))).join("")}</ul>
      </div>
    </div>
    <p class="footer-url">www.innersis.com</p>
  </section>`;
}

// ---------- router ----------
if (!CODE) renderHome();
else if (KEY) renderAdmin();
else renderParticipant();
