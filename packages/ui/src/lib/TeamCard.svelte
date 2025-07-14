<script lang="ts">
  import type { Team } from "lib";
  import { fly } from "svelte/transition";
  import { defaultAvatar } from "../screens/match-preview/avatar";
  import ArrowUp from "../assets/arrow-up.svg";
  import ArrowDown from "../assets/arrow-down.svg";
  import NoChange from "../assets/no-change.svg";

  export let ready: boolean;
  export let index: number;
  export let team: Team;
  export let alliance: "red" | "blue";
  export let invert: boolean;
</script>

{#if ready}
  <div
    class="flex flex-col shadow-lg rounded overflow-hidden"
    in:fly={{
      x: 100 * (invert ? -1 : 1),
      duration: 500,
      delay: 150 * index,
    }}
    out:fly={{
      x: 400 * (invert ? -1 : 1),
      duration: 100,
    }}
  >
    <div
      class="flex flex-row bg-{alliance}-600 text-white p-4 text-xl gap-4 align-middle"
    >
      <div style="width: 40px; height: 40px">
        <img
          src="data:image/png;base64,{team.avatar || defaultAvatar}"
          alt="{team.number} Icon"
          width="40px"
          height="40px"
        />
      </div>
      <span class="text-3xl">{team.number}</span>
    </div>
    <div
      class="grid grid-cols-[.7fr_.1fr_.2fr] bg-white text-black p-4 text-2xl font-bold justify-between"
    >
      <span>{team.name}</span>
      {#if team.card && team.card !== "None"}
        <span
          class="w-full h-8 text-2xl text-center text-black rounded border border-gray-800 {team.card ===
          'Red'
            ? 'bg-red-400'
            : 'bg-yellow-400'}"
        ></span>
      {:else}
        <span></span>
      {/if}
      <span class="flex gap-2 items-center justify-center">
        <span>{team.rank}</span>
        {#if team.rankChange}
          {#if team.rankChange === "Up"}
            <img src={ArrowUp} alt="up" class="size-8 fill-black" />
          {:else if team.rankChange === "Down"}
            <img src={ArrowDown} alt="down" class="size-8 fill-black" />
          {:else if team.rankChange === "NoChange"}
            <img src={NoChange} alt="no change" class="size-8 fill-black" />
          {/if}
        {/if}
      </span>
    </div>
  </div>
{/if}
