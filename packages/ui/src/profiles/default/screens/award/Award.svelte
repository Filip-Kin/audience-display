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

	let shown: Award | null = null;
	let revealed = false;
	let visible = false;
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

	// Follow the server while on air. A different award takes the old one down
	// first, then brings the new one up; the same award just reveals in place.
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
		visible = false;
		swapTimer = setTimeout(() => {
			swapTimer = null;
			const latest = $state.award;
			if (!latest || exit) return;
			shown = latest.award;
			revealed = latest.revealed;
			bringIn();
		}, OUT_MS);
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
		{#key shown.id}
			<AwardLowerThird award={shown} {visible} {revealed} {logo} {teamInfo} />
		{/key}
	{/if}
</div>
