<script lang="ts">
	// The FMS wizard's break timer runs BEFORE alliance selection starts, so this
	// screen is just the standard rankings display with the break countdown
	// ("Starts In") in the header. The clock ticks over the wire as
	// AllianceSelectionTimer into match.timer.
	import Rankings from "../rankings/Rankings.svelte";

	export let exit = false;
</script>

<Rankings {exit} on:transitioned title="ALLIANCE SELECTION" showBreakTimer />
