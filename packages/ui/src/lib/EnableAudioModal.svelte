<script lang="ts">
	export let onUnlock: () => void;
</script>

<div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
	<div class="bg-white rounded-xl shadow-lg p-6 text-center text-black">
		<h2 class="text-xl font-bold mb-4">Browser is blocking sound</h2>
		<p class="mb-4">Click below to allow sound.</p>
		<button class="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition" on:click={onUnlock}> Enable Audio </button>
	</div>
</div>
