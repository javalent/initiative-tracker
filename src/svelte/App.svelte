<svelte:options accessors={true} />

<script lang="ts">
    import { createEventDispatcher } from "svelte";

    import Controls from "./Controls.svelte";
    import Table from "./Table.svelte";
    import Create from "./Create.svelte";

    import store from "./store";
    import type TrackerView from "src/view";

    import { Creature } from "src/utils/creature";
    import { ExtraButtonComponent } from "obsidian";

    export let creatures: Creature[] = [];
    export let view: TrackerView;
    export let state: boolean;
    export let current: number;

    const dispatch = createEventDispatcher();

    store.view.set(view);

    export let show: boolean;

    let updatingHP: Creature;
    const updateHP = (toAdd: number) => {
        view.updateCreature(updatingHP, { hp: -1 * toAdd });
        updatingHP = null;
    };

    let updatingStatus: Creature;
    const addStatus = (tag: string) => {
        view.addStatus(updatingStatus, tag);
        updatingStatus = null;
    };

    let addNew = false;
    const addButton = (node: HTMLElement) => {
        new ExtraButtonComponent(node)
            .setTooltip("Add Creature")
            .setIcon("plus-with-circle")
            .onClick(() => {
                addNew = true;
            });
    };
</script>

<div class="obsidian-initiative-tracker">
    <Controls on:new-encounter={() => dispatch("new-encounter")} />
    <Table
        {creatures}
        {show}
        {state}
        {current}
        on:update-hp={(evt) => {
            updatingHP = evt.detail;
        }}
        on:update-tags={(evt) => {
            updatingStatus = evt.detail;
        }}
    />
    {#if updatingHP}
        <div class="updating-hp">
            <span>Apply damage or healing:</span>
            <!-- svelte-ignore a11y-autofocus -->
            <input
                type="number"
                autofocus
                on:blur={function (evt) {
                    updateHP(this.value);
                }}
                on:keydown={function (evt) {
                    if (evt.key === "Enter" || evt.key === "Tab") {
                        evt.preventDefault();
                        this.blur();
                        return;
                    }
                    if (evt.key === "Escape") {
                        this.value = "";
                        this.blur();
                        return;
                    }
                    if (
                        !/^(-?\d*\.?\d*|Backspace|Delete|Arrow\w+)$/.test(
                            evt.key
                        )
                    ) {
                        evt.preventDefault();
                        return false;
                    }
                }}
            />
        </div>
    {:else if updatingStatus}
        <div class="updating-hp">
            <span>Apply status:</span>
            <!-- svelte-ignore a11y-autofocus -->
            <input
                type="text"
                autofocus
                on:blur={function (evt) {
                    if (!this.value.length) return;
                    addStatus(this.value);
                }}
                on:keydown={function (evt) {
                    if (evt.key === "Enter" || evt.key === "Tab") {
                        evt.preventDefault();
                        this.blur();
                        return;
                    }
                    if (evt.key === "Escape") {
                        this.value = "";
                        this.blur();
                        return;
                    }
                }}
            />
        </div>
    {:else}
        <div class="add-creature-container">
            {#if addNew}
                <Create
                    on:cancel={() => {
                        addNew = false;
                    }}
                    on:save={(evt) => {
                        addNew = false;
                        const creature = evt.detail;
                        view.addCreatures(
                            new Creature({
                                name: creature.name,
                                hp: creature.hp,
                                initiative: creature.initiative,
                                ac: creature.ac,
                                modifier: creature.modifier
                            })
                        );
                    }}
                />
            {:else}
                <div use:addButton class="add-button" />
            {/if}
        </div>
    {/if}
</div>

<style>
    .obsidian-initiative-tracker {
        margin: 0.5rem;
        min-width: 180px;
    }

    .add-creature-container {
        display: flex;
        flex-flow: column nowrap;
        justify-content: flex-start;
        height: 25px;
        margin-right: 0.5rem;
    }
    .add-button {
        align-self: flex-end;
    }
</style>
