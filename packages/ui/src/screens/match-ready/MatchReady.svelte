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
                class="bg-red-600 pr-16 -mr-16 rounded-l-xl overflow-hidden flex flex-row"
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
                        class="flex flex-col px-4 text-3xl justify-center text-nowrap"
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
        <div class="w-32 bg-white rounded-full relative overflow-hidden">
            <img
                src={logo}
                alt=""
                style={`transform: rotate(${($wingSpring / 50) * 360}deg)`}
            />
            <div
                class="absolute text-black text-5xl font-bold top-0 left-0 w-32 h-32 grid place-items-center"
            >
                {secondsToMinutes($state.match.timer)}
            </div>
        </div>
        <div class="flex flex-row justify-start">
            <div
                class="bg-blue-600 flex flex-row pl-16 -ml-16 rounded-r-xl overflow-hidden"
            >
                <div
                    class="flex flex-row"
                    style={`max-width: ${$wingSpring / 2}vw; opacity: ${$opacityTween}`}
                >
                    <div class="flex flex-col justify-center px-3 w-24">
                        {#each $state.match.teams.red as team, index}
                            <span class="text-2xl text-center"
                                >{team.number}</span
                            >
                        {/each}
                    </div>
                    <div
                        class="flex flex-col px-4 text-3xl justify-center text-nowrap"
                    >
                        <div class="text-5xl text-center">♫</div>
                        {$state.match.score.red.noteCount} / {$state.match.score
                            .red.noteRequirement}
                    </div>
                    <div
                        class="flex flex-col justify-center px-3 w-32 text-5xl font-bold text-center"
                    >
                        {$state.match.score.red.score}
                    </div>
                </div>
            </div>
        </div>
    </div>
{/if}
