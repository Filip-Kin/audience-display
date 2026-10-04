<script lang="ts">
	import type { AllianceScore, Team } from "lib";
	import { tweened } from "svelte/motion";
	import { cubicOut } from "svelte/easing";
	import Avatar from "@lib/components/Avatar.svelte";
	import { settings } from "@lib/settings";
	import { state } from "@lib/state";
	import FuelGauge from "../../../default/screens/match-ready/FuelGauge.svelte";
	import Digits from "../../components/Digits.svelte";

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

	// In playoffs, label the bar with the alliance name ("Alliance N", from
	// match details) instead of the colour word; quals keep Red/Blue.
	$: details = $state.match?.details;
	$: barIsPlayoff = !!details && details.matchType !== "q" && details.matchType !== "t";
	$: allianceLabel =
		(barIsPlayoff && details?.[color === "red" ? "redAlliance" : "blueAlliance"]) ||
		(color === "red" ? "Red" : "Blue");

	// White rim on the outer three sides; the inner side butts the bug, which
	// carries the lavender divider. Outer corners take the bar radius.
	$: rim = isLeft
		? "border-width: var(--goon-rim) 0 var(--goon-rim) var(--goon-rim);"
		: "border-width: var(--goon-rim) var(--goon-rim) var(--goon-rim) 0;";
	$: radius = isLeft
		? "var(--goon-bar-r) 0 0 var(--goon-bar-r)"
		: "0 var(--goon-bar-r) var(--goon-bar-r) 0";

	const displayScore = tweened(0, { duration: 600, easing: cubicOut });
	$: displayScore.set(score.score);
</script>

<div class="relative" style="z-index: {hubActive ? 1 : 0};">
	<!-- Hub-active glow in the alliance colour, behind the half so it follows
	     the rounded silhouette and never tints the white rim. -->
	<div
		class="absolute z-0"
		style="
			inset: -14px;
			border-radius: {isLeft
				? 'calc(var(--goon-bar-r) + 14px) 0 0 calc(var(--goon-bar-r) + 14px)'
				: '0 calc(var(--goon-bar-r) + 14px) calc(var(--goon-bar-r) + 14px) 0'};
			background: {bgVar};
			filter: blur(18px);
			opacity: {hubActive ? 1 : 0};
			transition: opacity 0.4s ease;
			{isEndingPulse ? 'animation: goon-underglow-flashout 3s ease-in-out forwards;' : ''}
		"
	></div>

	<div
		class="relative z-[1] h-full grid items-center py-3.5 gap-4 border-solid border-[color:var(--goon-rim-color)] {isLeft
			? 'grid-cols-[1fr_auto_auto] pl-6 pr-5'
			: 'grid-cols-[auto_auto_1fr] pl-5 pr-6'}"
		style="background: {bgVar}; border-radius: {radius}; {rim}"
	>
		<!-- Team numbers, inboard (next to the timer); avatars ride the pill's
		     inner edge. -->
		<div class="flex flex-col gap-[7px]" style="order: {isLeft ? 3 : 1};">
			{#each teams.slice(0, 3) as team (team.number)}
				<!-- A carded team's whole chip takes the card colour (literal FMS
				     yellow / red, never a theme token); size never changes. -->
				<div class="overflow-hidden rounded-full">
					<div
						class="flex items-stretch {isLeft ? '' : 'flex-row-reverse'} {team.card === 'Yellow'
							? 'bg-[oklch(0.88_0.19_92)] text-black'
							: team.card === 'Red'
								? 'bg-[oklch(0.5_0.21_29)] text-white'
								: 'bg-[oklch(0_0_0/0.36)] text-white'}"
					>
						<div class="goon-display flex-1 text-center text-[42px] leading-none px-4 pt-[5px] pb-[7px] min-w-[5.6ch]">
							{team.number}
						</div>
						{#if $settings.scoreBarAvatars}
							<div class="w-[52px] flex-none bg-[oklch(0_0_0/0.28)]">
								<Avatar avatar={team.avatar || undefined} team={team.number} placeholder={team.placeholder} class="w-full h-full object-cover" alt="" />
							</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>

		<!-- Alliance name + score, outboard -->
		<div class="flex flex-col items-center justify-center" style="order: {isLeft ? 1 : 3};">
			<div class="goon-label text-white text-[22px] leading-none tracking-[0.22em]">
				{allianceLabel}
			</div>
			<div class="goon-display text-white text-[136px] leading-[0.95] min-w-[3ch] text-center [text-shadow:0_4px_0_oklch(0_0_0/0.25)]">
				<Digits value={Math.round($displayScore)} />
			</div>
		</div>

		<!-- Fuel gauge (stock component; its arc follows --scoreBarAccent) -->
		<div style="order: 2;">
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
