<script lang="ts">
    import { ExtraButtonComponent, Menu } from "obsidian";
    import {
        DISABLE,
        ENABLE,
        HIDDEN,
        HP,
        MAPMARKER,
        REMOVE,
        TAG
    } from "src/utils";
    import type { Creature } from "src/utils/creature";
    import type TrackerView from "src/tracker/view";
    import { createEventDispatcher, getContext } from "svelte";
    import type InitiativeTracker from "src/main";
    import { tracker } from "src/tracker/stores/tracker";

    const dispatch = createEventDispatcher();

    export let creature: Creature;

    const plugin = getContext<InitiativeTracker>("plugin");

    const hamburgerIcon = (node: HTMLElement) => {
        const hamburger = new ExtraButtonComponent(node)
            .setIcon("vertical-three-dots")
            .setTooltip("Actions");
        hamburger.extraSettingsEl.onclick = (evt) => {
            evt.stopPropagation();
            const menu = new Menu();
            menu.addItem((item) => {
                item.setIcon(HP)
                    .setTitle("Set Health/Status")
                    .onClick((e: MouseEvent) => {
                        tracker.setUpdate(creature, e);
                    });
            });
            menu.addItem((item) => {
                item.setIcon("pencil")
                    .setTitle("Edit")
                    .onClick(() => {
                        dispatch("edit", creature);
                    });
            });
            if (creature.hidden) {
                menu.addItem((item) => {
                    item.setIcon("eye")
                        .setTitle("Show")
                        .onClick(() => {
                            tracker.updateCreatures({
                                creature,
                                change: { hidden: false }
                            });
                        });
                });
            } else {
                menu.addItem((item) => {
                    item.setIcon(HIDDEN)
                        .setTitle("Hide")
                        .onClick(() => {
                            tracker.updateCreatures({
                                creature,
                                change: { hidden: true }
                            });
                        });
                });
            }
            if (creature.enabled) {
                menu.addItem((item) => {
                    item.setIcon(DISABLE)
                        .setTitle("Disable")
                        .onClick(() => {
                            tracker.updateCreatures({
                                creature,
                                change: { enabled: false }
                            });
                        });
                });
            } else {
                menu.addItem((item) => {
                    item.setIcon(ENABLE)
                        .setTitle("Enable")
                        .onClick(() => {
                            tracker.updateCreatures({
                                creature,
                                change: { enabled: true }
                            });
                        });
                });
            }
            if (plugin.data.leafletIntegration) {
                menu.addItem((item) => {
                    item.setIcon(MAPMARKER)
                        .setTitle("Change Marker")
                        .onClick((evt: MouseEvent) => {
                            const markerMenu = new Menu();
                            markerMenu.setNoIcon();
                            for (let marker of plugin.leaflet.markerIcons) {
                                markerMenu.addItem((item) => {
                                    item.setTitle(marker.type);
                                    item.onClick(() => {
                                        tracker.updateCreatures({
                                            creature,
                                            change: { marker: marker.type }
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
                        tracker.remove(creature);
                    });
            });
            menu.showAtPosition(evt);
        };
    };
</script>

<div class="controls">
    <div class="add-button icon" use:hamburgerIcon />
</div>

<style>
    .controls {
        display: flex;
        justify-content: flex-end;
    }
    .icon :global(.clickable-icon) {
        margin-right: 0;
    }
</style>
