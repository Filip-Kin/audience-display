import { Howl } from "howler";
import { writable } from "svelte/store";

/**
 * True once the browser will allow audio playback: either autoplay was already
 * permitted on load, or the user pressed "Enable Audio" (a user gesture). The
 * score-reveal video waits on this so it plays WITH sound instead of freezing
 * (autoplay blocked) or starting muted before the user unlocks.
 */
export const audioUnlocked = writable(false);

import abort_wav from "../assets/audio/abort.wav";
import matchEnd_wav from "../assets/audio/end.wav";
import matchStart_wav from "../assets/audio/start.wav";
import endgameWarning_wav from "../assets/audio/warning.wav";
import teleopStart_wav from "../assets/audio/resume.wav";
import ready_wav from "../assets/audio/ready.wav";
import pickClock_wav from "../assets/audio/pick_clock.wav";
import pickClockExpired_wav from "../assets/audio/pick_clock_expired.wav";
// Real FMS "Powerup" sound (PowerUp_LinearPop.wav), played entering shifts 1-4.
import shiftChange_wav from "../assets/audio/shift_change.wav";

/** One entry per distinct sound file: drives both playback and the volume sliders. */
export const SOUND_DEFS = [
	{ key: "matchStart", label: "Match Start", src: matchStart_wav },
	{ key: "teleopStart", label: "Teleop Start", src: teleopStart_wav },
	{ key: "shiftChange", label: "Shift Change", src: shiftChange_wav },
	{ key: "endgameWarning", label: "Endgame Warning", src: endgameWarning_wav },
	{ key: "matchEnd", label: "Match End", src: matchEnd_wav },
	{ key: "matchAbort", label: "Match Abort", src: abort_wav },
	{ key: "matchReady", label: "Match Ready", src: ready_wav },
	{ key: "pickClock", label: "Pick Clock", src: pickClock_wav },
	{ key: "pickClockExpired", label: "Pick Clock Expired", src: pickClockExpired_wav },
] as const;

export type VolumeKey = (typeof SOUND_DEFS)[number]["key"] | "victoryVideo";
export type Volumes = Record<VolumeKey, number>;

const VOLUME_STORAGE_KEY = "ad-volumes";

const defaultVolumes = (): Volumes => ({
	matchStart: 1,
	teleopStart: 1,
	shiftChange: 1,
	endgameWarning: 1,
	matchEnd: 1,
	// The abort foghorn shipped at half volume before sliders existed.
	matchAbort: 0.5,
	matchReady: 1,
	pickClock: 1,
	pickClockExpired: 1,
	victoryVideo: 1,
});

function loadVolumes(): Volumes {
	const base = defaultVolumes();
	if (typeof window === "undefined") return base;
	try {
		const raw = window.localStorage.getItem(VOLUME_STORAGE_KEY);
		if (!raw) return base;
		const saved = JSON.parse(raw) as Partial<Record<VolumeKey, number>>;
		for (const key of Object.keys(base) as VolumeKey[]) {
			const v = saved[key];
			if (typeof v === "number" && v >= 0 && v <= 1) base[key] = v;
		}
	} catch {
		// Corrupt storage; fall back to defaults.
	}
	return base;
}

/**
 * Per-sound volume (0..1), persisted in localStorage per display machine.
 * `victoryVideo` is consumed by the score-reveal screens for the winner
 * animation's audio track.
 */
export const volumes = writable<Volumes>(loadVolumes());

// Howler directly (not svelte-sound's wrapper): Howl queues play() calls made
// before the file finishes loading, so the first press always sounds, and
// volume can be set per-play without recreating anything.
const players = new Map<string, Howl>(
	SOUND_DEFS.map((d) => [d.key, new Howl({ src: [d.src] })])
);

let currentVolumes: Volumes = defaultVolumes();
volumes.subscribe((v) => {
	currentVolumes = v;
	if (typeof window !== "undefined") {
		try {
			window.localStorage.setItem(VOLUME_STORAGE_KEY, JSON.stringify(v));
		} catch {
			// Storage full/blocked; volumes just won't persist.
		}
	}
});

/** Which sound file each server-announced event plays. */
const EVENT_SOUNDS: Record<string, (typeof SOUND_DEFS)[number]["key"]> = {
	matchStart: "matchStart",
	autoEnd: "matchEnd",
	endgameWarning: "endgameWarning",
	matchEnd: "matchEnd",
	teleopStart: "teleopStart",
	matchAbort: "matchAbort",
	matchReady: "matchReady",
	timeoutWarning: "endgameWarning",
	timeoutEnd: "matchEnd",
	pickClock: "pickClock",
	pickClockExpired: "pickClockExpired",
	shiftChange: "shiftChange",
};

export const playSound = (sound: string) => {
	const key = EVENT_SOUNDS[sound];
	if (!key) return;
	const volume = currentVolumes[key];
	if (volume <= 0) return;
	const player = players.get(key);
	if (!player) return;
	player.volume(volume);
	player.play();
};
