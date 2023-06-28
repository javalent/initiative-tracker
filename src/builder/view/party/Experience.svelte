<script lang="ts">
    import { encounter } from "../../stores/encounter";
    import { players } from "../../stores/players";
    import { RpgSystemSetting, getRpgSystem } from "src/utils";
    import { getContext } from "svelte";
    import Collapsible from "./Collapsible.svelte";

    const plugin = getContext("plugin");

    const open = plugin.data.builder.showXP;
    const rpgSystem = getRpgSystem(plugin);

    $: playerLevels = $players.filter(p => p.enabled).map(p => p.level)
    $: difficulty = rpgSystem.getEncounterDifficulty($encounter, playerLevels)
</script>

<div class="xp-container">
    <Collapsible
        {open}
        on:toggle={() =>
            (plugin.data.builder.showXP = !plugin.data.builder.showXP)}
    >
        <h5 slot="title">
            Experience
            {#if plugin.data.rpgSystem != RpgSystemSetting.Dnd5e}
                ({rpgSystem.displayName})
            {/if}
        </h5>
        <div slot="content">
            <div class="xp">
                <div class="encounter-difficulty">
                    <div class="difficulty container">
                        <strong class="header">Difficulty</strong>
                        <span>{difficulty.displayName}</span>
                    </div>
                    {#each difficulty.intermediateValues as intermediate}
                        <div class="adjusted container">
                            <strong class="header">{intermediate.label}</strong>
                            <span>{intermediate.value.toLocaleString()}</span>
                        </div>
                    {/each}
                    <div class="total container">
                        <strong class="header">{difficulty.title}</strong>
                        <span>{rpgSystem.formatDifficultyValue(difficulty.value)}</span>
                    </div>
                </div>
                <div class="thresholds">
                    {#each rpgSystem.getDifficultyThresholds(playerLevels) as budget}
                        <div class="experience-threshold {budget.displayName.toLowerCase()} container">
                            <strong class="experience-name header">
                                {budget.displayName}
                            </strong>
                            <span class="experience-amount">
                                {rpgSystem.formatDifficultyValue(budget.minValue, true)}
                            </span>
                        </div>
                    {/each}
                </div>
                <br />
            </div>
            <div class="budget">
                {#each rpgSystem.getAdditionalDifficultyBudgets(playerLevels) as budget}
                    <h5 class="experience-name">{budget.displayName}</h5>
                    <span class="experience-amount">
                        {rpgSystem.formatDifficultyValue(budget.minValue, true)}
                    </span>
                {/each}
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
