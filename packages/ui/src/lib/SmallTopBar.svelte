<script lang="ts">
	import type { Spring } from "svelte/motion";
	import { matchName } from "./matchNamer";
	import { settings } from "./settings";
	import { state } from "./state";

	export let positionSpring: Spring<number> | undefined = undefined;
	export let eventNameOnly = false;
</script>

<div
	class="fixed bg-primary-800 text-secondary-600 h-20 flex justify-between mx-[10vw] w-[80vw]"
	style={`${$settings.top ? "bottom" : "top"}: calc(${$positionSpring || 40}px - 15px)`}
>
	<span><img src="/sponsor.png" class="h-20 p-3" alt="sponsor" /></span>
	<div class="flex justify-center items-center">
		<div class="text-4xl font-bold text-center">
			{$state.eventDetails?.name || "Event Name"}
			{#if $state.match && !eventNameOnly}
				- {matchName($state.match.details.matchNumber, $state.eventDetails?.matchCount ?? 0, $state.match.details.matchType)}
			{/if}
		</div>
	</div>
	<span><img src="/pitpodcast.png" class="size-20" alt="sponsor" /></span>
</div>
