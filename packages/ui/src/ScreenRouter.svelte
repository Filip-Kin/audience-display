<script lang="ts">
	import { onMount } from "svelte";
	import { state, activeProfile } from "./lib/state";
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

	function completeTransition() {
		transitioning = false;
		activeScreen = $state.screen;
		instanceKey++;
		// A remounted reveal buffers its victory video from scratch; show the cover
		// like a normal entry into score-reveal (cleared by its "loaded" event).
		if (activeScreen === "score-reveal") preScoreReveal = true;
	}

	// When the screen changes, set transitioning to true,
	// then wait for the transition to finish before setting
	// transitioning to false and updating the active screen.
	$: if ($state.screen !== activeScreen) {
		console.log("Screen changed to", $state.screen);
		// If we're loading the score-reveal screen set this to true to hide the flicker when loading the animation
		if ($state.screen === "score-reveal") {
			preScoreReveal = true;
		} else {
			preScoreReveal = false;
		}

		if ($state.screen === "scores-ready" && $settings.transitionAfterMatchEnd > -1) {
			// Don't transition to scores-ready if the active screen is match-end
			console.log("scores-ready");
			if (activeScreen !== "match-end") {
				console.log("Transitioning to scores-ready");
				setTimeout(() => {
					transitioning = true;
				}, $settings.transitionAfterMatchEnd * 1000);
			}
		} else {
			// If the screen is match-end, wait 8 seconds before transitioning
			if ($state.screen === "match-end") {
				if ($settings.transitionAfterMatchEnd > -1) {
					console.log("Transitioning to match-end");
					setTimeout(() => {
						transitioning = true;
						activeScreen = $state.screen;
					}, $settings.transitionAfterMatchEnd * 1000);
					setTimeout(() => {
						if (transitioning) {
							transitioning = false;
							activeScreen = $state.screen;
						}
					}, 1000);
				} else {
					// Don't transition if the setting is -1
				}
			} else {
				// Standard transition
				transitioning = true;
				console.log("Standard transition");
				console.log("Transitioning to ", $state.screen);
				setTimeout(() => {
					if (transitioning) completeTransition();
				}, 1000);
			}
		}
	}

	$: ScreenComponent = resolveScreen($state.activeProfileId, activeScreen);

	let settingsOpen = false;

	let showUnlockPopup = false;
	let audioContext: AudioContext;

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

	function unlockManually() {
		audioContext.resume();
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
