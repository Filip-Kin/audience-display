<script lang="ts">
	import type { AllianceScore, Team } from "lib";
	import { tweened } from "svelte/motion";
	import { cubicOut } from "svelte/easing";
	import FuelGauge from "./FuelGauge.svelte";

	export let side: "left" | "right";
	export let color: "red" | "blue";
	export let score: AllianceScore;
	export let teams: Team[];
	export let hubActive: boolean = false;
	/** True in the last 5s of a phase when this side's goal is about to close. */
	export let endingPulse: boolean = false;

	$: bgVar = color === "red" ? "var(--redAlliance)" : "var(--blueAlliance)";
	$: isLeft = side === "left";
	$: isEndingPulse = hubActive && endingPulse;

	const displayScore = tweened(0, { duration: 600, easing: cubicOut });
	$: displayScore.set(score.score);
</script>

<div
	class="grid items-center px-5 py-4 grid-cols-[auto_1fr_auto] gap-4"
	style="
		background: {bgVar};
		position: relative;
		z-index: {hubActive ? 1 : 0};
		transition: box-shadow 0.4s ease;
		box-shadow: {!hubActive ? 'none' : isEndingPulse ? 'none' : `0 0 80px 18px ${bgVar}`};
		{isEndingPulse ? `animation: glow-pulse-${color} 0.8s ease-in-out infinite;` : ''}
	"
>
	<!-- Team numbers -->
	<div class="flex flex-col gap-1.5" style="order: {isLeft ? 1 : 3};">
		{#each teams.slice(0, 3) as team (team.number)}
			<div class="flex flex-col">
				<div class="display team-num text-white text-center text-[42px] leading-none bg-[oklch(0_0_0/0.36)] px-3.5 py-1 min-w-[5.6ch]">
					{team.number}
				</div>
				{#if team.card === "Yellow" || team.card === "Red"}
					<div class="h-2.5 {team.card === 'Yellow' ? 'bg-accentWarn' : 'bg-white'}"></div>
				{/if}
			</div>
		{/each}
	</div>

	<!-- Alliance name + score -->
	<div class="flex flex-col items-center justify-center" style="order: 2;">
		<div class="uppercase text-white text-lg font-black tracking-[0.22em]">
			{color === "red" ? "RED" : "BLUE"}
		</div>
		<div class="display tabular-nums text-white text-[140px] leading-[0.88] tracking-[-0.03em] mt-0.5 min-w-[3ch] text-center">
			{Math.round($displayScore)}
		</div>
	</div>

	<!-- Fuel gauge -->
	<div class="{isLeft ? 'pr-2' : 'pl-2'}" style="order: {isLeft ? 3 : 1};">
		<FuelGauge
			fuelCount={score.totalFuelCount}
			energizedThreshold={score.energizedThreshold}
			superchargedThreshold={score.superchargedThreshold}
			energizedAchieved={score.energizedAchieved}
			superchargedAchieved={score.superchargedAchieved}
		/>
	</div>
</div>
