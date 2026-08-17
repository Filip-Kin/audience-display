<script lang="ts">
	import { onMount } from "svelte";

	export let eventLabel: string = "";
	export let matchLabel: string = "";
	/** Match-name font size; defaults to the standard header size. */
	export let matchLabelSize: string = "46px";
	/** Cap the match-name width so long names (playoff bracket labels) wrap to a
	 *  balanced two lines instead of running wide under the reveal's corner
	 *  sponsor boxes. Empty = grow with content (default, unchanged). */
	export let matchLabelMaxWidth: string = "";
	/** Stretch the box to fill its container (so it can share a flex column with
	 *  another element, e.g. the results score box). The name wraps inside the
	 *  full width; no measuring/hugging. Ignores matchLabelMaxWidth. */
	export let fullWidth: boolean = false;

	let rootEl: HTMLElement;
	let labelEl: HTMLElement;

	// CSS `fit-content` clamps a wrapped element to its max-width, NOT to the actual
	// longest line, so the black box ends up much wider than the wrapped text. So
	// measure the real longest line and set the width to it, and hug the box.
	// (Only for the max-width mode; fullWidth just fills its container.)
	//
	// This runs SYNCHRONOUSLY (no await) inside onMount / the reactive block, which
	// complete BEFORE the browser paints, and the box starts `visibility:hidden`
	// until it's sized - so the box is never painted at the wrong (wide) width and
	// then visibly resized (the flash we fixed for the team-name cards). getClientRects
	// is in post-transform px (the app is scaled), so divide by the measured scale.
	function fitBox(): void {
		if (!labelEl || !rootEl || !matchLabelMaxWidth) return;
		labelEl.style.width = ""; // reset so it wraps at max-width for measuring
		const scale = labelEl.offsetWidth
			? labelEl.getBoundingClientRect().width / labelEl.offsetWidth
			: 1;
		const range = document.createRange();
		range.selectNodeContents(labelEl);
		let max = 0;
		for (const r of range.getClientRects()) max = Math.max(max, r.width);
		if (max > 0 && scale > 0) labelEl.style.width = `${Math.ceil(max / scale)}px`;
		rootEl.style.visibility = "visible";
	}

	// Re-fit before paint whenever the label/cap changes, and once the display web
	// font loads (its metrics change line widths).
	$: void matchLabel, void matchLabelMaxWidth, labelEl && fitBox();
	onMount(() => {
		fitBox();
		if (typeof document !== "undefined" && document.fonts)
			document.fonts.ready.then(fitBox).catch(() => {});
	});
</script>

<div
	bind:this={rootEl}
	class="bg-black rounded px-12 py-4 text-center"
	class:w-full={fullWidth}
	style={matchLabelMaxWidth ? "visibility: hidden;" : ""}
>
	<div class="text-[28px] tracking-[0.03em] text-white font-normal leading-[1.2]">
		{eventLabel}
	</div>
	<!-- pre-line honours the explicit line break in playoff match names so they
	     read as two clean lines here too (preview, waiting-for-scores). -->
	<div
		bind:this={labelEl}
		class="display text-matchLabel font-bold leading-[1.1] mt-1 mx-auto"
		style="white-space: pre-line; font-size: {matchLabelSize};{matchLabelMaxWidth
			? ` max-width: ${matchLabelMaxWidth}; text-wrap: balance;`
			: fullWidth
				? ' text-wrap: balance;'
				: ''}"
	>
		{matchLabel}
	</div>
</div>
