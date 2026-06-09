<script lang="ts">
	import type { MatchPhase } from "lib";

	export let phase: MatchPhase;
	export let timer: number;
	export let arrowSide: "left" | "right" | "both" | "none";

	const PHASE_LABELS: Record<MatchPhase, string> = {
		PreMatch: "",
		Auto: "AUTO",
		TransitionShift: "TRANSITION",
		Shift1: "SHIFT 1",
		Shift2: "SHIFT 2",
		Shift3: "SHIFT 3",
		Shift4: "SHIFT 4",
		Endgame: "ENDGAME",
		PostMatch: "POST-MATCH",
	};

	$: phaseLabel = PHASE_LABELS[phase] ?? phase;
	$: isEndgame = phase === "Endgame";

	function mmss(s: number): string {
		const m = Math.floor(Math.max(0, s) / 60);
		const r = Math.floor(Math.max(0, s) % 60);
		return `${m}:${r.toString().padStart(2, "0")}`;
	}
</script>

<div class="relative flex flex-col items-center justify-center bg-[oklch(0_0_0/0.88)] px-7 py-3.5 border-l-[6px] border-r-[6px] border-accentWarn min-w-60">
	<!-- Hub active corner indicators (absolute, never shift content) -->
	{#if arrowSide === "left" || arrowSide === "both"}
		<svg
			width="18" height="22" viewBox="0 0 18 22"
			class="absolute top-1.5 left-1.5 drop-shadow-[0_0_5px_oklch(0.86_0.18_92/0.9)]"
		>
			<path d="M 18 0 L 0 11 L 18 22 Z" fill="var(--accentWarn)" />
		</svg>
	{/if}
	{#if arrowSide === "right" || arrowSide === "both"}
		<svg
			width="18" height="22" viewBox="0 0 18 22"
			class="absolute top-1.5 right-1.5 drop-shadow-[0_0_5px_oklch(0.86_0.18_92/0.9)]"
		>
			<path d="M 0 0 L 18 11 L 0 22 Z" fill="var(--accentWarn)" />
		</svg>
	{/if}

	<!-- Phase label: never shifts, no arrows here -->
	{#if phaseLabel}
		<div class="uppercase text-[20px] font-black tracking-[0.18em] {isEndgame ? 'text-accentWarn' : 'text-white'}">
			{phaseLabel}
		</div>
	{/if}

	<div class="display tabular-nums text-white text-[100px] leading-[0.92] mt-0.5">
		{mmss(timer)}
	</div>
</div>
