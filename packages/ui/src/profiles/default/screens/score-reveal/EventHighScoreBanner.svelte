<script lang="ts">
	import { fade } from "svelte/transition";
	import Star from "../../components/icons/Star.svelte";

	export let visible: boolean;
</script>

{#if visible}
	<div
		class="w-full flex flex-row items-center justify-center bg-bannerAccent uppercase text-white"
		style="
			padding: 14px 24px;
			gap: 22px;
			font-weight: 900;
			font-size: 30px;
			letter-spacing: 0.18em;
		"
		in:fade={{ duration: 250 }}
		out:fade={{ duration: 150 }}
	>
		<span class="star-cw inline-flex"><Star size={28} /></span>
		<span>High Score</span>
		<span class="star-ccw inline-flex"><Star size={28} /></span>
	</div>
{/if}
