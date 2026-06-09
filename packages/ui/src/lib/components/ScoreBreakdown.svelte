<script lang="ts">
	import type { AllianceScore, PlayoffTiebreakType } from "lib";
	import { fade } from "svelte/transition";

	export let leftScore: AllianceScore;
	export let rightScore: AllianceScore;
	export let tiebreaker: PlayoffTiebreakType | undefined = undefined;

	// 2026 REBUILT playoff tiebreaker criteria, in FMS sort order (game manual Table 10-3).
	const TIEBREAK_LABELS: Record<PlayoffTiebreakType, string> = {
		Unknown: "Decided by Tiebreaker",
		TrueTie: "True Tie: Match Replay",
		TieBreakSortOrder1: "Tiebreaker: Major Foul Points",
		TieBreakSortOrder2: "Tiebreaker: Auto Fuel Points",
		TieBreakSortOrder3: "Tiebreaker: Tower Points",
		TieBreakSortOrder4: "Tiebreaker: Sort Order 4",
		TieBreakSortOrder5: "Tiebreaker: Sort Order 5",
		TieBreakSortOrder6: "Tiebreaker: Sort Order 6",
	};

	$: tiebreakLabel = tiebreaker ? TIEBREAK_LABELS[tiebreaker] : "";
</script>

<div
	class="w-full max-w-3xl mx-auto h-fit justify-around bg-white text-black font-semibold text-4xl flex flex-col text-center"
	in:fade={{ duration: 250 }}
	out:fade={{ duration: 100 }}
>
	<div class="grid grid-cols-[.2fr_.6fr_.2fr] even:bg-gray-200 px-2 py-2">
		<span class="tabular-nums">{leftScore.autoFuelPoints}</span>
		<span>Auto Fuel</span>
		<span class="tabular-nums">{rightScore.autoFuelPoints}</span>
	</div>
	<div class="grid grid-cols-[.2fr_.6fr_.2fr] even:bg-gray-200 px-2 py-2">
		<span class="tabular-nums">{leftScore.teleopFuelPoints}</span>
		<span>Teleop Fuel</span>
		<span class="tabular-nums">{rightScore.teleopFuelPoints}</span>
	</div>
	<div class="grid grid-cols-[.2fr_.6fr_.2fr] even:bg-gray-200 px-2 py-2">
		<span class="tabular-nums">{leftScore.autoClimbPoints}</span>
		<span>Auto Climb</span>
		<span class="tabular-nums">{rightScore.autoClimbPoints}</span>
	</div>
	<div class="grid grid-cols-[.2fr_.6fr_.2fr] even:bg-gray-200 px-2 py-2">
		<span class="tabular-nums">{leftScore.endgameClimbPoints}</span>
		<span>Endgame Climb</span>
		<span class="tabular-nums">{rightScore.endgameClimbPoints}</span>
	</div>
	<div class="grid grid-cols-[.2fr_.6fr_.2fr] even:bg-gray-200 px-2 py-2">
		<span class="tabular-nums">{leftScore.foulPoints}</span>
		<span>Penalty</span>
		<span class="tabular-nums">{rightScore.foulPoints}</span>
	</div>
	{#if tiebreakLabel}
		<div
			class="bg-accentWarn text-black px-2 py-2 text-2xl text-center uppercase tracking-wider"
			in:fade={{ duration: 250 }}
		>
			{tiebreakLabel}
		</div>
	{/if}
</div>
