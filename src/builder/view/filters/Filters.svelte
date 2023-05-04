<script lang="ts">
    import {
        ButtonComponent,
        debounce,
        ExtraButtonComponent,
        Modal,
        TextComponent
    } from "obsidian";
    import { createEventDispatcher, getContext } from "svelte";
    import { slide } from "svelte/transition";
    import { linear } from "svelte/easing";

    import FilterModal from "./FilterModal.svelte";

    import { BuiltFilterStore, FilterType, name } from "../../stores/filter/filter";
    import Range from "./customs/Range.svelte";
    import Options from "./customs/Options.svelte";

    let open = false;
    const dispatch = createEventDispatcher<{ settings: MouseEvent }>();

    const plugin = getContext("plugin");

    const filterStore = getContext<BuiltFilterStore>("filters");
    const { active, filters } = filterStore;

    const search = (node: HTMLElement) => {
        new TextComponent(node).setPlaceholder("Name").onChange(
            debounce((v) => {
                $name = v;
            }, 10)
        );
    };

    const resetIcon = (node: HTMLElement) => {
        new ExtraButtonComponent(node).setIcon("reset");
    };
    const filter = (node: HTMLElement) => {
        new ExtraButtonComponent(node).setIcon("filter");
    };
    const settingsIcon = (node: HTMLElement) => {
        new ExtraButtonComponent(node).setIcon("settings");
    };
    const sourcesButton = (node: HTMLElement) => {
        new ButtonComponent(node)
            .setButtonText("Manage Sources")
            .onClick(() => {
                const modal = new Modal(plugin.app);
                new FilterModal({ target: modal.contentEl, props: { plugin } });
                modal.open();
            });
    };
</script>

<div class="filters-container">
    <div class="controls">
        <div class="search" use:search />
        <div class="filter-button" on:click={() => (open = !open)}>
            <div use:filter />
            <div class="filter-number">{$active}</div>
        </div>
        <div use:resetIcon on:click={() => filterStore.reset()} />
        <div use:settingsIcon on:click={(evt) => dispatch("settings", evt)} />
    </div>
    {#if open}
        <div class="filters" transition:slide={{ easing: linear }}>
            <div use:sourcesButton />
        </div>
        {#each [...$filters.values()] as filter}
            {#if filter.type == FilterType.Range}
                <Range {filter} />
            {/if}
            {#if filter.type == FilterType.Options}
                <Options {filter} />
            {/if}
        {/each}
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
    .search,
    .search :global(input) {
        width: 100%;
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
        align-items: center;
        gap: 1rem;
        width: 100%;
    }
</style>
