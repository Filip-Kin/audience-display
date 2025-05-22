<script lang="ts">
	import { settings } from "../../lib/settings";
	import { state } from "../../lib/state";
	import logo from "../../assets/rr-logo.png";

	export let wingSpring;

	const secondsToMinutes = (seconds: number) => {
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
	};
</script>

{#if $state.match}
	<div class="z-50 w-32 bg-gradient-to-{$settings.invert ? 'l' : 'r'} from-red-600 from-30% to-70% to-blue-600 relative overflow-hidden">
		<div
			class="top-0 my-4 mx-4 w-24 rounded-full aspect-square bg-gradient-to-{$settings.invert
				? 'l'
				: 'r'} from-red-500 from-20% via-[#814589bf] to-80% to-blue-500 absolute z-0 overflow-hidden"
		></div>
		<img src={logo} alt="" style={`transform: rotate(${($wingSpring / 50) * 360}deg)`} />
		<div class="absolute text-white text-5xl font-bold top-0 left-0 w-32 h-32 grid place-items-center drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
			{secondsToMinutes($state.match.timer)}
		</div>
	</div>
{/if}
