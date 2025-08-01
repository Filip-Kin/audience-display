<script lang="ts">
  import { spring } from "svelte/motion";
  import { fade, fly } from "svelte/transition";
  import { state } from "../../lib/state";
  import { createEventDispatcher, onMount } from "svelte";
  import { matchName } from "../../lib/matchNamer";
  import { settings } from "../../lib/settings";
  import TeamCard from "../../lib/TeamCard.svelte";
  import RankingPoints from "./RankingPoints.svelte";

  let ready = false;
  const dispatcher = createEventDispatcher();
  export let exit = false;

  let animation: string;
  let videoElm: HTMLVideoElement;

  let shutterSpring = spring(120, {
    stiffness: 0.1,
    damping: 0.5,
  });

  onMount(() => {
    if ($state.results?.score.winner) {
      switch ($state.results?.score.winner) {
        case "Red":
          animation = "/animations/redwins.mp4";
          break;
        case "Blue":
          animation = "/animations/bluewins.mp4";
          break;
        case "Tie":
          animation = "/animations/tie.mp4";
      }
    }

    videoElm.style.display = "block";

    videoElm.addEventListener("canplay", () => {
      videoElm.play();

      dispatcher("loaded");

      setTimeout(
        () => {
          ready = true;
          shutterSpring.set(50);
        },
        videoElm.duration * 1000 - 500
      );
    });
  });

  $: if (exit) {
    videoElm.style.display = "none";
    shutterSpring.set(120);
    ready = false;
    setTimeout(() => {
      dispatcher("transitioned");
    }, 500);
  }

  $: console.log($state);
</script>

<div class="fixed w-full h-full">
  <video class="w-full h-full object-contain" bind:this={videoElm}>
    <track kind="captions" srclang="en" label="English" />
    <source src={animation} type="video/mp4" />
  </video>
</div>

<div
  class="w-full {$settings.invert
    ? 'bg-red-800'
    : 'bg-blue-800'} h-full fixed -skew-x-12 flex flex-row justify-end"
  style={`right: ${$shutterSpring}vw`}
></div>

<div
  class="w-full {$settings.invert
    ? 'bg-blue-800'
    : 'bg-red-800'} h-full fixed -skew-x-12 flex flex-row justify-start"
  style={`left: ${$shutterSpring}vw`}
></div>

<div class="fixed z-10 flex flex-col w-full h-full justify-around">
  <div class="w-full flex flex-row justify-around py-8">
    {#if $state.results}
      {#if ready}
        <div
          class="min-w-96 text-center text-3xl"
          in:fly={{ y: -50, duration: 100 }}
          out:fade={{ duration: 100 }}
        >
          <div class="bg-black py-6 px-32 rounded-t">
            <span
              class="text-transparent bg-clip-text bg-gradient-to-r rainbow-gradient font-bold"
            >
              {$state.eventDetails?.name || "Event Name"} - {matchName(
                $state.results.details.matchNumber,
                $state.eventDetails?.matchCount ?? 0,
                $state.results.details.matchType
              )}
            </span>
          </div>
          <div class="flex" class:flex-row-reverse={$settings.invert}>
            <div
              class="bg-blue-600 w-1/2 text-center flex flex-col justify-center py-4"
            >
              <span class="text-white font-bold">Blue</span>
              <span class="text-5xl font-bold"
                >{$state.results?.score.blue.score}</span
              >
            </div>
            <div
              class="bg-red-600 w-1/2 text-center flex flex-col justify-center py-4"
            >
              <span class="text-white font-bold">Red</span>
              <span class="text-5xl font-bold"
                >{$state.results?.score.red.score}</span
              >
            </div>
          </div>
        </div>
      {/if}
    {/if}
  </div>

  <div
    class="w-full h-full flex flex-row justify-around"
    class:flex-row-reverse={$settings.invert}
  >
    <div class="w-[30%] flex flex-col gap-4 justify-center">
      {#if $state.results}
        {#each $state.results.teams.blue as team, index}
          <TeamCard
            alliance="blue"
            {ready}
            {index}
            {team}
            invert={!$settings.invert}
          />
        {/each}

        <RankingPoints {ready} alliance="blue" invert={!$settings.invert} />
      {/if}
    </div>

    {#if ready}
      <div class="w-1/4 flex flex-col items-center gap-8">
        <div
          class="w-full h-fit -mt-8 justify-around bg-white text-black font-semibold text-3xl flex flex-col text-center"
          in:fade={{ duration: 100 }}
          out:fade={{ duration: 100 }}
        >
          <div class="grid grid-cols-[.25fr_.5fr_.25fr] even:bg-gray-200 p-4">
            <span>{$state.results?.score.blue.autoMobility}</span>
            <span>Auto Leave</span>
            <span>{$state.results?.score.red.autoMobility}</span>
          </div>

          <div class="grid grid-cols-[.25fr_.5fr_.25fr] even:bg-gray-200 p-4">
            <span>{$state.results?.score.blue.coral}</span>
            <span>Coral</span>
            <span>{$state.results?.score.red.coral}</span>
          </div>

          <div class="grid grid-cols-[.25fr_.5fr_.25fr] even:bg-gray-200 p-4">
            <span>{$state.results?.score.blue.algae}</span>
            <span>Algae</span>
            <span>{$state.results?.score.red.algae}</span>
          </div>

          <div class="grid grid-cols-[.25fr_.5fr_.25fr] even:bg-gray-200 p-4">
            <span>{$state.results?.score.blue.barge}</span>
            <span>Barge</span>
            <span>{$state.results?.score.red.barge}</span>
          </div>

          <div class="grid grid-cols-[.25fr_.5fr_.25fr] even:bg-gray-200 p-4">
            <span>{$state.results?.score.blue.fouls}</span>
            <span>Penalty</span>
            <span>{$state.results?.score.red.fouls}</span>
          </div>
        </div>

        <img
          src="/logo.png"
          alt="logo"
          class="size-80"
          in:fly={{ y: 200, duration: 500 }}
          out:fly={{ y: -400, duration: 200 }}
        />
      </div>
    {/if}

    <div class="w-[30%] flex flex-col gap-4 justify-center">
      {#if $state.results}
        {#each $state.results.teams.red as team, index}
          <TeamCard
            alliance="red"
            {ready}
            {index}
            {team}
            invert={$settings.invert}
          />
        {/each}

        <RankingPoints {ready} alliance="red" invert={$settings.invert} />
      {/if}
    </div>
  </div>
</div>
