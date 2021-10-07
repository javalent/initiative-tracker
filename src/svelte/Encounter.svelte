<script lang="ts">
  import { ExtraButtonComponent } from "obsidian";
  import { START_ENCOUNTER } from "src/utils";

  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  import type { Creature } from "src/utils/creature";
  import {
    encounterDifficulty,
    formatDifficultyReport,
  } from "src/utils/encounter-difficulty";

  export let name: string = "Encounter";
  export let creatures: Creature[] = [];
  export let players: boolean | string[] = true;
  export let xp: number;

  let totalXP = xp ?? 0;
  export let playerLevels: number[];

  interface CreatureStats {
    name: string;
    ac: number;
    hp: number;
    modifier: number;
    xp: number;
  }

  const displayMap: Array<[CreatureStats, number]> = [];

  const equivalent = (creature: CreatureStats, existing: CreatureStats) => {
    return (
      creature.name == existing.name &&
      creature.ac == existing.ac &&
      creature.hp == existing.hp &&
      creature.modifier == existing.modifier &&
      creature.xp == existing.xp
    );
  };

  for (let creature of creatures) {
    const stats = {
      name: creature.name,
      ac: creature.ac,
      hp: creature.hp,
      modifier: creature.modifier,
      xp: creature.xp,
    };
    const existing = displayMap.find(([c]) => equivalent(c, stats));
    if (!existing) {
      displayMap.push([stats, 1]);
    } else {
      displayMap.splice(displayMap.indexOf(existing), 1, [
        existing[0],
        existing[1] + 1,
      ]);
    }
    if (!xp) {
      totalXP += creature.xp;
    }
  }
  let difficulty = encounterDifficulty(
    playerLevels,
    creatures.map((creature) => creature.xp)
  );

  const open = (node: HTMLElement) => {
    new ExtraButtonComponent(node)
      .setIcon(START_ENCOUNTER)
      .setTooltip("Begin Encounter")
      .onClick(() => {
        dispatch("begin-encounter");
      });
  };
  const label = (creature: CreatureStats) => {
    if (!creature) return;
    let label = [];
    if (creature.hp) {
      label.push(`HP: ${creature.hp}`);
    }
    if (creature.ac) {
      label.push(`AC: ${creature.ac}`);
    }
    if (creature.modifier) {
      label.push(`MOD: ${creature.modifier}`);
    }
    return `${label.join(", ")}`;
  };
</script>

<div class="encounter-instance">
  <div class="encounter-name">
    <div use:open />
    <h3 data-heading={name} class="initiative-tracker-name">{name}</h3>
  </div>
  <div class="creatures-container">
    {#if players instanceof Array && players.length}
      <div class="encounter-creatures encounter-players">
        <h4>Players</h4>
        <ul>
          {#each players as player}
            <li>
              <span>{player}</span>
            </li>
          {/each}
        </ul>
      </div>
    {:else if !players}
      <div class="encounter-creatures encounter-players">
        <h4>No Players</h4>
      </div>
    {/if}

    <div class="encounter-creatures">
      <h4>Creatures</h4>
      {#if creatures.length}
        <ul>
          {#each displayMap as [creature, count]}
            <li aria-label={label(creature)} class="creature-li">
              <strong>{count}</strong><span
                >&nbsp;{creature.name}{count == 1 ? "" : "s"}</span
              >
              {#if creature.xp}
                <span>
                  ({creature.xp * count} XP)
                </span>
              {/if}
            </li>
          {/each}
        </ul>
      {:else}
        <strong>No creatures</strong>
      {/if}
    </div>

    <div class="encounter-xp">
      {#if totalXP > 0}
        <span aria-label={formatDifficultyReport(difficulty)}
          >The encounter is <em>{difficulty.difficulty}<em /> ({totalXP} XP)</em
          ></span
        >
      {/if}
    </div>
  </div>
</div>

<style>
  .encounter-name {
    display: flex;
    justify-content: flex-start;
    align-items: center;
  }
  .encounter-instance
    > .creatures-container
    > .encounter-creatures:first-of-type
    h4,
  .encounter-creatures > ul {
    margin-top: 0;
  }
  .creature-li {
    width: fit-content;
  }
</style>
