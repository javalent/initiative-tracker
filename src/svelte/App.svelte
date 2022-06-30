<script lang="ts">
    import Controls from "./Controls.svelte";
    import Table from "./Table.svelte";
    import Create from "./Create.svelte";
    import type TrackerView from "src/view";
    import { Creature } from "src/utils/creature";
    import { ExtraButtonComponent } from "obsidian";
    import { ADD, COPY } from "src/utils";
    import { ConditionSuggestionModal } from "src/utils/suggester";
    import type { Condition } from "@types";
    import { createEventDispatcher } from "svelte";
    import type InitiativeTracker from "src/main";
    import { setContext } from "svelte";
    import Difficulty from "./Difficulty.svelte";
    import SaveEncounter from "./SaveEncounter.svelte";
    import LoadEncounter from "./LoadEncounter.svelte";

    const dispatch = createEventDispatcher();

    let multiSelect = false;

    export let creatures: Creature[] = [];
    export let name: string = null;
    export let state: boolean;
    export let xp: number;
    export let plugin: InitiativeTracker;
    export let view: TrackerView;
    export let round: number;
    export let party: string = null;

    export let map = plugin.data.leafletIntegration;

    setContext("plugin", plugin);
    setContext("view", view);

    let totalXP = xp;
    $: {
        if (!xp) {
            totalXP = creatures
                ?.filter((creature) => creature.xp)
                ?.reduce((num, cr) => num + cr.xp, 0);
        }
    }

    let updatingHP: Creature[] = [];
    let halfMod: number[] = [];
    const updateHP = (toAddString: string) => {
        const roundHalf = !toAddString.includes(".");

        updatingHP.forEach((creature, index) => {
            let toAdd = -1 * Number(toAddString) * halfMod[index];
            toAdd = roundHalf ? Math.trunc(toAdd) : toAdd;
            view.updateCreature(creature, { hp: toAdd });
        })

        updatingHP.length = 0;
        halfMod.length = 0;
    };

    export let updatingStatus: Creature = null;
    const addStatus = (tag: Condition) => {
        view.addStatus(updatingStatus, tag);
        updatingStatus = null;
    };

    let addNew = false;
    export let addNewAsync = false;
    let editCreature: Creature = null;
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
                const contents = creatures
                    .map(
                        (creature) => `${creature.initiative} ${creature.name}`
                    )
                    .join("\n");
                await navigator.clipboard.writeText(contents);
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

    let saving = false;
    let loading = false;
</script>

<div class="obsidian-initiative-tracker">
    {#if party}
        <h4 class="initiave-tracker-party">{party}</h4>
    {/if}
    <Controls
        {state}
        {map}
        on:save={() => (saving = true)}
        on:load={() => (loading = true)}
    />
    {#if state}
        <div class="initiative-tracker-round-container">
            <small>
                <em>
                    Round {round}
                </em>
            </small>
        </div>
    {/if}
    {#if name && name.length}
        <div class="initiative-tracker-name-container">
            <h2 class="initiative-tracker-name">{name}</h2>
            {#if totalXP > 0}
                <span class="initiative-tracker-xp encounter-xp"
                    >{totalXP} XP</span
                >
            {/if}
        </div>
    {/if}
    <Table
        {creatures}
        {updatingHP}
        {state}
        on:hp={(evt) => {
            multiSelect = evt.detail.ctrl;
            let index = updatingHP.findIndex(creature => creature == evt.detail.creature)
            if (index == -1) {
                if (!multiSelect) {
                    updatingHP.length = 0;
                    halfMod.length = 0;
                }
                updatingHP.push(evt.detail.creature);
                halfMod.push(evt.detail.shift ? 0.5 : 1);
            }
            else if (index >= 0 && multiSelect) {
                updatingHP.splice(index, 1);
                halfMod.splice(index, 1);
            }
            else if (!multiSelect) {
                updatingHP.length = 0;
                halfMod.length = 0;
            }
        }}
        on:tag={(evt) => {
            updatingStatus = evt.detail;
        }}
        on:edit={(evt) => {
            editCreature = evt.detail;
        }}
    />
    {#if plugin.data.displayDifficulty}
        <Difficulty {creatures} />
    {/if}
    <!-- This is disgusting. TODO: Fix it! -->
    {#if updatingHP.length}
        <div class="updating-hp">
            <span>Apply damage(+) or healing(-):</span>
            <!-- svelte-ignore a11y-autofocus -->
            <input
                type="number"
                on:keydown={function (evt) {
                    if (evt.key === "Enter" || evt.key === "Tab") {
                        evt.preventDefault();
                        updateHP(this.value);
                        return;
                    }
                    if (evt.key === "Escape") {
                        this.value = "";
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
    {:else if saving}
        <SaveEncounter {name} on:cancel={() => (saving = false)} />
    {:else if loading}
        <LoadEncounter on:cancel={() => (loading = false)} />
    {:else}
        <div class="add-creature-container">
            {#if editCreature || addNew || addNewAsync}
                <Create
                    editing={editCreature != null}
                    name={editCreature?.name}
                    display={editCreature?.display}
                    hp={`${editCreature?.hp}`}
                    initiative={editCreature?.initiative}
                    modifier={editCreature?.modifier}
                    ac={`${editCreature?.ac}`}
                    on:cancel={() => {
                        addNew = false;
                        addNewAsync = false;
                        editCreature = null;
                        dispatch("cancel-add-new-async");
                    }}
                    on:save={(evt) => {
                        const creature = evt.detail;
                        const newCreature = new Creature(
                            {
                                name: creature.name,
                                display: creature.display,
                                hp: creature.hp,
                                ac: creature.ac,
                                modifier: creature.modifier,
                                marker: view.plugin.data.monsterMarker,
                                xp: creature.xp,
                                player: creature.player,
                                level: creature.level
                            },
                            creature.initiative
                        );
                        if (addNewAsync) {
                            dispatch("add-new-async", newCreature);
                        } else if (editCreature) {
                            editCreature.name = creature.name;
                            editCreature.ac = creature.ac;
                            editCreature.display = creature.display;
                            editCreature.initiative = creature.initiative;
                            editCreature.modifier = creature.modifier;
                            view.updateCreature(editCreature, {
                                name: creature.name
                            });
                        } else {
                            const number = Math.max(
                                isNaN(creature.number) ? 1 : creature.number,
                                1
                            );
                            view.addCreatures(
                                [...Array(number).keys()].map((k) =>
                                    Creature.new(newCreature)
                                )
                            );
                        }
                        addNew = false;
                        addNewAsync = false;
                        editCreature = null;
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
    .initiative-tracker-round-container,
    .initiave-tracker-party {
        padding: 0 0.5rem;
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
    .add-button :global(.clickable-icon) {
        margin: 0;
    }
    .initiative-tracker-name-container {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0 0.5rem;
    }
    .initiative-tracker-name {
        margin: 0;
    }
</style>
