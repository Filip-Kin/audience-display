<script lang="ts">
	export let eventLabel: string = "";
	export let matchLabel: string = "";
	/** Match-name font size; defaults to the standard header size. */
	export let matchLabelSize: string = "46px";
	/** Cap the match-name width so long names (playoff bracket labels) wrap to a
	 *  balanced two lines instead of running wide under the reveal's corner
	 *  sponsor boxes. Empty = grow with content (default, unchanged). */
	export let matchLabelMaxWidth: string = "";
</script>

<div class="bg-black rounded px-12 py-4 text-center">
	<div class="text-[28px] tracking-[0.03em] text-white font-normal leading-[1.2]">
		{eventLabel}
	</div>
	<div
		class="display text-accentWarn font-bold leading-[1.1] mt-1 mx-auto"
		style="font-size: {matchLabelSize};{matchLabelMaxWidth
			? ` max-width: ${matchLabelMaxWidth}; width: fit-content; text-wrap: balance;`
			: ''}"
	>
		{matchLabel}
	</div>
</div>
