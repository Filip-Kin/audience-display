<script lang="ts">
	import type { Team } from "lib";
	import TeamCard from "./TeamCard.svelte";

	export let alliance: "red" | "blue";
	export let teams: Team[] = [];
	export let ready: boolean = false;
	export let invert: boolean = false;
	export let compact: boolean = false;
	export let showRank: boolean = true;
	export let gap: number = 16;

	$: twoCol = compact || teams.length > 3;
</script>

{#if twoCol}
	<div class="grid grid-cols-2 auto-rows-fr" style="gap: {gap}px">
		{#each teams as team, index (team.number)}
			<slot name="card" {team} {index} {alliance} {invert}>
				<TeamCard {alliance} {ready} {index} {team} {invert} {showRank} small />
			</slot>
		{/each}
	</div>
{:else}
	<div class="flex flex-col" style="gap: {gap}px">
		{#each teams as team, index (team.number)}
			<slot name="card" {team} {index} {alliance} {invert}>
				<TeamCard {alliance} {ready} {index} {team} {invert} {showRank} />
			</slot>
		{/each}
	</div>
{/if}

<slot name="bottom" />
