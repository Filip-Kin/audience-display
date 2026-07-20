<script lang="ts">
	import { onMount, afterUpdate } from "svelte";
	import type { BracketData, AudienceDoubleElimMatch } from "lib";
	import BracketNode from "./BracketNode.svelte";
	import FinalsSeries from "./FinalsSeries.svelte";

	export let bracket: BracketData;
	/** Smaller type + no team lists, for embedded uses (timeout slideshow). */
	export let compact = false;
	/** Hide the finals best-of-3 win dots (they read live series state). */
	export let showSeries = true;

	const byNumbers = (matches: AudienceDoubleElimMatch[], nums: number[]) =>
		nums
			.map((n) => matches.find((m) => m.matchNumber === n))
			.filter((m): m is AudienceDoubleElimMatch => !!m);

	$: matches = bracket.doubleElimMatchesList;
	$: allianceMap = new Map(bracket.alliances.map((a) => [a.allianceNumber, a]));

	// Standard FRC 8-alliance double elimination:
	//   upper: M1-M4 -> M7, M8 -> M11
	//   lower: M5, M6 -> M9, M10 -> M12 -> M13
	// M10 is listed above M9 so the winner lines (M5->M10, M6->M9) don't cross.
	$: upperByRound = [
		byNumbers(matches, [1, 2, 3, 4]),
		byNumbers(matches, [7, 8]),
		[],
		byNumbers(matches, [11]),
	];
	$: lowerByRound = [
		[],
		byNumbers(matches, [5, 6]),
		byNumbers(matches, [10, 9]),
		byNumbers(matches, [12]),
	];
	$: m13 = matches.find((m) => m.matchNumber === 13) ?? null;
	const roundLabels = ["Round 1", "Round 2", "Round 3", "Round 4", "Round 5"];

	// #region connector lines
	// Winner-advancement pairs; "F" is the finals node.
	const LINKS: [string, string][] = [
		["1", "7"], ["2", "7"], ["3", "8"], ["4", "8"], ["7", "11"], ["8", "11"],
		["5", "10"], ["6", "9"], ["9", "12"], ["10", "12"], ["12", "13"],
		["11", "F"], ["13", "F"],
	];

	let container: HTMLDivElement;
	let nodeEls: Record<string, HTMLElement> = {};
	let paths: string[] = [];

	function registerNode(node: HTMLElement, key: string) {
		nodeEls[key] = node;
		computeLines();
		return {
			destroy() {
				if (nodeEls[key] === node) delete nodeEls[key];
			},
		};
	}

	function computeLines() {
		if (!container) return;
		const c = container.getBoundingClientRect();
		const next = LINKS.flatMap(([from, to]) => {
			const a = nodeEls[from];
			const b = nodeEls[to];
			if (!a || !b) return [];
			const ra = a.getBoundingClientRect();
			const rb = b.getBoundingClientRect();
			const x1 = ra.right - c.left;
			const y1 = ra.top + ra.height / 2 - c.top;
			const x2 = rb.left - c.left;
			const y2 = rb.top + rb.height / 2 - c.top;
			// Elbow just before the destination box: long links (e.g. M11 -> Finals) would
			// otherwise run their destination-height segment across intermediate columns (M13).
			const xm = Math.max(x1 + 6, x2 - (compact ? 14 : 30));
			return [`M ${x1} ${y1} H ${xm} V ${y2} H ${x2}`];
		});
		// afterUpdate calls this on every render; only reassign when the geometry
		// actually moved or the assignment itself would re-render forever.
		if (JSON.stringify(next) !== JSON.stringify(paths)) paths = next;
	}

	onMount(() => {
		computeLines();
		const ro = new ResizeObserver(computeLines);
		ro.observe(container);
		return () => ro.disconnect();
	});
	afterUpdate(computeLines);
	// #endregion

	$: headerCls = compact
		? "uppercase text-center font-black text-[10px] tracking-[0.14em] pb-1"
		: "uppercase text-center font-black text-sm tracking-[0.22em] pb-3";
	$: trackLabelCls = compact
		? "uppercase text-dim font-black text-[9px] tracking-[0.2em]"
		: "uppercase text-dim font-black text-[13px] tracking-[0.3em]";
	$: cellCls = compact
		? "flex flex-col justify-around min-h-0 gap-1 py-0.5"
		: "flex flex-col justify-around min-h-0 gap-3 py-1";
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
	bind:this={container}
	on:animationend={computeLines}
	class="relative grid h-full w-full {compact
		? 'grid-cols-[auto_repeat(5,1fr)_1.15fr] gap-x-2'
		: 'grid-cols-[auto_repeat(5,1fr)_1.25fr] gap-x-4'}"
	style="grid-template-rows: auto 1.7fr 1fr;"
>
	<!-- Winner-advancement lines, measured from the live box positions -->
	<svg class="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
		{#each paths as d, lineIdx}
			<path {d} class="anim-line" style="--anim-delay: {0.6 + lineIdx * 0.07}s;" fill="none" stroke="oklch(1 0 0 / 0.28)" stroke-width={compact ? 1.5 : 2} />
		{/each}
	</svg>

	<!-- Round headers -->
	<div style="grid-row: 1; grid-column: 1;"></div>
	{#each roundLabels as label, i}
		<div class="{headerCls} text-dim" style="grid-row: 1; grid-column: {i + 2};">
			{label}
		</div>
	{/each}
	<div class="{headerCls} text-accentWarn" style="grid-row: 1; grid-column: 7;">
		Finals
	</div>

	<!-- Upper bracket track -->
	<div class="flex items-center justify-center" style="grid-row: 2; grid-column: 1;">
		<div class={trackLabelCls} style="writing-mode: vertical-rl; transform: rotate(180deg);">
			Upper Bracket
		</div>
	</div>
	{#each upperByRound as col, i}
		<div class={cellCls} style="grid-row: 2; grid-column: {i + 2};">
			{#each col as match (match.matchNumber)}
				<div use:registerNode={String(match.matchNumber)} class="anim-card" style="--anim-delay: {i * 0.08}s;">
					<BracketNode {match} {compact} alliances={compact ? null : allianceMap} />
				</div>
			{/each}
		</div>
	{/each}

	<!-- Lower bracket track -->
	<div class="flex items-center justify-center" style="grid-row: 3; grid-column: 1;">
		<div class={trackLabelCls} style="writing-mode: vertical-rl; transform: rotate(180deg);">
			Lower Bracket
		</div>
	</div>
	{#each lowerByRound as col, i}
		<div class={cellCls} style="grid-row: 3; grid-column: {i + 2};">
			{#each col as match (match.matchNumber)}
				<div use:registerNode={String(match.matchNumber)} class="anim-card" style="--anim-delay: {i * 0.08}s;">
					<BracketNode {match} {compact} alliances={compact ? null : allianceMap} />
				</div>
			{/each}
		</div>
	{/each}

	<!-- M13 spans both tracks so it sits between the upper and lower brackets -->
	{#if m13}
		<div class="flex flex-col justify-center min-h-0" style="grid-row: 2 / span 2; grid-column: 6;">
			<div use:registerNode={"13"} class="anim-card" style="--anim-delay: 0.32s;">
				<BracketNode match={m13} {compact} alliances={compact ? null : allianceMap} />
			</div>
		</div>
	{/if}

	<!-- Finals column spans both tracks -->
	<div
		class="flex flex-col justify-center border-l border-white/20 {compact
			? 'gap-2 pl-2'
			: 'gap-6 pl-4'}"
		style="grid-row: 2 / span 2; grid-column: 7;"
	>
		{#if bracket.finals}
			<div use:registerNode={"F"} class="anim-card" style="--anim-delay: 0.4s;">
				<BracketNode match={bracket.finals} {compact} alliances={compact ? null : allianceMap} />
			</div>
		{/if}
		{#if showSeries && !compact}
			<FinalsSeries />
		{/if}
	</div>
</div>
