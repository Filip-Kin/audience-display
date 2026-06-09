<script lang="ts">
	export let eventLabel: string = "";
	export let matchLabel: string = "";
</script>

<div class="bg-black rounded px-12 py-4 text-center">
	<div style="font-size: 28px; letter-spacing: 0.03em; color: white; font-weight: 400; line-height: 1.2;">
		{eventLabel}
	</div>
	<div class="display text-accentWarn font-bold" style="font-size: 46px; line-height: 1.1; margin-top: 4px;">
		{matchLabel}
	</div>
</div>
