<script lang="ts">
	import { state, eventDisplayName } from "@lib/state";
	import { createEventDispatcher, onMount } from "svelte";
	import Logo from "@lib/components/Logo.svelte";
	import Avatar from "@lib/components/Avatar.svelte";
	import SponsorSlideshow from "../../components/SponsorSlideshow.svelte";

	const dispatcher = createEventDispatcher();
	export let exit = false;
	/** Overrides for the break-timer screen: same rankings body, different chrome. */
	export let title = "QUALIFICATION RANKINGS";
	export let showBreakTimer = false;
	let ready = false;

	onMount(() => {
		ready = true;
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
	<div class="fixed inset-0 bg-background overflow-hidden">
		<!-- Header -->
		<header class="flex items-center justify-between border-b-4 border-accentWarn px-14 pt-7 pb-[18px]">
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
		<div class="grid grid-cols-[1.3fr_1fr] gap-6 px-14 py-6 h-[calc(100vh-200px)]">
			<!-- Left: slideshow -->
			<div class="flex flex-col min-h-0 gap-3.5">
				<div class="flex items-center uppercase gap-3 text-sm tracking-[0.22em] text-dim font-black">
					<span class="bg-accentWarn size-2"></span>
					Featured
					<div class="flex-1 h-0.5 bg-[var(--rule)]"></div>
				</div>

				<SponsorSlideshow includeBracket={!showBreakTimer} />
			</div>

			<!-- Right: rankings -->
			<div class="flex flex-col min-h-0 gap-3.5">
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
								class={scrolling ? "rank-scroll" : ""}
								style="animation-duration: {scrollSeconds}s;"
							>
								<!-- Two copies back to back make the -50% loop seamless -->
								{#each scrolling ? [0, 1] : [0] as copy}
									<div>
										{#each rankings as team (`${copy}-${team.teamNumber}`)}
											<div class="pb-2">
												<div class="grid grid-cols-[56px_80px_122px_1fr_76px_116px] gap-2.5 items-center bg-white text-[oklch(0.14_0_0)] px-2 py-2.5">
													<div
														class="flex items-center justify-center self-stretch my-[-10px] ml-[-8px] font-black text-[34px] bg-[oklch(0.16_0_0)] text-white"
														style="font-family: var(--font-mono);"
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

<style>
	/* Ticker-style loop: the content is doubled, so -50% is exactly one full list. */
	.rank-scroll {
		animation-name: rank-scroll-loop;
		animation-timing-function: linear;
		animation-iteration-count: infinite;
		/* Composite the whole strip on its own GPU layer: without this the rows
		   re-rasterize every frame at fractional pixel offsets and their
		   top/bottom edges shimmer while scrolling. */
		will-change: transform;
		backface-visibility: hidden;
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
