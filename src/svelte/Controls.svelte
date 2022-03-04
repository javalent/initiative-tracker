<script lang="ts">
    import { ExtraButtonComponent } from "obsidian";

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

    import type TrackerView from "src/view";
    import { Menu } from "obsidian";
    import { createEventDispatcher, getContext } from "svelte";
    import type InitiativeTracker from "src/main";

    export let state: boolean = false;
    export let map: boolean = false;

    let view = getContext<TrackerView>("view");

    const playButton = (node: HTMLElement) => {
        new ExtraButtonComponent(node)
            .setIcon(PLAY)
            .setTooltip("Play")
            .onClick(() => {
                view.toggleState();
                state = view.state;
            });
    };
    const stopButton = (node: HTMLElement) => {
        new ExtraButtonComponent(node)
            .setIcon(STOP)
            .setTooltip("Stop")
            .onClick(() => {
                view.toggleState();
                state = view.state;
            });
    };
    const nextButton = (node: HTMLElement) => {
        new ExtraButtonComponent(node)
            .setIcon(FORWARD)
            .setTooltip("Next")
            .onClick(() => {
                view.goToNext();
            });
    };
    const prevButton = (node: HTMLElement) => {
        new ExtraButtonComponent(node)
            .setIcon(BACKWARD)
            .setTooltip("Previous")
            .onClick(() => {
                view.goToPrevious();
            });
    };

    const plugin = getContext<InitiativeTracker>("plugin");

    const open = (evt: MouseEvent) => {
        menu.showAtMouseEvent(evt);
    };
    /* const menu = (node: HTMLElement) => { */
    const menu = new Menu(plugin.app);
    menu.addItem((item) => {
        item.setIcon(NEW)
            .setTitle("New Encounter")
            .onClick(() => view.newEncounter());
    });
    menu.addItem((item) => {
        item.setIcon(REDO)
            .setTitle("Reset HP & Status")
            .onClick(() => view.resetEncounter());
    });
    menu.addItem((item) => {
        item.setIcon(DICE)
            .setTitle("Re-roll Initiatives")
            .onClick(() => view.rollInitiatives());
    });
    if (plugin.data.parties && plugin.data.parties.length) {
        menu.addItem((item) => {
            item.setIcon("switch")
                .setTitle("Switch Party")
                .onClick((evt) => {
                    menu.hide();
                    const partyMenu = new Menu(plugin.app).setNoIcon();
                    for (const party of plugin.data.parties) {
                        partyMenu.addItem((item) => {
                            item.setTitle(party.name)
                                .onClick(() => {
                                    view.switchParty(party.name);
                                })
                                .setDisabled(view.party?.name == party.name);
                        });
                    }
                    partyMenu.showAtMouseEvent(evt);
                });
        });
    }
    menu.addItem((item) => {
        item.setIcon(GROUP)
            .setTitle(view.condense ? "Expand Creatures" : "Group Creatures")
            .onClick(() => {
                view.toggleCondensed();
                item.setIcon(view.condense ? EXPAND : GROUP);
                item.setTitle(
                    view.condense ? "Expand Creatures" : "Group Creatures"
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
    if (map) {
        menu.addSeparator();
        menu.addItem((item) => {
            item.setIcon(MAP)
                .setTitle("Open Leaflet Map")
                .onClick(() => {
                    view.openInitiativeView();
                });
        });
    }

    const menuIcon = (node: HTMLElement) => {
        new ExtraButtonComponent(node).setIcon("vertical-three-dots");
    };
    /* }; */
</script>

<div class="buttons">
    <div class="state">
        {#if state}
            <div use:stopButton />
            <div use:prevButton />
            <div use:nextButton />
        {:else}
            <div use:playButton />
        {/if}
    </div>
    <div class="clean">
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
