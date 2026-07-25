<script lang="ts">
	import { state } from "@lib/state";
	import Energized from "../../../../assets/rp-icons/energized.svg";
	import Supercharged from "../../../../assets/rp-icons/supercharged.svg";
	import Traversal from "../../../../assets/rp-icons/traversal.svg";
	import Trophy from "../../../../assets/trophy.svg";
	import { fade, fly } from "svelte/transition";

	export let ready = false;
	export let alliance: "red" | "blue" = "red";
	export let invert = false;

	type Badge = { src: string; alt: string; rainbow?: boolean };

	let earned: Badge[] = [];
	let unearned: Badge[] = [];

	// Same computation as the shared RankingPoints component, win/tie trophies
	// included: one trophy tile per RP (3 for a win, 1 each on a tie), earned
	// only, never grayed out.
	$: if ($state.results) {
		earned = [];
		unearned = [];
		const score = $state.results.score[alliance];
		const winner = $state.results.score.winner;

		if (winner?.toLowerCase() === alliance) {
			earned.push({ src: Trophy, alt: "Win" }, { src: Trophy, alt: "Win" }, { src: Trophy, alt: "Win" });
		} else if (winner === "Tie") {
			earned.push({ src: Trophy, alt: "Tie" });
		}

		if (score.energizedAchieved) earned.push({ src: Energized, alt: "Energized" });
		else unearned.push({ src: Energized, alt: "Energized" });

		if (score.superchargedAchieved) earned.push({ src: Supercharged, alt: "Supercharged" });
		else unearned.push({ src: Supercharged, alt: "Supercharged" });

		if (score.traversalAchieved) earned.push({ src: Traversal, alt: "Traversal" });
		else unearned.push({ src: Traversal, alt: "Traversal" });

		// Rainbow bonus: the scorekeepers award it as +50 climb points with a
		// -50 adjustment (score-neutral). The adjustment is inferred server-side
		// from the results totals; earned-only, no grayed-out tile.
		if (score.adjustPoints === -50 && score.totalClimbPoints >= 50) {
			earned.push({ src: "/rainbow-rumble/star.svg", alt: "Rainbow Bonus", rainbow: true });
		}
	}
</script>

{#if $state.results && ready}
	<div class="flex flex-col gap-3 justify-center" out:fade={{ duration: 100 }}>
		<span class="text-[26px] text-center font-bold" in:fade={{ duration: 100 }}>Ranking Points</span>
		<div class="flex justify-center gap-2">
			{#each earned as badge, i (badge.alt + i + "e")}
				<div
					class="w-[70px] h-[70px] p-[15px] rounded-[var(--rr-r-sm)] flex items-center justify-center shadow-[0_4px_14px_oklch(0_0_0/0.5)] {badge.rainbow
						? ''
						: alliance === 'red'
							? 'bg-redAlliance'
							: 'bg-blueAlliance'}"
					style={badge.rainbow ? "background: var(--rr-rainbow);" : ""}
					title={badge.alt}
					in:fly={{ x: 100 * (invert ? -1 : 1), duration: 500, delay: i * 100 }}
				>
					<img src={badge.src} alt={badge.alt} class="size-full brightness-0 invert" />
				</div>
			{/each}
			{#each unearned as badge, i (badge.alt + i + "u")}
				<div
					class="w-[70px] h-[70px] p-[15px] rounded-[var(--rr-r-sm)] flex items-center justify-center bg-[oklch(0.22_0.01_250)] opacity-[0.45]"
					title="{badge.alt} (not achieved)"
				>
					<img src={badge.src} alt={badge.alt} class="size-full brightness-0 invert grayscale" />
				</div>
			{/each}
		</div>
	</div>
{/if}
