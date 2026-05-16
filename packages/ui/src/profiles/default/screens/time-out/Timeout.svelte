<script lang="ts">
	import { state, activeProfile } from "../../../../lib/state";
	import { displayEventName, matchName } from "../../../../lib/matchNamer";
	import { createEventDispatcher, onMount, onDestroy } from "svelte";
	import Logo from "../../../../lib/Logo.svelte";

	const dispatcher = createEventDispatcher();
	export let exit = false;
	let ready = false;
	let slideIdx = 0;
	let rotationTimer: ReturnType<typeof setInterval> | null = null;

	$: sponsors = $activeProfile.assets.sponsors;

	// Slide deck: up to 4 sponsor slots interleaved with two BRACKET pages.
	// Match the spec's 6-slot rotation order.
	$: slides = [
		{ kind: "sponsor", src: sponsors[0], label: "Sponsor One" },
		{ kind: "sponsor", src: sponsors[1], label: "Sponsor Two" },
		{ kind: "bracket" },
		{ kind: "sponsor", src: sponsors[2], label: "Sponsor Three" },
		{ kind: "sponsor", src: sponsors[3], label: "Sponsor Four" },
		{ kind: "bracket" },
	] as Array<{ kind: "sponsor"; src?: string; label: string } | { kind: "bracket" }>;

	onMount(() => {
		ready = true;
		rotationTimer = setInterval(() => {
			slideIdx = (slideIdx + 1) % slides.length;
		}, 5000);
	});

	onDestroy(() => {
		if (rotationTimer) clearInterval(rotationTimer);
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

	$: resumesIn = $state.match?.timer ?? 0;
	$: nextMatch = $state.match;
	$: nextMatchLabel = nextMatch
		? matchName(
				nextMatch.details.matchNumber,
				$state.eventDetails?.matchCount ?? 0,
				nextMatch.details.matchType
			) ?? ""
		: "";
	$: nextRedTeams = nextMatch?.teams.red ?? [];
	$: nextBlueTeams = nextMatch?.teams.blue ?? [];
	$: nextRedAlliance = nextMatch?.details.redAlliance;
	$: nextBlueAlliance = nextMatch?.details.blueAlliance;
</script>

{#if ready}
	<div class="fixed inset-0 bg-background overflow-hidden">
		<!-- Header -->
		<header
			class="flex items-center justify-between border-b-4 border-accentWarn"
			style="padding: 28px 56px 18px;"
		>
			<div class="flex items-center" style="gap: 22px;">
				<Logo class="object-contain" style="width: 70px; height: 70px;" />
				<div>
					<div
						class="display uppercase"
						style="font-size: 26px; letter-spacing: 0.18em; color: var(--text-dim);"
					>
						{displayEventName($state.eventDetails?.name)}
					</div>
					<div
						class="display text-white"
						style="font-size: 56px; line-height: 1; letter-spacing: 0.02em;"
					>
						FIELD TIMEOUT
					</div>
				</div>
			</div>

			<!-- Resumes-in timer pill -->
			<div
				class="bg-accentWarn flex items-center"
				style="gap: 20px; padding: 14px 36px;"
			>
				<div
					class="uppercase"
					style="
						font-size: 16px;
						font-weight: 900;
						letter-spacing: 0.2em;
						color: oklch(0.18 0.04 60);
					"
				>
					Resumes In
				</div>
				<div
					class="display tabular-nums"
					style="font-size: 92px; line-height: 0.9; color: oklch(0.14 0.04 60);"
				>
					{mmss(resumesIn)}
				</div>
			</div>
		</header>

		<!-- Body -->
		<div
			class="grid"
			style="
				grid-template-columns: 1.55fr 1fr;
				gap: 24px;
				padding: 24px 56px;
				height: calc(100vh - 138px);
			"
		>
			<!-- Left: slideshow -->
			<div class="flex flex-col" style="gap: 14px;">
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
					Featured
					<div class="flex-1" style="height: 2px; background: var(--rule);"></div>
				</div>

				<div
					class="relative overflow-hidden"
					style="
						flex: 1;
						background: oklch(0 0 0 / 0.6);
						border: 2px solid white;
					"
				>
					{#each slides as slide, i}
						<div
							class="absolute inset-0"
							style="
								opacity: {i === slideIdx ? 1 : 0};
								transition: opacity 500ms ease;
								pointer-events: {i === slideIdx ? 'auto' : 'none'};
							"
						>
							{#if slide.kind === "sponsor"}
								<div
									class="w-full h-full flex items-center justify-center"
									style="padding: 32px;"
								>
									{#if slide.src}
										<img
											src={slide.src}
											alt={slide.label}
											class="object-contain"
											style="width: 92%; height: 92%;"
										/>
									{:else}
										<div
											class="flex items-center justify-center uppercase"
											style="
												width: 92%;
												height: 92%;
												background: oklch(0.94 0.005 250);
												color: oklch(0.30 0 0);
												font-size: 32px;
												font-weight: 800;
												font-family: var(--font-mono);
												letter-spacing: 0.08em;
												border: 1px dashed oklch(0 0 0 / 0.25);
											"
										>
											{slide.label}
										</div>
									{/if}
								</div>
							{:else}
								<!-- Bracket slide — placeholder; full mini-bracket TBD when bracket data is wired up -->
								<div
									class="w-full h-full flex flex-col items-center justify-center text-center uppercase"
									style="padding: 24px; gap: 12px;"
								>
									<div
										class="display text-accentWarn"
										style="font-size: 32px; letter-spacing: 0.16em;"
									>
										Playoff Bracket
									</div>
									<div
										style="
											font-size: 14px;
											letter-spacing: 0.2em;
											color: var(--text-dim);
											font-weight: 900;
										"
									>
										See main bracket between matches
									</div>
								</div>
							{/if}
						</div>
					{/each}
				</div>

				<!-- Slide dots -->
				<div class="flex justify-center" style="gap: 8px;">
					{#each slides as _, i}
						<div
							style="
								height: 8px;
								width: {i === slideIdx ? '32px' : '8px'};
								background: {i === slideIdx
									? 'var(--accentWarn)'
									: 'oklch(1 0 0 / 0.25)'};
								transition: all 300ms ease;
							"
						></div>
					{/each}
				</div>
			</div>

			<!-- Right: Up Next card -->
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
					Up Next
					<div class="flex-1" style="height: 2px; background: var(--rule);"></div>
				</div>

				<div
					class="flex flex-col"
					style="
						flex: 1;
						background: oklch(0 0 0 / 0.55);
						border: 2px solid white;
						padding: 24px;
						gap: 18px;
					"
				>
					<!-- Match label -->
					<div class="text-center">
						<div
							class="display text-accentWarn"
							style="font-size: 80px; line-height: 0.95;"
						>
							{nextMatchLabel}
						</div>
					</div>

					<!-- Alliances stacked with VS divider -->
					<div class="flex flex-col" style="gap: 14px; flex: 1;">
						<div
							class="flex flex-col"
							style="
								background: var(--redAlliance);
								padding: 16px 20px;
								gap: 10px;
							"
						>
							<div class="flex items-baseline justify-between">
								<div
									class="display text-white"
									style="font-size: 32px; letter-spacing: 0.06em;"
								>
									RED
								</div>
								{#if nextRedAlliance}
									<div
										class="text-white"
										style="
											font-weight: 900;
											font-size: 22px;
											background: oklch(0 0 0 / 0.4);
											padding: 4px 14px;
										"
									>
										{nextRedAlliance}
									</div>
								{/if}
							</div>
							<div class="flex justify-between" style="gap: 8px;">
								{#each nextRedTeams.slice(0, 3) as team (team.number)}
									<div
										class="display tabular-nums text-white text-center flex-1"
										style="
											font-size: 56px;
											line-height: 0.95;
											background: oklch(0 0 0 / 0.32);
											padding: 4px 12px;
										"
									>
										{team.number}
									</div>
								{/each}
							</div>
						</div>

						<div
							class="display text-center text-white"
							style="font-size: 44px;"
						>
							VS
						</div>

						<div
							class="flex flex-col"
							style="
								background: var(--blueAlliance);
								padding: 16px 20px;
								gap: 10px;
							"
						>
							<div class="flex items-baseline justify-between">
								<div
									class="display text-white"
									style="font-size: 32px; letter-spacing: 0.06em;"
								>
									BLUE
								</div>
								{#if nextBlueAlliance}
									<div
										class="text-white"
										style="
											font-weight: 900;
											font-size: 22px;
											background: oklch(0 0 0 / 0.4);
											padding: 4px 14px;
										"
									>
										{nextBlueAlliance}
									</div>
								{/if}
							</div>
							<div class="flex justify-between" style="gap: 8px;">
								{#each nextBlueTeams.slice(0, 3) as team (team.number)}
									<div
										class="display tabular-nums text-white text-center flex-1"
										style="
											font-size: 56px;
											line-height: 0.95;
											background: oklch(0 0 0 / 0.32);
											padding: 4px 12px;
										"
									>
										{team.number}
									</div>
								{/each}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
