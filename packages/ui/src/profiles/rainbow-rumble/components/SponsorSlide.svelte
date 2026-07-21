<script lang="ts">
	import type { SponsorLogo } from "lib";

	export let sponsor: SponsorLogo;
</script>

<div class="w-full h-full flex items-center justify-center p-12">
	<img
		src={sponsor.src}
		alt="Sponsor"
		class="object-contain {sponsor.light
			? 'max-w-[78%] max-h-[78%] bg-white rounded-2xl p-6'
			: 'max-w-[70%] max-h-[70%]'}"
	/>
</div>
