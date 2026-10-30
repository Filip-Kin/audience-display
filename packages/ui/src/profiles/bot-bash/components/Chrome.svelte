<script lang="ts">
	import type { ComponentType } from "svelte";
	import Front from "./Front.svelte";

	/** The default screen this wraps (see spooky() in wrap.ts). */
	export let screen: ComponentType;
	export let variant: "page" | "shutter" = "page";
	export let exit = false;
</script>

{#if variant === "page"}
	<div class="bb-backdrop" aria-hidden="true">
		<div class="bb-moon"></div>
		<div class="bb-fog bb-fog-a"></div>
		<div class="bb-fog bb-fog-b"></div>
		<svg class="bb-grave" viewBox="0 0 1920 200" preserveAspectRatio="none">
			<path d="M0 200V128C240 92 420 150 700 124s500-60 760-22 340 44 460 18v80z" />
			<path d="M180 136v-44q0-22 24-22t24 22v44zM288 142v-30h-16v-14h16V84h14v14h16v14h-16v30zM1548 122V84q0-20 22-20t22 20v38zM1668 128V96h-16V82h16V68h14v14h16v14h-16v32z" />
		</svg>
	</div>
	<Front />
{/if}

<svelte:component this={screen} {exit} on:transitioned on:loaded />

<!-- A shutter would hide anything behind it, and these stay clear of its data. -->
{#if variant === "shutter"}
	<Front {exit} />
{/if}

