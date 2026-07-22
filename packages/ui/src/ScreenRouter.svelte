<script lang="ts">
	import { onMount, onDestroy } from "svelte";
	import { state, activeProfile, freezeStateData, unfreezeStateData, previousScreen } from "./lib/state";
	import type { Screen } from "lib";
	import SettingsIcon from "./assets/settings.svg";
	import SettingsModal from "./lib/components/SettingsModal.svelte";
	import EnableAudioModal from "./lib/components/EnableAudioModal.svelte";
	import { audioUnlocked } from "./lib/audio";
	import { settings } from "./lib/settings";
	import { resolveScreen } from "./profiles";
	import { coverUrl } from "./lib/animation_pack";

	let transitioning = false;
	let activeScreen: Screen = "none";
	let preScoreReveal = false;
	// Bumped after every exit transition so re-entering the SAME screen id (e.g. a new
	// score-reveal while already on score-reveal) mounts a fresh instance. Without this
	// the exited instance (ready=false, video hidden) is reused and stays blank forever.
	let instanceKey = 0;

	// The screen a scheduled transition is heading to. The store broadcasts on every
	// state change, so the reactive block below re-fires constantly; this guard makes
	// each target screen schedule its timers exactly once.
	let pendingScreen: Screen | null = null;
	let delayTimer: ReturnType<typeof setTimeout> | null = null;
	let completionTimer: ReturnType<typeof setTimeout> | null = null;

	function clearTransitionTimers() {
		if (delayTimer) {
			clearTimeout(delayTimer);
			delayTimer = null;
		}
		if (completionTimer) {
			clearTimeout(completionTimer);
			completionTimer = null;
		}
	}

	function completeTransition() {
		clearTransitionTimers();
		unfreezeStateData();
		previousScreen.set(activeScreen);
		pendingScreen = null;
		transitioning = false;
		activeScreen = $state.screen;
		instanceKey++;
		// A remounted reveal buffers its victory video from scratch; show the cover
		// like a normal entry into score-reveal (cleared by its "loaded" event).
		if (activeScreen === "score-reveal") preScoreReveal = true;
	}

	function beginExit() {
		// The outgoing screen keeps showing the data it had when the exit started;
		// server updates that land mid-animation (a repost's swapped-in results,
		// the next match loading) only apply once the swap completes.
		freezeStateData();
		transitioning = true;
		// Completion fallback: if the exiting screen never dispatches "transitioned",
		// finish the swap anyway so the display can't wedge mid-transition.
		completionTimer = setTimeout(() => {
			if (transitioning) completeTransition();
		}, 1000);
	}

	// When the screen changes, start the exit transition (possibly after a configured
	// delay), then wait for the old screen's "transitioned" event or the fallback
	// timer before swapping in the new screen.
	$: if ($state.screen !== activeScreen && $state.screen !== pendingScreen) {
		console.log("Screen changed to", $state.screen);
		clearTransitionTimers();
		pendingScreen = $state.screen;
		// If we're loading the score-reveal screen set this to true to hide the flicker when loading the animation
		preScoreReveal = $state.screen === "score-reveal";

		if ($state.screen === "scores-ready" && $settings.transitionAfterMatchEnd > -1 && activeScreen.startsWith("match-")) {
			// transitionAfterMatchEnd is a field-privacy feature, not presentation:
			// stock FMS stays on the match video screen until scores post (-1 mode).
			// With it set, the display auto-switches OFF the video N seconds after
			// the match ends so the field camera is hidden while people are on the
			// field between matches; N is just long enough to read the final score.
			// From anywhere else (score-reveal sliding out on a repost, a MatchResult
			// re-show) scores-ready must come up immediately, via the standard branch.
			// Don't transition to scores-ready if the active screen is match-end
			console.log("scores-ready");
			if (activeScreen !== "match-end") {
				console.log("Transitioning to scores-ready");
				// Freeze for the whole hold, not just the exit: a fast post loads
				// the next match DURING the hold, and the still-visible match
				// screen must not repaint its header with it.
				freezeStateData();
				delayTimer = setTimeout(beginExit, $settings.transitionAfterMatchEnd * 1000);
			}
		} else if ($state.screen === "match-end") {
			if ($settings.transitionAfterMatchEnd > -1) {
				console.log("Transitioning to match-end");
				delayTimer = setTimeout(beginExit, $settings.transitionAfterMatchEnd * 1000);
			}
			// Don't transition if the setting is -1
		} else {
			// Standard transition
			console.log("Transitioning to", $state.screen);
			beginExit();
		}
	}

	$: ScreenComponent = resolveScreen($state.activeProfileId, activeScreen);

	let settingsOpen = false;

	let showUnlockPopup = false;
	let audioContext: AudioContext | undefined;

	async function tryPlaySilentAudio(): Promise<boolean> {
		try {
			audioContext = new AudioContext();

			// Create silent oscillator
			const osc = audioContext.createOscillator();
			const gain = audioContext.createGain();
			gain.gain.value = 0.001;

			osc.connect(gain);
			gain.connect(audioContext.destination);

			osc.start();

			if (audioContext.state !== "running") {
				return false;
			}

			return true;
		} catch (err) {
			console.error("AudioContext error", err);
			return false;
		}
	}

	onMount(async () => {
		const success = await tryPlaySilentAudio();
		if (success) {
			audioUnlocked.set(true);
		} else {
			showUnlockPopup = true;
		}
	});

	onDestroy(() => {
		clearTransitionTimers();
	});

	function unlockManually() {
		// audioContext is undefined if construction failed; still mark audio as
		// unlocked so score-reveal isn't permanently gated behind the popup.
		try {
			audioContext?.resume();
		} catch (err) {
			console.error("Failed to resume AudioContext:", err);
		}
		audioUnlocked.set(true);
		showUnlockPopup = false;
	}
</script>

{#if preScoreReveal}
	<div class="fixed w-full h-full">
		<img class="w-full h-full object-contain" src={coverUrl($activeProfile)} alt="" />
	</div>
{/if}

{#if ScreenComponent}
	{#key instanceKey}
		{#if activeScreen === "score-reveal"}
			<svelte:component
				this={ScreenComponent}
				exit={transitioning}
				on:transitioned={completeTransition}
				on:loaded={() => {
					preScoreReveal = false;
				}}
			/>
		{:else}
			<svelte:component
				this={ScreenComponent}
				exit={transitioning}
				on:transitioned={completeTransition}
			/>
		{/if}
	{/key}
{/if}

{#if showUnlockPopup}
	<EnableAudioModal onUnlock={unlockManually} />
{/if}

{#if !$state.connected && $settings.showDisconnectedScreen}
	<div class="absolute top-0 left-0 w-full h-full flex items-center justify-center">
		<h1 class="p-12 text-red-500 font-bold bg-gray-800 text-4xl">Disconnected</h1>
	</div>
{/if}

<button
	class="absolute top-2 right-2 z-50 opacity-0 hover:opacity-75 border-gray-300/75 roudned-full p-1 transition-opacity duration-300 ease-in-out"
	on:click={() => (settingsOpen = !settingsOpen)}
>
	<img src={SettingsIcon} class="size-12" alt="Settings" />
</button>

<SettingsModal bind:settingsOpen />
