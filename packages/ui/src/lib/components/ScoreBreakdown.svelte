<script lang="ts">
	import type { AllianceScore } from "lib";
	import { fade } from "svelte/transition";

	export let leftScore: AllianceScore;
	export let rightScore: AllianceScore;
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
</div>
