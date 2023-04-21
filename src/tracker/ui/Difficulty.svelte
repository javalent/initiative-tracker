<script lang="ts">
    import { formatDifficultyReport } from "src/utils/encounter-difficulty";
    import { tweened } from "svelte/motion";
    import { cubicOut } from "svelte/easing";
    import { getContext } from "svelte";
    import type InitiativeTracker from "src/main";

    import { tracker } from "../stores/tracker";
    const { difficulty } = tracker;

    const plugin: InitiativeTracker = getContext("plugin");

    const dif = difficulty(plugin);

    const difficultyBar = tweened(0, {
        duration: 400,
        easing: cubicOut
    });

    let report: string = "";
    $: {
        if ($dif) {
            let progress =
                $dif.adjustedXp / $dif.budget.deadly > 1
                    ? 1
                    : $dif.adjustedXp / $dif.budget.deadly;
            difficultyBar.set(progress);
            report = formatDifficultyReport($dif);
        }
    }
</script>

<div class="difficulty-bar-container" aria-label={report}>
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
