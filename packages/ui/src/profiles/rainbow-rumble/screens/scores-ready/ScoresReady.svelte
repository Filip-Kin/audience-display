<script lang="ts">
	import { fly } from "svelte/transition";
	import { state, eventDisplayName } from "@lib/state";
	import { settings } from "@lib/settings";
	import { createEventDispatcher } from "svelte";
	import { matchName } from "@lib/matchNamer";
	import Shutter from "@lib/components/Shutter.svelte";

	let ready = false;
	const dispatcher = createEventDispatcher();
	export let exit = false;

	const LOGO = "/rainbow-rumble/logo.png";
	const SPIN = "rr-spin 3.2s linear infinite";

	$: eventLabel = $eventDisplayName;
	$: matchLabel = $state.match
		? matchName($state.match.details.matchNumber, $state.eventDetails?.matchCount ?? 0, $state.match.details.matchType) ?? ""
		: "";

	// This component is mounted for both "match-end" (awaiting scores, logo spins)
	// and "scores-ready" (scores committed, spin frozen + glint). The router keeps
	// this instance mounted across the match-end -> scores-ready state change, so
	// the switch has to happen reactively off $state.screen.
	$: committed = $state.screen === "scores-ready";

	let logoEl: HTMLImageElement | null = null;
	let glintEl: HTMLDivElement | null = null;
	let frozen = false;

	// Freeze the spin at its current rotation (read the computed matrix, pin it
	// inline) and play the one-shot glint sweep. Also fires when the component
	// mounts straight into scores-ready, freezing at the initial rotation.
	$: if (committed && !frozen && logoEl && glintEl) {
		frozen = true;
		const current = getComputedStyle(logoEl).transform;
		logoEl.style.animation = "none";
		logoEl.style.transform = current === "none" ? "rotate(0deg)" : current;
		glintEl.style.opacity = "1";
		glintEl.style.animation = "none";
		void glintEl.offsetWidth;
		glintEl.style.animation = "rr-glint 1.25s ease-out 1";
	}

	// Scores retracted (scores-ready -> match-end): resume the spin.
	$: if (!committed && frozen && logoEl && glintEl) {
		frozen = false;
		logoEl.style.transform = "";
		logoEl.style.animation = SPIN;
		glintEl.style.animation = "none";
		glintEl.style.opacity = "0";
	}
</script>

<Shutter
	{exit}
	leftColor={$settings.invert ? "var(--primary)" : "var(--secondary)"}
	rightColor={$settings.invert ? "var(--secondary)" : "var(--primary)"}
	on:ready={() => { ready = true; }}
	on:transitioned={() => dispatcher("transitioned")}
/>

<div class="rr fixed flex flex-col w-full h-full justify-around z-10">
	<div class="w-full flex flex-row justify-around pt-16">
		{#if $state.match}
			{#if ready && !exit}
				<div in:fly={{ y: -50, duration: 100 }} out:fly={{ y: -400, duration: 400 }}>
					<div class="bg-black text-center" style="border-radius: var(--rr-r); padding: 18px 56px;">
						<div class="text-white text-[28px] leading-[1.2] tracking-[0.03em]">
							{eventLabel}
						</div>
						<div class="rr-display text-[46px] leading-[1.1] mt-1.5" style="color: var(--rr-accent);">
							{matchLabel}
						</div>
					</div>
				</div>
			{/if}
		{/if}
	</div>

	{#if ready && !exit}
		<div
			class="w-full flex flex-col items-center gap-7"
			in:fly={{ y: 400, duration: 200 }}
			out:fly={{ y: 700, duration: 400 }}
		>
			<div class="relative inline-block size-[400px]">
				<img
					bind:this={logoEl}
					src={LOGO}
					alt="Rainbow Rumble"
					class="block relative z-[1] size-[400px]"
					style="animation: {SPIN};"
				/>
				<!-- One-shot glint sweep, masked by the logo so it only lights the artwork -->
				<div
					bind:this={glintEl}
					class="absolute inset-0 z-[2] pointer-events-none opacity-0"
					style="
						background: linear-gradient(120deg, rgba(255,255,255,0) 42%, rgba(255,255,255,0.95) 50%, rgba(255,255,255,0) 58%);
						background-size: 300% 100%;
						background-position: 100% 0;
						-webkit-mask-image: url('{LOGO}');
						-webkit-mask-repeat: no-repeat;
						-webkit-mask-size: 100% 100%;
						mask-image: url('{LOGO}');
						mask-repeat: no-repeat;
						mask-size: 100% 100%;
					"
				></div>
			</div>
		</div>
	{/if}
</div>
