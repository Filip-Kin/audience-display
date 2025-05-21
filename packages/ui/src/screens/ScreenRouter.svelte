<script lang="ts">
	import { type ComponentType } from "svelte";
	import { state } from "../lib/state";
	import type { Screen } from "lib";
	import MatchPreview from "./match-preview/MatchPreview.svelte";
	import MatchReady from "./match-ready/MatchReady.svelte";
	import SettingsIcon from "../assets/settings.svg";
	import SettingsModal from "../lib/SettingsModal.svelte";

	let transitioning = false;
	let activeScreen: Screen = "none";

	// When the screen changes, set transitioning to true,
	// then wait for the transition to finish before setting
	// transitioning to false and updating the active screen.
	$: if ($state.screen !== activeScreen) {
		transitioning = true;
		console.log("Transitioning");
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
		"scores-ready": null,
		"score-reveal": null,
	};

	let settingsOpen = false;
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

<button
	class="absolute top-2 right-2 opacity-0 hover:opacity-75 border-gray-300/75 roudned-full p-1 transition-opacity duration-300 ease-in-out"
	on:click={() => (settingsOpen = !settingsOpen)}
>
	<img src={SettingsIcon} class="size-12" alt="Settings" />
</button>

<SettingsModal bind:settingsOpen />
