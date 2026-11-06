/* ============================================================
   Speech engine: text-to-speech, phonics sounds, speech
   recognition and answer evaluation.
   ============================================================ */
const Speech = (() => {
  const synth = window.speechSynthesis;
  const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
  let voice = null;
  let rate = 0.95;
  let pitch = 1.55;          // raised pitch makes an adult voice sound like a kid
  let childVoice = false;    // true when a real child voice (Edge "Ana") is in use
  let activeRec = null;

  function setVoice(v) { voice = v; childVoice = !!v && /\bAna\b/i.test(v.name); }
  function pickVoice(preferredURI) {
    const voices = synth ? synth.getVoices() : [];
    if (!voices.length) return;
    if (preferredURI) {
      const v = voices.find(v => v.voiceURI === preferredURI);
      if (v) return setVoice(v);
    }
    const en = voices.filter(v => /^en(-|_)/i.test(v.lang));
    // child voice first (Microsoft Edge: "Microsoft Ana Online (Natural)"), then bright US female voices
    const prefs = [/\bAna\b.*natural/i, /\bAna\b/i, /jenny.*natural/i, /aria.*natural/i, /google us english/i,
      /samantha/i, /zira/i, /jenny/i, /aria/i, /female/i];
    for (const p of prefs) {
      const v = en.find(v => p.test(v.name) && /en-US/i.test(v.lang)) || en.find(v => p.test(v.name));
      if (v) return setVoice(v);
    }
    setVoice(en.find(v => /en-US/i.test(v.lang)) || en[0] || voices[0]);
  }

  function init(settings = {}) {
    rate = settings.rate || 0.95;
    pitch = settings.pitch || 1.55;
    if (!Object.keys(clips).length) preloadSounds();
    if (!synth) return;
    pickVoice(settings.voiceURI);
    synth.onvoiceschanged = () => pickVoice(settings.voiceURI);
  }

  function listVoices() {
    return synth ? synth.getVoices().filter(v => /^en/i.test(v.lang)) : [];
  }

  /** Speak text. Resolves when finished (with a safety timeout). */
  function say(text, opts = {}) {
    return new Promise(resolve => {
      if (!synth || !text) return resolve();
      if (opts.interrupt !== false) { synth.cancel(); stopClip(); }
      const u = new SpeechSynthesisUtterance(text);
      if (voice) u.voice = voice;
      u.lang = voice ? voice.lang : "en-US";
      u.rate = opts.rate || rate;
      // a real child voice needs only a small lift; adult voices get the full "kid" pitch
      const p = opts.pitch || pitch;
      u.pitch = Math.max(0.1, Math.min(2, childVoice ? 1 + (p - 1) * 0.3 : p));
      let done = false;
      const finish = () => { if (!done) { done = true; resolve(); } };
      u.onend = finish;
      u.onerror = finish;
      // Chrome sometimes never fires onend – guard with an estimate
      setTimeout(finish, 1200 + text.length * 110 / (u.rate || 1));
      synth.speak(u);
    });
  }

  /* ---- real phoneme clips (audio/phonics/*.wav, generated from IPA by tools/make-phonics.ps1) ---- */
  let actx = null, current = null;
  const clips = {};
  const clipName = key => /^[AEIOU]$/.test(key) ? key.toLowerCase() + "_long" : key;
  function audioCtx() { if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)(); return actx; }
  function preloadSounds() {
    const names = new Set(Object.keys(SOUNDS).filter(k => SOUNDS[k] !== "").map(clipName));
    names.forEach(n => {
      clips[n] = fetch(`audio/phonics/${n}.wav`)
        .then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
        .then(b => audioCtx().decodeAudioData(b))
        .catch(() => null);
    });
  }
  function stopClip() { if (current) { try { current.stop(); } catch (e) { } current = null; } }

  /** Play a single phonics sound, e.g. "sh" -> /ʃ/. Falls back to the voice if a clip is missing. */
  async function sound(key) {
    if (SOUNDS[key] === undefined || SOUNDS[key] === "") return;
    const buf = await (clips[clipName(key)] || Promise.resolve(null));
    if (!buf) return say(SOUNDS[key], { rate: 0.75, pitch: 1.2 });
    if (synth) synth.cancel();
    stopClip();
    const a = audioCtx();
    if (a.state === "suspended") await a.resume();
    return new Promise(resolve => {
      const src = a.createBufferSource();
      src.buffer = buf; src.connect(a.destination);
      src.onended = () => { if (current === src) current = null; resolve(); };
      current = src;
      src.start();
      setTimeout(resolve, buf.duration * 1000 + 300);
    });
  }

  function stop() {
    stopClip();
    if (synth) synth.cancel();
    if (activeRec) { try { activeRec.abort(); } catch (e) { } activeRec = null; }
  }

  const canListen = !!Rec;

  /**
   * Listen to the child once.
   * Resolves { alts: [lower-case transcripts], error }
   */
  function listen({ maxMs = 7000, onStart } = {}) {
    return new Promise(resolve => {
      if (!Rec) return resolve({ alts: [], error: "unsupported" });
      if (synth) synth.cancel();
      const rec = new Rec();
      activeRec = rec;
      rec.lang = "en-US";
      rec.interimResults = false;
      rec.maxAlternatives = 6;
      rec.continuous = false;
      let alts = [];
      let error = null;
      let settled = false;
      const end = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        activeRec = null;
        resolve({ alts, error });
      };
      rec.onstart = () => onStart && onStart();
      rec.onresult = e => {
        const res = e.results[0];
        for (let i = 0; i < res.length; i++) alts.push(res[i].transcript.toLowerCase().trim());
      };
      rec.onerror = e => { error = e.error; };
      rec.onend = end;
      const timer = setTimeout(() => { try { rec.stop(); } catch (e) { } setTimeout(end, 800); }, maxMs);
      try { rec.start(); } catch (e) { error = "start-failed"; end(); }
    });
  }

  /* ---------------- evaluation helpers ---------------- */
  const NUMS = { "0": "zero", "1": "one", "2": "two", "3": "three", "4": "four", "5": "five",
    "6": "six", "7": "seven", "8": "eight", "9": "nine", "10": "ten" };

  function normalize(s) {
    return (s || "").toLowerCase().replace(/[^a-z0-9' ]/g, " ")
      .split(/\s+/).filter(Boolean).map(w => NUMS[w] || w);
  }

  function lev(a, b) {
    const m = a.length, n = b.length;
    const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
    for (let j = 1; j <= n; j++) d[0][j] = j;
    for (let i = 1; i <= m; i++)
      for (let j = 1; j <= n; j++)
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[m][n];
  }

  /**
   * Score a single word read aloud.
   * 1 = correct, 0.5 = very close, 0 = not yet
   */
  function scoreWord(target, alts) {
    target = target.toLowerCase();
    const ok = new Set([target, target + "s", ...(SOUNDALIKES[target] || [])].map(w => NUMS[w] || w));
    let best = 0, heard = alts[0] || "";
    for (const alt of alts) {
      const words = normalize(alt);
      if (words.some(w => ok.has(w))) return { score: 1, heard: alt };
      for (const w of words) {
        if (w[0] === target[0] && lev(w, target) <= 1 && best < 0.5) { best = 0.5; heard = alt; }
      }
    }
    return { score: best, heard };
  }

  /**
   * Check which keyword groups appear in a spoken sentence.
   * groups: array of arrays of stems. Returns {hits:[bool], words, heard}
   */
  function scoreSentence(groups, alts) {
    let best = { hits: groups.map(() => false), count: 0, words: 0, heard: alts[0] || "" };
    for (const alt of alts) {
      const words = normalize(alt);
      const hits = groups.map(stems => stems.some(st => {
        const s = st.toLowerCase();
        return words.some(w => w.startsWith(s) || (s.length > 3 && lev(w.slice(0, s.length), s) <= 1));
      }));
      const count = hits.filter(Boolean).length;
      if (count > best.count || (count === best.count && words.length > best.words)) {
        best = { hits, count, words: words.length, heard: alt };
      }
    }
    return best;
  }

  /** Remove filler words to pull out the key answer ("um a doggy" -> "doggy"). */
  const FILLER = new Set(["um", "uh", "er", "erm", "hmm", "like", "a", "an", "the", "my", "i", "is", "it's",
    "its", "um", "well", "so", "and", "yeah", "yes", "oh"]);
  function keyAnswer(alt) {
    const w = normalize(alt).filter(x => !FILLER.has(x));
    return w.join(" ");
  }

  const voiceName = () => voice ? voice.name : "";
  /** iPhone/iPad only allow sound after a tap: call this from the first tap. */
  function unlock() {
    try {
      const a = audioCtx();
      if (a.state === "suspended") a.resume();
      const src = a.createBufferSource();
      src.buffer = a.createBuffer(1, 1, 22050); src.connect(a.destination); src.start();
    } catch (e) { }
    try { if (synth) { const u = new SpeechSynthesisUtterance(" "); u.volume = 0; synth.speak(u); } } catch (e) { }
  }
  return { init, say, sound, voiceName, unlock, stop, listen, canListen, listVoices, scoreWord, scoreSentence, keyAnswer, normalize };
})();

/* ---------------- tiny sound-effects synth (no audio files) ---------------- */
const Sfx = (() => {
  let ctx = null;
  function c() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }
  function tone(freq, start, dur, type = "sine", vol = 0.18) {
    const a = c(), o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, a.currentTime + start);
    g.gain.exponentialRampToValueAtTime(vol, a.currentTime + start + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + start + dur);
    o.connect(g).connect(a.destination);
    o.start(a.currentTime + start); o.stop(a.currentTime + start + dur + 0.05);
  }
  return {
    pop() { try { tone(660, 0, 0.12, "triangle"); } catch (e) { } },
    ding() { try { tone(880, 0, 0.2); tone(1320, 0.1, 0.3); } catch (e) { } },
    oops() { try { tone(300, 0, 0.2, "sawtooth", 0.08); tone(220, 0.15, 0.25, "sawtooth", 0.08); } catch (e) { } },
    whoosh() {
      try {
        const a = c(), o = a.createOscillator(), g = a.createGain();
        o.type = "sine"; o.frequency.setValueAtTime(200, a.currentTime);
        o.frequency.exponentialRampToValueAtTime(1200, a.currentTime + 0.5);
        g.gain.setValueAtTime(0.15, a.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + 0.6);
        o.connect(g).connect(a.destination); o.start(); o.stop(a.currentTime + 0.65);
      } catch (e) { }
    },
    zip() {
      try {
        const a = c(), o = a.createOscillator(), g = a.createGain();
        o.type = "square"; o.frequency.setValueAtTime(1800, a.currentTime);
        o.frequency.exponentialRampToValueAtTime(400, a.currentTime + 0.18);
        g.gain.setValueAtTime(0.08, a.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + 0.2);
        o.connect(g).connect(a.destination); o.start(); o.stop(a.currentTime + 0.22);
      } catch (e) { }
    },
    fanfare() { try { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.15, 0.35, "triangle", 0.2)); tone(1047, 0.6, 0.8, "triangle", 0.2); } catch (e) { } }
  };
})();
