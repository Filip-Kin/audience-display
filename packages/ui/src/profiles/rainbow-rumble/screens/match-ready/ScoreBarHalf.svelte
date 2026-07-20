<script lang="ts">
	import type { AllianceScore, Team } from "lib";
	import { tweened } from "svelte/motion";
	import { cubicOut } from "svelte/easing";
	import FuelGauge from "./FuelGauge.svelte";
	import Avatar from "@lib/components/Avatar.svelte";
	import { settings } from "@lib/settings";

	export let side: "left" | "right";
	export let color: "red" | "blue";
	export let score: AllianceScore;
	export let teams: Team[];
	export let hubActive: boolean = false;
	/** True in the last 3s of a phase when this side's goal is about to close. */
	export let endingPulse: boolean = false;

	$: bgVar = color === "red" ? "var(--redAlliance)" : "var(--blueAlliance)";
	$: isLeft = side === "left";
	$: isEndingPulse = hubActive && endingPulse;

	// Each half gets its own conic rainbow underglow, phase-offset 180deg and at
	// different speeds so the two sides never sync up. It shows only while this
	// side's hub is active and pulses in the closing window, standing in for the
	// alliance-color box-shadow the default/WRC scorebar uses.
	$: glowFrom = isLeft ? "0deg" : "180deg";
	$: glowSpeed = isLeft ? "2s" : "2.5s";

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
	<!-- Rounds only the outer corners so the blurred glow follows the bar's
	     rounded silhouette. -->
	<div
		class="absolute z-0"
		style="
			inset: -7px;
			border-radius: {isLeft
				? 'calc(var(--rr-r) + 7px) 0 0 calc(var(--rr-r) + 7px)'
				: '0 calc(var(--rr-r) + 7px) calc(var(--rr-r) + 7px) 0'};
			background: conic-gradient(from {glowFrom}, #ff2d55, #ffcc00, #34c759, #00c7ff, #af52de, #ff2d55, #ffcc00, #34c759, #00c7ff, #af52de, #ff2d55);
			filter: blur(10px);
			opacity: {hubActive ? 1 : 0};
			transition: opacity 0.4s ease;
			animation: rr-hue {glowSpeed} linear infinite{isEndingPulse ? ', rr-underglow-flashout 3s ease-in-out forwards' : ''};
		"
	></div>

	<div
		class="grid items-center py-4 px-[22px] gap-4 relative z-[1] {isLeft ? 'grid-cols-[1fr_auto_auto]' : 'grid-cols-[auto_auto_1fr]'}"
		style="
			background: {bgVar};
			border-radius: {halfRadius};
		"
	>
		<!-- Team numbers, inboard (next to the center bug); the avatar rides the
		     pill's inner edge (toward the bug) and is clipped by the same
		     rounded-corner wrapper. -->
		<div class="flex flex-col gap-[7px]" style="order: {isLeft ? 3 : 1};">
			{#each teams.slice(0, 3) as team (team.number)}
				<!-- A carded team's whole chip takes the card color; size never changes. -->
				<div class="overflow-hidden rounded-[var(--rr-r-chip)]">
					<div
						class="flex items-stretch {isLeft ? '' : 'flex-row-reverse'} {team.card === 'Yellow'
							? 'bg-accentWarn text-black'
							: team.card === 'Red'
								? 'bg-[oklch(0.5_0.21_29)] text-white'
								: 'bg-[oklch(0_0_0/0.36)] text-white'}"
					>
						<div class="rr-display team-num flex-1 text-center text-[42px] leading-none px-3.5 py-[5px] min-w-[5.6ch]">
							{team.number}
						</div>
						{#if $settings.scoreBarAvatars}
							<!-- Full-bleed: the avatar fills its cell edge to edge; the pill's
							     rounded wrapper clips its outer corner. -->
							<div class="w-[52px] flex-none bg-[oklch(0_0_0/0.28)]">
								<Avatar avatar={team.avatar || undefined} team={team.number} class="w-full h-full object-cover" alt="" />
							</div>
						{/if}
					</div>
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
