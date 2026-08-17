<script lang="ts">
	import type { Team } from "lib";
	import Avatar from "@lib/components/Avatar.svelte";
	import { fitTwoLines } from "@lib/fitText";

	export let team: Team;
	export let alliance: "red" | "blue";
	/** true = right-side layout: rank | text | avatar */
	export let invert: boolean = false;
	export let compact: boolean = false;
	export let showRank: boolean = true;
	export let index: number = 0;

	$: avatarSize = compact ? 96 : 160;
	$: numFont = compact ? 72 : 84;
	$: nameFont = compact ? 24 : 48;
	// Fixed footprint for the name = one line at the base size. Long names shrink
	// (down to ~half) and wrap to two lines WITHIN this box, so the card height
	// never changes whether a name is one line or two.
	$: nameBoxH = Math.round(nameFont * 1.2);
	$: rankFont = compact ? 44 : 56;
	$: cardPad = compact ? "10px 12px" : "18px 24px";
	$: cols = showRank
		? invert
			? (compact ? "60px 1fr 96px" : "76px 1fr 120px")
			: (compact ? "96px 1fr 60px" : "120px 1fr 76px")
		: invert
			? (compact ? "1fr 96px" : "1fr 120px")
			: (compact ? "96px 1fr" : "120px 1fr");

	$: hasCard = team.card === "Yellow" || team.card === "Red";
	$: cardClass = team.card === "Yellow"
		? "bg-accentWarn border border-yellow-900"
		: "bg-redAlliance border border-red-900";
</script>

<!-- WRC/default card layout (large avatar) with RR rounding + shadow. -->
<div
	class="ad-in grid items-center bg-white gap-[18px] text-[oklch(0.16_0_0)] rounded-[24px] shadow-[0_6px_20px_oklch(0_0_0/0.5)]"
	style="
		grid-template-columns: {cols};
		padding: {cardPad};
		animation-delay: {index * 70}ms;
	"
>
	<!-- Avatar -->
	<Avatar
		avatar={team.avatar}
		team={team.number}
		alt="Team {team.number}"
		class="rounded-[14px] {alliance === 'red' ? 'bg-red-900' : 'bg-blue-900'} p-1"
		style="width: {avatarSize}px; order: {invert ? 3 : 1};"
	/>

	<!-- Team number + name (+ card badge when rank hidden) -->
	<div class="min-w-0" style="order: 2; text-align: {invert ? 'right' : 'left'};">
		<!-- text-align: inherit overrides .team-num's centering so the number flushes
		     to the same side (left/right) as the name; px-2 matches the name padding. -->
		<div class="rr-display team-num leading-[0.9] text-[oklch(0.14_0_0)] px-2" style="font-size: {numFont}px; text-align: inherit;">
			{team.number}{#if team.designation}<span class="opacity-55" style="font-size: 0.42em;"> ({team.designation})</span>{/if}
		</div>
		<div class="mt-1 px-2 flex flex-col justify-center overflow-hidden" style="height: {nameBoxH}px;">
			<div
				class="font-bold text-[oklch(0.28_0_0)]"
				use:fitTwoLines={{ max: nameFont, min: Math.floor(nameFont * 0.5), maxHeight: nameBoxH, text: team.name }}
			>
				{team.name}
			</div>
		</div>
		{#if !showRank && hasCard}
			<div class="inline-block mt-1 uppercase px-1.5 py-0.5 text-[13px] font-black tracking-[0.08em] {cardClass} {team.card === 'Yellow' ? 'text-black' : 'text-white'} w-16 h-8 flex items-center justify-center">CARD</div>
		{/if}
	</div>

	<!-- Rank (+ card badge when rank shown) -->
	{#if showRank}
		<div class="flex flex-col items-center gap-0.5" style="order: {invert ? 1 : 3};">
			<div class="uppercase text-md tracking-[0.14em] text-[oklch(0.45_0_0)] font-extrabold">Rank</div>
			<div class="rr-display tabular-nums leading-[0.9] text-[oklch(0.14_0_0)]" style="font-size: {rankFont}px;">
				{team.rank}
			</div>
			{#if hasCard}
				<div class="uppercase px-1.5 py-0.5 text-[13px] font-black tracking-[0.08em] {cardClass} {team.card === 'Yellow' ? 'text-black' : 'text-white'} w-16 h-8 flex items-center justify-center">CARD</div>
			{/if}
		</div>
	{/if}
</div>
