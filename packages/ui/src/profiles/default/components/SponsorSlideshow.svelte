<script lang="ts">
	import { state, activeProfile } from "@lib/state";
	import { onMount, onDestroy } from "svelte";
	import BracketGrid from "../screens/playoff-bracket/BracketGrid.svelte";

	/** Slide rotation period. Kept slow so the loop isn't dizzying on a big screen. */
	export let intervalMs = 8000;
	/** Set false to keep the playoff mini-bracket slide out of the deck. */
	export let includeBracket = true;

	let slideIdx = 0;
	let rotationTimer: ReturnType<typeof setInterval> | null = null;

	$: sponsors = $activeProfile.assets.sponsors;

	// A live mini bracket only makes sense once the event is in playoffs.
	$: inPlayoffs =
		$state.match?.details.matchType === "sf" || $state.match?.details.matchType === "f";
	$: showBracket = includeBracket && inPlayoffs && !!$state.bracket;

	type Slide = { kind: "sponsor"; src?: string } | { kind: "bracket" };

	// Deck built from whatever sponsor art the profile ships, plus one bracket
	// page (mid-deck) during playoffs.
	$: slides = ((): Slide[] => {
		const deck: Slide[] = sponsors.map((src) => ({ kind: "sponsor" as const, src }));
		if (showBracket) deck.splice(Math.min(2, deck.length), 0, { kind: "bracket" });
		if (!deck.length) deck.push({ kind: "sponsor" });
		return deck;
	})();
	$: currentSlide = slideIdx % slides.length;

	onMount(() => {
		rotationTimer = setInterval(() => {
			slideIdx += 1;
		}, intervalMs);
	});

	onDestroy(() => {
		if (rotationTimer) clearInterval(rotationTimer);
	});
</script>

<div class="relative overflow-hidden flex-1 min-h-0 bg-[oklch(0_0_0/0.6)] border-2 border-white">
	{#each slides as slide, i}
		<div
			class="absolute inset-0 transition-opacity duration-500"
			style="
				opacity: {i === currentSlide ? 1 : 0};
				pointer-events: {i === currentSlide ? 'auto' : 'none'};
			"
		>
			{#if slide.kind === "sponsor"}
				<div class="w-full h-full flex items-center justify-center p-8 pb-10">
					{#if slide.src}
						<img
							src={slide.src}
							alt="Sponsor"
							class="object-contain w-[92%] h-[92%]"
						/>
					{:else}
						<div
							class="flex items-center justify-center uppercase w-[92%] h-[92%] bg-[oklch(0.94_0.005_250)] text-[oklch(0.30_0_0)] text-[32px] font-extrabold tracking-[0.08em] border border-dashed border-[oklch(0_0_0/0.25)]"
							style="font-family: var(--font-mono);"
						>
							Event Sponsors
						</div>
					{/if}
				</div>
			{:else if $state.bracket}
				<div class="w-full h-full p-2.5 pb-8">
					<BracketGrid compact bracket={$state.bracket} />
				</div>
			{/if}
		</div>
	{/each}

	<!-- Slide dots (inside the box so it never changes the surrounding layout) -->
	{#if slides.length > 1}
		<div class="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-2 z-10">
			{#each slides as _, i}
				<div
					class="h-2 transition-all duration-300"
					style="
						width: {i === currentSlide ? '32px' : '8px'};
						background: {i === currentSlide ? 'var(--accentWarn)' : 'oklch(1 0 0 / 0.35)'};
					"
				></div>
			{/each}
		</div>
	{/if}
</div>
