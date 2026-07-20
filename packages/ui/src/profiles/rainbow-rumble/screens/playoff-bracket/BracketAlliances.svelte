<script lang="ts">
	import type { BracketData, AudienceBracketAlliance } from "lib";

	export let bracket: BracketData;

	$: alliances = [...bracket.alliances].sort((a, b) => a.allianceNumber - b.allianceNumber);
	// Alternate slot only when at least one alliance actually has one, so the
	// usual 3-team offseason bars don't carry a permanently empty column.
	$: hasAlternates = alliances.some((a) => a.alternateTeamNumber > 0);

	const slotNumbers = (a: AudienceBracketAlliance, alt: boolean): number[] => {
		const slots = [a.captainTeamNumber, a.firstRoundTeamNumber, a.secondRoundTeamNumber];
		if (alt) slots.push(a.alternateTeamNumber);
		return slots;
	};
</script>

<!-- Full-screen version of the alliance-selection bars: same look, bigger, with
     "ALLIANCE" spelled out in the chip. -->
<div class="flex flex-col justify-center h-full gap-3">
	{#each alliances as alliance, allianceIdx (alliance.allianceNumber)}
		<div class="anim-right flex-1 min-h-0 max-h-[110px]" style="--anim-delay: {allianceIdx * 0.18}s;">
			<div class="grid items-stretch h-full grid-cols-[290px_1fr] rounded-lg overflow-hidden bg-white">
				<div class="rr-display flex items-center justify-center gap-3 text-[40px] text-white bg-[oklch(0.32_0.01_250)]">
					ALLIANCE {alliance.allianceNumber}
				</div>

				<div class="flex items-center gap-2.5 px-3.5 py-2">
					{#each slotNumbers(alliance, hasAlternates) as teamNumber}
						<div
							class="rr-display flex items-center justify-center flex-1 min-w-0 h-full text-[52px] leading-none rounded-md"
							style="
								background: oklch(0.16 0 0);
								color: var(--rr-accent);
								visibility: {teamNumber > 0 ? 'visible' : 'hidden'};
							"
						>
							{teamNumber > 0 ? teamNumber : ""}
						</div>
					{/each}
				</div>
			</div>
		</div>
	{/each}
</div>
