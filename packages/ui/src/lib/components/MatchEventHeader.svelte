<script lang="ts">
	export let eventLabel: string = "";
	export let matchLabel: string = "";
</script>

<div class="bg-black rounded px-12 py-4 text-center">
	<div class="text-[28px] tracking-[0.03em] text-white font-normal leading-[1.2]">
		{eventLabel}
	</div>
	<div class="display text-accentWarn font-bold text-[46px] leading-[1.1] mt-1">
		{matchLabel}
	</div>
</div>
