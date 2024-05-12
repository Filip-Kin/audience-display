<script lang="ts">
    import { state } from "../../lib/state";
    import logo from "../../assets/rr-logo.png";
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
    <div
        class="fixed w-full grid grid-cols-realtimeScores"
        style={`bottom: ${$positionSpring}px`}
    >
        <div class="flex flex-row justify-end justify-self-end">
            <div
                class="bg-red-600 pr-16 -mr-16 rounded-l-xl flex flex-row relative rainbow-shadow"
                class:amplified={$state.match.score.red.amplified}
            >
                <div
                    class="flex flex-row"
                    style={`max-width: ${$wingSpring / 2}vw; opacity: ${$opacityTween}`}
                >
                    <div
                        class="flex flex-col justify-center px-3 w-32 text-5xl font-bold text-center"
                    >
                        {$state.match.score.red.score}
                    </div>
                    <div
                        class="flex flex-col px-4 text-3xl justify-center text-center text-nowrap min-w-36"
                    >
                        <div class="text-5xl text-center">♫</div>
                        {$state.match.score.red.noteCount} / {$state.match.score
                            .red.noteRequirement}
                    </div>
                    <div class="flex flex-col justify-center px-3 w-24">
                        {#each $state.match.teams.red as team, index}
                            <span class="text-2xl text-center text-nowrap"
                                >{team.number}</span
                            >
                        {/each}
                    </div>
                </div>
            </div>
        </div>
        <div
            class="z-50 w-32 bg-gradient-to-r from-red-600 from-30% to-70% to-blue-600 relative overflow-hidden"
        >
            <div
                class="top-0 my-4 mx-4 w-24 rounded-full aspect-square bg-gradient-to-r from-red-500 from-20% via-[#814589bf] to-80% to-blue-500 absolute z-0 overflow-hidden"
            ></div>
            <img
                src={logo}
                alt=""
                style={`transform: rotate(${($wingSpring / 50) * 360}deg)`}
            />
            <div
                class="absolute text-white text-5xl font-bold top-0 left-0 w-32 h-32 grid place-items-center"
            >
                {secondsToMinutes($state.match.timer)}
            </div>
        </div>
        <div class="flex flex-row justify-start">
            <div
                class="bg-blue-600 flex flex-row pl-16 -ml-16 rounded-r-xl relative rainbow-shadow"
                class:amplified={$state.match.score.blue.amplified}
            >
                <div
                    class="flex flex-row z-10 relative"
                    style={`max-width: ${$wingSpring / 2}vw; opacity: ${$opacityTween}`}
                >
                    <div class="flex flex-col justify-center px-3 w-24">
                        {#each $state.match.teams.blue as team, index}
                            <span class="text-2xl text-center"
                                >{team.number}</span
                            >
                        {/each}
                    </div>
                    <div
                        class="flex flex-col px-4 text-3xl justify-center text-center text-nowrap min-w-36"
                    >
                        <div class="text-5xl text-center">♫</div>
                        {$state.match.score.blue.noteCount.toString()} / {$state.match.score.blue.noteRequirement.toString()}
                    </div>
                    <div
                        class="flex flex-col justify-center px-3 w-32 text-5xl font-bold text-center"
                    >
                        {$state.match.score.blue.score}
                    </div>
                </div>
            </div>
        </div>
    </div>
{/if}
