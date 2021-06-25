<script lang="ts">
    import { onMount } from "svelte";

    import { ExtraButtonComponent } from "obsidian";
    import { DISABLE, EDIT, ENABLE, HAMBURGER, REMOVE, TAG } from "src/utils";
    import store from "./store";
    import type { Creature } from "src/view";

    export let creature: Creature;
    export let remove: (creature: Creature) => void = () => {};
    export let updateInitiative: (...args: any[]) => void = (
        node: HTMLElement,
        creature
    ) => {
        creature.initiative = node.textContent;
    };

    const updateName = (evt: FocusEvent) => {
        creature.name = (evt.target as HTMLInputElement).value;
        editing = null;
    };

    export let hamburger: boolean = false;
    store.show.subscribe((value) => {
        hamburger = value;
    });

    const deleteButton = (node: HTMLElement) => {
        new ExtraButtonComponent(node)
            .setTooltip("Remove")
            .setIcon(REMOVE)
            .onClick(() => {
                console.log("Delete", creature);
                remove(creature);
            });
    };

    const tagButton = (node: HTMLElement) => {
        new ExtraButtonComponent(node)
            .setTooltip("Add Status")
            .setIcon(TAG)
            .onClick(() => {});
    };
    const editButton = (node: HTMLElement) => {
        new ExtraButtonComponent(node)
            .setTooltip("Edit")
            .setIcon(EDIT)
            .onClick(() => {});
    };
    const enableButton = (node: HTMLElement) => {
        new ExtraButtonComponent(node)
            .setTooltip("Enable")
            .setIcon(ENABLE)
            .onClick(() => {});
    };
    const disableButton = (node: HTMLElement) => {
        new ExtraButtonComponent(node)
            .setTooltip("Disable")
            .setIcon(DISABLE)
            .onClick(() => {});
    };

    const hamburgerIcon = (node: HTMLElement) => {
        new ExtraButtonComponent(node).setIcon(HAMBURGER).onClick(() => {
            console.log("grip");
        });
    };

    let editing: string = null;
    let initiativeInput: HTMLInputElement;
    let nameInput: HTMLInputElement;

    onMount(() => {
        if (initiativeInput) initiativeInput.focus();
        if (nameInput) nameInput.focus();
    });
    $: {
        if (initiativeInput) initiativeInput.focus();
        if (nameInput) nameInput.focus();
    }
</script>

<div class="initiative-tracker-creature">
    <!-- <div class="grip-handle" use:gripHandle /> -->
    <span
        class="editable initiative tree-item-flair"
        contenteditable="true"
        on:blur={(evt) => updateInitiative(evt.target, creature)}
        on:keydown={(evt) => {
            if (evt.key === "Enter") {
                evt.preventDefault();
                updateInitiative(evt.target, creature);
                return;
            }
            if (!/^(\d*\.?\d*|Backspace|Delete|Arrow\w+)$/.test(evt.key)) {
                evt.preventDefault();
                console.log(evt.key);
                return;
            }
        }}
        >{creature.initiative}
    </span>
    {#if editing != "name"}
        <span
            class="editable"
            on:click={(evt) => {
                editing = "name";
            }}>{creature.name}</span
        >
    {:else}
        <input
            type="text"
            bind:this={nameInput}
            on:blur={updateName}
            bind:value={creature.name}
        />
    {/if}
    <span
        class="center editable"
        contenteditable="true"
        on:keydown={(evt) => {
            if (!/^(\d*\.?\d*|Backspace|Delete|Arrow\w+)$/.test(evt.key)) {
                evt.preventDefault();
                console.log(evt.key);
                return;
            }
        }}>{creature.hp}</span
    >
    <span class="center">{creature.ac}</span>
    <div class="controls">
        <div class="add-button icon" class:show={hamburger} use:hamburgerIcon />
        <div class="add-button edit" class:show={!hamburger} use:editButton />
        <div class="add-button tags" class:show={!hamburger} use:tagButton />
        <div
            class="add-button enable"
            class:show={!hamburger}
            use:disableButton
        />
        <div
            class="add-button delete"
            class:show={!hamburger}
            use:deleteButton
        />
    </div>
</div>

<style>
    .initiative-tracker-creature {
        width: 100%;
        padding: 0.5rem 0;
        display: contents;
    }

    .initiative-tracker-creature .initiative {
        display: block;
        padding: 0;
        width: 12px;
        text-align: right;
        white-space: nowrap;
        margin-left: -0.5rem;
        user-select: all;
        background-color: inherit;
    }

    .center {
        text-align: center;
    }

    .editable {
        cursor: pointer;
    }
    .controls {
        display: flex;
    }
    .add-button {
        display: none;
    }
    .show {
        display: block;
    }
</style>
