<script lang="ts">
	import { state, eventDisplayName } from "@lib/state";
	import { settings } from "@lib/settings";
	import { createEventDispatcher, onMount } from "svelte";
	import { defaultAvatar } from "@lib/avatar";
	import { matchName } from "@lib/matchNamer";
	import Logo from "@lib/components/Logo.svelte";
	import Shutter from "@lib/components/Shutter.svelte";
	import MatchEventHeader from "@lib/components/MatchEventHeader.svelte";
	import AllianceSection from "@lib/components/AllianceSection.svelte";

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
	$: leftIsRed = !$settings.invert;
	$: leftTeams = leftIsRed ? $state.match?.teams.red ?? [] : $state.match?.teams.blue ?? [];
	$: rightTeams = leftIsRed ? $state.match?.teams.blue ?? [] : $state.match?.teams.red ?? [];

	$: leftAllianceName = isPlayoff
		? (leftIsRed ? $state.match?.details.redAlliance : $state.match?.details.blueAlliance) ?? (leftIsRed ? "RED" : "BLUE")
		: (leftIsRed ? "RED" : "BLUE");
	$: rightAllianceName = isPlayoff
		? (leftIsRed ? $state.match?.details.blueAlliance : $state.match?.details.redAlliance) ?? (leftIsRed ? "BLUE" : "RED")
		: (leftIsRed ? "BLUE" : "RED");

	$: matchLabel = $state.match
		? matchName($state.match.details.matchNumber, $state.eventDetails?.matchCount ?? 0, $state.match.details.matchType) ?? ""
		: "";
	$: eventLabel = $eventDisplayName;

	$: compact = leftTeams.length > 3 || rightTeams.length > 3;
	$: avatarSize = compact ? 64 : 160;
	$: numFont = compact ? 72 : 96;
	$: nameFont = compact ? 24 : 32;
	$: rankFont = compact ? 44 : 56;
	$: cardPad = compact ? "10px 12px" : "18px 24px";
	$: leftCols = compact ? "72px 1fr 60px" : "120px 1fr 76px";
	$: rightCols = compact ? "60px 1fr 72px" : "76px 1fr 120px";
	$: cardGap = compact ? 10 : 18;
</script>

{#if $state.match}
	<div class="fixed inset-0 overflow-hidden">
		<Shutter
			{exit}
			leftColor={leftIsRed ? "var(--primary)" : "var(--secondary)"}
			rightColor={leftIsRed ? "var(--secondary)" : "var(--primary)"}
		/>

		<!-- Centered header -->
		{#if ready}
			<div class="absolute left-0 right-0 flex justify-center" style="top: 28px; z-index: 10;">
				<MatchEventHeader {eventLabel} {matchLabel} />
			</div>
		{/if}

		{#if ready}
			<!-- Body grid: left lineup | VS | right lineup -->
			<div
				class="absolute grid items-center"
				style="
					top: 130px;
					left: 60px;
					right: 60px;
					bottom: 60px;
					grid-template-columns: 1fr auto 1fr;
					gap: 40px;
					z-index: 10;
				"
			>
				<!-- Left alliance -->
				<div class="flex flex-col items-stretch" style="gap: {cardGap}px;">
					<div class="flex flex-row items-center" style="gap: 16px;">
						<div class="display text-white" style="font-size: 52px; line-height: 1; letter-spacing: 0.04em;">
							{leftAllianceName}
						</div>
					</div>

					<AllianceSection teams={leftTeams} alliance={leftIsRed ? "red" : "blue"} {ready} {compact} gap={cardGap}>
						<svelte:fragment slot="card" let:team let:index>
							<div
								class="ad-in grid items-center bg-white"
								style="
									grid-template-columns: {leftCols};
									gap: 18px;
									padding: {cardPad};
									color: oklch(0.16 0 0);
									animation-delay: {index * 70}ms;
								"
							>
								<img
									src="data:image/png;base64,{team.avatar || defaultAvatar}"
									alt="Team {team.number}"
									class="object-contain"
									style="width: {avatarSize}px; height: {avatarSize}px; border-radius: 6px;"
								/>
								<div class="text-left min-w-0">
									<div
										class="display team-num"
										style="font-size: {numFont}px; line-height: 0.9; color: oklch(0.14 0 0); display: block; text-align: left;"
									>
										{team.number}
									</div>
									<div
										class="truncate"
										style="font-size: {nameFont}px; font-weight: 700; margin-top: 4px; color: oklch(0.28 0 0);"
									>
										{team.name}
									</div>
								</div>
								<div class="flex flex-col items-center" style="gap: 2px;">
									<div class="uppercase" style="font-size: 11px; letter-spacing: 0.14em; color: oklch(0.45 0 0); font-weight: 800;">Rank</div>
									<div class="display tabular-nums" style="font-size: {rankFont}px; line-height: 0.9; color: oklch(0.14 0 0);">
										{team.rank}
									</div>
									{#if team.card === "Yellow" || team.card === "Red"}
										<div
											class="uppercase"
											style="
												padding: 2px 6px;
												background: {team.card === 'Yellow' ? 'var(--accentWarn)' : 'var(--redAlliance)'};
												color: {team.card === 'Yellow' ? 'oklch(0.18 0.04 60)' : 'white'};
												font-size: 10px; font-weight: 900; letter-spacing: 0.08em;
											"
										>{team.card} Card</div>
									{/if}
								</div>
							</div>
						</svelte:fragment>
					</AllianceSection>
				</div>

				<!-- Center VS -->
				<div class="flex flex-col items-center justify-center" style="gap: 10px; padding: 0 12px;">
					<Logo class="object-contain" style="width: 160px; height: 160px;" />
					<div class="display text-white" style="font-size: 200px; line-height: 0.8; letter-spacing: 0.02em;">
						VS
					</div>
					<div class="bg-rainbow" style="height: 8px; width: 160px;"></div>
					<img src="/pitpodcast.png" alt="Pit Podcast" class="object-contain" style="height: 100px; margin-top: 6px;" />
				</div>

				<!-- Right alliance (mirrored) -->
				<div class="flex flex-col items-stretch" style="gap: {cardGap}px;">
					<div class="flex flex-row-reverse items-center" style="gap: 16px;">
						<div class="display text-white" style="font-size: 52px; line-height: 1; letter-spacing: 0.04em;">
							{rightAllianceName}
						</div>
					</div>

					<AllianceSection teams={rightTeams} alliance={leftIsRed ? "blue" : "red"} {ready} {compact} gap={cardGap}>
						<svelte:fragment slot="card" let:team let:index>
							<div
								class="ad-in grid items-center bg-white"
								style="
									grid-template-columns: {rightCols};
									gap: 18px;
									padding: {cardPad};
									color: oklch(0.16 0 0);
									animation-delay: {index * 70}ms;
								"
							>
								<div class="flex flex-col items-center" style="gap: 2px;">
									<div class="uppercase" style="font-size: 11px; letter-spacing: 0.14em; color: oklch(0.45 0 0); font-weight: 800;">Rank</div>
									<div class="display tabular-nums" style="font-size: {rankFont}px; line-height: 0.9; color: oklch(0.14 0 0);">
										{team.rank}
									</div>
									{#if team.card === "Yellow" || team.card === "Red"}
										<div
											class="uppercase"
											style="
												padding: 2px 6px;
												background: {team.card === 'Yellow' ? 'var(--accentWarn)' : 'var(--redAlliance)'};
												color: {team.card === 'Yellow' ? 'oklch(0.18 0.04 60)' : 'white'};
												font-size: 10px; font-weight: 900; letter-spacing: 0.08em;
											"
										>{team.card} Card</div>
									{/if}
								</div>
								<div class="text-right min-w-0">
									<div
										class="display team-num"
										style="font-size: {numFont}px; line-height: 0.9; color: oklch(0.14 0 0); display: block; text-align: right;"
									>
										{team.number}
									</div>
									<div
										class="truncate"
										style="font-size: {nameFont}px; font-weight: 700; margin-top: 4px; color: oklch(0.28 0 0);"
									>
										{team.name}
									</div>
								</div>
								<img
									src="data:image/png;base64,{team.avatar || defaultAvatar}"
									alt="Team {team.number}"
									class="object-contain"
									style="width: {avatarSize}px; height: {avatarSize}px; border-radius: 6px;"
								/>
							</div>
						</svelte:fragment>
					</AllianceSection>
				</div>
			</div>
		{/if}
	</div>
{/if}
