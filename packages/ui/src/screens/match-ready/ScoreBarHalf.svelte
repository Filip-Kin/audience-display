<script lang="ts">
  import type { AllianceScore } from "lib";
  import { state } from "../../lib/state";

  export let invert: boolean;
  export let wingSpring;
  export let opacityTween;
  export let alliance: "red" | "blue";
  let score: AllianceScore | undefined;

  $: score = $state.match?.score[alliance];
</script>

{#if $state.match && score}
  <div class="flex flex-row justify-start">
    <div
      class="bg-{alliance}-600 flex flex-row p{invert ? 'l' : 'r'}-16 -m{invert
        ? 'l'
        : 'r'}-16 rounded-{invert ? 'r' : 'l'}-xl relative rainbow-shadow"
    >
      <div
        class="flex flex-row z-10 relative"
        style={`max-width: ${$wingSpring / 2}vw; opacity: ${$opacityTween}`}
        class:flex-row-reverse={invert}
      >
        <div
          class="flex flex-col justify-center px-3 w-32 text-5xl font-bold text-center"
        >
          {score.score}
        </div>

        <div class="flex flex-col justify-center h-full min-w-12">
          {#if score.coopertitionMet}
            <div
              class="rounded-full bg-white text-black p-1.5 flex items-center justify-center gap-2 h-fit"
              class:bg-yellow-200={score.coopertitionAchieved}
            >
              <img src="/coop.png" alt="coop" class="size-8" />
            </div>
          {/if}
        </div>

        <div
          class="flex flex-col px-4 text-2xl justify-center text-center text-nowrap min-w-24 gap-2 my-2"
        >
          <div
            class="flex justify-between bg-white text-black rounded-full py-2 px-4 items-center gap-3"
            class:flex-row-reverse={invert}
          >
            <span class="grow text-center mb-1">{score.algaeCount}</span>
            <img src="/algea.png" alt="algea" class="size-8" />
          </div>
          <div
            class="flex justify-between bg-white text-black rounded-full py-2 px-4 items-center gap-2"
            class:bg-yellow-200={score.coralBonusRP}
            class:flex-row-reverse={invert}
          >
            <span class="grow text-center mb-1"
              >{score.coralBonusProgress} / {score.coralBonusThreshold}</span
            >
            <img src="/coral.png" alt="coral" class="size-8" />
          </div>
        </div>

        <div class="flex flex-col justify-center px-3 w-24 gap-1">
          {#each $state.match.teams[alliance] as team, index}
            <span
              class="text-2xl text-center text-black rounded {team.card
                ? 'bg-yellow-200'
                : 'bg-white'}">{team.number}</span
            >
          {/each}
        </div>
      </div>
    </div>
  </div>
{/if}
