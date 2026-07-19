<script lang="ts">
	import { state } from "@lib/state";
	import AllianceSection from "@lib/components/AllianceSection.svelte";
	import Avatar from "@lib/components/Avatar.svelte";
	import RrRankingPoints from "./RrRankingPoints.svelte";
	import Trophy from "../../../../assets/trophy.svg";

	export let ready: boolean;
	export let alliance: "red" | "blue";
	export let invert: boolean = false;

	$: isPlayoff = $state.results?.details.matchType === "sf" || $state.results?.details.matchType === "f";
	$: isFinals = $state.results?.details.matchType === "f";
	$: allianceName = $state.results?.details[alliance === "red" ? "redAlliance" : "blueAlliance"];
	$: winner = $state.results?.score.winner;
	$: isWinner = winner === (alliance === "red" ? "Red" : "Blue");
	$: isTie = winner === "Tie";
	$: teams = $state.results?.teams[alliance] ?? [];

	$: allianceBg = alliance === "red" ? "bg-redAlliance" : "bg-blueAlliance";

	// Standard 8-alliance double-elim topology (FRC game manual Table 10-2). Where each
	// alliance goes next is fully determined by the match number + win/loss, so we don't
	// need to walk the bracket data. Matches 14-16 are the finals.
	const WINNER_NEXT: Record<number, number> = { 1: 7, 2: 7, 3: 8, 4: 8, 5: 10, 6: 9, 7: 11, 8: 11, 9: 12, 10: 12, 11: 14, 12: 13, 13: 14 };
	const LOSER_NEXT: Record<number, number> = { 1: 5, 2: 5, 3: 6, 4: 6, 7: 9, 8: 10, 11: 13 };
	const LOWER_MATCHES = new Set([5, 6, 9, 10, 12, 13]);

	/** Where this alliance heads after the match — drives the banner on the winner side. */
	$: advancement = ((): { kind: "finals" | "eliminated" } | { kind: "advances"; bracket: "Upper" | "Lower"; matchNumber: number } | null => {
		if (!isPlayoff || !$state.results) return null;
		if (winner !== "Red" && winner !== "Blue") return null; // no advancement on a tie / no result

		const cur = $state.results.details.matchNumber;
		// The finals matches (M14-16) decide the event; no advancement banner on them.
		if (isFinals || cur >= 14) return null;

		// Detailed advancement is the standard 8-alliance bracket only; bail on other sizes.
		if ($state.bracket?.allianceCount && $state.bracket.allianceCount !== "EightAlliance") return null;

		const next = isWinner ? WINNER_NEXT[cur] : LOSER_NEXT[cur];
		if (next === undefined) return { kind: "eliminated" };
		if (next >= 14) return { kind: "finals" };
		return { kind: "advances", bracket: LOWER_MATCHES.has(next) ? "Lower" : "Upper", matchNumber: next };
	})();

	$: advancementText =
		advancement === null ? "" :
		advancement.kind === "advances" ? `Advances to ${advancement.bracket} Bracket - Match ${advancement.matchNumber}` :
		advancement.kind === "finals" ? "Advances to Finals" :
		"Eliminated";

	// Neutral gray for every advancement/elimination label so nothing clashes with the rest of the screen.
	$: advancementClass = advancement === null ? "" : "bg-[oklch(0.40_0.01_255)] text-white";
</script>

{#if $state.results && ready}
	<div class="flex flex-col gap-3.5 justify-start">
		<!-- Top status: rainbow Winner/Tie banner, or a 60px spacer on the loser so
		     both alliance cards keep the same height. Playoff advancement attaches
		     beneath. -->
		<div class="flex flex-col gap-1">
			{#if isWinner}
				<div
					class="h-[60px] flex flex-row items-center justify-center gap-4 text-white text-[44px] font-bold rounded-[var(--rr-r-sm)]"
					style="background: var(--rr-rainbow);"
				>
					<img src={Trophy} alt="Trophy" class="size-11" />
					<span>Winner</span>
					<img src={Trophy} alt="Trophy" class="size-11" />
				</div>
			{:else if isTie}
				<!-- Both cards get the banner on a tie so the result reads at a glance -->
				<div
					class="h-[60px] flex flex-row items-center justify-center text-white text-[44px] font-bold rounded-[var(--rr-r-sm)]"
					style="background: var(--rr-rainbow);"
				>
					<span>Tie</span>
				</div>
			{:else}
				<div class="h-[60px]"></div>
			{/if}

			{#if advancement}
				<div class="rounded-[var(--rr-r-chip)] shadow-lg text-center text-2xl font-bold uppercase tracking-[0.1em] py-2.5 px-3 {advancementClass}">
					{advancementText}
				</div>
			{/if}
		</div>

		{#if allianceName}
			<div class="flex items-center justify-center {allianceBg} text-white p-3.5 rounded-[var(--rr-r-sm)] text-[40px] font-bold">
				{allianceName}
			</div>
		{/if}

		<AllianceSection {alliance} {teams} {ready} {invert} showRank={!isPlayoff} gap={10}>
			<svelte:fragment slot="card" let:team let:index>
				<div
					class="ad-in rounded-2xl overflow-hidden shadow-[0_6px_20px_oklch(0_0_0/0.55)]"
					style="animation-delay: {index * 70}ms;"
				>
					<div class="flex items-center gap-3 {allianceBg} text-white px-3.5 py-2">
						<div class="size-[46px] flex items-center justify-center flex-none">
							<Avatar avatar={team.avatar} team={team.number} alt="Team {team.number}" class="size-[42px] object-contain" />
						</div>
						<span class="rr-display text-[40px] leading-[0.9]">{team.number}</span>
					</div>
					<div class="flex items-center gap-2 bg-white text-[oklch(0.16_0_0)] px-3.5 py-[5px]">
						<span class="min-w-0 flex-1 text-[28px] font-bold whitespace-nowrap overflow-hidden text-ellipsis">
							{team.name}
						</span>
						{#if team.card && team.card !== "None"}
							<span class="flex-none w-9 h-6 rounded border {team.card === 'Red' ? 'bg-red-600 border-red-900' : 'bg-yellow-400 border-yellow-800'}"></span>
						{/if}
						{#if !isPlayoff && team.rank}
							<span class="flex-none flex items-center gap-1 text-[28px] font-bold tabular-nums">
								{team.rank}
								{#if team.rankChange === "Up"}
									<img src="/rainbow-rumble/arrow-up.svg" alt="up" class="size-7" />
								{:else if team.rankChange === "Down"}
									<img src="/rainbow-rumble/arrow-down.svg" alt="down" class="size-7" />
								{:else if team.rankChange === "NoChange"}
									<img src="/rainbow-rumble/no-change.svg" alt="no change" class="size-7" />
								{/if}
							</span>
						{/if}
					</div>
				</div>
			</svelte:fragment>

			<svelte:fragment slot="bottom">
				{#if !isPlayoff}
					<RrRankingPoints {ready} {alliance} {invert} />
				{/if}
			</svelte:fragment>
		</AllianceSection>
	</div>
{/if}
