<script lang="ts">
    import { flip } from "svelte/animate";
    import { dndzone, SHADOW_PLACEHOLDER_ITEM_ID } from "svelte-dnd-action";
    import type {
        Filter,
        FilterLayout,
        FilterLayoutItem,
        LayoutItem
    } from "./filter";
    import LayoutItemContainer from "./LayoutItemContainer.svelte";
    import { createEventDispatcher } from "svelte";

    export let layout: FilterLayout;
    export let block: LayoutItem;

    export let inline = false;
    const dispatch = createEventDispatcher<{
        edit: string;
        deleted: string;
        update: null;
    }>();

    const flipDurationMs = 300;
    function handleDndConsider(
        e: CustomEvent<GenericDndEvent<FilterLayoutItem[]>>
    ) {
        if (block.type == "nested") {
            block.nested = e.detail.items;
        }
    }
    function handleDndFinalize(
        e: CustomEvent<GenericDndEvent<FilterLayoutItem[]>>
    ) {
        if (block.type == "nested") {
            block.nested = e.detail.items;
        }
        layout = [...layout];
        dispatch("update");
    }

    const handleDeleted = (id: string) => {
        if (block.type == "filter") return;
        block.nested = block.nested.filter((f) => f.id != id);
        layout = [...layout];
        dispatch("update");
    };
</script>

{#if block.type == "nested"}
    <section
        use:dndzone={{
            items: block.nested,
            flipDurationMs,
            centreDraggedOnCursor: true
        }}
        on:consider={handleDndConsider}
        on:finalize={handleDndFinalize}
        class:inline
    >
        {#each block.nested.filter((item) => item.id !== SHADOW_PLACEHOLDER_ITEM_ID) as item (item.id)}
            <div animate:flip={{ duration: flipDurationMs }} class="item">
                <svelte:self
                    {layout}
                    block={item}
                    inline={true}
                    on:deleted={(e) => handleDeleted(e.detail)}
                />
            </div>
        {/each}
    </section>
{:else}
    <LayoutItemContainer
        id={block.id}
        on:deleted={(e) => dispatch("deleted", e.detail)}
    />
{/if}

<style>
    section {
        padding: 0.4em;
        /* this will allow the dragged element to scroll the list */
        overflow-y: auto;
        height: auto;
        width: 100%;
    }
    section.inline {
        display: flex;
        justify-content: space-between;
        flex-flow: row;
        gap: 0.5rem;
    }
</style>
