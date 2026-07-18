<script lang="ts">
	import { state, eventDisplayName } from "@lib/state";
	import { matchName } from "@lib/matchNamer";
	import { fitTwoLines } from "@lib/fitText";
	import { createEventDispatcher, onMount } from "svelte";
	import Logo from "@lib/components/Logo.svelte";
	import SponsorSlideshow from "../../components/SponsorSlideshow.svelte";

	const dispatcher = createEventDispatcher();
	export let exit = false;
	let ready = false;

	onMount(() => {
		ready = true;
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
	// "Upper Bracket - Round 2 - Match 8" reads better stacked than wrapped.
	$: labelLines = nextMatchLabel.includes(" - ") ? nextMatchLabel.split(" - ") : null;
	$: nextRedTeams = nextMatch?.teams.red ?? [];
	$: nextBlueTeams = nextMatch?.teams.blue ?? [];
	$: nextRedAlliance = nextMatch?.details.redAlliance;
	$: nextBlueAlliance = nextMatch?.details.blueAlliance;
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
						FIELD TIMEOUT
					</div>
				</div>
			</div>

			<!-- Resumes-in timer pill -->
			<div class="bg-accentWarn flex items-center gap-5 px-9 py-3.5">
				<div class="uppercase text-[16px] font-black tracking-[0.2em] text-[oklch(0.18_0.04_60)]">
					Resumes In
				</div>
				<div class="display tabular-nums text-[92px] leading-[0.9] text-[oklch(0.14_0.04_60)]">
					{mmss(resumesIn)}
				</div>
			</div>
		</header>

		<!-- Body -->
		<div class="grid grid-cols-[1.55fr_1fr] gap-6 px-14 py-6 h-[calc(100vh-200px)]">
			<!-- Left: slideshow -->
			<div class="flex flex-col min-h-0 gap-3.5">
				<div class="flex items-center uppercase gap-3 text-sm tracking-[0.22em] text-dim font-black">
					<span class="bg-accentWarn size-2"></span>
					Featured
					<div class="flex-1 h-0.5 bg-[var(--rule)]"></div>
				</div>

				<SponsorSlideshow />
			</div>

			<!-- Right: Up Next card -->
			<div class="flex flex-col min-h-0 gap-3.5">
				<div class="flex items-center uppercase gap-3 text-sm tracking-[0.22em] text-dim font-black">
					<span class="bg-accentWarn size-2"></span>
					Up Next
					<div class="flex-1 h-0.5 bg-[var(--rule)]"></div>
				</div>

				<div class="flex flex-col flex-1 bg-[oklch(0_0_0/0.55)] border-2 border-white p-6 gap-[18px]">
					<!-- Match label: playoff names stack one segment per line ("Upper Bracket /
					     Round 2 / Match 8"); single-segment names shrink-to-fit instead -->
					<div class="h-[190px] flex flex-col items-center justify-center">
						{#if labelLines}
							<div class="display text-accentWarn text-center text-[54px] leading-[1.1]">
								{#each labelLines as line}
									<div>{line}</div>
								{/each}
							</div>
						{:else}
							<div
								class="display text-accentWarn text-center w-full"
								use:fitTwoLines={{ max: 80, min: 34, maxHeight: 190, text: nextMatchLabel }}
							>
								{nextMatchLabel}
							</div>
						{/if}
					</div>

					<!-- Alliances stacked with VS divider -->
					<div class="flex flex-col gap-3.5 flex-1">
						<div class="flex flex-col bg-redAlliance px-5 py-4 gap-2.5">
							<div class="flex items-baseline justify-between">
								<div class="display text-white text-[32px] tracking-[0.06em]">
									RED
								</div>
								{#if nextRedAlliance}
									<div class="text-white font-black text-[22px] bg-[oklch(0_0_0/0.4)] px-3.5 py-1">
										{nextRedAlliance}
									</div>
								{/if}
							</div>
							<div class="flex justify-between gap-2">
								{#each nextRedTeams as team (team.number)}
									<div class="display tabular-nums text-white text-center flex-1 text-[56px] leading-[0.95] bg-[oklch(0_0_0/0.32)] px-3 py-1">
										{team.number}
									</div>
								{/each}
							</div>
						</div>

						<div class="display text-center text-white text-[44px]">
							VS
						</div>

						<div class="flex flex-col bg-blueAlliance px-5 py-4 gap-2.5">
							<div class="flex items-baseline justify-between">
								<div class="display text-white text-[32px] tracking-[0.06em]">
									BLUE
								</div>
								{#if nextBlueAlliance}
									<div class="text-white font-black text-[22px] bg-[oklch(0_0_0/0.4)] px-3.5 py-1">
										{nextBlueAlliance}
									</div>
								{/if}
							</div>
							<div class="flex justify-between gap-2">
								{#each nextBlueTeams as team (team.number)}
									<div class="display tabular-nums text-white text-center flex-1 text-[56px] leading-[0.95] bg-[oklch(0_0_0/0.32)] px-3 py-1">
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
