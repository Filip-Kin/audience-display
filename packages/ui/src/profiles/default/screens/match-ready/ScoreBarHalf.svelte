<script lang="ts">
	import type { AllianceScore, Team } from "lib";
	import type { MatchPhase } from "lib";
	import { tweened } from "svelte/motion";
	import { cubicOut } from "svelte/easing";
	import FuelGauge from "./FuelGauge.svelte";

	export let side: "left" | "right";
	export let color: "red" | "blue";
	export let score: AllianceScore;
	export let teams: Team[];
	export let hubActive: boolean = false;
	export let timer: number = 999;
	export let phase: MatchPhase = "PreMatch";

	$: bgVar = color === "red" ? "var(--redAlliance)" : "var(--blueAlliance)";
	$: isLeft = side === "left";
	$: isShift = ["Shift1", "Shift2", "Shift3", "Shift4"].includes(phase);
	$: isEndingPulse = hubActive && isShift && timer > 0 && timer <= 5;

	const displayScore = tweened(0, { duration: 600, easing: cubicOut });
	$: displayScore.set(score.score);
</script>

<div
	class="grid items-center"
	style="
		background: {bgVar};
		padding: 16px 20px;
		grid-template-columns: auto 1fr auto;
		gap: 16px;
		transition: box-shadow 0.4s ease;
		box-shadow: {!hubActive ? 'none' : isEndingPulse ? 'none' : `0 0 80px 18px ${bgVar}`};
		{isEndingPulse ? `animation: glow-pulse-${color} 0.8s ease-in-out infinite;` : ''}
	"
>
	{#if isLeft}
		<div class="flex flex-col" style="gap: 6px;">
			{#each teams.slice(0, 3) as team (team.number)}
				<div
					class="display team-num text-white text-center"
					style="font-size: 42px; line-height: 1; background: oklch(0 0 0 / 0.36); padding: 4px 14px; min-width: 5.6ch;"
				>
					{team.number}
				</div>
			{/each}
		</div>

		<div class="flex flex-col items-center justify-center">
			<div class="uppercase text-white" style="font-size: 18px; font-weight: 900; letter-spacing: 0.22em;">
				{color === "red" ? "RED" : "BLUE"}
			</div>
			<div
				class="display tabular-nums text-white"
				style="font-size: 140px; line-height: 0.88; letter-spacing: -0.03em; margin-top: 2px; min-width: 3ch; text-align: center;"
			>
				{Math.round($displayScore)}
			</div>
		</div>

		<div style="padding-right: 8px;">
			<FuelGauge
				fuelCount={score.totalFuelCount}
				energizedThreshold={score.energizedThreshold}
				superchargedThreshold={score.superchargedThreshold}
				energizedAchieved={score.energizedAchieved}
				superchargedAchieved={score.superchargedAchieved}
			/>
		</div>
	{:else}
		<div style="padding-left: 8px;">
			<FuelGauge
				fuelCount={score.totalFuelCount}
				energizedThreshold={score.energizedThreshold}
				superchargedThreshold={score.superchargedThreshold}
				energizedAchieved={score.energizedAchieved}
				superchargedAchieved={score.superchargedAchieved}
			/>
		</div>

		<div class="flex flex-col items-center justify-center">
			<div class="uppercase text-white" style="font-size: 18px; font-weight: 900; letter-spacing: 0.22em;">
				{color === "red" ? "RED" : "BLUE"}
			</div>
			<div
				class="display tabular-nums text-white"
				style="font-size: 140px; line-height: 0.88; letter-spacing: -0.03em; margin-top: 2px; min-width: 3ch; text-align: center;"
			>
				{Math.round($displayScore)}
			</div>
		</div>

		<div class="flex flex-col" style="gap: 6px;">
			{#each teams.slice(0, 3) as team (team.number)}
				<div
					class="display team-num text-white text-center"
					style="font-size: 42px; line-height: 1; background: oklch(0 0 0 / 0.36); padding: 4px 14px; min-width: 5.6ch;"
				>
					{team.number}
				</div>
			{/each}
		</div>
	{/if}
</div>
