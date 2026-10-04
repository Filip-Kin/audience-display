<script lang="ts">
	/** Text to render; every digit gets a fixed-width cell (goon.css .goon-digit). */
	export let value: string | number;
	$: chars = String(value).split("");
</script>

<span class="whitespace-nowrap">{#each chars as c}{#if c >= "0" && c <= "9"}<span class="goon-digit">{c}</span>{:else if c === "/"}<span class="goon-digit-slash">{c}</span>{:else}<span class="goon-digit-sep">{c}</span>{/if}{/each}</span>
