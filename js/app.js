/* ============================================================
   Captain Leap's Word Quest - app logic
   ============================================================ */
const STORE_KEY = "captainLeap.v1";
const LESSON_MINUTES = 20;
const MAP_LEVELS = 10;

/* ---------------- state ---------------- */
function defaultMode() { return { level: 0, lastDone: null, extra: false, history: [] }; }
function defaultState() {
  return { name: "", totalStars: 0, stickers: [], streak: { count: 0, last: null },
    reading: defaultMode(), speaking: defaultMode(), settings: { voiceURI: "", rate: 0.95, pitch: 1.55 } };
}
function load() {
  try {
    const s = JSON.parse(localStorage.getItem(STORE_KEY));
    if (s) {
      const d = defaultState();
      return { ...d, ...s, streak: { ...d.streak, ...s.streak }, reading: { ...d.reading, ...s.reading },
        speaking: { ...d.speaking, ...s.speaking }, settings: { ...d.settings, ...s.settings } };
    }
  } catch (e) { }
  return defaultState();
}
let S = load();
function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch (e) { } }

function dateStr(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
function today() { return dateStr(new Date()); }
function yesterday() { const d = new Date(); d.setDate(d.getDate() - 1); return dateStr(d); }

/* ---------------- helpers ---------------- */
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const shuffle = arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

let screenId = 0;     // bumps on every screen change so old async flows stop
let L = null;         // current lesson
let Q = null;         // current quiz
const app = () => $("#app");

function show(html, { stop = false } = {}) {
  screenId++;
  if (stop) Speech.stop();
  app().innerHTML = html;
  document.body.classList.toggle("lesson", !!(L || Q));
  window.scrollTo(0, 0);
}
function alive(sid) { return sid === screenId; }

/* ---------------- buddy (Captain Leap, the lesson presenter) ---------------- */
const fill = t => String(t).replace(/\{name\}/g, S.name || "hero").replace(/\{word\}/g, (L && L.cur && L.cur.word) || "");
let talkToken = 0;
function heroSay(text, { speak = true } = {}) {
  text = fill(text);
  const b = $("#buddy");
  b.classList.add("show");
  const av = b.querySelector(".avatar");
  if (!av.firstChild) av.innerHTML = heroSVG();
  if (/!/.test(text) && !/didn't|Hmm|Oops/.test(text)) heroMood(Math.random() < 0.5 ? "cheer" : "wave");
  const bubble = b.querySelector(".bubble");
  bubble.textContent = text;
  bubble.classList.remove("pop"); void bubble.offsetWidth; bubble.classList.add("pop");
  if (!speak) return Promise.resolve();
  const tok = ++talkToken;
  av.classList.add("talking");                       // mouth moves while he speaks
  return Speech.say(text).then(() => { if (tok === talkToken) av.classList.remove("talking"); });
}
/** Captain Leap arrives on screen: drops down his zip-rope, flips in, or zooms in. */
function heroEnter(style) {
  const b = $("#buddy");
  const av = b.querySelector(".avatar");
  if (!av.firstChild) av.innerHTML = heroSVG();
  b.classList.add("show");
  style = style || pick(["drop", "flipin", "zoomin"]);
  b.classList.remove("drop", "flipin", "zoomin"); void b.offsetWidth; b.classList.add(style);
  if (style === "drop") Sfx.zip(); else Sfx.whoosh();
  setTimeout(() => b.classList.remove(style), 1300);
}

/* little "script" runner for Captain Leap's presentations: stops cleanly when the screen changes */
class Abort extends Error { }
function scriptCtx() {
  const sid = screenId;
  const chk = () => { if (!alive(sid)) throw new Abort(); };
  return {
    chk,
    say: async t => { chk(); await heroSay(t); chk(); },
    sound: async k => { chk(); await Speech.sound(k); chk(); },
    word: async (w, rate = 0.8) => { chk(); await Speech.say(w, { rate }); chk(); },
    wait: async ms => { chk(); await sleep(ms); chk(); },
    mood: m => { chk(); heroMood(m); },
    sfx: n => { chk(); Sfx[n](); }
  };
}
async function runScript(fn) {
  try { await fn(scriptCtx()); } catch (e) { if (!(e instanceof Abort)) console.error(e); }
}
function hideBuddy() { $("#buddy").classList.remove("show"); }

function fb(html, cls = "") {
  const el = $("#fb");
  if (el) { el.className = "feedback " + cls; el.innerHTML = html; }
}

/* ---------------- confetti ---------------- */
function confetti(amount = 140) {
  const cv = $("#confetti"), ctx = cv.getContext("2d");
  cv.width = innerWidth; cv.height = innerHeight;
  const colors = ["#ff5d5d", "#ffd23f", "#3ec46d", "#3fa7ff", "#b06cff", "#ff8a3d"];
  const parts = Array.from({ length: amount }, () => ({
    x: innerWidth / 2 + (Math.random() - 0.5) * 200, y: innerHeight / 2.5,
    vx: (Math.random() - 0.5) * 16, vy: -Math.random() * 16 - 4, r: Math.random() * 6 + 4,
    c: pick(colors), a: Math.random() * 6, s: Math.random() > 0.5 ? "star" : "rect"
  }));
  let t = 0;
  (function frame() {
    ctx.clearRect(0, 0, cv.width, cv.height);
    parts.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.vy += 0.45; p.a += 0.15;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.fillStyle = p.c;
      if (p.s === "star") { ctx.font = `${p.r * 3}px sans-serif`; ctx.fillText("★", 0, 0); }
      else ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r);
      ctx.restore();
    });
    if (++t < 160) requestAnimationFrame(frame); else ctx.clearRect(0, 0, cv.width, cv.height);
  })();
}
const _oops = Sfx.oops;
Sfx.oops = () => { _oops(); heroMood("think"); };
function starBurst(el) {
  heroMood("cheer");
  if (!el) return;
  const r = el.getBoundingClientRect();
  for (let i = 0; i < 8; i++) {
    const s = document.createElement("div");
    s.className = "burst"; s.textContent = "⭐";
    s.style.left = r.left + r.width / 2 + "px"; s.style.top = r.top + r.height / 2 + "px";
    const ang = (i / 8) * Math.PI * 2;
    s.style.setProperty("--dx", Math.cos(ang) * 110 + "px");
    s.style.setProperty("--dy", Math.sin(ang) * 110 + "px");
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 900);
  }
}

/* ---------------- shared widgets ---------------- */
function micBlock(label = "Tap the microphone and talk!") {
  if (Speech.canListen) {
    return `<div class="mic-wrap"><button class="mic" id="mic" aria-label="microphone">🎤</button>
      <div class="mic-label" id="micLabel" data-l="${esc(label)}">${esc(label)}</div></div>`;
  }
  return `<div class="grownup-check" id="gcheck"><div>👩 Grown-up: listen and choose</div>
    <button class="btn green small" id="gyes">✅ Got it!</button>
    <button class="btn orange small" id="gsome">🙂 Partly</button>
    <button class="btn ghost small" id="gno">🔁 Not yet</button></div>`;
}

/**
 * Wire the mic (or the grown-up fallback). handler(alts, manualScore)
 * With speech recognition: manualScore is undefined.
 * Without: alts = [] and manualScore is 1 / 0.5 / 0.
 */
function wireMic(handler, { maxMs = 6000 } = {}) {
  const mic = $("#mic");
  if (mic) {
    mic.onclick = async () => {
      if (mic.classList.contains("on")) return;
      const sid = screenId;
      const lab = $("#micLabel");
      mic.classList.add("on");
      if (lab) lab.textContent = "I'm listening... 👂";
      const r = await Speech.listen({ maxMs });
      if (!alive(sid) || !document.body.contains(mic)) return;
      mic.classList.remove("on");
      if (lab) lab.textContent = lab.dataset.l;
      if (r.error === "not-allowed" || r.error === "service-not-allowed") {
        heroSay("I need the microphone! Ask a grown-up to press Allow.");
        return;
      }
      handler(r.alts);
    };
  }
  const y = $("#gyes"), s = $("#gsome"), n = $("#gno");
  if (y) y.onclick = () => handler([], 1);
  if (s) s.onclick = () => handler([], 0.5);
  if (n) n.onclick = () => handler([], 0);
}

function lessonTop(total, done) {
  const dots = Array.from({ length: total }, (_, i) => `<span class="pdot ${i < done ? "on" : ""} ${i === done ? "cur" : ""}">${i < done ? "⭐" : ""}</span>`).join("");
  return `<div class="ltop"><button class="home-btn" id="homeBtn" title="Home">🏠</button>
    <div class="prog">${dots}</div><div class="timer" id="timer">⏱ 0:00</div></div>`;
}
function quizTop() {
  const dots = Q.items.map((_, i) => `<span class="pdot quiz ${i < Q.k ? "on" : ""} ${i === Q.k ? "cur" : ""}">${i < Q.k ? "🎯" : ""}</span>`).join("");
  return `<div class="ltop quizbar"><button class="home-btn" id="homeBtn">🏠</button>
    <div class="qtitle">🎯 QUIZ</div><div class="prog">${dots}</div></div>`;
}

setInterval(() => {
  const t = $("#timer");
  if (!t || !L) return;
  const sec = Math.floor((Date.now() - L.start) / 1000);
  t.textContent = `⏱ ${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
  t.classList.toggle("late", sec > LESSON_MINUTES * 60 - 120);
}, 1000);
const timeUp = () => L && Date.now() - L.start > LESSON_MINUTES * 60000;

document.addEventListener("click", e => {
  if (e.target.closest("#homeBtn")) {
    if ((L || Q) && !confirm("Leave this lesson? Your progress for this lesson will not be saved.")) return;
    L = null; Q = null; renderHome();
  }
});

/* ============================================================
   HOME
   ============================================================ */
function modeStatus(mode) {
  const m = S[mode];
  const doneToday = m.lastDone === today() && !m.extra;
  const levels = mode === "reading" ? READING_LEVELS : SPEAK_LEVELS;
  const idx = m.level % levels.length;
  return { doneToday, idx, title: levels[idx].title, level: m.level };
}

function renderHome() {
  L = null; Q = null;
  if (!S.name) return renderWelcome();
  const r = modeStatus("reading"), s = modeStatus("speaking");
  const card = (mode, st, emoji, name, color) => `
    <button class="mode-card ${color} ${st.doneToday ? "done" : ""}" data-mode="${mode}">
      <div class="mc-emoji">${emoji}</div>
      <div class="mc-name">${name}</div>
      <div class="mc-level">Level ${st.level + 1} · ${esc(st.title)}</div>
      <div class="mc-status">${st.doneToday ? "✅ Done today! Come back tomorrow" : "▶ Today's lesson is ready!"}</div>
    </button>`;
  show(`
    <div class="home">
      <button class="gear" id="gear" title="Grown-ups">⚙️</button>
      <div class="title">${hangingHeroHTML({ upside: true, rope: 70, size: 96 })}<h1>Captain Leap's<br><span>Word Quest</span></h1></div>
      <div class="hello">Hi, <b>${esc(S.name)}</b>! Ready to be a hero?</div>
      <div class="stats">
        <div class="stat">⭐ <b>${S.totalStars}</b><small>stars</small></div>
        <div class="stat">🔥 <b>${S.streak.count}</b><small>day streak</small></div>
        <div class="stat">🎖️ <b>${S.stickers.length}</b><small>stickers</small></div>
      </div>
      <div class="modes">
        ${card("reading", r, "📖", "Reading", "red")}
        ${card("speaking", s, "🗣️", "Speaking", "blue")}
      </div>
      <div class="row">
        <button class="btn purple" id="mapR">🏙️ Reading Map</button>
        <button class="btn purple" id="mapS">🏝️ Speaking Map</button>
        <button class="btn yellow" id="stick">🎖️ Sticker Book</button>
      </div>
    </div>`, { stop: true });
  hideBuddy();
  $$(".mode-card").forEach(b => b.onclick = () => {
    const mode = b.dataset.mode;
    if (modeStatus(mode).doneToday) {
      renderMap(mode);
      heroSay(`You finished today's ${mode} lesson, super hero! Come back tomorrow to jump to the next building.`);
      return;
    }
    mode === "reading" ? startReading() : startSpeaking();
  });
  $("#mapR").onclick = () => renderMap("reading");
  $("#mapS").onclick = () => renderMap("speaking");
  $("#stick").onclick = renderStickers;
  $("#gear").onclick = renderGate;
}

function renderWelcome() {
  show(`<div class="home welcome">
      <div class="title">${hangingHeroHTML({ rope: 60, size: 96 })}<h1>Captain Leap's<br><span>Word Quest</span></h1></div>
      <div class="card">
        <h2>Hello, new hero! 👋</h2>
        <p>Grown-up, please type your child's name:</p>
        <input id="nameIn" class="name-in" maxlength="20" placeholder="Name" autocomplete="off">
        <button class="btn big green" id="go">Start the adventure! 🚀</button>
        <p class="small-note">Works best in <b>Google Chrome</b> or <b>Microsoft Edge</b> with a microphone.
        ${Speech.canListen ? "✅ Speech listening is available." : "⚠️ This browser can't listen to speech — a grown-up can mark answers instead."}</p>
      </div></div>`);
  $("#go").onclick = () => {
    const n = $("#nameIn").value.trim();
    if (!n) { $("#nameIn").focus(); return; }
    S.name = n; save();
    renderHome();
    heroSay(`Hi ${n}! I'm Captain Leap. Learn with me every day and I'll jump all the way to the trophy tower!`);
  };
}

/* ============================================================
   MAP (hero jumps building to building)
   ============================================================ */
const B_H = [120, 165, 140, 195, 170, 215, 185, 240, 205, 275];
const mapX = k => 90 + k * 150;
const mapH = k => k === 0 ? 70 : B_H[k - 1];

function renderMap(mode, opts = {}) {
  const m = S[mode];
  const pos = Math.min(m.level, MAP_LEVELS);
  const levels = mode === "reading" ? READING_LEVELS : SPEAK_LEVELS;
  const from = opts.from !== undefined ? Math.min(opts.from, MAP_LEVELS) : pos;
  const start = from;
  let blds = `<div class="bld start" style="left:${mapX(0) - 55}px;height:${mapH(0)}px"><div class="num">GO</div></div>`;
  for (let k = 1; k <= MAP_LEVELS; k++) {
    const done = k <= pos;
    const hist = m.history.filter(h => h.level === k - 1 && h.passed).slice(-1)[0];
    blds += `<div class="bld ${done ? "done" : ""} ${k === pos + 1 ? "next" : ""} ${k === MAP_LEVELS ? "final" : ""}"
       style="left:${mapX(k) - 55}px;height:${mapH(k)}px">
       ${k === MAP_LEVELS ? '<div class="trophy">🏆</div>' : ""}
       ${done ? `<div class="flag">🚩</div>` : ""}
       <div class="num">${k}</div>
       <div class="win"></div>
       <div class="blabel">${esc(levels[k - 1].title)}${hist ? `<br>${"⭐".repeat(hist.stars)}` : ""}</div>
     </div>`;
  }
  const theme = mode === "reading" ? "city" : "island";
  show(`
    <div class="map-screen ${theme}">
      <div class="ltop"><button class="home-btn" id="homeBtn">🏠</button>
        <div class="qtitle">${mode === "reading" ? "🏙️ Reading City" : "🏝️ Speaking Islands"}</div>
        <div class="timer">⭐ ${S.totalStars}</div></div>
      <div class="map-scroll" id="mapScroll">
        <div class="map" style="width:${mapX(MAP_LEVELS) + 200}px">
          <div class="cloud c1">☁️</div><div class="cloud c2">☁️</div><div class="cloud c3">☁️</div>
          <div class="sun">${theme === "city" ? "🌞" : "🌤️"}</div>
          ${blds}
          <svg class="rope-layer"><line id="rope" stroke="#fff" stroke-width="3" stroke-linecap="round" style="display:none"/></svg>
          <div class="hook" id="hook">✴️</div>
          <div class="sprite idle" id="sprite" style="left:${mapX(start) - 32}px;bottom:${mapH(start)}px">${heroSVG()}</div>
          <div class="ground"></div>
        </div>
      </div>
      <div class="map-foot">
        ${pos >= MAP_LEVELS ? `<div class="champ">🏆 CHAMPION! Captain Leap reached the Trophy Tower! Keep practising to earn more stars.</div>` : ""}
        ${modeStatus(mode).doneToday
          ? `<div class="comeback">🌙 See you tomorrow for building ${Math.min(pos + 1, MAP_LEVELS)}!</div>`
          : `<button class="btn big green" id="play">▶ Play Level ${m.level + 1}</button>`}
      </div>
    </div>`);
  const sc = $("#mapScroll");
  sc.scrollLeft = mapX(start) - sc.clientWidth / 3;
  const p = $("#play");
  if (p) p.onclick = () => mode === "reading" ? startReading() : startSpeaking();
  if (from < pos) animateJumps(from, pos);
  else if (opts.hopInPlace) hopInPlace();
}

async function animateJumps(a, b) {
  const sid = screenId;
  await sleep(700);
  for (let k = a; k < b; k++) {
    if (!alive(sid)) return;
    const sp = $("#sprite"), sc = $("#mapScroll");
    sp.classList.remove("idle");
    sc.scrollTo({ left: mapX(k + 1) - 32 - sc.clientWidth / 3, behavior: "smooth" });
    await swingTo(k, 0, mapX, mapH);
    if (!alive(sid)) return;
    sp.classList.add("idle");
  }
  confetti(90);
  heroSay(b >= MAP_LEVELS ? "I made it to the Trophy Tower! You are a champion!" : `Wow! We jumped to building ${b}! Thank you for learning with me!`);
}
async function hopInPlace() {
  await sleep(500);
  const sp = $("#sprite");
  if (sp) sp.animate([{ transform: "translateY(0)" }, { transform: "translateY(-50px)" }, { transform: "translateY(0)" }], { duration: 600, iterations: 2 });
  heroSay("Practice makes heroes! We'll try this building again tomorrow — you're getting stronger!");
}

/* ============================================================
   READING LESSON
   ============================================================ */
function parseUnits(code) {
  return code.split(" ").map(p => { const [g, k] = p.split(":"); return { g, k: k === undefined ? g : k }; });
}
function tilesHTML(units, cls = "") {
  return units.map((u, i) => {
    const vowel = /^[aeiou]/.test(u.g) && u.k !== "_";
    return `<span class="tile ${cls} ${u.k === "_" ? "silent" : ""} ${vowel ? "vowel" : ""} ${u.g.length > 1 ? "multi" : ""}" data-i="${i}">${u.g}</span>`;
  }).join("");
}
/** Hover / finger-slide over letters plays each sound. */
function attachSlide(container, units, onTouch) {
  let last = null;
  const play = el => {
    if (!el || el === last) return;
    last = el;
    const u = units[+el.dataset.i];
    el.classList.remove("lit"); void el.offsetWidth; el.classList.add("lit");
    if (u.k === "_") { Speech.say("shh", { rate: 0.8 }); fb("🤫 Magic <b>e</b> is quiet! It makes the vowel say its name.", "tip"); }
    else Speech.sound(u.k);
    onTouch && onTouch(+el.dataset.i);
  };
  const under = e => { const t = document.elementFromPoint(e.clientX, e.clientY); return t && t.closest ? t.closest(".tile") : null; };
  container.addEventListener("pointermove", e => {
    const el = under(e);
    if (el && container.contains(el)) play(el); else last = null;
  });
  container.addEventListener("pointerdown", e => { last = null; const el = under(e); if (el && container.contains(el)) play(el); });
  container.addEventListener("pointerleave", () => { last = null; });
}
async function soundOut(units, word) {
  const sid = screenId;
  const tiles = $$("#tiles .tile");
  const star = readStar($("#tiles"));
  for (let i = 0; i < units.length; i++) {
    if (!alive(sid)) return star.done();
    star.to(tiles[i]);
    if (units[i].k === "_") { tiles[i] && tiles[i].classList.add("hush"); await sleep(350); continue; }
    tiles[i] && tiles[i].classList.add("lit");
    await Speech.sound(units[i].k);
    await sleep(200);
    tiles[i] && tiles[i].classList.remove("lit");
  }
  if (!alive(sid)) return star.done();
  const t = $("#tiles");
  // the star sweeps back along the whole word while it is blended
  star.to(tiles[0]); await sleep(250); star.to(tiles[tiles.length - 1], true);
  t && t.classList.add("blend");
  await Speech.say(word, { rate: 0.75 });
  t && t.classList.remove("blend");
  tiles.forEach(x => x.classList.remove("hush"));
  star.done();
}

/** A glowing star hops under each letter as it is sounded (follow-along pointer). */
function readStar(tilesEl) {
  if (!tilesEl) return { to() { }, done() { } };
  const s = document.createElement("div");
  s.className = "read-star"; s.textContent = "⭐";
  tilesEl.appendChild(s);
  return {
    to(tile, slow) {
      if (!tile) return;
      s.style.transition = slow ? "left .6s ease-in-out" : "left .22s ease-out";
      s.style.left = tile.offsetLeft + tile.offsetWidth / 2 - 18 + "px";
      s.classList.remove("hop"); void s.offsetWidth; s.classList.add("hop");
    },
    done() { setTimeout(() => s.remove(), 400); }
  };
}

function spotlight(g, emoji, word) {
  const el = $("#spot");
  if (!el) return;
  el.innerHTML = `<div class="spot-card">
      <div class="spot-g">${g.split("").map(ch => ch === "_" ? `<span class="gap">_</span>` : `<span class="${/[aeiou]/.test(ch) ? "v" : ""}">${ch}</span>`).join("")}</div>
      <div class="spot-e">${emoji}<span>${esc(word)}</span></div></div>`;
}

function startReading() {
  const idx = S.reading.level % READING_LEVELS.length;
  const lvl = READING_LEVELS[idx];
  const intro = READING_INTROS[idx];
  L = { mode: "reading", idx, words: lvl.words, i: 0, start: Date.now(), missed: [] };
  show(`${lessonTop(lvl.words.length, 0)}
    <div class="card intro stage">
      <div class="lvl-badge red">📖 Reading · Level ${S.reading.level + 1}</div>
      <h2>${esc(lvl.title)}</h2>
      <div class="spot" id="spot"><div class="curtain">✨ Captain Leap is coming... ✨</div></div>
      <button class="btn big green hidden pulse-btn" id="go">Let's read! 🚀</button>
      <button class="btn ghost small" id="skipIntro">⏭ Skip intro</button>
    </div>`, { stop: true });
  const go = () => { $("#go").classList.remove("hidden"); $("#skipIntro").classList.add("hidden"); };
  $("#go").onclick = renderReadWord;
  $("#skipIntro").onclick = () => { Speech.stop(); screenId++; go(); };
  runScript(async c => {
    heroEnter("drop");
    await c.wait(1000);
    await c.say(pick(HELLOS));
    await c.say(KIND_TALK[intro.kind]);
    await c.say(intro.focus.length > 1 ? "Here are today's super sounds!" : "And today's super sound is...");
    for (const [k, g, w, em] of intro.focus) {
      spotlight(g, em, w);
      c.sfx("pop");
      await c.say(g.includes("_") ? `Magic e makes ${g[0]} say its name!` : "Listen carefully! It says...");
      await c.sound(k); await c.wait(300); await c.sound(k);
      await c.say(`Like in... ${w}!`);
      await c.word(w);
      await c.say("Now you say it with me! One, two, three!");
      await c.sound(k);
      await c.wait(1300);                       // time for the child to copy the sound
      c.mood("cheer"); c.sfx("ding");
      await c.say(pick(["Yes! Super sound!", "Wow, perfect!", "Hero power! Great job!"]));
    }
    if (intro.kind === "blend") {
      spotlight("fr", "🐸", "frog");
      await c.say("Watch me blend! Listen...");
      for (const k of intro.demo[0].split(" ")) { await c.sound(k); await c.wait(120); }
      await c.word(intro.demo[1], 0.9);
      await c.say("Zoom! The sounds raced together and made frog!");
    }
    if (intro.kind === "magic") {
      for (const [a, b] of intro.demo) {
        spotlight(a, "🪄", a);
        await c.say("This word says..."); await c.word(a);
        await c.say("Now... here comes Magic e! Zap!");
        c.sfx("zip"); spotlight(b, "✨", b);
        await c.word(b);
        await c.say(`${a} turned into ${b}!`);
      }
    }
    await c.say(`Today we will read ${lvl.words.length} words. Then a quiz, so I can swing to the next building! Are you ready, {name}? Let's go!`);
    go();
  });
}

function renderReadWord() {
  const [word, code, emoji] = L.words[L.i];
  const units = parseUnits(code);
  L.cur = { word, units, emoji, tries: 0 };
  show(`${lessonTop(L.words.length, L.i)}
    <div class="card read-card">
      <div class="phase"><span class="ph on">👀 Look</span><span class="ph">🎤 Say</span><span class="ph">🧩 Build</span></div>
      <div class="pic bounce">${emoji}</div>
      <div class="tiles" id="tiles">${tilesHTML(units)}</div>
      <div class="finger">👆 Slide your finger (or mouse) under the letters!</div>
      <div id="fb" class="feedback"></div>
      <div class="row">
        <button class="btn yellow" id="slow">🐢 Sound it out</button>
        <button class="btn orange" id="fast">🐇 Read it fast</button>
      </div>
      <button class="btn big green" id="next">I can read it! ➜</button>
    </div>`);
  attachSlide($("#tiles"), units);
  $("#slow").onclick = () => soundOut(units, word);
  $("#fast").onclick = () => Speech.say(word, { rate: 0.85 });
  $("#next").onclick = renderSayWord;
  heroEnter(L.i === 0 ? "zoomin" : undefined);
  runScript(async c => {
    await c.wait(500);
    if (L.i === 0) {
      await c.say("Here's how heroes read! Watch my star. I touch each letter and say its sound, then I zoom them together!");
      await soundOut(units, word); c.chk();
      await c.say("Now you try, {name}! Slide your finger under the letters!");
      return;
    }
    await c.say(pick(WORD_LINES));
    // point out the special part of the word for the first few words (or now and then)
    if (L.i > 3 && Math.random() > 0.4) return;
    const team = units.find(u => u.g.length > 1 && u.k !== "_");
    const silent = units.find(u => u.k === "_");
    if (silent) {
      const v = units.find(u => /^[aeiou]$/.test(u.g) && u.k !== u.g);
      await c.say(`See the Magic e at the end? Shh! It's quiet, but it makes ${v ? v.g : "the vowel"} say its name!`);
      if (v) await c.sound(v.k);
    } else if (team) {
      await c.say(`Look! ${team.g.split("").join(" and ")} are holding hands. Together they say...`);
      await c.sound(team.k);
    }
  });
}

function renderSayWord() {
  const { word, units, emoji } = L.cur;
  L.cur.tries = 0;
  show(`${lessonTop(L.words.length, L.i)}
    <div class="card read-card">
      <div class="phase"><span class="ph done">👀 Look</span><span class="ph on">🎤 Say</span><span class="ph">🧩 Build</span></div>
      <div class="pic">${emoji}</div>
      <div class="tiles" id="tiles">${tilesHTML(units)}</div>
      <div id="fb" class="feedback"></div>
      ${micBlock("Tap the mic and read the word!")}
      <div class="row">
        <button class="btn yellow small" id="hear">🔊 Help me</button>
        <button class="btn ghost small hidden" id="skip">Keep going ➜</button>
      </div>
    </div>`);
  attachSlide($("#tiles"), units);
  $("#hear").onclick = () => soundOut(units, word);
  $("#skip").onclick = renderBuildWord;
  heroSay(pick(SAY_LINES));
  wireMic(async (alts, manual) => {
    const sid = screenId;
    L.cur.tries++;
    const res = manual !== undefined ? { score: manual, heard: "" } : Speech.scoreWord(word, alts);
    if (res.score === 1) {
      Sfx.ding(); starBurst($(".pic"));
      fb(`⭐ ${pick(PRAISE)}${res.heard ? ` I heard "<b>${esc(res.heard)}</b>"` : ""}`, "good");
      await heroSay(`${pick(WIN_LINES)} ${word}!`);
      if (alive(sid)) renderBuildWord();
      return;
    }
    if (manual === undefined && !alts.length) {
      fb("🙉 I didn't hear you. Tap the mic and say it nice and loud!", "tip");
      heroSay("I didn't hear you. Say it nice and loud!");
    } else {
      Sfx.oops();
      fb(res.score === 0.5 ? `So close! I heard "<b>${esc(res.heard)}</b>"` : `${res.heard ? `I heard "<b>${esc(res.heard)}</b>". ` : ""}Let's listen together!`, "tip");
      await heroSay(res.score === 0.5 ? "So close! Listen..." : pick(ENCOURAGE));
      if (alive(sid)) await soundOut(units, word);
    }
    if (alive(sid) && L.cur.tries >= 2) {
      if (!L.missed.includes(word)) L.missed.push(word);
      $("#skip").classList.remove("hidden");
    }
  });
}

function renderBuildWord() {
  const { word, units, emoji } = L.cur;
  const letters = "bcdfghjklmnprstvwz".split("").filter(c => !word.includes(c));
  const pieces = shuffle([...units.map(u => u.g), pick(letters)]);
  let next = 0;
  show(`${lessonTop(L.words.length, L.i)}
    <div class="card read-card">
      <div class="phase"><span class="ph done">👀 Look</span><span class="ph done">🎤 Say</span><span class="ph on">🧩 Build</span></div>
      <div class="pic">${emoji}</div>
      <div class="slots" id="slots">${units.map((u, i) => `<span class="slot" data-i="${i}"></span>`).join("")}</div>
      <div class="pieces">${pieces.map((g, j) => `<button class="tile piece ${/^[aeiou]/.test(g) ? "vowel" : ""}" data-j="${j}">${g}</button>`).join("")}</div>
      <div id="fb" class="feedback"></div>
      <button class="btn yellow small" id="hear">🔊 Hear the word</button>
    </div>`);
  $("#hear").onclick = () => Speech.say(word, { rate: 0.75 });
  heroSay(pick(BUILD_LINES));
  $$(".piece").forEach(btn => btn.onclick = async () => {
    if (next >= units.length) return;
    const g = pieces[+btn.dataset.j];
    const need = units[next];
    if (g === need.g) {
      const slot = $$("#slots .slot")[next];
      slot.textContent = g; slot.classList.add("filled");
      if (need.k === "_") slot.classList.add("silent");
      btn.classList.add("used"); btn.disabled = true;
      need.k === "_" ? Speech.say("shh") : Speech.sound(need.k);
      next++;
      if (next === units.length) {
        const sid = screenId;
        await sleep(600);
        Sfx.ding(); starBurst($("#slots")); confetti(50);
        $("#slots").classList.add("blend");
        await heroSay(`${word}! ${pick(WIN_LINES)}`);
        if (!alive(sid)) return;
        L.i++;
        if (L.i >= L.words.length || timeUp()) renderQuizIntro();
        else renderReadWord();
      }
    } else {
      btn.classList.remove("wiggle"); void btn.offsetWidth; btn.classList.add("wiggle");
      Sfx.oops();
      if (need.k === "_") heroSay("Now add the quiet magic e!");
      else { fb("👂 Which letter makes this sound?", "tip"); Speech.sound(need.k); }
    }
  });
}

/* ---------------- quiz intro (shared) ---------------- */
function renderQuizIntro() {
  const reading = L.mode === "reading";
  show(`<div class="card intro quiz-intro">
      <div class="big-emoji">🎯</div>
      <h2>QUIZ TIME!</h2>
      <p>${timeUp() ? "Great work — 20 minutes of learning! " : ""}Do your best to help Captain Leap jump to the next building!</p>
      <div class="jump-preview">${hangingHeroHTML({ rope: 50, size: 80 })}<span>➜ 🏢</span></div>
      <button class="btn big green" id="go">I'm ready! 💪</button>
    </div>`);
  heroEnter("drop");
  setTimeout(() => heroSay("Quiz time, {name}! Show me your super brain power, and I'll swing to the next building! You can do it!"), 700);
  $("#go").onclick = reading ? startReadingQuiz : startSpeakingQuiz;
}

/* ============================================================
   READING QUIZ  (child's pronunciation is evaluated)
   ============================================================ */
function startReadingQuiz() {
  const practiced = L.words.slice(0, Math.max(L.i, 4));
  const all = L.words;
  const readW = shuffle(practiced).slice(0, 4);
  const tapW = shuffle(practiced).slice(0, 2);
  const items = [
    ...readW.map(w => ({ t: "read", w })),
    ...tapW.map(w => ({ t: "tap", w, opts: shuffle([w, ...shuffle(all.filter(x => x !== w)).slice(0, 2)]) }))
  ];
  Q = { items: [items[0], items[1], items[4], items[2], items[3], items[5]], k: 0, points: 0, missed: [] };
  renderQuizItem();
}
function nextQuizItem() {
  Q.k++;
  if (Q.k >= Q.items.length) return L.mode === "reading" ? finishLesson("reading") : finishLesson("speaking");
  L.mode === "reading" ? renderQuizItem() : renderSpeakQuizItem();
}
function renderQuizItem() {
  const it = Q.items[Q.k];
  it.t === "read" ? renderQuizRead(it) : renderQuizTap(it);
}
function renderQuizRead(it) {
  const [word, code, emoji] = it.w;
  const units = parseUnits(code);
  let tries = 0, finished = false;
  show(`${quizTop()}
    <div class="card read-card">
      <div class="qlabel">Read this word out loud!</div>
      <div class="pic mystery" id="pic">❓</div>
      <div class="tiles" id="tiles">${tilesHTML(units)}</div>
      <div id="fb" class="feedback"></div>
      ${micBlock("Tap the mic and read!")}
      <div class="row"><button class="btn ghost small" id="skip">🤷 I don't know yet</button>
      <button class="btn big green hidden" id="next">Next ➜</button></div>
    </div>`);
  heroSay("Read this word out loud!");
  const reveal = async (good) => {
    finished = true;
    const p = $("#pic"); p.textContent = emoji; p.classList.remove("mystery"); p.classList.add("bounce");
    $("#skip").classList.add("hidden");
    const mic = $(".mic-wrap") || $("#gcheck"); if (mic) mic.classList.add("hidden");
    if (!good) { if (!Q.missed.includes(word)) Q.missed.push(word); await soundOut(units, word); }
    $("#next").classList.remove("hidden");
  };
  $("#skip").onclick = () => { fb(`This word is <b>${word}</b>.`, "tip"); heroSay(`That's okay! This word is ${word}.`); reveal(false); };
  $("#next").onclick = nextQuizItem;
  wireMic(async (alts, manual) => {
    if (finished) return;
    tries++;
    const res = manual !== undefined ? { score: manual, heard: "" } : Speech.scoreWord(word, alts);
    if (res.score === 1) {
      Q.points += tries === 1 ? 1 : 0.75;
      Sfx.ding(); starBurst($("#tiles"));
      fb(`⭐ Correct!${res.heard ? ` I heard "<b>${esc(res.heard)}</b>"` : ""}`, "good");
      heroSay(`${pick(PRAISE)} It's ${word}!`);
      reveal(true);
    } else if (manual === undefined && !alts.length) {
      tries--;
      fb("🙉 I didn't hear you. Try again, nice and loud!", "tip");
      heroSay("I didn't hear you. Try again!");
    } else if (tries < 2) {
      Sfx.oops();
      fb(`${res.heard ? `I heard "<b>${esc(res.heard)}</b>". ` : ""}Look at each letter and try once more!`, "tip");
      heroSay(res.score === 0.5 ? "Very close! Try once more." : "Try one more time! Look at each letter.");
    } else {
      Q.points += res.score * 0.5;
      fb(`Good try! This word is <b>${word}</b>.`, "tip");
      await heroSay(`Good try! Listen.`);
      reveal(false);
    }
  });
}
function renderQuizTap(it) {
  const [word] = it.w;
  let answered = false;
  show(`${quizTop()}
    <div class="card read-card">
      <div class="qlabel">Listen! Which word did I say?</div>
      <button class="btn yellow big" id="again">🔊 Hear it again</button>
      <div class="word-choices">${it.opts.map((o, j) => `<button class="word-choice" data-j="${j}">${o[0]}</button>`).join("")}</div>
      <div id="fb" class="feedback"></div>
      <button class="btn big green hidden" id="next">Next ➜</button>
    </div>`);
  const sayIt = () => Speech.say(word, { rate: 0.7 });
  heroSay("Listen carefully! Which word is it?").then(sayIt);
  $("#again").onclick = sayIt;
  $("#next").onclick = nextQuizItem;
  $$(".word-choice").forEach(b => b.onclick = () => {
    if (answered) return;
    answered = true;
    const o = it.opts[+b.dataset.j];
    const right = $$(".word-choice").find(x => x.textContent === word);
    if (o[0] === word) {
      Q.points += 1; b.classList.add("right"); Sfx.ding(); starBurst(b);
      fb(`⭐ Yes! <span class="big-e">${it.w[2]}</span>`, "good"); heroSay(`${pick(PRAISE)} ${word}!`);
    } else {
      b.classList.add("wrong"); right.classList.add("right"); Sfx.oops();
      if (!Q.missed.includes(word)) Q.missed.push(word);
      fb(`It was <b>${word}</b> <span class="big-e">${it.w[2]}</span>`, "tip"); heroSay(`Oops! It was ${word}. You'll get it next time!`);
    }
    $("#next").classList.remove("hidden");
  });
}

/* ============================================================
   SPEAKING LESSON
   Techniques: Colourful Semantics (who/doing/what/where),
   sentence frames with fading prompts, conversation with
   expansion & recasting, story sequencing (first/next/last).
   ============================================================ */
function startSpeaking() {
  const idx = S.speaking.level % SPEAK_LEVELS.length;
  const lvl = SPEAK_LEVELS[idx];
  const n = SCENES.length;
  const base = S.speaking.level * 4;
  const sc = k => SCENES[(base + k) % n];
  const cq = k => CONVO[(S.speaking.level * 3 + k) % CONVO.length];
  L = {
    mode: "speaking", idx, roles: lvl.roles, start: Date.now(), i: 0,
    acts: [
      { t: "picture", scene: sc(0) },
      { t: "frame", f: FRAMES[lvl.frames[0]] },
      { t: "convo", qs: [cq(0), cq(1)] },
      { t: "picture", scene: sc(1) },
      { t: "story", s: STORIES[S.speaking.level % STORIES.length] },
      { t: "frame", f: FRAMES[lvl.frames[1]] },
      { t: "picture", scene: sc(2) }
    ],
    quizScenes: [sc(3), SCENES[(base + 9) % n]],
    quizQ: cq(2)
  };
  show(`${lessonTop(L.acts.length, 0)}
    <div class="card intro">
      <div class="lvl-badge blue">🗣️ Speaking · Level ${S.speaking.level + 1}</div>
      <h2>${esc(lvl.title)}</h2>
      <div class="train" id="train"><span class="engine">🚂</span>${lvl.roles.map(r => `<span class="blk car" data-r="${r}" style="--c:${ROLES[r].color}">${ROLES[r].label}</span>`).join("")}</div>
      <div class="train-example" id="trainEx"></div>
      <p>We'll talk about pictures, chat with <b>Ollie the Owl 🦉</b>, and tell a story. Then a <b>quiz</b>!</p>
      <button class="btn big green hidden pulse-btn" id="go">Let's talk! 🚀</button>
      <button class="btn ghost small" id="skipIntro">⏭ Skip intro</button>
    </div>`, { stop: true });
  const go = () => { $("#go").classList.remove("hidden"); $("#skipIntro").classList.add("hidden"); };
  $("#go").onclick = renderAct;
  $("#skipIntro").onclick = () => { Speech.stop(); screenId++; go(); };
  runScript(async c => {
    heroEnter("drop");
    await c.wait(1000);
    await c.say(pick(HELLOS));
    await c.say("Today we build sentence TRAINS! Choo choo!");
    c.sfx("whoosh"); $("#train").classList.add("chug");
    for (const r of lvl.roles) {
      const car = $(`#train [data-r="${r}"]`);
      car.classList.add("lit", "pop");
      await c.say(ROLE_TALK[r]);
      car.classList.remove("lit");
    }
    const ex = L.acts[0].scene;
    $("#trainEx").innerHTML = lvl.roles.map(r => `<span class="blk" style="--c:${ROLES[r].color}">${ex[r][1]} ${esc(phraseOf(ex, r, lvl.roles))}</span>`).join("");
    await c.say("When we hook the cars together, we get a big sentence! Listen...");
    await c.word(sentenceOf(ex, lvl.roles), 0.85);
    c.mood("cheer");
    await c.say("Wow! Now let's build sentence trains together, {name}! All aboard!");
    go();
  });
}
function nextAct() {
  L.i++;
  if (L.i >= L.acts.length || timeUp()) renderQuizIntro();
  else renderAct();
}
function renderAct() {
  const a = L.acts[L.i];
  ({ picture: renderPictureAct, frame: renderFrameAct, convo: renderConvoAct, story: renderStoryAct })[a.t](a);
}

function phraseOf(sc, r, roles) {
  if (r === "doing" && !roles.includes("what")) return sc.doing[0].replace(/ on$/, "");
  return sc[r][0];
}
function sentenceOf(sc, roles) { return cap(roles.map(r => phraseOf(sc, r, roles)).join(" ")) + "."; }
function sceneHTML(sc) {
  return `<div class="scene"><div class="s-where">${sc.where[1]}</div><div class="s-who">${sc.who[1]}</div>
    <div class="s-doing">${sc.doing[1]}</div><div class="s-what">${sc.what[1]}</div></div>`;
}
function distractors(r, sc) {
  const seen = new Set([sc[r][0], sc[r][1]]);
  const out = [];
  for (const s of shuffle(SCENES)) {
    if (!seen.has(s[r][0]) && !seen.has(s[r][1])) { out.push(s[r]); seen.add(s[r][0]); seen.add(s[r][1]); }
    if (out.length === 2) break;
  }
  return out;
}
function sentenceGroups(sentence) {
  return Speech.normalize(sentence).filter(w => !["a", "an", "the"].includes(w))
    .map(w => [w.length > 4 ? w.slice(0, w.length - 1) : w]);
}
async function readStrip(sc, roles) {
  const sid = screenId;
  for (const r of roles) {
    if (!alive(sid)) return;
    const b = $(`.strip [data-r="${r}"]`);
    b && b.classList.add("lit");
    await Speech.say(phraseOf(sc, r, roles), { rate: 0.8 });
    b && b.classList.remove("lit");
  }
}

/* ---- Picture Talk (Colourful Semantics) ---- */
function renderPictureAct(act) {
  const sc = act.scene, roles = L.roles;
  const sentence = sentenceOf(sc, roles);
  let ri = 0, busy = false, tries = 0;
  show(`${lessonTop(L.acts.length, L.i)}
    <div class="card">
      <div class="act-title">📸 Picture Talk</div>
      ${sceneHTML(sc)}
      <div class="strip" id="strip">${roles.map(r => `<span class="blk empty" data-r="${r}" style="--c:${ROLES[r].color}">${ROLES[r].label}</span>`).join("")}</div>
      <div class="ask" id="ask"></div>
      <div class="chips" id="chips"></div>
      <div id="fb" class="feedback"></div>
      <div id="micArea"></div>
      <div class="row" id="nav"></div>
    </div>`);
  const sid = screenId;

  async function askRole() {
    if (!alive(sid)) return;
    const r = roles[ri];
    const opts = shuffle([sc[r], ...distractors(r, sc)]);
    busy = false;
    $("#ask").innerHTML = `<span class="q" style="--c:${ROLES[r].color}">${ROLES[r].ask}</span>`;
    $("#chips").innerHTML = opts.map((o, j) => `<button class="chip" data-j="${j}" style="--c:${ROLES[r].color}"><span class="ce">${o[1]}</span>${esc(r === "doing" && !roles.includes("what") ? o[0].replace(/ on$/, "") : o[0])}</button>`).join("");
    $("#micArea").innerHTML = Speech.canListen ? micBlock("Say it, or tap a picture!") : `<div class="mic-label">Say it out loud, then tap the right picture!</div>`;
    fb("");
    $$("#chips .chip").forEach(c => c.onclick = () => {
      if (busy) return;
      if (opts[+c.dataset.j] === sc[r]) fill(r);
      else { c.classList.remove("wiggle"); void c.offsetWidth; c.classList.add("wiggle"); Sfx.oops(); heroSay("Hmm, look at the picture again!"); }
    });
    wireMic(alts => {
      if (busy) return;
      const res = Speech.scoreSentence([sc[r][2]], alts);
      if (res.count) { fb(`🎉 I heard "<b>${esc(res.heard)}</b>"`, "good"); fill(r); }
      else {
        fb(alts.length ? `I heard "<b>${esc(alts[0])}</b>". Can you find it in the pictures?` : "🙉 I didn't hear you. Try again or tap a picture!", "tip");
        heroSay(alts.length ? "Good try! Which picture shows it?" : "I didn't hear you. Try again, or tap a picture!");
      }
    });
    await heroSay(ROLES[r].ask);
  }

  async function fill(r) {
    busy = true;
    const blk = $(`#strip [data-r="${r}"]`);
    blk.textContent = phraseOf(sc, r, roles);
    blk.classList.remove("empty"); blk.classList.add("pop");
    Sfx.ding(); starBurst(blk);
    $("#chips").innerHTML = ""; $("#micArea").innerHTML = "";
    await Speech.say(phraseOf(sc, r, roles), { rate: 0.85 });
    ri++;
    if (ri < roles.length) askRole(); else sentenceTime();
  }

  async function sentenceTime() {
    if (!alive(sid)) return;
    $("#ask").innerHTML = `<span class="q" style="--c:#b06cff">Listen to our big sentence!</span>`;
    await heroSay("Wow, look at our sentence! Listen.");
    await readStrip(sc, roles);
    if (!alive(sid)) return;
    $("#ask").innerHTML = `<span class="q" style="--c:#b06cff">Your turn! Say the WHOLE sentence.</span>`;
    $("#micArea").innerHTML = micBlock("Say the whole sentence!");
    $("#nav").innerHTML = `<button class="btn yellow small" id="hearS">🔊 Hear it again</button><button class="btn ghost small hidden" id="nextA">Next ➜</button>`;
    $("#hearS").onclick = () => readStrip(sc, roles);
    $("#nextA").onclick = nextAct;
    heroSay("Your turn! Say the whole sentence.");
    wireMic(async (alts, manual) => {
      tries++;
      let full;
      if (manual !== undefined) full = manual === 1;
      else {
        if (!alts.length) { tries--; heroSay("I didn't hear you. Tap the mic and try again!"); return; }
        const res = Speech.scoreSentence(roles.map(r => sc[r][2]), alts);
        roles.forEach((r, i) => $(`#strip [data-r="${r}"]`).classList.toggle("hit", res.hits[i]));
        full = res.count === roles.length;
        fb(`You said: "<b>${esc(res.heard)}</b>"`, full ? "good" : "tip");
      }
      if (full) {
        Sfx.ding(); confetti(60);
        await heroSay(`${pick(PRAISE)} What a super sentence!`);
        $("#micArea").innerHTML = "";
        $("#nextA").classList.remove("hidden"); $("#nextA").classList.replace("ghost", "green");
      } else if (tries < 2) {
        await heroSay(`Good try! Let's say it together: ${sentence} Now you!`);
      } else {
        await heroSay(`You're working so hard! The sentence is: ${sentence}`);
        $("#nextA").classList.remove("hidden");
      }
    }, { maxMs: 9000 });
  }
  heroSay("Let's talk about this picture!").then(askRole);
}

/* ---- Sentence frames with fading prompts ---- */
function renderFrameAct(act) {
  const items = act.f.items.slice(0, 3);
  let k = 0, tries = 0;
  show(`${lessonTop(L.acts.length, L.i)}
    <div class="card">
      <div class="act-title">🧱 Sentence Builder</div>
      <div class="frame-box" id="frameBox"></div>
      <div id="fb" class="feedback"></div>
      ${micBlock("Say the sentence!")}
      <div class="row"><button class="btn yellow small" id="hint">💡 Help me</button>
      <button class="btn ghost small hidden" id="nextA">Next ➜</button></div>
    </div>`);
  const sid = screenId;
  const sentence = () => act.f.frame.replace("{x}", items[k][0]);
  async function step() {
    if (!alive(sid)) return;
    tries = 0;
    const [x, em] = items[k];
    const [pre, post] = act.f.frame.split("{x}");
    $("#frameBox").innerHTML = `<span>${esc(pre)}</span><span class="blank"><span class="ce">${em}</span><small>${esc(x)}</small></span><span>${esc(post)}</span>
      <div class="frame-dots">${items.map((_, i) => `<span class="${i < k ? "on" : ""} ${i === k ? "cur" : ""}"></span>`).join("")}</div>`;
    $("#nextA").classList.add("hidden");
    fb("");
    // fading prompts: model first, then let the child try alone
    if (k === 0) await heroSay(`Listen: ${sentence()} Now you say it!`);
    else await heroSay(k === 1 ? "Now a new picture. You try first!" : "Last one! You can do it!");
  }
  $("#hint").onclick = () => Speech.say(sentence(), { rate: 0.8 });
  $("#nextA").onclick = () => { k++; k < items.length ? step() : nextAct(); };
  wireMic(async (alts, manual) => {
    tries++;
    let ok;
    if (manual !== undefined) ok = manual >= 0.5;
    else {
      if (!alts.length) { tries--; heroSay("I didn't hear you. Try again!"); return; }
      const g = sentenceGroups(sentence());
      const res = Speech.scoreSentence(g, alts);
      ok = res.count >= Math.ceil(g.length * 0.6);
      fb(`You said: "<b>${esc(res.heard)}</b>"`, ok ? "good" : "tip");
    }
    if (ok) {
      Sfx.ding(); starBurst($("#frameBox"));
      await heroSay(pick(PRAISE));
      if (!alive(sid)) return;
      k++;
      if (k < items.length) step(); else { $("#nextA").classList.remove("hidden"); $("#nextA").classList.replace("ghost", "green"); k = items.length - 1; $("#nextA").onclick = nextAct; }
    } else if (tries < 2) {
      await heroSay(`Almost! Listen: ${sentence()} Your turn!`);
    } else {
      await heroSay(`Great trying! ${sentence()}`);
      $("#nextA").classList.remove("hidden");
    }
  }, { maxMs: 8000 });
  step();
}

/* ---- Conversation with Ollie the Owl: expansion & recasting ---- */
function extractSlot(frame, alt) {
  const pre = Speech.normalize(frame.split("{x}")[0]);
  let w = Speech.normalize(alt);
  let i = 0;
  while (i < pre.length && i < w.length && (w[i] === pre[i] || w[i].startsWith(pre[i].slice(0, 4)))) i++;
  if (i >= Math.min(2, pre.length)) w = w.slice(i);
  return Speech.keyAnswer(w.join(" ")) || w.join(" ");
}
function renderConvoAct(act) {
  let qi = 0;
  show(`${lessonTop(L.acts.length, L.i)}
    <div class="card convo">
      <div class="act-title">💬 Chat with Ollie</div>
      <div class="owl-row"><div class="owl" id="owl">🦉</div><div class="owl-bubble" id="ob"></div></div>
      <div class="kid-row"><div class="kid-bubble hidden" id="kid"></div><div class="kid-face">🧒</div></div>
      <div class="model hidden" id="model"></div>
      <div class="chips" id="chips"></div>
      <div id="fb" class="feedback"></div>
      <div id="micArea"></div>
      <div class="row" id="nav"></div>
    </div>`);
  hideBuddy();
  const sid = screenId;
  const owlSay = text => {
    $("#ob").textContent = text;
    const o = $("#owl"); o.classList.remove("talk"); void o.offsetWidth; o.classList.add("talk");
    return Speech.say(text, { pitch: 0.72 });
  };
  const kidSay = text => { const k = $("#kid"); k.textContent = text; k.classList.remove("hidden"); };

  async function ask() {
    if (!alive(sid)) return;
    const q = act.qs[qi];
    $("#model").classList.add("hidden"); $("#kid").classList.add("hidden");
    $("#chips").innerHTML = ""; $("#nav").innerHTML = ""; fb("");
    $("#micArea").innerHTML = micBlock("Tap and answer Ollie!");
    $("#nav").innerHTML = `<button class="btn yellow small" id="help">🤔 Help me</button>`;
    $("#help").onclick = showOptions;
    if (!Speech.canListen) { $("#micArea").innerHTML = ""; showOptions(); }
    wireMic(onAnswer, { maxMs: 8000 });
    await owlSay(q.q);
  }
  function showOptions() {
    const q = act.qs[qi];
    $("#chips").innerHTML = q.options.map((o, j) => `<button class="chip" data-j="${j}" style="--c:#ffd23f"><span class="ce">${o[1]}</span>${esc(o[0])}</button>`).join("");
    $$("#chips .chip").forEach(c => c.onclick = () => { const o = q.options[+c.dataset.j]; kidSay(`${o[1]} ${o[0]}`); expand(o[0]); });
  }
  async function onAnswer(alts) {
    const q = act.qs[qi];
    if (!alts.length) { await owlSay("Hoo? I didn't hear you. Try again, or tap Help me!"); return; }
    kidSay(`"${alts[0]}"`);
    const words = Speech.normalize(alts[0]);
    const x = extractSlot(q.frame, alts[0]);
    if (words.length >= 4) {
      Sfx.ding(); starBurst($("#kid"));
      await owlSay(`Wow, what a big sentence! ${q.react.replace("{x}", x)}`);
      done();
    } else expand(x || alts[0]);
  }
  // Recast the child's short answer into a full sentence and invite repetition
  async function expand(x) {
    const q = act.qs[qi];
    const model = q.frame.replace("{x}", x);
    $("#chips").innerHTML = "";
    const m = $("#model"); m.innerHTML = `🗨️ ${esc(model)}`; m.classList.remove("hidden");
    let tries = 0;
    $("#micArea").innerHTML = micBlock("Say the big sentence!");
    $("#nav").innerHTML = `<button class="btn yellow small" id="hearM">🔊 Hear it</button>`;
    $("#hearM").onclick = () => Speech.say(model, { rate: 0.8 });
    wireMic(async (alts, manual) => {
      tries++;
      let ok;
      if (manual !== undefined) ok = manual >= 0.5;
      else {
        if (!alts.length) { tries--; owlSay("Hoo? Say it again, nice and loud!"); return; }
        kidSay(`"${alts[0]}"`);
        const g = sentenceGroups(model);
        ok = Speech.scoreSentence(g, alts).count >= Math.ceil(g.length * 0.6);
      }
      if (ok) {
        Sfx.ding(); starBurst($("#model"));
        await owlSay(`${pick(PRAISE)} ${q.react.replace("{x}", x)}`);
        done();
      } else if (tries < 2) {
        await owlSay(`Let's try again together. ${model}`);
      } else {
        await owlSay(`Good talking! ${q.react.replace("{x}", x)}`);
        done();
      }
    }, { maxMs: 8000 });
    await owlSay(`${cap(x)}! Let's say it in a big sentence: ${model} Your turn!`);
  }
  function done() {
    if (!alive(sid)) return;
    $("#micArea").innerHTML = "";
    qi++;
    $("#nav").innerHTML = `<button class="btn big green" id="nextA">${qi < act.qs.length ? "Next question ➜" : "Next ➜"}</button>`;
    $("#nextA").onclick = () => qi < act.qs.length ? ask() : nextAct();
  }
  ask();
}

/* ---- Story sequencing: First / Next / Last ---- */
function renderStoryAct(act) {
  const st = act.s;
  const order = shuffle([0, 1, 2]);
  const labels = ["First", "Next", "Last"];
  let next = 0, tries = 0;
  show(`${lessonTop(L.acts.length, L.i)}
    <div class="card">
      <div class="act-title">📚 Story Time</div>
      <div class="ask"><span class="q" style="--c:#b06cff">Which picture comes FIRST?</span></div>
      <div class="story-slots">${labels.map((l, i) => `<div class="sslot" data-i="${i}"><small>${l}</small><span></span></div>`).join("")}</div>
      <div class="story-pics">${order.map(p => `<button class="spic" data-p="${p}">${st.pics[p]}</button>`).join("")}</div>
      <div id="fb" class="feedback"></div>
      <div id="micArea"></div>
      <div class="row" id="nav"></div>
    </div>`);
  const sid = screenId;
  heroSay("Let's make a story! Tap the picture that happens first.");
  $$(".spic").forEach(b => b.onclick = async () => {
    const p = +b.dataset.p;
    if (p !== next) { b.classList.remove("wiggle"); void b.offsetWidth; b.classList.add("wiggle"); Sfx.oops(); heroSay(`Hmm, what happens ${labels[next].toLowerCase()}?`); return; }
    const slot = $$(".sslot")[next];
    slot.querySelector("span").textContent = st.pics[p]; slot.classList.add("filled");
    b.classList.add("used"); b.disabled = true;
    Sfx.pop();
    next++;
    const ask = $(".ask .q");
    if (next < 3) { ask.textContent = `Which picture comes ${labels[next].toUpperCase()}?`; await Speech.say(st.lines[p]); }
    else { ask.textContent = "Listen to the story!"; await Speech.say(st.lines[p]); tell(); }
  });
  async function tell() {
    if (!alive(sid)) return;
    Sfx.ding();
    await heroSay("You did it! Listen to the whole story.");
    const slots = $$(".sslot");
    for (let i = 0; i < 3; i++) {
      if (!alive(sid)) return;
      slots[i].classList.add("lit"); await Speech.say(st.lines[i], { rate: 0.85 }); slots[i].classList.remove("lit");
    }
    if (!alive(sid)) return;
    $(".ask .q").textContent = "Now YOU tell the story! Use First... Next... Last...";
    $("#micArea").innerHTML = micBlock("Tell the whole story!");
    $("#nav").innerHTML = `<button class="btn yellow small" id="hearS">🔊 Hear the story</button><button class="btn ghost small hidden" id="nextA">Next ➜</button>`;
    $("#hearS").onclick = async () => { for (const l of st.lines) { if (!alive(sid)) return; await Speech.say(l, { rate: 0.85 }); } };
    $("#nextA").onclick = nextAct;
    heroSay("Now you tell the story! Start with First.");
    wireMic(async (alts, manual) => {
      tries++;
      let score;
      if (manual !== undefined) score = manual;
      else {
        if (!alts.length) { tries--; heroSay("I didn't hear you. Tap the mic and tell me the story!"); return; }
        const res = Speech.scoreSentence([["first"], ["next", "then"], ["last", "finally", "end"], ...st.keys.map(k => [k])], alts);
        score = res.count / 6;
        fb(`You said: "<b>${esc(res.heard)}</b>"`, score >= 0.5 ? "good" : "tip");
      }
      if (score >= 0.5) {
        Sfx.ding(); confetti(60);
        await heroSay("What a great storyteller you are!");
        $("#micArea").innerHTML = "";
        $("#nextA").classList.remove("hidden"); $("#nextA").classList.replace("ghost", "green");
      } else if (tries < 2) {
        await heroSay(`Good start! Try saying: ${st.lines[0]} Then keep going!`);
      } else {
        await heroSay("Super effort! Stories get easier every time you tell them.");
        $("#nextA").classList.remove("hidden");
      }
    }, { maxMs: 15000 });
  }
}

/* ============================================================
   SPEAKING QUIZ  (child's speech is evaluated)
   ============================================================ */
function startSpeakingQuiz() {
  Q = { items: [{ t: "qpic", scene: L.quizScenes[0] }, { t: "qconvo", q: L.quizQ }, { t: "qpic", scene: L.quizScenes[1] }], k: 0, points: 0, missed: [] };
  renderSpeakQuizItem();
}
function renderSpeakQuizItem() {
  const it = Q.items[Q.k];
  it.t === "qpic" ? renderQPic(it) : renderQConvo(it);
}
function renderQPic(it) {
  const sc = it.scene, roles = L.roles;
  const sentence = sentenceOf(sc, roles);
  let tries = 0, best = 0, finished = false;
  show(`${quizTop()}
    <div class="card">
      <div class="qlabel">Tell me about this picture in ONE big sentence!</div>
      ${sceneHTML(sc)}
      <div class="strip" id="strip">${roles.map(r => `<span class="blk empty" data-r="${r}" style="--c:${ROLES[r].color}">${ROLES[r].label}</span>`).join("")}</div>
      <div id="fb" class="feedback"></div>
      ${micBlock("Tap and tell me!")}
      <div class="row"><button class="btn big green hidden" id="next">Next ➜</button></div>
    </div>`);
  heroSay(`Tell me about this picture. Remember: ${roles.map(r => ROLES[r].label).join(" ")}`);
  $("#next").onclick = nextQuizItem;
  const finish = async () => {
    finished = true;
    Q.points += best;
    const m = $(".mic-wrap") || $("#gcheck"); if (m) m.classList.add("hidden");
    roles.forEach(r => { const b = $(`#strip [data-r="${r}"]`); b.textContent = phraseOf(sc, r, roles); b.classList.remove("empty"); });
    await heroSay(best >= 1 ? `${pick(PRAISE)} ${sentence}` : `Good try! We can say: ${sentence}`);
    $("#next").classList.remove("hidden");
  };
  wireMic(async (alts, manual) => {
    if (finished) return;
    tries++;
    if (manual !== undefined) { best = manual; return finish(); }
    if (!alts.length) { tries--; heroSay("I didn't hear you. Try again!"); return; }
    const res = Speech.scoreSentence(roles.map(r => sc[r][2]), alts);
    roles.forEach((r, i) => { if (res.hits[i]) { const b = $(`#strip [data-r="${r}"]`); b.classList.remove("empty"); b.classList.add("hit", "pop"); b.textContent = phraseOf(sc, r, roles); } });
    const s = res.count / roles.length;
    best = Math.max(best, tries === 1 ? s : s * 0.9);
    fb(`You said: "<b>${esc(res.heard)}</b>"`, s >= 1 ? "good" : "tip");
    if (s >= 1) { Sfx.ding(); starBurst($("#strip")); finish(); }
    else if (tries < 2) {
      const missing = roles.filter((r, i) => !res.hits[i]).map(r => ROLES[r].label);
      heroSay(`Good! Can you also tell me ${missing.join(" and ")} Try again!`);
    } else finish();
  }, { maxMs: 9000 });
}
function renderQConvo(it) {
  const q = it.q;
  let finished = false;
  show(`${quizTop()}
    <div class="card convo">
      <div class="qlabel">Answer Ollie in a big sentence!</div>
      <div class="owl-row"><div class="owl" id="owl">🦉</div><div class="owl-bubble" id="ob">${esc(q.q)}</div></div>
      <div class="kid-row"><div class="kid-bubble hidden" id="kid"></div><div class="kid-face">🧒</div></div>
      <div id="fb" class="feedback"></div>
      ${micBlock("Tap and answer!")}
      <div class="row"><button class="btn yellow small" id="again">🔊 Ask again</button><button class="btn big green hidden" id="next">Next ➜</button></div>
    </div>`);
  hideBuddy();
  Speech.say(q.q, { pitch: 0.72 });
  $("#again").onclick = () => Speech.say(q.q, { pitch: 0.72 });
  $("#next").onclick = nextQuizItem;
  wireMic(async (alts, manual) => {
    if (finished) return;
    let pts;
    if (manual !== undefined) pts = manual;
    else {
      if (!alts.length) { Speech.say("Hoo? I didn't hear you. Try again!"); return; }
      const k = $("#kid"); k.textContent = `"${alts[0]}"`; k.classList.remove("hidden");
      const n = Speech.normalize(alts[0]).length;
      pts = n >= 4 ? 1 : n >= 2 ? 0.5 : 0.25;
    }
    finished = true;
    Q.points += pts;
    const x = alts.length ? extractSlot(q.frame, alts[0]) : "";
    $("#ob").textContent = pts >= 1 ? "What a big sentence! 🌟" : `We can say: ${q.frame.replace("{x}", x || "...")}`;
    if (pts >= 1) { Sfx.ding(); starBurst($("#kid")); }
    await Speech.say(pts >= 1 ? `Wow, what a big sentence! ${x ? q.react.replace("{x}", x) : ""}` : `Good answer! Next time, try a big sentence like: ${q.frame.replace("{x}", x || "something")}`, { pitch: 0.72 });
    $("#mic") && $(".mic-wrap").classList.add("hidden");
    $("#gcheck") && $("#gcheck").classList.add("hidden");
    $("#next").classList.remove("hidden");
  }, { maxMs: 9000 });
}

/* ============================================================
   FINISH: score, stars, stickers, streak, jump!
   ============================================================ */
function finishLesson(mode) {
  const pct = Q.points / Q.items.length;
  const stars = pct >= 0.9 ? 3 : pct >= 0.7 ? 2 : pct >= 0.5 ? 1 : 0;
  const passed = pct >= 0.5;
  const m = S[mode];
  const from = m.level;
  const minutes = Math.round((Date.now() - L.start) / 60000);
  const missed = [...new Set([...(L.missed || []), ...(Q.missed || [])])];
  m.history.push({ date: today(), level: from, score: Math.round(pct * 100), stars, passed, minutes, missed });
  if (m.history.length > 200) m.history.shift();
  m.lastDone = today(); m.extra = false;
  if (passed) m.level++;
  const earned = stars + 1; // +1 star just for finishing the lesson
  S.totalStars += earned;
  let sticker = null;
  if (passed) { sticker = STICKERS[S.stickers.length % STICKERS.length]; S.stickers.push(sticker); }
  if (S.streak.last !== today()) {
    S.streak.count = S.streak.last === yesterday() ? S.streak.count + 1 : 1;
    S.streak.last = today();
  }
  save();
  L = null; Q = null;
  show(`<div class="card celebrate">
      <div class="celebrate-swing">${hangingHeroHTML({ rope: 110, size: 100 })}</div>
      <h1>${passed ? "LEVEL COMPLETE!" : "GREAT EFFORT!"}</h1>
      <div class="bigstars">${[0, 1, 2].map(i => `<span class="bstar ${i < stars ? "got" : ""}" style="animation-delay:${0.3 + i * 0.4}s">⭐</span>`).join("")}</div>
      <p class="score">Quiz score: <b>${Math.round(pct * 100)}%</b> · You earned <b>+${earned} ⭐</b></p>
      ${sticker ? `<div class="newsticker">New sticker for your book!<span>${sticker}</span></div>` : `<p>You still earned a star for learning today! 💪</p>`}
      <p class="streak">🔥 ${S.streak.count} day streak!</p>
      <button class="btn big green" id="toMap">${passed ? "Watch Captain Leap jump! ➜" : "See the map ➜"}</button>
    </div>`, { stop: true });
  Sfx.fanfare(); confetti();
  heroSay(passed ? `Hooray ${S.name}! You earned ${stars} quiz stars! Let's watch me jump!` : `You worked so hard, ${S.name}! Let's practice this level again tomorrow.`);
  $("#toMap").onclick = () => renderMap(mode, passed ? { from } : { hopInPlace: true });
}

/* ============================================================
   STICKER BOOK
   ============================================================ */
function renderStickers() {
  const count = {};
  S.stickers.forEach(s => count[s] = (count[s] || 0) + 1);
  show(`<div class="ltop"><button class="home-btn" id="homeBtn">🏠</button><div class="qtitle">🎖️ Sticker Book</div><div class="timer">${S.stickers.length} 🎖️</div></div>
    <div class="card">
      <p>Pass a quiz to win a new sticker!</p>
      <div class="sticker-grid">${STICKERS.map(s => `<div class="stk ${count[s] ? "got" : ""}">${s}${count[s] > 1 ? `<small>x${count[s]}</small>` : ""}</div>`).join("")}</div>
    </div>`);
  heroSay(S.stickers.length ? `You have ${S.stickers.length} stickers! Amazing!` : "Your sticker book is empty. Finish a lesson and quiz to win your first sticker!");
}

/* ============================================================
   GROWN-UPS AREA
   ============================================================ */
function renderGate() {
  const a = 3 + Math.floor(Math.random() * 7), b = 4 + Math.floor(Math.random() * 6);
  show(`<div class="ltop"><button class="home-btn" id="homeBtn">🏠</button><div class="qtitle">👩 Grown-ups only</div><div></div></div>
    <div class="card intro"><h2>Grown-up check</h2><p>What is <b>${a} × ${b}</b>?</p>
    <input id="gate" class="name-in" inputmode="numeric" autocomplete="off"><button class="btn green big" id="ok">Enter</button></div>`, { stop: true });
  hideBuddy();
  const go = () => { if (+$("#gate").value === a * b) renderParent(); else { $("#gate").value = ""; $("#gate").classList.add("wiggle"); } };
  $("#ok").onclick = go;
  $("#gate").onkeydown = e => { if (e.key === "Enter") go(); };
  $("#gate").focus();
}

function renderParent() {
  const voices = Speech.listVoices();
  const hist = mode => {
    const h = S[mode].history.slice(-14).reverse();
    if (!h.length) return "<p class='small-note'>No lessons yet.</p>";
    return `<table class="hist"><tr><th>Date</th><th>Level</th><th>Quiz</th><th>Stars</th><th>Mins</th><th>Practise</th></tr>
      ${h.map(x => `<tr><td>${x.date}</td><td>${x.level + 1}</td><td>${x.score}% ${x.passed ? "✅" : "🔁"}</td><td>${"⭐".repeat(x.stars)}</td><td>${x.minutes}</td><td>${esc((x.missed || []).join(", "))}</td></tr>`).join("")}</table>`;
  };
  const lvlSel = (mode, levels) => `<select id="lv-${mode}">${levels.map((l, i) => `<option value="${i}" ${S[mode].level % levels.length === i && S[mode].level < levels.length ? "selected" : ""}>${i + 1}. ${esc(l.title)}</option>`).join("")}${S[mode].level >= levels.length ? `<option selected value="${S[mode].level}">Champion (${S[mode].level + 1})</option>` : ""}</select>`;
  show(`<div class="ltop"><button class="home-btn" id="homeBtn">🏠</button><div class="qtitle">👩 Grown-ups</div><div></div></div>
    <div class="card parent">
      <h3>Child</h3>
      <label>Name <input id="pname" value="${esc(S.name)}" maxlength="20"></label>
      <h3>Voice</h3>
      <label>Voice <select id="pvoice"><option value="">Automatic</option>${voices.map(v => `<option value="${esc(v.voiceURI)}" ${v.voiceURI === S.settings.voiceURI ? "selected" : ""}>${esc(v.name)} (${v.lang})</option>`).join("")}</select></label>
      <label>Speed <input type="range" id="prate" min="0.6" max="1.2" step="0.05" value="${S.settings.rate}"> <span id="rv">${S.settings.rate}</span></label>
      <label>Captain Leap's kid voice (pitch) <input type="range" id="ppitch" min="1" max="2" step="0.05" value="${S.settings.pitch || 1.55}"> <span id="pv">${S.settings.pitch || 1.55}</span></label>
      <p class="small-note">Now using: <b>${esc(Speech.voiceName() || "default voice")}</b>. Tip: open the app in <b>Microsoft Edge</b> to get a real child voice ("Ana").</p>
      <div class="row"><button class="btn yellow small" id="ptest">🔊 Test voice & sounds</button>
      <button class="btn blue small" id="pmic">🎤 Test microphone</button></div>
      <div id="fb" class="feedback"></div>
      <p class="small-note">Speech listening: ${Speech.canListen ? "✅ available" : "⚠️ not available in this browser — use Chrome or Edge. You can still mark answers with the grown-up buttons."}</p>

      <h3>📲 Home-screen app</h3>
      <div id="installBox"></div>

      <h3>Levels & daily lesson</h3>
      <label>📖 Reading level ${lvlSel("reading", READING_LEVELS)}</label>
      <label>🗣️ Speaking level ${lvlSel("speaking", SPEAK_LEVELS)}</label>
      <div class="row"><button class="btn green small" id="unlock">🔓 Allow one extra lesson today</button></div>

      <h3>📖 Reading progress</h3>${hist("reading")}
      <h3>🗣️ Speaking progress</h3>${hist("speaking")}

      <h3>How the lessons work</h3>
      <ul class="howto">
        <li><b>Reading</b> uses synthetic phonics: the child touches each letter to hear its <i>sound</i> (not its name), blends the sounds, reads the word aloud (the app listens and checks), then builds it from letter tiles. Levels: short vowels → digraphs → blends → magic e → vowel teams → bossy r.</li>
        <li><b>Speaking</b> uses speech-therapy techniques: <i>Colourful Semantics</i> (Who / Doing / What / Where colour blocks to build sentences from pictures), <i>sentence frames</i> with fading prompts ("I see a ___"), <i>expansion & recasting</i> in conversation (short answers are modelled back as full sentences for the child to repeat), and <i>story sequencing</i> (First / Next / Last).</li>
        <li>One lesson per subject per day (about 15–20 minutes), then a quiz. Scoring 50%+ moves Captain Leap to the next building; otherwise the level repeats tomorrow. Every finished lesson earns a star.</li>
        <li>Tip: sit with your child, praise effort, and repeat the "Practise" words from the table above during the day.</li>
      </ul>

      <h3>Danger zone</h3>
      <button class="btn ghost small" id="reset">🗑️ Reset all progress</button>
      <div class="row"><button class="btn big green" id="psave">Save & go back</button></div>
    </div>`, { stop: true });
  const ib = $("#installBox");
  if (isStandalone()) ib.innerHTML = "<p>✅ Installed! Word Quest is running as a home-screen app.</p>";
  else if (installPrompt) {
    ib.innerHTML = `<button class="btn green small" id="installBtn">📲 Install app on this device</button>`;
    $("#installBtn").onclick = async () => { installPrompt.prompt(); await installPrompt.userChoice; installPrompt = null; renderParent(); };
  } else if (isIOS()) ib.innerHTML = "<p>On iPhone/iPad (in <b>Safari</b>): tap the <b>Share</b> button ⬆️, then <b>Add to Home Screen</b>.</p>";
  else ib.innerHTML = "<p>On Android: open the browser menu ⋮ and tap <b>Install app</b> or <b>Add to Home screen</b>. On Fire tablets (Silk): menu ☰ → <b>Add to Home</b>.</p>";
  $("#prate").oninput = e => $("#rv").textContent = e.target.value;
  $("#ppitch").oninput = e => $("#pv").textContent = e.target.value;
  const apply = () => {
    S.name = $("#pname").value.trim() || S.name;
    S.settings.voiceURI = $("#pvoice").value;
    S.settings.rate = +$("#prate").value;
    S.settings.pitch = +$("#ppitch").value;
    ["reading", "speaking"].forEach(mode => { const v = +$(`#lv-${mode}`).value; if (v !== S[mode].level) S[mode].level = v; });
    save(); Speech.init(S.settings);
  };
  $("#ptest").onclick = async () => { apply(); await heroSay("Hi! I'm Captain Leap! Let's read: cat."); for (const k of ["c", "a", "t"]) await Speech.sound(k); Speech.say("cat"); };
  $("#pmic").onclick = async () => {
    if (!Speech.canListen) { fb("Speech recognition is not supported in this browser.", "tip"); return; }
    fb("🎤 Listening... say something!", "tip");
    const r = await Speech.listen({ maxMs: 6000 });
    fb(r.error && !r.alts.length ? `Problem: ${esc(r.error)} — check microphone permission (click the 🔒 in the address bar).` : `Heard: <b>${esc(r.alts.join(" | ") || "(nothing)")}</b>`, r.alts.length ? "good" : "tip");
  };
  $("#unlock").onclick = () => { S.reading.extra = true; S.speaking.extra = true; save(); fb("✅ One extra lesson unlocked for each subject today.", "good"); };
  $("#reset").onclick = () => { if (confirm("Really delete ALL progress, stars and stickers?")) { localStorage.removeItem(STORE_KEY); S = defaultState(); renderHome(); } };
  $("#psave").onclick = () => { apply(); renderHome(); };
}

/* ---------------- boot ---------------- */
// iPhone/iPad: unlock sound on the first tap
const unlockAudio = () => { Speech.unlock(); Sfx.pop(); };
document.addEventListener("pointerdown", unlockAudio, { once: true, capture: true });
// "Install app" (Android/Chrome/Edge offer this event; iPhone/iPad use Share > Add to Home Screen)
let installPrompt = null;
window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); installPrompt = e; });
const isStandalone = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
Speech.init(S.settings);
renderHome();
