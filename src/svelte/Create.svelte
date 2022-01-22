<script lang="ts">
    import { ExtraButtonComponent, Notice } from "obsidian";

    import { createEventDispatcher, getContext } from "svelte";

    import { DICE, SAVE } from "src/utils";
    import type TrackerView from "src/view";
    import { SRDMonsterSuggestionModal } from "src/utils/suggester";
    import { Creature } from "src/utils/creature";

    const dispatch = createEventDispatcher();

    let view = getContext<TrackerView>("view");

    export let editing = false;
    export let name: string = null;
    export let hp: string = null;
    export let initiative: number = null;
    export let ac: string = null;
    export let modifier: number = null;
    let xp: number;
    let player: boolean;
    let level: number;
    let number: number = 1;

    const saveButton = (node: HTMLElement) => {
        new ExtraButtonComponent(node)
            .setTooltip("Add Creature")
            .setIcon(SAVE)
            .onClick(() => {
                if (!name || !name?.length) {
                    new Notice("Enter a name!");
                    return;
                }
                if (!modifier) {
                    modifier = 0;
                }

                dispatch("save", {
                    name,
                    hp,
                    initiative:
                        (initiative ?? Math.floor(Math.random() * 19 + 1)) -
                        modifier,
                    ac,
                    modifier,
                    xp,
                    player,
                    level,
                    number: Number(number)
                });
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
                    Math.floor(Math.random() * 19 + 1) + (modifier ?? 0);
            });
    };
    const openModal = (nameInput: HTMLInputElement) => {
        const modal = new SRDMonsterSuggestionModal(view.plugin, nameInput);
        modal.onClose = async () => {
            if (modal.creature) {
                let newCreature = Creature.from(modal.creature);

                name = newCreature.name;
                if (newCreature.hp) hp = `${newCreature.hp}`;
                if (newCreature.ac) ac = `${newCreature.ac}`;
                modifier = newCreature.modifier ?? 0;
                xp = newCreature.xp;

                player = newCreature.player;
                level = newCreature.level;

                initiative = await view.getInitiativeValue(modifier);
            }
        };
        modal.open();
    };
</script>

<div class="create-new">
    <div>
        <label for="add-name">Name</label>
        <input
            bind:value={name}
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
        <label for="add-hp">HP</label>
        <input
            bind:value={hp}
            id="add-hp"
            type="number"
            name="hp"
            tabindex="0"
        />
    </div>
    <div>
        <label for="add-ac">AC</label>
        <input
            bind:value={ac}
            id="add-ac"
            type="number"
            name="ac"
            tabindex="0"
        />
    </div>
    <div>
        <label for="add-mod">Modifier</label>
        <input
            bind:value={modifier}
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
