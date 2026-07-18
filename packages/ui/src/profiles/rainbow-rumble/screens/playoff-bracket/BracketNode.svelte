<script lang="ts">
	import type { AudienceDoubleElimMatch, AudienceBracketAlliance } from "lib";

	export let match: AudienceDoubleElimMatch;
	/** Smaller type for embedded uses (timeout slideshow). */
	export let compact = false;
	/** Alliance number -> full alliance, for listing every team in the box. */
	export let alliances: Map<number, AudienceBracketAlliance> | null = null;

	const teamsOf = (allianceNumber: number | null): string => {
		if (!allianceNumber || !alliances) return "";
		const a = alliances.get(allianceNumber);
		if (!a) return "";
		return [
			a.captainTeamNumber,
			a.firstRoundTeamNumber,
			a.secondRoundTeamNumber,
			a.alternateTeamNumber,
		]
			.filter((n): n is number => !!n)
			.join("  ");
	};
</script>

<!-- Next match: accent header + scale pulse -->
<div
	class="flex flex-col overflow-hidden rounded-lg border border-white/25"
	style={match.isNextMatch ? "animation: rr-pulse 1.6s ease-in-out infinite; transform-origin: center;" : ""}
>
	<div
		class="uppercase tracking-wider truncate {compact
			? 'text-[11px] px-1.5 py-0.5'
			: 'text-[15px] px-3 py-1'} {match.isNextMatch ? 'text-white font-black' : ''}"
		style="background: {match.isNextMatch ? 'var(--rr-rainbow)' : 'var(--surface)'};
			{match.isNextMatch ? '' : 'color: oklch(0.98 0.005 250 / 0.85);'}"
	>
		{#if match.isNextMatch}
			<!-- Black chip keeps the label legible on the rainbow strip -->
			<span class="inline-block bg-[oklch(0_0_0/0.7)] rounded {compact ? 'px-1' : 'px-2 py-0.5'}">
				{match.shortName ?? "Finals"}
			</span>
		{:else}
			{match.shortName ?? "Finals"}
		{/if}
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
				: 'border-l-[6px] px-2.5 py-1 gap-2'} {side.won
				? `${side.fill} font-bold`
				: 'bg-[oklch(0.19_0.012_250)]'}"
		>
			<span class="rr-display leading-none {compact ? 'text-[15px]' : 'text-[26px]'}">
				{side.alliance ? `A${side.alliance}` : "-"}
			</span>
			{#if !compact}
				<span class="flex-1 tabular-nums text-[14px] leading-tight text-center opacity-85 truncate">
					{teamsOf(side.alliance)}
				</span>
			{/if}
			<span class="rr-display tabular-nums leading-none {compact ? 'text-[15px]' : 'text-[26px]'}">
				{match.isComplete ? side.score : ""}
			</span>
		</div>
	{/each}
</div>
