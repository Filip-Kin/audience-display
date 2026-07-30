<script lang="ts">
	import { onMount } from "svelte";
	import { state } from "@lib/state";

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

	async function refresh() {
		loadingStatus = true;
		try {
			status = await (await fetch("/api/vmix/status")).json();
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

	onMount(refresh);

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

<div class="min-h-full bg-gray-900 text-gray-100 p-8">
	<div class="max-w-3xl mx-auto space-y-8">
		<header class="flex items-center justify-between">
			<h1 class="text-2xl font-bold">Audience Display</h1>
			<a
				href="/display"
				class="rounded bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-500"
				>Open Display</a
			>
		</header>

		<section class="rounded-lg bg-gray-800 p-6 space-y-5">
			<div class="flex items-center justify-between">
				<h2 class="text-lg font-semibold">vMix Automation</h2>
				<button
					class="text-sm text-gray-400 hover:text-white"
					on:click={refresh}
					disabled={loadingStatus}>{loadingStatus ? "Checking…" : "Refresh"}</button
				>
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
	</div>
</div>
