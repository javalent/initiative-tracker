<script lang="ts">
    import { ExtraButtonComponent, Notice, ToggleComponent } from "obsidian";

    import { createEventDispatcher, getContext } from "svelte";

    import { DICE, SAVE } from "src/utils";
    import type TrackerView from "src/view";
    import { SRDMonsterSuggestionModal } from "src/utils/suggester";
    import { Creature } from "src/utils/creature";

    const dispatch = createEventDispatcher();

    let view = getContext<TrackerView>("view");

    export let editing = false;
    export let creature: Creature = new Creature({});
    if (!creature) {
        creature = new Creature({})
    }
    let initiative = creature.initiative;
    let xp: number;
    let player: boolean;
    let level: number;
    let number: number = 1;

    const saveButton = (node: HTMLElement) => {
        new ExtraButtonComponent(node)
            .setTooltip("Add Creature")
            .setIcon(SAVE)
            .onClick(() => {
                if (!creature || !creature.name || !creature.name?.length) {
                    new Notice("Enter a name!");
                    return;
                }
                if (!creature?.modifier) {
                    creature.modifier = 0;
                }
                if (!creature?.initiative) {
                    creature.initiative =
                        (initiative ?? Math.floor(Math.random() * 19 + 1)) -
                        creature.modifier;
                }
                dispatch("save", Creature.new(creature));
            });
    };
    const cancelButton = (node: HTMLElement) => {
        new ExtraButtonComponent(node)
            .setTooltip("Cancel")
            .setIcon("cross")
            .onClick(() => {
                dispatch("cancel");
            });
    };
    const diceButton = (node: HTMLElement) => {
        new ExtraButtonComponent(node)
            .setIcon(DICE)
            .setTooltip("Roll Initiative")
            .onClick(() => {
                initiative =
                    Math.floor(Math.random() * 19 + 1) +
                    (creature.modifier ?? 0);
            });
    };
    const openModal = (nameInput: HTMLInputElement) => {
        const modal = new SRDMonsterSuggestionModal(view.plugin, nameInput);
        modal.onClose = async () => {
            if (modal.creature) {
                creature = Creature.from(modal.creature);
                console.log(
                    "🚀 ~ file: Create.svelte ~ line 70 ~ creature",
                    creature
                );

                initiative = await view.getInitiativeValue(creature.modifier);
            }
        };
        modal.open();
    };
    const hideToggle = (div: HTMLDivElement) => {
        new ToggleComponent(div)
            .setValue(creature.hidden)
            .onChange((v) => (creature.hidden = v));
    };
</script>

<div class="create-new">
    <div>
        <label for="add-name">Creature</label>
        <input
            bind:value={creature.name}
            on:focus={function () {
                openModal(this);
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
        <label for="add-ac">AC</label>
        <input
            bind:value={creature.ac}
            id="add-ac"
            type="number"
            name="ac"
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
            bind:value={initiative}
            id="add-init"
            type="number"
            name="initiative"
            tabindex="0"
        />
        <div class="dice" use:diceButton />
    </div>

    <div>
        <label for="add-mod">Hidden</label>
        <div use:hideToggle />
    </div>
    {#if !editing}
        <div class="amount">
            <label for="add-init">Amount</label>
            <input
                bind:value={number}
                id="add-init"
                type="number"
                name="initiative"
                tabindex="0"
            />
        </div>
    {/if}
</div>
<div class="context-buttons">
    <div class="add-button" use:saveButton />
    <div use:cancelButton class="add-button cancel-button" />
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
