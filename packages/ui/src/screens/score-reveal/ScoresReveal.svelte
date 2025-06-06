<script lang="ts">
	import { spring } from "svelte/motion";
	import { fade, fly } from "svelte/transition";
	import { state } from "../../lib/state";
	import { createEventDispatcher, onMount } from "svelte";
	import { matchName } from "../../lib/matchNamer";
	import { settings } from "../../lib/settings";
	import TeamCard from "../../lib/TeamCard.svelte";
	import RankingPoints from "./RankingPoints.svelte";

	let ready = false;
	const dispatcher = createEventDispatcher();
	export let exit = false;

	let animation: string;
	let videoElm: HTMLVideoElement;

	let shutterSpring = spring(120, {
		stiffness: 0.1,
		damping: 0.5,
	});

	onMount(() => {
		if ($state.match?.score.winner) {
			switch ($state.match?.score.winner) {
				case "Red":
					animation = "/animations/redwins.mp4";
					break;
				case "Blue":
					animation = "/animations/bluewins.mp4";
					break;
				case "Tie":
					animation = "/animations/tie.mp4";
			}
		}

		videoElm.style.display = "block";

		videoElm.addEventListener("canplay", () => {
			videoElm.play();

			dispatcher("loaded");

			setTimeout(
				() => {
					ready = true;
					shutterSpring.set(50);
				},
				videoElm.duration * 1000 - 500
			);
		});
	});

	$: if (exit) {
		videoElm.style.display = "none";
		shutterSpring.set(120);
		ready = false;
		setTimeout(() => {
			dispatcher("transitioned");
		}, 500);
	}

	$: console.log($state);
</script>

<div class="fixed w-full h-full">
	<video class="w-full h-full object-contain" bind:this={videoElm}>
		<track kind="captions" srclang="en" label="English" />
		<source src={animation} type="video/mp4" />
	</video>
</div>

<div class="w-full bg-primary-800 h-full fixed -skew-x-12 flex flex-row justify-start" style={`right: ${$shutterSpring}vw`}></div>

{#if ready}
	<div
		class="w-screen fixed top-16 grid grid-cols-[20rem_auto_20rem] justify-between items-center px-36 z-10 gap-4"
		in:fade={{ duration: 200 }}
		out:fade={{ duration: 200 }}
	>
		<span class="text-3xl font-bold text-center">Event Sponsored By</span>
		<span></span>
		<span class="text-3xl font-bold text-center">Live Stream Partner</span>
		<img src="/sponsor2.png" class="w-56 mx-auto" alt="sponsor" />
		<span></span>
		<img src="/pitpodcast.png" class="w-56 mx-auto" alt="sponsor" />
	</div>
{/if}

<div class="w-full bg-primary-700 h-full fixed -skew-x-12 flex flex-row justify-start" style={`left: ${$shutterSpring}vw`}></div>

<div class="fixed z-10 flex flex-col w-full h-full justify-around">
	<div class="w-full flex flex-row justify-around py-8">
		{#if $state.match}
			{#if ready}
				<div class="min-w-96 text-center text-3xl" in:fly={{ y: -50, duration: 100 }} out:fade={{ duration: 100 }}>
					<div class="bg-black py-6 px-32 rounded-t">
						<span class="text-secondary-600 font-bold">
							{$state.eventDetails?.name || "Event Name"} - {matchName(
								$state.match.details.matchNumber,
								$state.eventDetails?.matchCount ?? 0,
								$state.match.details.matchType
							)}
						</span>
					</div>
					<div class="flex" class:flex-row-reverse={$settings.invert}>
						<div class="bg-blue-600 w-1/2 text-center flex flex-col justify-center py-4">
							<span class="text-white font-bold">Blue</span>
							<span class="text-5xl font-bold">{$state.match?.score.blue.score}</span>
						</div>
						<div class="bg-red-600 w-1/2 text-center flex flex-col justify-center py-4">
							<span class="text-white font-bold">Red</span>
							<span class="text-5xl font-bold">{$state.match?.score.red.score}</span>
						</div>
					</div>
				</div>
			{/if}
		{/if}
	</div>

	<div class="w-full h-full flex flex-row justify-around" class:flex-row-reverse={$settings.invert}>
		<div class="w-[30%] flex flex-col gap-4 justify-center">
			{#if $state.match}
				{#each $state.match.teams.blue as team, index}
					<TeamCard alliance="blue" {ready} {index} {team} invert={!$settings.invert} />
				{/each}

				<RankingPoints {ready} alliance="blue" invert={!$settings.invert} />
			{/if}
		</div>

		{#if ready}
			<div class="w-1/4 flex flex-col items-center">
				<div
					class="w-full h-fit -mt-8 justify-around bg-white text-black font-semibold text-3xl flex flex-col text-center"
					in:fade={{ duration: 100 }}
					out:fade={{ duration: 100 }}
				>
					<div class="grid grid-cols-[.25fr_.5fr_.25fr] even:bg-gray-200 p-4">
						<span>{$state.match?.score.blue.autoMobility}</span>
						<span>Auto Leave</span>
						<span>{$state.match?.score.red.autoMobility}</span>
					</div>

					<div class="grid grid-cols-[.25fr_.5fr_.25fr] even:bg-gray-200 p-4">
						<span>{$state.match?.score.blue.coral}</span>
						<span>Coral</span>
						<span>{$state.match?.score.red.coral}</span>
					</div>

					<div class="grid grid-cols-[.25fr_.5fr_.25fr] even:bg-gray-200 p-4">
						<span>{$state.match?.score.blue.algae}</span>
						<span>Algae</span>
						<span>{$state.match?.score.red.algae}</span>
					</div>
					<div class="grid grid-cols-[.25fr_.5fr_.25fr] even:bg-gray-200 p-4">
						<span>{$state.match?.score.blue.algae}</span>
						<span>Algae</span>
						<span>{$state.match?.score.red.algae}</span>
					</div>

					<div class="grid grid-cols-[.25fr_.5fr_.25fr] even:bg-gray-200 p-4">
						<span>{$state.match?.score.blue.barge}</span>
						<span>Barge</span>
						<span>{$state.match?.score.red.barge}</span>
					</div>

					<div class="grid grid-cols-[.25fr_.5fr_.25fr] even:bg-gray-200 p-4">
						<span>{$state.match?.score.blue.fouls}</span>
						<span>Penalty</span>
						<span>{$state.match?.score.red.fouls}</span>
					</div>
				</div>

				<img src="/logo.png" alt="logo" class="size-96" in:fly={{ y: 200, duration: 500 }} out:fly={{ y: -400, duration: 200 }} />
			</div>
		{/if}

		<div class="w-[30%] flex flex-col gap-4 justify-center">
			{#if $state.match}
				{#each $state.match.teams.red as team, index}
					<TeamCard alliance="red" {ready} {index} {team} invert={$settings.invert} />
				{/each}

				<RankingPoints {ready} alliance="red" invert={$settings.invert} />
			{/if}
		</div>
	</div>
</div>
