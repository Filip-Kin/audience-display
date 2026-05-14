<script lang="ts">
	import { state } from "../../lib/state";
	import { settings } from "../../lib/settings";

	$: hubActive = $state.match?.hubActive ?? "None";
	// Which side (left/right on screen) is active, respecting settings.invert.
	// Default layout: red on left, blue on right.
	$: activeSide = (() => {
		if (hubActive === "None") return null;
		const redOnLeft = !$settings.invert;
		if (hubActive === "Red") return redOnLeft ? "left" : "right";
		return redOnLeft ? "right" : "left";
	})();
</script>

{#if activeSide}
	<div
		class="absolute z-30 px-4 py-2 bg-accentWarn text-black font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg rounded"
		class:left-4={activeSide === "left"}
		class:right-4={activeSide === "right"}
		style="top: 50%; transform: translateY(-50%);"
	>
		{#if activeSide === "right"}
			<span>Hub Active</span>
			<span class="text-2xl leading-none">→</span>
		{:else}
			<span class="text-2xl leading-none">←</span>
			<span>Hub Active</span>
		{/if}
	</div>
{/if}
