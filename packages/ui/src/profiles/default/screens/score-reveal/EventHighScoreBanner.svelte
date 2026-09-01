<script lang="ts">
	import { fade } from "svelte/transition";
	import Star from "../../components/icons/Star.svelte";

	export let visible: boolean;
</script>

{#if visible}
	<div
		class="w-full flex flex-row items-center justify-center bg-bannerAccent uppercase text-[oklch(0.18_0.04_60)] px-6 py-3.5 gap-[22px] font-black text-[30px] tracking-[0.18em]"
		in:fade={{ duration: 250 }}
		out:fade={{ duration: 150 }}
	>
		<span class="star-cw inline-flex"><Star size={36} /></span>
		<span>High Score</span>
		<span class="star-ccw inline-flex"><Star size={36} /></span>
	</div>
{/if}
