<script lang="ts">
	import { state } from "../../../../lib/state";
	import { settings } from "../../../../lib/settings";
	import { createEventDispatcher, onMount } from "svelte";
	import { defaultAvatar } from "../../../../lib/avatar";
	import TopBar from "../../components/TopBar.svelte";

	export let exit = false;
	const dispatcher = createEventDispatcher();

	let ready = false;

	onMount(() => {
		ready = true;
	});

	$: if (exit) {
		ready = false;
		setTimeout(() => dispatcher("transitioned"), 200);
	}

	$: matchType = $state.match?.details.matchType ?? "q";
	$: isPlayoff = matchType !== "q" && matchType !== "t";
	$: leftIsRed = !$settings.invert;
	$: leftTeams = leftIsRed ? $state.match?.teams.red ?? [] : $state.match?.teams.blue ?? [];
	$: rightTeams = leftIsRed ? $state.match?.teams.blue ?? [] : $state.match?.teams.red ?? [];
	$: leftAllianceName = isPlayoff
		? leftIsRed
			? $state.match?.details.redAlliance
			: $state.match?.details.blueAlliance
		: null;
	$: rightAllianceName = isPlayoff
		? leftIsRed
			? $state.match?.details.blueAlliance
			: $state.match?.details.redAlliance
		: null;
</script>

{#if $state.match}
	<div class="fixed inset-0 overflow-hidden bg-background">
		<!-- Diagonal solid color split — uses the darker shutter colors so
		     foreground cards / chips pop against them. -->
		<div class="absolute inset-0 flex">
			<div
				class="flex-1"
				style="
					background: {leftIsRed ? 'var(--primary)' : 'var(--secondary)'};
					clip-path: polygon(0 0, 100% 0, 94% 100%, 0 100%);
				"
			></div>
			<div
				class="flex-1"
				style="
					background: {leftIsRed ? 'var(--secondary)' : 'var(--primary)'};
					clip-path: polygon(6% 0, 100% 0, 100% 100%, 0 100%);
					margin-left: -6%;
				"
			></div>
		</div>

		<TopBar />

		{#if ready}
			<!-- Body grid: left lineup | VS | right lineup -->
			<div
				class="absolute grid items-center"
				style="
					top: 150px;
					left: 60px;
					right: 60px;
					bottom: 60px;
					grid-template-columns: 1fr auto 1fr;
					gap: 40px;
				"
			>
				<!-- Left alliance lineup -->
				<div class="flex flex-col items-stretch" style="gap: 20px;">
					<div class="flex flex-row items-center" style="gap: 18px;">
						<div
							class="display text-white"
							style="font-size: 56px; line-height: 1; letter-spacing: 0.04em;"
						>
							{leftIsRed ? "RED" : "BLUE"}
						</div>
						{#if leftAllianceName}
							<div
								class="text-accentWarn uppercase"
								style="
									padding: 8px 16px;
									background: oklch(0 0 0 / 0.6);
									border-radius: 6px;
									font-weight: 800;
									font-size: 22px;
									letter-spacing: 0.06em;
								"
							>
								{leftAllianceName}
							</div>
						{/if}
					</div>

					{#each leftTeams as team, i (team.number)}
						<div
							class="ad-in grid items-center bg-white"
							style="
								grid-template-columns: 128px 1fr 80px;
								gap: 22px;
								padding: 18px 24px;
								color: oklch(0.16 0 0);
								animation-delay: {i * 70}ms;
							"
						>
							<img
								src="data:image/png;base64,{team.avatar || defaultAvatar}"
								alt="Team {team.number}"
								class="object-contain"
								style="width: 112px; height: 112px; border-radius: 8px; background: oklch(0 0 0 / 0.04);"
							/>
							<div class="text-left min-w-0">
								<div
									class="display team-num"
									style="
										font-size: 116px;
										line-height: 0.88;
										color: oklch(0.14 0 0);
										min-width: auto;
										display: block;
										text-align: left;
									"
								>
									{team.number}
								</div>
								<div
									class="truncate"
									style="
										font-size: 28px;
										font-weight: 700;
										margin-top: 4px;
										color: oklch(0.30 0 0);
										letter-spacing: -0.005em;
									"
								>
									{team.name}
								</div>
							</div>
							<div class="flex flex-col items-center" style="gap: 4px;">
								<div
									class="uppercase"
									style="font-size: 12px; letter-spacing: 0.16em; color: oklch(0.45 0 0); font-weight: 800;"
								>
									Rank
								</div>
								<div
									class="display tabular-nums"
									style="font-size: 68px; line-height: 0.88; color: oklch(0.14 0 0);"
								>
									{team.rank}
								</div>
								{#if team.card === "Yellow" || team.card === "Red"}
									<div
										class="uppercase"
										style="
											margin-top: 2px;
											padding: 3px 8px;
											background: {team.card === 'Yellow' ? 'var(--accentWarn)' : 'var(--redAlliance)'};
											color: {team.card === 'Yellow' ? 'oklch(0.18 0.04 60)' : 'white'};
											font-size: 11px;
											font-weight: 900;
											letter-spacing: 0.08em;
										"
									>
										{team.card} Card
									</div>
								{/if}
							</div>
						</div>
					{/each}
				</div>

				<!-- Center VS block -->
				<div class="flex flex-col items-center justify-center" style="gap: 12px; padding: 0 16px;">
					<div
						class="display text-white"
						style="font-size: 220px; line-height: 0.8; letter-spacing: 0.02em;"
					>
						VS
					</div>
					<div class="bg-rainbow" style="height: 8px; width: 160px;"></div>
				</div>

				<!-- Right alliance lineup (mirrored) -->
				<div class="flex flex-col items-stretch" style="gap: 20px;">
					<div class="flex flex-row-reverse items-center" style="gap: 18px;">
						<div
							class="display text-white"
							style="font-size: 56px; line-height: 1; letter-spacing: 0.04em;"
						>
							{leftIsRed ? "BLUE" : "RED"}
						</div>
						{#if rightAllianceName}
							<div
								class="text-accentWarn uppercase"
								style="
									padding: 8px 16px;
									background: oklch(0 0 0 / 0.6);
									border-radius: 6px;
									font-weight: 800;
									font-size: 22px;
									letter-spacing: 0.06em;
								"
							>
								{rightAllianceName}
							</div>
						{/if}
					</div>

					{#each rightTeams as team, i (team.number)}
						<div
							class="ad-in grid items-center bg-white"
							style="
								grid-template-columns: 80px 1fr 128px;
								gap: 22px;
								padding: 18px 24px;
								color: oklch(0.16 0 0);
								animation-delay: {i * 70}ms;
							"
						>
							<div class="flex flex-col items-center" style="gap: 4px;">
								<div
									class="uppercase"
									style="font-size: 12px; letter-spacing: 0.16em; color: oklch(0.45 0 0); font-weight: 800;"
								>
									Rank
								</div>
								<div
									class="display tabular-nums"
									style="font-size: 68px; line-height: 0.88; color: oklch(0.14 0 0);"
								>
									{team.rank}
								</div>
								{#if team.card === "Yellow" || team.card === "Red"}
									<div
										class="uppercase"
										style="
											margin-top: 2px;
											padding: 3px 8px;
											background: {team.card === 'Yellow' ? 'var(--accentWarn)' : 'var(--redAlliance)'};
											color: {team.card === 'Yellow' ? 'oklch(0.18 0.04 60)' : 'white'};
											font-size: 11px;
											font-weight: 900;
											letter-spacing: 0.08em;
										"
									>
										{team.card} Card
									</div>
								{/if}
							</div>
							<div class="text-right min-w-0">
								<div
									class="display team-num"
									style="
										font-size: 116px;
										line-height: 0.88;
										color: oklch(0.14 0 0);
										min-width: auto;
										display: block;
										text-align: right;
									"
								>
									{team.number}
								</div>
								<div
									class="truncate"
									style="
										font-size: 28px;
										font-weight: 700;
										margin-top: 4px;
										color: oklch(0.30 0 0);
										letter-spacing: -0.005em;
									"
								>
									{team.name}
								</div>
							</div>
							<img
								src="data:image/png;base64,{team.avatar || defaultAvatar}"
								alt="Team {team.number}"
								class="object-contain"
								style="width: 112px; height: 112px; border-radius: 8px; background: oklch(0 0 0 / 0.04);"
							/>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</div>
{/if}
