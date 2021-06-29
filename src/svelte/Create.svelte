<script lang="ts">
    import { ExtraButtonComponent, Notice } from "obsidian";
    import { afterUpdate } from "svelte";
    import { SAVE } from "src/utils";
    import { Creature } from "src/utils/creature";

    import store, { creatures } from "./store";
    import { SRDMonsterSuggestionModal } from "src/utils/suggester";
    import type TrackerView from "src/view";

    let view: TrackerView;
    store.view.subscribe((v) => (view = v));

    let addNew: boolean = false;
    let name: string;
    let hp: string;
    let initiative: string;
    let ac: string;

    const addButton = (node: HTMLElement) => {
        new ExtraButtonComponent(node)
            .setTooltip("Add Creature")
            .setIcon("plus-with-circle")
            .onClick(() => {
                addNew = true;
            });
    };
    const saveButton = (node: HTMLElement) => {
        new ExtraButtonComponent(node)
            .setTooltip("Add Creature")
            .setIcon(SAVE)
            .onClick(() => {
                if (!name) {
                    new Notice("Enter a name!");
                    return;
                }

                addNew = false;
                creatures.update((c) => {
                    c.push(
                        new Creature({
                            name,
                            hp: hp ? Number(hp) : undefined,
                            initiative: initiative
                                ? Number(initiative)
                                : Math.floor(Math.random() * 19 + 1),
                            ac: ac ? Number(ac) : undefined
                        })
                    );
                    return c;
                });
                name = undefined;
                hp = undefined;
				ac = undefined;
                initiative = undefined;
                ac = undefined;
            });
    };
    const cancelButton = (node: HTMLElement) => {
        new ExtraButtonComponent(node)
            .setTooltip("Cancel")
            .setIcon("cross")
            .onClick(() => {
                addNew = false;
                name = undefined;
                hp = undefined;
				ac = undefined;
                initiative = undefined;
            });
    };

    let nameInput: HTMLInputElement, modal: SRDMonsterSuggestionModal;
    afterUpdate(() => {
        if (nameInput) {
            modal = new SRDMonsterSuggestionModal(view.plugin.app, nameInput);
            modal.onClose = () => {
                console.log(
                    "🚀 ~ file: Create.svelte ~ line 75 ~ modal.creature",
                    modal.creature
                );
                if (modal.creature) {
                    name = modal.creature.name;
                    hp = `${modal.creature.hp}`;
                    ac = `${modal.creature.ac}`;
                    initiative = `${Math.floor(Math.random() * 19 + 1)}`; //TODO: Add Modifier;
                }
            };
        }
    });
</script>

<div class="add-creature-container">
    {#if addNew}
        <div class="create-new">
            <div>
                <label for="add-name">Name</label>
                <!-- svelte-ignore a11y-autofocus -->
                <input
                    bind:value={name}
                    bind:this={nameInput}
                    on:click={() => modal.open()}
                    id="add-name"
                    type="text"
                    name="name"
                    tabindex="0"
					autofocus
                />
            </div>
            <div>
                <label for="add-hp">HP</label>
                <input
                    bind:value={hp}
                    id="add-hp"
                    type="text"
                    name="hp"
                    tabindex="0"
                />
            </div>
            <div>
                <label for="add-ac">AC</label>
                <input
                    bind:value={ac}
                    id="add-ac"
                    type="text"
                    name="ac"
                    tabindex="0"
                />
            </div>
            <div>
                <label for="add-init">Initiative</label>
                <input
                    bind:value={initiative}
                    id="add-init"
                    type="text"
                    name="initiative"
                    tabindex="0"
                />
            </div>
        </div>
        <div class="context-buttons">
            <div class="add-button" use:saveButton />
            <div use:cancelButton class="add-button cancel-button" />
        </div>
    {:else}
        <div use:addButton class="add-button" />
    {/if}
</div>

<style>
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
    .create-new > * {
        display: flex;
        justify-content: space-between;
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
</style>
