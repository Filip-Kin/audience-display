<script lang="ts">
	import { state } from "../../lib/state";
	import Trophy from "../../assets/trophy.svg";
	import Energized from "../../assets/rp-icons/energized.svg";
	import Supercharged from "../../assets/rp-icons/supercharged.svg";
	import Traversal from "../../assets/rp-icons/traversal.svg";
	import Coopertition from "../../assets/rp-icons/coopertition.svg";
	import Advantage from "../../assets/rp-icons/advantage.svg";
	import { fade, fly } from "svelte/transition";

	export let ready = false;
	export let alliance: "red" | "blue" = "red";
	export let invert = false;

	let badges: { src: string; alt: string }[] = [];

	$: if ($state.results) {
		badges = [];
		const score = $state.results.score[alliance];
		const winner = $state.results.score.winner;

		if (score.energizedAchieved) badges.push({ src: Energized, alt: "Energized" });
		if (score.superchargedAchieved) badges.push({ src: Supercharged, alt: "Supercharged" });
		if (score.traversalAchieved) badges.push({ src: Traversal, alt: "Traversal" });
		if (score.coopertitionAchieved) badges.push({ src: Coopertition, alt: "Coopertition" });
		if (score.advantageAchieved) badges.push({ src: Advantage, alt: "Advantage" });

		if (winner?.toLowerCase() === alliance) {
			badges.push({ src: Trophy, alt: "Win" });
			badges.push({ src: Trophy, alt: "Win" });
		} else if (winner === "Tie") {
			badges.push({ src: Trophy, alt: "Tie" });
		}
	}
</script>

{#if $state.results && ready}
	<div class="flex flex-col gap-3 justify-center" out:fade={{ duration: 100 }}>
		<span class="text-3xl text-center font-bold" in:fade={{ duration: 100 }}>Ranking Points</span>
		<div class="flex justify-center gap-2 h-24">
			{#each badges as badge, i (badge.alt + i)}
				<div
					class="size-20 p-2 flex items-center justify-center text-white {alliance === 'red'
						? 'bg-redAlliance'
						: 'bg-blueAlliance'}"
					title={badge.alt}
					in:fly={{ x: 100 * (invert ? -1 : 1), duration: 500, delay: i * 100 }}
				>
					<img src={badge.src} alt={badge.alt} class="size-full" />
				</div>
			{/each}
		</div>
	</div>
{/if}
