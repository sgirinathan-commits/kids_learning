/* ============================================================
   Captain Leap - original hero art + acrobatic animations
   (zip-rope swinging, flips, upside-down hanging, cheering)
   ============================================================ */

// Hand position inside the 64x83 sprite (where the zip-rope attaches)
const HERO_W = 64, HERO_H = 83, HAND_X = 53, HAND_Y = 15;

function heroSVG(cls = "") {
  return `<svg class="hero-svg ${cls}" viewBox="0 0 100 130" xmlns="http://www.w3.org/2000/svg" aria-label="Captain Leap">
    <g class="h-cape"><path d="M36 50 Q18 92 26 116 L50 104 L74 116 Q82 92 64 50 Z" fill="#ff5d3d"/>
      <path d="M36 50 Q24 90 30 110 L50 100 Z" fill="#e2442a"/></g>
    <g class="h-leg-l"><rect x="38" y="86" width="11" height="26" rx="5" fill="#139a9a"/><rect x="34" y="106" width="16" height="11" rx="5" fill="#ff8a3d"/></g>
    <g class="h-leg-r"><rect x="51" y="86" width="11" height="26" rx="5" fill="#139a9a"/><rect x="50" y="106" width="16" height="11" rx="5" fill="#ff8a3d"/></g>
    <rect x="33" y="48" width="34" height="44" rx="15" fill="#1fbfbf"/>
    <rect x="33" y="79" width="34" height="7" fill="#ffd23f"/><rect x="46" y="78" width="8" height="9" rx="2" fill="#ff8a3d"/>
    <path d="M50 54 l4 8 9 1 -7 6 2 9 -8 -5 -8 5 2 -9 -7 -6 9 -1z" fill="#ffd23f" stroke="#e0a800" stroke-width="1"/>
    <g class="h-arm-l"><rect x="23" y="52" width="10" height="28" rx="5" fill="#1fbfbf" transform="rotate(18 28 52)"/>
      <circle cx="20" cy="78" r="6" fill="#ff8a3d"/></g>
    <g class="h-arm-r" transform="rotate(25 69 52)"><rect x="64" y="20" width="10" height="34" rx="5" fill="#1fbfbf"/>
      <circle cx="69" cy="20" r="6.5" fill="#ff8a3d"/></g>
    <circle cx="50" cy="31" r="18" fill="#ffd2a8"/>
    <path d="M32 28 Q30 12 42 12 L44 6 L49 12 L54 4 L57 12 L63 8 L64 15 Q70 20 68 28 Q60 18 50 19 Q40 18 32 28Z" fill="#6b3e1e"/>
    <rect x="31" y="25" width="38" height="11" rx="5.5" fill="#ff5d3d"/>
    <circle cx="43" cy="30.5" r="5.5" fill="#fff59d" stroke="#2b2d42" stroke-width="1.6"/>
    <circle cx="57" cy="30.5" r="5.5" fill="#fff59d" stroke="#2b2d42" stroke-width="1.6"/>
    <circle class="h-eye" cx="44" cy="31" r="1.8" fill="#2b2d42"/><circle class="h-eye" cx="58" cy="31" r="1.8" fill="#2b2d42"/>
    <path class="h-mouth" d="M43 40 Q50 47 57 40" stroke="#7a3b1d" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    <circle cx="37" cy="39" r="2.5" fill="#ff9e9e" opacity=".7"/><circle cx="63" cy="39" r="2.5" fill="#ff9e9e" opacity=".7"/>
  </svg>`;
}

/** Hero hanging (optionally upside-down) from a swaying zip-rope. */
function hangingHeroHTML({ upside = false, rope = 90, size = 90 } = {}) {
  return `<div class="hang ${upside ? "upside" : ""}" style="--rope:${rope}px;--hs:${size}px">
    <div class="hang-rope"></div><div class="hang-body">${heroSVG()}</div></div>`;
}

const ease = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
function tween(ms, fn) {
  return new Promise(res => {
    const t0 = performance.now();
    (function f(now) {
      const t = Math.min(1, (now - t0) / ms);
      fn(t);
      t < 1 ? requestAnimationFrame(f) : res();
    })(t0);
  });
}

/* --- buddy reactions --- */
function heroMood(m) {
  const a = document.querySelector("#buddy .avatar");
  if (!a) return;
  a.classList.remove("cheer", "think", "wave");
  void a.offsetWidth;
  a.classList.add(m);
}

/* --- map: shoot zip-rope, swing, flip, land --- */
async function swingTo(k, mapH0, mapX, mapH) {
  const sp = document.getElementById("sprite");
  const rope = document.getElementById("rope");
  const hook = document.getElementById("hook");
  const map = sp.parentElement;
  const MH = map.clientHeight;
  const sx = mapX(k) - 32, sy = mapH(k), ex = mapX(k + 1) - 32, ey = mapH(k + 1);
  const hand = (left, bottom) => ({ x: left + HAND_X, y: MH - bottom - HERO_H + HAND_Y });
  const place = (hx, hy, rot) => {
    sp.style.left = hx - HAND_X + "px";
    sp.style.bottom = MH - (hy - HAND_Y) - HERO_H + "px";
    sp.style.transform = `rotate(${rot}deg)`;
  };
  const h1 = hand(sx, sy);
  const land = hand(ex, ey);
  const rel = { x: land.x - 25, y: land.y - 70 };            // let go above the landing spot
  const A = { x: (h1.x + rel.x) / 2 + 20, y: Math.max(25, Math.min(h1.y, rel.y) - 150) };
  const r1 = Math.hypot(h1.x - A.x, h1.y - A.y), r2 = Math.hypot(rel.x - A.x, rel.y - A.y);
  const th1 = Math.atan2(h1.x - A.x, h1.y - A.y), th2 = Math.atan2(rel.x - A.x, rel.y - A.y);
  const deg = 180 / Math.PI;
  sp.style.transformOrigin = `${HAND_X}px ${HAND_Y}px`;

  // 1. crouch
  sp.classList.add("crouch");
  await tween(220, () => { });
  sp.classList.remove("crouch");
  // 2. THWIP! shoot the zip-rope at the anchor
  Sfx.zip();
  hook.style.left = A.x - 14 + "px"; hook.style.top = A.y - 14 + "px";
  rope.style.display = "block";
  await tween(260, t => {
    rope.setAttribute("x1", h1.x); rope.setAttribute("y1", h1.y);
    rope.setAttribute("x2", h1.x + (A.x - h1.x) * t); rope.setAttribute("y2", h1.y + (A.y - h1.y) * t);
  });
  hook.classList.add("show");
  // 3. swing along the arc
  Sfx.whoosh();
  let n = 0;
  await tween(1150, t0 => {
    const t = ease(t0);
    const th = th1 + (th2 - th1) * t, r = r1 + (r2 - r1) * t;
    const hx = A.x + r * Math.sin(th), hy = A.y + r * Math.cos(th);
    place(hx, hy, -th * deg - 25);
    rope.setAttribute("x1", hx); rope.setAttribute("y1", hy);
    rope.setAttribute("x2", A.x); rope.setAttribute("y2", A.y);
    if (n++ % 3 === 0) trail(map, hx - 20, hy + 20);
  });
  // 4. let go + somersault onto the roof
  rope.style.display = "none"; hook.classList.remove("show");
  const startRot = -th2 * deg - 25;
  await tween(520, t => {
    const hx = rel.x + (land.x - rel.x) * t;
    const hy = rel.y + (land.y - rel.y) * t - Math.sin(Math.PI * t) * 40;
    place(hx, hy, startRot + (360 - startRot) * ease(t));
  });
  place(land.x, land.y, 0);
  sp.style.transform = "";
  // 5. superhero landing
  sp.classList.add("land");
  Sfx.ding();
  const dust = document.createElement("div");
  dust.className = "dust"; dust.textContent = "💨  💨";
  dust.style.left = ex - 18 + "px"; dust.style.bottom = ey + "px";
  map.appendChild(dust); setTimeout(() => dust.remove(), 800);
  await tween(450, () => { });
  sp.classList.remove("land");
}

function trail(map, x, y) {
  const s = document.createElement("div");
  s.className = "trail"; s.textContent = "✦";
  s.style.left = x + "px"; s.style.top = y + "px";
  map.appendChild(s); setTimeout(() => s.remove(), 600);
}
