<script lang="ts">
    import Controls from "./Controls.svelte";
    import Table from "./Table.svelte";
    import Create from "./Create.svelte";
    import type TrackerView from "src/view";
    import { Creature } from "src/utils/creature";
    import { ExtraButtonComponent, setIcon } from "obsidian";
    import { ADD, COPY, HP, TAG, REMOVE } from "src/utils";
    import { ConditionSuggestionModal } from "src/utils/suggester";
    import type { Condition } from "@types";
    import { createEventDispatcher } from "svelte";
    import type InitiativeTracker from "src/main";
    import { setContext } from "svelte";
    import Difficulty from "./Difficulty.svelte";
    import SaveEncounter from "./SaveEncounter.svelte";
    import LoadEncounter from "./LoadEncounter.svelte";

    const dispatch = createEventDispatcher();

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

    const hpIcon = (node: HTMLElement) => {
        setIcon(node, HP);
    };
    const tagIcon = (node: HTMLElement) => {
        setIcon(node, TAG);
    };
    const removeIcon = (node: HTMLElement) => {
        setIcon(node, REMOVE);
    };

    let damage: string = "";
    let status: Condition = null;
    let updatingCreatures: { [key: string]: any }[] = [];
    const updateCreatures = (toAddString: string, tag: Condition) => {
        const roundHalf = !toAddString.includes(".");

        updatingCreatures.forEach((entry) => {
            const modifier =
                (entry.saved ? 0.5 : 1) *
                (entry.resist ? 0.5 : 1) *
                Number(entry.customMod);

            if (toAddString.charAt(0) == "t") {
                let toAdd = Number(toAddString.slice(1));
                view.updateCreature(entry.creature, { temp: toAdd });
            } else {
                let toAdd = Number(toAddString);
                toAdd =
                    -1 *
                    Math.sign(toAdd) *
                    Math.max(Math.abs(toAdd) * modifier, 1);
                toAdd = roundHalf ? Math.trunc(toAdd) : toAdd;
                view.updateCreature(entry.creature, { hp: toAdd });
                tag && !entry.saved && view.addStatus(entry.creature, tag);
            }
        });
        closeUpdateCreatures();
    };

    const closeUpdateCreatures = () => {
        updatingCreatures.length = 0;
        damage = "";
        status = null;
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
            status = modal.condition;
            node.focus();
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
        {state}
        on:hp={(evt) => {            
            let index = updatingCreatures.findIndex(
                (entry) => entry.creature == evt.detail.creature
            );
            if (index == -1) {
                updatingCreatures = [
                    ...updatingCreatures,
                    {
                        creature: evt.detail.creature,
                        saved: evt.detail.shift,
                        resist: evt.detail.ctrl,
                        customMod: evt.detail.alt ? "2" : "1"
                    }
                ];
                console.log(updatingCreatures);
            } else {
                updatingCreatures.splice(index, 1);
            }
            updatingCreatures = updatingCreatures;
        }}
        on:edit={(evt) => {
            editCreature = evt.detail;
        }}
    />
    {#if plugin.data.displayDifficulty && !updatingCreatures.length}
        <Difficulty {creatures} />
    {/if}
    <!-- This is disgusting. TODO: Fix it! -->
    {#if updatingCreatures.length}
        <div class="updating-hp">
            <!-- svelte-ignore a11y-autofocus -->
            <tag
                use:hpIcon
                aria-label="Apply damage, healing(-) or temp HP(t)"
                style="margin: 0 0.2rem 0 0.7rem"
            />
            <input
                type="text"
                bind:value={damage}
                on:keydown={function (evt) {
                    if (evt.key === "Enter") {
                        evt.preventDefault();
                        updateCreatures(damage, status);
                        return;
                    }
                    if (evt.key === "Escape") {
                        closeUpdateCreatures();
                        return;
                    }
                    if (
                        !/^(t?-?\d*\.?\d*(Backspace|Delete|Arrow\w+)?)$/.test(
                            this.value + evt.key
                        )
                    ) {
                        evt.preventDefault();
                        return false;
                    }
                }}
                use:init
            />
            <br />
            <tag
                use:tagIcon
                aria-label="Apply status effect to creatures that fail their saving throw"
                style="margin: 0 0.2rem 0 0.7rem"
            />
            <input
                type="text"
                on:focus={function (evt) {
                    suggestConditions(this);
                }}
                on:keydown={function (evt) {
                    if (evt.key === "Escape") {
                        closeUpdateCreatures();
                        return;
                    }
                    if (evt.key === "Enter") {
                        evt.preventDefault();
                        updateCreatures(damage, status);
                        return;
                    }
                }}
            />
        </div>
        <div style="margin: 0.5rem">
            <table class="updating-creature-table">
                <thead class="updating-creature-table-header">
                    <th style="padding:0 0.2rem 0 0; cursor:pointer" class="left" use:removeIcon on:click={closeUpdateCreatures}/>
                    <th style="width:100%" class="left">Name</th>
                    <th style="padding:0 0.2rem" class="center">Saved</th>
                    <th style="padding:0 0.2rem" class="center">Resist</th>
                    <th style="padding:0 0.2rem" class="center">Modifier</th>
                </thead>
                <tbody>
                    {#each updatingCreatures as { creature, saved, resist, customMod }, i}
                        <tr class="updating-creature-table-row">
                            <td 
                                use:removeIcon
                                on:click={function (evt) {
                                    updatingCreatures.splice(i, 1);
                                    updatingCreatures = updatingCreatures;
                                }}
                                style="cursor:pointer"
                            />
                            <td>
                                <span>{creature.name + (creature.number ? (" " + creature.number) : "")}</span>
                            </td>
                            <td class="center">
                                <input
                                    type="checkbox"
                                    checked={saved}
                                    on:click={function (evt) {
                                        saved = !saved;
                                    }}
                                />
                            </td>
                            <td class="center">
                                <input
                                    type="checkbox"
                                    checked={resist}
                                    on:click={function (evt) {
                                        resist = !resist;
                                    }}
                                />
                            </td>
                            <td class="center">
                                <input
                                    type="number"
                                    class="center"
                                    style="width:90%; height:80%; padding:0;"
                                    bind:value={customMod}
                                    on:keydown={function (evt) {
                                        if (evt.key === "Escape") {
                                            this.value = "1";
                                            return;
                                        }
                                        if (evt.key === "Enter") {
                                            evt.preventDefault();
                                            return;
                                        }
                                    }}
                                />
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
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
    .left {
        text-align: left;
    }
    .center {
        text-align: center;
    }

    .obsidian-initiative-tracker {
        margin: 0 0.5rem;
        min-width: 180px;
    }
    .initiative-tracker-round-container {
        padding: 0 0.5rem;
    }
    .initiave-tracker-party {
        padding: 0 0.5rem;
        margin: 0 0 1rem 0;
    }
    .updating-creature-table-row {
        font-size: small;
        height: 80%;
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
        margin: 0;
    }
    .initiative-tracker-name {
        margin: 0;
    }
</style>
