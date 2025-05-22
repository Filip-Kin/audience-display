<script lang="ts">
	import { onMount, type ComponentType } from "svelte";
	import { state } from "../lib/state";
	import type { Screen } from "lib";
	import MatchPreview from "./match-preview/MatchPreview.svelte";
	import MatchReady from "./match-ready/MatchReady.svelte";
	import SettingsIcon from "../assets/settings.svg";
	import SettingsModal from "../lib/SettingsModal.svelte";
	import EnableAudioModal from "../lib/EnableAudioModal.svelte";
	import ScoresReady from "./scores-ready/ScoresReady.svelte";
	import ScoresReveal from "./score-reveal/ScoresReveal.svelte";
	import AllianceSelection from "./alliance-selection/AllianceSelection.svelte";

	let transitioning = false;
	let activeScreen: Screen = "none";

	// When the screen changes, set transitioning to true,
	// then wait for the transition to finish before setting
	// transitioning to false and updating the active screen.
	$: if ($state.screen !== activeScreen) {
		transitioning = true;
		console.log("Transitioning to ", $state.screen);
		setTimeout(() => {
			if (transitioning) {
				transitioning = false;
				activeScreen = $state.screen;
			}
		}, 1000);
	}

	const screens: { [key in Screen]: ComponentType | null } = {
		none: null,
		"match-preview": MatchPreview,
		"match-ready": MatchReady,
		"match-auton": null,
		"match-transition": null,
		"match-teleop": null,
		"match-endgame": null,
		"match-end": null,
		"scores-ready": ScoresReady,
		"score-reveal": ScoresReveal,
		"alliance-selection": AllianceSelection,
		"alliance-selection-fullscreen": AllianceSelection,
	};

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
		if (!success) {
			showUnlockPopup = true;
		}
	});

	function unlockManually() {
		audioContext.resume();
		showUnlockPopup = false;
	}
</script>

{#if activeScreen in screens}
	{#if screens[activeScreen] !== null}
		<svelte:component
			this={screens[activeScreen]}
			exit={transitioning}
			on:transitioned={() => {
				transitioning = false;
				activeScreen = $state.screen;
			}}
		/>
	{/if}
{/if}

{#if showUnlockPopup}
	<EnableAudioModal onUnlock={unlockManually} />
{/if}

<button
	class="absolute top-2 right-2 z-50 opacity-0 hover:opacity-75 border-gray-300/75 roudned-full p-1 transition-opacity duration-300 ease-in-out"
	on:click={() => (settingsOpen = !settingsOpen)}
>
	<img src={SettingsIcon} class="size-12" alt="Settings" />
</button>

<SettingsModal bind:settingsOpen />
