<script lang="ts">
	import { spring } from "svelte/motion";
	import { fade, fly } from "svelte/transition";
	import { state } from "../../lib/state";
	import { createEventDispatcher, onMount } from "svelte";
	import { matchName } from "../../lib/matchNamer";
	import { settings } from "../../lib/settings";
	import logo from "../../assets/rr-logo.png";

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
	class="w-full {$settings.invert ? 'bg-red-800' : 'bg-blue-800'} h-full fixed -skew-x-12 flex flex-row justify-end"
	style={`right: ${$shutterSpring}vw`}
></div>

<div
	class="w-full {$settings.invert ? 'bg-blue-800' : 'bg-red-800'} h-full fixed -skew-x-12 flex flex-row justify-start"
	style={`left: ${$shutterSpring}vw`}
></div>

<div class="fixed flex flex-col w-full h-full justify-around">
	<div class="w-full flex flex-row justify-around py-16">
		{#if $state.match}
			{#if ready}
				<div class="bg-black min-w-96 rounded px-32 py-8 text-center text-3xl" in:fly={{ y: -50, duration: 100 }} out:fade={{ duration: 100 }}>
					<span class="text-transparent bg-clip-text bg-gradient-to-r rainbow-gradient font-bold">
						{$state.eventDetails?.name || "Event Name"} - {matchName(
							$state.match.details.matchNumber,
							$state.eventDetails?.matchCount ?? 0,
							$state.match.details.matchType
						)}
					</span>
				</div>
			{/if}
		{/if}
	</div>

	{#if ready}
		<img src={logo} alt="Logo" class="animate-spin size-48 mx-auto" in:fly={{ y: 100, duration: 300 }} out:fly={{ y: -400, duration: 200 }} />
	{/if}
</div>

<style>
	.rainbow-gradient {
		background-image: linear-gradient(90deg, #ff0000, #ff8000, #ffff00, #80ff00, #00ff00, #00ff80, #00ffff, #0080ff);
	}
</style>
