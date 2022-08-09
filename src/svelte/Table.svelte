<script lang="ts">
    import { Menu, setIcon } from "obsidian";
    import { AC, DISABLE, ENABLE, HP, MAPMARKER, REMOVE, TAG } from "src/utils";

    import { flip } from "svelte/animate";
    import { dndzone } from "svelte-dnd-action";

    import CreatureTemplate from "./Creature.svelte";
    import { Creature, getId } from "src/utils/creature";
    import { createEventDispatcher, getContext } from "svelte";
    import type TrackerView from "src/view";

    export let creatures: Creature[] = [];
    export let state: boolean;

    const dispatch = createEventDispatcher();

    const view = getContext<TrackerView>("view");

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
        view.setCreatures(items.map(({ creature }) => creature));
    }

    const openView = (creature: Creature) => {
        view.openCombatant(creature);
    };

    const hamburgerIcon = (evt: MouseEvent, creature: Creature) => {
        evt.stopPropagation();
        const menu = new Menu(view.plugin.app);
        menu.addItem((item) => {
            item.setIcon("pencil")
                .setTitle("Edit")
                .onClick(() => {
                    dispatch("edit", creature);
                });
        });
        if (creature.enabled) {
            menu.addItem((item) => {
                item.setIcon(DISABLE)
                    .setTitle("Disable")
                    .onClick(() => {
                        view.setCreatureState(creature, false);
                    });
            });
        } else {
            menu.addItem((item) => {
                item.setIcon(ENABLE)
                    .setTitle("Enable")
                    .onClick(() => {
                        view.setCreatureState(creature, true);
                    });
            });
        }
        if (view.plugin.data.leafletIntegration) {
            menu.addItem((item) => {
                item.setIcon(MAPMARKER)
                    .setTitle("Change Marker")
                    .onClick((evt) => {
                        const markerMenu = new Menu(view.plugin.app);
                        markerMenu.setNoIcon();
                        for (let marker of view.plugin.leaflet.markerIcons) {
                            markerMenu.addItem((item) => {
                                item.setTitle(marker.type);
                                item.onClick(() => {
                                    view.updateCreature(creature, {
                                        marker: marker.type
                                    });
                                });
                            });
                        }
                        markerMenu.showAtMouseEvent(evt);
                    });
            });
        }
        menu.addItem((item) => {
            item.setIcon(REMOVE)
                .setTitle("Remove")
                .onClick(() => {
                    view.removeCreature(creature);
                });
        });
        menu.showAtPosition(evt);
    };
</script>

<div>
    {#if creatures.length}
        <table class="initiative-tracker-table">
            <thead class="tracker-table-header">
                <th style="width:10%" />
                <th class="left" style="width:55%">Name</th>
                <th style="width:15%" use:hpIcon class="center" />
                <th style="width:15%" use:acIcon class="center" />
                <th style="width:5%" />
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
                        class:active={state && creature.active}
                        class:viewing={creature.viewing}
                        animate:flip={{ duration: flipDurationMs }}
                        data-hp={creature.hp}
                        data-hp-max={creature.max}
                        data-hp-percent={Math.round((((creature.hp ?? 0) / creature.max) * 100) ?? 0)}
                        on:click={() => openView(creature)}
                        on:contextmenu={(evt) => hamburgerIcon(evt, creature)}
                    >
                        <CreatureTemplate {creature} on:hp on:tag on:edit />
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
        gap: 0.25rem 0.5rem;
        width: 100%;
        margin-left: 0rem;
        table-layout: fixed;
        border-collapse: separate;
        border-spacing: 0 2px;
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
    }
    .initiative-tracker-creature.active {
        background-color: rgba(0, 0, 0, 0.1);
    }
    :global(.theme-dark) .initiative-tracker-creature.active {
        background-color: rgba(255, 255, 255, 0.1);
    }
    .initiative-tracker-creature.disabled :global(*) {
        color: var(--text-faint);
    }
    .initiative-tracker-creature :global(td) {
        border-top: 1px solid transparent;
        border-bottom: 1px solid transparent;
    }
    .initiative-tracker-creature :global(td:first-child) {
        border-left: 1px solid transparent;
    }
    .initiative-tracker-creature :global(td:last-child) {
        border-right: 1px solid transparent;
    }
    .initiative-tracker-creature:hover :global(td),
    .initiative-tracker-creature.viewing :global(td) {
        border-top: 1px solid var(--background-modifier-border);
        border-bottom: 1px solid var(--background-modifier-border);
    }
    .initiative-tracker-creature:hover :global(td:first-child),
    .initiative-tracker-creature.viewing :global(td:first-child) {
        border-left: 1px solid var(--background-modifier-border);
    }
    .initiative-tracker-creature:hover :global(td:last-child),
    .initiative-tracker-creature.viewing :global(td:last-child) {
        border-right: 1px solid var(--background-modifier-border);
    }
</style>
