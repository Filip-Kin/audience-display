<script lang="ts">
	import type { MatchPhase } from "lib";

	export let phase: MatchPhase;
	export let timer: number;
	// Which side the yellow hub-active arrow protrudes from on this center
	// panel. Computed by parent from match.hubActive + settings.invert.
	export let arrowSide: "left" | "right" | "none";

	const PHASE_LABELS: Record<MatchPhase, string> = {
		PreMatch: "PRE-MATCH",
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
	<div
		class="display tabular-nums text-white"
		style="font-size: 100px; line-height: 0.92; margin-top: 2px;"
	>
		{mmss(timer)}
	</div>

	{#if arrowSide === "left"}
		<div
			class="absolute ad-pulse-opacity"
			style="top: 50%; transform: translateY(-50%); left: -14px;"
		>
			<svg
				width="56"
				height="72"
				viewBox="0 0 56 72"
				style="
					transform: scaleX(-1);
					filter: drop-shadow(0 0 12px oklch(0.86 0.18 92 / 0.6));
					display: block;
				"
			>
				<path d="M 0 0 L 48 36 L 0 72 Z" fill="var(--accentWarn)" />
			</svg>
		</div>
	{:else if arrowSide === "right"}
		<div
			class="absolute ad-pulse-opacity"
			style="top: 50%; transform: translateY(-50%); right: -14px;"
		>
			<svg
				width="56"
				height="72"
				viewBox="0 0 56 72"
				style="
					filter: drop-shadow(0 0 12px oklch(0.86 0.18 92 / 0.6));
					display: block;
				"
			>
				<path d="M 0 0 L 48 36 L 0 72 Z" fill="var(--accentWarn)" />
			</svg>
		</div>
	{/if}
</div>
