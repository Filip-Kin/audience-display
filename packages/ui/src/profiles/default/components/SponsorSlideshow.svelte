<script lang="ts">
	import { state, activeProfile } from "@lib/state";
	import { sponsorDeck, type SponsorSlide } from "@lib/sponsors";
	import SlideRotator from "@lib/components/SlideRotator.svelte";
	import BracketGrid from "../screens/playoff-bracket/BracketGrid.svelte";

	/** Slide rotation period. Kept slow so the loop isn't dizzying on a big screen. */
	export let intervalMs = 12000;
	/** Set false to keep the playoff mini-bracket slide out of the deck. */
	export let includeBracket = true;

	// A live mini bracket only makes sense once the event is in playoffs.
	$: inPlayoffs =
		$state.match?.details.matchType === "sf" || $state.match?.details.matchType === "f";
	$: showBracket = includeBracket && inPlayoffs && !!$state.bracket;

	// Deck built from whatever sponsor art the profile ships, plus one bracket
	// page (mid-deck) during playoffs. A sponsor-less profile still gets one
	// placeholder slide so the box is never empty.
	$: slides = ((): SponsorSlide[] => {
		const deck = sponsorDeck($activeProfile.assets.sponsors, showBracket);
		if (!deck.length) deck.push({ kind: "sponsor" });
		return deck;
	})();
</script>

<div class="overflow-hidden flex-1 min-h-0 bg-[oklch(0_0_0/0.6)] border-2 border-white">
	<SlideRotator {slides} {intervalMs} fadeMs={500} showDots let:slide>
		{#if slide.kind === "sponsor"}
			<div class="w-full h-full flex items-center justify-center p-8 pb-10">
				{#if slide.sponsor}
					<img
						src={slide.sponsor.src}
						alt="Sponsor"
						class="object-contain {slide.sponsor.light
							? 'max-w-[80%] max-h-[80%] bg-white rounded-2xl p-6'
							: 'w-[92%] h-[92%]'}"
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
	</SlideRotator>
</div>
