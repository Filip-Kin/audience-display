<script lang="ts">
	import { state } from "../../lib/state";
	import { createEventDispatcher, onMount } from "svelte";
	import { spring, tweened } from "svelte/motion";

	let positionSpring = spring(-400, {
		stiffness: 0.1,
		damping: 0.3,
	});

	let wingSpring = spring(0, {
		stiffness: 0.01,
		damping: 0.4,
	});

	let logoSpring = spring(0, {
		stiffness: 0.01,
		damping: 0.3,
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
		logoSpring.set(0);
		setTimeout(() => {
			dispatcher("transitioned");
		}, 500);
	}

	onMount(() => {
		logoSpring.set(0);
		positionSpring.set(32);
		setTimeout(() => {
			wingSpring.set(100);
			logoSpring.set(100);
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
	<div class="w-screen h-screen flex justify-center items-end">
		<img
			src="/logo.png"
			alt=""
			class="size-32 z-50"
			style={`transform: translateY(calc(${($logoSpring / 100) * 50}vh - 100px - 50vh)) scale(${420 - ($logoSpring / 100) * 300}%)`}
		/>
	</div>
	<div class="fixed w-full grid grid-cols-realtimeScores" style={`bottom: ${$positionSpring}px`}>
		<div class="flex flex-row justify-end justify-self-end">
			<div class="bg-primary-700 pr-16 -mr-16 rounded-l-xl flex flex-row relative">
				<div class="flex flex-row" style={`max-width: ${$wingSpring / 2}vw; opacity: ${$opacityTween}`}>
					<div class="flex flex-col px-4 text-2xl justify-center text-center text-nowrap min-w-24 gap-2 my-2">
						<div class="flex justify-between bg-white text-black rounded-full py-1 px-4 items-center gap-3">
							<span class="grow text-center mb-1">{$state.match.score.red.algaeCount}</span>
							<img src="/algea.png" alt="algea" class="size-8" />
						</div>
						<div
							class="flex justify-between bg-white text-black rounded-full py-1 px-4 items-center gap-2"
							class:bg-yellow-200={$state.match.score.red.coralBonusRP}
						>
							<span class="grow text-center mb-1">{$state.match.score.red.coralBonusProgress} / {$state.match.score.red.coralBonusThreshold}</span
							>
							<img src="/coral.png" alt="coral" class="size-8" />
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

					<div class="flex flex-col justify-center px-3 w-24">
						{#each $state.match.teams.red as team, index}
							<span class="text-2xl text-center text-nowrap">{team.number}</span>
						{/each}
					</div>

					<div class="flex flex-col justify-center px-3 w-32 text-5xl font-bold text-center bg-red-600">
						{$state.match.score.red.score}
					</div>
				</div>
			</div>
		</div>
		<div class="z-50 w-32 relative bg-white" style={` opacity: ${$opacityTween}`}>
			<div class="top-0 my-4 mx-4 w-24 rounded-full aspect-square absolute z-0 overflow-hidden"></div>
			<div class="absolute text-black text-5xl font-bold top-0 left-0 w-32 h-32 grid place-items-center">
				{secondsToMinutes($state.match.timer)}
			</div>
		</div>
		<div class="flex flex-row justify-start">
			<div class="bg-primary-700 flex flex-row pl-16 -ml-16 rounded-r-xl relative">
				<div class="flex flex-row z-10 relative" style={`max-width: ${$wingSpring / 2}vw; opacity: ${$opacityTween}`}>
					<div class="flex flex-col justify-center px-3 w-32 text-5xl font-bold text-center bg-blue-600">
						{$state.match.score.blue.score}
					</div>

					<div class="flex flex-col justify-center px-3 w-24">
						{#each $state.match.teams.blue as team, index}
							<span class="text-2xl text-center">{team.number}</span>
						{/each}
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

					<div class="flex flex-col px-4 text-2xl justify-center text-center text-nowrap min-w-24 gap-2 my-2">
						<div class="flex justify-between bg-white text-black rounded-full py-1 px-4 items-center gap-3">
							<img src="/algea.png" alt="algea" class="size-8" />
							<span class="grow text-center mb-1">{$state.match.score.blue.algaeCount}</span>
						</div>
						<div
							class="flex justify-between bg-white text-black rounded-full py-1 px-4 items-center gap-2"
							class:bg-yellow-200={$state.match.score.blue.coralBonusRP}
						>
							<img src="/coral.png" alt="coral" class="size-8" />
							<span class="grow text-center mb-1"
								>{$state.match.score.blue.coralBonusProgress} / {$state.match.score.blue.coralBonusThreshold}</span
							>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
