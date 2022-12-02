<script lang="ts">
    import { ButtonComponent, Platform } from "obsidian";
    import type InitiativeTracker from "src/main";
    import { tracker } from "src/tracker/stores/tracker";
    import { Creature } from "src/utils/creature";
    import { createEventDispatcher } from "svelte";
    import { writable } from "svelte/store";
    import Create from "./Create.svelte";
    import List from "./List.svelte";

    const dispatch = createEventDispatcher();

    export let plugin: InitiativeTracker;
    export let isEditing = false;
    export let creature = null;

    const adding = writable<Array<[Creature, number]>>([]);
    const editing = writable<Creature>(creature);

    const cancel = (node: HTMLElement) => {
        new ButtonComponent(node)
            .setCta()
            .setButtonText("Cancel")
            .onClick(() => {
                dispatch("close");
            });
    };

    const add = (node: HTMLElement) => {
        new ButtonComponent(node).setButtonText("Add Creatures").onClick(() => {
            const creatures = $adding.flatMap(([creature, amount]) =>
                [...Array(amount).keys()].map((k) => Creature.new(creature))
            );

            tracker.add(...creatures);
            dispatch("close");
        });
    };
</script>

<div
    class="initiative-tracker-creator-container"
    class:mobile={Platform.isMobileApp}
>
    <div class="initiative-tracker-creator">
        <Create {plugin} {editing} {adding} />
        {#if !isEditing}
            <List {adding} {editing} />
        {/if}
    </div>
    <div class="buttons">
        <div use:cancel />
        <div use:add />
    </div>
</div>

<style scoped>
    .initiative-tracker-creator {
        margin-top: 1rem;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.5rem;
    }
    .buttons {
        display: flex;
        margin-left: auto;
        justify-content: center;
        gap: 0.5rem;
    }
</style>
