<script lang="ts">
	import { state, eventDisplayName, activeProfile } from "@lib/state";
	import { matchName, matchNameParts } from "@lib/matchNamer";
	import { fade } from "svelte/transition";
	import Logo from "@lib/components/Logo.svelte";

	export let transparent: boolean = false;
	/** When acting as the bottom bar (top-mode), put the accent border on top. */
	export let atBottom: boolean = false;
	/** Whether topBarArt is up. The owner fades it with the rest of the screen. */
	export let showArt: boolean = true;

	$: between = $activeProfile.options?.topBarBetween;
	$: art = $activeProfile.options?.topBarArt;
	$: details = $state.match?.details;
	$: matchCount = $state.eventDetails?.matchCount ?? 0;
	$: eventName = $eventDisplayName;
	$: matchLabel = details
		? matchName(details.matchNumber, matchCount, details.matchType) ?? ""
		: "";
	$: matchParts = details ? matchNameParts(details.matchNumber, matchCount, details.matchType) : [];
</script>

{#if between}
	<header
		class="absolute {atBottom ? 'bottom-0 border-t-2 rounded-t-[var(--radius)]' : 'top-0 border-b-2 rounded-b-[var(--radius)]'} border-scorebarAccent bg-background grid items-center gap-3 px-3 h-[76px] grid-cols-[auto_1fr_auto]"
		style="left: {between[0]}px; width: {between[1] - between[0]}px;"
	>
		<Logo class="object-contain size-14" />
		<div class="display text-matchLabel text-center whitespace-nowrap leading-[1.08] {matchParts.length > 1 ? 'text-[26px]' : 'text-[34px]'}">
			{#each matchParts as part}
				<div>{part}</div>
			{/each}
		</div>
		<img src="/pitpodcast.png" alt="Pit Podcast" class="object-contain max-h-[50px]" />
		{#if art && showArt}
			<img
				src={art}
				alt=""
				class="absolute left-3 right-3 w-[calc(100%-24px)] {atBottom ? 'bottom-full mb-2' : 'top-full mt-2'}"
				transition:fade={{ duration: 200 }}
			/>
		{/if}
	</header>
{:else}
<header
	class="absolute top-0 left-0 right-0 grid items-center px-6 gap-6 {atBottom ? 'border-t-2' : 'border-b-2'} border-scorebarAccent h-[70px] grid-cols-[1fr_auto_1fr] {transparent ? 'bg-transparent' : 'bg-[oklch(0_0_0/0.55)]'}"
>
	<div class="flex items-center gap-3 justify-start">
		<Logo class="object-contain size-12" />
		<div class="display uppercase text-text text-[22px] leading-none tracking-[0.02em]">
			{eventName}
		</div>
	</div>

	<div class="display text-matchLabel whitespace-nowrap text-[36px] leading-none px-6 tracking-[0.02em]">
		{matchLabel}
	</div>

	<div class="flex items-center justify-end">
		<img
			src="/pitpodcast.png"
			alt="Pit Podcast"
			class="object-contain max-h-[50px]"
		/>
	</div>
</header>
{/if}
