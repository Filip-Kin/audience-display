<script lang="ts">
	import { spring } from "svelte/motion";
	import { fade, fly } from "svelte/transition";
	import { state } from "../../lib/state";
	import { createEventDispatcher, onMount } from "svelte";
	import { matchName } from "../../lib/matchNamer";
	import { defaultAvatar } from "./avatar";
	import RobotShadow from "./RobotShadow.svelte";

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
		}, 1500);
	});

	$: if (exit) {
		shutterSpring.set(120);
		ready = false;
		setTimeout(() => {
			dispatcher("transitioned");
		}, 500);
	}

	$: console.log($state.eventDetails);
</script>

<div class="w-full bg-primary-800 h-full fixed -skew-x-12 flex flex-row justify-end" style={`right: ${$shutterSpring}vw`}>
	<div id="shadows" class="skew-x-12 flex flex-col w-1/2 items-center justify-center">
		{#if $state.match}
			{#each $state.match.teams.red as team}
				<RobotShadow color="red" teamNumber={team.number} />
			{/each}
		{/if}
	</div>
</div>
<div class="w-full bg-secondary-600 h-full fixed -skew-x-12 flex flex-row justify-start" style={`left: ${$shutterSpring}vw`}>
	<div id="shadows" class="skew-x-12 flex flex-col w-1/2 items-center justify-center">
		{#if $state.match}
			{#each $state.match.teams.blue as team}
				<RobotShadow color="blue" teamNumber={team.number} />
			{/each}
		{/if}
	</div>
</div>

<div class="fixed flex flex-col w-full h-full justify-around">
	<div class="w-full flex flex-row justify-around py-16">
		{#if $state.match}
			{#if ready}
				<div class="bg-black min-w-96 rounded px-32 py-8 text-center text-3xl" in:fly={{ y: -50, duration: 100 }} out:fade={{ duration: 100 }}>
					<span class="text-transparent bg-clip-text bg-gradient-to-r text-white font-bold">
						{matchName($state.match.details.matchNumber, $state.eventDetails?.matchCount ?? 0, $state.match.details.matchType)}
					</span>
				</div>
			{/if}
		{/if}
	</div>
	<div class="w-full h-full flex flex-row justify-around">
		<div class="w-1/3 flex flex-col gap-8 justify-center">
			{#if $state.match}
				{#each $state.match.teams.red as team, index}
					{#if ready}
						<div
							class="flex flex-col shadow-xl"
							in:fly={{
								x: -100,
								duration: 500,
								delay: 150 * index,
							}}
							out:fly={{
								x: -400,
								duration: 100,
							}}
						>
							<div class="flex flex-row bg-red-600 text-white p-4 text-xl gap-4 align-middle">
								<div style="width: 40px; height: 40px">
									<img src="data:image/png;base64,{team.avatar || defaultAvatar}" alt="{team.number} Icon" width="40px" height="40px" />
								</div>
								<span class="text-3xl">{team.number}</span>
							</div>
							<div class="flex bg-white text-black p-4 text-2xl font-bold">
								<span>{team.name}</span>
							</div>
						</div>
					{/if}
				{/each}
			{/if}
		</div>
		<div class="w-1/3 flex flex-col gap-8 justify-center">
			{#if $state.match}
				{#each $state.match.teams.blue as team, index}
					{#if ready}
						<div
							class="flex flex-col shadow-xl"
							in:fly={{
								x: 100,
								duration: 500,
								delay: 150 * index,
							}}
							out:fly={{
								x: 400,
								duration: 100,
							}}
						>
							<div class="flex flex-row bg-blue-600 text-white p-4 text-xl gap-4 align-middle">
								<div style="width: 40px; height: 40px">
									<img src="data:image/png;base64,{team.avatar || defaultAvatar}" alt="{team.number} Icon" width="40px" height="40px" />
								</div>
								<span class="text-3xl">{team.number}</span>
							</div>
							<div class="flex bg-white text-black p-4 text-2xl font-bold">
								<span>{team.name}</span>
							</div>
						</div>
					{/if}
				{/each}
			{/if}
		</div>
	</div>
</div>

<style>
	.rainbow-gradient {
		background-image: linear-gradient(90deg, #ff0000, #ff8000, #ffff00, #80ff00, #00ff00, #00ff80, #00ffff, #0080ff);
	}
</style>
