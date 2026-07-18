<script lang="ts">
	import { state, eventDisplayName } from "@lib/state";
	import { matchName } from "@lib/matchNamer";

	/** When acting as the bottom bar (top-mode), put the rainbow border on top. */
	export let atBottom: boolean = false;

	$: details = $state.match?.details;
	$: matchCount = $state.eventDetails?.matchCount ?? 0;
	$: eventName = $eventDisplayName;
	$: matchLabel = details
		? matchName(details.matchNumber, matchCount, details.matchType) ?? ""
		: "";
</script>

<header
	class="absolute top-0 left-0 right-0 grid items-center px-6 gap-6 h-[70px] grid-cols-[1fr_auto_1fr] bg-[oklch(0_0_0/0.55)]"
	style="{atBottom ? 'border-top' : 'border-bottom'}: 3px solid transparent; border-image: var(--rr-rainbow) 1;"
>
	<div class="flex items-center gap-3.5 justify-start">
		<img src="/rainbow-rumble/logo.png" alt="" class="object-contain size-12" />
		<div class="rr-display uppercase text-text text-[22px] leading-none tracking-[0.02em]">
			{eventName}
		</div>
	</div>

	<div class="rr-display whitespace-nowrap text-[36px] leading-none px-6 tracking-[0.02em]" style="color: var(--rr-accent);">
		{matchLabel}
	</div>

	<div class="flex items-center justify-end">
		<img src="/rainbow-rumble/fun.webp" alt="FUN Network" class="object-contain max-h-[46px]" />
	</div>
</header>
