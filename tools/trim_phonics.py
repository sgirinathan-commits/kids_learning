"""Trim silence, normalise loudness and add tiny fades to phonics clips.
Usage: python trim_phonics.py <raw_dir> <out_dir>
Prints a report: name, duration (ms), peak level - so silent/garbled clips stand out.
"""
import array, os, sys, wave

raw_dir, out_dir = sys.argv[1], sys.argv[2]
os.makedirs(out_dir, exist_ok=True)
for fn in sorted(os.listdir(raw_dir)):
    if not fn.endswith(".wav"):
        continue
    with wave.open(os.path.join(raw_dir, fn)) as w:
        p = w.getparams()
        data = array.array("h", w.readframes(p.nframes))
    if p.nchannels != 1 or p.sampwidth != 2:
        print("skip (format)", fn); continue
    sr = p.framerate
    peak = max((abs(x) for x in data), default=0)
    thr = max(250, peak * 0.03)
    idx = [i for i, x in enumerate(data) if abs(x) > thr]
    if not idx:
        print(f"{fn:14s} SILENT"); continue
    pad = int(sr * 0.015)
    a, b = max(0, idx[0] - pad), min(len(data), idx[-1] + pad)
    clip = data[a:b]
    gain = 29000 / max(1, max(abs(x) for x in clip))
    fade = min(int(sr * 0.012), len(clip) // 4)
    out = array.array("h")
    n = len(clip)
    for i, x in enumerate(clip):
        f = 1.0
        if i < fade: f = i / fade
        elif i > n - fade: f = (n - i) / fade
        out.append(int(max(-32767, min(32767, x * gain * f))))
    with wave.open(os.path.join(out_dir, fn), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr)
        w.writeframes(out.tobytes())
    print(f"{fn:14s} {1000 * n / sr:6.0f} ms   raw peak {peak:5d}   gain x{gain:4.1f}")
