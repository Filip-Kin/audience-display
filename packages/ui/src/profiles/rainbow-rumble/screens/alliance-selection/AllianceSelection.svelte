<script lang="ts">
	import { state, eventDisplayName } from "@lib/state";
	import { createEventDispatcher, onDestroy, onMount } from "svelte";
	import Logo from "@lib/components/Logo.svelte";
	import { RR_SPONSORS } from "../../sponsors";

	const dispatcher = createEventDispatcher();
	export let exit = false;
	let ready = false;

	// Sponsor crossfade: absolute-stacked slides, one visible at a time.
	let sponsorIndex = 0;
	let sponsorTimer: ReturnType<typeof setInterval> | null = null;

	onMount(() => {
		ready = true;
		sponsorTimer = setInterval(() => {
			sponsorIndex = (sponsorIndex + 1) % RR_SPONSORS.length;
		}, 3200);
	});

	onDestroy(() => {
		if (sponsorTimer) clearInterval(sponsorTimer);
		if (flashTimeout) clearTimeout(flashTimeout);
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

	$: pickSeconds = $state.match?.timer ?? 0;
	$: pickWarning = pickSeconds > 0 && pickSeconds <= 10;

	// Flash the timer card gold three times the moment the clock reaches zero.
	let timerFlash = false;
	let prevSeconds = 0;
	let flashTimeout: ReturnType<typeof setTimeout> | null = null;
	$: {
		if (prevSeconds > 0 && pickSeconds === 0) {
			timerFlash = true;
			if (flashTimeout) clearTimeout(flashTimeout);
			flashTimeout = setTimeout(() => (timerFlash = false), 1400);
		}
		prevSeconds = pickSeconds;
	}
	// Every ranked team stays on the board (picked ones get struck through) so the
	// grid, and everything below it, never changes size during the ceremony.
	$: rankedTeams = [...$state.ranking].sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0));
	$: slotsPerAlliance = Math.max(2, Math.min(4, $state.allianceSize ?? 3));

	// Once all 8 alliances have at least one team (captain slot filled), stop
	// highlighting potential captains.
	$: allCaptainsFilled =
		$state.alliances.length >= 8 &&
		$state.alliances.every((a) => a.teams.length > 0);

	$: paddedAlliances = Array.from({ length: 8 }, (_, i) => {
		const num = i + 1;
		const existing = $state.alliances.find((a) => a.allianceNumber === num);
		return (
			existing ?? {
				allianceNumber: num,
				allianceName: "",
				teams: [],
				card: "None" as const,
			}
		);
	});

	/** Team number in positional slot i (0=captain, 1=round 1, ...), or null when unfilled. */
	const slotOf = (a: (typeof paddedAlliances)[number], i: number): number | null =>
		a.slots?.[i] ?? a.teams[i]?.number ?? null;

	// Who's on the clock, derived from which slots are still open (FMS doesn't broadcast it).
	// Round-1 gaps first: with progressive captain reveal the newest-revealed alliance is
	// picking, and a skipped alliance keeps its gap so the highlight returns to it after the
	// next alliance picks. Later rounds walk the serpentine direction to the first open slot.
	$: currentPickAllianceNum = (() => {
		const seeded = paddedAlliances;
		const rounds = slotsPerAlliance - 1;
		const captains = seeded.filter((a) => slotOf(a, 0) !== null).length;
		if (!captains) return null;
		const r1gaps = seeded.filter((a) => slotOf(a, 0) !== null && slotOf(a, 1) === null);
		if (r1gaps.length) return Math.max(...r1gaps.map((a) => a.allianceNumber));
		if (captains < seeded.length) return null;
		for (let r = 2; r <= rounds; r++) {
			const inOrder = r % 2 === 1 ? seeded : [...seeded].reverse();
			const gap = inOrder.find((a) => slotOf(a, r) === null);
			if (gap) return gap.allianceNumber;
		}
		return null;
	})();
</script>

{#if ready}
	<div class="rr fixed inset-0 bg-background overflow-hidden">
		<!-- Header: rainbow underline, logo + stacked titles, pick timer card -->
		<header
			class="flex items-center justify-between border-b-4 px-14 pt-7 pb-[18px]"
			style="border-image: var(--rr-rainbow) 1;"
		>
			<div class="flex items-center gap-[22px]">
				<Logo class="object-contain size-[120px]" />
				<div>
					<div class="rr-display uppercase text-[28px] tracking-[0.16em]" style="color: var(--rr-dim);">
						{$eventDisplayName}
					</div>
					<div class="rr-display text-white text-[64px] leading-none tracking-[0.02em]">
						ALLIANCE SELECTION
					</div>
				</div>
			</div>

			<!-- Pick timer card: label over big clock -->
			<div
				class="flex flex-col items-center px-7 py-2.5 min-w-[160px] border-2 rounded-[var(--rr-r-sm)] {timerFlash ? 'timer-flash' : ''}"
				style="
					background: {pickWarning ? 'var(--rr-gold)' : 'oklch(0 0 0 / 0.6)'};
					border-color: var(--rr-accent);
					color: {pickWarning ? 'oklch(0.18 0.04 60)' : 'white'};
				"
			>
				<div
					class="uppercase text-xs font-black tracking-[0.2em]"
					style="color: {pickWarning ? 'oklch(0.18 0.04 60)' : 'var(--rr-dim)'};"
				>
					{$state.pickTimerType === "break" ? "Break Timer" : "Pick Timer"}
				</div>
				<div class="rr-display text-[82px] leading-[0.9]">
					{mmss(pickSeconds)}
				</div>
			</div>
		</header>

		<!-- Body: left (available teams + camera) | right (alliances + sponsors) -->
		<div class="grid grid-cols-[1.85fr_1fr] gap-6 px-14 pt-5 pb-14 h-[calc(100vh-142px)]">
			<!-- LEFT: full team grid on top, camera fills the rest -->
			<div class="grid grid-rows-[auto_auto_minmax(0,1fr)] gap-3.5 min-h-0">
				<!-- Section label -->
				<div class="flex items-center uppercase gap-3 text-sm tracking-[0.22em] font-black" style="color: var(--rr-dim);">
					<span class="size-[9px] rounded-[2px]" style="background: var(--rr-rainbow);"></span>
					Available Teams
					<div class="flex-1 h-0.5" style="background: var(--rr-rule);"></div>
				</div>

				<!-- Rank grid: 7 cols filled top-to-bottom (rank 1,2,3... down each column),
				     always shows every team so its height never changes -->
				<div
					class="grid grid-cols-7 gap-1.5 content-start"
					style="grid-auto-flow: column; grid-template-rows: repeat({Math.max(1, Math.ceil(rankedTeams.length / 7))}, auto);"
				>
					{#each rankedTeams as team (team.number)}
						{@const taken = team.unavailableForSelection}
						{@const captain = team.potentialCaptain && !taken && !allCaptainsFilled}
						<div
							class="relative grid items-stretch overflow-hidden grid-cols-[44px_1fr] rounded-md {taken ? 'struck' : ''}"
							style="
								background: {taken
									? 'oklch(0.18 0.012 250)'
									: captain
										? 'var(--rr-accent)'
										: 'white'};
							"
						>
							<div
								class="rr-mono flex items-center justify-center font-black text-[20px] text-white"
								style="
									background: {taken
										? 'oklch(0.26 0.012 250)'
										: captain
											? 'oklch(0.30 0.14 330)'
											: 'oklch(0.16 0 0)'};
								"
							>
								{team.rank}
							</div>
							<div
								class="rr-display text-right px-2 py-[5px] text-[28px] leading-none"
								style="
									color: {taken ? 'var(--rr-faint)' : captain ? 'white' : 'oklch(0.14 0 0)'};
									opacity: {taken ? 0.55 : 1};
								"
							>
								{team.number}
							</div>
						</div>
					{/each}
				</div>

				<!-- Camera area: takes all space left under the (constant-height) team grid,
				     so it stays the same size and position for the whole ceremony -->
				<div class="min-h-0 flex items-stretch justify-center">
					<div
						class="h-full aspect-video max-w-full border-2 border-dashed border-[oklch(1_0_0/0.4)] rounded-[var(--rr-r-sm)] flex items-center justify-center"
					>
						<span class="rr-mono uppercase tracking-[0.3em] text-[20px]" style="color: oklch(0.4 0.01 250);">
							stage camera
						</span>
					</div>
				</div>
			</div>

			<!-- RIGHT: alliances + sponsor slideshow -->
			<div class="flex flex-col min-h-0 gap-3.5">
				<div class="flex items-center uppercase gap-3 text-sm tracking-[0.22em] font-black" style="color: var(--rr-dim);">
					<span class="size-[9px] rounded-[2px]" style="background: var(--rr-rainbow);"></span>
					Alliances
					<div class="flex-1 h-0.5" style="background: var(--rr-rule);"></div>
				</div>

				<div class="flex flex-col gap-1.5">
					{#each paddedAlliances as alliance (alliance.allianceNumber)}
						{@const isCurrent = alliance.allianceNumber === currentPickAllianceNum}
						<div
							class="grid items-stretch grid-cols-[48px_1fr] rounded-lg overflow-hidden"
							style="
								background: {isCurrent ? 'var(--rr-rainbow)' : 'white'};
								border: 3px solid {isCurrent ? 'white' : 'transparent'};
								{isCurrent ? 'animation: rr-pulse 1.6s ease-in-out infinite; transform-origin: center;' : ''}
							"
						>
							<!-- Alliance number: just the digit -->
							<div
								class="flex items-center justify-center font-black text-[26px] text-white"
								style="background: {isCurrent ? 'oklch(0 0 0 / 0.55)' : 'oklch(0.16 0 0)'};"
							>
								{alliance.allianceNumber}
							</div>

							<!-- Team slots: one per alliance member (2/3/4-team); unfilled slots stay
							     invisible but keep their width so filled ones never move -->
							<div class="flex items-center gap-1.5 px-2.5 py-1.5">
								{#each Array(slotsPerAlliance).fill(0) as _, i}
									{@const teamNumber = slotOf(alliance, i)}
									{@const empty = teamNumber === null}
									<div
										class="rr-display flex items-center justify-center flex-1 min-w-0 h-12 text-[34px] leading-none rounded-md"
										style="
											background: oklch(0.16 0 0);
											color: var(--rr-accent);
											visibility: {empty ? 'hidden' : 'visible'};
										"
									>
										{teamNumber ?? ""}
									</div>
								{/each}
							</div>
						</div>
					{/each}
				</div>

				<!-- Sponsor crossfade slideshow -->
				<div class="flex-1 mt-1 p-3 flex items-center justify-center">
					<div class="relative w-full h-full min-h-[150px]">
						{#each RR_SPONSORS as sponsor, i}
							<div
								class="absolute inset-0 flex items-center justify-center p-4"
								style="opacity: {i === sponsorIndex ? 1 : 0}; transition: opacity 0.6s;"
							>
								<img
									src={sponsor.src}
									alt="Sponsor"
									class="max-h-full max-w-full object-contain box-border {sponsor.light
										? 'bg-white rounded-2xl p-[18px]'
										: ''}"
								/>
							</div>
						{/each}
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	/* Three gold blinks when the pick/break clock hits zero. */
	.timer-flash {
		animation: timer-zero-flash 0.45s linear 3;
	}
	@keyframes timer-zero-flash {
		0%,
		100% {
			background: oklch(0 0 0 / 0.6);
		}
		50% {
			background: var(--rr-gold);
		}
	}

	/* The display font's line-through sits too low; draw a vertically centered strike
	   across the number area only (past the 44px + 4px rank cell) instead. */
	.struck::after {
		content: "";
		position: absolute;
		left: 48px;
		right: 6px;
		top: 50%;
		height: 3px;
		transform: translateY(-50%);
		background: var(--rr-faint);
		opacity: 0.85;
	}
</style>
