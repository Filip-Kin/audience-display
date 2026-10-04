<script lang="ts">
	import type { MatchPhase } from "lib";

	export let phase: MatchPhase;
	export let timer: number;
	/** Seconds left in the current game phase (drives the shift-time readout). */
	export let phaseTimer: number = 0;
	export let arrowSide: "left" | "right" | "both" | "none";
	/** Pulse the active-hub arrow on a side when its goal is about to close. */
	export let pulseLeft: boolean = false;
	export let pulseRight: boolean = false;
	/** Show "MATCH OVER" instead of the phase label once the match has ended. */
	export let matchOver: boolean = false;
	/** Replace the whole timer square with the yellow "match under review" card. */
	export let underReview: boolean = false;

	import Whistle from "../../../../assets/whistle.svg";
	import Digits from "../../components/Digits.svelte";

	const ARROW_PULSE = "animation: goon-arrow 0.6s ease-in-out infinite; transform-origin: center;";

	const PHASE_LABELS: Record<MatchPhase, string> = {
		PreMatch: "",
		Auto: "AUTO",
		TransitionShift: "TRANSITION SHIFT",
		Shift1: "SHIFT 1",
		Shift2: "SHIFT 2",
		Shift3: "SHIFT 3",
		Shift4: "SHIFT 4",
		Endgame: "ENDGAME",
		PostMatch: "POST-MATCH",
	};

	// FMS streams the transition shift under its internal "Coop" name; map it too
	// in case a state arrives before the server normalizes it to TransitionShift.
	$: phaseLabel = matchOver
		? "MATCH OVER"
		: PHASE_LABELS[phase] ?? ((phase as string) === "Coop" ? "TRANSITION SHIFT" : phase);
	$: highlightLabel = matchOver || phase === "Endgame";

	// Teleop shift counter: 6 phases (TransitionShift=1 .. Endgame=6). Blank
	// (but height-reserving) during auto/prematch and once the match ends.
	const SHIFT_INDEX: Partial<Record<string, number>> = {
		TransitionShift: 1,
		Coop: 1,
		Shift1: 2,
		Shift2: 3,
		Shift3: 4,
		Shift4: 5,
		Endgame: 6,
	};
	$: shiftIndex = matchOver ? null : (SHIFT_INDEX[phase as string] ?? null);

	function mmss(s: number): string {
		const m = Math.floor(Math.max(0, s) / 60);
		const r = Math.floor(Math.max(0, s) % 60);
		return `${m}:${r.toString().padStart(2, "0")}`;
	}
</script>

<!-- z-10 keeps the side glows from bleeding over the centre. Fixed width (sized
     for the long "TRANSITION SHIFT" label) so the bar never reflows. White rim
     top and bottom continues the halves' rim; the lavender side dividers are
     --scoreBarAccent. -->
<div
	class="relative z-10 w-72 flex flex-col items-center justify-center border-solid border-[color:var(--goon-rim-color)] border-y-[length:var(--goon-rim)] {underReview
		? 'bg-accentWarn gap-1.5 px-4 py-2'
		: 'px-5 pt-1.5 pb-3'}"
	style="{underReview ? '' : 'background: radial-gradient(120% 90% at 50% 0%, var(--goon-card-hi), var(--goon-card-lo) 70%);'} box-shadow: inset 6px 0 0 var(--scoreBarAccent), inset -6px 0 0 var(--scoreBarAccent);"
>
	{#if underReview}
		<!-- Official-FMS style: the whole timer square becomes the review card,
		     in the literal FRC attention yellow (accentWarn, never rebranded). -->
		<div class="goon-display uppercase text-center text-[30px] leading-[1.02] text-[oklch(0.18_0.04_60)]">
			Match<br />Under Review
		</div>
		<img src={Whistle} alt="" class="size-[104px] mb-1" />
	{:else}
		<!-- Hub active corner indicators (absolute, never shift content) -->
		{#if arrowSide === "left" || arrowSide === "both"}
			<svg
				width="18" height="22" viewBox="0 0 18 22"
				class="absolute top-2 left-3 arrow-glow"
				style={pulseLeft ? ARROW_PULSE : ""}
			>
				<path d="M 18 0 L 0 11 L 18 22 Z" fill="var(--accent)" />
			</svg>
		{/if}
		{#if arrowSide === "right" || arrowSide === "both"}
			<svg
				width="18" height="22" viewBox="0 0 18 22"
				class="absolute top-2 right-3 arrow-glow"
				style={pulseRight ? ARROW_PULSE : ""}
			>
				<path d="M 0 0 L 18 11 L 0 22 Z" fill="var(--accent)" />
			</svg>
		{/if}

		<!-- Shift counter row: sits between the hub arrows; fixed height so entering
		     teleop or ending the match never shifts the layout. -->
		<div class="h-8 flex items-baseline justify-center gap-3 whitespace-nowrap leading-none goon-display text-[30px] text-[oklch(0.82_0.05_303)]">
			{#if shiftIndex !== null}
				<Digits value="{shiftIndex}/6" />
				<Digits value=":{Math.max(0, Math.min(99, phaseTimer)).toString().padStart(2, '0')}" />
			{/if}
		</div>

		<!-- Phase label: fixed height so the timer never shifts when the label is
		     empty (PreMatch) or changes between phases. -->
		<div class="h-7 flex items-center justify-center whitespace-nowrap goon-label leading-none tracking-[0.12em] {phaseLabel === 'TRANSITION SHIFT' ? 'text-[20px]' : 'text-[24px]'} {highlightLabel ? 'text-accent' : 'text-white'}">
			{phaseLabel}
		</div>

		<div class="goon-display text-white text-[100px] leading-[0.95]">
			<Digits value={mmss(timer)} />
		</div>
	{/if}
</div>
