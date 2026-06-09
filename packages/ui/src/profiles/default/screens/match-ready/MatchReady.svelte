<script lang="ts">
	import { state } from "@lib/state";
	import { settings } from "@lib/settings";
	import { createEventDispatcher, onMount } from "svelte";
	import { spring } from "svelte/motion";
	import { fade } from "svelte/transition";
	import TopBar from "../../components/TopBar.svelte";
	import ScoreBarHalf from "./ScoreBarHalf.svelte";
	import BugCenter from "./BugCenter.svelte";
	import Whistle from "../../../../assets/whistle.svg";

	const dispatcher = createEventDispatcher();
	export let exit = false;
	let ready = false;

	const barSpring = spring(-220, { stiffness: 0.08, damping: 0.35 });
	const topSpring = spring(-80, { stiffness: 0.08, damping: 0.35 });

	onMount(() => {
		ready = true;
		barSpring.set(0);
		topSpring.set(0);
	});

	$: if (exit) {
		ready = false;
		barSpring.set(-220);
		topSpring.set(-80);
		setTimeout(() => dispatcher("transitioned"), 500);
	}

	$: leftIsRed = !$settings.invert;
	$: leftColor = (leftIsRed ? "red" : "blue") as "red" | "blue";
	$: rightColor = (leftIsRed ? "blue" : "red") as "red" | "blue";
	$: leftScore = leftIsRed ? $state.match?.score.red : $state.match?.score.blue;
	$: rightScore = leftIsRed ? $state.match?.score.blue : $state.match?.score.red;
	$: leftTeams = leftIsRed ? $state.match?.teams.red ?? [] : $state.match?.teams.blue ?? [];
	$: rightTeams = leftIsRed ? $state.match?.teams.blue ?? [] : $state.match?.teams.red ?? [];

	$: hub = $state.match?.hubActive ?? "None";
	$: leftHubActive = hub === "Both" || (hub !== "None" && (hub === "Red") === leftIsRed);
	$: rightHubActive = hub === "Both" || (hub !== "None" && (hub === "Red") !== leftIsRed);
	$: arrowSide = (() => {
		if (hub === "Both") return "both";
		if (hub === "None") return "none";
		return ((hub === "Red") === leftIsRed) ? "left" : "right";
	})() as "left" | "right" | "both" | "none";

	$: top = $settings.top;
</script>

{#if $state.match}
	{#if $state.match.underReview}
		<div
			class="fixed left-0 right-0 bg-accentWarn text-black uppercase text-center px-6 py-3.5 font-black text-[28px] tracking-[0.24em] z-30 flex items-center justify-center gap-4 {top ? 'bottom-0' : 'top-0'}"
			in:fade={{ duration: 200 }}
			out:fade={{ duration: 200 }}
		>
			<img src={Whistle} alt="" class="size-8 brightness-0" />
			MATCH UNDER REVIEW
			<img src={Whistle} alt="" class="size-8 brightness-0 scale-x-[-1]" />
		</div>
	{/if}

	<!-- Top bar — slides down from top -->
	<div
		class="fixed left-0 right-0"
		style="{top ? `bottom: ${$topSpring}px;` : `top: ${$topSpring}px;`}"
	>
		<TopBar />
	</div>

	{#if ready && leftScore && rightScore}
		<!-- Score bar — slides up from bottom -->
		<div
			class="fixed left-1/2 -translate-x-1/2 w-[min(1440px,calc(100vw-80px))]"
			style="{top ? `top: 150px;` : `bottom: calc(72px - ${$barSpring}px);`}"
			in:fade={{ duration: 150 }}
			out:fade={{ duration: 150 }}
		>
			<div class="grid overflow-hidden grid-cols-realtimeScores shadow-[0_12px_40px_oklch(0_0_0/0.55)]">
				<ScoreBarHalf
					side="left"
					color={leftColor}
					score={leftScore}
					teams={leftTeams}
					hubActive={leftHubActive}
					timer={$state.match.timer}
					phase={$state.match.phase}
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
					hubActive={rightHubActive}
					timer={$state.match.timer}
					phase={$state.match.phase}
				/>
				<div class="bg-rainbow col-span-full h-2"></div>
			</div>
		</div>
	{/if}
{/if}
