<script lang="ts">
	import { onDestroy } from "svelte";
	import { TBA_AWARD_TYPES, filledWinners, type Award, type AwardWinner } from "lib";
	import {
		state,
		activeProfile,
		activeEventCode,
		sendSetAwards,
		sendShowAward,
		sendRevealAward,
		sendClearAward,
		sendSetAwardCursor,
	} from "@lib/state";
	import { awardTeamInfo, finalsResult, newAward } from "@lib/awards";
	import AwardLowerThird from "./profiles/default/screens/award/AwardLowerThird.svelte";

	// #region list editing
	// The page edits a local copy and sends the whole list shortly after each
	// change. State is rebroadcast every 2s, so the server copy is only adopted
	// when nothing has been typed for a moment (another page, a profile switch).
	let awards: Award[] = [];
	let lastEdit = 0;
	let saveTimer: ReturnType<typeof setTimeout> | null = null;
	let scope: string | null | undefined = undefined;

	$: serverAwards = $state.awards ?? [];
	$: adopt(serverAwards, $state.activeProfileId);
	function adopt(list: Award[], profileId: string | null) {
		if (profileId !== scope) {
			scope = profileId;
			awards = withSlot(list);
			return;
		}
		if (saveTimer || Date.now() - lastEdit < 2500) return;
		const next = withSlot(list);
		if (JSON.stringify(next) !== JSON.stringify(awards)) awards = next;
	}

	// Every award shows at least one winner row to type into. Rows only go away
	// with their X.
	function withSlot(list: Award[]): Award[] {
		return structuredClone(list).map((a) => (a.winners.length ? a : { ...a, winners: [{}] }));
	}

	function changed() {
		awards = awards;
		lastEdit = Date.now();
		if (saveTimer) clearTimeout(saveTimer);
		saveTimer = setTimeout(() => {
			saveTimer = null;
			sendSetAwards(awards);
		}, 400);
	}
	onDestroy(() => {
		if (saveTimer) {
			clearTimeout(saveTimer);
			sendSetAwards(awards);
		}
	});

	function addAward() {
		awards = [...awards, newAward()];
		changed();
	}
	function removeAward(i: number) {
		awards = awards.filter((_, j) => j !== i);
		changed();
	}
	function move(i: number, by: number) {
		const j = i + by;
		if (j < 0 || j >= awards.length) return;
		const next = [...awards];
		[next[i], next[j]] = [next[j], next[i]];
		awards = next;
		changed();
	}
	function addWinner(a: Award, w: AwardWinner = {}) {
		a.winners = [...a.winners, w];
		changed();
	}
	function removeWinner(a: Award, i: number) {
		a.winners = a.winners.filter((_, j) => j !== i);
		changed();
	}
	function setTeam(w: AwardWinner, value: string) {
		const n = Number(value);
		if (Number.isInteger(n) && n > 0) w.team = n;
		else delete w.team;
		changed();
	}
	function setPerson(w: AwardWinner, value: string) {
		if (value) w.person = value;
		else delete w.person;
		changed();
	}

	// A TBA type for a new name: an exact or contained match on TBA's own names.
	function guessType(a: Award) {
		if (a.tbaType !== null || !a.name.trim()) return;
		const name = a.name.trim().toLowerCase();
		const exact = TBA_AWARD_TYPES.find((t) => t.label.toLowerCase() === name);
		const contained = [...TBA_AWARD_TYPES]
			.sort((x, y) => y.label.length - x.label.length)
			.find((t) => t.label.length > 4 && name.includes(t.label.toLowerCase()));
		const hit = exact ?? contained;
		if (hit) {
			a.tbaType = hit.value;
			changed();
		}
	}

	$: typeCounts = awards.reduce((m, a) => {
		if (a.tbaType !== null) m.set(a.tbaType, (m.get(a.tbaType) ?? 0) + 1);
		return m;
	}, new Map<number, number>());
	// #endregion

	// #region Winner + Finalist from the finals
	$: finals = finalsResult($state.bracket);
	function fillFinals() {
		if (!finals) return;
		const put = (name: string, type: number, teams: number[]) => {
			const winners = teams.map((team) => ({ team }));
			const existing = awards.find((a) => a.tbaType === type || a.name.trim().toLowerCase() === name.toLowerCase());
			if (existing) existing.winners = winners;
			else awards = [...awards, newAward({ name, tbaType: type, winners })];
		};
		put("Winner", 1, finals.winner);
		put("Finalist", 2, finals.finalist);
		changed();
	}
	// #endregion

	// #region sponsor logos
	$: profileLogos = [
		...($activeProfile.assets.sponsors ?? []).map((s) => ({ src: s.src, light: !!s.light })),
		...($activeProfile.assets.livestream ? [{ src: $activeProfile.assets.livestream, light: false }] : []),
	].filter((l, i, all) => all.findIndex((x) => x.src === l.src) === i);
	$: uploadedLogos = [...new Set(awards.map((a) => a.sponsor).filter((s): s is string => !!s?.startsWith("/award-logos/")))];

	function pickSponsor(a: Award, src: string) {
		if (!src) {
			delete a.sponsor;
			delete a.sponsorLight;
		} else {
			a.sponsor = src;
			const known = profileLogos.find((l) => l.src === src);
			if (known) a.sponsorLight = known.light || undefined;
		}
		changed();
	}

	let uploadError = "";
	async function uploadSponsor(a: Award, input: HTMLInputElement) {
		const file = input.files?.[0];
		input.value = "";
		if (!file) return;
		uploadError = "";
		const dataUrl = await new Promise<string>((resolve, reject) => {
			const r = new FileReader();
			r.onload = () => resolve(String(r.result));
			r.onerror = () => reject(r.error);
			r.readAsDataURL(file);
		});
		try {
			const res = await (
				await fetch("/api/awards/logo", {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({ dataUrl }),
				})
			).json();
			if (!res.ok) throw new Error(res.error);
			a.sponsor = res.url;
			a.sponsorLight = true;
			changed();
		} catch (e) {
			uploadError = `Upload failed: ${e instanceof Error ? e.message : e}`;
		}
	}
	// #endregion

	// #region on air
	$: onAir = $state.screen === "award" ? $state.award : null;
	$: cursor = $state.awardCursor;
	function show(a: Award) {
		flush();
		sendShowAward(a.id);
	}
	function reveal(a?: Award) {
		flush();
		sendRevealAward(a?.id);
	}
	function next() {
		flush();
		fetch("/api/awards/next", { method: "POST" });
	}
	// Commands act on the server's list, so a pending edit goes first.
	function flush() {
		if (!saveTimer) return;
		clearTimeout(saveTimer);
		saveTimer = null;
		sendSetAwards(awards);
	}
	// #endregion

	// #region TBA
	let tbaEventKey = "";
	let tbaAuthId = "";
	let tbaSecret = "";
	let tbaTouched = false;
	$: tba = $state.awardsTba;
	$: if (!tbaTouched) {
		tbaEventKey = tba?.eventKey || $activeEventCode || "";
		tbaAuthId = tba?.source === "awards" ? tba.authId : "";
	}
	let tbaMsg = "";
	let tbaBusy = false;

	async function saveTba() {
		tbaBusy = true;
		tbaMsg = "";
		try {
			const r = await (
				await fetch("/api/awards/tba/credentials", {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({ eventKey: tbaEventKey, authId: tbaAuthId, secret: tbaSecret }),
				})
			).json();
			tbaMsg = r.ok ? "Saved" : `Error: ${r.error}`;
			tbaSecret = "";
			tbaTouched = false;
		} catch (e) {
			tbaMsg = `Error: ${e}`;
		}
		tbaBusy = false;
	}

	async function pushTba() {
		flush();
		tbaBusy = true;
		tbaMsg = "";
		try {
			const r = await (
				await fetch("/api/awards/tba/push", {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({ eventKey: tbaEventKey }),
				})
			).json();
			tbaMsg = r.ok ? `Pushed ${r.sent}` : r.status === 401 ? "TBA 401: key without award permission" : `TBA ${r.status || "error"}: ${r.message}`;
		} catch (e) {
			tbaMsg = `Error: ${e}`;
		}
		tbaBusy = false;
	}
	$: pushable = awards.filter((a) => a.tbaType !== null && a.name && filledWinners(a).length).length;
	// #endregion

	$: logo = $activeProfile.assets.awardLogo ?? $activeProfile.assets.event;
	$: teamInfo = (n: number) => awardTeamInfo($state, n);

	// Previews draw the real lower third at its 1920-canvas size, scaled to the
	// card. Stage = the lower third plus the 64px it sits above the bottom edge.
	const STAGE_W = 1400;
	const STAGE_H = 300;
	let previewWidth = 0;
	$: previewScale = previewWidth ? previewWidth / STAGE_W : 0;
</script>

<div class="h-full overflow-y-auto bg-gray-900 text-gray-100">
	<div class="max-w-5xl mx-auto px-4 py-6 sm:p-8 space-y-6">
		<header class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
			<div class="flex items-baseline gap-3 shrink-0">
				<a href="/" class="text-gray-400 hover:text-white">Audience Display</a>
				<h1 class="text-2xl font-bold">Awards</h1>
			</div>
			<span class="min-w-0 text-sm text-gray-400 truncate">{$activeProfile.name}</span>
		</header>

		<!-- On-air controls stay in reach while scrolling the list. -->
		<section class="sticky top-0 z-10 -mx-4 sm:mx-0 px-4 py-3 sm:rounded-lg bg-gray-800/95 backdrop-blur flex flex-wrap items-center gap-3">
			<div class="flex-1 min-w-0">
				{#if onAir}
					<div class="flex items-center gap-2">
						<span class="rounded bg-red-600 px-2 py-0.5 text-xs font-bold uppercase">On air</span>
						<span class="text-xs text-gray-400 uppercase">{onAir.revealed ? "Winners" : "Name"}</span>
					</div>
					<div class="font-semibold truncate">{onAir.award.name || "Untitled"}</div>
				{:else}
					<div class="text-gray-400">Off air</div>
				{/if}
			</div>
			<div class="flex gap-2">
				<button class="rounded bg-gray-700 px-4 py-2 font-semibold hover:bg-gray-600 disabled:opacity-40" on:click={next} disabled={!awards.length}>Next</button>
				<button class="rounded bg-blue-600 px-4 py-2 font-semibold hover:bg-blue-500 disabled:opacity-40" on:click={() => reveal()} disabled={!onAir || onAir.revealed}>Reveal</button>
				<button class="rounded bg-gray-700 px-4 py-2 font-semibold hover:bg-gray-600 disabled:opacity-40" on:click={sendClearAward} disabled={!onAir}>Clear</button>
			</div>
		</section>

		{#if !awards.length}
			<p class="text-gray-400">No awards yet</p>
		{/if}

		{#each awards as a, i (a.id)}
			{@const live = onAir?.award.id === a.id}
			<section class="rounded-lg bg-gray-800 p-4 sm:p-6 space-y-4 ring-2 {live ? 'ring-red-600' : cursor === a.id ? 'ring-blue-600' : 'ring-transparent'}">
				<div class="flex flex-wrap items-center gap-3">
					<input
						type="text"
						bind:value={a.name}
						on:input={changed}
						on:blur={() => guessType(a)}
						aria-label="Award name"
						placeholder="Award name"
						class="flex-1 min-w-[12rem] rounded bg-gray-700 px-3 py-2 text-lg font-semibold text-white placeholder:text-gray-500"
					/>
					<div class="flex gap-2">
						<button class="rounded bg-gray-700 px-4 py-2 font-semibold hover:bg-gray-600" on:click={() => show(a)}>Show</button>
						<button class="rounded bg-blue-600 px-4 py-2 font-semibold hover:bg-blue-500 disabled:opacity-40" on:click={() => reveal(a)} disabled={!filledWinners(a).length}>Reveal</button>
					</div>
				</div>

				<div class="grid gap-4 sm:grid-cols-2">
					<label class="flex flex-col gap-1 text-sm">
						<span class="text-gray-400">TBA type</span>
						<select
							class="rounded bg-gray-700 px-3 py-2 text-white"
							value={a.tbaType ?? ""}
							on:change={(e) => {
								a.tbaType = e.currentTarget.value === "" ? null : Number(e.currentTarget.value);
								changed();
							}}
						>
							<option value="">Not on TBA</option>
							{#each TBA_AWARD_TYPES as t}
								<option value={t.value}>{t.label}</option>
							{/each}
						</select>
						{#if a.tbaType !== null && (typeCounts.get(a.tbaType) ?? 0) > 1}
							<span class="text-amber-400">Duplicate TBA type</span>
						{/if}
					</label>
					<div class="flex flex-col gap-1 text-sm">
						<span class="text-gray-400">Sponsor</span>
						<div class="flex gap-2">
							<select
								class="flex-1 min-w-0 rounded bg-gray-700 px-3 py-2 text-white"
								value={a.sponsor ?? ""}
								on:change={(e) => pickSponsor(a, e.currentTarget.value)}
								aria-label="Sponsor"
							>
								<option value="">None</option>
								{#if a.sponsor && !profileLogos.some((l) => l.src === a.sponsor) && !uploadedLogos.includes(a.sponsor)}
									<option value={a.sponsor}>{a.sponsor.split("/").pop()}</option>
								{/if}
								{#each profileLogos as l}
									<option value={l.src}>{l.src.split("/").pop()}</option>
								{/each}
								{#each uploadedLogos as src, k}
									<option value={src}>Upload {k + 1}</option>
								{/each}
							</select>
							<label class="cursor-pointer rounded bg-gray-700 px-3 py-2 font-semibold hover:bg-gray-600">
								Upload
								<input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" class="hidden" on:change={(e) => uploadSponsor(a, e.currentTarget)} />
							</label>
						</div>
						{#if a.sponsor}
							<label class="flex items-center gap-2 text-gray-300">
								<input
									type="checkbox"
									class="h-4 w-4 accent-blue-500"
									checked={!!a.sponsorLight}
									on:change={(e) => {
										a.sponsorLight = e.currentTarget.checked || undefined;
										changed();
									}}
								/>
								White card
							</label>
						{/if}
					</div>
				</div>

				<div class="space-y-2">
					<div class="text-sm text-gray-400">Winners</div>
					{#each a.winners as w, k}
						<div class="grid grid-cols-[6rem_minmax(0,1fr)_1.5rem] sm:grid-cols-[6rem_minmax(0,1fr)_minmax(0,1fr)_1.5rem] items-center gap-2">
							<input
								type="number"
								min="1"
								value={w.team ?? ""}
								on:input={(e) => setTeam(w, e.currentTarget.value)}
								aria-label="Team number"
								placeholder="Team"
								class="min-w-0 rounded bg-gray-700 px-3 py-2 text-white tabular-nums placeholder:text-gray-500"
							/>
							<span class="truncate text-gray-300 sm:order-none order-last col-span-3 sm:col-span-1 -mt-1 sm:mt-0 text-sm sm:text-base">{w.team ? teamInfo(w.team).name : ""}</span>
							<input
								type="text"
								value={w.person ?? ""}
								on:input={(e) => setPerson(w, e.currentTarget.value)}
								aria-label="Person"
								placeholder="Person"
								class="min-w-0 rounded bg-gray-700 px-3 py-2 text-white placeholder:text-gray-500"
							/>
							<button class="text-gray-400 hover:text-white text-2xl leading-none" aria-label="Remove winner" on:click={() => removeWinner(a, k)}>&times;</button>
						</div>
					{/each}
					<button class="rounded bg-gray-700 px-3 py-1.5 text-sm font-semibold hover:bg-gray-600" on:click={() => addWinner(a)}>Add winner</button>
				</div>

				<div class="grid gap-3 sm:grid-cols-2">
					{#each [false, true] as revealed}
						<div class="overflow-hidden rounded bg-black" bind:clientWidth={previewWidth} style="height: {STAGE_H * previewScale}px">
							<div class="relative origin-top-left" style="width: {STAGE_W}px; height: {STAGE_H}px; transform: scale({previewScale})">
								<AwardLowerThird award={a} {revealed} {logo} {teamInfo} />
							</div>
						</div>
					{/each}
				</div>

				<div class="flex flex-wrap items-center gap-2 text-sm">
					<button class="rounded bg-gray-700 px-3 py-1.5 font-semibold hover:bg-gray-600 disabled:opacity-40" on:click={() => move(i, -1)} disabled={i === 0} aria-label="Move up">&uarr;</button>
					<button class="rounded bg-gray-700 px-3 py-1.5 font-semibold hover:bg-gray-600 disabled:opacity-40" on:click={() => move(i, 1)} disabled={i === awards.length - 1} aria-label="Move down">&darr;</button>
					<button class="rounded bg-gray-700 px-3 py-1.5 font-semibold hover:bg-gray-600" on:click={() => sendSetAwardCursor(a.id)} disabled={cursor === a.id}>{cursor === a.id ? "Next up" : "Set next"}</button>
					<span class="flex-1"></span>
					<button class="rounded px-3 py-1.5 font-semibold text-red-300 hover:bg-red-900/40 disabled:opacity-40" on:click={() => removeAward(i)} disabled={live}>Delete</button>
				</div>
			</section>
		{/each}

		{#if uploadError}<p class="text-sm text-red-300">{uploadError}</p>{/if}

		<div class="flex flex-wrap gap-3">
			<button class="rounded bg-blue-600 px-4 py-2 font-semibold hover:bg-blue-500" on:click={addAward}>Add award</button>
			<button class="rounded bg-gray-700 px-4 py-2 font-semibold hover:bg-gray-600 disabled:opacity-40" on:click={fillFinals} disabled={!finals}>Winner + Finalist from finals</button>
		</div>

		<section class="rounded-lg bg-gray-800 p-4 sm:p-6 space-y-4">
			<div class="flex items-baseline justify-between gap-4">
				<h2 class="text-lg font-semibold">The Blue Alliance</h2>
				<span class="text-sm text-gray-400">
					{tba?.source === "fimav" ? "Key from AV Assistant" : tba?.source === "awards" ? "Key saved" : "No key"}
				</span>
			</div>
			<div class="grid gap-3 sm:grid-cols-3">
				<label class="flex flex-col gap-1 text-sm">
					<span class="text-gray-400">Event key</span>
					<input type="text" bind:value={tbaEventKey} on:input={() => (tbaTouched = true)} placeholder="2026mibg" class="rounded bg-gray-700 px-3 py-2 font-mono text-white placeholder:text-gray-500" />
				</label>
				<label class="flex flex-col gap-1 text-sm">
					<span class="text-gray-400">Auth ID</span>
					<input type="text" bind:value={tbaAuthId} on:input={() => (tbaTouched = true)} placeholder={tba?.source === "fimav" ? tba.authId : ""} class="rounded bg-gray-700 px-3 py-2 font-mono text-white placeholder:text-gray-500" />
				</label>
				<label class="flex flex-col gap-1 text-sm">
					<span class="text-gray-400">Secret</span>
					<input type="password" bind:value={tbaSecret} on:input={() => (tbaTouched = true)} placeholder={tba?.hasSecret ? "••••••••" : ""} class="rounded bg-gray-700 px-3 py-2 font-mono text-white placeholder:text-gray-500" />
				</label>
			</div>
			<div class="flex flex-wrap items-center gap-3">
				<button class="rounded bg-gray-700 px-4 py-2 font-semibold hover:bg-gray-600 disabled:opacity-40" on:click={saveTba} disabled={tbaBusy || !tbaTouched}>Save</button>
				<button class="rounded bg-blue-600 px-4 py-2 font-semibold hover:bg-blue-500 disabled:opacity-40" on:click={pushTba} disabled={tbaBusy || !tba?.hasSecret || !pushable}>Push {pushable} to TBA</button>
				{#if tbaMsg}<span class="text-sm text-gray-300">{tbaMsg}</span>{/if}
			</div>
		</section>

		<section class="rounded-lg bg-gray-800 p-4 sm:p-6 space-y-2 text-sm">
			<h2 class="text-lg font-semibold">Companion</h2>
			<div class="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1 font-mono text-gray-300">
				<span>POST /api/awards/next</span><span class="text-gray-500 font-sans">Next</span>
				<span>POST /api/awards/reveal</span><span class="text-gray-500 font-sans">Reveal</span>
				<span>POST /api/awards/clear</span><span class="text-gray-500 font-sans">Clear</span>
			</div>
		</section>
	</div>
</div>
