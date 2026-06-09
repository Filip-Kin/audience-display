<script lang="ts">
	import { state, eventDisplayName } from "@lib/state";
	import { createEventDispatcher, onMount } from "svelte";
	import Logo from "@lib/components/Logo.svelte";

	const dispatcher = createEventDispatcher();
	export let exit = false;
	let ready = false;

	onMount(() => {
		ready = true;
	});

	$: if (exit) {
		ready = false;
		setTimeout(() => dispatcher("transitioned"), 200);
	}

	function mmss(seconds: number): string {
		const m = Math.floor(Math.max(0, seconds) / 60);
		const s = Math.floor(Math.max(0, seconds) % 60);
		return `${m}:${s.toString().padStart(2, "0")}`;
	}

	$: pickSeconds = $state.match?.timer ?? 0;
	$: pickWarning = pickSeconds > 0 && pickSeconds <= 10;
	$: availableTeams = $state.ranking.filter((t) => !t.unavailableForSelection);

	// Once all 8 alliances have at least one team (captain slot filled), stop
	// highlighting potential captains.
	$: allCaptainsFilled =
		$state.alliances.length >= 8 &&
		$state.alliances.every((a) => a.teams.length > 0);

	$: paddedAlliances = Array.from({ length: 8 }, (_, i) => {
		const num = i + 1;
		const existing = $state.alliances.find((a) => a.allianceNumber === num);
		return (
			existing ?? {
				allianceNumber: num,
				allianceName: "",
				teams: [],
				card: "None" as const,
			}
		);
	});

	$: currentPickAllianceNum = (() => {
		const seeded = $state.alliances;
		if (!seeded.length) return null;
		const lengths = seeded.map((a) => a.teams.length);
		const max = Math.max(...lengths);
		const next = seeded.find((a) => a.teams.length < max);
		return next?.allianceNumber ?? null;
	})();
</script>

{#if ready}
	<div class="fixed inset-0 bg-background overflow-hidden">
		<!-- Header -->
		<header
			class="flex items-center justify-between border-b-4 border-accentWarn"
			style="padding: 28px 56px 18px;"
		>
			<div class="flex items-center" style="gap: 22px;">
				<Logo class="object-contain" style="width: 120px; height: 120px;" />
				<div>
					<div
						class="display uppercase"
						style="font-size: 28px; letter-spacing: 0.16em; color: var(--text-dim);"
					>
						{$eventDisplayName}
					</div>
					<div
						class="display text-white"
						style="font-size: 64px; line-height: 1; letter-spacing: 0.02em;"
					>
						ALLIANCE SELECTION
					</div>
				</div>
			</div>

			<!-- Pick timer pill: stacked layout -->
			<div
				class="flex flex-col items-center"
				style="
					padding: 10px 28px;
					background: {pickWarning ? 'var(--accentWarn)' : 'oklch(0 0 0 / 0.6)'};
					color: {pickWarning ? 'oklch(0.18 0.04 60)' : 'white'};
					border: {pickWarning ? 'none' : '2px solid white'};
					min-width: 160px;
				"
			>
				<div
					class="uppercase"
					style="font-size: 12px; font-weight: 900; letter-spacing: 0.2em;"
				>
					Pick Timer
				</div>
				<div
					class="display tabular-nums"
					style="font-size: 82px; line-height: 0.9;"
				>
					{mmss(pickSeconds)}
				</div>
			</div>
		</header>

		<!-- Body: left (available teams + camera) | right (alliances + sponsor) -->
		<div
			class="grid"
			style="
				grid-template-columns: 1.85fr 1fr;
				gap: 24px;
				padding: 20px 56px 56px;
				height: calc(100vh - 142px);
			"
		>
			<!-- LEFT: available teams grid + fixed camera area -->
			<div
				style="
					display: grid;
					grid-template-rows: auto 1fr auto;
					gap: 14px;
					min-height: 0;
				"
			>
				<!-- Section label -->
				<div
					class="flex items-center uppercase"
					style="
						gap: 12px;
						font-size: 14px;
						letter-spacing: 0.22em;
						color: var(--text-dim);
						font-weight: 900;
					"
				>
					<span class="bg-accentWarn" style="width: 8px; height: 8px;"></span>
					Available Teams
					<div class="flex-1" style="height: 2px; background: var(--rule);"></div>
				</div>

				<!-- Rank grid: 7 cols, clips if too many teams -->
				<div
					class="grid"
					style="grid-template-columns: repeat(7, 1fr); gap: 6px; align-content: start; overflow: hidden;"
				>
					{#each availableTeams as team (team.number)}
						{@const taken = team.unavailableForSelection}
						{@const captain = team.potentialCaptain && !taken && !allCaptainsFilled}
						<div
							class="grid items-stretch overflow-hidden"
							style="
								grid-template-columns: 44px 1fr;
								background: {taken
									? 'oklch(0.18 0.012 250)'
									: captain
										? 'var(--accentWarn)'
										: 'white'};
								color: {taken ? 'var(--text-faint)' : 'oklch(0.14 0 0)'};
								text-decoration: {taken ? 'line-through' : 'none'};
							"
						>
							<div
								class="flex items-center justify-center"
								style="
									background: {taken
										? 'oklch(0.26 0.012 250)'
										: captain
											? 'oklch(0.18 0.04 60)'
											: 'oklch(0.16 0 0)'};
									color: {taken || !captain ? 'white' : 'var(--accentWarn)'};
									font-weight: 900;
									font-size: 20px;
									font-family: var(--font-mono);
								"
							>
								{team.rank}
							</div>
							<div
								class="display tabular-nums text-right"
								style="
									padding: 5px 8px;
									font-size: 28px;
									line-height: 1;
									opacity: {taken ? 0.5 : 1};
								"
							>
								{team.number}
							</div>
						</div>
					{/each}
				</div>

				<!-- Camera area: fixed 200px, never shifts -->
				<div
					style="
						height: 220px;
						width: calc(220px * 16 / 9);
						background: transparent;
						border: 2px dashed oklch(1 0 0 / 0.4);
					"
				></div>
			</div>

			<!-- RIGHT: alliances + sponsor -->
			<div class="flex flex-col min-h-0" style="gap: 14px;">
				<div
					class="flex items-center uppercase"
					style="
						gap: 12px;
						font-size: 14px;
						letter-spacing: 0.22em;
						color: var(--text-dim);
						font-weight: 900;
					"
				>
					<span class="bg-accentWarn" style="width: 8px; height: 8px;"></span>
					Alliances
					<div class="flex-1" style="height: 2px; background: var(--rule);"></div>
				</div>

				<div class="flex flex-col" style="gap: 6px;">
					{#each paddedAlliances as alliance (alliance.allianceNumber)}
						{@const isCurrent = alliance.allianceNumber === currentPickAllianceNum}
						<div
							class="grid items-stretch"
							class:ad-pulse={isCurrent}
							style="
								grid-template-columns: 48px 1fr;
								background: {isCurrent ? 'var(--accentWarn)' : 'white'};
								color: oklch(0.14 0 0);
								border: {isCurrent ? '3px solid white' : '2px solid transparent'};
							"
						>
							<!-- Alliance number: just the digit -->
							<div
								class="flex items-center justify-center"
								style="
									background: {isCurrent
										? 'oklch(0.18 0.04 60)'
										: 'oklch(0.16 0 0)'};
									color: {isCurrent ? 'var(--accentWarn)' : 'white'};
									font-weight: 900;
									font-size: 26px;
								"
							>
								{alliance.allianceNumber}
							</div>

							<!-- Team slots: flex-fill, always 4 slots -->
							<div
								class="flex items-center"
								style="gap: 6px; padding: 6px 10px;"
							>
								{#each [0, 1, 2, 3] as i}
									{@const team = alliance.teams[i]}
									{@const empty = !team}
									<div
										class="display tabular-nums flex items-center justify-center"
										style="
											flex: 1;
											min-width: 0;
											padding: 7px 0;
											background: {empty ? 'oklch(0 0 0 / 0.08)' : 'oklch(0.16 0 0)'};
											color: {empty ? 'oklch(0.45 0 0)' : 'var(--accentWarn)'};
											border: {empty ? '1px dashed oklch(0 0 0 / 0.25)' : 'none'};
											font-size: 34px;
											line-height: 1;
										"
									>
										{empty ? "" : team.number}
									</div>
								{/each}

								{#if isCurrent}
									<div
										class="uppercase ml-2"
										style="
											font-size: 11px;
											font-weight: 900;
											letter-spacing: 0.2em;
											color: oklch(0.18 0.04 60);
											white-space: nowrap;
										"
									>
										On the Clock
									</div>
								{/if}
							</div>
						</div>
					{/each}
				</div>

				<!-- Sponsor logo: constrained -->
				<div
					class="flex items-center justify-center"
					style="flex: 1; margin-top: 4px; padding: 16px;"
				>
					<img
						src="/pitpodcast.png"
						alt="Pit Podcast"
						class="object-contain"
						style="max-height: 120px; max-width: 80%; width: auto;"
					/>
				</div>
			</div>
		</div>
	</div>
{/if}
