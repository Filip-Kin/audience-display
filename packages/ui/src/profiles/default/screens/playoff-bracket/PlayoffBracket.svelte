<script lang="ts">
	import { state } from "@lib/state";
	import BracketNode from "./BracketNode.svelte";
	import FinalsSeries from "./FinalsSeries.svelte";
	import { fade } from "svelte/transition";
	import { createEventDispatcher } from "svelte";
	import type { AudienceDoubleElimMatch } from "lib";

	const dispatcher = createEventDispatcher();
	export let exit = false;

	$: if (exit) {
		setTimeout(() => dispatcher("transitioned"), 300);
	}

	$: bracket = $state.bracket;

	// Group matches by their column position in a standard 13-match double-elim layout.
	// Columns: R1 (1-4) | R2 (5-8) | R3 (9-10) | R4 (11-12) | R5 (13) | Finals (right)
	$: columns = ((): AudienceDoubleElimMatch[][] => {
		if (!bracket) return [];
		const matches = bracket.doubleElimMatchesList;
		return [
			matches.filter((m) => m.matchNumber >= 1 && m.matchNumber <= 4),
			matches.filter((m) => m.matchNumber >= 5 && m.matchNumber <= 8),
			matches.filter((m) => m.matchNumber >= 9 && m.matchNumber <= 10),
			matches.filter((m) => m.matchNumber >= 11 && m.matchNumber <= 12),
			matches.filter((m) => m.matchNumber === 13),
		];
	})();
</script>

<div class="w-screen h-screen bg-background text-text p-8 overflow-auto" in:fade={{ duration: 300 }}>
	<div class="flex flex-col gap-6 h-full">
		<h1 class="text-5xl font-bold text-center">
			{bracket?.eventName ?? $state.eventDetails?.name ?? "Playoffs"} Bracket
		</h1>

		{#if !bracket}
			<div class="flex-1 flex items-center justify-center text-3xl opacity-60">
				Loading bracket...
			</div>
		{:else}
			<div class="flex-1 grid grid-cols-[repeat(5,1fr)_2fr] gap-4 items-stretch">
				{#each columns as col, ci}
					<div class="flex flex-col justify-around gap-3">
						{#each col as match (match.matchNumber)}
							<BracketNode {match} />
						{/each}
					</div>
				{/each}

				<div class="flex flex-col justify-center gap-4 border-l border-white/20 pl-4">
					{#if bracket.finals}
						<BracketNode match={bracket.finals} />
					{/if}
					<FinalsSeries />
				</div>
			</div>
		{/if}
	</div>
</div>
