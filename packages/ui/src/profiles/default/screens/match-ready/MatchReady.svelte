<script lang="ts">
	import { state } from "../../../../lib/state";
	import { settings } from "../../../../lib/settings";
	import { createEventDispatcher, onMount } from "svelte";
	import { fade } from "svelte/transition";
	import TopBar from "../../components/TopBar.svelte";
	import ScoreBarHalf from "./ScoreBarHalf.svelte";
	import BugCenter from "./BugCenter.svelte";

	const dispatcher = createEventDispatcher();
	export let exit = false;
	let ready = false;

	onMount(() => {
		ready = true;
	});

	$: if (exit) {
		ready = false;
		setTimeout(() => dispatcher("transitioned"), 200);
	}

	$: leftIsRed = !$settings.invert;
	$: leftColor = (leftIsRed ? "red" : "blue") as "red" | "blue";
	$: rightColor = (leftIsRed ? "blue" : "red") as "red" | "blue";
	$: leftScore = leftIsRed ? $state.match?.score.red : $state.match?.score.blue;
	$: rightScore = leftIsRed ? $state.match?.score.blue : $state.match?.score.red;
	$: leftTeams = leftIsRed ? $state.match?.teams.red ?? [] : $state.match?.teams.blue ?? [];
	$: rightTeams = leftIsRed ? $state.match?.teams.blue ?? [] : $state.match?.teams.red ?? [];
	$: arrowSide = ((): "left" | "right" | "none" => {
		const hub = $state.match?.hubActive;
		if (hub === "None" || !hub) return "none";
		const hubIsLeft = (hub === "Red") === leftIsRed;
		return hubIsLeft ? "left" : "right";
	})();
	$: top = $settings.top;
</script>

{#if $state.match}
	{#if $state.match.underReview}
		<div
			class="fixed left-0 right-0 bg-accentWarn text-black uppercase text-center"
			style="
				{top ? 'bottom: 0;' : 'top: 0;'}
				padding: 14px 24px;
				font-weight: 900;
				font-size: 28px;
				letter-spacing: 0.24em;
				z-index: 30;
			"
			in:fade={{ duration: 200 }}
			out:fade={{ duration: 200 }}
		>
			★ MATCH UNDER REVIEW ★
		</div>
	{/if}

	<!-- Top bar (flips to bottom when settings.top is true) -->
	<div
		class="fixed left-0 right-0"
		style="{top ? 'bottom: 0;' : 'top: 0;'}"
	>
		<TopBar />
	</div>

	{#if ready && leftScore && rightScore}
		<!-- Floating score bug -->
		<div
			class="fixed"
			style="
				left: 50%;
				transform: translateX(-50%);
				{top ? 'top: 150px;' : 'bottom: 56px;'}
				width: 1480px;
			"
			in:fade={{ duration: 300 }}
			out:fade={{ duration: 200 }}
		>
			<div
				class="grid overflow-hidden"
				style="grid-template-columns: 1fr auto 1fr; box-shadow: 0 12px 40px oklch(0 0 0 / 0.55);"
			>
				<ScoreBarHalf
					side="left"
					color={leftColor}
					score={leftScore}
					teams={leftTeams}
				/>
				<BugCenter
					phase={$state.match.phase}
					timer={$state.match.timer}
					{arrowSide}
				/>
				<ScoreBarHalf
					side="right"
					color={rightColor}
					score={rightScore}
					teams={rightTeams}
				/>
				<div class="bg-rainbow" style="grid-column: 1 / -1; height: 8px;"></div>
			</div>
		</div>
	{/if}
{/if}
