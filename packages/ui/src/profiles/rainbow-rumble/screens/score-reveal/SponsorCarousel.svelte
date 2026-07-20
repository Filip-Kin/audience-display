<script lang="ts">
	import { onDestroy, onMount } from "svelte";
	import { RR_SPONSORS } from "../../sponsors";

	// FUN already has its dedicated spot on the results screen.
	const SPONSORS = RR_SPONSORS.filter((s) => !s.omitOnResults);

	// Crossfading slideshow: slides stay absolutely stacked so the box never resizes.
	let index = 0;
	let timer: ReturnType<typeof setInterval> | null = null;

	onMount(() => {
		timer = setInterval(() => {
			index = (index + 1) % SPONSORS.length;
		}, 3200);
	});

	onDestroy(() => {
		if (timer) clearInterval(timer);
	});
</script>

<div class="relative w-full h-full">
	{#each SPONSORS as sponsor, i (sponsor.src)}
		<div
			class="absolute inset-0 flex items-center justify-center transition-opacity duration-[600ms]"
			style="opacity: {i === index ? 1 : 0};"
		>
			{#if sponsor.light}
				<!-- Light logos get a white card so they read on the dark box. -->
				<div class="bg-white rounded-[var(--rr-r-sm)] px-8 py-5 flex items-center justify-center">
					<img src={sponsor.src} class="max-h-[130px] max-w-full object-contain" alt="sponsor" />
				</div>
			{:else}
				<img src={sponsor.src} class="max-h-full max-w-full object-contain" alt="sponsor" />
			{/if}
		</div>
	{/each}
</div>
