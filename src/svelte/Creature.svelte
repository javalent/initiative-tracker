<script lang="ts">
    import { onMount } from "svelte";

    import { ExtraButtonComponent } from "obsidian";
    import { HAMBURGER, REMOVE } from "src/utils";
    import store from "./store";

    export let creature: any;
    export let remove: (creature: any) => void = () => {};
    export let updateInitiative: (...args: any[]) => void = (
        evt,
        creature
    ) => {};

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
    const hamburgerIcon = (node: HTMLElement) => {
        new ExtraButtonComponent(node).setIcon(HAMBURGER).onClick(() => {
            console.log("grip");
        });
    };

    const select = (evt: FocusEvent) => {
        const range = document.createRange();
        range.selectNodeContents(evt.target as HTMLSpanElement);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    };

    let editingInitiative = false;
    let initiativeInput: HTMLInputElement;

    onMount(() => {
        if (initiativeInput) initiativeInput.focus();
    });
    $: {
        if (initiativeInput) initiativeInput.focus();
    }
    /* contenteditable="true"
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
            }} */
</script>

<div class="initiative-tracker-creature">
    <!-- <div class="grip-handle" use:gripHandle /> -->
    {#if !editingInitiative}
        <span
            class="editable initiative tree-item-flair"
            on:click={() => (editingInitiative = true)}
            >{creature.initiative}
        </span>
    {:else}
        <input
            type="number"
            bind:this={initiativeInput}
            on:blur={(evt) => {
                updateInitiative(evt, creature);
                editingInitiative = false;
            }}
        />
    {/if}

    <span
        class="editable"
        contenteditable="true"
        on:keydown={(evt) => {
            console.log(evt.key);
            if (/^Enter$/.test(evt.key)) {
                evt.preventDefault();
                return;
            }
        }}>{creature.name}</span
    >
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
    <span class="center">0</span>
    <div class="controls">
        <div class="add-button icon" class:show={hamburger} use:hamburgerIcon />
        <div
            class="add-button delete"
            class:show={!hamburger}
            use:deleteButton
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
        text-align: right;
        white-space: nowrap;
        margin-left: -0.5rem;
        user-select: all;
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
