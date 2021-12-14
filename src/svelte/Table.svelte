<script lang="ts">
    import { setIcon } from "obsidian";
    import { AC, HP } from "src/utils";

    import { flip } from "svelte/animate";
    import { dndzone } from "svelte-dnd-action";

    import CreatureTemplate from "./Creature.svelte";
    import { createEventDispatcher } from "svelte";
    import { Creature, getId } from "src/utils/creature";

    const dispatch = createEventDispatcher();

    export let creatures: Creature[] = [];
    export let state: boolean;
    export let current: number;

    $: items = [...creatures].map((c) => {
        return { creature: c, id: getId() };
    });

    const hpIcon = (node: HTMLElement) => {
        setIcon(node, HP);
    };
    const acIcon = (node: HTMLElement) => {
        setIcon(node, AC);
    };
    const flipDurationMs = 300;
    function handleDndConsider(
        e: CustomEvent<GenericDndEvent<{ creature: Creature; id: string }>>
    ) {
        items = e.detail.items;
    }
    function handleDndFinalize(
        e: CustomEvent<GenericDndEvent<{ creature: Creature; id: string }>>
    ) {
        if (e.detail.items.length > 1) {
            let dropped = e.detail.items.find(
                ({ id }) => id == e.detail.info.id
            );
            const index = e.detail.items.findIndex(
                (c) => c.id == e.detail.info.id
            );
            if (index == e.detail.items.length - 1) {
                dropped.creature.initiative =
                    e.detail.items[index - 1].creature.initiative;
            } else {
                dropped.creature.initiative =
                    e.detail.items[index + 1].creature.initiative;
            }
        }
        items = e.detail.items;
    }
</script>

<div>
    {#if creatures.length}
        <table class="initiative-tracker-table">
            <thead class="tracker-table-header">
                <th />
                <th class="left">Name</th>
                <th use:hpIcon class="center" />
                <th use:acIcon class="center" />
                <th />
            </thead>
            <tbody
                use:dndzone={{
                    items,
                    flipDurationMs,
                    dropTargetStyle: {},
                    morphDisabled: true
                }}
                on:consider={handleDndConsider}
                on:finalize={handleDndFinalize}
            >
                {#each items as { creature, id } (id)}
                    <tr
                        class="draggable initiative-tracker-creature"
                        class:disabled={!creature.enabled}
                        class:active={items[current].creature == creature}
                        animate:flip={{ duration: flipDurationMs }}
                    >
                        <CreatureTemplate
                            {creature}
                            on:hp={(evt) => dispatch("update-hp", evt.detail)}
                            on:tag={(evt) =>
                                dispatch("update-tags", evt.detail)}
                            {state}
                            active={creatures[current] == creature}
                        />
                    </tr>
                {/each}
            </tbody>
        </table>
    {:else}
        <div class="no-creatures">
            <p>Add a creature to get started!</p>
            <small>Players may be created in settings.</small>
        </div>
    {/if}
</div>

<style>
    .no-creatures {
        margin: 1rem;
        text-align: center;
    }
    .initiative-tracker-table {
        padding: 0.5rem;
        align-items: center;
        gap: 0 0.5rem;
        width: 100%;
        margin-left: 0rem;
        border-collapse: collapse;
    }

    .left {
        text-align: left;
    }
    .center {
        text-align: center;
    }

    .tracker-table-header {
        font-weight: bolder;
        display: contents;
    }

    .initiative-tracker-creature {
        position: relative;
        border-radius: 0.25rem;
    }
    .initiative-tracker-creature.active {
        background-color: rgba(0, 0, 0, 0.1);
    }
    .initiative-tracker-creature.disabled :global(*) {
        color: var(--text-faint);
    }
</style>
