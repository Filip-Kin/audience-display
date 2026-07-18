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

	// Each half gets its own conic rainbow underglow, phase-offset 180deg and at
	// different speeds per the design so the two sides never sync up.
	$: glowFrom = isLeft ? "0deg" : "180deg";
	$: glowSpeed = isLeft ? "4s" : "5s";

	// Rounded outer corner: top by default, flipped to bottom in top-mode via the
	// --rr-bar-rt/--rr-bar-rb vars set on the scorebar grid in MatchReady.
	$: halfRadius = isLeft
		? "var(--rr-bar-rt, var(--rr-r)) 0 0 var(--rr-bar-rb, 0px)"
		: "0 var(--rr-bar-rt, var(--rr-r)) var(--rr-bar-rb, 0px) 0";

	const displayScore = tweened(0, { duration: 600, easing: cubicOut });
	$: displayScore.set(score.score);
</script>

<div class="relative" style="z-index: {hubActive ? 1 : 0};">
	<!-- Animated rainbow underglow behind the half -->
	<!-- Extends past the accent strip vertically and rounds only the outer
	     corners, so the blurred glow follows the bar's rounded silhouette
	     instead of showing square corners behind the strip. -->
	<div
		class="absolute z-0"
		style="
			inset: -17px -7px;
			border-radius: {isLeft
				? 'calc(var(--rr-r) + 7px) 0 0 calc(var(--rr-r) + 7px)'
				: '0 calc(var(--rr-r) + 7px) calc(var(--rr-r) + 7px) 0'};
			background: conic-gradient(from {glowFrom}, #ff2d55, #ffcc00, #34c759, #00c7ff, #af52de, #ff2d55, #ffcc00, #34c759, #00c7ff, #af52de, #ff2d55);
			filter: blur(10px);
			animation: rr-hue {glowSpeed} linear infinite;
		"
	></div>

	<div
		class="grid items-center py-4 px-[22px] gap-4 relative z-[1] {isLeft ? 'grid-cols-[1fr_auto_auto]' : 'grid-cols-[auto_auto_1fr]'}"
		style="
			background: {bgVar};
			border-radius: {halfRadius};
			transition: box-shadow 0.4s ease;
			box-shadow: {!hubActive ? 'none' : isEndingPulse ? 'none' : `0 0 80px 18px ${bgVar}`};
			{isEndingPulse ? `animation: glow-pulse-${color} 0.8s ease-in-out infinite;` : ''}
		"
	>
		<!-- Team numbers, inboard (next to the center bug) -->
		<div class="flex flex-col gap-[7px]" style="order: {isLeft ? 3 : 1};">
			{#each teams.slice(0, 3) as team (team.number)}
				<div class="flex flex-col overflow-hidden rounded-[var(--rr-r-chip)]">
					<div class="rr-display team-num text-white text-center text-[42px] leading-none bg-[oklch(0_0_0/0.36)] px-3.5 py-[5px] min-w-[5.6ch]">
						{team.number}
					</div>
					{#if team.card === "Yellow" || team.card === "Red"}
						<div class="h-2.5 {team.card === 'Yellow' ? 'bg-accentWarn' : 'bg-white'}"></div>
					{/if}
				</div>
			{/each}
		</div>

		<!-- Alliance name + score, outboard -->
		<div class="flex flex-col items-center justify-center" style="order: {isLeft ? 1 : 3};">
			<div class="uppercase text-white text-lg font-black tracking-[0.22em]">
				{color === "red" ? "Red" : "Blue"}
			</div>
			<div class="rr-display tabular-nums text-white text-[140px] leading-[0.88] tracking-[-0.03em] mt-0.5 min-w-[3ch] text-center">
				{Math.round($displayScore)}
			</div>
		</div>

		<!-- Fuel gauge -->
		<div class="{isLeft ? 'pr-2' : 'pl-2'}" style="order: 2;">
			<FuelGauge
				fuelCount={score.totalFuelCount}
				energizedThreshold={score.energizedThreshold}
				superchargedThreshold={score.superchargedThreshold}
				energizedAchieved={score.energizedAchieved}
				superchargedAchieved={score.superchargedAchieved}
			/>
		</div>
	</div>
</div>
