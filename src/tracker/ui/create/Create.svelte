<script lang="ts">
    import {
        ExtraButtonComponent,
        ButtonComponent,
        Notice,
        ToggleComponent
    } from "obsidian";

    import { createEventDispatcher, onMount } from "svelte";

    import { DICE } from "src/utils";
    import { SRDMonsterSuggestionModal } from "src/utils/suggester";
    import { Creature } from "src/utils/creature";
    import type InitiativeTracker from "src/main";
    import type { Writable } from "svelte/store";
    import { equivalent } from "src/encounter";
    import { confirmWithModal } from "./modal";

    let creature: Creature = new Creature({});
    export let amount = 1;
    export let plugin: InitiativeTracker;
    export let adding: Writable<Array<[Creature, number]>>;
    export let editing: Writable<Creature>;
    export let isEditing: boolean;

    editing.subscribe((c) => {
        if (!c) return;
        creature = c;
    });

    const saveButton = (node: HTMLElement) => {
        new ExtraButtonComponent(node)
            .setTooltip("Add Creature")
            .setIcon("plus")
            .onClick(async () => {
                if (!creature || !creature.name || !creature.name?.length) {
                    new Notice("Enter a name!");
                    return;
                }
                if (!creature.modifier) {
                    creature.modifier = 0;
                }
                if (
                    creature.initiative <= 0 ||
                    creature.initiative == null ||
                    isNaN(creature.initiative)
                ) {
                    creature.initiative = await plugin.getInitiativeValue(
                        creature.modifier
                    );
                }

                let existing = $adding.findIndex(([k]) =>
                    equivalent(k, creature)
                );
                if (existing > -1) {
                    $adding[existing][1] += amount;
                } else {
                    $adding.push([creature, amount]);
                }
                $adding = $adding;
                $editing = null;
                creature = new Creature({});
            });
    };
    const editButton = (node: HTMLElement) => {
        new ExtraButtonComponent(node)
            .setTooltip("Add Creature")
            .setIcon("save")
            .onClick(async () => {
                if (!creature || !creature.name || !creature.name?.length) {
                    new Notice("Enter a name!");
                    return;
                }
                if (!creature.modifier) {
                    creature.modifier = 0;
                }
                if (
                    creature.initiative <= 0 ||
                    creature.initiative == null ||
                    isNaN(creature.initiative)
                ) {
                    creature.initiative = await plugin.getInitiativeValue(
                        creature.modifier
                    );
                }
                let existing = $adding.findIndex(
                    ([k]) => k != creature && equivalent(k, creature)
                );
                if (
                    existing > -1 &&
                    (await confirmWithModal(
                        app,
                        `This will merge ${creature.name} with ${$adding[existing][0].name}.`
                    ))
                ) {
                    const index = $adding.findIndex(([k]) => k == creature);
                    $adding[existing][1] += $adding[index][1];
                    $adding.splice(index, 1);
                }
                $adding = $adding;
                $editing = null;
                creature = new Creature({});
            });
    };
    const cancelButton = (node: HTMLElement) => {
        new ExtraButtonComponent(node)
            .setTooltip("Cancel")
            .setIcon("reset")
            .onClick(() => {
                creature = new Creature({});
            });
    };
    const diceButton = (node: HTMLElement) => {
        new ExtraButtonComponent(node)
            .setIcon(DICE)
            .setTooltip("Roll Initiative")
            .onClick(async () => {
                creature.initiative = await plugin.getInitiativeValue(
                    creature.modifier
                );
            });
    };
    let nameInput: HTMLInputElement;
    let modal: SRDMonsterSuggestionModal;
    onMount(() => {
        modal = new SRDMonsterSuggestionModal(plugin, nameInput);
        modal.onClose = async () => {
            if (modal.creature) {
                creature = Creature.from(modal.creature);

                creature.initiative = await plugin.getInitiativeValue(
                    creature.modifier
                );
            }
        };
    });
    const hideToggle = (div: HTMLDivElement) => {
        new ToggleComponent(div)
            .setValue(creature.hidden)
            .onChange((v) => (creature.hidden = v));
    };
    const friendToggle = (div: HTMLDivElement) => {
        new ToggleComponent(div)
            .setValue(creature.friendly)
            .onChange((v) => (creature.friendly = v));
    };
</script>

<div class="initiative-tracker-editor">
    <div class="create-new">
        <div>
            <label for="add-name">Creature</label>
            <input
                bind:this={nameInput}
                bind:value={creature.name}
                on:focus={function () {
                    modal.open();
                }}
                id="add-name"
                type="text"
                name="name"
                tabindex="0"
            />
        </div>
        <div>
            <label for="add-display">Display Name</label>
            <input
                bind:value={creature.display}
                id="add-display"
                type="text"
                name="display"
                tabindex="0"
            />
        </div>
        <div>
            <label for="add-hp">HP</label>
            <input
                bind:value={creature.hp}
                id="add-hp"
                type="number"
                name="hp"
                tabindex="0"
            />
        </div>
        <div>
            <label for="add-hp">Hit Dice</label>
            <input
                bind:value={creature.hit_dice}
                id="add-hp"
                type="text"
                name="hp"
                tabindex="0"
            />
        </div>
        <div>
            <label for="add-ac">AC</label>
            <input
                bind:value={creature.ac}
                on:change={() => creature.dirty_ac=true}
                id="add-ac"
                name="ac"
                type="text"
                tabindex="0"
            />
        </div>
        <div>
            <label for="add-mod">Modifier</label>
            <input
                bind:value={creature.modifier}
                id="add-mod"
                type="number"
                name="ac"
                tabindex="0"
            />
        </div>

        <div class="initiative">
            <label for="add-init">Initiative</label>
            <input
                bind:value={creature.initiative}
                id="add-init"
                type="number"
                name="initiative"
                tabindex="0"
            />
            <div class="dice" use:diceButton />
        </div>

        {#key creature}
            <div>
                <label for="add-mod">Hidden</label>
                <div use:hideToggle />
            </div>
            <div>
                <label for="add-mod">Friendly</label>
                <div use:friendToggle />
            </div>
        {/key}

        <div class="amount">
            <label for="add-init">Amount</label>
            <input
                bind:value={amount}
                id="add-init"
                type="number"
                name="initiative"
                tabindex="0"
            />
        </div>
    </div>
    {#if !isEditing}
        <div class="context-buttons">
            <div use:cancelButton class="add-button cancel-button" />
            {#if $editing}
                <div class="add-button" use:editButton />
            {:else}
                <div class="add-button" use:saveButton />
            {/if}
        </div>
    {/if}
</div>

<style>
    .create-new > * {
        display: grid;
        grid-template-columns: 33% 66%;
        margin-bottom: 0.5rem;
    }
    .context-buttons {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        grid-gap: 0.125rem;
    }
    .cancel-button {
        color: var(--text-faint);
    }

    .initiative {
        position: relative;
    }
    .initiative > .dice {
        position: absolute;
        right: 0.25rem;
        top: 50%;
        transform: translateY(-50%);
    }
</style>
