<script lang="ts">
	import { fade, fly } from "svelte/transition";
	import { state, eventDisplayName, activeProfile, previousScreen } from "@lib/state";
	import { settings } from "@lib/settings";
	import { createEventDispatcher } from "svelte";
	import { get } from "svelte/store";
	import { matchName } from "@lib/matchNamer";
	import Logo from "@lib/components/Logo.svelte";
	import Whistle from "../../../../assets/whistle.svg";
	import Shutter from "@lib/components/Shutter.svelte";
	import MatchEventHeader from "@lib/components/MatchEventHeader.svelte";

	let ready = false;
	const dispatcher = createEventDispatcher();
	export let exit = false;

	$: eventLabel = $eventDisplayName;
	$: eventLogo = $activeProfile.assets.event;

	// FMS auto-loads the next match the moment scores post, and that must not
	// rename this screen: track the current match only until commit, then hold.
	// A mount that starts committed can't watch the commit happen: coming from a
	// match screen it's still the live flow (transitionAfterMatchEnd -1 skips the
	// match-end phase entirely), so hold the current match's name; from anywhere
	// else it's a repost/re-show, so name the loaded results instead.
	const liveFlow =
		get(state).screen !== "scores-ready" || get(previousScreen).startsWith("match-");
	$: committed = $state.screen === "scores-ready";
	$: liveMatchLabel = $state.match
		? matchName($state.match.details.matchNumber, $state.eventDetails?.matchCount ?? 0, $state.match.details.matchType) ?? ""
		: "";
	$: resultsMatchLabel = $state.results
		? matchName($state.results.details.matchNumber, $state.eventDetails?.matchCount ?? 0, $state.results.details.matchType) ?? ""
		: "";
	let matchLabel = "";
	$: if (!liveFlow) matchLabel = resultsMatchLabel;
	else if (!committed || !matchLabel) matchLabel = liveMatchLabel;
</script>

<Shutter
	{exit}
	leftColor={$settings.invert ? "var(--primary)" : "var(--secondary)"}
	rightColor={$settings.invert ? "var(--secondary)" : "var(--primary)"}
	on:ready={() => { ready = true; }}
	on:transitioned={() => dispatcher("transitioned")}
/>

<div class="fixed flex flex-col w-full h-full justify-around z-10">
	{#if $state.match?.underReviewLatched}
		<div
			class="fixed left-0 right-0 top-0 bg-accentWarn text-black uppercase text-center px-6 py-3.5 font-black text-[28px] tracking-[0.24em] z-30 flex items-center justify-center gap-4"
			in:fade={{ duration: 200 }}
			out:fade={{ duration: 200 }}
		>
			<img src={Whistle} alt="" class="size-8 brightness-0" />
			MATCH UNDER REVIEW
			<img src={Whistle} alt="" class="size-8 brightness-0 scale-x-[-1]" />
		</div>
	{/if}
	<div class="w-full flex flex-row justify-around py-16">
		{#if $state.match}
			{#if ready && !exit}
				<div in:fly={{ y: -50, duration: 100 }} out:fly={{ y: -400, duration: 400 }}>
					<MatchEventHeader {eventLabel} {matchLabel} />
				</div>
			{/if}
		{/if}
	</div>

	{#if ready && !exit}
		<div class="w-full flex justify-center" in:fly={{ y: 400, duration: 200 }} out:fly={{ y: 700, duration: 400 }}>
			<div class:glint-wrapper={$state.screen === "scores-ready" && !!eventLogo} style={eventLogo ? `--glint-mask: url('${eventLogo}');` : ""}>
				<Logo alt="Logo" class="mx-auto size-[480px] block {$state.screen === 'scores-ready' ? 'glint-image' : ''}" />
			</div>
		</div>
	{/if}
</div>
