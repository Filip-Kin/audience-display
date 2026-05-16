<script lang="ts">
	import type { AllianceScore, Team } from "lib";
	import FuelGauge from "./FuelGauge.svelte";

	export let side: "left" | "right";
	export let color: "red" | "blue";
	export let score: AllianceScore;
	export let teams: Team[];

	$: bgVar = color === "red" ? "var(--redAlliance)" : "var(--blueAlliance)";
	$: isLeft = side === "left";
</script>

<div
	class="grid items-center"
	style="
		background: {bgVar};
		padding: 16px 28px;
		grid-template-columns: auto 1fr auto;
		gap: 24px;
	"
>
	{#if isLeft}
		<!-- Team stack on outer (left) edge -->
		<div class="flex flex-col" style="gap: 6px;">
			{#each teams.slice(0, 3) as team (team.number)}
				<div
					class="display team-num text-white text-center"
					style="
						font-size: 42px;
						line-height: 1;
						background: oklch(0 0 0 / 0.36);
						padding: 4px 14px;
						min-width: 5.6ch;
					"
				>
					{team.number}
				</div>
			{/each}
		</div>

		<!-- Hero score in middle of half -->
		<div class="flex flex-col items-center justify-center">
			<div
				class="uppercase text-white"
				style="font-size: 18px; font-weight: 900; letter-spacing: 0.22em;"
			>
				{color === "red" ? "RED" : "BLUE"}
			</div>
			<div
				class="display tabular-nums text-white"
				style="font-size: 140px; line-height: 0.88; letter-spacing: -0.03em; margin-top: 2px;"
			>
				{score.score}
			</div>
		</div>

		<!-- Fuel gauge — shifted outward (more padding on inside edge) -->
		<div style="padding-left: 0; padding-right: 56px;">
			<FuelGauge
				fuelCount={score.totalFuelCount}
				energizedThreshold={score.energizedThreshold}
				superchargedThreshold={score.superchargedThreshold}
				energizedAchieved={score.energizedAchieved}
				superchargedAchieved={score.superchargedAchieved}
			/>
		</div>
	{:else}
		<!-- Fuel gauge — shifted outward (more padding on inside edge) -->
		<div style="padding-left: 56px; padding-right: 0;">
			<FuelGauge
				fuelCount={score.totalFuelCount}
				energizedThreshold={score.energizedThreshold}
				superchargedThreshold={score.superchargedThreshold}
				energizedAchieved={score.energizedAchieved}
				superchargedAchieved={score.superchargedAchieved}
			/>
		</div>

		<!-- Hero score in middle of half -->
		<div class="flex flex-col items-center justify-center">
			<div
				class="uppercase text-white"
				style="font-size: 18px; font-weight: 900; letter-spacing: 0.22em;"
			>
				{color === "red" ? "RED" : "BLUE"}
			</div>
			<div
				class="display tabular-nums text-white"
				style="font-size: 140px; line-height: 0.88; letter-spacing: -0.03em; margin-top: 2px;"
			>
				{score.score}
			</div>
		</div>

		<!-- Team stack on outer (right) edge -->
		<div class="flex flex-col" style="gap: 6px;">
			{#each teams.slice(0, 3) as team (team.number)}
				<div
					class="display team-num text-white text-center"
					style="
						font-size: 42px;
						line-height: 1;
						background: oklch(0 0 0 / 0.36);
						padding: 4px 14px;
						min-width: 5.6ch;
					"
				>
					{team.number}
				</div>
			{/each}
		</div>
	{/if}
</div>
