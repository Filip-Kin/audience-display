<script lang="ts">
	import { state, eventDisplayName } from "@lib/state";
	import { createEventDispatcher, onMount } from "svelte";
	import Logo from "@lib/components/Logo.svelte";

	const dispatcher = createEventDispatcher();
	export let exit = false;
	let ready = false;
	let exiting = false;
	let camW = 0;
	let camH = 0;

	onMount(() => {
		ready = true;
	});

	$: if (exit && !exiting) {
		exiting = true;
		setTimeout(() => dispatcher("transitioned"), 450);
	}

	function mmss(seconds: number): string {
		const m = Math.floor(Math.max(0, seconds) / 60);
		const s = Math.floor(Math.max(0, seconds) % 60);
		return `${m}:${s.toString().padStart(2, "0")}`;
	}

	$: pickSeconds = $state.match?.timer ?? 0;
	// Yellow only once the Pick_Clock sound plays (last 5 seconds).
	$: pickWarning = pickSeconds > 0 && pickSeconds <= 5;

	// Flash the timer pill yellow three times the moment the clock reaches zero.
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
	// Teams assigned to an alliance drop off the board; declined teams stay,
	// struck through (still captain-eligible, so a declined potential captain
	// keeps the accent highlight).
	$: rankedTeams = [...$state.ranking]
		.filter((t) => !t.unavailableForSelection)
		.sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0));
	// Row count is fixed for the whole ceremony from the FULL event roster (like
	// the official display): teams fill column-first, so picks empty the tail
	// columns while the grid - and the camera box below it - never moves.
	$: rankRows = Math.max(1, Math.ceil($state.ranking.length / 7));
	$: slotsPerAlliance = Math.max(2, Math.min(4, $state.allianceSize ?? 3));

	// Real alliance count: a small event backfills the 8-alliance bracket with
	// fillers (seeds beyond this count), so the ceremony only shows/awaits the
	// real alliances. 8 (default) = a normal full field.
	$: realAllianceCount = Math.max(2, Math.min(8, $state.playoffRealAlliances ?? 8));

	// Once all real alliances have at least one team (captain slot filled), stop
	// highlighting potential captains.
	$: allCaptainsFilled =
		$state.alliances.length >= realAllianceCount &&
		$state.alliances.every((a) => a.teams.length > 0);

	$: paddedAlliances = Array.from({ length: realAllianceCount }, (_, i) => {
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
		// Round 1, between picks: the previous alliance is complete but FMS has not
		// revealed the next captain yet - that next alliance is already on the clock.
		if (captains < seeded.length) return captains + 1;
		for (let r = 2; r <= rounds; r++) {
			const inOrder = r % 2 === 1 ? seeded : [...seeded].reverse();
			const gap = inOrder.find((a) => slotOf(a, r) === null);
			if (gap) return gap.allianceNumber;
		}
		return null;
	})();
</script>

{#if ready}
	<!-- Root is transparent so the camera box can punch a hole to the vMix camera
	     feed below. The background is painted by the camera box's box-shadow
	     spotlight (see below), which fills the whole screen EXCEPT the box. -->
	<div class="fixed inset-0 overflow-hidden" class:exiting>
		<!-- Header -->
		<header class="anim-top flex items-center justify-between border-b-4 border-accentWarn px-14 pt-7 pb-[18px]">
			<div class="flex items-center gap-[22px]">
				<Logo class="object-contain size-[120px]" />
				<div>
					<div class="display uppercase text-[28px] tracking-[0.16em] text-dim">
						{$eventDisplayName}
					</div>
					<div class="display text-white text-[64px] leading-none tracking-[0.02em]">
						ALLIANCE SELECTION
					</div>
				</div>
			</div>

			<!-- Pick timer pill: stacked layout -->
			<div class="flex flex-col items-center px-7 py-2.5 min-w-[160px] {pickWarning ? 'bg-accentWarn text-[oklch(0.18_0.04_60)]' : 'bg-[oklch(0_0_0/0.6)] text-white border-2 border-white'} {timerFlash ? 'timer-flash' : ''}">
				<div class="uppercase text-xs font-black tracking-[0.2em]">
					{$state.pickTimerType === "break" ? "Break Timer" : "Pick Timer"}
				</div>
				<div class="display tabular-nums text-[82px] leading-[0.9]">
					{mmss(pickSeconds)}
				</div>
			</div>
		</header>

		<!-- Body: left (available teams + camera) | right (alliances + sponsor) -->
		<div class="grid grid-cols-[1.85fr_1fr] gap-6 px-14 pt-5 pb-14 h-[calc(100%-142px)]">
			<!-- LEFT: full team grid on top, camera fills the rest -->
			<div class="grid grid-rows-[auto_auto_minmax(0,1fr)] gap-3.5 min-h-0">
				<!-- Section label -->
				<div class="anim-left flex items-center uppercase gap-3 text-sm tracking-[0.22em] text-dim font-black">
					<span class="bg-accentWarn size-2"></span>
					Available Teams
					<div class="flex-1 h-0.5 bg-[var(--rule)]"></div>
				</div>

				<!-- Rank grid: 7 cols filled top-to-bottom (rank 1,2,3... down each column),
				     the row count is fixed from the full roster so the height never changes -->
				<div
					class="anim-left grid grid-cols-7 gap-1.5 content-start"
					style="grid-auto-flow: column; grid-template-rows: repeat({rankRows}, minmax(38px, auto));"
				>
					{#each rankedTeams as team (team.number)}
						{@const declined = !!team.declined}
						{@const captain = team.potentialCaptain && !allCaptainsFilled}
						<div
							class="grid items-stretch overflow-hidden grid-cols-[44px_1fr] relative {declined ? 'struck' : ''} {declined && captain ? 'struck-dark' : ''}"
							style="
								background: {captain
									? 'var(--accentWarn)'
									: declined
										? 'oklch(0.18 0.012 250)'
										: 'white'};
								color: {declined && !captain ? 'var(--text-faint)' : 'oklch(0.14 0 0)'};
							"
						>
							<div
								class="flex items-center justify-center font-black text-[20px]"
								style="
									background: {captain
										? 'oklch(0.18 0.04 60)'
										: declined
											? 'oklch(0.26 0.012 250)'
											: 'oklch(0.16 0 0)'};
									color: {!captain ? 'white' : 'var(--accentWarn)'};
									font-family: var(--font-mono);
								"
							>
								{team.rank}
							</div>
							<div
								class="display tabular-nums text-right px-2 py-[5px] text-[28px] leading-none"
								style="opacity: {declined && !captain ? 0.5 : 1};"
							>
								{team.number}
							</div>
						</div>
					{/each}
				</div>

				<!-- Camera area: takes all space left under the (constant-height) team grid,
				     so it stays the same size and position for the whole ceremony. The box
				     is measured-contain sized so it is EXACTLY 16:9 whichever dimension
				     limits (h-full + aspect-video breaks ratio when max-width clamps). -->
				<div class="min-h-0 flex items-center justify-center" bind:clientWidth={camW} bind:clientHeight={camH}>
					<!-- Transparent cut-out for the vMix camera feed. The huge solid
					     box-shadow paints the screen background everywhere around this
					     box (clipped to the screen by the root's overflow-hidden), and
					     z-index:-1 keeps that fill behind all the content, so the box
					     interior stays a clean transparent hole - no border needed. -->
					<div
						class="bg-transparent cam-pop"
						style="width: calc({Math.min(camW, (camH * 16) / 9)}px * var(--cam-scale)); height: calc({Math.min(camH, (camW * 9) / 16)}px * var(--cam-scale)); position: relative; z-index: -1; box-shadow: 0 0 0 200vmax var(--background);"
					></div>
				</div>
			</div>

			<!-- RIGHT: alliances + sponsor -->
			<div class="flex flex-col min-h-0 gap-3.5">
				<div class="anim-right flex items-center uppercase gap-3 text-sm tracking-[0.22em] text-dim font-black">
					<span class="bg-accentWarn size-2"></span>
					Alliances
					<div class="flex-1 h-0.5 bg-[var(--rule)]"></div>
				</div>

				<div class="flex flex-col gap-1.5">
					{#each paddedAlliances as alliance, allianceIdx (alliance.allianceNumber)}
						{@const isCurrent = alliance.allianceNumber === currentPickAllianceNum}
						<!-- Stagger wrapper: bars enter one by one with 1/3 overlap; the pulse
						     animation lives on the inner bar so the two never fight. -->
						<div class="anim-right" style="--anim-delay: {allianceIdx * 0.18}s;">
						<div
							class="grid items-stretch grid-cols-[48px_1fr] text-[oklch(0.14_0_0)]"
							class:ad-pulse={isCurrent}
							style="
								background: {isCurrent ? 'var(--accentWarn)' : 'white'};
								border: {isCurrent ? '3px solid white' : '2px solid transparent'};
							"
						>
							<!-- Alliance number: just the digit -->
							<div
								class="flex items-center justify-center font-black text-[26px]"
								style="
									background: {isCurrent ? 'oklch(0.18 0.04 60)' : 'oklch(0.32 0.01 250)'};
									color: {isCurrent ? 'var(--accentWarn)' : 'white'};
								"
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
										class="display tabular-nums flex items-center justify-center flex-1 min-w-0 h-12 text-[34px] leading-none"
										style="
											background: oklch(0.16 0 0);
											color: var(--accentWarn);
											visibility: {empty ? 'hidden' : 'visible'};
										"
									>
										{teamNumber ?? ""}
									</div>
								{/each}
							</div>
						</div>
						</div>
					{/each}
				</div>

				<!-- Livestream partner only. The event logo already sits in this
				     screen's own header (line 117), so carrying it again down here
				     just doubled it up. -->
				<div class="anim-right flex items-center justify-center flex-1 mt-1 p-4">
					<Logo
						type="livestream"
						alt="livestream partner"
						class="object-contain max-h-[180px] max-w-[70%] w-auto"
					/>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	/* Three yellow blinks when the pick/break clock hits zero. */
	.timer-flash {
		animation: timer-zero-flash 0.45s linear 3;
	}
	@keyframes timer-zero-flash {
		0%,
		100% {
			background: oklch(0 0 0 / 0.6);
		}
		50% {
			background: var(--accentWarn);
		}
	}

	/* The display font's line-through sits too low; draw a vertically centered strike instead. */
	.struck::after {
		content: "";
		position: absolute;
		left: 4px;
		right: 4px;
		top: 50%;
		height: 3px;
		transform: translateY(-50%);
		background: var(--text-faint, oklch(0.55 0 0));
		opacity: 0.85;
	}

	/* Declined potential captain: thick dark strike reads on the accent (yellow) chip. */
	.struck-dark::after {
		background: oklch(0.18 0.04 60);
		opacity: 1;
		height: 5px;
	}
</style>
