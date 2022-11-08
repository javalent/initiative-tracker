<script lang="ts">
    import { EXPERIENCE_THRESHOLDS } from "src/builder/constants";
    import { encounter } from "../../stores/encounter";
    import { players } from "../../stores/players";
    import { MODIFIERS_BY_COUNT, MODIFIER_THRESHOLDS } from "../../constants";
    import { DEFAULT_UNDEFINED, XP_PER_CR } from "src/utils";

    const { thresholds, modifier: playerModifier } = players;

    $: count = ([...$encounter.values()] ?? []).reduce((a, b) => {
        return a + b;
    }, 0);

    $: index =
        MODIFIER_THRESHOLDS.lastIndexOf(
            MODIFIER_THRESHOLDS.filter((t) => t <= count).pop()
        ) + $playerModifier;
    $: modifier = MODIFIERS_BY_COUNT[index];

    $: xp = ([...$encounter.entries()] ?? []).reduce((acc, cur) => {
        const [monster, count] = cur;
        if (monster.cr && monster.cr in XP_PER_CR) {
            acc += XP_PER_CR[monster.cr] * count;
        }
        return acc;
    }, 0);
    $: adjXP = xp * modifier;
    let difficulty: string;
    $: {
        if (!adjXP) difficulty = DEFAULT_UNDEFINED;
        else {
            difficulty = "Trivial";
            if (adjXP > $thresholds.Easy) {
                difficulty = "Easy";
            }
            if (adjXP > $thresholds.Medium) {
                difficulty = "Medium";
            }
            if (adjXP > $thresholds.Hard) {
                difficulty = "Hard";
            }
            if (adjXP > $thresholds.Deadly) {
                difficulty = "Deadly";
            }
        }
    }
</script>

<div class="xp-container">
    <h5>Experience</h5>
    <div class="xp">
        <div class="encounter-difficulty">
            <div class="difficulty container">
                <strong class="header">Difficulty</strong>
                <span>
                    {difficulty}
                </span>
            </div>
            <div class="total container">
                <strong class="header">XP</strong>
                <span>
                    {xp ? xp.toLocaleString() : DEFAULT_UNDEFINED}
                </span>
            </div>
            <div class="adjusted container">
                <strong class="header">Adjusted</strong>
                <span>
                    {adjXP ? adjXP.toLocaleString() : DEFAULT_UNDEFINED}
                </span>
            </div>
        </div>
        <div class="thresholds">
            {#each EXPERIENCE_THRESHOLDS as level}
                <div
                    class="experience-threshold {level.toLowerCase()} container"
                >
                    <strong class="experience-name header">{level}</strong>
                    <span class="experience-amount">
                        {$thresholds[level].toLocaleString()} XP
                    </span>
                </div>
            {/each}
        </div>
        <br />
    </div>
    <div class="budget">
        <h5 class="experience-name">Daily budget</h5>
        <span class="experience-amount">
            {$thresholds.Daily.toLocaleString()} XP
        </span>
    </div>
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
