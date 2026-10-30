<script lang="ts">
	import { activeProfile } from "../state";

	export let alt = "Logo";
	let className = "";
	export { className as class };
	export let style = "";
    export let type: "event" | "large" | "livestream" = "event";

    // No fallback: there is no /logo.png in packages/ui/public/, so falling back
    // to it painted a broken image on every profile with no livestream partner
    // (four of the five 2026 offseason profiles). A profile that does not set
    // the asset renders nothing at all instead.
    $: assets = $activeProfile.assets;
    $: src = type === "large" ? assets.eventLarge ?? assets.event : assets[type];
</script>

{#if src}
	<img {src} {alt} class={className} {style} />
{/if}
