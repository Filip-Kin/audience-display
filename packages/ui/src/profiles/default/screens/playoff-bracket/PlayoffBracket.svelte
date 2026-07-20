<script lang="ts">
	import { state, eventDisplayName } from "@lib/state";
	import BracketGrid from "./BracketGrid.svelte";
	import BracketAlliances from "./BracketAlliances.svelte";
	import { createEventDispatcher, onDestroy, onMount } from "svelte";
	import Logo from "@lib/components/Logo.svelte";

	const dispatcher = createEventDispatcher();
	export let exit = false;
	let ready = false;
	let exiting = false;

	// Like the official display, alternate between the bracket and a full-screen
	// alliances view; the keyed remount below replays each view's entrance.
	let view = 0;
	let fading = false;
	let swapTimer: ReturnType<typeof setInterval> | null = null;

	onMount(() => {
		ready = true;
		swapTimer = setInterval(() => {
			// Fade the current view out, THEN swap so the next entrance starts clean.
			fading = true;
			setTimeout(() => {
				view += 1;
				fading = false;
			}, 400);
		}, 15000);
	});

	onDestroy(() => {
		if (swapTimer) clearInterval(swapTimer);
	});

	$: if (exit && !exiting) {
		exiting = true;
		setTimeout(() => dispatcher("transitioned"), 450);
	}

	$: bracket = $state.bracket;
	$: showAlliances = view % 2 === 1 && !!bracket?.alliances?.length;
</script>

{#if ready}
	<div class="fixed inset-0 bg-background overflow-hidden" class:exiting>
		<!-- Header -->
		<header class="anim-top flex items-center justify-between border-b-4 border-accentWarn px-14 pt-7 pb-[18px]">
			<div class="flex items-center gap-[22px]">
				<Logo class="object-contain size-[150px]" />
				<div>
					<div class="display uppercase text-[28px] tracking-[0.16em] text-dim">
						{$eventDisplayName}
					</div>
					<div class="display text-white text-[64px] leading-none tracking-[0.02em]">
						PLAYOFF BRACKET
					</div>
				</div>
			</div>
		</header>

		<!-- Bracket / full-screen alliances, swapped every 15s -->
		<div class="px-14 pt-6 pb-10 h-[calc(100vh-200px)]">
			{#if bracket}
				{#key view}
					<div class="anim-exit-fade h-full" class:swap-fade={fading}>
						{#if showAlliances}
							<BracketAlliances {bracket} />
						{:else}
							<BracketGrid {bracket} />
						{/if}
					</div>
				{/key}
			{:else}
				<div class="h-full flex items-center justify-center uppercase text-[28px] tracking-[0.2em] text-dim font-black">
					Loading bracket
				</div>
			{/if}
		</div>
	</div>
{/if}
