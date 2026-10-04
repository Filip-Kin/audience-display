<script lang="ts">
	/** Match-name segments from matchNameParts(); one per line. */
	export let matchParts: string[] = [];
	/** Match-name font size. */
	export let size: string = "56px";
</script>

<!-- Goonettes take on the stock black match-title box: a rounded night-purple
     card with the white rim, the event lockup on top and the match name in
     lavender. Sized by its content; no measuring. -->
<div
	class="rounded-[var(--goon-r)] border-solid border-white border-[length:var(--goon-rim)] px-12 pt-3 pb-4 text-center shadow-[0_12px_36px_oklch(0_0_0/0.55)]"
	style="background: radial-gradient(120% 140% at 50% 0%, oklch(0.30 0.132 318), oklch(0.13 0.035 305) 70%);"
>
	<div class="flex items-baseline justify-center gap-2 leading-none whitespace-nowrap">
		<span class="goon-display uppercase text-[30px] text-white tracking-[0.03em]">Goonettes</span>
		<span class="goon-brush text-[32px] text-accent">invitational</span>
	</div>
	<div class="goon-display text-matchLabel leading-[1.05] mt-2" style="font-size: {size}; white-space: pre-line;">
		{#each matchParts as part}
			<div>{part}</div>
		{/each}
	</div>
</div>
