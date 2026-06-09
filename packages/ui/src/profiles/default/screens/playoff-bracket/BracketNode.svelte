<script lang="ts">
	import type { AudienceDoubleElimMatch } from "lib";

	export let match: AudienceDoubleElimMatch;
</script>

<div
	class="flex flex-col rounded overflow-hidden border border-white/20 min-w-44 {match.isNextMatch
		? 'ring-2 ring-accentWarn'
		: ''}"
>
	<div class="bg-surface text-text/80 text-xs px-2 py-1 uppercase tracking-wider truncate">
		{match.shortName}
	</div>
	<div
		class="flex items-center justify-between px-2 py-1 {match.winningAllianceType === 'Red'
			? 'bg-redAlliance text-white font-bold'
			: 'bg-redAlliance/40 text-white'}"
	>
		<span class="text-sm">Alliance {match.redAllianceNumber || "-"}</span>
		<span class="tabular-nums text-sm">{match.isComplete ? match.redAllianceScore : ""}</span>
	</div>
	<div
		class="flex items-center justify-between px-2 py-1 {match.winningAllianceType === 'Blue'
			? 'bg-blueAlliance text-white font-bold'
			: 'bg-blueAlliance/40 text-white'}"
	>
		<span class="text-sm">Alliance {match.blueAllianceNumber || "-"}</span>
		<span class="tabular-nums text-sm">{match.isComplete ? match.blueAllianceScore : ""}</span>
	</div>
</div>
