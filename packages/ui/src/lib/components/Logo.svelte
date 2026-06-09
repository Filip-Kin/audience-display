<script lang="ts">
	import { activeProfile } from "../state";

	export let alt = "Logo";
	let className = "";
	export { className as class };
	export let style = "";
    export let type: "event" | "livestream" = "event";

    $: src = $activeProfile.assets[type] ?? "/logo.png";
</script>

<img {src} {alt} class={className} {style} />
