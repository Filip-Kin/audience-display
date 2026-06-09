<script lang="ts">
	export let fuelCount: number;
	export let energizedThreshold: number;
	export let superchargedThreshold: number;
	export let energizedAchieved: boolean;
	export let superchargedAchieved: boolean;

	// 270° arc from 7:30 clockwise to 4:30, with a 90° gap centered at the
	// bottom (fuel-gauge style).
	const RADIUS = 44;
	const ARC_PATH = `M ${50 - RADIUS * Math.cos(Math.PI / 4)} ${50 + RADIUS * Math.sin(Math.PI / 4)} A ${RADIUS} ${RADIUS} 0 1 1 ${50 + RADIUS * Math.cos(Math.PI / 4)} ${50 + RADIUS * Math.sin(Math.PI / 4)}`;
	const ARC_LENGTH = 2 * Math.PI * RADIUS * 0.75;

	// Two-phase fill: arc fills to full for Energized, then resets and fills
	// again for Supercharged. Once both achieved, arc is solid yellow.
	$: progress = (() => {
		if (superchargedAchieved) return 1;
		if (energizedAchieved) {
			const span = superchargedThreshold - energizedThreshold;
			if (span <= 0) return 1;
			return Math.max(0, Math.min(1, (fuelCount - energizedThreshold) / span));
		}
		if (energizedThreshold <= 0) return 1;
		return Math.max(0, Math.min(1, fuelCount / energizedThreshold));
	})();

	// White while filling toward Energized; yellow once Energized is achieved.
	$: arcColor = energizedAchieved ? "var(--accentWarn)" : "white";
</script>

<div class="flex flex-col items-center gap-1">
	<div class="relative size-28">
		<svg viewBox="0 0 100 100" width="112" height="112" class="block">
			<path
				d={ARC_PATH}
				fill="none"
				stroke="oklch(0 0 0 / 0.4)"
				stroke-width="10"
				stroke-linecap="butt"
			/>
			<path
				d={ARC_PATH}
				fill="none"
				stroke={arcColor}
				stroke-width="10"
				stroke-linecap="round"
				stroke-dasharray="{progress * ARC_LENGTH} {ARC_LENGTH}"
				style="transition: stroke-dasharray 200ms ease-out, stroke 150ms;"
			/>
		</svg>
		<div class="absolute inset-0 flex items-center justify-center pointer-events-none">
			<div class="display tabular-nums text-white text-[32px] leading-none">
				{fuelCount}
			</div>
		</div>
	</div>
	<div class="uppercase text-white text-sm font-black tracking-[0.22em]">
		Fuel
	</div>
</div>
