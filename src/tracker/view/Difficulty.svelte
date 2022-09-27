<script lang="ts">
    import {
        encounterDifficulty,
        formatDifficultyReport,
        getCreatureXP
    } from "src/utils/encounter-difficulty";
    import type { DifficultyReport } from "src/utils/encounter-difficulty";
    import { tweened } from "svelte/motion";
    import { cubicOut } from "svelte/easing";
    import type { Creature } from "src/utils/creature";
    import { getContext } from "svelte";
    import type InitiativeTracker from "src/main";

    export let creatures: Creature[];

    const plugin: InitiativeTracker = getContext("plugin");

    let canDisplayDifficulty = false;
    const difficultyBar = tweened(0, {
        duration: 400,
        easing: cubicOut
    });

    let dr: DifficultyReport;
    $: playerLevels = creatures
        ?.filter((creature) => creature.enabled && creature.player)
        .map((p) => p.level);
    $: monstersXp = creatures
        ?.filter((creature) => creature.enabled && !creature.player)
        ?.reduce((acc, cur) => acc + getCreatureXP(plugin, cur), 0);
    $: numOfMonsters = creatures?.filter(
        (creature) => creature.enabled && !creature.player
    ).length;
    $: dif = encounterDifficulty(
        playerLevels.filter((p) => p),
        monstersXp,
        numOfMonsters
    );
    $: {
        if (!dif) {
            canDisplayDifficulty = false;
        } else {
            canDisplayDifficulty = true;

            let progress =
                dif.adjustedXp / dif.budget.deadly > 1
                    ? 1
                    : dif.adjustedXp / dif.budget.deadly;
            difficultyBar.set(progress);
            dr = dif;
        }
    }
</script>

{#if canDisplayDifficulty}
    <div
        class="difficulty-bar-container"
        aria-label={formatDifficultyReport(dr)}
    >
        <span>Easy</span>
        <span
            ><meter
                class="difficulty-bar"
                min="0"
                low="0.33"
                high="0.66"
                optimum="0"
                value={$difficultyBar}
            /></span
        >
        <span>Deadly</span>
    </div>
{/if}

<style>
    .difficulty-bar-container {
        display: grid;
        grid-template-columns: auto 1fr auto;
        gap: 0.5rem;
        align-items: center;
        padding: 0 0.5rem;
        margin-bottom: 0.5rem;
        width: 100%;
    }
    .difficulty-bar {
        width: 100%;
        border: 1px solid #ccc;
        border-radius: 3px;
    }
</style>
