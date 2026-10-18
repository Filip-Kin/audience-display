<script lang="ts">
	// Award screen: the lower third over the camera, nothing else on the canvas
	// (the background stays transparent so vMix keys it over the shot).
	import { createEventDispatcher, onDestroy, onMount } from "svelte";
	import type { Award } from "lib";
	import { state, activeProfile } from "@lib/state";
	import { awardTeamInfo } from "@lib/awards";
	import AwardLowerThird from "./AwardLowerThird.svelte";

	export let exit = false;
	const dispatch = createEventDispatcher();

	// How long the lower third takes to animate away (cards, wipe, tile).
	const OUT_MS = 700;
	// How long the bar takes to retract into the tile between two awards.
	const COLLAPSE_MS = 520;

	let shown: Award | null = null;
	let revealed = false;
	let visible = false;
	let collapsed = false;
	let swapTimer: ReturnType<typeof setTimeout> | null = null;

	function bringIn() {
		// Two frames at the off state so the browser has it painted before the
		// transitions to on run.
		requestAnimationFrame(() => requestAnimationFrame(() => (visible = true)));
	}

	onMount(() => {
		if ($state.award) {
			shown = $state.award.award;
			revealed = $state.award.revealed;
			bringIn();
		}
	});

	// Follow the server while on air. A different award retracts the bar into
	// the logo tile (the tile stays up), swaps the award in while it is
	// retracted, then brings the new bar back out of the tile. The same award
	// just reveals in place.
	$: follow($state.award);
	function follow(next: typeof $state.award) {
		if (exit || !next) return;
		if (!shown) {
			shown = next.award;
			revealed = next.revealed;
			bringIn();
			return;
		}
		if (next.award.id === shown.id) {
			shown = next.award;
			revealed = next.revealed;
			return;
		}
		if (swapTimer) return;
		collapsed = true;
		swapTimer = setTimeout(() => {
			swapTimer = null;
			const latest = $state.award;
			if (!latest || exit) return;
			shown = latest.award;
			revealed = latest.revealed;
			// Two frames retracted with the new award in place, then out.
			requestAnimationFrame(() => requestAnimationFrame(() => (collapsed = false)));
		}, COLLAPSE_MS);
	}

	let exiting = false;
	$: if (exit && !exiting) {
		exiting = true;
		visible = false;
		setTimeout(() => dispatch("transitioned"), shown ? OUT_MS : 0);
	}

	onDestroy(() => {
		if (swapTimer) clearTimeout(swapTimer);
	});

	$: logo = $activeProfile.assets.awardLogo ?? $activeProfile.assets.event;
	$: teamInfo = (n: number) => awardTeamInfo($state, n);
</script>

<div class="fixed inset-0 overflow-hidden">
	{#if shown}
		<!-- Not keyed by award: the tile has to stay mounted (and up) while one
		     award's bar retracts and the next one's comes out. -->
		<AwardLowerThird award={shown} {visible} {revealed} {collapsed} {logo} {teamInfo} />
	{/if}
</div>
