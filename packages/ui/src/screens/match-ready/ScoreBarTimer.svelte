<script lang="ts">
	import { settings } from "../../lib/settings";
	import { state } from "../../lib/state";

	export let wingSpring;

	const secondsToMinutes = (seconds: number) => {
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
	};
</script>

{#if $state.match}
	<div class="z-50 w-48 bg-primary-600 relative overflow-hidden">
		<div class="z-50 absolute text-white text-7xl font-bold bottom-2 left-0 w-48 h-24 my-1 grid place-items-center drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
			{secondsToMinutes($state.match.timer)}
		</div>
	</div>
{/if}
