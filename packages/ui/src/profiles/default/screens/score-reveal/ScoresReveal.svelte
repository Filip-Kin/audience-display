<script lang="ts">
	import { fade, fly } from "svelte/transition";
	import { state, activeProfile, eventDisplayName } from "@lib/state";
	import { createEventDispatcher, onMount, onDestroy } from "svelte";
	import { matchName } from "@lib/matchNamer";
	import { settings } from "@lib/settings";
	import Alliance from "./Alliance.svelte";
	import ScoreBreakdown from "@lib/components/ScoreBreakdown.svelte";
	import SponsorCarousel from "./SponsorCarousel.svelte";
	import EventHighScoreBanner from "./EventHighScoreBanner.svelte";
	import Confetti from "./Confetti.svelte";
	import MatchUnderReviewOverlay from "./MatchUnderReviewOverlay.svelte";
	import Logo from "@lib/components/Logo.svelte";
	import Shutter from "@lib/components/Shutter.svelte";
	import MatchEventHeader from "@lib/components/MatchEventHeader.svelte";
	import { packUrl } from "@lib/animation_pack.js";
	import { get } from "svelte/store";
	import { audioUnlocked, volumes } from "@lib/audio";

	let ready = false;
	let videoReady = false;
	const dispatcher = createEventDispatcher();
	export let exit = false;

	// Post-time snapshot: results never live-update while a reveal is up (a
	// reconnect can deliver placeholder data mid-show). A repost REMOUNTS this
	// component, so new results still get in the only way they should.
	const results = get(state).results;
	const matchCount = get(state).eventDetails?.matchCount ?? 0;

	let animation: string;
	let videoElm: HTMLVideoElement;
	// Live volume for the winner animation (settings slider).
	$: if (videoElm) videoElm.volume = $volumes.victoryVideo;
	let canPlay = false;
	let started = false;
	let unsubAudio: (() => void) | undefined;
	let revealTimer: ReturnType<typeof setTimeout> | null = null;

	function cancelRevealTimer() {
		if (revealTimer) {
			clearTimeout(revealTimer);
			revealTimer = null;
		}
	}

	onMount(() => {
		if (results?.score.winner) {
			const profile = get(activeProfile);
			switch (results?.score.winner) {
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
			videoElm.volume = get(volumes).victoryVideo;
			try {
				videoElm.currentTime = 0;
			} catch {}
			const played = videoElm.play();
			if (played && typeof played.catch === "function") {
				played.catch((err) => {
					// Should not happen once unlocked; never hang, play muted.
					console.log("Victory video playback with audio failed; retrying muted:", err);
					videoElm.muted = true;
					videoElm.play().catch((mutedErr) => {
						console.log("Muted victory video playback also failed:", mutedErr);
					});
				});
			}
			dispatcher("loaded");
			// Open the shutter onto the results this many ms before the video ends
			// (per-profile; WRC reveals 1s early, everything else 500ms).
			const revealLeadMs = get(activeProfile).options?.victoryRevealLeadMs ?? 500;
			cancelRevealTimer();
			if (Number.isFinite(videoElm.duration) && videoElm.duration > 0) {
				revealTimer = setTimeout(
					() => {
						videoReady = true;
					},
					Math.max(0, videoElm.duration * 1000 - revealLeadMs)
				);
			} else {
				// Duration unknown (NaN/Infinity, e.g. a broken or streaming source):
				// open on the video's "ended" event, with a fixed fallback so the
				// scores can never stay hidden.
				console.log("Victory video duration unavailable; opening on ended event");
				videoElm.addEventListener("ended", () => {
					videoReady = true;
				}, { once: true });
				revealTimer = setTimeout(() => {
					videoReady = true;
				}, 10_000);
			}
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

		videoElm.addEventListener("error", (event) => {
			if (animation && !animation.includes("/animations/default/")) {
				console.log("Victory animation failed to load; falling back to default animation:", event);
				const winner = results?.score.winner;
				if (winner === "Red") animation = "/animations/default/redwins.mp4";
				else if (winner === "Blue") animation = "/animations/default/bluewins.mp4";
				else if (winner === "Tie") animation = "/animations/default/tie.mp4";
				videoElm.load();
			} else {
				// The default animation itself failed; a reveal without video beats
				// a frozen cover, so clear the cover and open the shutter now.
				console.log("Default victory animation failed; revealing scores without video:", event);
				cancelRevealTimer();
				dispatcher("loaded");
				videoReady = true;
			}
		});
	});

	onDestroy(() => {
		unsubAudio?.();
		cancelRevealTimer();
	});

	$: if (exit) {
		// A stale reveal timer must not flip videoReady while this instance exits.
		cancelRevealTimer();
		videoElm.style.display = "none";
		videoReady = false;
		ready = false;
	}

	$: eventLabel = $eventDisplayName;
	$: matchLabel = results
		? matchName(results.details.matchNumber, matchCount, results.details.matchType) ?? ""
		: "";

	$: redScore = results?.score.red;
	$: blueScore = results?.score.blue;
	$: highScoreVisible = !!(redScore?.isHighScore || blueScore?.isHighScore);
	$: leftBreakdownScore = results?.score[$settings.invert ? "red" : "blue"];
	$: rightBreakdownScore = results?.score[$settings.invert ? "blue" : "red"];
	$: tiebreaker = results?.tiebreaker;

	// Event champion: a finals alliance just clinched the best-of-3 (seriesWins only
	// exists on finals results). Confetti falls on that alliance's side of the screen.
	// If the data ever claims BOTH clinched (stale/staged series state), trust the
	// winner of the match being shown.
	$: redClinched = (results?.details.redSeriesWins ?? 0) >= 2;
	$: blueClinched = (results?.details.blueSeriesWins ?? 0) >= 2;
	$: championColor =
		redClinched && blueClinched
			? results?.score.winner === "Blue"
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

<MatchUnderReviewOverlay visible={!!results?.underReview} />

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
{#if results && ready}
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
	{#if results && ready}
		<!-- Cell 1: left sponsors column -->
		<div>
			<h2 class="text-4xl text-center font-bold mb-4" in:fly={{ y: -50, duration: 200 }} out:fade={{ duration: 100 }}>Event Sponsors</h2>
			<div class="h-60 flex items-center justify-center rounded-2xl bg-[oklch(0_0_0/0.35)] p-6" in:fade={{ duration: 200 }} out:fade={{ duration: 200 }}>
				<SponsorCarousel />
			</div>
		</div>

		<!-- Cell 2: center match results, spans 2 rows -->
		<div class="flex flex-col row-span-2 pt-32">
			<div class="max-w-3xl text-center text-6xl mx-auto w-full" in:fly={{ y: -50, duration: 200 }} out:fade={{ duration: 100 }}>
				<div class="overflow-hidden shadow-[0_12px_40px_oklch(0_0_0/0.6)]">
					<div class="flex" class:flex-row-reverse={$settings.invert}>
						<div class="bg-blueAlliance w-1/2 text-center flex flex-col justify-center pb-6 pt-3 text-3xl">
							<span class="text-white font-bold">Blue</span>
							<span class="text-8xl font-bold pt-2">{results?.score.blue.score}</span>
						</div>
						<div class="bg-redAlliance w-1/2 text-center flex flex-col justify-center pb-6 pt-3 text-3xl">
							<span class="text-white font-bold">Red</span>
							<span class="text-8xl font-bold pt-2">{results?.score.red.score}</span>
						</div>
					</div>
				</div>

				<EventHighScoreBanner visible={highScoreVisible} />
			</div>

			<div class="flex flex-col items-center">
				{#if leftBreakdownScore && rightBreakdownScore}
					<!-- |global: the screen exit unmounts the OUTER if-block; Svelte 4
					     transitions are local by default and would not fire from here. -->
					<div class="w-full" in:fly|global={{ y: 200, duration: 400 }} out:fade|global={{ duration: 150 }}>
						<ScoreBreakdown leftScore={leftBreakdownScore} rightScore={rightBreakdownScore} {tiebreaker} />
					</div>
				{/if}

				<div
					in:fly={{ y: 200, duration: 500 }}
					out:fly={{ y: -400, duration: 200 }}
				>
					<Logo alt="logo" class="h-96 mt-8 object-contain" />
				</div>
			</div>
		</div>

		<!-- Cell 3: right column, always show Pit Podcast -->
		<div>
			<h2 class="text-4xl text-center font-bold mb-4" in:fly={{ y: -50, duration: 200 }} out:fade={{ duration: 100 }}>Livestream Partner</h2>
			<div class="h-60 flex items-center justify-center rounded-2xl bg-[oklch(0_0_0/0.35)] p-6" in:fade={{ duration: 200 }} out:fade={{ duration: 200 }}>
				<img src="/pitpodcast.png" class="max-h-full mx-auto self-center object-contain" alt="Pit Podcast" />
			</div>
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
