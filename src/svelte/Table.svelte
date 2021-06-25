<script lang="ts">
    import { setIcon } from "obsidian";
    import { AC, HP } from "src/utils";
    import type { Creature } from "src/utils/creature";

    import CreatureTemplate from "./Creature.svelte";

    import store from "./store";

    export let show: boolean;

    let numberOfCreatures: number = 0;
    let creaturesArray: any[] = [];
    let current: number;

    store.creatures.subscribe((value) => {
        numberOfCreatures = value.length;
        creaturesArray = [...value];
        creaturesArray.sort((a, b) => b.initiative - a.initiative);
    });

    const remove = (creature: Creature) => {
        store.creatures.set([...creaturesArray.filter((c) => c != creature)]);
    };

    store.current.subscribe((value) => {
        current = value;
    });
    let isActive: boolean = false;
    store.active.subscribe((value) => {
        isActive = value;
    });

    const updateInitiative = (node: HTMLElement, creature: Creature) => {
        creature.initiative = Number(node.textContent);
        store.creatures.set([
            ...creaturesArray.filter((c) => c != creature),
            { ...creature }
        ]);
    };

    const hpIcon = (node: HTMLElement) => {
        setIcon(node, HP);
    };
    const acIcon = (node: HTMLElement) => {
        setIcon(node, AC);
    };
</script>

<div
    class="initiative-tracker-table"
    class:no-creatures={!creaturesArray || numberOfCreatures == 0}
>
    <div class="tracker-table-header">
        <span />
        <span />
        <span>Name</span>
        <span use:hpIcon class="center" />
        <span use:acIcon class="center" />
        <span />
    </div>
    {#each creaturesArray as creature, index}
        <CreatureTemplate
            {creature}
            {show}
            active={index == current && isActive}
            {remove}
            {updateInitiative}
        />
    {/each}
</div>

<style>
    .initiative-tracker-table {
        padding: 0.5rem;
        display: grid;
        grid-template-columns: 0rem auto /* 12px */ 1fr auto auto auto;
        align-items: center;
        gap: 0.5rem;
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
</style>
