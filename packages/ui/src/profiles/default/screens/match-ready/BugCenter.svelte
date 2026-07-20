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

	const ARROW_PULSE = "animation: arrow-blink 0.6s ease-in-out infinite; transform-origin: center;";

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

<!-- z-10 keeps the active-side glow from bleeding over the center. Fixed width
     (sized for the long "TRANSITION SHIFT" label) so the bar never reflows. -->
<!-- pt-1 lifts the shift counter onto the same line as the hub arrows
     (absolute top-1.5), with the leftover space below balancing the gap to
     the phase label. -->
<div
	class="relative z-10 flex flex-col items-center justify-center {underReview
		? 'bg-accentWarn gap-1.5 px-4 py-2'
		: 'bg-[oklch(0_0_0/0.88)] px-6 pt-1 pb-3.5'} border-l-[6px] border-r-[6px] border-accentWarn w-72"
>
	{#if underReview}
		<!-- Official-FMS style: the whole timer square becomes the review card. -->
		<div class="display uppercase text-center text-[27px] leading-[1.05] text-[oklch(0.18_0.04_60)]">
			Match<br />Under Review
		</div>
		<img src={Whistle} alt="" class="size-[112px] mb-1.5" />
	{:else}
	<!-- Hub active corner indicators (absolute, never shift content) -->
	{#if arrowSide === "left" || arrowSide === "both"}
		<svg
			width="18" height="22" viewBox="0 0 18 22"
			class="absolute top-1.5 left-1.5 drop-shadow-[0_0_5px_oklch(0.86_0.18_92/0.9)]"
			style={pulseLeft ? ARROW_PULSE : ""}
		>
			<path d="M 18 0 L 0 11 L 18 22 Z" fill="var(--accentWarn)" />
		</svg>
	{/if}
	{#if arrowSide === "right" || arrowSide === "both"}
		<svg
			width="18" height="22" viewBox="0 0 18 22"
			class="absolute top-1.5 right-1.5 drop-shadow-[0_0_5px_oklch(0.86_0.18_92/0.9)]"
			style={pulseRight ? ARROW_PULSE : ""}
		>
			<path d="M 0 0 L 18 11 L 0 22 Z" fill="var(--accentWarn)" />
		</svg>
	{/if}

	<!-- Shift counter row: sits between the hub arrows; fixed height so entering
	     teleop or ending the match never shifts the layout. -->
	<div class="h-8 flex items-baseline justify-center gap-3 whitespace-nowrap tabular-nums font-black leading-none text-dim">
		{#if shiftIndex !== null}
			<span class="text-[32px]">{shiftIndex}/6</span>
			<span class="text-[32px]">:{Math.max(0, Math.min(99, phaseTimer)).toString().padStart(2, "0")}</span>
		{/if}
	</div>

	<!-- Phase label: fixed height so the timer never shifts up/down when the
	     label is empty (PreMatch) or changes between phases. -->
	<div class="h-7 flex items-center justify-center whitespace-nowrap uppercase font-black tracking-[0.1em] leading-none {phaseLabel === 'TRANSITION SHIFT' ? 'text-[19px]' : 'text-[23px]'} {highlightLabel ? 'text-accentWarn' : 'text-white'}">
		{phaseLabel}
	</div>

	<div class="display tabular-nums text-white text-[100px] leading-[0.92]">
		{mmss(timer)}
	</div>
	{/if}
</div>
