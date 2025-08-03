<script lang="ts">
	import { state } from "../../lib/state";
	import Trophy from "../../assets/trophy.svg";
	import Robot from "../../assets/robot.svg";
	import { fade, fly } from "svelte/transition";

	export let ready = false;
	export let alliance: "red" | "blue" = "red";
	export let invert = false;

	let rankingPoints: { src: string; alt: string }[] = [];

	$: if ($state.results) {
		rankingPoints = [];

		const blue = $state.results.score[alliance];
		const winner = $state.results.score.winner;

		if (blue.autoBonusRP) rankingPoints.push({ src: Robot, alt: "auto" });
		if (blue.coralBonusRP) rankingPoints.push({ src: "/coral-white.png", alt: "coral" });
		if (blue.bargeBonusRP) rankingPoints.push({ src: "/barge.svg", alt: "barge" });

		if (winner?.toLowerCase() === alliance) {
			rankingPoints.push({ src: Trophy, alt: "trophy" });
			rankingPoints.push({ src: Trophy, alt: "trophy" });
			rankingPoints.push({ src: Trophy, alt: "trophy" });
		} else if (winner === "Tie") {
			rankingPoints.push({ src: Trophy, alt: "trophy" });
		}
	}
</script>

{#if $state.results && ready}
	<div class="flex flex-col gap-3 justify-center" out:fade={{ duration: 100 }}>
		<span class="text-3xl text-center font-bold" in:fade={{ duration: 100 }}>Ranking Points</span>
		<div class="flex justify-center gap-2 h-24">
			{#each rankingPoints as badge, i (badge.alt + i)}
				<img
					src={badge.src}
					alt={badge.alt}
					class="size-20 p-2 bg-{alliance}-600"
					in:fly={{ x: 100 * (invert ? -1 : 1), duration: 500, delay: i * 100 }}
				/>
			{/each}
		</div>
	</div>
{/if}
