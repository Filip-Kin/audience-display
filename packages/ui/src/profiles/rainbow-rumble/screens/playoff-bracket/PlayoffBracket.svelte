<script lang="ts">
	import { state, eventDisplayName } from "@lib/state";
	import BracketGrid from "./BracketGrid.svelte";
	import BracketAlliances from "./BracketAlliances.svelte";
	import { createEventDispatcher, onDestroy, onMount } from "svelte";
	import { get } from "svelte/store";
	import Logo from "@lib/components/Logo.svelte";

	const dispatcher = createEventDispatcher();
	export let exit = false;
	let ready = false;
	let exiting = false;

	// Like the official display, alternate between the bracket and a full-screen
	// alliances view; the keyed remount below replays each view's entrance.
	let view = 0;
	let fading = false;
	let swapTimer: ReturnType<typeof setInterval> | null = null;
	let now = Date.now();
	let clockTimer: ReturnType<typeof setInterval> | null = null;

	onMount(() => {
		ready = true;
		swapTimer = setInterval(() => {
			// Fade the current view out, THEN swap so the next entrance starts clean.
			fading = true;
			setTimeout(() => {
				view += 1;
				fading = false;
			}, 400);
		}, 15000);
		clockTimer = setInterval(() => (now = Date.now()), 1000);
	});

	onDestroy(() => {
		if (swapTimer) clearInterval(swapTimer);
		if (clockTimer) clearInterval(clockTimer);
	});

	// Pre-playoff header: scheduled start of M1 plus a live countdown, until M1 is played.
	const formatCountdown = (totalSeconds: number): string => {
		const h = Math.floor(totalSeconds / 3600);
		const m = Math.floor((totalSeconds % 3600) / 60);
		const s = totalSeconds % 60;
		return h > 0
			? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
			: `${m}:${String(s).padStart(2, "0")}`;
	};
	$: firstMatchStart = $state.firstPlayoffMatchTime ? Date.parse($state.firstPlayoffMatchTime) : null;
	$: m1 = $state.bracket?.doubleElimMatchesList.find((m) => m.matchNumber === 1) ?? null;
	$: showCountdown = firstMatchStart !== null && !Number.isNaN(firstMatchStart) && !!m1 && !m1.isComplete;
	$: startClock = firstMatchStart
		? new Date(firstMatchStart).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
		: "";
	$: countdown = formatCountdown(Math.max(0, Math.floor(((firstMatchStart ?? 0) - now) / 1000)));

	// Break clock: FMS ticks it over the wire (AllianceSelectionTimer ->
	// match.timer) while a break runs. Freshness-gated so a leftover value from
	// an earlier break can't paint a frozen countdown in the header.
	let lastSeenTimer: number | null = get(state).match?.timer ?? null;
	let lastTickAt = 0;
	$: if ($state.pickTimerType === "break" && $state.match && $state.match.timer !== lastSeenTimer) {
		lastSeenTimer = $state.match.timer;
		lastTickAt = Date.now();
	}
	$: breakSeconds = $state.match?.timer ?? 0;
	$: breakActive = $state.pickTimerType === "break" && breakSeconds > 0 && now - lastTickAt < 3000;

	$: if (exit && !exiting) {
		exiting = true;
		setTimeout(() => dispatcher("transitioned"), 450);
	}

	$: bracket = $state.bracket;
	$: showAlliances = view % 2 === 1 && !!bracket?.alliances?.length;
</script>

{#if ready}
	<div class="rr fixed inset-0 bg-background overflow-hidden" class:exiting>
		<!-- Header: rainbow underline, logo + stacked titles -->
		<header
			class="anim-top flex items-center gap-[22px] border-b-4 px-14 pt-7 pb-[18px]"
			style="border-image: var(--rr-rainbow) 1;"
		>
			<Logo class="object-contain size-[120px]" />
			<div>
				<div class="rr-display uppercase text-[28px] tracking-[0.16em]" style="color: var(--rr-dim);">
					{$eventDisplayName}
				</div>
				<div class="rr-display text-white text-[64px] leading-none tracking-[0.02em]">
					PLAYOFF BRACKET
				</div>
			</div>
			{#if breakActive}
				<div
					class="ml-auto flex items-center gap-5 px-9 py-3.5 bg-[oklch(0_0_0/0.6)] border-2 border-[var(--rr-accent)] rounded-[var(--rr-r-sm)]"
				>
					<div class="uppercase text-[16px] font-black tracking-[0.2em] text-[var(--rr-dim)]">
						Break
					</div>
					<div class="rr-display tabular-nums text-[92px] leading-[0.9] text-white">
						{formatCountdown(breakSeconds)}
					</div>
				</div>
			{:else if showCountdown}
				<div
					class="ml-auto flex items-center gap-5 px-9 py-3.5 bg-[oklch(0_0_0/0.6)] border-2 border-[var(--rr-accent)] rounded-[var(--rr-r-sm)]"
				>
					<div class="uppercase text-[16px] font-black tracking-[0.2em] text-[var(--rr-dim)]">
						First Match<br />at {startClock}
					</div>
					<div class="rr-display tabular-nums text-[92px] leading-[0.9] text-white">
						{countdown}
					</div>
				</div>
			{/if}
		</header>

		<!-- Bracket / full-screen alliances, swapped every 15s -->
		<div class="px-14 pt-6 pb-10 h-[calc(100vh-190px)]">
			{#if bracket}
				{#key view}
					<div class="anim-exit-fade h-full" class:swap-fade={fading}>
						{#if showAlliances}
							<BracketAlliances {bracket} />
						{:else}
							<BracketGrid {bracket} />
						{/if}
					</div>
				{/key}
			{:else}
				<div
					class="h-full flex items-center justify-center uppercase text-[28px] tracking-[0.2em] font-black"
					style="color: var(--rr-dim);"
				>
					Loading bracket
				</div>
			{/if}
		</div>
	</div>
{/if}
