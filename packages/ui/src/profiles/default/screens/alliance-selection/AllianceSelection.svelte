<script lang="ts">
	import { state } from "../../../../lib/state";
	import { displayEventName } from "../../../../lib/matchNamer";
	import { createEventDispatcher, onMount } from "svelte";
	import Logo from "../../../../lib/Logo.svelte";

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
	$: eligibleTeams = $state.ranking.filter((t) => !t.unavailableForSelection);

	// Always render exactly 8 alliances — fill in empty placeholders for
	// alliances FMS hasn't seeded yet.
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

	// Heuristic for "on the clock" — first alliance whose team count is below
	// the maximum. Works for serpentine rounds in practice because FMS fills
	// alliances in order within each round.
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
						{displayEventName($state.eventDetails?.name)}
					</div>
					<div
						class="display text-white"
						style="font-size: 64px; line-height: 1; letter-spacing: 0.02em;"
					>
						ALLIANCE SELECTION
					</div>
				</div>
			</div>

			<!-- Pick timer pill -->
			<div
				class="flex items-center"
				style="
					gap: 18px;
					padding: 12px 32px;
					background: {pickWarning ? 'var(--accentWarn)' : 'oklch(0 0 0 / 0.6)'};
					color: {pickWarning ? 'oklch(0.18 0.04 60)' : 'white'};
					border: {pickWarning ? 'none' : '2px solid white'};
				"
			>
				<div
					class="uppercase"
					style="font-size: 16px; font-weight: 900; letter-spacing: 0.2em;"
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

		<!-- Body -->
		<div
			class="grid"
			style="
				grid-template-columns: 1.85fr 1fr;
				gap: 24px;
				padding: 20px 56px 56px;
				height: calc(100vh - 142px);
			"
		>
			<!-- LEFT: rank grid + chroma key -->
			<div class="flex flex-col min-h-0" style="gap: 14px;">
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
					Eligible Teams
					<div class="flex-1" style="height: 2px; background: var(--rule);"></div>
				</div>

				<!-- Rank grid -->
				<div class="grid" style="grid-template-columns: repeat(6, 1fr); gap: 8px;">
					{#each eligibleTeams as team (team.number)}
						{@const taken = team.unavailableForSelection}
						{@const captain = team.potentialCaptain && !taken}
						<div
							class="grid items-stretch overflow-hidden"
							style="
								grid-template-columns: 38px 1fr;
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
									font-size: 16px;
									font-family: var(--font-mono);
								"
							>
								{team.rank}
							</div>
							<div
								class="display tabular-nums text-right"
								style="
									padding: 6px 10px;
									font-size: 32px;
									line-height: 1;
									opacity: {taken ? 0.5 : 1};
								"
							>
								{team.number}
							</div>
						</div>
					{/each}
				</div>

				<!-- Camera area — transparent so OBS can overlay the live camera feed
				     directly. Locked to 16:9 aspect ratio, pinned to the bottom of
				     the column so it lines up with the sponsor block on the right. -->
				<div class="flex flex-col" style="flex: 1; min-height: 0; margin-top: 4px;">
					<div
						style="
							margin-top: auto;
							width: 100%;
							aspect-ratio: 16 / 9;
							background: transparent;
							border: 2px dashed oklch(1 0 0 / 0.4);
						"
					></div>
				</div>
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
								grid-template-columns: 58px 1fr;
								background: {isCurrent ? 'var(--accentWarn)' : 'white'};
								color: oklch(0.14 0 0);
								border: {isCurrent ? '3px solid white' : '2px solid transparent'};
							"
						>
							<div
								class="flex items-center justify-center"
								style="
									background: {isCurrent
										? 'oklch(0.18 0.04 60)'
										: 'oklch(0.16 0 0)'};
									color: {isCurrent ? 'var(--accentWarn)' : 'white'};
									font-weight: 900;
									font-size: 20px;
								"
							>
								A{alliance.allianceNumber}
							</div>
							<div
								class="flex items-center"
								style="gap: 8px; padding: 8px 12px;"
							>
								{#each [0, 1, 2] as i}
									{@const team = alliance.teams[i]}
									{@const empty = !team}
									<div
										class="display tabular-nums flex items-center justify-center"
										style="
											width: 96px;
											flex: 0 0 96px;
											padding: 8px 0;
											background: {empty ? 'oklch(0 0 0 / 0.08)' : 'oklch(0.16 0 0)'};
											color: {empty ? 'oklch(0.45 0 0)' : 'var(--accentWarn)'};
											border: {empty ? '1px dashed oklch(0 0 0 / 0.25)' : 'none'};
											font-size: 26px;
											line-height: 1;
										"
									>
										{empty ? "—" : team.number}
									</div>
								{/each}

								{#if isCurrent}
									<div
										class="uppercase ml-auto"
										style="
											font-size: 11px;
											font-weight: 900;
											letter-spacing: 0.2em;
											color: oklch(0.18 0.04 60);
										"
									>
										On the Clock
									</div>
								{/if}
							</div>
						</div>
					{/each}
				</div>

				<!-- Sponsor at the bottom — Pit Podcast logo. No background panel so
				     the logo's own dark background sits cleanly on the page. -->
				<div
					class="flex items-center justify-center"
					style="
						flex: 1;
						margin-top: 4px;
						padding: 20px;
						min-height: 200px;
					"
				>
					<img
						src="/pitpodcast.png"
						alt="Pit Podcast"
						class="object-contain"
						style="width: 100%; height: 100%;"
					/>
				</div>
			</div>
		</div>
	</div>
{/if}
