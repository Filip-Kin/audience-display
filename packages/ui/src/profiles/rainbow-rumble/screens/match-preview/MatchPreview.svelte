<script lang="ts">
	import { state, eventDisplayName, activeProfile } from "@lib/state";
	import { settings } from "@lib/settings";
	import { createEventDispatcher, onMount } from "svelte";
	import { matchName } from "@lib/matchNamer";
	import Logo from "@lib/components/Logo.svelte";
	import Shutter from "@lib/components/Shutter.svelte";
	import MatchEventHeader from "@lib/components/MatchEventHeader.svelte";
	import AllianceSection from "@lib/components/AllianceSection.svelte";
	import MatchPreviewTeamCard from "./MatchPreviewTeamCard.svelte";

	export let exit = false;
	const dispatcher = createEventDispatcher();

	let ready = false;

	onMount(() => {
		setTimeout(() => { ready = true; }, 400);
	});

	$: if (exit) {
		ready = false;
		setTimeout(() => dispatcher("transitioned"), 500);
	}

	$: matchType = $state.match?.details.matchType ?? "q";
	$: isPlayoff = matchType !== "q" && matchType !== "t";
	// Match the score screen's arrangement: Blue on the left, Red on the right
	// when not inverted (the score screen puts blue-left/red-right).
	$: leftIsRed = $settings.invert;
	// Per-profile: alliance names on full-width red/blue bars (WRC). Off = plain.
	$: allianceNameBg = $activeProfile.options?.allianceNameBackground ?? false;
	$: leftTeams = leftIsRed ? $state.match?.teams.red ?? [] : $state.match?.teams.blue ?? [];
	$: rightTeams = leftIsRed ? $state.match?.teams.blue ?? [] : $state.match?.teams.red ?? [];

	$: leftAllianceName = isPlayoff
		? (leftIsRed ? $state.match?.details.redAlliance : $state.match?.details.blueAlliance) ?? (leftIsRed ? "RED ALLIANCE" : "BLUE ALLIANCE")
		: (leftIsRed ? "RED ALLIANCE" : "BLUE ALLIANCE");
	$: rightAllianceName = isPlayoff
		? (leftIsRed ? $state.match?.details.blueAlliance : $state.match?.details.redAlliance) ?? (leftIsRed ? "BLUE ALLIANCE" : "RED ALLIANCE")
		: (leftIsRed ? "BLUE ALLIANCE" : "RED ALLIANCE");

	$: matchLabel = $state.match
		? matchName($state.match.details.matchNumber, $state.eventDetails?.matchCount ?? 0, $state.match.details.matchType) ?? ""
		: "";
	$: eventLabel = $eventDisplayName;

	$: compact = leftTeams.length > 3 || rightTeams.length > 3;
	$: cardGap = compact ? 10 : 18;
</script>

{#if $state.match}
	<div class="rr fixed inset-0 overflow-hidden">
		<Shutter
			{exit}
			leftColor={leftIsRed ? "var(--primary)" : "var(--secondary)"}
			rightColor={leftIsRed ? "var(--secondary)" : "var(--primary)"}
		/>

		<!-- Centered header -->
		{#if ready}
			<div class="rr-header absolute left-0 right-0 flex justify-center top-7 z-10">
				<MatchEventHeader {eventLabel} {matchLabel} matchLabelSize="69px" />
			</div>
		{/if}

		{#if ready}
			<!-- Body grid: left lineup | VS | right lineup -->
			<div class="absolute grid items-center top-[200px] left-[60px] right-[60px] bottom-[60px] grid-cols-[1fr_auto_1fr] gap-10 z-10">
				<!-- Left alliance -->
				<div class="flex flex-col items-stretch" style="gap: {cardGap}px;">
					<div
						class="rr-display text-white text-[52px] leading-none tracking-[0.04em] {allianceNameBg
							? 'rounded-[24px] shadow-[0_6px_20px_oklch(0_0_0/0.5)]'
							: ''}"
						class:w-full={allianceNameBg}
						class:py-3={allianceNameBg}
						class:text-center={allianceNameBg}
						class:bg-redAlliance={allianceNameBg && leftIsRed}
						class:bg-blueAlliance={allianceNameBg && !leftIsRed}
					>
						{leftAllianceName}
					</div>

					<AllianceSection teams={leftTeams} alliance={leftIsRed ? "red" : "blue"} {ready} {compact} gap={cardGap}>
						<svelte:fragment slot="card" let:team let:index>
							<MatchPreviewTeamCard {team} alliance={leftIsRed ? "red" : "blue"} {compact} {index} showRank={!isPlayoff && !!team.rank} />
						</svelte:fragment>
					</AllianceSection>
				</div>

				<!-- Center VS -->
				<div class="flex flex-col items-center justify-center gap-7 mt-[190px] px-2">
					<div class="rr-display text-white text-[190px] leading-[0.8] tracking-[0.08em] [transform:scaleX(0.66)]">
						VS
					</div>
					<div class="h-2 w-40 rounded" style="background: var(--rr-rainbow);"></div>
					<Logo class="size-[230px] object-contain" />
				</div>

				<!-- Right alliance (mirrored) -->
				<div class="flex flex-col items-stretch" style="gap: {cardGap}px;">
					<div
						class="rr-display text-white text-[52px] leading-none tracking-[0.04em] text-right {allianceNameBg
							? 'rounded-[24px] shadow-[0_6px_20px_oklch(0_0_0/0.5)]'
							: ''}"
						class:w-full={allianceNameBg}
						class:py-3={allianceNameBg}
						class:!text-center={allianceNameBg}
						class:bg-blueAlliance={allianceNameBg && leftIsRed}
						class:bg-redAlliance={allianceNameBg && !leftIsRed}
					>
						{rightAllianceName}
					</div>

					<AllianceSection teams={rightTeams} alliance={leftIsRed ? "blue" : "red"} {ready} {compact} gap={cardGap}>
						<svelte:fragment slot="card" let:team let:index>
							<MatchPreviewTeamCard {team} alliance={leftIsRed ? "blue" : "red"} invert={true} {compact} {index} showRank={!isPlayoff && !!team.rank} />
						</svelte:fragment>
					</AllianceSection>
				</div>
			</div>
		{/if}
	</div>
{/if}

<style>
	/* MatchEventHeader is shared and can't be edited; round its card and swap
	   the gold match-name accent for the RR pink from outside. */
	.rr-header > :global(div) {
		border-radius: var(--rr-r);
	}
	.rr-header :global(.text-accentWarn) {
		color: var(--rr-accent);
	}
</style>
