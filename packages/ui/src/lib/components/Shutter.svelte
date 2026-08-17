<script lang="ts">
	import { spring } from "svelte/motion";
	import { createEventDispatcher, onMount } from "svelte";

	export let exit = false;
	export let startOpen = true;
	export let leftColor = "var(--secondary)";
	export let rightColor = "var(--primary)";

	const dispatcher = createEventDispatcher();
	const shutterSpring = spring(120, { stiffness: 0.1, damping: 0.5 });

	let opened = false;
	let mounted = false;

	function doOpen() {
		if (opened) return;
		opened = true;
		shutterSpring.set(50);
		const unsub = shutterSpring.subscribe((v) => {
			if (v < 51) { dispatcher("ready"); unsub(); }
		});
	}

	onMount(() => {
		mounted = true;
		if (startOpen) doOpen();
	});

	// Only react after mount — prevents premature spring.set during initialization
	$: if (mounted && startOpen) doOpen();

	$: if (exit) {
		shutterSpring.set(120);
		setTimeout(() => dispatcher("transitioned"), 500);
	}
</script>

<!-- Offsets are `%` (of the scaled #app canvas, which is the containing block for
     these fixed elements), NOT `vw`: at a non-1080p display `vw` is the real
     viewport and the diagonal seam drifts off-centre. `%` tracks the 1920x1080
     canvas so the seam is centred at any resolution. -->
<div
	class="w-full h-full fixed -skew-x-12 flex flex-row justify-end"
	style="background: {leftColor}; right: {$shutterSpring}%;"
></div>
<div
	class="w-full h-full fixed -skew-x-12 flex flex-row justify-start"
	style="background: {rightColor}; left: {$shutterSpring}%;"
></div>
