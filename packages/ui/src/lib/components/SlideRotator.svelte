<script lang="ts" generics="T">
	import { onDestroy, onMount } from "svelte";

	/** Slides to cycle through; each is rendered through the default slot. */
	export let slides: T[];
	export let intervalMs = 4800;
	/** Crossfade duration. */
	export let fadeMs = 600;
	export let showDots = false;
	/** Active-dot fill (a color or gradient). */
	export let dotAccent = "var(--accentWarn)";

	let index = 0;
	let timer: ReturnType<typeof setInterval> | null = null;

	$: current = slides.length ? index % slides.length : 0;

	onMount(() => {
		timer = setInterval(() => {
			index += 1;
		}, intervalMs);
	});

	onDestroy(() => {
		if (timer) clearInterval(timer);
	});
</script>

<!-- Slides stay absolutely stacked so the box never resizes between logos. -->
<div class="relative w-full h-full">
	{#each slides as slide, i}
		<div
			class="absolute inset-0 transition-opacity"
			style="
				transition-duration: {fadeMs}ms;
				opacity: {i === current ? 1 : 0};
				pointer-events: {i === current ? 'auto' : 'none'};
			"
		>
			<slot {slide} />
		</div>
	{/each}

	<!-- Slide dots (inside the box so they never change the surrounding layout) -->
	{#if showDots && slides.length > 1}
		<div class="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
			{#each slides as _, i}
				<div
					class="h-2 rounded transition-all duration-300"
					style="
						width: {i === current ? '32px' : '8px'};
						background: {i === current ? dotAccent : 'oklch(1 0 0 / 0.35)'};
					"
				></div>
			{/each}
		</div>
	{/if}
</div>
