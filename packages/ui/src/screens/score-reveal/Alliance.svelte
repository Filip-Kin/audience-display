<script lang="ts">
	import { fly } from "svelte/transition";
	import { state } from "../../lib/state";
	import TeamCard from "../../lib/TeamCard.svelte";
	import RankingPoints from "./RankingPoints.svelte";
	import Trophy from "../../assets/trophy.svg";
	import { onMount } from "svelte";

	export let ready: boolean;
	export let alliance: "red" | "blue";
	export let invert: boolean = false;

	let allianceName = () => $state.results?.details[alliance === "red" ? "redAlliance" : "blueAlliance"];
</script>

{#if $state.results && ready}
	<div class="flex flex-col gap-4 justify-start">
		{#if allianceName()}
			<div class="flex flex-col shadow-lg rounded overflow-hidden">
				<div class="flex flex-row bg-blue-600 text-white p-4 gap-4 align-middle text-5xl font-bold justify-center">
					{allianceName()}
				</div>
				{#if $state.results.score.winner === alliance.charAt(0).toUpperCase() + alliance.slice(1)}
					<div class="h-16 flex flex-row bg-amber-500 gap-4 items-center text-white text-5xl font-bold justify-center">
						<img src={Trophy} alt="Trophy" class="size-16" />
						<span class="align-middle">Winner</span>
						<img src={Trophy} alt="Trophy" class="size-16" />
					</div>
				{:else if $state.results.score.winner === "Tie"}
					<div class="h-16 flex flex-row bg-amber-500 gap-4 items-center text-white text-5xl font-bold justify-center">
						<img src={Trophy} alt="Trophy" class="size-16" />
						<span class="align-middle">Tie!</span>
						<img src={Trophy} alt="Trophy" class="size-16" />
					</div>
				{/if}
			</div>
		{:else if $state.results.score.winner === alliance.charAt(0).toUpperCase() + alliance.slice(1)}
			<div class="h-16 flex flex-row bg-amber-500 gap-4 items-center text-white text-5xl font-bold justify-center">
				<img src={Trophy} alt="Trophy" class="size-16" />
				<span class="align-middle">Winner</span>
				<img src={Trophy} alt="Trophy" class="size-16" />
			</div>
		{:else if $state.results.score.winner === "Tie"}
			<div class="h-16 flex flex-row bg-amber-500 gap-4 items-center text-white text-5xl font-bold justify-center">
				<img src={Trophy} alt="Trophy" class="size-16" />
				<span class="align-middle">Tie!</span>
				<img src={Trophy} alt="Trophy" class="size-16" />
			</div>
		{:else}
			<div class="h-16"></div>
		{/if}

		{#if $state.results.teams[alliance].length > 3}
			<div class="grid grid-cols-2 gap-4 auto-rows-fr">
				{#each $state.results.teams[alliance] as team, index}
					<TeamCard {alliance} {ready} {index} {team} {invert} small />
				{/each}
			</div>
		{:else}
			{#each $state.results.teams[alliance] as team, index}
				<TeamCard {alliance} {ready} {index} {team} {invert} />
			{/each}
		{/if}

		{#if $state.results.details.matchType !== "sf" && $state.results.details.matchType !== "f"}
			<RankingPoints {ready} {alliance} {invert} />
		{/if}
	</div>
{/if}
