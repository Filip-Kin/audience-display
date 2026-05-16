<script lang="ts">
	export let label: string;
	export let current: number;
	export let threshold: number;
	export let achieved: boolean;

	$: pct = threshold > 0 ? Math.min(100, (current / threshold) * 100) : 0;
</script>

<div class="flex items-center gap-2 text-xs">
	<span class="w-24 text-right uppercase tracking-wider opacity-80">{label}</span>
	<div class="relative grow h-3 bg-black/40 rounded-full overflow-hidden">
		<div
			class="absolute inset-y-0 left-0 transition-[width] duration-300 {achieved
				? 'bg-accentWarn'
				: 'bg-white/70'}"
			style="width: {pct}%"
		></div>
	</div>
	<span class="w-16 text-left tabular-nums">{current}/{threshold}</span>
</div>
