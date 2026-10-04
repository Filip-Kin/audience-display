<script lang="ts">
	import type { ComponentType } from "svelte";

	/** The default screen this wraps (see chrome() in wrap.ts). */
	export let screen: ComponentType;
	export let exit = false;
</script>

<!-- Zero-size wrapper: the default screens are position:fixed, so this div only
     supplies the .goon fonts/tokens and the .goon-chrome restyle (goon.css). -->
<div class="goon goon-chrome">
	<svelte:component this={screen} {exit} on:transitioned on:loaded />
</div>
