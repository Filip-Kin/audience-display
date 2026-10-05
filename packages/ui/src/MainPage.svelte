<script lang="ts">
	import { onMount } from "svelte";
	import { state, activeProfile, sendSetTeamNames, sendSelectProfile } from "@lib/state";
	import { listProfiles, DEFAULT_PROFILE_ID } from "./profiles";
	import BracketGrid from "./profiles/default/screens/playoff-bracket/BracketGrid.svelte";
	import Avatar from "@lib/components/Avatar.svelte";
	import { avatarState } from "@lib/avatarStore";
	import type { TeamNameEntry } from "../../lib/types/audience_display";

	interface VmixInput {
		key: string;
		number: number;
		type: string;
		title: string;
	}

	let status: {
		reachable: boolean;
		url: string;
		inputs: VmixInput[];
		fmsInput: VmixInput | null;
		error?: string;
	} | null = null;
	let loadingStatus = true;

	// Prefill the team count from the roster FMS has sent the display, but let the
	// operator override it (FMS may not have the team list loaded yet).
	let teamCount = 0;
	let teamCountTouched = false;
	$: if (!teamCountTouched && $state.ranking.length) teamCount = $state.ranking.length;

	let cameraKey = "";
	let busyFms = false;
	let busyCam = false;
	let fmsMsg = "";
	let camMsg = "";

	// Editable vMix HTTP-API URL (persisted server-side to settings.json).
	let vmixUrlInput = "";
	let vmixUrlTouched = false;
	let busyUrl = false;
	let urlMsg = "";
	async function saveVmixUrl() {
		busyUrl = true;
		urlMsg = "";
		try {
			const r = await (
				await fetch("/api/vmix/url", {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({ url: vmixUrlInput }),
				})
			).json();
			urlMsg = r.ok ? "Saved." : `Error: ${r.error}`;
			vmixUrlTouched = false;
			await refresh();
		} catch (e) {
			urlMsg = `Error: ${e}`;
		}
		busyUrl = false;
	}

	// Editable real playoff-alliance count. A small event backfills the standard
	// 8-alliance bracket with fillers (seeds beyond this count); the bracket +
	// alliance-selection screens collapse those foregone 1-0 matches away. 8 = normal.
	let realAlliances = 8;
	let realAlliancesTouched = false;
	let busyAlliances = false;
	let allianceMsg = "";
	async function saveRealAlliances() {
		busyAlliances = true;
		allianceMsg = "";
		try {
			const r = await (
				await fetch("/api/playoff/alliances", {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({ realAlliances }),
				})
			).json();
			allianceMsg = r.ok ? "Saved." : `Error: ${r.error}`;
			if (r.ok) realAlliances = r.realAlliances;
			realAlliancesTouched = false;
		} catch (e) {
			allianceMsg = `Error: ${e}`;
		}
		busyAlliances = false;
	}
	async function loadRealAlliances() {
		try {
			const r = await (await fetch("/api/playoff/alliances")).json();
			if (r.ok && !realAlliancesTouched) realAlliances = r.realAlliances;
		} catch {
			// non-fatal
		}
	}

	async function refresh() {
		loadingStatus = true;
		try {
			status = await (await fetch("/api/vmix/status")).json();
			if (status && !vmixUrlTouched) vmixUrlInput = status.url;
			if (status && !cameraKey && status.inputs.length) {
				// Default to the first non-FMS, non-composite input as the camera.
				const cam = status.inputs.find(
					(i) => i.title !== "FMS" && i.title !== "Alliance Cam"
				);
				cameraKey = (cam ?? status.inputs[0]).key;
			}
		} catch (e) {
			status = { reachable: false, url: "", inputs: [], fmsInput: null, error: String(e) };
		}
		loadingStatus = false;
	}

	onMount(() => {
		refresh();
		loadRealAlliances();
	});

	const profiles = listProfiles();

	// Bracket preview: the stock bracket laid out at its real size, the
	// 1808x816 area the Playoff Bracket screen gives it on the 1920x1080 canvas,
	// then scaled down to the panel width. Shows the unsaved real-alliance choice.
	const STAGE_W = 1808;
	const STAGE_H = 816;
	let previewWidth = 0;
	$: previewScale = previewWidth ? previewWidth / STAGE_W : 0;

	// #region Team names
	// One row per team FMS has named (it fills in as previews, results and
	// rankings arrive), plus manual rows for teams FMS does not know yet. A row
	// shows the FMS name as a greyed placeholder until a name is typed. Overrides are per profile on the server; edits stay local until
	// Save.
	type TeamRow = { number: string; fmsName: string | null; name: string; designation: string; manual: boolean };

	function toEntries(rows: TeamRow[]): TeamNameEntry[] {
		const byNumber = new Map<number, TeamNameEntry>();
		for (const r of rows) {
			const number = Number(r.number);
			const name = r.name.trim();
			const designation = r.designation.trim();
			if (!Number.isInteger(number) || number <= 0 || (!name && !designation)) continue;
			byNumber.set(number, { number, ...(name ? { name } : {}), ...(designation ? { designation } : {}) });
		}
		return [...byNumber.values()].sort((a, b) => a.number - b.number);
	}

	function buildRows(saved: TeamNameEntry[], fms: { number: number; name: string }[]): TeamRow[] {
		const rows: TeamRow[] = fms.map((t) => {
			const o = saved.find((e) => e.number === t.number);
			return { number: String(t.number), fmsName: t.name, name: o?.name ?? "", designation: o?.designation ?? "", manual: false };
		});
		for (const o of saved) {
			if (fms.some((t) => t.number === o.number)) continue;
			rows.push({ number: String(o.number), fmsName: null, name: o.name ?? "", designation: o.designation ?? "", manual: true });
		}
		return rows.sort((a, b) => Number(a.number) - Number(b.number));
	}

	let teamRows: TeamRow[] = [];
	$: savedTeamNames = $state.teamNames ?? [];
	$: fmsTeams = $state.fmsTeams ?? [];
	$: teamNamesDirty = JSON.stringify(toEntries(teamRows)) !== JSON.stringify(savedTeamNames);
	$: fmsCount = teamRows.filter((r) => !r.manual).length;

	// Rebuild on a profile switch.
	let teamScope: string | null | undefined = undefined;
	$: if ($state.activeProfileId !== teamScope) {
		teamScope = $state.activeProfileId;
		teamRows = buildRows(savedTeamNames, fmsTeams);
		prevSaved = JSON.stringify(savedTeamNames);
		prevFms = JSON.stringify(fmsTeams);
	}

	// Follow the server (a save, another screen, new FMS teams). State is
	// rebroadcast every few seconds, so only a real change counts. With unsaved
	// edits, new FMS teams are merged in without touching what was typed.
	let prevSaved = "[]";
	let prevFms = "[]";
	$: savedTeamNames, fmsTeams, followServer();
	function followServer() {
		const saved = JSON.stringify(savedTeamNames);
		const fms = JSON.stringify(fmsTeams);
		if (saved === prevSaved && fms === prevFms) return;
		const draft = JSON.stringify(toEntries(teamRows));
		if (draft === prevSaved || draft === saved) {
			teamRows = buildRows(savedTeamNames, fmsTeams);
		} else {
			const rows = [...teamRows];
			for (const t of fmsTeams) {
				const row = rows.find((r) => Number(r.number) === t.number);
				if (row) Object.assign(row, { fmsName: t.name, manual: false });
				else rows.push({ number: String(t.number), fmsName: t.name, name: "", designation: "", manual: false });
			}
			teamRows = rows.sort((a, b) => Number(a.number) - Number(b.number));
		}
		prevSaved = saved;
		prevFms = fms;
	}

	// A blue ring marks art uploaded for this event on avatars.frc.tools.
	$: eventAvatar = (n: string) => $avatarState.eventTeams.has(Number(n));

	// FMS avatar for the row's team. The Avatar component upgrades it to the
	// avatar-store upload for the active event, so the row shows exactly what
	// the display will.
	function fmsAvatar(n: string): string | undefined {
		const number = Number(n);
		return (
			$state.ranking.find((t) => t.number === number)?.avatar ||
			$state.rankData.find((t) => t.teamNumber === number)?.avatar ||
			undefined
		);
	}

	function addTeamRow() {
		teamRows = [...teamRows, { number: "", fmsName: null, name: "", designation: "", manual: true }];
	}

	function removeTeamRow(i: number) {
		teamRows = teamRows.filter((_, j) => j !== i);
	}

	function saveTeamNames() {
		sendSetTeamNames(toEntries(teamRows));
	}
	// #endregion

	async function setupFms() {
		busyFms = true;
		fmsMsg = "";
		try {
			const r = await (await fetch("/api/vmix/setup-fms", { method: "POST" })).json();
			fmsMsg = r.ok
				? r.created
					? "Created FMS browser input."
					: "FMS input already present."
				: `Error: ${r.error}`;
			await refresh();
		} catch (e) {
			fmsMsg = `Error: ${e}`;
		}
		busyFms = false;
	}

	async function setupCamera() {
		busyCam = true;
		camMsg = "";
		try {
			const r = await (
				await fetch("/api/vmix/setup-camera", {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({ cameraKey, teamCount }),
				})
			).json();
			camMsg = r.ok
				? `Placed camera: ${r.box.rankRows} rank rows, zoom ${r.layer.zoom.toFixed(3)} @ (${r.layer.x}, ${r.layer.y}) on a ${Math.round(r.canvas.w)}×${Math.round(r.canvas.h)} canvas.`
				: `Error: ${r.error}`;
			await refresh();
		} catch (e) {
			camMsg = `Error: ${e}`;
		}
		busyCam = false;
	}
</script>

<div class="min-h-screen bg-gray-900 text-gray-100 p-8">
	<div class="max-w-3xl mx-auto space-y-8">
		<header class="flex items-center justify-between">
			<h1 class="text-2xl font-bold">Audience Display</h1>
			<div class="flex items-center gap-3">
				<a
					href="/bitfocus"
					class="rounded bg-gray-700 px-4 py-2 font-semibold text-white hover:bg-gray-600"
					>Bitfocus</a
				>
				<a
					href="/display"
					class="rounded bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-500"
					>Open Display</a
				>
			</div>
		</header>

		<section class="rounded-lg bg-gray-800 p-6 space-y-3">
			<h2 class="text-lg font-semibold">Profile</h2>
			<select
				class="w-full rounded bg-gray-700 px-3 py-2 text-white"
				value={$state.activeProfileId ?? DEFAULT_PROFILE_ID}
				on:change={(e) => e.currentTarget.value && sendSelectProfile(e.currentTarget.value)}
			>
				{#each profiles as p}
					<option value={p.id}>{p.name}</option>
				{/each}
			</select>
		</section>

		<section class="rounded-lg bg-gray-800 p-6 space-y-5">
			<div class="flex items-center justify-between">
				<h2 class="text-lg font-semibold">vMix Automation</h2>
				<button
					class="text-sm text-gray-400 hover:text-white"
					on:click={refresh}
					disabled={loadingStatus}>{loadingStatus ? "Checking…" : "Refresh"}</button
				>
			</div>

			<div class="flex flex-wrap items-end gap-3">
				<label class="flex flex-col gap-1 text-sm">
					<span class="text-gray-400">vMix HTTP-API URL</span>
					<input
						type="text"
						bind:value={vmixUrlInput}
						on:input={() => (vmixUrlTouched = true)}
						placeholder="http://127.0.0.1:8088"
						class="w-72 rounded bg-gray-700 px-3 py-2 font-mono text-white"
					/>
				</label>
				<button
					class="rounded bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
					on:click={saveVmixUrl}
					disabled={busyUrl || !vmixUrlInput}>{busyUrl ? "Saving…" : "Save URL"}</button
				>
				{#if urlMsg}<span class="text-sm text-gray-300">{urlMsg}</span>{/if}
			</div>

			{#if status && !status.reachable}
				<p class="rounded bg-red-900/50 px-3 py-2 text-sm text-red-200">
					Can't reach vMix at {status.url || "(configured URL)"}. Make sure vMix is running
					with its web controller enabled. {status.error ?? ""}
				</p>
			{:else if status}
				<p class="text-sm text-gray-400">Connected to vMix at {status.url}.</p>
			{/if}

			<!-- Action 1: FMS browser input -->
			<div class="rounded border border-gray-700 p-4 space-y-3">
				<div>
					<h3 class="font-semibold">1. FMS input</h3>
					<p class="text-sm text-gray-400">
						Adds a Browser input titled <span class="font-mono">FMS</span> pointing at this
						display, for use on an overlay.
					</p>
				</div>
				<div class="flex items-center gap-3">
					<button
						class="rounded bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
						on:click={setupFms}
						disabled={busyFms || !(status && status.reachable)}
						>{busyFms ? "Working…" : "Set up FMS input"}</button
					>
					{#if status?.fmsInput}
						<span class="text-sm text-emerald-400"
							>Present (input {status.fmsInput.number})</span
						>
					{/if}
				</div>
				{#if fmsMsg}<p class="text-sm text-gray-300">{fmsMsg}</p>{/if}
					<div class="rounded bg-amber-950/40 border border-amber-800/50 p-3 text-sm text-amber-100/90">
						<span class="font-semibold">Audio tip:</span> the display plays a 31 Hz sub-bass
						keep-alive tone to unlock audio and stop the broadcast audio from being flagged as
						silent. To keep it off-air, add an audio plugin to the FMS input in vMix (Input →
						Audio Settings → plugins): a
						<span class="font-semibold">high-pass EQ</span> around 50 Hz clears it out with no
						effect on program audio (or a <span class="font-semibold">narrow notch</span> at
						31 Hz), or a <span class="font-semibold">noise gate</span> if it is intermittent. vMix can only
						enable a plugin via its API, not add/tune one, so set it up here once; then it can be
						toggled with <span class="font-mono">AudioPluginOn</span>.
					</div>
			</div>

			<!-- Action 2: alliance-selection camera composite -->
			<div class="rounded border border-gray-700 p-4 space-y-3">
				<div>
					<h3 class="font-semibold">2. Alliance-selection camera</h3>
					<p class="text-sm text-gray-400">
						Builds a separate composite input with your camera positioned into the
						alliance-selection cut-out, with the FMS display on top.
					</p>
				</div>
				<div class="flex flex-wrap items-end gap-4">
					<label class="flex flex-col gap-1 text-sm">
						<span class="text-gray-400">Camera input</span>
						<select
							bind:value={cameraKey}
							class="min-w-[220px] rounded bg-gray-700 px-3 py-2 text-white"
							disabled={!(status && status.reachable)}
						>
							{#each status?.inputs ?? [] as inp (inp.key)}
								<option value={inp.key}>{inp.number}. {inp.title} ({inp.type})</option>
							{/each}
						</select>
					</label>
					<label class="flex flex-col gap-1 text-sm">
						<span class="text-gray-400"># Teams</span>
						<input
							type="number"
							min="1"
							bind:value={teamCount}
							on:input={() => (teamCountTouched = true)}
							class="w-24 rounded bg-gray-700 px-3 py-2 text-white"
						/>
					</label>
					<button
						class="rounded bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
						on:click={setupCamera}
						disabled={busyCam || !cameraKey || !(status && status.reachable)}
						>{busyCam ? "Working…" : "Set up alliance camera"}</button
					>
				</div>
				<p class="text-xs text-gray-500">
					Detected {$state.ranking.length} team{$state.ranking.length === 1 ? "" : "s"} from
					FMS. {$state.ranking.length ? "" : "Enter the count manually if the roster isn't loaded yet."}
				</p>
				{#if camMsg}<p class="text-sm text-gray-300">{camMsg}</p>{/if}
			</div>
		</section>

		<section class="rounded-lg bg-gray-800 p-6 space-y-4">
			<h2 class="text-lg font-semibold">Playoff Bracket</h2>
			<div class="flex flex-wrap items-end gap-3">
				<label class="flex flex-col gap-1 text-sm">
					<span class="text-gray-400">Real alliances</span>
					<select
						bind:value={realAlliances}
						on:change={() => (realAlliancesTouched = true)}
						class="w-36 rounded bg-gray-700 px-3 py-2 text-white"
					>
						{#each [8, 7, 6, 5, 4, 3, 2] as n}
							<option value={n}>{n}{n === 8 ? " (normal)" : ""}</option>
						{/each}
					</select>
				</label>
				<button
					class="rounded bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
					on:click={saveRealAlliances}
					disabled={busyAlliances}>{busyAlliances ? "Saving…" : "Save"}</button
				>
				{#if allianceMsg}<span class="text-sm text-gray-300">{allianceMsg}</span>{/if}
			</div>
			{#if $state.bracket}
				<div class="overflow-hidden rounded bg-background" bind:clientWidth={previewWidth} style="height: {STAGE_H * previewScale}px">
					<div class="origin-top-left" style="width: {STAGE_W}px; height: {STAGE_H}px; transform: scale({previewScale})">
						<BracketGrid bracket={$state.bracket} {realAlliances} showSeries={false} />
					</div>
				</div>
			{/if}
		</section>

		<section class="rounded-lg bg-gray-800 p-6 space-y-4">
			<div class="flex items-baseline justify-between gap-4">
				<h2 class="text-lg font-semibold">Team Names</h2>
				<span class="text-sm text-gray-400 truncate">{$activeProfile.name}</span>
			</div>
			<p class="text-sm text-gray-400">
				{fmsCount ? `${fmsCount} teams from FMS` : "No teams from FMS yet"}
			</p>
			{#if teamRows.length}
				<div class="hidden sm:grid grid-cols-[3rem_6rem_minmax(0,1fr)_9rem_2rem] items-center gap-3 text-sm text-gray-400">
					<span></span>
					<span>Team</span>
					<span>Name</span>
					<span>Designation</span>
					<span></span>
				</div>
			{/if}
			<div class="max-h-[30rem] overflow-y-auto space-y-3 pr-1">
			{#each teamRows as row, i}
				<!-- Phone: designation drops to a second line under the name. -->
				<div class="grid grid-cols-[2.5rem_4rem_minmax(0,1fr)_1.5rem] sm:grid-cols-[3rem_6rem_minmax(0,1fr)_9rem_2rem] items-center gap-x-2 sm:gap-x-3 gap-y-2">
					{#key row.number}
						<Avatar
							avatar={fmsAvatar(row.number)}
							team={Number(row.number) > 0 ? Number(row.number) : undefined}
							alt="{row.number} avatar"
							class="size-10 sm:size-12 rounded bg-gray-700 {eventAvatar(row.number) ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-gray-800' : ''}"
						/>
					{/key}
					{#if row.manual}
						<input
							type="number"
							min="1"
							bind:value={row.number}
							aria-label="Team number"
							placeholder="Team"
							class="min-w-0 rounded bg-gray-700 px-3 py-2 text-white tabular-nums"
						/>
					{:else}
						<span class="sm:px-3 py-2 font-semibold tabular-nums">{row.number}</span>
					{/if}
					<input
						type="text"
						bind:value={row.name}
						aria-label="Team name"
						placeholder={row.fmsName ?? "Name"}
						class="min-w-0 rounded px-3 py-2 text-white bg-gray-700 placeholder:text-gray-400"
					/>
					<input
						type="text"
						bind:value={row.designation}
						aria-label="Designation"
						placeholder="Designation"
						class="min-w-0 rounded px-3 py-2 text-white bg-gray-700 placeholder:text-gray-500 col-start-2 col-span-2 row-start-2 sm:col-auto sm:col-span-1 sm:row-start-auto"
					/>
					<div class="justify-self-end">
						{#if row.manual}
							<button
								class="text-gray-400 hover:text-white text-2xl leading-none px-1"
								aria-label="Remove team {row.number}"
								on:click={() => removeTeamRow(i)}>&times;</button
							>
						{/if}
					</div>
				</div>
			{/each}
			</div>
			<div class="flex justify-end gap-3">
				<button
					class="rounded bg-gray-700 px-4 py-2 font-semibold text-white hover:bg-gray-600"
					on:click={addTeamRow}>Add</button
				>
				<button
					class="rounded bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
					on:click={saveTeamNames}
					disabled={!teamNamesDirty}>Save</button
				>
			</div>
		</section>



	</div>
</div>
