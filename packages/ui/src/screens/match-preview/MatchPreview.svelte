<script lang="ts">
  import { spring } from "svelte/motion";
  import { fade, fly } from "svelte/transition";
  import { state } from "../../lib/state";
  import { createEventDispatcher, onMount } from "svelte";
  import { matchName } from "../../lib/matchNamer";
  import RobotShadow from "./RobotShadow.svelte";
  import { settings } from "../../lib/settings";
  import TeamCard from "../../lib/TeamCard.svelte";

  let ready = false;
  const dispatcher = createEventDispatcher();
  export let exit = false;

  let shutterSpring = spring(120, {
    stiffness: 0.1,
    damping: 0.5,
  });

  onMount(() => {
    shutterSpring.set(50);
    setTimeout(() => {
      ready = true;
    }, 500);
  });

  $: if (exit) {
    shutterSpring.set(120);
    ready = false;
    setTimeout(() => {
      dispatcher("transitioned");
    }, 500);
  }

  $: console.log($state.eventDetails);
</script>

<div
  class="w-full {$settings.invert
    ? 'bg-red-800'
    : 'bg-blue-800'} h-full fixed -skew-x-12 flex flex-row justify-end"
  style={`right: ${$shutterSpring}vw`}
>
  <!-- <div
    id="shadows"
    class="skew-x-12 flex flex-col w-1/2 items-center justify-center"
  >
    {#if $state.match}
      {#each $state.match.teams[$settings.invert ? "red" : "blue"] as team}
        <RobotShadow
          color={$settings.invert ? "red" : "blue"}
          teamNumber={team.number}
        />
      {/each}
    {/if}
  </div> -->
</div>

<div
  class="w-full {$settings.invert
    ? 'bg-blue-800'
    : 'bg-red-800'} h-full fixed -skew-x-12 flex flex-row justify-start"
  style={`left: ${$shutterSpring}vw`}
>
  <!-- <div
    id="shadows"
    class="skew-x-12 flex flex-col w-1/2 items-center justify-center"
  >
    {#if $state.match}
      {#each $state.match.teams[$settings.invert ? "blue" : "red"] as team}
        <RobotShadow
          color={$settings.invert ? "blue" : "red"}
          teamNumber={team.number}
        />
      {/each}
    {/if}
  </div> -->
</div>

<div class="fixed flex flex-col w-full h-full justify-around">
  <div class="w-full flex flex-row justify-around py-16">
    {#if $state.match}
      {#if ready}
        <div
          class="bg-black min-w-96 rounded px-32 py-8 text-center text-3xl"
          in:fly={{ y: -50, duration: 100 }}
          out:fade={{ duration: 100 }}
        >
          <span
            class="text-transparent bg-clip-text bg-gradient-to-r rainbow-gradient font-bold"
          >
            {$state.eventDetails?.name || "Event Name"} - {matchName(
              $state.match.details.matchNumber,
              $state.eventDetails?.matchCount ?? 0,
              $state.match.details.matchType
            )}
          </span>
        </div>
      {/if}
    {/if}
  </div>

  <div
    class="w-full h-full flex flex-row justify-around"
    class:flex-row-reverse={$settings.invert}
  >
    <div class="w-1/3 flex flex-col gap-8 justify-center">
      {#if $state.match}
        {#each $state.match.teams.blue as team, index}
          <TeamCard
            alliance="blue"
            {ready}
            {index}
            {team}
            invert={!$settings.invert}
          />
        {/each}
      {/if}
    </div>

    <div class="w-1/3 flex flex-col gap-8 justify-center">
      {#if $state.match}
        {#each $state.match.teams.red as team, index}
          <TeamCard
            alliance="red"
            {ready}
            {index}
            {team}
            invert={$settings.invert}
          />
        {/each}
      {/if}
    </div>
  </div>
</div>
