<script lang="ts">
	import { state } from "@lib/state";
	import AllianceSection from "@lib/components/AllianceSection.svelte";
	import RankingPoints from "@lib/components/RankingPoints.svelte";
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

	const bannerStyle = "h-16 flex flex-row bg-bannerAccent gap-4 items-center text-white text-5xl font-bold justify-center";
</script>

{#if $state.results && ready}
	<div class="flex flex-col gap-4 justify-start">
		<!-- Top status: winner/tie banner (or a spacer to hold layout) with the
		     playoff advancement banner attached directly beneath it. -->
		<div class="flex flex-col gap-1">
			{#if isWinner}
				<div class={bannerStyle}>
					<img src={Trophy} alt="Trophy" class="size-16" />
					<span class="align-middle">Winner</span>
					<img src={Trophy} alt="Trophy" class="size-16" />
				</div>
			{:else if isTie}
				<div class={bannerStyle}>
					<img src={Trophy} alt="Trophy" class="size-16" />
					<span class="align-middle">Tie!</span>
					<img src={Trophy} alt="Trophy" class="size-16" />
				</div>
			{:else}
				<div class="h-16"></div>
			{/if}

			{#if advancement}
				<div class="rounded shadow-lg text-center text-2xl font-bold uppercase tracking-[0.1em] py-2.5 px-3 {advancementClass}">
					{advancementText}
				</div>
			{/if}
		</div>

		{#if allianceName}
			<div class="flex flex-row shadow-lg rounded {alliance === 'red' ? 'bg-redAlliance' : 'bg-blueAlliance'} text-white p-4 gap-4 align-middle text-5xl font-bold justify-center">
				{allianceName}
			</div>
		{/if}

		<AllianceSection {alliance} {teams} {ready} {invert} showRank={!isPlayoff}>
			<svelte:fragment slot="bottom">
				{#if !isPlayoff}
					<RankingPoints {ready} {alliance} {invert} />
				{/if}
			</svelte:fragment>
		</AllianceSection>
	</div>
{/if}
