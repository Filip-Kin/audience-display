<script lang="ts">
	import { state, eventDisplayName } from "@lib/state";
	import { createEventDispatcher, onDestroy, onMount } from "svelte";
	import Logo from "@lib/components/Logo.svelte";
	import Avatar from "@lib/components/Avatar.svelte";
	import BracketGrid from "../playoff-bracket/BracketGrid.svelte";
	import { RR_SPONSORS, type RrSponsor } from "../../sponsors";

	const dispatcher = createEventDispatcher();
	export let exit = false;
	/** Overrides for the break-timer screen: same rankings body, different chrome. */
	export let title = "QUALIFICATION RANKINGS";
	export let showBreakTimer = false;
	let ready = false;

	// #region Sponsor slideshow
	type Slide = { kind: "sponsor"; sponsor: RrSponsor } | { kind: "bracket" };

	let slideIdx = 0;
	let rotationTimer: ReturnType<typeof setInterval> | null = null;

	// A live mini bracket only makes sense once the event is in playoffs.
	$: inPlayoffs =
		$state.match?.details.matchType === "sf" || $state.match?.details.matchType === "f";
	$: showBracket = !showBreakTimer && inPlayoffs && !!$state.bracket;

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

	$: rankings = [...$state.rankData].sort((a, b) => a.rank - b.rank);

	/** Total ranking points: FMS only sends the average (sort1), so scale by matches played. */
	const totalRp = (t: (typeof rankings)[number]): number =>
		Math.round(t.rankingScore * (t.wins + t.losses + t.ties));

	// Continuously scroll once the list is longer than the box; short lists sit still.
	$: scrolling = rankings.length > 10;
	$: scrollSeconds = rankings.length * 2;

	function mmss(seconds: number): string {
		const m = Math.floor(Math.max(0, seconds) / 60);
		const s = Math.floor(Math.max(0, seconds) % 60);
		return `${m}:${s.toString().padStart(2, "0")}`;
	}

	// The break clock ticks over the wire (AllianceSelectionTimer) into match.timer.
	$: startsIn = $state.match?.timer ?? 0;
</script>

{#if ready}
	<div class="rr fixed inset-0 bg-background overflow-hidden">
		<!-- Header -->
		<header
			class="flex items-center justify-between border-b-4 border-transparent px-14 pt-7 pb-[18px]"
			style="border-image: var(--rr-rainbow) 1;"
		>
			<div class="flex items-center gap-[22px]">
				<Logo class="object-contain size-[150px]" />
				<div>
					<div class="rr-display uppercase text-[26px] tracking-[0.18em] text-[var(--rr-dim)]">
						{$eventDisplayName}
					</div>
					<div class="rr-display text-white text-[56px] leading-none tracking-[0.02em]">
						{title}
					</div>
				</div>
			</div>

			{#if showBreakTimer}
				<div
					class="flex items-center gap-5 px-9 py-3.5 bg-[oklch(0_0_0/0.6)] border-2 border-[var(--rr-accent)] rounded-[var(--rr-r-sm)]"
				>
					<div class="uppercase text-[16px] font-black tracking-[0.2em] text-[var(--rr-dim)]">
						Starts In
					</div>
					<div class="rr-display text-[92px] leading-[0.9] text-white">
						{mmss(startsIn)}
					</div>
				</div>
			{/if}
		</header>

		<!-- Body: sponsor slideshow | scrolling standings -->
		<div class="grid grid-cols-[1.3fr_1fr] gap-6 px-14 py-6 h-[calc(100vh-200px)]">
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

			<!-- Right: rankings -->
			<div class="flex flex-col min-h-0 gap-3.5">
				<div class="flex items-center uppercase gap-3 text-sm tracking-[0.22em] text-[var(--rr-dim)] font-black">
					<span class="size-[9px] rounded-[2px]" style="background: var(--rr-rainbow);"></span>
					Rankings
					<div class="flex-1 h-0.5 bg-[var(--rr-rule)]"></div>
				</div>

				<div class="flex flex-col flex-1 min-h-0 bg-[oklch(0_0_0/0.55)] border-2 border-white rounded-[var(--rr-r)] p-4 gap-2.5">
					<!-- Column headers -->
					<div class="grid grid-cols-[56px_80px_122px_1fr_76px_116px] gap-2.5 items-center uppercase text-[12px] tracking-[0.18em] text-[var(--rr-dim)] font-black px-2">
						<div>Rank</div>
						<div></div>
						<div>Team</div>
						<div>Name</div>
						<div class="text-right">RP</div>
						<div class="text-right">W-L-T</div>
					</div>

					<div class="relative flex-1 min-h-0 overflow-hidden">
						{#if rankings.length}
							<div
								class={scrolling ? "rank-scroll" : ""}
								style="animation-duration: {scrollSeconds}s;"
							>
								<!-- Two copies back to back make the -50% loop seamless -->
								{#each scrolling ? [0, 1] : [0] as copy}
									<div>
										{#each rankings as team (`${copy}-${team.teamNumber}`)}
											<div class="pb-2">
												<div class="grid grid-cols-[56px_80px_122px_1fr_76px_116px] gap-2.5 items-center bg-white text-[oklch(0.14_0_0)] rounded-lg overflow-hidden pr-2">
													<div
														class="flex items-center justify-center self-stretch font-black text-[34px] bg-[oklch(0.16_0_0)] text-white"
														style="font-family: var(--font-mono);"
													>
														{team.rank}
													</div>
													<div class="size-16 my-1.5 flex items-center justify-center bg-[oklch(0.32_0.02_250)] p-1 rounded-[10px] overflow-hidden">
														<Avatar
															avatar={team.avatar || undefined}
															team={team.teamNumber}
															class="max-w-full max-h-full object-contain"
															alt=""
														/>
													</div>
													<div class="rr-display text-[42px] leading-none">
														{team.teamNumber}
													</div>
													<div class="text-[20px] font-bold truncate opacity-80 min-w-0">
														{team.teamName}
													</div>
													<div class="rr-display text-right text-[42px] leading-none text-[oklch(0.58_0.14_70)]">
														{totalRp(team)}
													</div>
													<div class="rr-mono text-right text-[24px] font-black opacity-80">
														{team.wins}-{team.losses}-{team.ties}
													</div>
												</div>
											</div>
										{/each}
										<!-- Breather before the list wraps back to rank 1 -->
										{#if scrolling}
											<div class="h-[50px]"></div>
										{/if}
									</div>
								{/each}
							</div>
						{:else}
							<div class="absolute inset-0 flex items-center justify-center uppercase text-[24px] tracking-[0.2em] text-[var(--rr-dim)] font-black">
								Waiting for rankings
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	/* Ticker-style loop: the content is doubled, so -50% is exactly one full list. */
	.rank-scroll {
		animation-name: rank-scroll-loop;
		animation-timing-function: linear;
		animation-iteration-count: infinite;
	}
	@keyframes rank-scroll-loop {
		from {
			transform: translateY(0);
		}
		to {
			transform: translateY(-50%);
		}
	}
</style>
