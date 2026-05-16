<script lang="ts">
	import type { AllianceScore } from "lib";
	import { state } from "../../../../lib/state";
	import ThresholdBar from "./ThresholdBar.svelte";

	export let invert: boolean;
	export let wingSpring;
	export let opacityTween;
	export let alliance: "red" | "blue";

	$: score = $state.match?.score[alliance] as AllianceScore | undefined;
	$: bgClass = alliance === "red" ? "bg-redAlliance" : "bg-blueAlliance";
</script>

{#if $state.match && score}
	<div class="flex flex-row justify-start">
		<div
			class="{bgClass} flex flex-row p{invert ? 'l' : 'r'}-16 -m{invert
				? 'l'
				: 'r'}-16 rounded-{invert ? 'r' : 'l'}-xl relative rainbow-shadow"
		>
			<div
				class="flex flex-row z-10 relative"
				style={`max-width: ${$wingSpring / 2}vw; opacity: ${$opacityTween}`}
				class:flex-row-reverse={invert}
			>
				<!-- Total score -->
				<div class="flex flex-col justify-center px-3 w-40 text-7xl font-bold text-center text-white">
					{score.score}
				</div>

				<!-- Fuel count + climb points -->
				<div class="flex flex-col justify-center px-3 min-w-32 text-white text-center">
					<div class="text-xs uppercase tracking-wider opacity-80">Fuel</div>
					<div class="text-4xl font-semibold leading-none tabular-nums">{score.totalFuelCount}</div>
					<div class="text-xs uppercase tracking-wider opacity-80 mt-1">
						Climb: <span class="font-semibold tabular-nums">{score.totalClimbPoints}</span>
					</div>
				</div>

				<!-- Threshold bars stacked -->
				<div class="flex flex-col justify-center gap-1 px-3 min-w-72 text-white">
					<ThresholdBar
						label="Energized"
						current={score.totalFuelCount}
						threshold={score.energizedThreshold}
						achieved={score.energizedAchieved}
					/>
					<ThresholdBar
						label="Supercharged"
						current={score.totalFuelCount}
						threshold={score.superchargedThreshold}
						achieved={score.superchargedAchieved}
					/>
					<ThresholdBar
						label="Traversal"
						current={score.totalClimbPoints}
						threshold={score.traversalThreshold}
						achieved={score.traversalAchieved}
					/>
				</div>

				<!-- Team numbers -->
				<div
					class="flex flex-col justify-center px-3 w-36 gap-1 tracking-tighter font-medium text-4xl text-white"
				>
					{#each $state.match.teams[alliance].slice(0, 3) as team}
						<span
							class="text-center text-black rounded {team.card !== 'None' ? 'bg-accentWarn' : 'bg-white'}"
							>{team.number}</span
						>
					{/each}
				</div>
			</div>
		</div>
	</div>
{/if}
