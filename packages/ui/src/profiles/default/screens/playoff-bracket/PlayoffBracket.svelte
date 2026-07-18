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
	<div class="fixed inset-0 bg-background overflow-hidden">
		<!-- Header -->
		<header class="flex items-center justify-between border-b-4 border-accentWarn px-14 pt-7 pb-[18px]">
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

		<!-- Bracket -->
		<div class="px-14 pt-6 pb-10 h-[calc(100vh-200px)]">
			{#if bracket}
				<BracketGrid {bracket} />
			{:else}
				<div class="h-full flex items-center justify-center uppercase text-[28px] tracking-[0.2em] text-dim font-black">
					Loading bracket
				</div>
			{/if}
		</div>
	</div>
{/if}
