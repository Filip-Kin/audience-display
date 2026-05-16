<script lang="ts">
	export let size: number = 24;
	export let dir: "left" | "right" | "up" | "down" = "right";
	let className = "";
	export { className as class };

	$: rotation = dir === "left" ? 180 : dir === "down" ? 90 : dir === "up" ? -90 : 0;
</script>

<svg
	viewBox="0 0 24 24"
	width={size}
	height={size}
	class={className}
	aria-hidden="true"
	fill="none"
	stroke="currentColor"
	stroke-width="3"
	stroke-linecap="round"
	stroke-linejoin="round"
	style="transform: rotate({rotation}deg)"
>
	<path d="m9 6 6 6-6 6" />
</svg>
