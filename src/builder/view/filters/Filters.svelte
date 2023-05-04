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
    import Slider from "./customs/Slider.svelte";
    import Multiselect from "svelte-multiselect";

    import FilterModal from "./FilterModal.svelte";

    import type { SRDMonster } from "index";

    import { BuiltFilterStore, FilterType, name } from "../../stores/filter";
    import Range from "./customs/Range.svelte";
    import { each } from "svelte/internal";

    let open = false;
    const dispatch = createEventDispatcher();

    const plugin = getContext("plugin");
    const original = plugin.bestiary as SRDMonster[];

    const filterStore = getContext<BuiltFilterStore>("filters");
    const { active, filters } = filterStore;

    const sizes = [
        "Tiny",
        "Small",
        "Medium",
        "Large",
        "Huge",
        "Gargantuan",
        "Varies"
    ];

    $: types = [
        ...new Set(
            original
                .map((c) => {
                    return typeof c.type == "string" ? c.type : null;
                })
                .filter((c) => c)
        )
    ].sort();

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
        <div class="filter-button">
            <div use:filter on:click={() => (open = !open)} />
            <div class="filter-number">{$active}</div>
        </div>
        <div use:resetIcon on:click={() => filterStore.reset()} />
        <div use:settingsIcon on:click={() => dispatch("settings")} />
    </div>
    {#if open}
        <div class="filters" transition:slide={{ easing: linear }}>
            <div use:sourcesButton />
            <!-- <div class="multiselect-container">
                <Multiselect
                    options={sizes}
                    bind:selected={$size}
                    outerDivClass="multiselect-dropdown"
                    placeholder="Sizes"
                />
            </div>
            <div class="multiselect-container">
                <Multiselect
                    options={types}
                    bind:selected={$type}
                    outerDivClass="multiselect-dropdown"
                    placeholder="Types"
                />
            </div> -->
        </div>
        {#each [...$filters.values()] as filter}
            {#if filter.type == FilterType.Range}
                <Range {filter} />
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
    }

    .filters {
        display: flex;
        align-items: center;
        gap: 1rem;
        width: 100%;
    }
    

    input {
        text-align: center;
    }

    .multiselect-container {
        width: 100%;
    }
    :global(.multiselect-dropdown) {
        height: auto;
        min-height: var(--input-height, 30px);
    }
    /** Normalize multiselect */
    :global(div.multiselect) {
        --sms-border: none;
        --sms-bg: var(--interactive-normal);
        --sms-options-bg: var(--interactive-normal);
        --sms-border-radius: var(--radius);
    }
    :global(div.multiselect ul) {
        padding-left: 0;
        border-radius: var(--radius);
    }
    :global(div.multiselect button) {
        height: 0;
    }
    :global(div.multiselect input) {
        width: 0;
        font-size: var(--font-ui-small);
    }
    :global(div.multiselect li) {
        border-left: none;
    }
    :global(div.multiselect li::before) {
        content: none;
    }
</style>
