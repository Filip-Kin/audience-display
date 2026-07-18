<script lang="ts">
	import type { Team } from "lib";
	import Avatar from "@lib/components/Avatar.svelte";

	export let team: Team;
	export let alliance: "red" | "blue";
	export let compact: boolean = false;
	export let showRank: boolean = true;
	export let index: number = 0;

	$: avatarBox = compact ? 58 : 82;
	$: numFont = compact ? 48 : 70;
	$: nameFont = compact ? 22 : 32;
	$: rankFont = compact ? 30 : 42;
	$: rowPad = compact ? "8px 12px" : "14px 20px";
	$: namePad = compact ? "6px 12px" : "9px 20px";

	// Darker tint of the alliance color behind the avatar (per the RR design).
	$: avatarTint = alliance === "red" ? "oklch(0.30 0.10 25)" : "oklch(0.30 0.12 262)";

	$: hasCard = team.card === "Yellow" || team.card === "Red";
	$: cardClass = team.card === "Yellow"
		? "bg-accentWarn border border-yellow-900"
		: "bg-redAlliance border border-red-900";
</script>

<div
	class="ad-in rounded-[24px] overflow-hidden shadow-[0_6px_20px_oklch(0_0_0/0.5)]"
	style="animation-delay: {index * 70}ms;"
>
	<!-- Top row: avatar box, team number, rank (quals only) on the alliance color -->
	<div
		class="flex items-center gap-[18px] {alliance === 'red' ? 'bg-redAlliance' : 'bg-blueAlliance'}"
		style="padding: {rowPad};"
	>
		<div
			class="flex items-center justify-center flex-none rounded-[14px]"
			style="width: {avatarBox}px; height: {avatarBox}px; background: {avatarTint};"
		>
			<Avatar
				avatar={team.avatar}
				team={team.number}
				alt="Team {team.number}"
				class="object-contain"
				style="width: {avatarBox - 20}px; height: {avatarBox - 20}px;"
			/>
		</div>
		<div class="rr-display text-white leading-[0.9]" style="font-size: {numFont}px;">
			{team.number}
		</div>
		{#if showRank}
			<div class="ml-auto flex flex-col items-center gap-px">
				<div class="uppercase text-[13px] tracking-[0.14em] font-extrabold text-[oklch(1_0_0/0.75)]">Rank</div>
				<div class="rr-display text-white leading-[0.9]" style="font-size: {rankFont}px;">
					{team.rank}
				</div>
			</div>
		{/if}
	</div>

	<!-- Bottom row: team name on white (+ penalty card chip when assigned) -->
	<div class="flex items-center gap-3 bg-white" style="padding: {namePad};">
		<div
			class="min-w-0 flex-1 font-bold text-[oklch(0.16_0_0)] whitespace-nowrap overflow-hidden text-ellipsis"
			style="font-size: {nameFont}px;"
		>
			{team.name}
		</div>
		{#if hasCard}
			<div class="flex-none w-12 h-7 rounded {cardClass}"></div>
		{/if}
	</div>
</div>
