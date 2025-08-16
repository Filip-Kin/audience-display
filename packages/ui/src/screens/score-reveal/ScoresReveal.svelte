<script lang="ts">
	import { spring } from "svelte/motion";
	import { fade, fly } from "svelte/transition";
	import { state } from "../../lib/state";
	import { createEventDispatcher, onMount } from "svelte";
	import { displayEventName, matchName } from "../../lib/matchNamer";
	import { settings } from "../../lib/settings";
	import TeamCard from "../../lib/TeamCard.svelte";
	import RankingPoints from "./RankingPoints.svelte";
	import Trophy from "../../assets/trophy.svg";
	import Star from "../../assets/star.svg";
	import Alliance from "./Alliance.svelte";
	import SmallTopBar from "../../lib/SmallTopBar.svelte";

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
		if ($state.results?.score.winner) {
			switch ($state.results?.score.winner) {
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

<div
	class="w-full {$settings.invert ? 'bg-primary-700' : 'bg-secondary-600'} h-full fixed -skew-x-12 flex flex-row justify-start"
	style={`right: ${$shutterSpring}vw`}
></div>

<div
	class="w-full {$settings.invert ? 'bg-secondary-600' : 'bg-primary-700'} h-full fixed -skew-x-12 flex flex-row justify-start"
	style={`left: ${$shutterSpring}vw`}
></div>

<!-- Top title bar -->
{#if $state.results && ready}
	<div class="fixed z-10 flex w-full justify-center">
		<div
			class="mt-8 h-32 bg-black rounded text-4xl max-w-5xl text-center flex flex-col justify-center px-8"
			in:fly={{ y: -50, duration: 200 }}
			out:fade={{ duration: 100 }}
		>
			<p class="text-primary-500 font-bold text-4xl">2025 Michigan Advanced Robotics Competition</p>
			<p class="text-primary-500 font-bold">
				{matchName($state.results.details.matchNumber, $state.eventDetails?.matchCount ?? 0, $state.results.details.matchType)}
			</p>
		</div>
	</div>
{/if}

<div class="fixed z-10 grid grid-cols-[.36fr_.28fr_.36fr] w-full h-full p-8 gap-8" class:flex-row-reverse={$settings.invert}>
	{#if $state.results && ready}
		<!-- Cell 1 event/sponsor logo -->
		<img src="/logo.png" class="size-60 mx-auto self-center" alt="sponsor" in:fade={{ duration: 200 }} out:fade={{ duration: 200 }} />

		<!-- Cell 2 spans 2 rows, match results -->
		<div class="flex flex-col row-span-2 pt-32">
			<!-- pt-32 matches title bar height -->
			<div class="max-w-3xl text-center text-6xl" in:fly={{ y: -50, duration: 200 }} out:fade={{ duration: 100 }}>
				<div class="flex" class:flex-row-reverse={$settings.invert}>
					<div class="bg-blue-600 w-1/2 text-center flex flex-col justify-center pb-6 pt-3 text-3xl">
						<span class="text-white font-bold">Blue</span>
						<span class="text-8xl font-bold pt-2">{$state.results?.score.blue.score}</span>
					</div>
					<div class="bg-red-600 w-1/2 text-center flex flex-col justify-center pb-6 pt-3 text-3xl">
						<span class="text-white font-bold">Red</span>
						<span class="text-8xl font-bold pt-2">{$state.results?.score.red.score}</span>
					</div>
				</div>

				{#if $state.results.score.red.isHighScore || $state.results.score.blue.isHighScore}
					<div class="w-full h-16 flex flex-row bg-amber-500 gap-4 items-center text-white text-4xl font-bold justify-center">
						<img src={Star} alt="Star" class="size-12 star-cw" />
						<span class="align-middle">High Score!</span>
						<img src={Star} alt="Star" class="size-12 star-ccw" />
					</div>
				{/if}
			</div>

			<div class="flex flex-col items-center">
				<div
					class="w-full h-fit justify-around bg-white text-black font-semibold text-5xl flex flex-col text-center"
					in:fade={{ duration: 250 }}
					out:fade={{ duration: 100 }}
				>
					<div class="grid grid-cols-[.2fr_.6fr_.2fr] even:bg-gray-200 px-2 py-3">
						<span>{$state.results?.score[$settings.invert ? "red" : "blue"].autoMobility}</span>
						<span>Auto Leave</span>
						<span>{$state.results?.score[$settings.invert ? "blue" : "red"].autoMobility}</span>
					</div>

					<div class="grid grid-cols-[.2fr_.6fr_.2fr] even:bg-gray-200 px-2 py-3">
						<span>{$state.results?.score[$settings.invert ? "red" : "blue"].coral}</span>
						<span>Coral</span>
						<span>{$state.results?.score[$settings.invert ? "blue" : "red"].coral}</span>
					</div>

					<div class="grid grid-cols-[.2fr_.6fr_.2fr] even:bg-gray-200 px-2 py-3">
						<span>{$state.results?.score[$settings.invert ? "red" : "blue"].algae}</span>
						<span>Algae</span>
						<span>{$state.results?.score[$settings.invert ? "blue" : "red"].algae}</span>
					</div>

					<div class="grid grid-cols-[.2fr_.6fr_.2fr] even:bg-gray-200 px-2 py-3">
						<span>{$state.results?.score[$settings.invert ? "red" : "blue"].barge}</span>
						<span>Barge</span>
						<span>{$state.results?.score[$settings.invert ? "blue" : "red"].barge}</span>
					</div>

					<div class="grid grid-cols-[.2fr_.6fr_.2fr] even:bg-gray-200 px-2 py-3">
						<span>{$state.results?.score[$settings.invert ? "red" : "blue"].fouls}</span>
						<span>Penalty</span>
						<span>{$state.results?.score[$settings.invert ? "blue" : "red"].fouls}</span>
					</div>
				</div>

				<!-- <img src="/logo.png" alt="logo" class="size-80" in:fly={{ y: 200, duration: 500 }} out:fly={{ y: -400, duration: 200 }} /> -->
			</div>
		</div>

		<img src="/pitpodcast.png" class="size-60 mx-auto self-center" alt="sponsor" in:fade={{ duration: 200 }} out:fade={{ duration: 200 }} />

		<div in:fly={{ x: -100, duration: 200, delay: 100 }} out:fade={{ duration: 100 }}>
			<Alliance {ready} alliance={$settings.invert ? "red" : "blue"} invert={$settings.invert} />
		</div>
		<div in:fly={{ x: 100, duration: 200, delay: 100 }} out:fade={{ duration: 100 }}>
			<Alliance {ready} alliance={$settings.invert ? "blue" : "red"} invert={!$settings.invert} />
		</div>
	{/if}
</div>
