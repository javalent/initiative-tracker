<script lang="ts">
    import { setIcon } from "obsidian";
    import { AC, HP, MIN_WIDTH_FOR_HAMBURGER } from "src/utils";

    import type TrackerView from "src/view";

    import CreatureTemplate from "./Creature.svelte";

    import store from "./store";

    import { createEventDispatcher } from "svelte";

    const dispatch = createEventDispatcher();

    let numberOfCreatures: number = 0;
    export let creatures: any[] = [];
    export let show: boolean = false;
    export let state: boolean;
    export let current: number;

    let view: TrackerView;
    let el: HTMLElement;
    function checkOverflow() {
        const curOverflow = el.style.overflow;

        if (!curOverflow || curOverflow === "visible")
            el.style.overflow = "hidden";

        const isOverflowing = el.clientWidth < el.scrollWidth;
        el.style.overflow = curOverflow;

        return isOverflowing;
    }
    store.view.subscribe((value) => {
        view = value;
        view.onResize = () => {
            if (el.clientWidth < MIN_WIDTH_FOR_HAMBURGER && !show) {
                show = checkOverflow();
            } else if (el.clientWidth > MIN_WIDTH_FOR_HAMBURGER) {
                show = checkOverflow();
            }
        };
    });

    const hpIcon = (node: HTMLElement) => {
        setIcon(node, HP);
    };
    const acIcon = (node: HTMLElement) => {
        setIcon(node, AC);
    };
</script>

<div>
    <div
        class="initiative-tracker-table"
        class:no-creatures={!creatures || numberOfCreatures == 0}
        bind:this={el}
    >
        <div class="tracker-table-header">
            <span />
            <span />
            <span>Name</span>
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
</div>

<style>
    .initiative-tracker-table {
        padding: 0.5rem;
        display: grid;
        grid-template-columns: 0rem auto /* 12px */ 1fr auto auto auto;
        align-items: center;
        gap: 0 0.5rem;
        width: 100%;
        margin-left: 0rem;
    }
    .center {
        text-align: center;
    }

    .tracker-table-header {
        display: contents;
        font-weight: bolder;
    }
    .initiative-tracker-table.no-creatures {
        align-items: center;
    }
    .updating-hp {
        display: grid;
        grid-template-rows: auto 1fr;
        width: 100%;
    }
</style>
