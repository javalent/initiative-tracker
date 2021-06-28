<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { ExtraButtonComponent } from "obsidian";

    import store from "./store";
    import { BACKWARD, DICE, FORWARD, NEW, PLAY, REDO, STOP } from "src/utils";
    import type { Creature } from "src/utils/creature";
    import type TrackerView from "src/view";

    const dispatch = createEventDispatcher();

    let active: boolean = false,
        creatures: Creature[] = [],
        current: Creature,
        view: TrackerView;

    store.creatures.subscribe((value) => {
        creatures = value;
        creatures.sort((a, b) => b.initiative - a.initiative);
    });
    store.current.subscribe((value) => {
        current = value;
    });
    store.view.subscribe((value) => {
        view = value;
    });

    store.active.set(active);

    const playButton = (node: HTMLElement) => {
        new ExtraButtonComponent(node)
            .setIcon(PLAY)
            .setTooltip("Play") /* 
            .setDisabled(numberOfCreatures == 0) */
            .onClick(() => {
                const enabled = creatures.filter((c) => c.enabled);
                store.current.set(enabled[0]);
                active = true;
                store.active.set(active);
                view.plugin.active = active;
            });
    };
    const stopButton = (node: HTMLElement) => {
        new ExtraButtonComponent(node)
            .setIcon(STOP)
            .setTooltip("Stop") /* 
            .setDisabled(numberOfCreatures == 0) */
            .onClick(() => {
                active = false;
                store.active.set(active);
                store.current.set(null);
                view.plugin.active = active;
            });
    };
    const nextButton = (node: HTMLElement) => {
        new ExtraButtonComponent(node)
            .setIcon(FORWARD)
            .setTooltip("Next")
            .onClick(() => {
                const enabled = creatures.filter((c) => c.enabled);
                const index = enabled.indexOf(current);
                const c =
                    (((index + 1) % enabled.length) + enabled.length) %
                    enabled.length;
                store.current.set(enabled[c]);
            });
    };
    const prevButton = (node: HTMLElement) => {
        new ExtraButtonComponent(node)
            .setIcon(BACKWARD)
            .setTooltip("Previous")
            .onClick(() => {
                const enabled = creatures.filter((c) => c.enabled);
                const index = enabled.indexOf(current);
                const c =
                    (((index - 1) % enabled.length) + enabled.length) %
                    enabled.length;
                store.current.set(enabled[c]);
            });
    };

    const restoreButton = (node: HTMLElement) => {
        new ExtraButtonComponent(node)
            .setIcon(REDO)
            .setTooltip("Restart Encounter")
            .onClick(() => {
                for (let creature of creatures) {
                    creature.hp = creature.max;
                    creature.status = new Set();
                }
                store.creatures.set([...creatures]);
            });
    };
    const newButton = (node: HTMLElement) => {
        new ExtraButtonComponent(node)
            .setIcon(NEW)
            .setTooltip("New Encounter")
            .onClick(() => {
                dispatch("new-encounter");
            });
    };

    const diceButton = (node: HTMLElement) => {
        new ExtraButtonComponent(node)
            .setIcon(DICE)
            .setTooltip("Re-roll Initiatives")
            .onClick(() => {
                for (let creature of creatures) {
                    creature.initiative = Math.floor(Math.random() * 19 + 1);
                }
                store.creatures.set([...creatures]);
            });
    };
</script>

<div class="buttons">
    <div class="state">
        {#if active}
            <div use:stopButton />
            <div use:prevButton />
            <div use:nextButton />
        {:else}
            <div use:playButton />
        {/if}
    </div>
    <div class="clean">
        <div use:diceButton />
        <div use:restoreButton />
        <div use:newButton />
    </div>
</div>

<style>
    .buttons {
        display: flex;
        justify-content: space-between;
        padding: 0 0.5rem 0.5rem 0.5rem;
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
