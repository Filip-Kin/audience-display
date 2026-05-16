<script lang="ts">
	import { fade } from "svelte/transition";

	export let visible: boolean;
</script>

{#if visible}
	<div
		class="fixed top-0 left-0 right-0 z-40 bg-accentWarn text-center uppercase"
		style="
			padding: 12px 56px;
			font-weight: 900;
			font-size: 22px;
			letter-spacing: 0.24em;
			color: oklch(0.18 0.04 60);
		"
		in:fade={{ duration: 200 }}
		out:fade={{ duration: 200 }}
	>
		★ Match Under Review ★
	</div>
{/if}
