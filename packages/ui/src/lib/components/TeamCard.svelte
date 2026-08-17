<script lang="ts">
	import type { Team } from "lib";
	import { fly } from "svelte/transition";
	import Avatar from "./Avatar.svelte";
	import ArrowUp from "../../assets/arrow-up.svg";
	import ArrowDown from "../../assets/arrow-down.svg";
	import NoChange from "../../assets/no-change.svg";

	export let ready: boolean;
	export let index: number;
	export let team: Team;
	export let alliance: "red" | "blue";
	export let invert: boolean;
	export let small: boolean = false;
	export let showRank: boolean = true;

	$: allianceBg = alliance === "red" ? "bg-redAlliance" : "bg-blueAlliance";
</script>

{#if ready}
	<div
		class="flex flex-col rounded overflow-hidden shadow-[0_6px_20px_oklch(0_0_0/0.55)]"
		in:fly|local={{ x: 100 * (invert ? -1 : 1), duration: 500, delay: 150 * index + 150 }}
		out:fly|local={{ x: 400 * (invert ? -1 : 1), duration: 100 }}
	>
		<div class="flex flex-row {allianceBg} text-white p-3 text-xl gap-4 align-middle">
			<div class="size-[60px]">
				<Avatar avatar={team.avatar} team={team.number} alt="{team.number} Icon" width="60" height="60" />
			</div>
			<span class="text-5xl font-semibold">{team.number}{#if team.designation}<span class="text-3xl font-medium opacity-70"> ({team.designation})</span>{/if}</span>
		</div>

		{#if small}
			<div class="bg-white text-black p-2 text-4xl h-16 line-clamp-2">
				{team.name}
			</div>
		{:else}
			<div
				class="grid {showRank && team.rank ? 'grid-cols-[.7fr_.1fr_.2fr]' : 'grid-cols-[.9fr_.1fr]'} bg-white text-black p-3 {team.name.length > 22 && showRank && team.rank ? 'text-3xl' : 'text-4xl'} font-bold justify-between"
			>
				<span>{team.name}</span>
				{#if team.card && team.card !== "None"}
					<span
						class="w-full h-8 rounded border border-gray-800 flex items-center justify-center uppercase text-[15px] font-black tracking-[0.06em] {team.card === 'Red'
							? 'bg-red-600 text-white'
							: 'bg-yellow-400 text-black'}">CARD</span
					>
				{:else}
					<span></span>
				{/if}
				{#if showRank && team.rank}
					<span class="flex gap-2 items-center justify-center">
						<span>{team.rank}</span>
						{#if team.rankChange === "Up"}
							<img src={ArrowUp} alt="up" class="size-8 fill-black" />
						{:else if team.rankChange === "Down"}
							<img src={ArrowDown} alt="down" class="size-8 fill-black" />
						{:else if team.rankChange === "NoChange"}
							<img src={NoChange} alt="no change" class="size-8 fill-black" />
						{/if}
					</span>
				{/if}
			</div>
		{/if}
	</div>
{/if}
