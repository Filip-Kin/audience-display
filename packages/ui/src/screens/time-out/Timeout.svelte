<script lang="ts">
	import { spring } from "svelte/motion";
	import { state } from "../../lib/state";
	import { createEventDispatcher, onMount } from "svelte";
	import SmallTopBar from "../../lib/SmallTopBar.svelte";
	import { matchName } from "../../lib/matchNamer";

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
</script>

<SmallTopBar eventNameOnly />

<div class="w-full h-48 bottom-0 fixed flex justify-center">
	<div class="bg-primary-800 max-w-5xl h-32 rounded-xl mt-0 flex items-center justify-around py-4 px-12 gap-12">
		<div class="h-full">
			<!-- Space for sponsor / logo -->
			<img src="/logo.png" alt="Logo" class="size-full h-32 -mt-5 object-contain" />
		</div>

		<div class="flex flex-col gap-4">
			<div class="text-white font-bold text-3xl">Timeout</div>
			<div class="text-white font-bold text-3xl">
				<span>Up Next: </span>
				<span
					>{#if $state.match}{matchName(
							$state.match.details.matchNumber,
							$state.eventDetails?.matchCount ?? 0,
							$state.match.details.matchType
						)}{/if}</span
				>
			</div>
		</div>

		<div class="bg-black rounded-xl h-full px-8 text-white font-bold text-4xl text-center flex flex-col gap-2 justify-center">
			<span class="text-xl">TIMER</span>
			<span>{secondsToMinutes($state.match?.timer ?? 0)}</span>
		</div>
	</div>
</div>
