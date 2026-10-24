import { CONTENT, LANGS, TOTAL_ITEMS, LEVELS, DIVERGENCE, OUTLIER } from "./data.js";
import { LANG, t, setLang } from "./i18n.js";
import * as store from "./store.js";

const $app = document.getElementById("app");
const params = new URLSearchParams(location.search);
const CODE = (params.get("s") || "").toUpperCase();
const KEY = params.get("k") || "";
const { conditions: CONDITIONS, scale: SCALE, levels: LEVEL_LABELS } = CONTENT[LANG];

// ---------- utilitare ----------
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN);
const num = (n) => String(n).replace(".", t("decimal"));
const fmt = (n) => (Number.isFinite(n) ? num(n.toFixed(1)) : "–");
const level = (avg) => { const i = LEVELS.findIndex((l) => avg >= l.min); return { cls: LEVELS[i].cls, label: LEVEL_LABELS[i] }; };
const ls = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
};
const offsets = CONDITIONS.reduce((acc, c, i) => (acc.push(i ? acc[i - 1] + CONDITIONS[i - 1].items.length : 0), acc), []);
const baseUrl = () => location.origin + location.pathname;
const participantUrl = (code) => `${baseUrl()}?s=${code}&lang=${LANG}`;
const adminUrl = (code, key) => `${baseUrl()}?s=${code}&k=${key}&lang=${LANG}`;
const homeUrl = () => `${baseUrl()}?lang=${LANG}`;
const fmtDate = (ts) => new Date(ts).toLocaleDateString(t("locale"), { day: "numeric", month: "long", year: "numeric" });

const header = (extra = "") => `
  <header class="topbar no-print">
    <a class="brand" href="${homeUrl()}"><img src="assets/innersis-logo.png" alt="Innersis" width="94" height="33"></a>
    ${extra}
    <div class="topbar-end">
      ${store.isDemo ? `<span class="demo-pill" title="${t("demoTitle")}">${t("demo")}</span>` : ""}
      <div class="lang" role="group" aria-label="Language">
        ${LANGS.map((l) => `<button type="button" data-lang="${l}" class="${l === LANG ? "on" : ""}" aria-pressed="${l === LANG}">${l.toUpperCase()}</button>`).join("")}
      </div>
    </div>
  </header>`;

// Butoanele de limbă din bara de sus (delegare, pentru că ecranele se redesenează).
$app.addEventListener("click", (e) => {
  const b = e.target.closest(".lang button");
  if (b && b.dataset.lang !== LANG) setLang(b.dataset.lang);
});

// ======================================================================
// ACASĂ: sesiune nouă / intrare în sesiune
// ======================================================================
function renderHome() {
  const mine = ls.get("acc5_my", []);
  $app.innerHTML = `
    ${header()}
    <main class="home">
      <section class="hero">
        <p class="eyebrow gold">${t("homeEyebrow")}</p>
        <h1>${t("homeTitle")}</h1>
        <p class="lead">${t("homeLead", TOTAL_ITEMS, CONDITIONS.map((c) => c.title).join(", "))}</p>
      </section>
      <section class="cards">
        <form class="card" id="newForm">
          <p class="eyebrow">${t("facilitator")}</p>
          <h2>${t("newSession")}</h2>
          <label>${t("sessionName")}<input name="name" required maxlength="80" placeholder="${t("sessionNamePh")}"></label>
          <label>${t("expected")}<input name="expected" type="number" min="1" max="200" value="8" required></label>
          <button class="btn primary" type="submit">${t("create")}</button>
        </form>
        <form class="card" id="joinForm">
          <p class="eyebrow">${t("participant")}</p>
          <h2>${t("joinTitle")}</h2>
          <label>${t("sessionCode")}<input name="code" required maxlength="6" placeholder="${t("sessionCodePh")}" class="code-input" autocomplete="off"></label>
          <button class="btn" type="submit">${t("continue")}</button>
          <p class="hint" id="joinErr"></p>
        </form>
      </section>
      ${mine.length ? `
      <section class="mine">
        <p class="eyebrow">${t("mySessions")}</p>
        <ul>${mine.slice().reverse().map((s) => `
          <li><a href="${adminUrl(s.code, s.adminKey)}"><strong>${esc(s.name)}</strong><span>${s.code} · ${fmtDate(s.createdAt)}</span></a></li>`).join("")}
        </ul>
      </section>` : ""}
    </main>`;

  document.getElementById("newForm").onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const btn = e.target.querySelector("button");
    btn.disabled = true; btn.textContent = t("creating");
    try {
      const name = fd.get("name").trim();
      const expected = Math.max(1, parseInt(fd.get("expected"), 10) || 1);
      const { code, adminKey } = await store.createSession({ name, expected });
      ls.set("acc5_my", [...ls.get("acc5_my", []), { code, adminKey, name, createdAt: Date.now() }]);
      location.href = adminUrl(code, adminKey);
    } catch (err) {
      console.error(err);
      btn.disabled = false; btn.textContent = t("create");
      alert(t("createFailed"));
    }
  };
  document.getElementById("joinForm").onsubmit = async (e) => {
    e.preventDefault();
    const code = new FormData(e.target).get("code").trim().toUpperCase();
    if (await store.getSession(code)) location.href = participantUrl(code);
    else document.getElementById("joinErr").textContent = t("noSuchCode");
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
          <h1 class="serif">${t("welcome")}</h1>
          <p>${t("welcomeText", TOTAL_ITEMS)}</p>
          <label>${t("yourName")}<input name="name" required maxlength="60" value="${esc(me.name)}" autocomplete="name"></label>
          <button class="btn primary" type="submit">${t("start")}</button>
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
          <p class="eyebrow gold spaced">${t("conditionOf", ci + 1, CONDITIONS.length)}</p>
          <h1 class="serif">${c.title}</h1>
          <p class="desc">${c.desc}</p>
          <div class="reflect"><p>${c.question}</p></div>
        </aside>
        <section class="slide-right">
          <p class="eyebrow teal spaced">${t("howTrue")}</p>
          <ol class="items">
            ${c.items.map((text, ii) => {
              const idx = offsets[ci] + ii;
              return `
              <li class="item">
                <span class="num">${ii + 1}</span>
                <div class="item-body">
                  <p>${text}</p>
                  <div class="scale" role="radiogroup" aria-label="${t("statement", ii + 1)}">
                    ${SCALE.map((label, si) => { const v = si + 1; return `<button type="button" role="radio" aria-checked="${me.answers[idx] === v}" class="${me.answers[idx] === v ? "sel" : ""}" data-idx="${idx}" data-v="${v}" title="${label}">${v}</button>`; }).join("")}
                  </div>
                  <div class="scale-labels"><span>${SCALE[0]}</span><span>${SCALE[SCALE.length - 1]}</span></div>
                </div>
              </li>`;
            }).join("")}
          </ol>
          <div class="nav">
            <button class="btn ghost" id="back">${ci === 0 ? t("changeName") : t("back")}</button>
            <span class="hint" id="navHint"></span>
            <button class="btn primary" id="next">${ci === CONDITIONS.length - 1 ? t("reviewAnswers") : t("nextCondition")}</button>
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
        document.getElementById("navHint").textContent = t("pickAll");
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
        <h1 class="serif dark">${t("reviewTitle")}</h1>
        <p>${t("reviewText", esc(me.name))}</p>
        <div class="review">
          ${CONDITIONS.map((c, ci) => `
            <button class="review-row" data-ci="${ci}">
              <strong>${c.title}</strong>
              <span class="dots">${c.items.map((_, ii) => `<i class="s${me.answers[offsets[ci] + ii]}">${me.answers[offsets[ci] + ii]}</i>`).join("")}</span>
            </button>`).join("")}
        </div>
        <div class="nav">
          <button class="btn ghost" id="back">${t("back")}</button>
          <span class="hint" id="navHint"></span>
          <button class="btn primary" id="submit">${t("submit")}</button>
        </div>
      </main>`;
    $app.querySelectorAll(".review-row").forEach((b) => (b.onclick = () => { step = +b.dataset.ci; draw(); }));
    document.getElementById("back").onclick = () => { step = CONDITIONS.length - 1; draw(); };
    document.getElementById("submit").onclick = async (e) => {
      e.target.disabled = true; e.target.textContent = t("submitting");
      try {
        if (!(await store.getSession(CODE))?.participants?.[me.pid]) await store.joinSession(CODE, me.pid, me.name);
        await store.submitAnswers(CODE, me.pid, me.answers);
        me.submitted = true; save();
        step = "done"; draw();
      } catch (err) {
        console.error(err);
        e.target.disabled = false; e.target.textContent = t("submit");
        document.getElementById("navHint").textContent = t("submitFailed");
      }
    };
  }

  function drawDone() {
    $app.innerHTML = `
      ${header()}
      <main class="center">
        <div class="card narrow done">
          <div class="check">✓</div>
          <h1 class="serif">${t("thanks", esc(me.name))}</h1>
          <p>${t("thanksText", esc(session.meta.name))}</p>
          <button class="btn ghost" id="edit">${t("editAnswers")}</button>
        </div>
      </main>`;
    document.getElementById("edit").onclick = () => { me.submitted = false; save(); step = "review"; draw(); };
  }

  draw();
}

function renderMissing() {
  $app.innerHTML = `${header()}<main class="center"><div class="card narrow"><h1 class="serif">${t("missingTitle")}</h1><p>${t("missingText")}</p><a class="btn" href="${homeUrl()}">${t("homePage")}</a></div></main>`;
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
      $app.innerHTML = `${header()}<main class="center"><div class="card narrow"><h1 class="serif">${t("restricted")}</h1><p>${t("restrictedText")}</p></div></main>`;
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
        <a href="#status">${t("navStatus")}</a>
        ${CONDITIONS.map((c) => `<a href="#c-${c.id}">${c.title}</a>`).join("")}
        <a href="#sumar">${t("navSummary")}</a>
      </nav>`)}
      <main class="report">
        <section class="print-cover">
          <img class="cover-logo" src="assets/innersis-logo.png" alt="Innersis" width="141" height="50">
          <p class="eyebrow gold spaced">${t("coverEyebrow")}</p>
          <h1 class="serif">${esc(meta.name)}</h1>
          <p>${fmtDate(Date.now())} · ${t("participantsN", done.length)}${anon ? "" : `: ${people.map((p) => esc(p.name)).join(", ")}`}</p>
        </section>

        <section id="status" class="status no-print">
          <div class="status-head">
            <div>
              <p class="eyebrow gold spaced">${t("sessionCodeEyebrow", CODE)}</p>
              <h1 class="serif">${esc(meta.name)}</h1>
              <p class="muted">${t("createdOn", fmtDate(meta.createdAt))}</p>
            </div>
            <div class="status-actions">
              <label class="toggle"><input type="checkbox" id="anon" ${anon ? "checked" : ""}> ${t("hideNames")}</label>
              <button class="btn primary" id="pdf" ${done.length ? "" : "disabled"}>${t("savePdf")}</button>
            </div>
          </div>
          <div class="status-grid">
            <div class="share">
              <div id="qr" class="qr"></div>
              <div>
                <p class="eyebrow">${t("participantLink")}</p>
                <div class="linkbox"><input readonly value="${link}" id="plink"><button class="btn" id="copy">${t("copy")}</button></div>
                <p class="muted small">${t("shareHint", CODE)}</p>
              </div>
            </div>
            <div class="counter">
              <div class="counter-nums">
                <div><strong>${all.length}</strong><span>${t("registered")}</span></div>
                <div><strong>${done.length}</strong><span>${t("completed")}</span></div>
                <div><strong>${meta.expected}</strong><span>${t("expectedShort")}</span></div>
              </div>
              <div class="bar"><span style="width:${pct}%"></span></div>
              <p class="muted small">${done.length >= meta.expected ? t("allDone") : t("waitingFor", meta.expected - done.length)} ${t("autoUpdate")}</p>
              <ul class="plist">
                ${all.map((p) => `<li><span class="st ${p.answers ? "ok" : ""}"></span>${esc(p.name)}<em>${p.answers ? t("statusDone") : t("statusInProgress")}</em><button class="x" data-pid="${p.pid}" title="${t("removeTitle")}">×</button></li>`).join("") || `<li class="muted">${t("nobodyYet")}</li>`}
              </ul>
            </div>
          </div>
        </section>

        ${done.length ? CONDITIONS.map((c, ci) => conditionSection(c, ci, people)).join("") + summarySection(people) : `<section class="empty no-print"><p>${t("resultsEmpty")}</p></section>`}
      </main>`;

    // QR
    if (window.QRCode) new QRCode(document.getElementById("qr"), { text: link, width: 132, height: 132, colorDark: "#1b2f4a", colorLight: "#ffffff" });
    document.getElementById("copy").onclick = async (e) => {
      try { await navigator.clipboard.writeText(link); } catch { document.getElementById("plink").select(); document.execCommand("copy"); }
      e.target.textContent = t("copied"); setTimeout(() => (e.target.textContent = t("copy")), 1500);
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
      if (confirm(t("removeConfirm", p.name))) store.removeParticipant(CODE, p.pid);
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
const divLabel = (spread) => (spread >= DIVERGENCE.high ? t("divHigh") : spread >= DIVERGENCE.medium ? t("divMed") : t("aligned"));

function conditionSection(c, ci, people) {
  const s = statsFor(ci, people);
  const lv = level(s.avg);
  return `
  <section class="cond page-break" id="c-${c.id}">
    <div class="cond-head">
      <div class="cond-title">
        <p class="eyebrow gold spaced">${t("conditionOf", ci + 1, CONDITIONS.length)}</p>
        <h2 class="serif">${c.title}</h2>
        <p class="desc">${c.desc}</p>
      </div>
      <div class="avg-badge ${lv.cls}">
        <strong>${fmt(s.avg)}</strong>
        <span>${t("conditionAvg")}</span>
        <em>${lv.label}</em>
      </div>
    </div>
    <div class="table-wrap">
      <table class="scores">
        <thead>
          <tr>
            <th class="stmt">${t("thStatement")}</th>
            ${people.map((p) => `<th class="person"><span>${esc(p.label)}</span></th>`).join("")}
            <th class="agg">${t("thAvg")}</th>
            <th class="agg">${t("thDiff")}</th>
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
            <td class="stmt">${t("personAvg")}</td>
            ${s.personAvg.map((v) => `<td class="sc avg">${fmt(v)}</td>`).join("")}
            <td class="agg strong">${fmt(s.avg)}</td>
            <td class="agg"></td>
          </tr>
        </tfoot>
      </table>
    </div>
    <div class="legend">
      <span><i class="sw s1"></i>1</span><span><i class="sw s2"></i>2</span><span><i class="sw s3"></i>3</span><span><i class="sw s4"></i>4</span><span><i class="sw s5"></i>5</span>
      <span><i class="sw outlier-sw"></i>${t("legendOutlier", num(OUTLIER))}</span>
      <span><i class="sw div-med-sw"></i>${t("legendDiff", DIVERGENCE.medium)}</span>
      <span><i class="sw div-high-sw"></i>${t("legendDiff", DIVERGENCE.high)}</span>
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
    <p class="eyebrow gold spaced">${t("summary")}</p>
    <h2 class="serif">${t("summaryTitle")}</h2>
    <div class="sum-top">
      <div class="avg-badge big ${level(overall).cls}">
        <strong>${fmt(overall)}</strong><span>${t("overallIndex")}</span><em>${level(overall).label}</em>
      </div>
      <div class="sum-text">
        <p>${t("summaryStrongest", people.length, strongest.c.title, fmt(strongest.avg), weakest.c.title, fmt(weakest.avg))}</p>
        <p>${divergent.length ? t("summaryDivergent", divergent.length, DIVERGENCE.medium) : t("summaryAligned")}</p>
      </div>
    </div>

    <div class="bars">
      ${stats.map((s) => `
        <div class="bar-row">
          <span class="bar-label">${s.ci + 1}. ${s.c.title}</span>
          <div class="bar-track"><span class="${level(s.avg).cls}" style="width:${(s.avg / 5) * 100}%"></span>${[1, 2, 3, 4].map((x) => `<i style="left:${x * 20}%"></i>`).join("")}</div>
          <strong>${fmt(s.avg)}</strong>
          <span class="bar-div ${divClass(s.maxSpread)}">${s.maxSpread >= DIVERGENCE.medium ? t("maxDiff", s.maxSpread) : t("alignedLower")}</span>
        </div>`).join("")}
    </div>

    <h3>${t("perPerson")}</h3>
    <div class="table-wrap">
      <table class="scores matrix">
        <thead><tr><th class="stmt">${t("thParticipant")}</th>${stats.map((s) => `<th>${s.c.title}</th>`).join("")}<th class="agg">${t("thTotal")}</th></tr></thead>
        <tbody>
          ${people.map((p, pi) => {
            const vals = stats.map((s) => s.personAvg[pi]);
            return `<tr><td class="stmt">${esc(p.label)}</td>${vals.map((v) => `<td class="sc s${Math.round(v)}">${fmt(v)}</td>`).join("")}<td class="agg strong">${fmt(mean(vals))}</td></tr>`;
          }).join("")}
        </tbody>
        <tfoot><tr><td class="stmt">${t("teamAvg")}</td>${stats.map((s) => `<td class="sc avg">${fmt(s.avg)}</td>`).join("")}<td class="agg strong">${fmt(overall)}</td></tr></tfoot>
      </table>
    </div>

    <div class="sum-lists">
      <div>
        <h3>${t("mostDifferent")}</h3>
        ${divergent.length ? `<ul class="stmts">${divergent.map((r) => stmtLine(r, `${r.min}–${r.max}`)).join("")}</ul>` : `<p class="muted">${t("noDivergent", DIVERGENCE.medium)}</p>`}
      </div>
      <div>
        <h3>${t("lowest")}</h3>
        <ul class="stmts">${lowest.map((r) => stmtLine(r, fmt(r.mean))).join("")}</ul>
        <h3>${t("highest")}</h3>
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
