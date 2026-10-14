// Stocarea sesiunilor: Firebase Realtime Database dacă e configurat, altfel localStorage (mod demo).
// Model: sessions/{code} = { meta: {name, expected, createdAt, adminKey}, participants: {pid: {name, joinedAt, answers?, submittedAt?}} }
import { FIREBASE_CONFIG } from "./config.js";

const FB_VER = "10.12.2";
export const isDemo = !FIREBASE_CONFIG.databaseURL;

let fb = null;
async function firebase() {
  if (fb) return fb;
  const [{ initializeApp }, db] = await Promise.all([
    import(`https://www.gstatic.com/firebasejs/${FB_VER}/firebase-app.js`),
    import(`https://www.gstatic.com/firebasejs/${FB_VER}/firebase-database.js`)
  ]);
  const app = initializeApp(FIREBASE_CONFIG);
  fb = { ...db, db: db.getDatabase(app) };
  return fb;
}

// ---- mod demo (localStorage) ----
const LS_KEY = "acc5_sessions";
const localAll = () => { try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; } catch { return {}; } };
function localWrite(fn) {
  const all = localAll();
  fn(all);
  localStorage.setItem(LS_KEY, JSON.stringify(all));
  window.dispatchEvent(new Event("acc5-local"));
}

// ---- API comun ----
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const randomId = (n) => Array.from(crypto.getRandomValues(new Uint32Array(n)), (x) => ALPHABET[x % ALPHABET.length]).join("");

export async function getSession(code) {
  if (isDemo) return localAll()[code] || null;
  const f = await firebase();
  const snap = await f.get(f.ref(f.db, `sessions/${code}`));
  return snap.exists() ? snap.val() : null;
}

export async function createSession({ name, expected }) {
  let code;
  do { code = randomId(6); } while (await getSession(code));
  const meta = { name, expected, createdAt: Date.now(), adminKey: randomId(10) };
  if (isDemo) localWrite((all) => { all[code] = { meta, participants: {} }; });
  else {
    const f = await firebase();
    await f.set(f.ref(f.db, `sessions/${code}/meta`), meta);
  }
  return { code, adminKey: meta.adminKey };
}

export async function joinSession(code, pid, name) {
  const rec = { name, joinedAt: Date.now() };
  if (isDemo) return localWrite((all) => { all[code].participants ||= {}; all[code].participants[pid] = { ...all[code].participants[pid], ...rec }; });
  const f = await firebase();
  await f.update(f.ref(f.db, `sessions/${code}/participants/${pid}`), rec);
}

export async function submitAnswers(code, pid, answers) {
  const rec = { answers, submittedAt: Date.now() };
  if (isDemo) return localWrite((all) => { Object.assign(all[code].participants[pid], rec); });
  const f = await firebase();
  await f.update(f.ref(f.db, `sessions/${code}/participants/${pid}`), rec);
}

export async function removeParticipant(code, pid) {
  if (isDemo) return localWrite((all) => { delete all[code].participants[pid]; });
  const f = await firebase();
  await f.remove(f.ref(f.db, `sessions/${code}/participants/${pid}`));
}

// Ascultă modificările sesiunii în timp real. Returnează funcția de dezabonare.
export function watchSession(code, cb) {
  if (isDemo) {
    const fire = () => cb(localAll()[code] || null);
    const onStorage = (e) => { if (!e.key || e.key === LS_KEY) fire(); };
    window.addEventListener("storage", onStorage);
    window.addEventListener("acc5-local", fire);
    fire();
    return () => { window.removeEventListener("storage", onStorage); window.removeEventListener("acc5-local", fire); };
  }
  let off = () => {};
  firebase().then((f) => { off = f.onValue(f.ref(f.db, `sessions/${code}`), (s) => cb(s.exists() ? s.val() : null)); });
  return () => off();
}
