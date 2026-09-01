<script lang="ts">
	import { state } from "../state";
	import Trophy from "../../assets/trophy.svg";
	import Energized from "../../assets/rp-icons/energized.svg";
	import Supercharged from "../../assets/rp-icons/supercharged.svg";
	import Traversal from "../../assets/rp-icons/traversal.svg";
	import { fade, fly } from "svelte/transition";

	export let ready = false;
	export let alliance: "red" | "blue" = "red";
	export let invert = false;

	type Badge = { src: string; alt: string };

	let earned: Badge[] = [];
	let unearned: Badge[] = [];

	$: if ($state.results) {
		earned = [];
		unearned = [];
		const score = $state.results.score[alliance];
		const winner = $state.results.score.winner;

		// Special RPs: always show — earned bright, unearned grayed out
		if (score.energizedAchieved) earned.push({ src: Energized, alt: "Energized" });
		else unearned.push({ src: Energized, alt: "Energized" });

		if (score.superchargedAchieved) earned.push({ src: Supercharged, alt: "Supercharged" });
		else unearned.push({ src: Supercharged, alt: "Supercharged" });

		if (score.traversalAchieved) earned.push({ src: Traversal, alt: "Traversal" });
		else unearned.push({ src: Traversal, alt: "Traversal" });

		// Win/Tie trophies: only show when earned (never gray out)
		if (winner?.toLowerCase() === alliance) {
			earned.push({ src: Trophy, alt: "Win" });
			earned.push({ src: Trophy, alt: "Win" });
			earned.push({ src: Trophy, alt: "Win" });
		} else if (winner === "Tie") {
			earned.push({ src: Trophy, alt: "Tie" });
		}
	}
</script>

{#if $state.results && ready}
	<div class="flex flex-col gap-3 justify-center" out:fade={{ duration: 100 }}>
		<span class="text-3xl text-center font-bold" in:fade={{ duration: 100 }}>Ranking Points</span>
		<div class="flex justify-center gap-2 h-24 flex-wrap">
			{#each earned as badge, i (badge.alt + i + "e")}
				<div
					class="size-20 p-2 flex items-center justify-center text-white border border-[oklch(1_0_0/0.35)] shadow-[0_4px_14px_oklch(0_0_0/0.5)] {alliance === 'red'
						? 'bg-redAlliance'
						: 'bg-blueAlliance'}"
					title={badge.alt}
					in:fly={{ x: 100 * (invert ? -1 : 1), duration: 500, delay: i * 100 }}
				>
					<img src={badge.src} alt={badge.alt} class="size-full brightness-0 invert" />
				</div>
			{/each}
			{#each unearned as badge, i (badge.alt + i + "u")}
				<div
					class="size-20 p-2 flex items-center justify-center bg-[oklch(0.22_0.01_250)] opacity-[0.45] shadow-none"
					title="{badge.alt} (not achieved)"
				>
					<img src={badge.src} alt={badge.alt} class="size-full brightness-0 invert grayscale" />
				</div>
			{/each}
		</div>
	</div>
{/if}
