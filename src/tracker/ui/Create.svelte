<script lang="ts">
    import { ExtraButtonComponent, Notice, ToggleComponent } from "obsidian";

    import { createEventDispatcher, getContext } from "svelte";

    import { DICE, SAVE } from "src/utils";
    import { SRDMonsterSuggestionModal } from "src/utils/suggester";
    import { Creature } from "src/utils/creature";
    import type InitiativeTracker from "src/main";

    const dispatch = createEventDispatcher();

    const plugin = getContext<InitiativeTracker>("plugin");

    export let editing = false;
    export let creature: Creature = new Creature({});
    if (!creature) {
        creature = new Creature({});
    }
    let number: number = 1;

    const saveButton = (node: HTMLElement) => {
        new ExtraButtonComponent(node)
            .setTooltip("Add Creature")
            .setIcon(SAVE)
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
                dispatch("save", { creature: Creature.new(creature), number });
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
            .onClick(async () => {
                creature.initiative = await plugin.getInitiativeValue(
                    creature.modifier
                );
            });
    };
    const openModal = (nameInput: HTMLInputElement) => {
        const modal = new SRDMonsterSuggestionModal(plugin, nameInput);
        modal.onClose = async () => {
            if (modal.creature) {
                creature = Creature.from(modal.creature);

                creature.initiative = await plugin.getInitiativeValue(
                    creature.modifier
                );
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
            bind:value={creature.initiative}
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
