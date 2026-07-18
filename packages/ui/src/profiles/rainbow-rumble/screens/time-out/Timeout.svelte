<script lang="ts">
	import { state, eventDisplayName } from "@lib/state";
	import { matchName } from "@lib/matchNamer";
	import { fitTwoLines } from "@lib/fitText";
	import { createEventDispatcher, onDestroy, onMount } from "svelte";
	import Logo from "@lib/components/Logo.svelte";
	import BracketGrid from "../playoff-bracket/BracketGrid.svelte";
	import { RR_SPONSORS, type RrSponsor } from "../../sponsors";

	const dispatcher = createEventDispatcher();
	export let exit = false;
	let ready = false;

	// #region Sponsor slideshow
	type Slide = { kind: "sponsor"; sponsor: RrSponsor } | { kind: "bracket" };

	let slideIdx = 0;
	let rotationTimer: ReturnType<typeof setInterval> | null = null;

	// A live mini bracket only makes sense once the event is in playoffs.
	$: inPlayoffs =
		$state.match?.details.matchType === "sf" || $state.match?.details.matchType === "f";
	$: showBracket = inPlayoffs && !!$state.bracket;

	// Deck built from the profile's sponsor art, plus one bracket page
	// (mid-deck) during playoffs.
	$: slides = ((): Slide[] => {
		const deck: Slide[] = RR_SPONSORS.map((sponsor) => ({ kind: "sponsor" as const, sponsor }));
		if (showBracket) deck.splice(Math.min(2, deck.length), 0, { kind: "bracket" });
		return deck;
	})();
	$: currentSlide = slideIdx % slides.length;
	// #endregion

	onMount(() => {
		ready = true;
		rotationTimer = setInterval(() => {
			slideIdx += 1;
		}, 3200);
	});

	onDestroy(() => {
		if (rotationTimer) clearInterval(rotationTimer);
	});

	$: if (exit) {
		ready = false;
		setTimeout(() => dispatcher("transitioned"), 200);
	}

	function mmss(seconds: number): string {
		const m = Math.floor(Math.max(0, seconds) / 60);
		const s = Math.floor(Math.max(0, seconds) % 60);
		return `${m}:${s.toString().padStart(2, "0")}`;
	}

	$: resumesIn = $state.match?.timer ?? 0;
	$: nextMatch = $state.match;
	$: nextMatchLabel = nextMatch
		? matchName(
				nextMatch.details.matchNumber,
				$state.eventDetails?.matchCount ?? 0,
				nextMatch.details.matchType
			) ?? ""
		: "";
	// "Upper Bracket - Round 2 - Match 8" reads better stacked than wrapped:
	// first segment on line one, the rest joined so it never exceeds two lines.
	$: labelSegments = nextMatchLabel.includes(" - ") ? nextMatchLabel.split(" - ") : null;
	$: labelLines = labelSegments
		? [labelSegments[0], labelSegments.slice(1).join(" · ")]
		: null;
	$: nextRedTeams = nextMatch?.teams.red ?? [];
	$: nextBlueTeams = nextMatch?.teams.blue ?? [];
	$: nextRedAlliance = nextMatch?.details.redAlliance;
	$: nextBlueAlliance = nextMatch?.details.blueAlliance;
</script>

{#if ready}
	<div class="rr fixed inset-0 bg-background overflow-hidden">
		<!-- Header -->
		<header
			class="flex items-center justify-between border-b-4 border-transparent px-14 pt-7 pb-[18px]"
			style="border-image: var(--rr-rainbow) 1;"
		>
			<div class="flex items-center gap-[22px]">
				<Logo class="object-contain size-[120px]" />
				<div>
					<div class="rr-display uppercase text-[26px] tracking-[0.18em] text-[var(--rr-dim)]">
						{$eventDisplayName}
					</div>
					<div class="rr-display text-white text-[56px] leading-none tracking-[0.02em]">
						FIELD TIMEOUT
					</div>
				</div>
			</div>

			<!-- Resumes-in card -->
			<div
				class="flex items-center gap-5 px-9 py-3.5 bg-[oklch(0_0_0/0.6)] border-2 border-[var(--rr-accent)] rounded-[var(--rr-r-sm)]"
			>
				<div class="uppercase text-[16px] font-black tracking-[0.2em] text-[var(--rr-dim)]">
					Resumes In
				</div>
				<div class="rr-display text-[92px] leading-[0.9] text-white">
					{mmss(resumesIn)}
				</div>
			</div>
		</header>

		<!-- Body -->
		<div class="grid grid-cols-[1.55fr_1fr] gap-6 px-14 py-6 h-[calc(100vh-200px)]">
			<!-- Left: featured sponsor slideshow -->
			<div class="flex flex-col min-h-0 gap-3.5">
				<div class="flex items-center uppercase gap-3 text-sm tracking-[0.22em] text-[var(--rr-dim)] font-black">
					<span class="size-[9px] rounded-[2px]" style="background: var(--rr-rainbow);"></span>
					Featured
					<div class="flex-1 h-0.5 bg-[var(--rr-rule)]"></div>
				</div>

				<div class="relative flex-1 min-h-0 bg-[oklch(0_0_0/0.6)] border-2 border-white rounded-[var(--rr-r)] overflow-hidden">
					{#each slides as slide, i}
						<div
							class="absolute inset-0 transition-opacity duration-[600ms]"
							style="
								opacity: {i === currentSlide ? 1 : 0};
								pointer-events: {i === currentSlide ? 'auto' : 'none'};
							"
						>
							{#if slide.kind === "sponsor"}
								<div class="w-full h-full flex items-center justify-center p-12">
									<img
										src={slide.sponsor.src}
										alt="Sponsor"
										class="object-contain {slide.sponsor.light
											? 'max-w-[78%] max-h-[78%] bg-white rounded-2xl p-6'
											: 'max-w-[70%] max-h-[70%]'}"
									/>
								</div>
							{:else if $state.bracket}
								<div class="w-full h-full p-2.5 pb-8">
									<BracketGrid compact bracket={$state.bracket} />
								</div>
							{/if}
						</div>
					{/each}

					<!-- Slide dots (inside the box so they never change the surrounding layout) -->
					{#if slides.length > 1}
						<div class="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
							{#each slides as _, i}
								<div
									class="h-2 rounded transition-all duration-300"
									style="
										width: {i === currentSlide ? '32px' : '8px'};
										background: {i === currentSlide ? 'var(--rr-rainbow)' : 'oklch(1 0 0 / 0.35)'};
									"
								></div>
							{/each}
						</div>
					{/if}
				</div>
			</div>

			<!-- Right: Up Next card -->
			<div class="flex flex-col min-h-0 gap-3.5">
				<div class="flex items-center uppercase gap-3 text-sm tracking-[0.22em] text-[var(--rr-dim)] font-black">
					<span class="size-[9px] rounded-[2px]" style="background: var(--rr-rainbow);"></span>
					Up Next
					<div class="flex-1 h-0.5 bg-[var(--rr-rule)]"></div>
				</div>

				<div class="flex flex-col flex-1 bg-[oklch(0_0_0/0.55)] border-2 border-white rounded-[var(--rr-r)] p-6 gap-[18px]">
					<!-- Match label: playoff names stack onto two lines; single-segment
					     names shrink-to-fit instead -->
					<div class="h-[150px] flex flex-col items-center justify-center">
						{#if labelLines}
							<div class="rr-display text-[var(--rr-accent)] text-center text-[64px] leading-[1.05]">
								{#each labelLines as line}
									<div>{line}</div>
								{/each}
							</div>
						{:else}
							<div
								class="rr-display text-[var(--rr-accent)] text-center w-full"
								use:fitTwoLines={{ max: 64, min: 34, maxHeight: 150, text: nextMatchLabel }}
							>
								{nextMatchLabel}
							</div>
						{/if}
					</div>

					<!-- Alliances stacked with VS divider -->
					<div class="flex flex-col gap-3.5 flex-1">
						<div class="flex flex-col bg-redAlliance rounded-[var(--rr-r-sm)] px-5 py-4 gap-2.5">
							<div class="flex items-baseline justify-between">
								<div class="rr-display text-white text-[32px] tracking-[0.06em]">
									RED
								</div>
								{#if nextRedAlliance}
									<div class="text-white font-black text-[22px] bg-[oklch(0_0_0/0.4)] rounded-lg px-3.5 py-1">
										{nextRedAlliance}
									</div>
								{/if}
							</div>
							<div class="flex justify-between gap-2.5">
								{#each nextRedTeams as team (team.number)}
									<div class="rr-display text-white text-center flex-1 text-[52px] leading-[0.95] bg-[oklch(0_0_0/0.32)] rounded-lg px-3 py-1">
										{team.number}
									</div>
								{/each}
							</div>
						</div>

						<div class="rr-display text-center text-white text-[44px]">
							VS
						</div>

						<div class="flex flex-col bg-blueAlliance rounded-[var(--rr-r-sm)] px-5 py-4 gap-2.5">
							<div class="flex items-baseline justify-between">
								<div class="rr-display text-white text-[32px] tracking-[0.06em]">
									BLUE
								</div>
								{#if nextBlueAlliance}
									<div class="text-white font-black text-[22px] bg-[oklch(0_0_0/0.4)] rounded-lg px-3.5 py-1">
										{nextBlueAlliance}
									</div>
								{/if}
							</div>
							<div class="flex justify-between gap-2.5">
								{#each nextBlueTeams as team (team.number)}
									<div class="rr-display text-white text-center flex-1 text-[52px] leading-[0.95] bg-[oklch(0_0_0/0.32)] rounded-lg px-3 py-1">
										{team.number}
									</div>
								{/each}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
