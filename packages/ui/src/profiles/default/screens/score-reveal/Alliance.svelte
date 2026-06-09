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
	$: hasCard = teams.some(t => t.card === "Yellow" || t.card === "Red");

	// For playoff advancement: find the bracket match to get the alliance number,
	// then check if the losing alliance has any future incomplete matches.
	$: allianceNumber = (() => {
		if (!isPlayoff || !$state.results || !$state.bracket) return null;
		const matchNum = $state.results.details.matchNumber;
		const match =
			$state.bracket.doubleElimMatchesList.find(m => m.isComplete && m.matchNumber === matchNum)
			?? (isFinals && $state.bracket.finals?.isComplete ? $state.bracket.finals : null);
		if (!match) return null;
		return alliance === "red" ? match.redAllianceNumber : match.blueAllianceNumber;
	})();

	$: advancementStatus = (() => {
		if (!isPlayoff || allianceNumber === null) return null;
		if (isFinals) return isWinner ? "champion" : "finalist";
		if (isWinner) return "advances";
		const stillAlive = $state.bracket?.doubleElimMatchesList.some(
			m => !m.isComplete && (m.redAllianceNumber === allianceNumber || m.blueAllianceNumber === allianceNumber)
		);
		return stillAlive ? "advances" : "eliminated";
	})();

	const bannerStyle = "h-16 flex flex-row bg-bannerAccent gap-4 items-center text-white text-5xl font-bold justify-center";
</script>

{#if $state.results && ready}
	<div class="flex flex-col gap-4 justify-start">
		<!-- Winner / tie banner (or spacer to hold layout when unnamed qual alliance) -->
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

		{#if allianceName}
			<div class="flex flex-col shadow-lg rounded overflow-hidden">
				{#if hasCard && isPlayoff}
					<div class="bg-accentWarn text-[oklch(0.18_0.04_60)] text-center text-xs font-black tracking-[0.2em] uppercase py-1">
						Card
					</div>
				{/if}
				<div class="flex flex-row {alliance === 'red' ? 'bg-redAlliance' : 'bg-blueAlliance'} text-white p-4 gap-4 align-middle text-5xl font-bold justify-center">
					{allianceName}
				</div>
				{#if advancementStatus}
					<div class="text-center text-xs font-black tracking-[0.2em] uppercase py-1.5
						{advancementStatus === 'eliminated' ? 'bg-[oklch(0.22_0.01_250)] text-white/60' :
						 advancementStatus === 'champion' ? 'bg-accentWarn text-[oklch(0.18_0.04_60)]' :
						 'bg-[oklch(0.28_0.01_250)] text-white/80'}">
						{advancementStatus === 'champion' ? 'Champion' :
						 advancementStatus === 'finalist' ? 'Finalist' :
						 advancementStatus === 'advances' ? 'Advances' : 'Eliminated'}
					</div>
				{/if}
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
