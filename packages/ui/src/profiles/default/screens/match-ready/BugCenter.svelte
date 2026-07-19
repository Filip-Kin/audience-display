<script lang="ts">
	import type { MatchPhase } from "lib";

	export let phase: MatchPhase;
	export let timer: number;
	export let arrowSide: "left" | "right" | "both" | "none";
	/** Pulse the active-hub arrow on a side when its goal is about to close. */
	export let pulseLeft: boolean = false;
	export let pulseRight: boolean = false;
	/** Show "MATCH OVER" instead of the phase label once the match has ended. */
	export let matchOver: boolean = false;

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

	function mmss(s: number): string {
		const m = Math.floor(Math.max(0, s) / 60);
		const r = Math.floor(Math.max(0, s) % 60);
		return `${m}:${r.toString().padStart(2, "0")}`;
	}
</script>

<!-- z-10 keeps the active-side glow from bleeding over the center. Fixed width
     (sized for the long "TRANSITION SHIFT" label) so the bar never reflows. -->
<div class="relative z-10 flex flex-col items-center justify-center bg-[oklch(0_0_0/0.88)] px-6 py-3.5 border-l-[6px] border-r-[6px] border-accentWarn w-72">
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

	<!-- Phase label: fixed height so the timer never shifts up/down when the
	     label is empty (PreMatch) or changes between phases. -->
	<div class="h-7 flex items-center justify-center whitespace-nowrap uppercase text-[19px] font-black tracking-[0.1em] leading-none {highlightLabel ? 'text-accentWarn' : 'text-white'}">
		{phaseLabel}
	</div>

	<div class="display tabular-nums text-white text-[100px] leading-[0.92]">
		{mmss(timer)}
	</div>
</div>
