<svelte:options accessors={true} />

<script lang="ts">
    import Controls from "./Controls.svelte";
    import Table from "./Table.svelte";
    import Create from "./Create.svelte";

    import store from "./store";
    import type TrackerView from "src/view";

    import { Creature } from "src/utils/creature";
    import { ExtraButtonComponent } from "obsidian";
    import { ADD, COPY } from "src/utils";
    import { ConditionSuggestionModal } from "src/utils/suggester";
    import type { Condition } from "@types";
    import { createEventDispatcher } from "svelte";

    const dispatch = createEventDispatcher();

    export let creatures: Creature[] = [];
    export let view: TrackerView;
    export let name: string = null;
    export let state: boolean;
    export let current: number;
    export let map: boolean;

    store.view.set(view);
    export let show: boolean;

    export let updatingHP: Creature = null;
    const updateHP = (toAdd: number) => {
        view.updateCreature(updatingHP, { hp: -1 * toAdd });
        updatingHP = null;
    };

    export let updatingStatus: Creature = null;
    const addStatus = (tag: Condition) => {
        view.addStatus(updatingStatus, tag);
        updatingStatus = null;
    };

    let addNew = false;
    export let addNewAsync = false;
    const addButton = (node: HTMLElement) => {
        new ExtraButtonComponent(node)
            .setTooltip("Add Creature")
            .setIcon(ADD)
            .onClick(() => {
                addNew = true;
            });
    };
    const copyButton = (node: HTMLElement) => {
        new ExtraButtonComponent(node)
            .setTooltip("Copy Initiative Order")
            .setIcon(COPY)
            .onClick(async () => {
                await view.copyInitiativeOrder();
            });
    };
    let modal: ConditionSuggestionModal;
    const suggestConditions = (node: HTMLInputElement) => {
        modal = new ConditionSuggestionModal(view.plugin, node);
        modal.onClose = () => {
            node.blur();
        };
        modal.open();
    };
    function init(el: HTMLInputElement) {
        el.focus();
    }
</script>

<div class="obsidian-initiative-tracker">
    <Controls {state} {map} />
    {#if name && name.length}
        <h2 class="initiative-tracker-name">{name}</h2>
    {/if}
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
            <span>Apply damage(+) or healing(-):</span>
            <!-- svelte-ignore a11y-autofocus -->
            <input
                type="number"
                on:blur={function (evt) {
                    updateHP(Number(this.value));
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
                use:init
            />
        </div>
    {:else if updatingStatus}
        <div class="updating-hp">
            <span>Apply status:</span>
            <!-- svelte-ignore a11y-autofocus -->
            <input
                type="text"
                on:focus={function (evt) {
                    suggestConditions(this);
                }}
                on:blur={function (evt) {
                    if (!this.value.length) {
                        updatingStatus = null;
                        return;
                    }

                    addStatus(modal.condition);
                }}
                on:keydown={function (evt) {
                    if (evt.key === "Escape") {
                        this.value = "";
                        this.blur();
                        return;
                    }
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
                use:init
            />
        </div>
    {:else}
        <div class="add-creature-container">
            {#if addNew || addNewAsync}
                <Create
                    on:cancel={() => {
                        addNew = false;
                        addNewAsync = false;
                        dispatch("cancel-add-new-async");
                    }}
                    on:save={(evt) => {
                        const creature = evt.detail;
                        const newCreature = new Creature(
                            {
                                name: creature.name,
                                hp: creature.hp,
                                ac: creature.ac,
                                modifier: creature.modifier,
                                marker: view.plugin.data.monsterMarker
                            },
                            creature.initiative
                        );
                        if (addNewAsync) {
                            dispatch("add-new-async", newCreature);
                        } else {
                            view.addCreatures(newCreature);
                        }
                        addNew = false;
                        addNewAsync = false;
                    }}
                />
            {:else}
                <div class="context-container">
                    <div use:copyButton class="copy-button" />
                    <div use:addButton class="add-button" />
                </div>
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
        margin-right: 0.5rem;
    }
    .context-container {
        display: flex;
        flex-flow: row nowrap;
        justify-content: space-between;
    }
    .copy-button {
        width: min-content;
        opacity: 0.25;
    }
    .copy-button:hover {
        opacity: 1;
    }
    .add-button {
        width: min-content;
    }
    .initiative-tracker-name {
        margin: 0;
        padding-left: 0.75rem;
    }
</style>
