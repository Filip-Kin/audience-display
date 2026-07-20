<script lang="ts">
	import { eventDisplayName, activeProfile } from "@lib/state";
	import { createEventDispatcher, onDestroy, onMount } from "svelte";
	import Logo from "@lib/components/Logo.svelte";
	import QRCode from "qrcode";
	import { RR_SPONSORS } from "../../sponsors";

	const dispatcher = createEventDispatcher();
	export let exit = false;
	let ready = false;
	let exiting = false;

	// Sponsor crossfade: absolute-stacked slides, one visible at a time.
	let sponsorIndex = 0;
	let sponsorTimer: ReturnType<typeof setInterval> | null = null;

	// QR encodes the profile's event info URL; profiles without one fall back to
	// the game logo panel so the screen is never an empty white card.
	$: infoUrl = $activeProfile.eventInfoUrl;
	let qrDataUrl = "";
	$: if (infoUrl) {
		QRCode.toDataURL(infoUrl, { width: 900, margin: 1 }).then((url) => (qrDataUrl = url));
	}

	onMount(() => {
		ready = true;
		sponsorTimer = setInterval(() => {
			sponsorIndex = (sponsorIndex + 1) % RR_SPONSORS.length;
		}, 4800);
	});

	onDestroy(() => {
		if (sponsorTimer) clearInterval(sponsorTimer);
	});

	$: if (exit && !exiting) {
		exiting = true;
		setTimeout(() => dispatcher("transitioned"), 450);
	}
</script>

{#if ready}
	<div class="rr fixed inset-0 bg-background overflow-hidden" class:exiting>
		<!-- Header -->
		<header
			class="anim-top flex items-center gap-[22px] border-b-4 border-transparent px-14 pt-7 pb-[18px]"
			style="border-image: var(--rr-rainbow) 1;"
		>
			<Logo class="object-contain size-[150px]" />
			<div>
				<div class="rr-display uppercase text-[26px] tracking-[0.18em] text-[var(--rr-dim)]">
					{$eventDisplayName}
				</div>
				<div class="rr-display text-white text-[56px] leading-none tracking-[0.02em]">
					EVENT SCHEDULE
				</div>
			</div>
		</header>

		<!-- Body: sponsor slideshow | schedule QR -->
		<div class="grid grid-cols-[1.3fr_1fr] gap-6 px-14 py-6 h-[calc(100vh-200px)]">
			<!-- Left: featured sponsor slideshow -->
			<div class="anim-left flex flex-col min-h-0 gap-3.5">
				<div class="flex items-center uppercase gap-3 text-sm tracking-[0.22em] text-[var(--rr-dim)] font-black">
					<span class="size-[9px] rounded-[2px]" style="background: var(--rr-rainbow);"></span>
					Sponsors
					<div class="flex-1 h-0.5 bg-[var(--rr-rule)]"></div>
				</div>

				<div class="relative flex-1 min-h-0 bg-[oklch(0_0_0/0.6)] border-2 border-white rounded-[var(--rr-r)] overflow-hidden">
					{#each RR_SPONSORS as sponsor, i}
						<div
							class="absolute inset-0 flex items-center justify-center p-12 transition-opacity duration-[600ms]"
							style="opacity: {i === sponsorIndex ? 1 : 0};"
						>
							<img
								src={sponsor.src}
								alt="Sponsor"
								class="object-contain {sponsor.light
									? 'max-w-[78%] max-h-[78%] bg-white rounded-2xl p-6'
									: 'max-w-[70%] max-h-[70%]'}"
							/>
						</div>
					{/each}

					<!-- Slide dots (inside the box so they never change the surrounding layout) -->
					<div class="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
						{#each RR_SPONSORS as _, i}
							<div
								class="h-2 rounded transition-all duration-300"
								style="
									width: {i === sponsorIndex ? '32px' : '8px'};
									background: {i === sponsorIndex ? 'var(--rr-rainbow)' : 'oklch(1 0 0 / 0.35)'};
								"
							></div>
						{/each}
					</div>
				</div>
			</div>

			<!-- Right: schedule QR (or game logo when no URL is configured) -->
			<div class="anim-right flex flex-col min-h-0 gap-3.5">
				<div class="flex items-center uppercase gap-3 text-sm tracking-[0.22em] text-[var(--rr-dim)] font-black">
					<span class="size-[9px] rounded-[2px]" style="background: var(--rr-rainbow);"></span>
					Schedule
					<div class="flex-1 h-0.5 bg-[var(--rr-rule)]"></div>
				</div>

				<div class="flex-1 min-h-0 flex items-center justify-center bg-[oklch(0_0_0/0.55)] border-2 border-white rounded-[var(--rr-r)] p-8">
					{#if infoUrl && qrDataUrl}
						<div class="h-full aspect-[4/5] max-w-full flex flex-col items-center justify-center gap-5 bg-white rounded-[var(--rr-r)] p-8">
							<img src={qrDataUrl} alt="Event schedule QR code" class="flex-1 min-h-0 aspect-square object-contain" />
							<div class="rr-display text-[oklch(0.14_0_0)] text-[32px] leading-none text-center">
								Scan for event schedule
							</div>
						</div>
					{:else}
						<img src="/rebuilt-vertical.png" alt="FIRST Age: Rebuilt" class="max-w-full max-h-full object-contain" />
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}
