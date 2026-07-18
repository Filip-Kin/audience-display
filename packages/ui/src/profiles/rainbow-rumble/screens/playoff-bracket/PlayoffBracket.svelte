<script lang="ts">
	import { state, eventDisplayName } from "@lib/state";
	import BracketGrid from "./BracketGrid.svelte";
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

	$: bracket = $state.bracket;
</script>

{#if ready}
	<div class="rr fixed inset-0 bg-background overflow-hidden">
		<!-- Header: rainbow underline, logo + stacked titles -->
		<header
			class="flex items-center gap-[22px] border-b-4 px-14 pt-7 pb-[18px]"
			style="border-image: var(--rr-rainbow) 1;"
		>
			<Logo class="object-contain size-[120px]" />
			<div>
				<div class="rr-display uppercase text-[28px] tracking-[0.16em]" style="color: var(--rr-dim);">
					{$eventDisplayName}
				</div>
				<div class="rr-display text-white text-[64px] leading-none tracking-[0.02em]">
					PLAYOFF BRACKET
				</div>
			</div>
		</header>

		<!-- Bracket -->
		<div class="px-14 pt-6 pb-10 h-[calc(100vh-190px)]">
			{#if bracket}
				<BracketGrid {bracket} />
			{:else}
				<div
					class="h-full flex items-center justify-center uppercase text-[28px] tracking-[0.2em] font-black"
					style="color: var(--rr-dim);"
				>
					Loading bracket
				</div>
			{/if}
		</div>
	</div>
{/if}
