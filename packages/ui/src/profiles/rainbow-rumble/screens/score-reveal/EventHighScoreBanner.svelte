<script lang="ts">
	import { fade } from "svelte/transition";

	export let visible: boolean;
</script>

{#if visible}
	<div
		class="w-full flex flex-row items-center justify-center gap-[22px] uppercase text-white px-6 py-3 mt-2.5 font-black text-[28px] tracking-[0.16em] rounded-[var(--rr-r-sm)]"
		style="background: var(--rr-rainbow);"
		in:fade={{ duration: 250 }}
		out:fade={{ duration: 150 }}
	>
		<img src="/rainbow-rumble/star.svg" alt="" class="size-[34px]" style="animation: rr-wiggle-cw 2s infinite;" />
		<span>High Score</span>
		<img src="/rainbow-rumble/star.svg" alt="" class="size-[34px]" style="animation: rr-wiggle-ccw 2s infinite;" />
	</div>
{/if}
