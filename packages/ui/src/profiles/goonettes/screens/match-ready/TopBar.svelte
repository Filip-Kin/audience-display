<script lang="ts">
	import { state } from "@lib/state";
	import { matchName } from "@lib/matchNamer";
	import Logo from "@lib/components/Logo.svelte";

	/** When acting as the bottom bar (top-mode), put the rim on top. */
	export let atBottom: boolean = false;

	$: details = $state.match?.details;
	$: matchCount = $state.eventDetails?.matchCount ?? 0;
	$: matchLabel = details
		? matchName(details.matchNumber, matchCount, details.matchType) ?? ""
		: "";
</script>

<!-- The event lockup ("Goonettes" + brush "invitational", as on the event's
     site and banner) replaces the plain event-name text. -->
<header
	class="absolute top-0 left-0 right-0 grid items-center px-6 gap-6 h-[70px] grid-cols-[1fr_auto_1fr] {atBottom ? 'border-t-[3px]' : 'border-b-[3px]'} border-solid border-[var(--accent)]"
	style="background: linear-gradient(90deg, oklch(0.30 0.132 318 / 0.92), oklch(0.12 0.03 305 / 0.80) 45%, oklch(0.12 0.03 305 / 0.80) 55%, oklch(0.30 0.132 318 / 0.92));"
>
	<div class="flex items-center gap-3 justify-start">
		<img src="/goonettes/logo.png" alt="" class="object-contain size-14 -my-1" />
		<div class="flex items-baseline gap-2 leading-none whitespace-nowrap">
			<span class="goon-display uppercase text-[32px] text-accent tracking-[0.03em]">Goonettes</span>
			<span class="goon-brush text-[34px] text-white">invitational</span>
		</div>
	</div>

	<div class="goon-display text-matchLabel whitespace-nowrap text-[38px] leading-none px-6 tracking-[0.02em]">
		{matchLabel}
	</div>

	<div class="flex items-center justify-end">
		<Logo type="livestream" alt="" class="object-contain max-h-[50px]" />
	</div>
</header>
