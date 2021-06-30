<script lang="ts">
    import { ExtraButtonComponent, Notice } from "obsidian";

    import { onMount } from "svelte";
    import { createEventDispatcher } from "svelte";

    import { DICE, SAVE } from "src/utils";

    import store from "./store";

    import type TrackerView from "src/view";
    import { SRDMonsterSuggestionModal } from "src/utils/suggester";
    import type { SRDMonster } from "@types";

    const dispatch = createEventDispatcher();

    let view: TrackerView;
    store.view.subscribe((v) => (view = v));

    let name: string;
    let hp: string;
    let initiative: number;
    let ac: string;
    let modifier: number = 0;

    const saveButton = (node: HTMLElement) => {
        new ExtraButtonComponent(node)
            .setTooltip("Add Creature")
            .setIcon(SAVE)
            .onClick(() => {
                if (!name || !name.length) {
                    new Notice("Enter a name!");
                    return;
                }

                dispatch("save", {
                    name,
                    hp,
                    initiative:
                        (initiative ?? Math.floor(Math.random() * 19 + 1)) -
                        modifier,
                    ac,
                    modifier
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
                initiative = Math.floor(Math.random() * 19 + 1) + modifier;
            });
    };

    let nameInput: HTMLInputElement;

    let modal: SRDMonsterSuggestionModal;
    onMount(() => {
        modal = new SRDMonsterSuggestionModal(view.plugin, nameInput);
        modal.onClose = () => {
            if (modal.creature) {
                name = modal.creature.name;
                hp = `${modal.creature.hp}`;
                ac = `${modal.creature.ac}`;
                modifier = 0;
                if ((<SRDMonster>modal.creature).stats) {
                    const dex = ((<SRDMonster>modal.creature)?.stats ?? [
                        0, 10
                    ])[1];
                    modifier = Math.floor((dex - 10) / 2);
                }
                initiative = Math.floor(Math.random() * 19 + 1) + modifier;
            }
        };
    });

    const openModal = () => {
        modal.open();
    };
</script>

<div class="create-new">
    <div>
        <label for="add-name">Name</label>
        <!-- svelte-ignore a11y-autofocus -->
        <input
            bind:value={name}
            bind:this={nameInput}
            on:focus={openModal}
            id="add-name"
            type="text"
            name="name"
            tabindex="0"
            autofocus
        />
    </div>
    <div>
        <label for="add-hp">HP</label>
        <input bind:value={hp} id="add-hp" type="text" name="hp" tabindex="0" />
    </div>
    <div>
        <label for="add-ac">AC</label>
        <input bind:value={ac} id="add-ac" type="text" name="ac" tabindex="0" />
    </div>
    <div class="initiative">
        <label for="add-init">Initiative</label>
        <input
            bind:value={initiative}
            id="add-init"
            type="text"
            name="initiative"
            tabindex="0"
        />
        <div class="dice" use:diceButton />
    </div>
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
