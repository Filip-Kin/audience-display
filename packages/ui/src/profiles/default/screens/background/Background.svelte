<script lang="ts">
	import { eventDisplayName } from "@lib/state";
	import { createEventDispatcher, onMount } from "svelte";
	import Logo from "@lib/components/Logo.svelte";
	import SponsorSlideshow from "../../components/SponsorSlideshow.svelte";

	const dispatcher = createEventDispatcher();
	export let exit = false;
	let ready = false;
	let exiting = false;

	onMount(() => {
		ready = true;
	});

	$: if (exit && !exiting) {
		exiting = true;
		setTimeout(() => dispatcher("transitioned"), 450);
	}
</script>

{#if ready}
	<div class="fixed inset-0 bg-background overflow-hidden" class:exiting>
		<!-- Header: just the event name, like the official background screen -->
		<header class="anim-top flex items-center gap-[22px] border-b-4 border-accentWarn px-14 pt-7 pb-[18px]">
			<Logo class="object-contain size-[150px]" />
			<div class="display text-white text-[72px] leading-none tracking-[0.02em]">
				{$eventDisplayName} 2026
			</div>
		</header>

		<!-- Body: sponsor slideshow | game logo -->
		<div class="grid grid-cols-[1.3fr_1fr] gap-6 px-14 py-6 h-[calc(100vh-200px)]">
			<!-- Left: sponsor slideshow -->
			<div class="anim-left flex flex-col min-h-0 gap-3.5">
				<div class="flex items-center uppercase gap-3 text-sm tracking-[0.22em] text-dim font-black">
					<span class="bg-accentWarn size-2"></span>
					Sponsors
					<div class="flex-1 h-0.5 bg-[var(--rule)]"></div>
				</div>

				<SponsorSlideshow includeBracket={false} />
			</div>

			<!-- Right: Rebuilt game logo -->
			<div class="anim-right flex flex-col min-h-0 gap-3.5">
				<div class="flex items-center uppercase gap-3 text-sm tracking-[0.22em] text-dim font-black">
					<span class="bg-accentWarn size-2"></span>
					2026 Season
					<div class="flex-1 h-0.5 bg-[var(--rule)]"></div>
				</div>

				<div class="flex-1 min-h-0 flex items-center justify-center bg-[oklch(0_0_0/0.55)] border-2 border-white p-10">
					<img src="/rebuilt-vertical.png" alt="FIRST Age: Rebuilt" class="max-w-full max-h-full object-contain" />
				</div>
			</div>
		</div>
	</div>
{/if}
