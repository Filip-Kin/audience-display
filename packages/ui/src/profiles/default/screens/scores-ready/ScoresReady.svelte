<script lang="ts">
	import { fade, fly } from "svelte/transition";
	import { state, eventDisplayName, activeProfile } from "@lib/state";
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
	$: eventLogo = $activeProfile.assets.event ?? "/logo.png";
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

<div class="fixed flex flex-col w-full h-full justify-around z-10">
	<div class="w-full flex flex-row justify-around py-16">
		{#if $state.match}
			{#if ready && !exit}
				<div in:fly={{ y: -50, duration: 100 }} out:fly={{ y: -400, duration: 400 }}>
					<MatchEventHeader {eventLabel} {matchLabel} />
				</div>
			{/if}
		{/if}
	</div>

	{#if ready && !exit}
		<div class="w-full flex justify-center" in:fly={{ y: 400, duration: 200 }} out:fly={{ y: 700, duration: 400 }}>
			<div class:glint-wrapper={$state.screen === "scores-ready"} style="--glint-mask: url('{eventLogo}');">
				<Logo alt="Logo" class="mx-auto size-[480px] block {$state.screen === 'scores-ready' ? 'glint-image' : ''}" />
			</div>
		</div>
	{/if}
</div>
