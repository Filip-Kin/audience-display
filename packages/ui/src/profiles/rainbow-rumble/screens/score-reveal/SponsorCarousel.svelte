<script lang="ts">
	import { get } from "svelte/store";
	import { activeProfile } from "@lib/state";
	import { resultsSponsors } from "@lib/sponsors";
	import SlideRotator from "@lib/components/SlideRotator.svelte";

	// FUN (the livestream partner) sits out: it has its dedicated spot on this screen.
	$: sponsors = resultsSponsors($activeProfile.assets);

	// A full loop of the deck outlasts a typical results hold, so the tail would
	// rarely be seen if every reveal led with the first sponsor. Pick the opening
	// slide at random — once, at init, since this screen is remounted per match.
	const startIndex = Math.floor(
		Math.random() * Math.max(1, resultsSponsors(get(activeProfile).assets).length),
	);
</script>

<SlideRotator slides={sponsors} intervalMs={3200} {startIndex} let:slide>
	<div class="w-full h-full flex items-center justify-center">
		{#if slide.light}
			<!-- Light logos get a white card so they read on the dark box. -->
			<div class="bg-white rounded-[var(--rr-r-sm)] px-8 py-5 flex items-center justify-center">
				<img src={slide.src} class="max-h-[130px] max-w-full object-contain" alt="sponsor" />
			</div>
		{:else}
			<img src={slide.src} class="max-h-full max-w-full object-contain" alt="sponsor" />
		{/if}
	</div>
</SlideRotator>
