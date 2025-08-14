<script lang="ts">
	import { spring } from "svelte/motion";
	import { fade, fly } from "svelte/transition";
	import { state } from "../../lib/state";
	import { createEventDispatcher, onMount } from "svelte";
	import { displayEventName, matchName } from "../../lib/matchNamer";
	import { settings } from "../../lib/settings";
	import TeamCard from "../../lib/TeamCard.svelte";

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

	$: console.log($state.eventDetails);
</script>

<div
	class="w-full {$settings.invert ? 'bg-primary-700' : 'bg-secondary-600'} h-full fixed -skew-x-12 flex flex-row justify-end"
	style={`right: ${$shutterSpring}vw`}
></div>

<div
	class="w-full {$settings.invert ? 'bg-secondary-600' : 'bg-primary-700'} h-full fixed -skew-x-12 flex flex-row justify-start"
	style={`left: ${$shutterSpring}vw`}
></div>

<div class="fixed flex flex-col w-full h-full justify-around">
	<div class="w-full flex flex-row justify-around py-8">
		{#if $state.match}
			{#if ready}
				<div
					class="bg-black min-w-96 rounded px-32 py-8 text-center text-5xl max-w-[60vw]"
					in:fly={{ y: -50, duration: 100 }}
					out:fade={{ duration: 100 }}
				>
					<span class="text-primary-500 font-bold">
						{displayEventName($state.eventDetails?.name)}
						{matchName($state.match.details.matchNumber, $state.eventDetails?.matchCount ?? 0, $state.match.details.matchType)}
					</span>
				</div>
			{/if}
		{/if}
	</div>

	<div class="w-full h-full flex flex-row justify-around" class:flex-row-reverse={$settings.invert}>
		{#if $state.match}
			<div class="w-1/3 flex flex-col justify-center {$state.match.teams.blue.length > 3 ? 'gap-4' : 'gap-8'}">
				{#if $state.match.details.blueAlliance}
					{#if ready}
						<div
							class="flex flex-col shadow-lg rounded overflow-hidden"
							in:fly={{
								x: 100 * ($settings.invert ? 1 : -1),
								duration: 500,
								delay: 0,
							}}
							out:fly={{
								x: 400 * ($settings.invert ? 1 : -1),
								duration: 100,
							}}
						>
							<div class="flex flex-row bg-blue-600 text-white p-4 gap-4 align-middle text-5xl font-semibold justify-center">
								{$state.match.details.blueAlliance}
							</div>
						</div>
					{/if}
				{/if}
				{#each $state.match.teams.blue as team, index}
					<TeamCard alliance="blue" {ready} {index} {team} invert={!$settings.invert} />
				{/each}
			</div>
		{/if}

		{#if $state.match}
			<div class="w-1/3 flex flex-col justify-center {$state.match.teams.red.length > 3 ? 'gap-4' : 'gap-8'}">
				{#if $state.match.details.redAlliance}
					{#if ready}
						<div
							class="flex flex-col shadow-lg rounded overflow-hidden"
							in:fly={{
								x: 100 * ($settings.invert ? -1 : 1),
								duration: 500,
								delay: 0,
							}}
							out:fly={{
								x: 400 * ($settings.invert ? -1 : 1),
								duration: 100,
							}}
						>
							<div class="flex flex-row bg-red-600 text-white p-4 gap-4 align-middle text-5xl font-semibold justify-center">
								{$state.match.details.redAlliance}
							</div>
						</div>
					{/if}
				{/if}

				{#each $state.match.teams.red as team, index}
					<TeamCard alliance="red" {ready} {index} {team} invert={$settings.invert} />
				{/each}
			</div>
		{/if}
	</div>
</div>
