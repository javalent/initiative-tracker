<script lang="ts">
    import { ExtraButtonComponent, Platform } from "obsidian";

    import {
        BACKWARD,
        DICE,
        EXPAND,
        FORWARD,
        GROUP,
        MAP,
        NEW,
        PLAY,
        REDO,
        SAVE,
        STOP
    } from "src/utils";

    import { Menu } from "obsidian";
    import { createEventDispatcher, getContext } from "svelte";
    import type InitiativeTracker from "src/main";

    import { tracker } from "../stores/tracker";

    const { state } = tracker;

    const desktop = Platform.isDesktop;

    const playButton = (node: HTMLElement) => {
        new ExtraButtonComponent(node)
            .setIcon(PLAY)
            .setTooltip("Play")
            .onClick(() => tracker.setState(true));
    };
    const stopButton = (node: HTMLElement) => {
        new ExtraButtonComponent(node)
            .setIcon(STOP)
            .setTooltip("Stop")
            .onClick(() => tracker.setState(false));
    };
    const nextButton = (node: HTMLElement) => {
        new ExtraButtonComponent(node)
            .setIcon(FORWARD)
            .setTooltip("Next")
            .onClick(() => tracker.goToNext());
    };
    const prevButton = (node: HTMLElement) => {
        new ExtraButtonComponent(node)
            .setIcon(BACKWARD)
            .setTooltip("Previous")
            .onClick(() => tracker.goToPrevious());
    };

    const plugin = getContext<InitiativeTracker>("plugin");

    const open = (evt: MouseEvent) => {
        menu.showAtMouseEvent(evt);
    };
    const menu = new Menu();
    menu.addItem((item) => {
        item.setIcon(NEW)
            .setTitle("New Encounter")
            .onClick(() => tracker.new());
    });
    menu.addItem((item) => {
        item.setIcon(REDO)
            .setTitle("Reset HP & Status")
            .onClick(() => tracker.reset());
    });
    menu.addItem((item) => {
        item.setIcon(DICE)
            .setTitle("Re-roll Initiatives")
            .onClick(() => tracker.roll(plugin));
    });
    if (plugin.data.parties && plugin.data.parties.length) {
        menu.addItem((item) => {
            item.setIcon("switch")
                .setTitle("Switch Party")
                .onClick((evt: MouseEvent) => {
                    /* menu.hide(); */
                    const partyMenu = new Menu().setNoIcon();
                    for (const party of plugin.data.parties) {
                        partyMenu.addItem((item) => {
                            item.setTitle(party.name).onClick(() => {
                                tracker.setParty(party.name, plugin);
                            });
                        });
                    }
                    partyMenu.showAtMouseEvent(evt);
                });
        });
    }
    menu.addItem((item) => {
        item.setIcon(GROUP)
            .setTitle(
                /* view.condense */ true
                    ? "Expand Creatures"
                    : "Group Creatures"
            )
            .onClick(async () => {
                plugin.data.condense = !plugin.data.condense;
                tracker.setCondensed(plugin.data.condense);
                await plugin.saveSettings();
                item.setIcon(plugin.data.condense ? EXPAND : GROUP);
                item.setTitle(
                    plugin.data.condense
                        ? "Expand Creatures"
                        : "Group Creatures"
                );
            });
    });

    const dispatch = createEventDispatcher();
    menu.addSeparator();
    menu.addItem((item) => {
        item.setIcon(SAVE)
            .setTitle("Save Encounter")
            .onClick(() => {
                dispatch("save");
            });
    });
    menu.addItem((item) => {
        item.setIcon("open-elsewhere-glyph")
            .setTitle("Load Encounter")
            .onClick(() => {
                dispatch("load");
            });
    });
    if (plugin.data.leafletIntegration) {
        menu.addSeparator();
        menu.addItem((item) => {
            item.setIcon(MAP)
                .setTitle("Open Leaflet Map")
                .onClick(() => dispatch("open-map"));
        });
    }

    const menuIcon = (node: HTMLElement) => {
        new ExtraButtonComponent(node).setIcon("vertical-three-dots");
    };
    const playerView = (node: HTMLElement) => {
        new ExtraButtonComponent(node).setIcon("view");
    };
</script>

<div class="buttons">
    <div class="state">
        {#if $state}
            <div use:stopButton />
            <div use:prevButton />
            <div use:nextButton />
        {:else}
            <div use:playButton />
        {/if}
    </div>
    <div class="clean">
        {#if desktop}
            <div
                use:playerView
                aria-label="Open Player View"
                on:click={(evt) => dispatch("player-view")}
            />
        {/if}
        <div use:menuIcon on:click={(evt) => open(evt)} />
        <!-- <div use:diceButton />
        <div use:restoreButton />
        <div use:newButton />
        {#if map}
            <div use:mapButton />
        {/if} -->
    </div>
</div>

<style>
    .buttons {
        display: flex;
        justify-content: space-between;
        padding: 0 0 0.5rem 0;
    }
    .state {
        display: flex;
        justify-content: flex-start;
        align-items: center;
    }
    .clean {
        display: flex;
        justify-content: flex-end;
        align-items: center;
    }

    .state > *:not(:last-child),
    .clean > *:not(:last-child) {
        margin-right: 0.25rem;
    }
</style>
