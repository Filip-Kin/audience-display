<script lang="ts">
	import { fade, fly } from "svelte/transition";
	import { state, activeProfile, eventDisplayName } from "@lib/state";
	import { createEventDispatcher, onMount, onDestroy } from "svelte";
	import { matchName } from "@lib/matchNamer";
	import { settings } from "@lib/settings";
	import Alliance from "./Alliance.svelte";
	import ScoreBreakdown from "@lib/components/ScoreBreakdown.svelte";
	import EventHighScoreBanner from "./EventHighScoreBanner.svelte";
	import Confetti from "./Confetti.svelte";
	import MatchUnderReviewOverlay from "./MatchUnderReviewOverlay.svelte";
	import Logo from "@lib/components/Logo.svelte";
	import Shutter from "@lib/components/Shutter.svelte";
	import MatchEventHeader from "@lib/components/MatchEventHeader.svelte";
	import { packUrl } from "@lib/animation_pack.js";
	import { get } from "svelte/store";
	import { audioUnlocked } from "@lib/audio";

	let ready = false;
	let videoReady = false;
	const dispatcher = createEventDispatcher();
	export let exit = false;

	let animation: string;
	let videoElm: HTMLVideoElement;
	let canPlay = false;
	let started = false;
	let unsubAudio: (() => void) | undefined;

	onMount(() => {
		if ($state.results?.score.winner) {
			const profile = get(activeProfile);
			switch ($state.results?.score.winner) {
				case "Red":
					animation = packUrl(profile, "victoryRed");
					break;
				case "Blue":
					animation = packUrl(profile, "victoryBlue");
					break;
				case "Tie":
					animation = packUrl(profile, "victoryTie");
			}
		}

		videoElm.style.display = "block";

		function beginPlayback() {
			if (started) return;
			started = true;
			// Audio is unlocked here, so play from the start with sound.
			videoElm.muted = false;
			try {
				videoElm.currentTime = 0;
			} catch {}
			const played = videoElm.play();
			if (played && typeof played.catch === "function") {
				played.catch(() => {
					// Should not happen once unlocked; never hang, play muted.
					videoElm.muted = true;
					videoElm.play().catch(() => {});
				});
			}
			dispatcher("loaded");
			// Open the shutter onto the results this many ms before the video ends
			// (per-profile; WRC reveals 1s early, everything else 500ms).
			const revealLeadMs = get(activeProfile).options?.victoryRevealLeadMs ?? 500;
			setTimeout(
				() => {
					videoReady = true;
				},
				videoElm.duration * 1000 - revealLeadMs
			);
		}

		// Start only once the video can play AND the browser allows audio
		// (autoplay permitted, or the user pressed "Enable Audio"). Until then
		// the still-frame cover stays up, rather than freezing mid-frame or
		// starting muted before the user unlocks.
		function maybeBegin() {
			if (canPlay && get(audioUnlocked)) beginPlayback();
		}

		videoElm.addEventListener("canplay", () => {
			canPlay = true;
			maybeBegin();
		});

		unsubAudio = audioUnlocked.subscribe(() => maybeBegin());

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

	onDestroy(() => {
		unsubAudio?.();
	});

	$: if (exit) {
		videoElm.style.display = "none";
		videoReady = false;
		ready = false;
	}

	$: eventLabel = $eventDisplayName;
	$: matchLabel = $state.results
		? matchName($state.results.details.matchNumber, $state.eventDetails?.matchCount ?? 0, $state.results.details.matchType) ?? ""
		: "";

	$: redScore = $state.results?.score.red;
	$: blueScore = $state.results?.score.blue;
	$: highScoreVisible = !!(redScore?.isHighScore || blueScore?.isHighScore);
	$: leftBreakdownScore = $state.results?.score[$settings.invert ? "red" : "blue"];
	$: rightBreakdownScore = $state.results?.score[$settings.invert ? "blue" : "red"];
	$: tiebreaker = $state.results?.tiebreaker;
	$: sponsors = $activeProfile.assets.sponsors;

	// Event champion: a finals alliance just clinched the best-of-3 (seriesWins only
	// exists on finals results). Confetti falls on that alliance's side of the screen.
	// If the data ever claims BOTH clinched (stale/staged series state), trust the
	// winner of the match being shown.
	$: redClinched = ($state.results?.details.redSeriesWins ?? 0) >= 2;
	$: blueClinched = ($state.results?.details.blueSeriesWins ?? 0) >= 2;
	$: championColor =
		redClinched && blueClinched
			? $state.results?.score.winner === "Blue"
				? ("blue" as const)
				: ("red" as const)
			: redClinched
				? ("red" as const)
				: blueClinched
					? ("blue" as const)
					: null;
	// Blue renders on the left, red on the right (flipped when $settings.invert).
	$: championSide =
		championColor === "red"
			? $settings.invert
				? ("left" as const)
				: ("right" as const)
			: $settings.invert
				? ("right" as const)
				: ("left" as const);
</script>

<MatchUnderReviewOverlay visible={!!$state.results?.underReview} />

{#if ready && championColor}
	<Confetti side={championSide} color={championColor} />
{/if}

<div class="fixed w-full h-full">
	<video class="w-full h-full object-contain" bind:this={videoElm}>
		<track kind="captions" srclang="en" label="English" />
		<source src={animation} type="video/mp4" />
	</video>
</div>

<Shutter
	{exit}
	startOpen={videoReady}
	leftColor={$settings.invert ? "var(--primary)" : "var(--secondary)"}
	rightColor={$settings.invert ? "var(--secondary)" : "var(--primary)"}
	on:ready={() => { ready = true; }}
	on:transitioned={() => dispatcher("transitioned")}
/>

<!-- Top title bar -->
{#if $state.results && ready}
	<div class="fixed z-10 flex w-full justify-center">
		<div
			class="mt-8"
			in:fly={{ y: -50, duration: 200 }}
			out:fade={{ duration: 100 }}
		>
			<MatchEventHeader {eventLabel} {matchLabel} />
		</div>
	</div>
{/if}

<div class="fixed z-10 grid grid-cols-[.36fr_.28fr_.36fr] w-full h-full p-8 gap-8" class:flex-row-reverse={$settings.invert}>
	{#if $state.results && ready}
		<!-- Cell 1: left sponsors column -->
		<div>
			<h2 class="text-4xl text-center font-bold mb-4" in:fly={{ y: -50, duration: 200 }} out:fade={{ duration: 100 }}>Event Sponsors</h2>
			<img
				src={sponsors[0] ?? "/logo.png"}
				class="h-60 mx-auto self-center object-contain"
				alt={sponsors[0] ? "sponsor" : "event logo"}
				in:fade={{ duration: 200 }} out:fade={{ duration: 200 }}
			/>
		</div>

		<!-- Cell 2: center match results, spans 2 rows -->
		<div class="flex flex-col row-span-2 pt-32">
			<div class="max-w-3xl text-center text-6xl mx-auto w-full" in:fly={{ y: -50, duration: 200 }} out:fade={{ duration: 100 }}>
				<div class="overflow-hidden shadow-[0_12px_40px_oklch(0_0_0/0.6)]">
					<div class="flex" class:flex-row-reverse={$settings.invert}>
						<div class="bg-blueAlliance w-1/2 text-center flex flex-col justify-center pb-6 pt-3 text-3xl">
							<span class="text-white font-bold">Blue</span>
							<span class="text-8xl font-bold pt-2">{$state.results?.score.blue.score}</span>
						</div>
						<div class="bg-redAlliance w-1/2 text-center flex flex-col justify-center pb-6 pt-3 text-3xl">
							<span class="text-white font-bold">Red</span>
							<span class="text-8xl font-bold pt-2">{$state.results?.score.red.score}</span>
						</div>
					</div>
				</div>

				<EventHighScoreBanner visible={highScoreVisible} />
			</div>

			<div class="flex flex-col items-center">
				{#if leftBreakdownScore && rightBreakdownScore}
					<ScoreBreakdown leftScore={leftBreakdownScore} rightScore={rightBreakdownScore} {tiebreaker} />
				{/if}

				<div
					in:fly={{ y: 200, duration: 500 }}
					out:fly={{ y: -400, duration: 200 }}
				>
					<Logo alt="logo" class="h-96 mt-8 object-contain" />
				</div>
			</div>
		</div>

		<!-- Cell 3: right column — always show Pit Podcast -->
		<div>
			<h2 class="text-4xl text-center font-bold mb-4" in:fly={{ y: -50, duration: 200 }} out:fade={{ duration: 100 }}>Livestream Partner</h2>
			<img src="/pitpodcast.png" class="h-60 mx-auto self-center object-contain" alt="Pit Podcast" in:fade={{ duration: 200 }} out:fade={{ duration: 200 }} />
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
