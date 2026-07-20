<script lang="ts">
	import { fly, fade } from "svelte/transition";
	import { state, eventDisplayName } from "@lib/state";
	import Whistle from "../../../../assets/whistle.svg";
	import { settings } from "@lib/settings";
	import { createEventDispatcher, onDestroy } from "svelte";
	import { matchName } from "@lib/matchNamer";
	import Shutter from "@lib/components/Shutter.svelte";

	let ready = false;
	const dispatcher = createEventDispatcher();
	export let exit = false;

	const LOGO = "/rainbow-rumble/logo.png";
	const LOGO_GRAD = "/rainbow-rumble/logo-gradient.png";
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

	let logoMaskEl: HTMLDivElement | null = null;
	let logoEl: HTMLImageElement | null = null;
	let glintEl: HTMLDivElement | null = null;
	let frozen = false;
	let settleTimer: ReturnType<typeof setTimeout> | null = null;

	// The spin's angular speed; the settle keeps this speed so the stop reads as
	// the same motion coming to rest, not a jump.
	const SPIN_DEG_PER_S = 360 / 3.2;

	// On commit: keep turning forward to the next 45-degree stop (the gear is
	// 8-fold symmetric, so the cogs land exactly on the unrotated glint mask),
	// then glint continuously until the screen is dismissed. Also fires when the
	// component mounts straight into scores-ready.
	$: if (committed && !frozen && logoMaskEl && logoEl && glintEl) {
		frozen = true;
		const logoMask = logoMaskEl;
		const logo = logoEl;
		const glint = glintEl;
		const m = getComputedStyle(logoMask).transform;
		let angle = 0;
		if (m && m !== "none") {
			const parts = m.match(/matrix\(([^)]+)\)/)?.[1]?.split(",").map(Number);
			if (parts && parts.length >= 2) angle = (Math.atan2(parts[1]!, parts[0]!) * 180) / Math.PI;
		}
		angle = ((angle % 360) + 360) % 360;
		const target = Math.ceil((angle + 0.001) / 45) * 45;
		const settleMs = Math.max(50, ((target - angle) / SPIN_DEG_PER_S) * 1000);
		logoMask.style.animation = "none";
		logoMask.style.transform = `rotate(${angle}deg)`;
		logo.style.animation = "none";
		logo.style.transform = `rotate(${-angle}deg)`;
		void logoMask.offsetWidth;
		void logo.offsetWidth;
		logoMask.style.transition = `transform ${settleMs}ms linear`;
		logoMask.style.transform = `rotate(${target}deg)`;
		logo.style.transition = `transform ${settleMs}ms linear`;
		logo.style.transform = `rotate(${-target}deg)`;
		settleTimer = setTimeout(() => {
			settleTimer = null;
			glint.style.opacity = "1";
			glint.style.animation = "none";
			void glint.offsetWidth;
			glint.style.animation = "rr-glint 1.25s ease-out infinite";
		}, settleMs);
	}

	onDestroy(() => {
		if (settleTimer) clearTimeout(settleTimer);
	});

	// Scores retracted (scores-ready -> match-end): resume the spin. ONLY on a
	// real retraction: leaving for the score reveal also flips `committed`
	// false, and the gear must stay static as it slides off, not start
	// spinning again.
	$: if ($state.screen === "match-end" && frozen && logoMaskEl && logoEl && glintEl) {
		frozen = false;
		if (settleTimer) {
			clearTimeout(settleTimer);
			settleTimer = null;
		}
		logoMaskEl.style.transition = "";
		logoMaskEl.style.transform = "";
		logoMaskEl.style.animation = SPIN;
		logoEl.style.transition = "";
		logoEl.style.transform = "";
		logoEl.style.animation = SPIN;
		logoEl.style.animationDirection = "reverse";
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
	{#if $state.match?.underReview}
		<div
			class="fixed left-0 right-0 top-0 bg-accentWarn text-black uppercase text-center px-6 py-3.5 font-black text-[28px] tracking-[0.24em] z-30 flex items-center justify-center gap-4"
			in:fade={{ duration: 200 }}
			out:fade={{ duration: 200 }}
		>
			<img src={Whistle} alt="" class="size-8 brightness-0" />
			MATCH UNDER REVIEW
			<img src={Whistle} alt="" class="size-8 brightness-0 scale-x-[-1]" />
		</div>
	{/if}
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
				<div
					bind:this={logoMaskEl}
					style="
						-webkit-mask-image: url('{LOGO}');
						-webkit-mask-position: center;
						-webkit-mask-repeat: no-repeat;
						mask-image: url('{LOGO}');
						mask-repeat: no-repeat;
						mask-size: 90%;
						mask-position: center;

						animation: {SPIN};
					"
				>
					<img
						bind:this={logoEl}
						src={LOGO_GRAD}
						alt="Rainbow Rumble"
						class="block relative z-[1] size-[400px]"
						style="
							animation: {SPIN};
							animation-direction: reverse;
						"
					>
				</div>
				<!-- Glint sweep (loops while scores are ready), masked by the logo so it only lights the artwork -->
				<div
					bind:this={glintEl}
					class="absolute inset-0 z-[2] pointer-events-none opacity-0"
					style="
						background: linear-gradient(120deg, rgba(255,255,255,0) 42%, rgba(255,255,255,0.95) 50%, rgba(255,255,255,0) 58%);
						background-size: 300% 100%;
						background-position: 100% 0;
						background-repeat: no-repeat;
						-webkit-mask-image: url('{LOGO}');
						-webkit-mask-repeat: no-repeat;
						-webkit-mask-size: 90% 90%;
						mask-image: url('{LOGO}');
						mask-repeat: no-repeat;
						mask-size: 90% 90%;
						mask-position: center
					"
				></div>
			</div>
		</div>
	{/if}
</div>
