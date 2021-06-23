<script lang="ts">
    import { onMount } from "svelte";
    import { ExtraButtonComponent } from "obsidian";
    import {
        INITIATIVE_TRACKER_PLAY,
        INITIATIVE_TRACKER_STOP
    } from "src/utils";

    export let creatures: any[] = [];
    export let state = false;

    let top: HTMLElement;
    const stateButton = new ExtraButtonComponent(createDiv())
        .setIcon(state ? INITIATIVE_TRACKER_STOP : INITIATIVE_TRACKER_PLAY)
        .setTooltip(state ? "Stop" : "Play")
        .setDisabled(creatures.length == 0)
        .onClick(() => {
            state = !state;
        });
    onMount(() => top.appendChild(stateButton.extraSettingsEl));

    $: {
        console.log(creatures);
        stateButton
            .setIcon(state ? INITIATIVE_TRACKER_STOP : INITIATIVE_TRACKER_PLAY)
            .setTooltip(state ? "Stop" : "Play")
            .setDisabled(creatures.length == 0);
    }
</script>

<div bind:this={top} class="buttons" />

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
