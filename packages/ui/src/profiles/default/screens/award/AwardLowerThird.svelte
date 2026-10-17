<script lang="ts">
	// The award lower third: logo tile + slanted name bar, then the winners in a
	// band under it. Pure presentation, driven by `visible` and `revealed`, so the live screen and
	// the Awards page previews draw the same thing. Colours come from the theme
	// variables (primary/secondary gradient, accent rule, radius), so a re-themed
	// profile needs no work; a profile can swap the tile art with
	// `assets.awardLogo` or replace the whole screen via `screens.award`.
	import { tick } from "svelte";
	import type { Award } from "lib";
	import Avatar from "@lib/components/Avatar.svelte";

	export let award: Award;
	/** On air. Off animates everything away without changing its size. */
	export let visible = true;
	/** Winners shown: the bar shrinks and the winner band opens under it. */
	export let revealed = false;
	export let logo: string | undefined = undefined;
	export let teamInfo: (team: number) => { name: string; avatar?: string } = () => ({ name: "" });

	// Footprint is fixed: the preview bar fills the whole height, and on reveal it
	// shrinks to make room for the winners, so nothing below or above moves.
	const HEIGHT = 228;
	const BAR_REVEALED = 100;
	const TITLE_MAX = 80;
	const TITLE_REVEALED = 50;

	let bar: HTMLDivElement;
	let titleEl: HTMLDivElement;
	let sponsorEl: HTMLDivElement | undefined;
	// One line at every stage: the preview size fits the bar's width, and the
	// reveal size is reached with a scale, so the text never re-wraps mid-move.
	let titleSize = TITLE_MAX;
	let titleScale = TITLE_REVEALED / TITLE_MAX;
	let fitted = false;

	async function fit() {
		await tick();
		if (!bar || !titleEl) return;
		await document.fonts?.ready;
		// Always against the preview layout: revealed, the bar's right padding is
		// smaller, and fitting to that made the title jump. The sponsor's layout
		// width does not change with its scale.
		const cs = getComputedStyle(bar);
		const pad = parseFloat(cs.paddingLeft) + HEIGHT / 4 + 30;
		const gap = sponsorEl ? parseFloat(cs.columnGap) || 0 : 0;
		const avail = bar.clientWidth - pad - (sponsorEl?.offsetWidth ?? 0) - gap;
		// Measured off-DOM so the live element is never resized to measure it.
		const ctx = document.createElement("canvas").getContext("2d");
		if (!ctx) return;
		ctx.font = `900 ${TITLE_MAX}px ${getComputedStyle(titleEl).fontFamily}`;
		const natural = ctx.measureText(award.name).width;
		titleSize = natural > avail ? (TITLE_MAX * avail) / natural : TITLE_MAX;
		titleScale = Math.min(1, TITLE_REVEALED / titleSize);
		fitted = true;
	}

	// Re-fit only when the text or the sponsor changes. State arrives every 2s
	// as a new award object, and a re-fit on each one restarted the title scale.
	let fittedFor = "";
	$: fitKey = `${award.name}\u0000${award.sponsor ?? ""}`;
	$: if (fitKey !== fittedFor) {
		fittedFor = fitKey;
		fit();
	}

	$: winners = award.winners;
	$: many = winners.length > 2;
	$: cols = Math.max(1, winners.length);
</script>

<div
	class="lt"
	class:on={visible}
	class:rev={revealed}
	class:fitted
	style="--h: {HEIGHT}px; --bar-rev: {BAR_REVEALED}px; --ts: {titleScale}; --cols: {cols}"
>
	<div class="tile">
		{#if logo}<img src={logo} alt="" />{/if}
	</div>
	<div class="col">
		<div class="bar" bind:this={bar}>
			<div class="title" bind:this={titleEl} style="font-size: {titleSize}px">{award.name}</div>
			{#if award.sponsor}
				<div class="sponsor" class:plate={award.sponsorLight} bind:this={sponsorEl}>
					<img src={award.sponsor} alt="" on:load={fit} />
				</div>
			{/if}
			<div class="rule"></div>
		</div>
		<div class="band">
			{#each winners as w, i (i)}
				<div class="card" class:many style="--i: {i}">
					{#if w.team}
						<Avatar team={w.team} avatar={teamInfo(w.team).avatar} class="avatar" />
					{/if}
					{#if w.person}
						<div class="stack">
							<div class="big">{w.person}</div>
							{#if w.team}
								<div class="sub">{w.team}{teamInfo(w.team).name ? ` · ${teamInfo(w.team).name}` : ""}</div>
							{/if}
						</div>
					{:else if many}
						<div class="stack">
							<div class="big">{w.team}</div>
							<div class="sub">{teamInfo(w.team ?? 0).name}</div>
						</div>
					{:else}
						<div class="big">{w.team}</div>
						<div class="name">{teamInfo(w.team ?? 0).name}</div>
					{/if}
				</div>
			{/each}
		</div>
	</div>
</div>

<style>
	.lt {
		position: absolute;
		left: 50%;
		bottom: 64px;
		transform: translateX(-50%);
		display: flex;
		height: var(--h);
		font-family: var(--font-display);
		/* Hidden until the title is measured, so it never paints at the wrong size. */
		visibility: hidden;
	}
	.lt.fitted {
		visibility: visible;
	}
	.tile {
		width: var(--h);
		display: grid;
		place-items: center;
		padding: 20px;
		background: #000;
		border-radius: var(--radius) 0 0 var(--radius);
		transition: translate 550ms cubic-bezier(0.2, 0.7, 0.2, 1), opacity 550ms cubic-bezier(0.2, 0.7, 0.2, 1);
	}
	.tile img {
		max-width: 100%;
		max-height: 100%;
		object-fit: contain;
	}
	.col {
		display: flex;
		flex-direction: column;
		width: 1100px;
	}

	/* Main bar. The right edge is slanted at a constant angle (offset = a
	   quarter of the height), so the slant keeps its angle as the bar shrinks. */
	.bar {
		position: relative;
		flex: none;
		height: var(--h);
		display: flex;
		align-items: center;
		column-gap: 24px;
		padding: 0 calc(var(--h) / 4 + 30px) 0 40px;
		color: #fff;
		background: linear-gradient(90deg, var(--primary), var(--secondary));
		clip-path: polygon(0 0, 100% 0, calc(100% - var(--h) / 4) 100%, 0 100%);
		transition:
			height 700ms cubic-bezier(0.65, 0, 0.35, 1),
			clip-path 700ms cubic-bezier(0.65, 0, 0.35, 1),
			padding 700ms cubic-bezier(0.65, 0, 0.35, 1);
	}
	.rule {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		height: 6px;
		background: var(--accent);
	}
	.title {
		flex: 1;
		min-width: 0;
		font-weight: 900;
		line-height: 1;
		white-space: nowrap;
		transform-origin: left center;
		transition:
			opacity 450ms cubic-bezier(0.2, 0.7, 0.2, 1),
			translate 450ms cubic-bezier(0.2, 0.7, 0.2, 1),
			scale 700ms cubic-bezier(0.65, 0, 0.35, 1);
	}
	.sponsor {
		flex: none;
		height: 120px;
		display: flex;
		align-items: center;
		transform-origin: right center;
		transition:
			opacity 450ms cubic-bezier(0.2, 0.7, 0.2, 1),
			translate 450ms cubic-bezier(0.2, 0.7, 0.2, 1),
			scale 700ms cubic-bezier(0.65, 0, 0.35, 1);
	}
	.sponsor.plate {
		padding: 12px 22px;
		background: #fff;
		border-radius: calc(var(--radius) - 2px);
	}
	.sponsor img {
		height: 100%;
		max-width: 320px;
		object-fit: contain;
	}

	.band {
		flex: none;
		height: 0;
		overflow: hidden;
		display: grid;
		grid-template-columns: repeat(var(--cols), minmax(0, 1fr));
		gap: 12px;
		padding: 0 12px;
		background: #000;
		border-radius: 0 0 var(--radius) 0;
		transition:
			height 700ms cubic-bezier(0.65, 0, 0.35, 1),
			padding 700ms cubic-bezier(0.65, 0, 0.35, 1);
	}
	.card {
		min-width: 0;
		display: flex;
		align-items: center;
		gap: 18px;
		padding: 8px 18px;
		background: #fff;
		color: #111;
		border-radius: calc(var(--radius) - 2px);
		transition:
			opacity 500ms cubic-bezier(0.2, 0.7, 0.2, 1),
			translate 500ms cubic-bezier(0.2, 0.7, 0.2, 1);
	}
	.card :global(.avatar) {
		flex: none;
		width: 80px;
		height: 80px;
	}
	.card.many {
		gap: 12px;
		padding: 8px 12px;
	}
	.card.many :global(.avatar) {
		width: 64px;
		height: 64px;
	}
	.stack {
		min-width: 0;
	}
	.big {
		flex: none;
		font-size: 46px;
		font-weight: 900;
		line-height: 1;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.many .big {
		font-size: 38px;
	}
	.name {
		min-width: 0;
		font-size: 34px;
		font-weight: 700;
		line-height: 1.1;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.sub {
		font-size: 22px;
		font-weight: 500;
		color: #444;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.many .sub {
		font-size: 20px;
	}

	/* ---- states ----
	   .on puts it on air, .rev shows the winners. Size follows .rev only, so
	   taking an award down never resizes it on the way out. A transition takes
	   the timing of the state it is moving TO, so each state carries the delays
	   for arriving at it. */

	/* Off air: cards drop first, then the column wipes out, then the tile. */
	.tile {
		translate: 0 40px;
		opacity: 0;
		transition-delay: 350ms;
	}
	.col {
		clip-path: polygon(0 0, 0 0, -80px 100%, 0 100%);
		transition: clip-path 450ms cubic-bezier(0.65, 0, 0.35, 1) 150ms;
	}
	.title,
	.sponsor {
		opacity: 0;
		translate: -30px 0;
	}
	.card {
		opacity: 0;
		translate: 0 24px;
		transition-duration: 200ms;
	}

	/* On air: tile rises, the column wipes in, then the name and the sponsor. */
	.on .tile {
		translate: 0 0;
		opacity: 1;
		transition-delay: 0ms;
	}
	.on .col {
		clip-path: polygon(0 0, calc(100% + 80px) 0, calc(100% + 80px) 100%, 0 100%);
		transition: clip-path 600ms cubic-bezier(0.65, 0, 0.35, 1) 150ms;
	}
	.on .title,
	.on .sponsor {
		opacity: 1;
		translate: 0 0;
	}
	.on .title {
		transition-delay: 550ms, 550ms, 0ms;
	}
	.on .sponsor {
		transition-delay: 650ms, 650ms, 0ms;
	}

	/* Revealed: the bar shrinks, the band opens under it, the cards come up in turn. */
	.rev .bar {
		height: var(--bar-rev);
		clip-path: polygon(0 0, 100% 0, calc(100% - var(--bar-rev) / 4) 100%, 0 100%);
		padding-right: calc(var(--bar-rev) / 4 + 30px);
	}
	.rev .title {
		scale: var(--ts);
	}
	.rev .sponsor {
		scale: 0.6;
	}
	.rev .band {
		height: calc(var(--h) - var(--bar-rev));
		padding-top: 12px;
		padding-bottom: 12px;
	}
	.on.rev .card {
		opacity: 1;
		translate: 0 0;
		transition-duration: 500ms;
		transition-delay: calc(500ms + var(--i) * 140ms);
	}
</style>
