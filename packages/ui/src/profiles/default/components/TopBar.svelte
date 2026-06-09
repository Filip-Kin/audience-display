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
	class="absolute top-0 left-0 right-0 grid items-center px-6 gap-6 border-b-2 border-accentWarn h-[70px] grid-cols-[1fr_auto_1fr] {transparent ? 'bg-transparent' : 'bg-[oklch(0_0_0/0.55)]'}"
>
	<div class="flex items-center gap-3 justify-start">
		<Logo class="object-contain size-12" />
		<div class="display uppercase text-text text-[22px] leading-none tracking-[0.02em]">
			{eventName}
		</div>
	</div>

	<div class="display text-accentWarn whitespace-nowrap text-[36px] leading-none px-6 tracking-[0.02em]">
		{matchLabel}
	</div>

	<div class="flex items-center justify-end">
		<img
			src="/pitpodcast.png"
			alt="Pit Podcast"
			class="object-contain max-h-[50px]"
		/>
	</div>
</header>
