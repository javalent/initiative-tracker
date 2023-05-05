<script lang="ts">
    import { Setting } from "obsidian";
    import { getId } from "src/utils/creature";
    import { createEventDispatcher } from "svelte";
    import { SHADOW_PLACEHOLDER_ITEM_ID, dndzone } from "svelte-dnd-action";
    import { flip } from "svelte/animate";

    export let fields: string[];
    const dispatch = createEventDispatcher<{ update: string[] }>();
    type DraggableField = { id: string; field: string };
    let items: DraggableField[] = [];
    for (const field of fields) {
        items.push({ id: getId(), field });
    }
    const flipDurationMs = 300;
    function handleDndConsider(e: CustomEvent<{ items: DraggableField[] }>) {
        items = e.detail.items;
    }
    function handleDndFinalize(e: CustomEvent<{ items: DraggableField[] }>) {
        items = e.detail.items;
        dispatch(
            "update",
            items.map((i) => i.field)
        );
    }
    const fieldSetting = (node: HTMLElement, draggable: DraggableField) => {
        const { field, id } = draggable;
        new Setting(node).setName(field).addExtraButton((b) =>
            b.setIcon("trash").onClick(() => {
                items = items.filter((i) => i.id != id);
                dispatch(
                    "update",
                    items.map((i) => i.field)
                );
            })
        );
    };
    const type = getId();
</script>

<section
    use:dndzone={{ items, flipDurationMs, dropFromOthersDisabled: true, type }}
    on:consider={handleDndConsider}
    on:finalize={handleDndFinalize}
    class="draggable-fields"
>
    {#each items.filter(({ id }) => id != SHADOW_PLACEHOLDER_ITEM_ID) as item (item.id)}
        <div animate:flip={{ duration: flipDurationMs }}>
            <div use:fieldSetting={item} class="draggable-field" />
        </div>
    {/each}
</section>

<style scoped>
    .draggable-fields {
        margin: 0 1rem;
    }
</style>
