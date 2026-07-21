<script lang="ts">
	import type { BracketData, AudienceBracketAlliance } from "lib";

	export let bracket: BracketData;

	$: alliances = [...bracket.alliances].sort((a, b) => a.allianceNumber - b.allianceNumber);

	// Double elim: two losses and you're out. Ties have no winner, so they
	// count against nobody. (Finals results live outside this list.)
	$: lossCounts = (() => {
		const counts = new Map<number, number>();
		for (const m of bracket.doubleElimMatchesList) {
			if (!m.isComplete || m.winningAllianceType === "None") continue;
			const loser =
				m.winningAllianceType === "Red" ? m.blueAllianceNumber : m.redAllianceNumber;
			if (loser) counts.set(loser, (counts.get(loser) ?? 0) + 1);
		}
		return counts;
	})();

	// Each bar shows exactly the teams that alliance has: a backup call gives
	// just that alliance a 4th pill while the rest keep three full-width slots.
	const slotNumbers = (a: AudienceBracketAlliance): number[] =>
		[a.captainTeamNumber, a.firstRoundTeamNumber, a.secondRoundTeamNumber, a.alternateTeamNumber]
			.filter((n) => n > 0);
</script>

<!-- Full-screen version of the alliance-selection bars: same look, bigger, with
     "ALLIANCE" spelled out in the chip. -->
<div class="flex flex-col justify-center h-full gap-3">
	{#each alliances as alliance, allianceIdx (alliance.allianceNumber)}
		{@const eliminated = (lossCounts.get(alliance.allianceNumber) ?? 0) >= 2}
		<div
			class="anim-right relative flex-1 min-h-0 max-h-[110px] {eliminated ? 'opacity-45 grayscale' : ''}"
			style="--anim-delay: {allianceIdx * 0.18}s;"
		>
			<div class="grid items-stretch h-full grid-cols-[290px_1fr] rounded-lg overflow-hidden bg-white">
				<div class="rr-display flex items-center justify-center gap-3 text-[40px] text-white bg-[oklch(0.32_0.01_250)]">
					ALLIANCE {alliance.allianceNumber}
				</div>

				<div class="flex items-center gap-2.5 px-3.5 py-2">
					{#each slotNumbers(alliance) as teamNumber}
						<div
							class="rr-display flex items-center justify-center flex-1 min-w-0 h-full text-[52px] leading-none rounded-md"
							style="
								background: oklch(0.16 0 0);
								color: var(--rr-accent);
							"
						>
							{teamNumber}
						</div>
					{/each}
				</div>
			</div>
			{#if eliminated}
				<div class="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-[6px] rounded bg-[oklch(0.2_0_0/0.85)]"></div>
			{/if}
		</div>
	{/each}
</div>
