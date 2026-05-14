<script lang="ts">
	import { state } from "./state";

	export let alt = "Logo";
	let className = "";
	export { className as class };
	export let style = "";

	$: configLogo = $state.eventConfig?.assets.logo;
	$: activeName = $state.activeConfigName;
	$: src = configLogo && activeName
		? `/configs/${activeName}/${configLogo}`
		: "/logo.png";
</script>

<img {src} {alt} class={className} {style} />
