<script lang="ts">
	import type { AllianceScore, Team } from "lib";
	import { tweened } from "svelte/motion";
	import Avatar from "@lib/components/Avatar.svelte";
	import { settings } from "@lib/settings";
	import { state } from "@lib/state";
	import { cubicOut } from "svelte/easing";
	import FuelGauge from "./FuelGauge.svelte";

	export let side: "left" | "right";
	export let color: "red" | "blue";
	export let score: AllianceScore;
	export let teams: Team[];
	export let hubActive: boolean = false;
	/** True in the last 3s of a phase when this side's goal is about to close. */
	export let endingPulse: boolean = false;

	$: bgVar = color === "red" ? "var(--redAlliance)" : "var(--blueAlliance)";
	$: isLeft = side === "left";

	// In playoffs, label the bar with the alliance name ("Alliance N", from
	// match details) instead of the colour word; quals keep RED/BLUE.
	$: details = $state.match?.details;
	$: barIsPlayoff = !!details && details.matchType !== "q" && details.matchType !== "t";
	$: allianceLabel =
		(barIsPlayoff && details?.[color === "red" ? "redAlliance" : "blueAlliance"]) ||
		(color === "red" ? "RED" : "BLUE");
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
		{isEndingPulse ? `animation: glow-flashout-${color} 3s ease-in-out forwards;` : ''}
	"
>
	<!-- Team numbers; optional full-bleed avatar on the pill's inner edge -->
	<div class="flex flex-col gap-1.5" style="order: {isLeft ? 1 : 3};">
		{#each teams.slice(0, 3) as team (team.number)}
			<!-- A carded team's whole chip takes the card color; size never changes. -->
			<div
				class="flex items-stretch {isLeft ? '' : 'flex-row-reverse'} {team.card === 'Yellow'
					? 'bg-[oklch(0.88_0.19_92)] text-black'
					: team.card === 'Red'
						? 'bg-[oklch(0.5_0.21_29)] text-white'
						: 'bg-[oklch(0_0_0/0.36)] text-white'}"
			>
				<div class="display team-num flex-1 text-center text-[42px] leading-none px-3.5 py-1 min-w-[5.6ch]">
					{team.number}
				</div>
				{#if $settings.scoreBarAvatars}
					<div class="w-[52px] flex-none bg-[oklch(0_0_0/0.28)]">
						<Avatar avatar={team.avatar || undefined} team={team.number} class="w-full h-full object-cover" alt="" />
					</div>
				{/if}
			</div>
		{/each}
	</div>

	<!-- Alliance name + score -->
	<div class="flex flex-col items-center justify-center" style="order: 2;">
		<div class="uppercase text-white text-lg font-black tracking-[0.22em]">
			{allianceLabel}
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
