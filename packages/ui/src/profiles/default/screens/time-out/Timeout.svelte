<script lang="ts">
	import { state, activeProfile, eventDisplayName } from "@lib/state";
	import { matchName } from "@lib/matchNamer";
	import { createEventDispatcher, onMount, onDestroy } from "svelte";
	import Logo from "@lib/components/Logo.svelte";

	const dispatcher = createEventDispatcher();
	export let exit = false;
	let ready = false;
	let slideIdx = 0;
	let rotationTimer: ReturnType<typeof setInterval> | null = null;

	$: sponsors = $activeProfile.assets.sponsors;

	// Slide deck: up to 4 sponsor slots interleaved with two BRACKET pages.
	// Match the spec's 6-slot rotation order.
	$: slides = [
		{ kind: "sponsor", src: sponsors[0], label: "Sponsor One" },
		{ kind: "sponsor", src: sponsors[1], label: "Sponsor Two" },
		{ kind: "bracket" },
		{ kind: "sponsor", src: sponsors[2], label: "Sponsor Three" },
		{ kind: "sponsor", src: sponsors[3], label: "Sponsor Four" },
		{ kind: "bracket" },
	] as Array<{ kind: "sponsor"; src?: string; label: string } | { kind: "bracket" }>;

	onMount(() => {
		ready = true;
		rotationTimer = setInterval(() => {
			slideIdx = (slideIdx + 1) % slides.length;
		}, 5000);
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
				<Logo class="object-contain size-[70px]" />
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
		<div class="grid grid-cols-[1.55fr_1fr] gap-6 px-14 py-6 h-[calc(100vh-138px)]">
			<!-- Left: slideshow -->
			<div class="flex flex-col gap-3.5">
				<div class="flex items-center uppercase gap-3 text-sm tracking-[0.22em] text-dim font-black">
					<span class="bg-accentWarn size-2"></span>
					Featured
					<div class="flex-1 h-0.5 bg-[var(--rule)]"></div>
				</div>

				<div class="relative overflow-hidden flex-1 bg-[oklch(0_0_0/0.6)] border-2 border-white">
					{#each slides as slide, i}
						<div
							class="absolute inset-0 transition-opacity duration-500"
							style="
								opacity: {i === slideIdx ? 1 : 0};
								pointer-events: {i === slideIdx ? 'auto' : 'none'};
							"
						>
							{#if slide.kind === "sponsor"}
								<div class="w-full h-full flex items-center justify-center p-8">
									{#if slide.src}
										<img
											src={slide.src}
											alt={slide.label}
											class="object-contain w-[92%] h-[92%]"
										/>
									{:else}
										<div
											class="flex items-center justify-center uppercase w-[92%] h-[92%] bg-[oklch(0.94_0.005_250)] text-[oklch(0.30_0_0)] text-[32px] font-extrabold tracking-[0.08em] border border-dashed border-[oklch(0_0_0/0.25)]"
											style="font-family: var(--font-mono);"
										>
											{slide.label}
										</div>
									{/if}
								</div>
							{:else}
								<!-- Bracket slide — placeholder; full mini-bracket TBD when bracket data is wired up -->
								<div class="w-full h-full flex flex-col items-center justify-center text-center uppercase p-6 gap-3">
									<div class="display text-accentWarn text-[32px] tracking-[0.16em]">
										Playoff Bracket
									</div>
									<div class="text-sm tracking-[0.2em] text-dim font-black">
										See main bracket between matches
									</div>
								</div>
							{/if}
						</div>
					{/each}
				</div>

				<!-- Slide dots -->
				<div class="flex justify-center gap-2">
					{#each slides as _, i}
						<div
							class="h-2 transition-all duration-300"
							style="
								width: {i === slideIdx ? '32px' : '8px'};
								background: {i === slideIdx ? 'var(--accentWarn)' : 'oklch(1 0 0 / 0.25)'};
							"
						></div>
					{/each}
				</div>
			</div>

			<!-- Right: Up Next card -->
			<div class="flex flex-col min-h-0 gap-3.5">
				<div class="flex items-center uppercase gap-3 text-sm tracking-[0.22em] text-dim font-black">
					<span class="bg-accentWarn size-2"></span>
					Up Next
					<div class="flex-1 h-0.5 bg-[var(--rule)]"></div>
				</div>

				<div class="flex flex-col flex-1 bg-[oklch(0_0_0/0.55)] border-2 border-white p-6 gap-[18px]">
					<!-- Match label -->
					<div class="text-center">
						<div class="display text-accentWarn text-[80px] leading-[0.95]">
							{nextMatchLabel}
						</div>
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
								{#each nextRedTeams.slice(0, 3) as team (team.number)}
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
								{#each nextBlueTeams.slice(0, 3) as team (team.number)}
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
