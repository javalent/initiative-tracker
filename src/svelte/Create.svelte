<script lang="ts">
    import { ExtraButtonComponent, Notice } from "obsidian";
    import { INITIATIVE_TRACKER_SAVE } from "src/utils";

    import { creatures } from "./store";

    let addNew: boolean = false;
    let name: string;
    let hp: string;
    let initiative: string;

    const addButton = (node: HTMLElement) => {
        new ExtraButtonComponent(node)
            .setTooltip("Add Creature")
            .setIcon("plus-with-circle")
            .onClick(() => {
                console.log("Add New", creatures);
                addNew = true;
            });
    };
    const saveButton = (node: HTMLElement) => {
        new ExtraButtonComponent(node)
            .setTooltip("Add Creature")
            .setIcon(INITIATIVE_TRACKER_SAVE)
            .onClick(() => {
                if (!name.length) {
                    new Notice("Enter a name!");
                    return;
                }

                addNew = false;
                creatures.update((c) => {
                    c.push({ name: name, hp: hp, initiative: initiative });
                    return c;
                });
                console.log("Save", creatures);
            });
    };
</script>

<div class="add-creature-container">
    {#if addNew}
        <div class="create-new">
            <div>
                <label for="add-name">Name</label>
                <input
                    bind:value={name}
                    id="add-name"
                    type="text"
                    name="name"
                />
            </div>
            <div>
                <label for="add-hp">HP</label>
                <input bind:value={hp} id="add-hp" type="text" name="hp" />
            </div>
            <div>
                <label for="add-init">Initiative</label>
                <input
                    bind:value={initiative}
                    id="add-init"
                    type="text"
                    name="initiative"
                />
            </div>
        </div>
        <div class="add-button" use:saveButton />
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
</style>
