<script lang="ts">
	import type { SponsorLogo } from "lib";

	export let sponsor: SponsorLogo;
</script>

<!-- w-full/h-full (not max-*) so small source images upscale to fill the box. -->
<div class="w-full h-full flex items-center justify-center p-12">
	{#if sponsor.light}
		<div class="w-full h-full bg-white rounded-2xl p-6 flex items-center justify-center">
			<img src={sponsor.src} alt="Sponsor" class="w-full h-full object-contain" />
		</div>
	{:else}
		<img src={sponsor.src} alt="Sponsor" class="w-full h-full object-contain" />
	{/if}
</div>
