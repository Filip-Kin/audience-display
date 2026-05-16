<script lang="ts">
	import { activeProfile } from "./state";

	export let alt = "Logo";
	let className = "";
	export { className as class };
	export let style = "";

	$: src = $activeProfile.assets.logo ?? "/logo.png";
</script>

<img {src} {alt} class={className} {style} />
