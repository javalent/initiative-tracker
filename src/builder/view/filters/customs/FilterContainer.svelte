<script lang="ts">
    import {
        BuiltFilterStore,
        FilterLayoutItem,
        FilterType,
        OptionsFilterStore,
        RangeFilterStore,
        StringFilterStore
    } from "src/builder/stores/filter/filter";
    import { getContext } from "svelte";
    import Range from "./Range.svelte";
    import Options from "./Options.svelte";
    import String from "./String.svelte";

    const filterStore = getContext<BuiltFilterStore>("filters");
    const { filters } = filterStore;
    export let layout: FilterLayoutItem;

    let filter: RangeFilterStore | OptionsFilterStore | StringFilterStore;
    $: {
        if ("filter" in layout) {
            filter = $filters.get(layout.filter);
        }
    }
</script>

{#if "nested" in layout}
    <div class="nested-filter-container">
        {#each layout.nested as nested}
            <svelte:self layout={nested} />
        {/each}
    </div>
{:else}
    <div class="filter-container">
        {#if filter.type == FilterType.Range}
            <Range {filter} />
        {/if}
        {#if filter.type == FilterType.Options}
            <Options {filter} />
        {/if}
        {#if filter.type == FilterType.String}
            <String {filter} />
        {/if}
    </div>
{/if}

<style scoped>
    .nested-filter-container {
        display: flex;
        flex-flow: row wrap;
        gap: 0.5rem;
    }
    .filter-container {
        flex-grow: 1;
        flex-basis: 0;
    }
</style>
