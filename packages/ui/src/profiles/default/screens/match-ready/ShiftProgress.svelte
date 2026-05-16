<script lang="ts">
	import { state } from "../../../../lib/state";
	import type { MatchPhase } from "lib";

	type Segment = { id: MatchPhase; label: string; getLength: () => number };

	$: gc = $state.gameConfig;
	$: segments = [
		{ id: "Auto" as MatchPhase, label: "Auto", getLength: () => 15 },
		{
			id: "TransitionShift" as MatchPhase,
			label: "Transition",
			getLength: () => gc?.coopShiftLengthSeconds ?? 10,
		},
		{
			id: "Shift1" as MatchPhase,
			label: "Shift 1",
			getLength: () => gc?.shift1LengthSeconds ?? 25,
		},
		{
			id: "Shift2" as MatchPhase,
			label: "Shift 2",
			getLength: () => gc?.shift2LengthSeconds ?? 25,
		},
		{
			id: "Shift3" as MatchPhase,
			label: "Shift 3",
			getLength: () => gc?.shift3LengthSeconds ?? 25,
		},
		{
			id: "Shift4" as MatchPhase,
			label: "Shift 4",
			getLength: () => gc?.shift4LengthSeconds ?? 25,
		},
		{
			id: "Endgame" as MatchPhase,
			label: "Endgame",
			getLength: () => gc?.endgameLengthSeconds ?? 30,
		},
	] satisfies Segment[];

	$: currentPhase = $state.match?.phase ?? "PreMatch";
	$: phaseTimer = $state.match?.phaseTimer ?? 0;
	$: currentIdx = segments.findIndex((s) => s.id === currentPhase);
</script>

<div class="flex gap-1 w-full h-3 px-2">
	{#each segments as seg, i}
		{@const length = seg.getLength()}
		{@const isCurrent = i === currentIdx}
		{@const isPast = currentIdx > i}
		{@const subFill = isCurrent && length > 0 ? Math.min(100, (phaseTimer / length) * 100) : 0}
		<div
			class="relative grow h-full bg-black/40 rounded-full overflow-hidden border border-white/10"
			title={seg.label}
		>
			{#if isPast}
				<div class="absolute inset-0 bg-white/60"></div>
			{:else if isCurrent}
				<div
					class="absolute inset-y-0 left-0 bg-accentWarn transition-[width] duration-300"
					style="width: {subFill}%"
				></div>
			{/if}
		</div>
	{/each}
</div>
