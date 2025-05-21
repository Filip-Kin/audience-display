<script lang="ts">
	import { state } from "../../lib/state";
	import { createEventDispatcher, onMount } from "svelte";
	import { spring, tweened } from "svelte/motion";
	import { matchName } from "../../lib/matchNamer";
	import { settings } from "../../lib/settings";
	import ScoreBarTimer from "./ScoreBarTimer.svelte";
	import ScoreBarHalf from "./ScoreBarHalf.svelte";

	let positionSpring = spring(-400, {
		stiffness: 0.1,
		damping: 0.3,
	});

	let wingSpring = spring(0, {
		stiffness: 0.01,
		damping: 0.4,
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
		setTimeout(() => {
			dispatcher("transitioned");
		}, 500);
	}

	onMount(() => {
		positionSpring.set(32);
		setTimeout(() => {
			wingSpring.set(100);
		}, 500);
		setTimeout(() => {
			opacityTween.set(1);
		}, 1200);
	});
</script>

{#if $state.match}
	<!-- Top bar with event name and match number -->
	<div class="fixed bg-gray-700 h-16 text-white flex justify-between mx-[15vw] w-[70vw]" style={`${$settings.top ? "bottom" : "top"}: ${$positionSpring}px`}>
		<span><!-- <img src="/sponsor.png" class="size-16" alt="sponsor" /> --></span>
		<div class="flex justify-center items-center">
			<div class="text-2xl font-bold text-center">
				{$state.eventDetails?.name || "Event Name"} - {matchName(
					$state.match.details.matchNumber,
					$state.eventDetails?.matchCount ?? 0,
					$state.match.details.matchType
				)}
			</div>
		</div>
		<span><!-- <img src="/pitpodcast.png" class="size-16" alt="sponsor" /> --></span>
	</div>

	<div
		class="fixed w-full flex items-stretch justify-center"
		style={`${$settings.top ? "top" : "bottom"}: ${$positionSpring}px`}
		class:flex-row-reverse={$settings.invert}
	>
		<!-- Red Alliance -->
		<ScoreBarHalf {wingSpring} {opacityTween} alliance="red" invert={$settings.invert} />

		<!-- Timer -->
		<ScoreBarTimer {wingSpring} />

		<!-- Blue Alliance -->
		<ScoreBarHalf {wingSpring} {opacityTween} alliance="blue" invert={!$settings.invert} />
	</div>
{/if}
