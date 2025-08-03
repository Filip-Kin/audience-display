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

	const secondsToMinutes = (seconds: number) => {
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
	};

	let numberOfTeams = $state.ranking.length;
	$: numberOfTeams = $state.ranking.filter((team) => !team.unavailableForSelection).length;

	let allianceSize = 3;
	$: for (const alliance of $state.alliances) {
		allianceSize = Math.max(allianceSize, alliance.teams.length);
	}
</script>

<div class="w-full fixed bg-gray-800 h-screen">
	<SmallTopBar eventNameOnly />

	<div class="absolute top-32 gap-4 px-8 w-full grid grid-cols-[.65fr_.35fr]">
		<div class="flex flex-col gap-4 h-full justify-between">
			<div
				class="grid grid-rows-{numberOfTeams > 35
					? '6'
					: numberOfTeams > 20
						? '5'
						: '4'} grid-flow-col gap-x-2 gap-y-2 tracking-tighter text-{numberOfTeams > 35 ? '3' : numberOfTeams > 20 ? '4' : '5'}xl"
			>
				{#each $state.ranking as team, index}
					{#if !team.unavailableForSelection}
						<div class="flex flex-row justify-between items-center bg-white border border-gray-800 rounded">
							<span
								class="bg-blue-800 text-white font-semibold h-full py-2 px-1 text-center {numberOfTeams > 35
									? 'w-12'
									: numberOfTeams > 20
										? 'w-18'
										: 'w-20'}"
							>
								{team.rank}
							</span>
							<span class="text-gray-800 font-semibold p-2" class:bg-yellow-200={team.potentialCaptain}>
								{team.number}
							</span>
						</div>
					{/if}
				{/each}
			</div>
			<!-- Camera greenscreen -->
			<div class="mb-2">
				<div class="max-h-[50vh] mx-auto aspect-video bg-fuchsia-500 z-10 rounded-xl"></div>
			</div>
		</div>

		<div class="flex flex-col gap-4 h-full">
			<div class="text-4xl text-center font-bold">Alliances</div>
			{#each $state.alliances as alliance, index}
				<div
					class="w-full flex flex-row justify-between items-center gap-4 bg-white text-black text-4xl font-semibold text-left border border-gray-800 rounded"
				>
					<span class="p-2 px-4 bg-blue-800 font-semibold text-white">{alliance.allianceNumber}</span>
					{#each alliance.teams as team, index}
						<span class="w-1/4">{team.number}</span>
					{/each}
					{#each [0, 0, 0, 0].slice(0, allianceSize - alliance.teams.length) as i}
						<!-- Placeholder for empty team slots -->
						<span class="w-1/4"></span>
					{/each}
				</div>
			{/each}

			<div class="flex gap-4 justify-around items-center">
				<div class="w-full">
					<!-- Space for sponsor / logo -->
					<img src="/logo.png" alt="Logo" class="size-full max-h-72 object-contain" style="animation-duration: 3s" />
				</div>

				<div class="h-full flex flex-col items-end justify-end">
					<!-- TODO: Selection Timer -->
					<div class="bg-black rounded-xl py-6 px-16 text-white font-bold text-7xl text-center flex flex-col gap-2">
						<span class="text-2xl">TIMER</span>
						<span>{secondsToMinutes($state.match?.timer ?? 0)}</span>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
