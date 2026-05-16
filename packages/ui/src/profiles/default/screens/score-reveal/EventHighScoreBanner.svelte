<script lang="ts">
	import { fade } from "svelte/transition";
	import Star from "../../../../assets/star.svg";

	export let visible: boolean;
</script>

{#if visible}
	<div
		class="w-full h-16 flex flex-row bg-accentWarn gap-4 items-center text-white text-4xl font-bold justify-center"
		in:fade={{ duration: 250 }}
		out:fade={{ duration: 150 }}
	>
		<img src={Star} alt="Star" class="size-12 star-cw" />
		<span class="align-middle">High Score!</span>
		<img src={Star} alt="Star" class="size-12 star-ccw" />
	</div>
{/if}
