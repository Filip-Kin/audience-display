<script lang="ts">
	import { state } from "@lib/state";

	$: redWins = $state.results?.details.redSeriesWins ?? 0;
	$: blueWins = $state.results?.details.blueSeriesWins ?? 0;
	$: redAllianceName = $state.results?.details.redAlliance ?? "Red Alliance";
	$: blueAllianceName = $state.results?.details.blueAlliance ?? "Blue Alliance";
</script>

<div class="flex flex-col items-center gap-4">
	<h2 class="text-3xl font-bold uppercase tracking-widest">Finals: Best of 3</h2>
	<div class="grid grid-cols-2 gap-8 text-center">
		<div class="flex flex-col items-center gap-2">
			<span class="text-xl font-bold text-white">{redAllianceName}</span>
			<div class="flex gap-2">
				{#each [0, 1, 2] as i}
					<div
						class="size-8 rounded-full border-2 border-redAlliance {i < redWins
							? 'bg-redAlliance'
							: 'bg-transparent'}"
					></div>
				{/each}
			</div>
		</div>
		<div class="flex flex-col items-center gap-2">
			<span class="text-xl font-bold text-white">{blueAllianceName}</span>
			<div class="flex gap-2">
				{#each [0, 1, 2] as i}
					<div
						class="size-8 rounded-full border-2 border-blueAlliance {i < blueWins
							? 'bg-blueAlliance'
							: 'bg-transparent'}"
					></div>
				{/each}
			</div>
		</div>
	</div>
</div>
