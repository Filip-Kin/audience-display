<script lang="ts">
	import { fade, fly } from "svelte/transition";
	import { state, eventDisplayName } from "@lib/state";
	import { settings } from "@lib/settings";
	import { createEventDispatcher } from "svelte";
	import { matchName } from "@lib/matchNamer";
	import Logo from "@lib/components/Logo.svelte";
	import Shutter from "@lib/components/Shutter.svelte";
	import MatchEventHeader from "@lib/components/MatchEventHeader.svelte";

	let ready = false;
	const dispatcher = createEventDispatcher();
	export let exit = false;

	$: eventLabel = $eventDisplayName;
	$: matchLabel = $state.match
		? matchName($state.match.details.matchNumber, $state.eventDetails?.matchCount ?? 0, $state.match.details.matchType) ?? ""
		: "";
</script>

<Shutter
	{exit}
	leftColor={$settings.invert ? "var(--primary)" : "var(--secondary)"}
	rightColor={$settings.invert ? "var(--secondary)" : "var(--primary)"}
	on:ready={() => { ready = true; }}
	on:transitioned={() => dispatcher("transitioned")}
/>

<div class="fixed flex flex-col w-full h-full justify-around" style="z-index: 10;">
	<div class="w-full flex flex-row justify-around py-16">
		{#if $state.match}
			{#if ready}
				<div in:fly={{ y: -50, duration: 100 }} out:fade={{ duration: 100 }}>
					<MatchEventHeader {eventLabel} {matchLabel} />
				</div>
			{/if}
		{/if}
	</div>

	{#if ready}
		<div class="w-full flex justify-center" in:fly={{ y: -400, duration: 200 }} out:fly={{ y: 100, duration: 300 }}>
			<div class:glint-wrapper={$state.screen === "scores-ready"}>
				<Logo alt="Logo" style="width: 480px; height: 480px; display: block;" class="mx-auto {$state.screen === 'scores-ready' ? 'glint-image' : ''}" />
			</div>
		</div>
	{/if}
</div>
