<script lang="ts">
	import { fade } from "svelte/transition";

	export let visible: boolean;
</script>

{#if visible}
	<div
		class="fixed top-0 left-0 w-full z-40 bg-accentWarn text-black text-3xl font-bold py-3 px-6 flex items-center justify-center gap-4 shadow-lg"
		in:fade={{ duration: 200 }}
		out:fade={{ duration: 200 }}
	>
		<span class="text-4xl">⚠</span>
		<span class="uppercase tracking-widest">Match Under Review</span>
		<span class="text-4xl">⚠</span>
	</div>
{/if}
