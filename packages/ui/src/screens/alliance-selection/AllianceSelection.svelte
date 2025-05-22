<script lang="ts">
	import { spring } from "svelte/motion";
	import { state } from "../../lib/state";
	import { createEventDispatcher, onMount } from "svelte";
	import SmallTopBar from "../../lib/SmallTopBar.svelte";

	let ready = false;
	const dispatcher = createEventDispatcher();
	export let exit = false;

	let shutterSpring = spring(120, {
		stiffness: 0.1,
		damping: 0.5,
	});

	onMount(() => {
		shutterSpring.set(50);
		setTimeout(() => {
			ready = true;
		}, 500);
	});

	$: if (exit) {
		shutterSpring.set(120);
		ready = false;
		setTimeout(() => {
			dispatcher("transitioned");
		}, 500);
	}

	$: console.log($state.ranking);
</script>

<div class="w-full h-full fixed bg-gray-800"></div>

<SmallTopBar eventNameOnly />

<div class="absolute top-32 gap-8 px-8 w-full grid grid-cols-[.6fr_.4fr]">
	<div class="flex flex-col gap-8">
		<div class="grid grid-rows-6 grid-flow-col gap-x-4 gap-y-2 text-2xl">
			{#each $state.ranking as team, index}
				{#if !team.unavailableForSelection}
					<div class="flex flex-row justify-between items-center bg-white border border-gray-800 rounded">
						<span class="bg-blue-800 text-white font-semibold w-full h-full py-2 px-3 text-center max-w-12">
							{team.rank}
						</span>
						<span class="text-gray-800 font-semibold p-2" class:bg-yellow-200={team.potentialCaptain}>
							{team.number}
						</span>
					</div>
				{/if}
			{/each}
		</div>

		<div class="w-full aspect-video bg-fuchsia-500 z-10 rounded"></div>
	</div>

	<div class="flex flex-col gap-4">
		{#each $state.alliances as alliance, index}
			<div class="w-full flex flex-row justify-between items-center gap-4 bg-white text-black text-2xl rounded text-left border border-gray-800 rounded">
				<span class="p-2 px-4 bg-blue-800 font-semibold text-white">{alliance.allianceNumber}</span>
				{#each alliance.teams as team, index}
					<span class="w-1/4">{team.number}</span>
				{/each}
				{#each [0, 0, 0, 0].slice(0, 3 - alliance.teams.length) as i}
					<!-- Placeholder for empty team slots -->
					<span class="w-1/4"></span>
				{/each}
			</div>
		{/each}
	</div>
</div>
