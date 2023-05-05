<script lang="ts">
    import { ExtraButtonComponent } from "obsidian";
    import { createEventDispatcher, getContext } from "svelte";
    import { slide } from "svelte/transition";
    import { linear } from "svelte/easing";

    import type { BuiltFilterStore } from "../../stores/filter/filter";
    import FilterContainer from "./customs/FilterContainer.svelte";
    import String from "./customs/Search.svelte";

    let open = false;
    const dispatch = createEventDispatcher<{ settings: MouseEvent }>();

    const filterStore = getContext<BuiltFilterStore>("filters");
    const { active, name, layout } = filterStore;

    const resetIcon = (node: HTMLElement) => {
        new ExtraButtonComponent(node).setIcon("reset");
    };
    const filter = (node: HTMLElement) => {
        new ExtraButtonComponent(node).setIcon("filter");
    };
    const settingsIcon = (node: HTMLElement) => {
        new ExtraButtonComponent(node).setIcon("settings");
    };
</script>

<div class="filters-container">
    <div class="controls">
        <String filter={name} />
        <div class="filter-button" on:click={() => (open = !open)}>
            <div use:filter />
            <div class="filter-number">{$active}</div>
        </div>
        <div use:resetIcon on:click={() => filterStore.reset()} />
        <div use:settingsIcon on:click={(evt) => dispatch("settings", evt)} />
    </div>
    {#if open}
        <div class="filters" transition:slide={{ easing: linear }}>
            {#each $layout as layout}
                <FilterContainer {layout} />
            {/each}
        </div>
    {/if}
</div>

<style scoped>
    .filters-container {
        display: flex;
        flex-flow: column nowrap;
        gap: 1rem;
    }
    .controls {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.5rem;
    }

    .filter-button {
        position: relative;
    }
    .filter-number {
        position: absolute;
        bottom: 0;
        right: 0;
        background-color: var(--interactive-normal);
        border-radius: 50%;
        width: 14px;
        height: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: var(--font-smallest);
        pointer-events: none;
    }

    .filters {
        display: flex;
        flex-flow: column nowrap;
        gap: 1rem;
    }
</style>
