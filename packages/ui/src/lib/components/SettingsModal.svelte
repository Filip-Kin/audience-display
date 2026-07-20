<script lang="ts">
	import { get } from "svelte/store";
	import { playSound, volumes, SOUND_DEFS, type VolumeKey } from "../audio";
	import { settings } from "../settings"; // adjust if path is different
	import { state, activeProfile, sendSelectProfile, sendSetFmsLogging } from "../state";
	import { packUrl } from "../animation_pack";
	import { listProfiles, DEFAULT_PROFILE_ID } from "../../profiles";

	export let settingsOpen: boolean;

	const profiles = listProfiles();

	const VOLUME_ROWS: { key: VolumeKey; label: string }[] = [
		...SOUND_DEFS.map((d) => ({ key: d.key as VolumeKey, label: d.label })),
		{ key: "victoryVideo", label: "Winner Animation" },
	];

	function handleProfileChange(e: Event) {
		const target = e.target as HTMLSelectElement;
		if (target.value) sendSelectProfile(target.value);
	}

	function setVolume(key: VolumeKey, e: Event) {
		const value = Number((e.target as HTMLInputElement).value) / 100;
		volumes.update((v) => ({ ...v, [key]: value }));
	}

	function handleLoggingChange(e: Event) {
		sendSetFmsLogging((e.target as HTMLInputElement).checked);
	}

	// Volume test for the winner animation: play the active profile's victory
	// video audio track (audio only) at the slider volume.
	let victoryPreview: HTMLAudioElement | null = null;
	function playVictoryPreview() {
		victoryPreview?.pause();
		victoryPreview = new Audio(packUrl(get(activeProfile), "victoryRed"));
		victoryPreview.volume = get(volumes).victoryVideo;
		victoryPreview.play().catch(() => {});
	}

	$: if (!settingsOpen && victoryPreview) {
		victoryPreview.pause();
		victoryPreview = null;
	}
</script>

{#if settingsOpen}
	<div class="absolute top-0 left-0 w-full h-full bg-gray-900/50 z-10">
		<div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg p-6 text-black w-2xl max-h-[90vh] overflow-y-auto">
			<h2 class="text-xl font-bold mb-4">Settings</h2>

			<div class="grid grid-cols-1 gap-6">
				<div class="flex flex-col gap-2 p-4 bg-gray-100 rounded">
					<span class="font-semibold">Profile</span>
					<select
						class="bg-white border border-gray-300 rounded px-2 py-1"
						value={$state.activeProfileId ?? DEFAULT_PROFILE_ID}
						on:change={handleProfileChange}
					>
						{#each profiles as p}
							<option value={p.id}>{p.name}</option>
						{/each}
					</select>
				</div>

				<label class="flex items-center justify-between">
					<span>Invert Scoring Bar</span>
					<label class="relative inline-flex items-center cursor-pointer">
						<input type="checkbox" bind:checked={$settings.invert} class="sr-only peer" />
						<div
							class="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:bg-blue-600 transition-colors"
						></div>
						<div class="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
					</label>
				</label>

				<label class="flex items-center justify-between">
					<span>Scoring Bar on Top</span>
					<label class="relative inline-flex items-center cursor-pointer">
						<input type="checkbox" bind:checked={$settings.top} class="sr-only peer" />
						<div
							class="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:bg-blue-600 transition-colors"
						></div>
						<div class="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
					</label>
				</label>

				<label class="flex items-center justify-between">
					<span>Match Ready Sound</span>
					<label class="relative inline-flex items-center cursor-pointer">
						<input type="checkbox" bind:checked={$settings.matchReadySound} class="sr-only peer" />
						<div
							class="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:bg-blue-600 transition-colors"
						></div>
						<div class="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
					</label>
				</label>

				<label class="flex items-center justify-between gap-4">
					<div class="flex flex-col gap-1">
						<span>Transition to Waiting Screen</span>
						<span>After Match End (-1 to disable)</span>
					</div>
					<input type="number" bind:value={$settings.transitionAfterMatchEnd} class="bg-gray-100 border border-gray-800 px-2 w-16" />
				</label>

				<label class="flex items-center justify-between">
					<div class="flex flex-col">
						<span>FMS Traffic Logging</span>
						<span class="text-sm text-gray-500">Record all FMS communication for reverse engineering</span>
					</div>
					<label class="relative inline-flex items-center cursor-pointer">
						<input type="checkbox" checked={$state.fmsLogging} on:change={handleLoggingChange} class="sr-only peer" />
						<div
							class="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:bg-blue-600 transition-colors"
						></div>
						<div class="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
					</label>
				</label>

				<div class="flex flex-col gap-2 p-4 bg-gray-100 rounded">
					<span class="font-semibold">Volumes</span>
					{#each VOLUME_ROWS as row (row.key)}
						<label class="grid grid-cols-[10rem_1fr_3rem_3.5rem] items-center gap-2">
							<span class="text-sm">{row.label}</span>
							<input
								type="range"
								min="0"
								max="100"
								value={Math.round(($volumes[row.key] ?? 1) * 100)}
								on:input={(e) => setVolume(row.key, e)}
								class="w-full accent-blue-600"
							/>
							<span class="text-sm tabular-nums text-right">{Math.round(($volumes[row.key] ?? 1) * 100)}%</span>
							<button
								class="bg-blue-500 text-white rounded px-2 py-0.5 text-sm"
								on:click={() => (row.key === "victoryVideo" ? playVictoryPreview() : playSound(row.key))}
							>
								Play
							</button>
						</label>
					{/each}
				</div>
			</div>

			<button class="mt-6 bg-blue-500 text-white rounded px-4 py-2 w-full" on:click={() => (settingsOpen = false)}> Close </button>
		</div>
	</div>
{/if}
