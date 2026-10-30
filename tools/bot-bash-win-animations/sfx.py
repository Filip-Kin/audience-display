"""Synthesised sound for the Bot Bash win clips (7.5 s, 48 kHz stereo):
wind, a thunder crack, a slime squelch under the flood, then a low organ
stinger that resolves to major as the letters rise."""
import sys
import wave
import numpy as np

SR = 48000
T = 7.5
N = int(SR * T)
t = np.arange(N) / SR
rng = np.random.default_rng(7)


def lowpass(x, a):
    out = np.zeros_like(x)
    y = 0.0
    for i, v in enumerate(x):
        y += a * (v - y)
        out[i] = y
    return out


def env(start, attack, decay):
    d = t - start
    return np.where(d < 0, 0, np.minimum(d / attack, 1) * np.exp(-np.maximum(d - attack, 0) / decay))


def organ(freq, start, length):
    v = sum(np.sin(2 * np.pi * freq * m * t + 3 * np.sin(2 * np.pi * 5.5 * t) * 0.02) / m for m in (1, 2, 3, 4))
    gate = np.clip((t - start) / 0.05, 0, 1) * np.clip((start + length - t) / 1.2, 0, 1)
    return v * gate


noise = rng.normal(0, 1, N)
wind = lowpass(noise, 0.012) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.31 * t)) * np.clip((3.2 - t) / 0.6, 0, 1) * 1.6
thunder = lowpass(noise, 0.05) * env(1.75, 0.01, 0.75) * 3.2 + lowpass(rng.normal(0, 1, N), 0.3) * env(1.75, 0.002, 0.07) * 1.2
gloop_f = 120 + 170 * np.abs(np.sin(2 * np.pi * 3.6 * t))
squelch = np.sin(2 * np.pi * np.cumsum(gloop_f) / SR) * np.where((t > 2.1) & (t < 3.3), 0.3, 0) * np.clip((3.3 - t) / 0.5, 0, 1)
sub = np.sin(2 * np.pi * 46 * t) * env(3.1, 0.01, 0.6) * 0.9
minor = sum(organ(f, 3.1, 0.75) for f in (110.0, 130.81, 164.81, 220.0)) * 0.11
major = sum(organ(f, 3.85, 3.6) for f in (110.0, 138.59, 164.81, 220.0, 277.18)) * 0.11
chime = sum(np.sin(2 * np.pi * f * t) * env(s, 0.004, 0.7) for f, s in ((880, 3.85), (1108.7, 4.0), (1318.5, 4.15), (1760, 4.3))) * 0.09

mix = wind + thunder + squelch + sub + minor + major + chime
mix = np.tanh(mix / np.max(np.abs(mix)) * 1.6)  # soft limit, for about -16 LUFS
mix *= 10 ** (-4.0 / 20) / np.max(np.abs(mix))
fade = np.clip((T - t) / 0.25, 0, 1)
pan = np.stack([mix * fade, np.roll(mix, 90) * fade], 1)
with wave.open(sys.argv[1], "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((pan * 32767).astype("<i2").tobytes())
