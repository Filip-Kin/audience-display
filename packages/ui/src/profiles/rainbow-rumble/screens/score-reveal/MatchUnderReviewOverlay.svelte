<script lang="ts">
	import { fade } from "svelte/transition";
	import Whistle from "../../../../assets/whistle.svg";

	export let visible: boolean;
</script>

{#if visible}
	<div
		class="fixed top-0 left-0 right-0 z-40 bg-accentWarn text-center uppercase px-14 py-3 font-black text-[22px] tracking-[0.24em] text-[oklch(0.18_0.04_60)] flex items-center justify-center gap-4"
		in:fade={{ duration: 200 }}
		out:fade={{ duration: 200 }}
	>
		<img src={Whistle} alt="" class="size-7 brightness-0" />
		Match Under Review
		<img src={Whistle} alt="" class="size-7 brightness-0 scale-x-[-1]" />
	</div>
{/if}
