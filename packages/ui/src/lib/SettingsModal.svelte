<script lang="ts">
	import { settings } from "./settings"; // adjust if path is different
	import { get } from "svelte/store";

	export let settingsOpen: boolean;

	// Get writable access
	let currentSettings = $settings;

	function toggleSetting(key: keyof typeof currentSettings) {
		settings.update((s) => ({ ...s, [key]: !s[key] }));
	}
</script>

{#if settingsOpen}
	<div class="absolute top-0 left-0 w-full h-full bg-gray-900/50 z-10">
		<div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg p-6 text-black w-[300px]">
			<h2 class="text-xl font-bold mb-4">Settings</h2>

			<div class="grid grid-cols-1 gap-6">
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
			</div>

			<button class="mt-6 bg-blue-500 text-white rounded px-4 py-2 w-full" on:click={() => (settingsOpen = false)}> Close </button>
		</div>
	</div>
{/if}
