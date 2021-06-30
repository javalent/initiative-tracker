<script lang="ts">
    import { setIcon } from "obsidian";
    import { AC, HP } from "src/utils";

    import CreatureTemplate from "./Creature.svelte";
    import { createEventDispatcher } from "svelte";

    const dispatch = createEventDispatcher();

    export let creatures: any[] = [];
    export let show: boolean = false;
    export let state: boolean;
    export let current: number;

    let el: HTMLElement;

    const hpIcon = (node: HTMLElement) => {
        setIcon(node, HP);
    };
    const acIcon = (node: HTMLElement) => {
        setIcon(node, AC);
    };
</script>

<div>
    {#if creatures.length}
        <div class="initiative-tracker-table" bind:this={el}>
            <div class="tracker-table-header">
                <span />
                <span />
                <span class="left">Name</span>
                <span use:hpIcon class="center" />
                <span use:acIcon class="center" />
                <span />
            </div>
            {#each creatures as creature}
                <CreatureTemplate
                    {creature}
                    on:hp={(evt) => dispatch("update-hp", evt.detail)}
                    on:tag={(evt) => dispatch("update-tags", evt.detail)}
                    {show}
                    {state}
                    {current}
                />
            {/each}
        </div>
    {:else}
        <div class="no-creatures">
            <p>Add a creature to get started!</p>
            <small>Players may be created in settings.</small>
        </div>
    {/if}
</div>

<style>
    .no-creatures {
        margin: 1rem;
        text-align: center;
    }
    .initiative-tracker-table {
        padding: 0.5rem;
        display: grid;
        grid-template-columns: 0rem auto /* 12px */ 1fr auto auto auto;
        align-items: center;
        gap: 0 0.5rem;
        width: 100%;
        margin-left: 0rem;
    }
    .left {
        text-align: left;
    }
    .center {
        text-align: center;
    }

    .tracker-table-header {
        display: contents;
        font-weight: bolder;
    }
/*     .updating-hp {
        display: grid;
        grid-template-rows: auto 1fr;
        width: 100%;
    } */
</style>
