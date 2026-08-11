<script lang="ts">
	import { state, eventDisplayName } from "@lib/state";
	import { createEventDispatcher, onDestroy, onMount } from "svelte";
	import Logo from "@lib/components/Logo.svelte";
	import Avatar from "@lib/components/Avatar.svelte";
	import SponsorSlideshow from "../../components/SponsorSlideshow.svelte";

	const dispatcher = createEventDispatcher();
	export let exit = false;
	/** Overrides for the break-timer screen: same rankings body, different chrome. */
	export let title = "QUALIFICATION RANKINGS";
	export let showBreakTimer = false;
	let ready = false;
	let exiting = false;

	onMount(() => {
		ready = true;
		startTicker();
	});

	onDestroy(() => {
		cancelAnimationFrame(scrollRaf);
	});

	$: if (exit && !exiting) {
		exiting = true;
		setTimeout(() => dispatcher("transitioned"), 450);
	}

	$: rankings = [...$state.rankData].sort((a, b) => a.rank - b.rank);


	// Only the top three seeds get a colored badge (gold / silver / bronze);
	// everyone else stays gray. (The old ROYGBIV top-8 rainbow was an RR holdover.)
	const RANK_COLORS: Array<{ bg: string; fg: string }> = [
		{ bg: "oklch(0.82 0.16 90)", fg: "oklch(0.25 0.05 90)" }, // 1st - gold
		{ bg: "oklch(0.80 0.02 250)", fg: "oklch(0.25 0.01 250)" }, // 2nd - silver
		{ bg: "oklch(0.62 0.11 55)", fg: "white" }, // 3rd - bronze
	];
	const rankColor = (rank: number) =>
		RANK_COLORS[rank - 1] ?? { bg: "oklch(0.32 0.01 250)", fg: "white" };

	/** Total ranking points: FMS only sends the average (sort1), so scale by matches played. */
	const totalRp = (t: (typeof rankings)[number]): number =>
		Math.round(t.rankingScore * (t.wins + t.losses + t.ties));

	// Continuously scroll once the list is longer than the box; short lists sit still.
	$: scrolling = rankings.length > 10;
	$: scrollSeconds = rankings.length * 2;

	// Integer-pixel ticker: a CSS transform animation lands on fractional pixel
	// offsets each frame and the row edges shimmer as they re-sample; driving
	// the offset from rAF and rounding to whole pixels keeps every edge crisp.
	let scrollWrap: HTMLDivElement | null = null;
	let scrollY = 0;
	let scrollRaf = 0;

	function startTicker() {
		let last = performance.now();
		const tick = (now: number) => {
			const dt = (now - last) / 1000;
			last = now;
			// The wrap holds two identical copies; half its height is one full list.
			const half = scrollWrap ? scrollWrap.offsetHeight / 2 : 0;
			if (scrolling && half > 0) {
				scrollY = (scrollY + (half / scrollSeconds) * dt) % half;
			} else {
				scrollY = 0;
			}
			scrollRaf = requestAnimationFrame(tick);
		};
		scrollRaf = requestAnimationFrame(tick);
	}

	function mmss(seconds: number): string {
		const m = Math.floor(Math.max(0, seconds) / 60);
		const s = Math.floor(Math.max(0, seconds) % 60);
		return `${m}:${s.toString().padStart(2, "0")}`;
	}

	// The break clock ticks over the wire (AllianceSelectionTimer) into match.timer.
	$: startsIn = $state.match?.timer ?? 0;
</script>

{#if ready}
	<div class="fixed inset-0 bg-background overflow-hidden" class:exiting>
		<!-- Header -->
		<header class="anim-top flex items-center justify-between border-b-4 border-accentWarn px-14 pt-7 pb-[18px]">
			<div class="flex items-center gap-[22px]">
				<Logo class="object-contain size-[150px]" />
				<div>
					<div class="display uppercase text-[26px] tracking-[0.18em] text-dim">
						{$eventDisplayName}
					</div>
					<div class="display text-white text-[56px] leading-none tracking-[0.02em]">
						{title}
					</div>
				</div>
			</div>

			{#if showBreakTimer}
				<div class="bg-accentWarn flex items-center gap-5 px-9 py-3.5">
					<div class="uppercase text-[16px] font-black tracking-[0.2em] text-[oklch(0.18_0.04_60)]">
						Starts In
					</div>
					<div class="display tabular-nums text-[92px] leading-[0.9] text-[oklch(0.14_0.04_60)]">
						{mmss(startsIn)}
					</div>
				</div>
			{/if}
		</header>

		<!-- Body: sponsor slideshow | scrolling standings -->
		<div class="grid grid-cols-[1.3fr_1fr] gap-6 px-14 py-6 h-[calc(100%-200px)]">
			<!-- Left: slideshow -->
			<div class="anim-left flex flex-col min-h-0 gap-3.5">
				<div class="flex items-center uppercase gap-3 text-sm tracking-[0.22em] text-dim font-black">
					<span class="bg-accentWarn size-2"></span>
					Sponsors
					<div class="flex-1 h-0.5 bg-[var(--rule)]"></div>
				</div>

				<SponsorSlideshow includeBracket={!showBreakTimer} />
			</div>

			<!-- Right: rankings -->
			<div class="anim-right flex flex-col min-h-0 gap-3.5">
				<div class="flex items-center uppercase gap-3 text-sm tracking-[0.22em] text-dim font-black">
					<span class="bg-accentWarn size-2"></span>
					Rankings
					<div class="flex-1 h-0.5 bg-[var(--rule)]"></div>
				</div>

				<div class="flex flex-col flex-1 min-h-0 bg-[oklch(0_0_0/0.55)] border-2 border-white p-4 gap-2.5">
					<!-- Column headers -->
					<div class="grid grid-cols-[56px_80px_122px_1fr_76px_116px] gap-2.5 items-center uppercase text-[12px] tracking-[0.18em] text-dim font-black px-2">
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
								bind:this={scrollWrap}
								style="transform: translate3d(0, {-Math.round(scrollY)}px, 0);"
							>
								<!-- Two copies back to back make the -50% loop seamless -->
								{#each scrolling ? [0, 1] : [0] as copy}
									<div>
										{#each rankings as team (`${copy}-${team.teamNumber}`)}
											<div class="pb-2">
												<div class="grid grid-cols-[56px_80px_122px_1fr_76px_116px] gap-2.5 items-center bg-white text-[oklch(0.14_0_0)] px-2 py-2.5">
														<div
														class="flex items-center justify-center self-stretch font-black text-[34px]"
														style="font-family: var(--font-mono); background: {rankColor(team.rank).bg}; color: {rankColor(team.rank).fg};"
													>
														{team.rank}
													</div>
													<div class="size-[72px] flex items-center justify-center bg-[oklch(0.35_0_0)] p-1 rounded-lg overflow-hidden">
														<Avatar
															avatar={team.avatar || undefined}
															team={team.teamNumber}
															class="max-w-full max-h-full object-contain"
															alt=""
														/>
													</div>
													<div class="display tabular-nums text-[44px] leading-none">
														{team.teamNumber}
													</div>
													<div class="text-[20px] font-bold truncate opacity-80 min-w-0">
														{team.teamName}
													</div>
													<div class="display tabular-nums text-right text-[44px] leading-none text-[oklch(0.45_0.12_60)]">
														{totalRp(team)}
													</div>
													<div class="tabular-nums text-right text-[26px] font-black opacity-80" style="font-family: var(--font-mono);">
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
							<div class="absolute inset-0 flex items-center justify-center uppercase text-[24px] tracking-[0.2em] text-dim font-black">
								Waiting for rankings
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}

