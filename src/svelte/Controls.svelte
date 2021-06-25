<script lang="ts">
    import { ExtraButtonComponent } from "obsidian";

    import store, { creatures } from "./store";
    import { BACKWARD, FORWARD, PLAY, STOP } from "src/utils";

    /* export let numberOfCreatures: number = 0; */

    let active: boolean = false,
        current = 0,
        numberOfCreatures = 0;
    store.current.subscribe((value) => {
        current = value;
    });
    store.creatures.subscribe((value) => {
        numberOfCreatures = value.length;
    });
    store.active.set(active);

    let button: ExtraButtonComponent;
    const playButton = (node: HTMLElement) => {
        new ExtraButtonComponent(node)
            .setIcon(PLAY)
            .setTooltip("Play") /* 
            .setDisabled(numberOfCreatures == 0) */
            .onClick(() => {
                active = true;
                store.current.set(0);
                store.active.set(active);
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
            });
    };
    const nextButton = (node: HTMLElement) => {
        new ExtraButtonComponent(node)
            .setIcon(FORWARD)
            .setTooltip("Next")
            .onClick(() => {
                const c =
                    (((current + 1) % numberOfCreatures) + numberOfCreatures) %
                    numberOfCreatures;
                store.current.set(c);
            });
    };
    const prevButton = (node: HTMLElement) => {
        new ExtraButtonComponent(node)
            .setIcon(BACKWARD)
            .setTooltip("Previous")
            .onClick(() => {
                const c =
                    (((current - 1) % numberOfCreatures) + numberOfCreatures) %
                    numberOfCreatures;
                store.current.set(c);
            });
    };
</script>

<div class="buttons">
    {#if active}
        <div use:stopButton />
        <div use:prevButton />
        <div use:nextButton />
    {:else}
        <div use:playButton />
    {/if}
</div>

<style>
    .buttons {
        display: flex;
        justify-content: flex-start;
        align-items: center;
    }

    .buttons > *:not(:last-child) {
        margin-right: 0.25rem;
    }
</style>
