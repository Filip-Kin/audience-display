<script lang="ts">
	import { state } from "../../lib/state";
	import logo from "../../assets/rr-logo.png";
	import { createEventDispatcher, onMount } from "svelte";
	import { spring, tweened } from "svelte/motion";
	import { matchName } from "../../lib/matchNamer";
	import { settings } from "../../lib/settings";

	let positionSpring = spring(-400, {
		stiffness: 0.1,
		damping: 0.3,
	});

	let wingSpring = spring(0, {
		stiffness: 0.01,
		damping: 0.4,
	});

	let opacityTween = tweened(0, {
		duration: 500,
	});

	const dispatcher = createEventDispatcher();
	let ready = false;
	export let exit = false;

	$: if (exit) {
		positionSpring.set(-400);
		wingSpring.set(0);
		opacityTween.set(0);
		setTimeout(() => {
			dispatcher("transitioned");
		}, 500);
	}

	onMount(() => {
		positionSpring.set(32);
		setTimeout(() => {
			wingSpring.set(100);
		}, 500);
		setTimeout(() => {
			opacityTween.set(1);
		}, 1200);
	});

	const secondsToMinutes = (seconds: number) => {
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
	};
</script>

{#if $state.match}
	<!-- Top bar with event name and match number -->
	<div class="fixed bg-gray-700 h-16 text-white flex justify-between mx-[15vw] w-[70vw]" style={`${$settings.top ? "bottom" : "top"}: ${$positionSpring}px`}>
		<span><!-- <img src="/sponsor.png" class="size-16" alt="sponsor" /> --></span>
		<div class="flex justify-center items-center">
			<div class="text-2xl font-bold text-center">
				{$state.eventDetails?.name || "Event Name"} - {matchName(
					$state.match.details.matchNumber,
					$state.eventDetails?.matchCount ?? 0,
					$state.match.details.matchType
				)}
			</div>
		</div>
		<span><!-- <img src="/pitpodcast.png" class="size-16" alt="sponsor" /> --></span>
	</div>

	<div
		class="fixed w-full flex items-stretch justify-center"
		style={`${$settings.top ? "top" : "bottom"}: ${$positionSpring}px`}
		class:flex-row-reverse={$settings.invert}
	>
		<!-- Red Alliance -->

		<div class="flex flex-row justify-start">
			<div
				class="bg-blue-600 flex flex-row p{$settings.invert ? 'l' : 'r'}-16 -m{$settings.invert ? 'l' : 'r'}-16 rounded-{$settings.invert
					? 'r'
					: 'l'}-xl relative rainbow-shadow"
			>
				<div
					class="flex flex-row z-10 relative"
					style={`max-width: ${$wingSpring / 2}vw; opacity: ${$opacityTween}`}
					class:flex-row-reverse={$settings.invert}
				>
					<div class="flex flex-col justify-center px-3 w-32 text-5xl font-bold text-center">
						{$state.match.score.blue.score}
					</div>

					<div class="flex flex-col justify-center h-full min-w-12">
						{#if $state.match.score.blue.coopertitionMet}
							<div
								class="rounded-full bg-white text-black p-1.5 flex items-center justify-center gap-2 h-fit"
								class:bg-yellow-200={$state.match.score.blue.coopertitionAchieved}
							>
								<img src="/coop.png" alt="coop" class="size-8" />
							</div>
						{/if}
					</div>

					<div class="flex flex-col px-4 text-2xl justify-center text-center text-nowrap min-w-24 gap-2">
						<div
							class="flex justify-between bg-white text-black rounded-full py-2 px-4 items-center gap-3"
							class:flex-row-reverse={$settings.invert}
						>
							<span class="grow text-center mb-1">{$state.match.score.blue.algaeCount}</span>
							<img src="/algea.png" alt="algea" class="size-8" />
						</div>
						<div
							class="flex justify-between bg-white text-black rounded-full py-2 px-4 items-center gap-2"
							class:bg-yellow-200={$state.match.score.blue.coralBonusRP}
							class:flex-row-reverse={$settings.invert}
						>
							<span class="grow text-center mb-1"
								>{$state.match.score.blue.coralBonusProgress} / {$state.match.score.blue.coralBonusThreshold}</span
							>
							<img src="/coral.png" alt="coral" class="size-8" />
						</div>
					</div>

					<div class="flex flex-col justify-center px-3 w-24">
						{#each $state.match.teams.blue as team, index}
							<span class="text-2xl text-center">{team.number}</span>
						{/each}
					</div>
				</div>
			</div>
		</div>

		<!-- Timer -->
		<div class="z-50 w-32 bg-gradient-to-{$settings.invert ? 'r' : 'l'} from-red-600 from-30% to-70% to-blue-600 relative overflow-hidden">
			<div
				class="top-0 my-4 mx-4 w-24 rounded-full aspect-square bg-gradient-to-{$settings.invert
					? 'r'
					: 'l'} from-red-500 from-20% via-[#814589bf] to-80% to-blue-500 absolute z-0 overflow-hidden"
			></div>
			<img src={logo} alt="" style={`transform: rotate(${($wingSpring / 50) * 360}deg)`} />
			<div class="absolute text-white text-5xl font-bold top-0 left-0 w-32 h-32 grid place-items-center">
				{secondsToMinutes($state.match.timer)}
			</div>
		</div>

		<!-- Blue Alliance -->
		<div class="flex flex-row justify-end justify-self-end">
			<div
				class="bg-red-600 p{$settings.invert ? 'r' : 'l'}-16 -m{$settings.invert ? 'r' : 'l'}-16 rounded-{$settings.invert
					? 'l'
					: 'r'}-xl flex flex-row relative rainbow-shadow"
			>
				<div class="flex flex-row" style={`max-width: ${$wingSpring / 2}vw; opacity: ${$opacityTween}`} class:flex-row-reverse={$settings.invert}>
					<div class="flex flex-col justify-center px-3 w-24">
						{#each $state.match.teams.red as team, index}
							<span class="text-2xl text-center text-nowrap">{team.number}</span>
						{/each}
					</div>

					<div class="flex flex-col px-4 text-2xl justify-center text-center text-nowrap min-w-24 gap-2">
						<div
							class="flex justify-between bg-white text-black rounded-full py-2 px-4 items-center gap-3"
							class:flex-row-reverse={$settings.invert}
						>
							<img src="/algea.png" alt="algea" class="size-8" />
							<span class="grow text-center mb-1">{$state.match.score.red.algaeCount}</span>
						</div>
						<div
							class="flex justify-between bg-white text-black rounded-full py-2 px-4 items-center gap-2"
							class:bg-yellow-200={$state.match.score.red.coralBonusRP}
							class:flex-row-reverse={$settings.invert}
						>
							<img src="/coral.png" alt="coral" class="size-8" />
							<span class="grow text-center mb-1">{$state.match.score.red.coralBonusProgress} / {$state.match.score.red.coralBonusThreshold}</span
							>
						</div>
					</div>

					<div class="flex flex-col justify-center h-full min-w-12">
						{#if $state.match.score.red.coopertitionMet}
							<div
								class="rounded-full bg-white text-black p-1.5 flex items-center justify-center gap-2 h-fit"
								class:bg-yellow-200={$state.match.score.red.coopertitionAchieved}
							>
								<img src="/coop.png" alt="coop" class="size-8" />
							</div>
						{/if}
					</div>

					<div class="flex flex-col justify-center px-3 w-32 text-5xl font-bold text-center">
						{$state.match.score.red.score}
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
