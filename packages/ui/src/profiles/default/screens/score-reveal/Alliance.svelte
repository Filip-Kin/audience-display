<script lang="ts">
	import { state } from "@lib/state";
	import AllianceSection from "@lib/components/AllianceSection.svelte";
	import RankingPoints from "@lib/components/RankingPoints.svelte";
	import Trophy from "../../../../assets/trophy.svg";

	export let ready: boolean;
	export let alliance: "red" | "blue";
	export let invert: boolean = false;

	$: isPlayoff = $state.results?.details.matchType === "sf" || $state.results?.details.matchType === "f";
	$: allianceName = $state.results?.details[alliance === "red" ? "redAlliance" : "blueAlliance"];
	$: winner = $state.results?.score.winner;
	$: isWinner = winner === (alliance === "red" ? "Red" : "Blue");
	$: isTie = winner === "Tie";
	$: teams = $state.results?.teams[alliance] ?? [];

	const bannerStyle = "h-16 flex flex-row bg-bannerAccent gap-4 items-center text-white text-5xl font-bold justify-center";
</script>

{#if $state.results && ready}
	<div class="flex flex-col gap-4 justify-start">
		{#if allianceName}
			<div class="flex flex-col shadow-lg rounded overflow-hidden">
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
				<div class="flex flex-row {alliance === 'red' ? 'bg-redAlliance' : 'bg-blueAlliance'} text-white p-4 gap-4 align-middle text-5xl font-bold justify-center">
					{allianceName}
				</div>
			</div>
		{:else if isWinner}
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

		<AllianceSection {alliance} {teams} {ready} {invert} showRank={!isPlayoff}>
			<svelte:fragment slot="bottom">
				{#if !isPlayoff}
					<RankingPoints {ready} {alliance} {invert} />
				{/if}
			</svelte:fragment>
		</AllianceSection>
	</div>
{/if}
