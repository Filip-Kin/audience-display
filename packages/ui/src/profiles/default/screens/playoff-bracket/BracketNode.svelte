<script lang="ts">
	import type { AudienceDoubleElimMatch, AudienceBracketAlliance } from "lib";

	export let match: AudienceDoubleElimMatch;
	/** Smaller type for embedded uses (timeout slideshow). */
	export let compact = false;
	/** Alliance number -> full alliance, for listing every team in the box. */
	export let alliances: Map<number, AudienceBracketAlliance> | null = null;

	const teamsOf = (allianceNumber: number | null): number[] => {
		if (!allianceNumber || !alliances) return [];
		const a = alliances.get(allianceNumber);
		if (!a) return [];
		return [
			a.captainTeamNumber,
			a.firstRoundTeamNumber,
			a.secondRoundTeamNumber,
			a.alternateTeamNumber,
		].filter((n): n is number => !!n);
	};

	// Both rows share the wider score's digit width so a 5 and a 105 line up.
	$: scoreCh = Math.max(
		String(match.redAllianceScore ?? 0).length,
		String(match.blueAllianceScore ?? 0).length,
	);
</script>

<!-- Next match: yellow header + the alliance-selection scale pulse -->
<div
	class="flex flex-col overflow-hidden border border-white/25 {match.isNextMatch
		? 'ad-pulse'
		: ''}"
>
	<div
		class="uppercase tracking-wider truncate {compact
			? 'text-[11px] px-1.5 py-0.5'
			: 'text-[15px] px-3 py-1'} {match.isNextMatch
			? 'bg-accentWarn text-[oklch(0.18_0.04_60)] font-black'
			: 'bg-[oklch(0.32_0.01_250)] text-text/80'}"
	>
		{match.shortName ?? "Finals"}
	</div>
	{#each [
		{
			alliance: match.redAllianceNumber,
			score: match.redAllianceScore,
			won: match.winningAllianceType === "Red",
			edge: "border-redAlliance",
			fill: "bg-redAlliance",
		},
		{
			alliance: match.blueAllianceNumber,
			score: match.blueAllianceScore,
			won: match.winningAllianceType === "Blue",
			edge: "border-blueAlliance",
			fill: "bg-blueAlliance",
		},
	] as side}
		<!-- Colored left edge marks the alliance color; only the winner gets the full fill. -->
		<div
			class="flex items-center justify-between text-white {side.edge} {compact
				? 'border-l-[3px] px-1.5 py-0.5 gap-1'
				: 'border-l-[6px] pl-2.5 pr-1.5 py-1 gap-2'} {side.won
				? `${side.fill} font-bold`
				: 'bg-[oklch(0.19_0.012_250)]'}"
		>
			<span class="display leading-none {compact ? 'text-[17px]' : 'text-[30px]'}">
				{side.alliance ? `A${side.alliance}` : "-"}
			</span>
			{#if !compact}
				<span class="flex-1 flex gap-1 min-w-0">
					{#each teamsOf(side.alliance) as team (team)}
						<span class="flex-1 min-w-0 text-center tabular-nums text-[15px] leading-none py-1 bg-[oklch(1_0_0/0.3)]">
							{team}
						</span>
					{/each}
				</span>
			{/if}
			{#if match.isComplete}
				<span class="display tabular-nums leading-none text-right {compact ? 'text-[17px]' : 'text-[30px]'}" style="min-width: {scoreCh}ch;">
					{side.score}
				</span>
			{/if}
		</div>
	{/each}
</div>
