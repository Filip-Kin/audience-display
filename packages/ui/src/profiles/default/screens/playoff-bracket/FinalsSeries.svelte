<script lang="ts">
	import { state } from "@lib/state";

	// Series state rides the posted match results, so only trust it when the
	// last result actually IS a finals match - otherwise a posted playoff win
	// would light a circle before the finals even start.
	$: finalsResults = $state.results?.details.matchType === "f" ? $state.results : null;
	$: redWins = finalsResults?.details.redSeriesWins ?? 0;
	$: blueWins = finalsResults?.details.blueSeriesWins ?? 0;

	// Best-of-3 "tug": red wins fill from the LEFT inward, blue wins from the
	// RIGHT inward, and the middle circle is the shared decider - it goes to
	// whichever alliance earns its 2nd win (that alliance is champion). Ties
	// advance nothing, and there is no 3-matches cap: overtime just keeps
	// playing until someone reaches 2 wins, which is all these circles track.
	$: circles = [
		redWins >= 1 ? "red" : null,
		redWins >= 2 ? "red" : blueWins >= 2 ? "blue" : null,
		blueWins >= 1 ? "blue" : null,
	] as ("red" | "blue" | null)[];

	const circleClass = (fill: "red" | "blue" | null): string => {
		if (fill === "red") return "bg-redAlliance border-redAlliance";
		if (fill === "blue") return "bg-blueAlliance border-blueAlliance";
		return "border-[oklch(0.55_0.01_250)]";
	};
</script>

<div class="flex flex-col items-center gap-4">
	<h2 class="text-3xl font-bold uppercase tracking-widest">Finals: Best of 3</h2>
	<div class="flex items-center gap-4">
		<div class="flex gap-2">
			{#each circles as fill}
				<div class="size-8 rounded-full border-2 {circleClass(fill)}"></div>
			{/each}
		</div>
	</div>
</div>
