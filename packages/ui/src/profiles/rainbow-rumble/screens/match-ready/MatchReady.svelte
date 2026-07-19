<script lang="ts">
	import { state } from "@lib/state";
	import { settings } from "@lib/settings";
	import { createEventDispatcher, onMount } from "svelte";
	import { spring } from "svelte/motion";
	import { fade } from "svelte/transition";
	import RrTopBar from "./RrTopBar.svelte";
	import ScoreBarHalf from "./ScoreBarHalf.svelte";
	import BugCenter from "./BugCenter.svelte";
	import Whistle from "../../../../assets/whistle.svg";

	const dispatcher = createEventDispatcher();
	export let exit = false;
	let ready = false;

	// Offset from the resting position; negative = pushed down below the screen,
	// so the bar slides UP into place from the bottom.
	const barSpring = spring(-320, { stiffness: 0.08, damping: 0.35 });
	const topSpring = spring(-80, { stiffness: 0.08, damping: 0.35 });

	onMount(() => {
		ready = true;
		barSpring.set(0);
		topSpring.set(0);
	});

	$: if (exit) {
		ready = false;
		barSpring.set(-320);
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

	// Real FMS keeps the goals active in the post-match None frame (they only
	// clear at the next prestart), so the display fades the glow itself the
	// moment the match ends.
	$: hub = matchOver ? "None" : ($state.match?.hubActive ?? "None");
	$: leftHubActive = hub === "Both" || (hub !== "None" && (hub === "Red") === leftIsRed);
	$: rightHubActive = hub === "Both" || (hub !== "None" && (hub === "Red") !== leftIsRed);
	$: arrowSide = (() => {
		if (hub === "Both") return "both";
		if (hub === "None") return "none";
		return ((hub === "Red") === leftIsRed) ? "left" : "right";
	})() as "left" | "right" | "both" | "none";

	// #region ending-pulse
	// A side's goal glows while active and pulses in the last 3s of the phase
	// when it's about to close. The alliance holding the auto/FMS "advantage" is
	// active in the even shifts (2 & 4) and inactive in the odd shifts (1 & 3),
	// so it's the side that closes when the transition (Coop) shift ends. The
	// other transitions are read straight off the live hub-active state.
	$: phase = ($state.match?.phase ?? "PreMatch") as string;
	$: phaseTimer = $state.match?.phaseTimer ?? 999;
	$: advantageColor = ($state.match?.score.red.advantageAchieved
		? "red"
		: $state.match?.score.blue.advantageAchieved
			? "blue"
			: null) as "red" | "blue" | null;
	$: inClosingWindow = phaseTimer > 0 && phaseTimer <= 3;

	const goesInactiveNext = (
		p: string,
		color: "red" | "blue",
		active: boolean,
		advantage: "red" | "blue" | null
	): boolean => {
		if (p === "Coop" || p === "TransitionShift") return advantage !== null && color === advantage;
		if (p === "Shift1" || p === "Shift2" || p === "Shift3") return active;
		if (p === "Endgame") return active;
		return false; // Auto -> Coop and Shift4 -> Endgame keep the active side lit
	};

	$: leftEnding = leftHubActive && inClosingWindow && goesInactiveNext(phase, leftColor, leftHubActive, advantageColor);
	$: rightEnding = rightHubActive && inClosingWindow && goesInactiveNext(phase, rightColor, rightHubActive, advantageColor);
	$: matchOver = $state.screen === "match-end";
	// #endregion

	$: top = $settings.top;
</script>

<!-- .rr provides the Rainbow Rumble tokens; the div itself is zero-height so the
     live field video behind the fixed bars stays untouched. -->
<div class="rr">
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

	<!-- Top bar — slides in from the anchored edge. Needs an explicit height:
	     TopBar's header is absolute, so without it this wrapper collapses to 0
	     and the header renders off-screen in `top` (bottom-anchored) mode. -->
	<div
		class="fixed left-0 right-0 h-[70px]"
		style="{top ? `bottom: ${$topSpring}px;` : `top: ${$topSpring}px;`}"
	>
		<RrTopBar atBottom={top} />
	</div>

	{#if ready && leftScore && rightScore}
		<!-- Score bar — slides up from bottom -->
		<div
			class="fixed left-1/2 -translate-x-1/2 w-[min(1440px,calc(100vw-80px))]"
			style="{top ? `top: 60px;` : `bottom: calc(60px + ${$barSpring}px);`}"
			in:fade={{ duration: 150 }}
			out:fade={{ duration: 150 }}
		>
			<!-- No overflow-hidden here: the rainbow underglow must bleed outside
			     the bar. All four outer corners are rounded since the accent strip
			     was removed, so top-mode needs no corner flipping. -->
			<div
				class="grid grid-cols-realtimeScores shadow-[0_12px_40px_oklch(0_0_0/0.55)]"
				style="--rr-bar-rt: var(--rr-r); --rr-bar-rb: var(--rr-r);"
			>
				<ScoreBarHalf
					side="left"
					color={leftColor}
					score={leftScore}
					teams={leftTeams}
					hubActive={leftHubActive}
					endingPulse={leftEnding}
				/>
				<BugCenter
					phase={$state.match.phase}
					timer={$state.match.timer}
					phaseTimer={$state.match.phaseTimer}
					{arrowSide}
					pulseLeft={leftEnding}
					pulseRight={rightEnding}
					{matchOver}
				/>
				<ScoreBarHalf
					side="right"
					color={rightColor}
					score={rightScore}
					teams={rightTeams}
					hubActive={rightHubActive}
					endingPulse={rightEnding}
				/>
			</div>
		</div>
	{/if}
{/if}
</div>
