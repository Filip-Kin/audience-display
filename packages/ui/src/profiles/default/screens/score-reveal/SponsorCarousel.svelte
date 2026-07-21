<script lang="ts">
	import { activeProfile } from "@lib/state";
	import { resultsSponsors } from "@lib/sponsors";
	import SlideRotator from "@lib/components/SlideRotator.svelte";

	// The livestream partner sits out: it has its dedicated spot on this screen.
	$: sponsors = resultsSponsors($activeProfile.assets);
</script>

{#if sponsors.length}
	<SlideRotator slides={sponsors} intervalMs={3200} let:slide>
		<div class="w-full h-full flex items-center justify-center">
			{#if slide.light}
				<!-- Light logos get a white card so they read on a dark background. -->
				<div class="bg-white rounded-2xl px-8 py-5 flex items-center justify-center">
					<img src={slide.src} class="max-h-[130px] max-w-full object-contain" alt="sponsor" />
				</div>
			{:else}
				<img src={slide.src} class="max-h-full max-w-full object-contain" alt="sponsor" />
			{/if}
		</div>
	</SlideRotator>
{:else}
	<img src="/logo.png" class="h-full mx-auto object-contain" alt="event logo" />
{/if}
