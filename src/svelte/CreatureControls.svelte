<script lang="ts">
    import { ExtraButtonComponent, Menu } from "obsidian";
    import type InitiativeTracker from "src/main";
    import { DISABLE, ENABLE, MAPMARKER, REMOVE, TAG } from "src/utils";
    import type { Creature } from "src/utils/creature";
    import type TrackerView from "src/view";
    import { createEventDispatcher } from "svelte";

    const dispatch = createEventDispatcher();

    export let view: TrackerView;
    export let creature: Creature;


    const hamburgerIcon = (node: HTMLElement) => {
        const hamburger = new ExtraButtonComponent(node)
            .setIcon("vertical-three-dots")
            .setTooltip("Actions");
        hamburger.extraSettingsEl.onclick = (evt) => {
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
                            for (let marker of view.plugin.leaflet
                                .markerIcons) {
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
    };
</script>

<div class="controls">
    <div class="add-button icon" use:hamburgerIcon />
    <!--       <div class="add-button icon" class:show use:hamburgerIcon />
         <div class="add-button tags" class:show={!show} use:tagButton />
        {#if creature.enabled}
            <div
                class="add-button enable"
                class:show={!show}
                use:disableButton
            />
        {:else}
            <div
                class="add-button enable"
                class:show={!show}
                use:enableButton
            />
        {/if}
        {#if view.plugin.data.leafletIntegration}
            <div
                class="add-button marker"
                class:show={!show}
                use:markerButton
            />
        {/if}
        <div class="add-button delete" class:show={!show} use:deleteButton /> -->
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
