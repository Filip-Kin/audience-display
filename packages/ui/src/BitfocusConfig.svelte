<script lang="ts">
	import { onMount } from "svelte";

	interface EventDef {
		id: string;
		label: string;
	}
	interface EditButton {
		page: string;
		row: string;
		column: string;
	}
	interface EditSink {
		id: string;
		label: string;
		address: string;
		enabled: boolean;
		grid: Record<string, EditButton>;
	}

	let events: EventDef[] = [];
	let variables: { name: string; description: string; example: string }[] = [];
	let enabled = false;
	let variablesEnabled = true;
	let liveScores = true;
	let sinks: EditSink[] = [];
	let activeTab = 0;

	let loading = true;
	let saveMsg = "";
	// Per-event test result: state drives a fixed-size icon slot (no layout shift),
	// msg is the hover tooltip.
	let testStatus: Record<string, { state: "testing" | "ok" | "fail"; msg: string }> = {};

	// crypto.randomUUID needs a secure context; the UI is served over plain HTTP on
	// LAN IPs, so use a simple fallback id.
	const newId = () => "sink-" + Math.random().toString(36).slice(2, 10);

	function blankGrid(): Record<string, EditButton> {
		const g: Record<string, EditButton> = {};
		for (const e of events) g[e.id] = { page: "", row: "", column: "" };
		return g;
	}

	function newSink(label = "New sink"): EditSink {
		return {
			id: newId(),
			label,
			address: "http://127.0.0.1:8000",
			enabled: true,
			grid: blankGrid(),
		};
	}

	onMount(async () => {
		try {
			const r = await (await fetch("/api/companion/config")).json();
			events = r.events ?? [];
			variables = r.variables ?? [];
			const cfg = r.config ?? {};
			enabled = !!cfg.enabled;
			variablesEnabled = cfg.variablesEnabled !== false;
			liveScores = cfg.liveScores !== false;
			sinks = (cfg.sinks ?? []).map((s: any) => {
				const g = blankGrid();
				for (const [ev, b] of Object.entries(s.buttons ?? {})) {
					if (g[ev])
						g[ev] = {
							page: String((b as any).page ?? ""),
							row: String((b as any).row ?? ""),
							column: String((b as any).column ?? ""),
						};
				}
				return {
					id: s.id || newId(),
					label: s.label || "Sink",
					address: s.address || "",
					enabled: s.enabled !== false,
					grid: g,
				};
			});
			if (!sinks.length) sinks = [newSink("Local")];
			// Baseline the dirty check to the loaded config so hydration itself
			// doesn't trigger a save, then arm auto-save for real user edits.
			lastSavedPayload = buildPayload();
			hydrated = true;
		} finally {
			loading = false;
		}
	});

	function addSink() {
		sinks = [...sinks, newSink()];
		activeTab = sinks.length - 1;
	}
	function removeSink(i: number) {
		sinks = sinks.filter((_, x) => x !== i);
		if (activeTab >= sinks.length) activeTab = Math.max(0, sinks.length - 1);
	}
	function copyFromFirst() {
		if (activeTab === 0 || !sinks[0]) return;
		const src = sinks[0].grid;
		const g: Record<string, EditButton> = {};
		for (const e of events) g[e.id] = { ...src[e.id] };
		sinks[activeTab].grid = g;
		sinks = sinks; // trigger reactivity
	}

	// Serialize the current form into the exact payload the server persists. Kept
	// separate so the auto-save watcher can diff it and skip no-op writes.
	function buildPayload(): string {
		const outSinks = sinks.map((s) => {
			const buttons: Record<string, { page: number; row: number; column: number }> = {};
			for (const e of events) {
				const b = s.grid[e.id];
				// The page/row/column inputs are type="number", so bind:value yields a
				// NUMBER (or null when empty), not the string the EditButton type claims.
				// Coerce with String() before trimming - calling .trim() on a number
				// threw inside this reactive path and halted the whole page (auto-save
				// AND Add Sink stopped working the moment a button number was entered).
				const pageStr = String(b?.page ?? "").trim();
				if (pageStr !== "" && Number(pageStr) >= 1) {
					buttons[e.id] = {
						page: Number(pageStr),
						row: Number(b.row) || 0,
						column: Number(b.column) || 0,
					};
				}
			}
			return { id: s.id, label: s.label, address: s.address.trim(), enabled: s.enabled, buttons };
		});
		return JSON.stringify({ enabled, variablesEnabled, liveScores, sinks: outSinks });
	}

	// Auto-save: there is no Save button (it used to sit at the bottom of a long
	// page nobody could reach - the reason configs never persisted). Any change
	// schedules a debounced POST; a dirty check skips redundant writes (incl. the
	// initial hydration). `hydrated` gates it so we never save before the load
	// populates the form, and only after a SUCCESSFUL load (never overwrite the
	// saved config with defaults on a failed fetch).
	let hydrated = false;
	let lastSavedPayload = "";
	let saveTimer: ReturnType<typeof setTimeout> | null = null;

	$: if (hydrated) queueAutoSave(enabled, variablesEnabled, liveScores, sinks);

	// Args are unused - they exist so Svelte tracks these deps and re-runs on any
	// change (incl. nested sink/button-grid edits, which invalidate `sinks`).
	function queueAutoSave(..._deps: unknown[]): void {
		const payload = buildPayload();
		if (payload === lastSavedPayload) return;
		if (saveTimer) clearTimeout(saveTimer);
		saveMsg = "Saving…";
		saveTimer = setTimeout(() => {
			saveTimer = null;
			void save();
		}, 600);
	}

	async function save(): Promise<void> {
		const payload = buildPayload();
		saveMsg = "Saving…";
		try {
			const r = await (
				await fetch("/api/companion/config", {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: payload,
				})
			).json();
			if (r.ok) {
				lastSavedPayload = payload;
				saveMsg = "All changes saved";
			} else {
				saveMsg = `Error: ${r.error}`;
			}
		} catch (e) {
			saveMsg = `Error: ${e}`;
		}
	}

	async function testPress(eventId: string) {
		const s = sinks[activeTab];
		const b = s.grid[eventId];
		testStatus = { ...testStatus, [eventId]: { state: "testing", msg: "Testing…" } };
		try {
			const r = await (
				await fetch("/api/companion/test", {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({
						address: s.address,
						page: Number(b.page) || 0,
						row: Number(b.row) || 0,
						column: Number(b.column) || 0,
					}),
				})
			).json();
			testStatus = {
				...testStatus,
				[eventId]: r.ok
					? { state: "ok", msg: `Pressed (HTTP ${r.status ?? "ok"})` }
					: { state: "fail", msg: r.error ? String(r.error) : `Companion returned HTTP ${r.status}` },
			};
		} catch (e) {
			testStatus = { ...testStatus, [eventId]: { state: "fail", msg: String(e) } };
		}
	}

</script>

<div class="min-h-screen bg-gray-900 text-gray-100 p-8">
	<div class="max-w-4xl mx-auto space-y-6">
		<header class="flex items-center justify-between">
			<h1 class="text-2xl font-bold">Bitfocus Companion</h1>
			<div class="flex items-center gap-4">
				<span class="text-sm text-gray-400" class:text-red-400={saveMsg.startsWith("Error")}>
					{saveMsg || "Changes save automatically"}
				</span>
				<a
					href="/"
					class="rounded bg-gray-700 px-4 py-2 font-semibold text-white hover:bg-gray-600">Back</a
				>
			</div>
		</header>

		{#if loading}
			<p class="text-gray-400">Loading…</p>
		{:else}
			<section class="rounded-lg bg-gray-800 p-6 space-y-4">
				<label class="flex items-center justify-between">
					<div class="flex flex-col">
						<span class="font-semibold">Enable Companion integration</span>
						<span class="text-sm text-gray-400"
							>Press buttons and push variables to every enabled sink on match-state changes.</span
						>
					</div>
					<input type="checkbox" bind:checked={enabled} class="h-5 w-5 accent-blue-600" />
				</label>

				<label class="flex items-center justify-between">
					<div class="flex flex-col">
						<span class="font-semibold">Push variables</span>
						<span class="text-sm text-gray-400"
							>Also set custom variables (scores, teams, winner, etc.), not just presses.</span
						>
					</div>
					<input type="checkbox" bind:checked={variablesEnabled} class="h-5 w-5 accent-blue-600" />
				</label>

				<label class="flex items-center justify-between">
					<div class="flex flex-col">
						<span class="font-semibold">Live scores</span>
						<span class="text-sm text-gray-400"
							>On: score variables update through the match (still capped at once/sec). Off: score
							variables only refresh when results post (score reveal).</span
						>
					</div>
					<input type="checkbox" bind:checked={liveScores} class="h-5 w-5 accent-blue-600" />
				</label>
			</section>

			<!-- Sink tabs -->
			<section class="rounded-lg bg-gray-800 p-6 space-y-4">
				<div class="flex items-center gap-2 border-b border-gray-700 pb-2">
					{#each sinks as s, i (s.id)}
						<button
							class="rounded-t px-3 py-1.5 text-sm font-semibold {i === activeTab
								? 'bg-gray-700 text-white'
								: 'text-gray-400 hover:text-white'}"
							on:click={() => (activeTab = i)}
						>
							{s.label || `Sink ${i + 1}`}{s.enabled ? "" : " (off)"}
						</button>
					{/each}
					<button
						class="ml-2 rounded bg-gray-700 px-2 py-1 text-sm text-gray-200 hover:bg-gray-600"
						on:click={addSink}>+ Add sink</button
					>
				</div>

				{#if sinks[activeTab]}
					<div class="flex flex-wrap items-end gap-4">
						<label class="flex flex-col gap-1 text-sm">
							<span class="text-gray-400">Label</span>
							<input
								type="text"
								bind:value={sinks[activeTab].label}
								class="w-36 rounded bg-gray-700 px-3 py-2 text-white"
							/>
						</label>
						<label class="flex flex-col gap-1 text-sm">
							<span class="text-gray-400">Companion address (base URL + port)</span>
							<input
								type="text"
								bind:value={sinks[activeTab].address}
								placeholder="http://127.0.0.1:8000"
								class="w-64 rounded bg-gray-700 px-3 py-2 font-mono text-white"
							/>
						</label>
						<label class="flex items-center gap-2 text-sm">
							<input type="checkbox" bind:checked={sinks[activeTab].enabled} class="h-4 w-4 accent-blue-600" />
							<span>Enabled</span>
						</label>
						{#if activeTab !== 0}
							<button
								class="rounded bg-gray-700 px-3 py-2 text-sm text-gray-200 hover:bg-gray-600"
								on:click={copyFromFirst}>Copy from {sinks[0].label || "Sink 1"}</button
							>
						{/if}
						{#if sinks.length > 1}
							<button
								class="rounded bg-red-900/60 px-3 py-2 text-sm text-red-200 hover:bg-red-900"
								on:click={() => removeSink(activeTab)}>Remove sink</button
							>
						{/if}
					</div>

					<div class="overflow-x-auto">
						<table class="w-full text-sm">
							<thead class="text-gray-400">
								<tr class="text-left">
									<th class="py-1 pr-4">Event</th>
									<th class="py-1 pr-2">Page</th>
									<th class="py-1 pr-2">Row</th>
									<th class="py-1 pr-2">Column</th>
									<th class="py-1"></th>
								</tr>
							</thead>
							<tbody>
								{#each events as e (e.id)}
									<tr class="border-t border-gray-700/60">
										<td class="py-1 pr-4 font-medium">{e.label}</td>
										<td class="py-1 pr-2">
											<input
												type="number"
												min="1"
												bind:value={sinks[activeTab].grid[e.id].page}
												class="w-16 rounded bg-gray-700 px-2 py-1 text-white"
											/>
										</td>
										<td class="py-1 pr-2">
											<input
												type="number"
												min="0"
												bind:value={sinks[activeTab].grid[e.id].row}
												class="w-16 rounded bg-gray-700 px-2 py-1 text-white"
											/>
										</td>
										<td class="py-1 pr-2">
											<input
												type="number"
												min="0"
												bind:value={sinks[activeTab].grid[e.id].column}
												class="w-16 rounded bg-gray-700 px-2 py-1 text-white"
											/>
										</td>
										<td class="py-1 whitespace-nowrap">
											<button
												class="rounded bg-gray-700 px-2 py-1 text-xs text-gray-200 hover:bg-gray-600 disabled:opacity-40"
												disabled={!sinks[activeTab].grid[e.id].page}
												on:click={() => testPress(e.id)}>Test</button
											>
											<!-- Fixed-width slot so the status icon never shifts the layout. -->
											<span
												class="ml-2 inline-block w-4 text-center align-middle"
												title={testStatus[e.id]?.msg ?? ""}
											>
												{#if testStatus[e.id]?.state === "testing"}
													<span
														class="inline-block h-3 w-3 animate-spin rounded-full border-2 border-gray-500 border-t-transparent align-middle"
													></span>
												{:else if testStatus[e.id]?.state === "ok"}
													<span class="cursor-help font-bold text-green-400">✓</span>
												{:else if testStatus[e.id]?.state === "fail"}
													<span class="cursor-help font-bold text-red-400">✗</span>
												{/if}
											</span>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			</section>

			<section class="rounded-lg bg-gray-800 p-6">
				<h2 class="text-lg font-semibold">Variables</h2>
				<p class="mt-1 text-sm text-gray-400">
					These fixed custom variables are written to every enabled sink (throttled to once per
					second). The names are the model, reference them in Companion as
					<span class="font-mono">$(custom:name)</span>. They update live during the match and hold
					the final values after results post.
				</p>
				<div class="mt-4 overflow-x-auto">
					<table class="w-full text-sm">
						<thead class="text-gray-400">
							<tr class="text-left">
								<th class="py-1 pr-6">Variable</th>
								<th class="py-1 pr-6">Description</th>
								<th class="py-1">Example</th>
							</tr>
						</thead>
						<tbody>
							{#each variables as v (v.name)}
								<tr class="border-t border-gray-700/60">
									<td class="py-1 pr-6 font-mono text-gray-100">{v.name}</td>
									<td class="py-1 pr-6 text-gray-300">{v.description}</td>
									<td class="py-1 font-mono text-gray-400">{v.example}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</section>

			<p class="text-sm text-gray-500" class:text-red-400={saveMsg.startsWith("Error")}>
				{saveMsg
					? saveMsg
					: "Changes save automatically - no need to hit a Save button."}
			</p>
		{/if}
	</div>
</div>
