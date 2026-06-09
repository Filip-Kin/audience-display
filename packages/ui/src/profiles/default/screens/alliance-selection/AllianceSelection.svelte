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
		<header class="flex items-center justify-between border-b-4 border-accentWarn px-14 pt-7 pb-[18px]">
			<div class="flex items-center gap-[22px]">
				<Logo class="object-contain size-[120px]" />
				<div>
					<div class="display uppercase text-[28px] tracking-[0.16em] text-dim">
						{$eventDisplayName}
					</div>
					<div class="display text-white text-[64px] leading-none tracking-[0.02em]">
						ALLIANCE SELECTION
					</div>
				</div>
			</div>

			<!-- Pick timer pill: stacked layout -->
			<div class="flex flex-col items-center px-7 py-2.5 min-w-[160px] {pickWarning ? 'bg-accentWarn text-[oklch(0.18_0.04_60)]' : 'bg-[oklch(0_0_0/0.6)] text-white border-2 border-white'}">
				<div class="uppercase text-xs font-black tracking-[0.2em]">
					Pick Timer
				</div>
				<div class="display tabular-nums text-[82px] leading-[0.9]">
					{mmss(pickSeconds)}
				</div>
			</div>
		</header>

		<!-- Body: left (available teams + camera) | right (alliances + sponsor) -->
		<div class="grid grid-cols-[1.85fr_1fr] gap-6 px-14 pt-5 pb-14 h-[calc(100vh-142px)]">
			<!-- LEFT: available teams grid + fixed camera area -->
			<div class="grid grid-rows-[auto_1fr_auto] gap-3.5 min-h-0">
				<!-- Section label -->
				<div class="flex items-center uppercase gap-3 text-sm tracking-[0.22em] text-dim font-black">
					<span class="bg-accentWarn size-2"></span>
					Available Teams
					<div class="flex-1 h-0.5 bg-[var(--rule)]"></div>
				</div>

				<!-- Rank grid: 7 cols, clips if too many teams -->
				<div class="grid grid-cols-7 gap-1.5 content-start overflow-hidden">
					{#each availableTeams as team (team.number)}
						{@const taken = team.unavailableForSelection}
						{@const captain = team.potentialCaptain && !taken && !allCaptainsFilled}
						<div
							class="grid items-stretch overflow-hidden grid-cols-[44px_1fr]"
							style="
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
								class="flex items-center justify-center font-black text-[20px]"
								style="
									background: {taken
										? 'oklch(0.26 0.012 250)'
										: captain
											? 'oklch(0.18 0.04 60)'
											: 'oklch(0.16 0 0)'};
									color: {taken || !captain ? 'white' : 'var(--accentWarn)'};
									font-family: var(--font-mono);
								"
							>
								{team.rank}
							</div>
							<div
								class="display tabular-nums text-right px-2 py-[5px] text-[28px] leading-none"
								style="opacity: {taken ? 0.5 : 1};"
							>
								{team.number}
							</div>
						</div>
					{/each}
				</div>

				<!-- Camera area: fixed 220px height, 16:9 width, never shifts -->
				<div class="h-[220px] w-[calc(220px*16/9)] bg-transparent border-2 border-dashed border-[oklch(1_0_0/0.4)]"></div>
			</div>

			<!-- RIGHT: alliances + sponsor -->
			<div class="flex flex-col min-h-0 gap-3.5">
				<div class="flex items-center uppercase gap-3 text-sm tracking-[0.22em] text-dim font-black">
					<span class="bg-accentWarn size-2"></span>
					Alliances
					<div class="flex-1 h-0.5 bg-[var(--rule)]"></div>
				</div>

				<div class="flex flex-col gap-1.5">
					{#each paddedAlliances as alliance (alliance.allianceNumber)}
						{@const isCurrent = alliance.allianceNumber === currentPickAllianceNum}
						<div
							class="grid items-stretch grid-cols-[48px_1fr] text-[oklch(0.14_0_0)]"
							class:ad-pulse={isCurrent}
							style="
								background: {isCurrent ? 'var(--accentWarn)' : 'white'};
								border: {isCurrent ? '3px solid white' : '2px solid transparent'};
							"
						>
							<!-- Alliance number: just the digit -->
							<div
								class="flex items-center justify-center font-black text-[26px]"
								style="
									background: {isCurrent ? 'oklch(0.18 0.04 60)' : 'oklch(0.16 0 0)'};
									color: {isCurrent ? 'var(--accentWarn)' : 'white'};
								"
							>
								{alliance.allianceNumber}
							</div>

							<!-- Team slots: flex-fill, always 4 slots -->
							<div class="flex items-center gap-1.5 px-2.5 py-1.5">
								{#each [0, 1, 2, 3] as i}
									{@const team = alliance.teams[i]}
									{@const empty = !team}
									<div
										class="display tabular-nums flex items-center justify-center flex-1 min-w-0 py-[7px] text-[34px] leading-none"
										style="
											background: {empty ? 'oklch(0 0 0 / 0.08)' : 'oklch(0.16 0 0)'};
											color: {empty ? 'oklch(0.45 0 0)' : 'var(--accentWarn)'};
											border: {empty ? '1px dashed oklch(0 0 0 / 0.25)' : 'none'};
										"
									>
										{empty ? "" : team.number}
									</div>
								{/each}

								{#if isCurrent}
									<div class="uppercase ml-2 text-[11px] font-black tracking-[0.2em] text-[oklch(0.18_0.04_60)] whitespace-nowrap">
										On the Clock
									</div>
								{/if}
							</div>
						</div>
					{/each}
				</div>

				<!-- Sponsor logo: constrained -->
				<div class="flex items-center justify-center flex-1 mt-1 p-4">
					<img
						src="/pitpodcast.png"
						alt="Pit Podcast"
						class="object-contain max-h-[120px] max-w-[80%] w-auto"
					/>
				</div>
			</div>
		</div>
	</div>
{/if}
