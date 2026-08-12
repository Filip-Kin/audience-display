<script lang="ts">
	import { onMount, afterUpdate } from "svelte";
	import { state } from "@lib/state";
	import { collapseBracket, type CollapsedBracket, type CollapsedNode } from "lib";
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

	// #region filler-alliance collapse
	// A small event backfills the standard 8-alliance bracket with filler
	// alliances (seeds beyond the real count) that forfeit 1-0. When that's
	// configured, collapse the foregone matches away and lay out only the
	// real-vs-real ones. `collapsed === null` keeps the hardcoded layout below
	// untouched, so any normal (8 real alliances) event is byte-for-byte the same.
	$: collapsed = collapseBracket(bracket, $state.playoffRealAlliances ?? 8);
	$: collapsedCols = collapsed ? buildCollapsedCols(collapsed) : null;

	function buildCollapsedCols(c: CollapsedBracket) {
		const body = c.nodes.filter((n) => n.track === "upper" || n.track === "lower");
		const depths = [...new Set(body.map((n) => n.depth))].sort((a, b) => a - b);
		const bodyCols = depths.map((d) => ({
			upper: body.filter((n) => n.track === "upper" && n.depth === d),
			lower: body.filter((n) => n.track === "lower" && n.depth === d),
		}));
		const m13 = c.nodes.find((n) => n.track === "m13") ?? null;
		const finals = c.nodes.find((n) => n.track === "finals") ?? null;
		// body columns, then a bridge column for M13, then the finals column.
		const gridCols = bodyCols.length + (m13 ? 1 : 0) + (finals ? 1 : 0);
		return { bodyCols, m13, finals, m13Col: bodyCols.length + 1, finalsCol: gridCols };
	}
	// #endregion

	// Standard FRC 8-alliance double elimination:
	//   upper: M1-M4 -> M7, M8 -> M11
	//   lower: M5, M6 -> M9, M10 -> M12 -> M13
	// M10 is listed above M9 so the winner lines (M5->M10, M6->M9) don't cross.
	// Fluid placement on a 25-unit grid (a card spans 4 units, so placement has
	// quarter-card resolution). The lower track is offset half a card from the
	// upper so each round visibly steps right; M13 leaves a spare unit before
	// the finals divider so its elbow (colinear with M11's) has room.
	$: upperCols = [
		{ matches: byNumbers(matches, [1, 2, 3, 4]), col: 2, extra: "padding-left: 10px;" },
		{ matches: byNumbers(matches, [7, 8]), col: 8, extra: "" },
		{ matches: byNumbers(matches, [11]), col: 14, extra: "" },
	];
	$: lowerCols = [
		{ matches: byNumbers(matches, [5, 6]), col: 4, extra: "" },
		// Raised a third of a card so the M5/M6 -> M9/M10 flow reads diagonally.
		{ matches: byNumbers(matches, [10, 9]), col: 9, extra: "position: relative; top: -32px;" },
		{ matches: byNumbers(matches, [12]), col: 14, extra: "position: relative; top: -32px;" },
	];
	$: m13 = matches.find((m) => m.matchNumber === 13) ?? null;

	// #region connector lines
	// Winner-advancement pairs; "F" is the finals node.
	const LINKS: [string, string][] = [
		["1", "7"], ["2", "7"], ["3", "8"], ["4", "8"], ["7", "11"], ["8", "11"],
		["5", "10"], ["6", "9"], ["9", "12"], ["10", "12"], ["12", "13"],
		["11", "F"], ["13", "F"],
	];
	// Collapsed brackets carry their own rewired links; nodes are keyed by match
	// id ("M7", "F") there, by match number ("7", "F") in the normal layout.
	$: activeLinks = collapsed ? collapsed.links.map(([a, b]) => [a, b] as [string, string]) : LINKS;

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
		const next = activeLinks.flatMap(([from, to]) => {
			const a = nodeEls[from];
			const b = nodeEls[to];
			if (!a || !b) return [];
			const ra = a.getBoundingClientRect();
			const rb = b.getBoundingClientRect();
			const x1 = ra.right - c.left;
			const y1 = ra.top + ra.height / 2 - c.top;
			const x2 = rb.left - c.left;
			const y2 = rb.top + rb.height / 2 - c.top;
			// Collapsed brackets are laid out fresh, so a plain midway elbow reads
			// cleanly. The hardcoded 8-alliance layout keeps its tuned routing:
			// merge joins share a vertical midway between the cards; M12 -> M13 hugs
			// its destination so the next-match pulse zoom never touches it; finals
			// links elbow just before the box so their verticals stay colinear.
			let xm: number;
			if (collapsed) {
				// Elbow just LEFT of the destination, like a classic bracket: two
				// winners feeding one match share a clean vertical join, and lines that
				// skip a column (e.g. upper final -> grand final) don't cut through the
				// boxes between them. Cards are width-capped so this run has room.
				xm = Math.max(x1 + 6, x2 - (compact ? 12 : 28));
			} else {
				const midpointJoin = to === "7" || to === "8" || to === "11" || to === "12";
				xm = midpointJoin
					? Math.max(x1 + 6, (x1 + x2) / 2)
					: Math.max(x1 + 6, x2 - (compact ? (to === "13" ? 7 : 14) : to === "13" ? 12 : 30));
			}
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
	class="relative grid h-full w-full {collapsedCols ? '' : 'grid-cols-[auto_repeat(25,minmax(0,1fr))]'}"
	style="grid-template-rows: 1.7fr 1fr;{collapsedCols
		? ` grid-template-columns: auto repeat(${collapsedCols.finalsCol}, minmax(0, 1fr));`
		: ''}"
>
	<!-- Winner-advancement lines, measured from the live box positions -->
	<svg class="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
		{#each paths as d, lineIdx}
			<path {d} class="anim-line" style="--anim-delay: {0.6 + lineIdx * 0.07}s;" fill="none" stroke="oklch(1 0 0 / 0.28)" stroke-width={compact ? 1.5 : 2} />
		{/each}
	</svg>

	{#if collapsedCols}
		<!-- Collapsed bracket: only the real-vs-real matches, laid out by round
		     depth. Filler alliances and their 1-0 forgone matches are dropped. -->
		<div class="flex items-center justify-center" style="grid-row: 1; grid-column: 1;">
			<div class={trackLabelCls} style="writing-mode: vertical-rl; transform: rotate(180deg);">
				Upper Bracket
			</div>
		</div>
		<div class="flex items-center justify-center" style="grid-row: 2; grid-column: 1;">
			<div class={trackLabelCls} style="writing-mode: vertical-rl; transform: rotate(180deg);">
				Lower Bracket
			</div>
		</div>
		{#each collapsedCols.bodyCols as col, i}
			<div class={cellCls} style="grid-row: 1; grid-column: {i + 2};">
				{#each col.upper as node (node.id)}
					<div use:registerNode={node.id} class="anim-card {compact ? 'w-[92%]' : 'w-[82%]'} mx-auto" style="--anim-delay: {i * 0.08}s;">
						<BracketNode match={node.match} {compact} alliances={compact ? null : allianceMap} />
					</div>
				{/each}
			</div>
			<div class={cellCls} style="grid-row: 2; grid-column: {i + 2};">
				{#each col.lower as node (node.id)}
					<div use:registerNode={node.id} class="anim-card {compact ? 'w-[92%]' : 'w-[82%]'} mx-auto" style="--anim-delay: {i * 0.08}s;">
						<BracketNode match={node.match} {compact} alliances={compact ? null : allianceMap} />
					</div>
				{/each}
			</div>
		{/each}
		{#if collapsedCols.m13}
			<div class="flex flex-col justify-center min-h-0" style="grid-row: 1 / span 2; grid-column: {collapsedCols.m13Col + 1};">
				<div use:registerNode={collapsedCols.m13.id} class="anim-card {compact ? 'w-[92%]' : 'w-[82%]'} mx-auto" style="--anim-delay: 0.32s;">
					<BracketNode match={collapsedCols.m13.match} {compact} alliances={compact ? null : allianceMap} />
				</div>
			</div>
		{/if}
		{#if collapsedCols.finals}
			<div
				class="flex flex-col justify-center border-l border-white/20 {compact ? 'gap-2 pl-2' : 'gap-6 pl-4'}"
				style="grid-row: 1 / span 2; grid-column: {collapsedCols.finalsCol + 1};"
			>
				<div use:registerNode={collapsedCols.finals.id} class="anim-card {compact ? 'w-[92%]' : 'w-[82%]'} mx-auto" style="--anim-delay: 0.4s;">
					<BracketNode match={collapsedCols.finals.match} {compact} alliances={compact ? null : allianceMap} />
				</div>
				{#if showSeries && !compact}
					<FinalsSeries />
				{/if}
			</div>
		{/if}
	{:else}
	<!-- Upper bracket track -->
	<div class="flex items-center justify-center" style="grid-row: 1; grid-column: 1;">
		<div class={trackLabelCls} style="writing-mode: vertical-rl; transform: rotate(180deg);">
			Upper Bracket
		</div>
	</div>
	{#each upperCols as c, i}
		<div class={cellCls} style="grid-row: 1; grid-column: {c.col} / span 4; {c.extra}">
			{#each c.matches as match (match.matchNumber)}
				<div use:registerNode={String(match.matchNumber)} class="anim-card" style="--anim-delay: {i * 0.08}s;">
					<BracketNode {match} {compact} alliances={compact ? null : allianceMap} />
				</div>
			{/each}
		</div>
	{/each}

	<!-- Lower bracket track -->
	<div class="flex items-center justify-center" style="grid-row: 2; grid-column: 1;">
		<div class={trackLabelCls} style="writing-mode: vertical-rl; transform: rotate(180deg);">
			Lower Bracket
		</div>
	</div>
	{#each lowerCols as c, i}
		<div class={cellCls} style="grid-row: 2; grid-column: {c.col} / span 4; {c.extra}">
			{#each c.matches as match (match.matchNumber)}
				<div use:registerNode={String(match.matchNumber)} class="anim-card" style="--anim-delay: {i * 0.08}s;">
					<BracketNode {match} {compact} alliances={compact ? null : allianceMap} />
				</div>
			{/each}
		</div>
	{/each}

	<!-- M13 spans both tracks so it sits between the upper and lower brackets -->
	{#if m13}
		<div class="flex flex-col justify-center min-h-0" style="grid-row: 1 / span 2; grid-column: 18 / span 4; position: relative; left: 22px;">
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
		style="grid-row: 1 / span 2; grid-column: 23 / span 4;"
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
	{/if}
</div>
