<script lang="ts">
	import { state, eventDisplayName } from "@lib/state";
	import { matchName } from "@lib/matchNamer";
	import Logo from "@lib/components/Logo.svelte";

	export let transparent: boolean = false;

	$: details = $state.match?.details;
	$: matchCount = $state.eventDetails?.matchCount ?? 0;
	$: eventName = $eventDisplayName;
	$: matchLabel = details
		? matchName(details.matchNumber, matchCount, details.matchType) ?? ""
		: "";
</script>

<header
	class="absolute top-0 left-0 right-0 grid items-center px-6 gap-6 border-b-2 border-accentWarn"
	style="
		height: 70px;
		grid-template-columns: 1fr auto 1fr;
		background: {transparent ? 'transparent' : 'oklch(0 0 0 / 0.55)'};
	"
>
	<div class="flex items-center gap-3 justify-start">
		<Logo class="object-contain" style="width: 48px; height: 48px;" />
		<div
			class="display uppercase text-text"
			style="font-size: 22px; line-height: 1; letter-spacing: 0.02em;"
		>
			{eventName}
		</div>
	</div>

	<div
		class="display text-accentWarn whitespace-nowrap"
		style="font-size: 36px; line-height: 1; padding: 0 24px; letter-spacing: 0.02em;"
	>
		{matchLabel}
	</div>

	<div class="flex items-center justify-end">
		<img
			src="/pitpodcast.png"
			alt="Pit Podcast"
			class="object-contain"
			style="max-height: 50px;"
		/>
	</div>
</header>
