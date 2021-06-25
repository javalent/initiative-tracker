<script lang="ts">
    import { onMount } from "svelte";

    import { ExtraButtonComponent } from "obsidian";
    import {
        DEFAULT_UNDEFINED,
        DISABLE,
        EDIT,
        ENABLE,
        HAMBURGER,
        REMOVE,
        TAG
    } from "src/utils";
    import store from "./store";
    import type { Creature } from "src/utils/creature";

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
    export let show: boolean;
    export let active: boolean;

    store.show.subscribe((value) => {
        show = value;
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

<div class="initiative-tracker-creature" class:active>
    <!-- <div class="grip-handle" use:gripHandle /> -->
    <span class="active-holder">
        {#if active}
            <svg
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                focusable="false"
                data-prefix="fas"
                data-icon="angle-right"
                class="svg-inline--fa fa-angle-right fa-w-8"
                role="img"
                viewBox="0 0 256 512"
                ><path
                    fill="currentColor"
                    d="M224.3 273l-136 136c-9.4 9.4-24.6 9.4-33.9 0l-22.6-22.6c-9.4-9.4-9.4-24.6 0-33.9l96.4-96.4-96.4-96.4c-9.4-9.4-9.4-24.6 0-33.9L54.3 103c9.4-9.4 24.6-9.4 33.9 0l136 136c9.5 9.4 9.5 24.6.1 34z"
                /></svg
            >
        {/if}
    </span>
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

                return;
            }
        }}
        >{creature.initiative}
    </span>
    {#if editing != "name"}
        <small
            class="editable"
            on:click={(evt) => {
                editing = "name";
            }}>{creature.name}</small
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
        }}>{creature.hp ?? DEFAULT_UNDEFINED}</span
    >
    <span class="center">{creature.ac ?? DEFAULT_UNDEFINED}</span>
    <div class="controls">
        <div class="add-button icon" class:show use:hamburgerIcon />
        <div class="add-button edit" class:show={!show} use:editButton />
        <div class="add-button tags" class:show={!show} use:tagButton />
        <div class="add-button enable" class:show={!show} use:disableButton />
        <div class="add-button delete" class:show={!show} use:deleteButton />
    </div>
</div>

<style>
    .initiative-tracker-creature {
        width: 100%;
        padding: 0.5rem 0;
        display: contents;
    }

    .active-holder {
        margin-left: -0.5rem;
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

    .right {
        margin-left: auto;
    }
    .editable {
        cursor: pointer;
    }
    .controls {
        display: flex;
        justify-content: flex-end;
    }
    .add-button {
        display: none;
    }
    .show {
        display: block;
    }
</style>
