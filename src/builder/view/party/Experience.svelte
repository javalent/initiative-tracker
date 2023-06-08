<script lang="ts">
    import { encounter } from "../../stores/encounter";
    import { players } from "../../stores/players";
    import { DEFAULT_UNDEFINED, AVAILABLE_XP_SYSTEMS } from "src/utils";
    import { encounterDifficulty } from "src/utils/encounter-difficulty";
    import { getContext } from "svelte";
    import Collapsible from "./Collapsible.svelte";

    const plugin = getContext("plugin");

    const open = plugin.data.builder.showXP;
    const xpSystem = plugin.data.xpSystem;

    $: difficulty = encounterDifficulty(
        plugin,
        $players.filter(player => player.level && player.enabled)
                .map(player => Math.min(player.level, 20)),
        $encounter);
    $: xp = difficulty?.totalXp.toLocaleString() ?? DEFAULT_UNDEFINED;
    $: adjXP = difficulty?.adjustedXp.toLocaleString() ?? DEFAULT_UNDEFINED;
    $: difficultyName = difficulty?.difficulty ?? DEFAULT_UNDEFINED;
    $: dailyBudget = difficulty?.budget?.daily.toLocaleString() + " XP" ?? DEFAULT_UNDEFINED;
    $: thresholds = Object.entries(difficulty?.budget ?? {})
                          .filter(([name, _]) => name != "daily")
                          .map(([name, minXP]) => [name, minXP.toLocaleString() + " XP"]);
</script>

<div class="xp-container">
    <Collapsible
        {open}
        on:toggle={() =>
            (plugin.data.builder.showXP = !plugin.data.builder.showXP)}
    >
        <h5 slot="title">
            Experience
            {#if xpSystem != "dnd5e"}
                ({AVAILABLE_XP_SYSTEMS[xpSystem]})
            {/if}
        </h5>
        <div slot="content">
            <div class="xp">
                <div class="encounter-difficulty">
                    <div class="difficulty container">
                        <strong class="header">Difficulty</strong>
                        <span>{difficultyName}</span>
                    </div>
                    <div class="total container">
                        <strong class="header">XP</strong>
                        <span>{xp}</span>
                    </div>
                    <div class="adjusted container">
                        <strong class="header">Adjusted</strong>
                        <span>{adjXP}</span>
                    </div>
                </div>
                <div class="thresholds">
                    {#each thresholds as [name, thresholdText]}
                        <div class="experience-threshold {name.toLowerCase()} container">
                            <strong class="experience-name header">{name}</strong>
                            <span class="experience-amount">{thresholdText}</span>
                        </div>
                    {/each}
                </div>
                <br />
            </div>
            <div class="budget">
                <h5 class="experience-name">Daily budget</h5>
                <span class="experience-amount">{dailyBudget}</span>
            </div>
        </div>
    </Collapsible>
</div>

<style scoped>
    .xp-container {
        margin-left: auto;
    }
    .xp {
        display: flex;
        gap: 1rem;
    }
    .thresholds {
        display: flex;
        flex-flow: column;
        gap: 0.5rem;
    }
    .experience-amount {
        margin-left: auto;
    }
    .encounter-difficulty {
        display: flex;

        flex-flow: column nowrap;
        gap: 0.5rem;
        /* justify-content: space-between; */
        margin-bottom: 1rem;
    }
    .container {
        display: flex;
        flex-flow: column nowrap;
    }
    .header {
        text-transform: uppercase;
        font-weight: bolder;
    }
</style>
