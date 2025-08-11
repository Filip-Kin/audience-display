<script lang="ts">
	import { spring } from "svelte/motion";
	import { blur, fade, fly } from "svelte/transition";
	import { state } from "../../lib/state";
	import { createEventDispatcher, onMount } from "svelte";
	import { displayEventName, matchName } from "../../lib/matchNamer";
	import { settings } from "../../lib/settings";

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

<div class="w-full bg-{$settings.invert ? 'red' : 'blue'}-800 h-full fixed -skew-x-12 flex flex-row justify-end" style={`right: ${$shutterSpring}vw`}></div>

<div class="w-full bg-{$settings.invert ? 'blue' : 'red'}-800 h-full fixed -skew-x-12 flex flex-row justify-start" style={`left: ${$shutterSpring}vw`}></div>

<div class="fixed flex flex-col w-full h-full justify-around">
	<div class="w-full flex flex-row justify-around py-16">
		{#if $state.match}
			{#if ready}
				<div class="bg-black min-w-96 rounded px-32 py-8 text-center text-3xl" in:fly={{ y: -50, duration: 100 }} out:fade={{ duration: 100 }}>
					<span class="text-primary-500 font-bold">
						{displayEventName($state.eventDetails?.name)}
						{matchName($state.match.details.matchNumber, $state.eventDetails?.matchCount ?? 0, $state.match.details.matchType)}
					</span>
				</div>
			{/if}
		{/if}
	</div>

	{#if ready}
		<div class="w-full flex justify-center" in:fly={{ y: -400, duration: 200 }} out:fly={{ y: 100, duration: 300 }}>
			<div class:glint-wrapper={$state.screen === "scores-ready"}>
				<img src="/logo.png" alt="Logo" class="size-96 mx-auto" class:glint-image={$state.screen === "scores-ready"} style="animation-duration: 2s;" />
			</div>
		</div>
	{/if}
</div>
