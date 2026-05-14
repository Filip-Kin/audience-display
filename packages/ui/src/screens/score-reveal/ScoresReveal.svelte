<script lang="ts">
	import { spring } from "svelte/motion";
	import { fade, fly } from "svelte/transition";
	import { state } from "../../lib/state";
	import { createEventDispatcher, onMount } from "svelte";
	import { displayEventName, matchName } from "../../lib/matchNamer";
	import { settings } from "../../lib/settings";
	import Alliance from "./Alliance.svelte";
	import EventHighScoreBanner from "./EventHighScoreBanner.svelte";
	import MatchUnderReviewOverlay from "./MatchUnderReviewOverlay.svelte";
	import TiebreakerBar from "./TiebreakerBar.svelte";
	import Logo from "../../lib/Logo.svelte";
	import { packUrl } from "../../lib/animation_pack.js";

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
			const cfg = $state.eventConfig;
			const name = $state.activeConfigName;
			switch ($state.results?.score.winner) {
				case "Red":
					animation = packUrl(cfg, name, "victoryRed");
					break;
				case "Blue":
					animation = packUrl(cfg, name, "victoryBlue");
					break;
				case "Tie":
					animation = packUrl(cfg, name, "victoryTie");
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

		videoElm.addEventListener("error", () => {
			if (animation && !animation.includes("/animations/default/")) {
				const winner = $state.results?.score.winner;
				if (winner === "Red") animation = "/animations/default/redwins.mp4";
				else if (winner === "Blue") animation = "/animations/default/bluewins.mp4";
				else if (winner === "Tie") animation = "/animations/default/tie.mp4";
				videoElm.load();
			}
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

	$: redScore = $state.results?.score.red;
	$: blueScore = $state.results?.score.blue;
	$: highScoreVisible = !!(redScore?.isHighScore || blueScore?.isHighScore);
	$: tiebreaker = $state.results?.tiebreaker;
	$: sponsors = $state.eventConfig?.assets.sponsors ?? [];
	$: activeName = $state.activeConfigName;
</script>

<MatchUnderReviewOverlay visible={!!$state.results?.underReview} />

<div class="fixed w-full h-full">
	<video class="w-full h-full object-contain" bind:this={videoElm}>
		<track kind="captions" srclang="en" label="English" />
		<source src={animation} type="video/mp4" />
	</video>
</div>

<div
	class="w-full {$settings.invert ? 'bg-primary' : 'bg-secondary'} h-full fixed -skew-x-12 flex flex-row justify-end"
	style={`right: ${$shutterSpring}vw`}
></div>

<div
	class="w-full {$settings.invert ? 'bg-secondary' : 'bg-primary'} h-full fixed -skew-x-12 flex flex-row justify-start"
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
			<p class="text-accentWarn font-bold text-4xl">
				{displayEventName($state.eventDetails?.name)}
			</p>
			<p class="text-accentWarn font-bold">
				{matchName($state.results.details.matchNumber, $state.eventDetails?.matchCount ?? 0, $state.results.details.matchType)}
			</p>
		</div>
	</div>
{/if}

<div class="fixed z-10 grid grid-cols-[.36fr_.28fr_.36fr] w-full h-full p-8 gap-8" class:flex-row-reverse={$settings.invert}>
	{#if $state.results && ready}
		<!-- Cell 1: left sponsors column -->
		<div>
			{#if sponsors[0] && activeName}
				<h2 class="text-4xl text-center font-bold mb-4" in:fly={{ y: -50, duration: 200 }} out:fade={{ duration: 100 }}>Event Sponsors</h2>
				<img src={`/configs/${activeName}/${sponsors[0]}`} class="h-60 mx-auto self-center object-contain" alt="sponsor" in:fade={{ duration: 200 }} out:fade={{ duration: 200 }} />
			{/if}
		</div>

		<!-- Cell 2: center match results, spans 2 rows -->
		<div class="flex flex-col row-span-2 pt-32">
			<div class="max-w-3xl text-center text-6xl mx-auto w-full" in:fly={{ y: -50, duration: 200 }} out:fade={{ duration: 100 }}>
				<TiebreakerBar {tiebreaker} />
				<div class="flex" class:flex-row-reverse={$settings.invert}>
					<div class="bg-blueAlliance w-1/2 text-center flex flex-col justify-center pb-6 pt-3 text-3xl">
						<span class="text-white font-bold">Blue</span>
						<span class="text-8xl font-bold pt-2">{$state.results?.score.blue.score}</span>
						{#if $state.results.details.blueSeriesWins !== undefined}
							<span class="text-lg opacity-80">Series: {$state.results.details.blueSeriesWins}</span>
						{/if}
					</div>
					<div class="bg-redAlliance w-1/2 text-center flex flex-col justify-center pb-6 pt-3 text-3xl">
						<span class="text-white font-bold">Red</span>
						<span class="text-8xl font-bold pt-2">{$state.results?.score.red.score}</span>
						{#if $state.results.details.redSeriesWins !== undefined}
							<span class="text-lg opacity-80">Series: {$state.results.details.redSeriesWins}</span>
						{/if}
					</div>
				</div>

				<EventHighScoreBanner visible={highScoreVisible} />
			</div>

			<div class="flex flex-col items-center">
				<div
					class="w-full max-w-3xl mx-auto h-fit justify-around bg-white text-black font-semibold text-4xl flex flex-col text-center"
					in:fade={{ duration: 250 }}
					out:fade={{ duration: 100 }}
				>
					<div class="grid grid-cols-[.2fr_.6fr_.2fr] even:bg-gray-200 px-2 py-2">
						<span class="tabular-nums">{$state.results?.score[$settings.invert ? "red" : "blue"].autoFuelPoints}</span>
						<span>Auto Fuel</span>
						<span class="tabular-nums">{$state.results?.score[$settings.invert ? "blue" : "red"].autoFuelPoints}</span>
					</div>
					<div class="grid grid-cols-[.2fr_.6fr_.2fr] even:bg-gray-200 px-2 py-2">
						<span class="tabular-nums">{$state.results?.score[$settings.invert ? "red" : "blue"].teleopFuelPoints}</span>
						<span>Teleop Fuel</span>
						<span class="tabular-nums">{$state.results?.score[$settings.invert ? "blue" : "red"].teleopFuelPoints}</span>
					</div>
					<div class="grid grid-cols-[.2fr_.6fr_.2fr] even:bg-gray-200 px-2 py-2">
						<span class="tabular-nums">{$state.results?.score[$settings.invert ? "red" : "blue"].autoClimbPoints}</span>
						<span>Auto Climb</span>
						<span class="tabular-nums">{$state.results?.score[$settings.invert ? "blue" : "red"].autoClimbPoints}</span>
					</div>
					<div class="grid grid-cols-[.2fr_.6fr_.2fr] even:bg-gray-200 px-2 py-2">
						<span class="tabular-nums">{$state.results?.score[$settings.invert ? "red" : "blue"].endgameClimbPoints}</span>
						<span>Endgame Climb</span>
						<span class="tabular-nums">{$state.results?.score[$settings.invert ? "blue" : "red"].endgameClimbPoints}</span>
					</div>
					<div class="grid grid-cols-[.2fr_.6fr_.2fr] even:bg-gray-200 px-2 py-2">
						<span class="tabular-nums">{$state.results?.score[$settings.invert ? "red" : "blue"].foulPoints}</span>
						<span>Penalty</span>
						<span class="tabular-nums">{$state.results?.score[$settings.invert ? "blue" : "red"].foulPoints}</span>
					</div>
				</div>

				<div
					in:fly={{ y: 200, duration: 500 }}
					out:fly={{ y: -400, duration: 200 }}
				>
					<Logo alt="logo" class="h-72 mt-8 object-contain" />
				</div>
			</div>
		</div>

		<!-- Cell 3: right sponsors column -->
		<div>
			{#if sponsors[1] && activeName}
				<h2 class="text-4xl text-center font-bold mb-4" in:fly={{ y: -50, duration: 200 }} out:fade={{ duration: 100 }}>Livestream Partner</h2>
				<img src={`/configs/${activeName}/${sponsors[1]}`} class="size-60 mx-auto self-center object-contain" alt="sponsor" in:fade={{ duration: 200 }} out:fade={{ duration: 200 }} />
			{/if}
		</div>

		<!-- Bottom-left: alliance card (blue or red depending on invert) -->
		<div in:fly={{ x: -100, duration: 200, delay: 100 }} out:fade={{ duration: 100 }}>
			<Alliance {ready} alliance={$settings.invert ? "red" : "blue"} invert={$settings.invert} />
		</div>

		<!-- Bottom-right: alliance card -->
		<div in:fly={{ x: 100, duration: 200, delay: 100 }} out:fade={{ duration: 100 }}>
			<Alliance {ready} alliance={$settings.invert ? "blue" : "red"} invert={!$settings.invert} />
		</div>
	{/if}
</div>
