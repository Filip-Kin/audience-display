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

<div
	class="relative flex flex-col items-center justify-center"
	style="
		background: oklch(0 0 0 / 0.88);
		padding: 14px 28px;
		border-left: 6px solid var(--accentWarn);
		border-right: 6px solid var(--accentWarn);
		min-width: 240px;
	"
>
	<!-- Hub active corner indicators (absolute, never shift content) -->
	{#if arrowSide === "left" || arrowSide === "both"}
		<svg
			width="18" height="22" viewBox="0 0 18 22"
			style="position: absolute; top: 6px; left: 6px; filter: drop-shadow(0 0 5px oklch(0.86 0.18 92 / 0.9));"
		>
			<path d="M 18 0 L 0 11 L 18 22 Z" fill="var(--accentWarn)" />
		</svg>
	{/if}
	{#if arrowSide === "right" || arrowSide === "both"}
		<svg
			width="18" height="22" viewBox="0 0 18 22"
			style="position: absolute; top: 6px; right: 6px; filter: drop-shadow(0 0 5px oklch(0.86 0.18 92 / 0.9));"
		>
			<path d="M 0 0 L 18 11 L 0 22 Z" fill="var(--accentWarn)" />
		</svg>
	{/if}

	<!-- Phase label: never shifts, no arrows here -->
	{#if phaseLabel}
		<div
			class="uppercase"
			style="
				font-size: 20px;
				font-weight: 900;
				letter-spacing: 0.18em;
				color: {isEndgame ? 'var(--accentWarn)' : 'white'};
			"
		>
			{phaseLabel}
		</div>
	{/if}

	<div
		class="display tabular-nums text-white"
		style="font-size: 100px; line-height: 0.92; margin-top: 2px;"
	>
		{mmss(timer)}
	</div>
</div>
