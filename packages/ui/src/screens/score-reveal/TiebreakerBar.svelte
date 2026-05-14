<script lang="ts">
	import type { PlayoffTiebreakType } from "lib";
	import { fade } from "svelte/transition";

	export let tiebreaker: PlayoffTiebreakType | undefined;

	const LABELS: Record<PlayoffTiebreakType, string> = {
		Unknown: "Tiebreaker",
		TrueTie: "True Tie",
		TieBreakSortOrder1: "Tiebreaker — Sort Order 1",
		TieBreakSortOrder2: "Tiebreaker — Sort Order 2",
		TieBreakSortOrder3: "Tiebreaker — Sort Order 3",
		TieBreakSortOrder4: "Tiebreaker — Sort Order 4",
		TieBreakSortOrder5: "Tiebreaker — Sort Order 5",
		TieBreakSortOrder6: "Tiebreaker — Sort Order 6",
	};

	$: visible = !!tiebreaker;
	$: label = tiebreaker ? LABELS[tiebreaker] : "";
</script>

{#if visible}
	<div
		class="w-full bg-accentWarn text-black px-6 py-2 text-center text-xl font-semibold uppercase tracking-wider"
		in:fade={{ duration: 300 }}
	>
		{label}
	</div>
{/if}
