<script lang="ts">
    import { encounter } from "../../stores/encounter";
    import { players } from "../../stores/players";
    import { DEFAULT_UNDEFINED, AVAILABLE_XP_SYSTEMS } from "src/utils";
    import { encounterDifficulty, isDnd5e, isDnd5eLazyGm } from "src/utils/encounter-difficulty";
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

    let xp: string;
    $: {
      if (!difficulty) {
        xp = DEFAULT_UNDEFINED;
      } else if (isDnd5e(difficulty)) {
        xp = difficulty.adjustedXp.toLocaleString();
      } else {
        xp = difficulty.totalXp.toLocaleString();
      }
    }

    let thresholds: [string, string][] = [];
    $: {
        if (isDnd5e(difficulty)) {
            thresholds = Object.entries(difficulty?.budget ?? {})
                               .filter(([name]) => name != "daily")
                               .map(([name, minXP]) => [name, minXP.toLocaleString() + " XP"]);
        } else if (isDnd5eLazyGm(difficulty)) {
            thresholds = [["deadly", difficulty.budget.deadly.toLocaleString() + " CR"]];
        }
    }
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
                        <span>{difficulty?.difficulty ?? DEFAULT_UNDEFINED}</span>
                    </div>
                    <div class="total container">
                        <strong class="header">XP</strong>
                        <span>{xp}</span>
                    </div>
                    {#if xpSystem == "dnd5e"}
                        <div class="adjusted container">
                            <strong class="header">Adjusted</strong>
                            <span>
                                {isDnd5e(difficulty)
                                 ? difficulty.adjustedXp.toLocaleString()
                                : DEFAULT_UNDEFINED}
                            </span>
                        </div>
                    {:else if xpSystem == "dnd5eLazyGm"}
                        <div class="adjusted container">
                            <strong class="header">CR</strong>
                            <span>
                                {isDnd5eLazyGm(difficulty)
                                 ? difficulty.crSum.toLocaleString()
                                : DEFAULT_UNDEFINED}
                            </span>
                        </div>
                    {/if}
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
            {#if xpSystem == "dnd5e"}
            <div class="budget">
                <h5 class="experience-name">Daily budget</h5>
                <span class="experience-amount">
                    {isDnd5e(difficulty)
                      ? difficulty.budget.daily.toLocaleString()
                      : DEFAULT_UNDEFINED} XP
                </span>
            </div>
            {/if}
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
