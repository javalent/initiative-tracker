<script lang="ts">
    import { setIcon } from "obsidian";
    import { RANDOM_HP } from "src/utils";
    import type { Creature } from "src/utils/creature";

    export let creature: Creature;
    export let count: string | number;
    export let xp: number;
    export let shouldShowRoll: boolean;

    const rollEl = (node: HTMLElement) => {
        setIcon(node, RANDOM_HP);
    };
</script>

<slot />
<span class="creature-name">
    {#if creature.display && creature.display != creature.name}
        &nbsp;{creature.display}{count == 1 ? "" : "s"} ({creature.name})
    {:else}
        &nbsp;{creature.name}{count == 1 ? "" : "s"}
    {/if}
    {#if shouldShowRoll && creature.hit_dice?.length}
        <span class="has-icon" aria-label="Rolling for HP" use:rollEl />
    {/if}
</span>
{#if xp}
    <span class="xp-parent">
        <span class="paren left">(</span>
        <span class="xp-container">
            <span class="xp number">
                {xp}
            </span>
            <span class="xp text">XP</span>
        </span>
        <span class="paren right">)</span>
    </span>
{/if}

<style>
    .creature-name,
    .creatures-header {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
    }
    .has-icon {
        display: flex;
        align-items: center;
    }
    .xp-parent {
        display: inline-flex;
    }
</style>
