<script lang="ts">
	import { state } from "../../../../lib/state";
	import { createEventDispatcher, onMount } from "svelte";
	import { spring, tweened } from "svelte/motion";
	import { settings } from "../../../../lib/settings";
	import ScoreBarTimer from "./ScoreBarTimer.svelte";
	import ScoreBarHalf from "./ScoreBarHalf.svelte";
	import ShiftProgress from "./ShiftProgress.svelte";
	import HubActiveIndicator from "./HubActiveIndicator.svelte";
	import SmallTopBar from "../../../../lib/SmallTopBar.svelte";
	import Logo from "../../../../lib/Logo.svelte";
	import { fade } from "svelte/transition";

	let positionSpring = spring(-400, {
		stiffness: 0.1,
		damping: 0.3,
	});

	let wingSpring = spring(0, {
		stiffness: 0.01,
		damping: 0.4,
	});

	let logoSpring = spring(0, {
		stiffness: 0.01,
		damping: 0.3,
	});

	let opacityTween = tweened(0, {
		duration: 500,
	});

	const dispatcher = createEventDispatcher();
	let ready = false;
	export let exit = false;

	$: if (exit) {
		positionSpring.set(-400);
		wingSpring.set(0);
		opacityTween.set(0);
		logoSpring.set(40);
		ready = false;
		setTimeout(() => {
			dispatcher("transitioned");
		}, 500);
	}

	onMount(() => {
		logoSpring.set(0);
		positionSpring.set(32);
		ready = true;
		setTimeout(() => {
			wingSpring.set(100);
			logoSpring.set(100);
		}, 500);
		setTimeout(() => {
			opacityTween.set(1);
		}, 1200);
	});
</script>

{#if $state.match}
	<!-- Top bar with event name and match number -->
	<SmallTopBar {positionSpring} />

	{#if ready}
		<div class="w-screen h-screen flex justify-center items-end">
			<div
				class="size-32 z-10 flex"
				style={`transform: translateY(calc(${($logoSpring / 100) * 44.5}vh - 120px - 50vh)) scale(${480 - ($logoSpring / 100) * 300}%)`}
				in:fade={{ duration: 300 }}
				out:fade={{ duration: 300 }}
			>
				<Logo alt="" class="size-full object-contain" />
			</div>
		</div>
	{/if}

	<HubActiveIndicator />

	<div
		class="fixed w-full flex flex-col items-stretch h-[180px]"
		style={`${$settings.top ? "top" : "bottom"}: ${$positionSpring}px`}
	>
		<!-- Shift progress bar above the score bar -->
		<div class="w-full h-3 mb-1">
			<ShiftProgress />
		</div>
		<div class="flex items-stretch justify-center h-[156px]" class:flex-row-reverse={$settings.invert}>
			<!-- Red Alliance -->
			<ScoreBarHalf {wingSpring} {opacityTween} alliance="red" invert={$settings.invert} />

			<!-- Timer -->
			<ScoreBarTimer {wingSpring} />

			<!-- Blue Alliance -->
			<ScoreBarHalf {wingSpring} {opacityTween} alliance="blue" invert={!$settings.invert} />
		</div>
	</div>
{/if}
