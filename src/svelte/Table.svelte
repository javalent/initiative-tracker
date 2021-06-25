<script lang="ts">
    import { setIcon } from "obsidian";
    import { AC, HP } from "src/utils";

    import Creature from "./Creature.svelte";
    import type { Creature as CreatureClass } from "src/view";

    import { creatures } from "./store";

    let numberOfCreatures: number = 0;
    let creaturesArray: any[] = [];
    creatures.subscribe((value) => {
        numberOfCreatures = value.length;
        creaturesArray = [...value];
        creaturesArray.sort((a, b) => b.initiative - a.initiative);
    });

    const remove = (creature: CreatureClass) => {
        creatures.set([...creaturesArray.filter((c) => c != creature)]);
    };

    const updateInitiative = (node: HTMLElement, creature: CreatureClass) => {
        creature.initiative = Number(node.textContent);
        creatures.set([
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
    class:no-creatures={!creatures || numberOfCreatures == 0}
>
    <div class="tracker-table-header">
        <span />
        <span>Name</span>
        <span use:hpIcon />
        <span use:acIcon />
        <span />
    </div>
    {#each creaturesArray as creature}
        <Creature {creature} {remove} {updateInitiative} />
    {/each}
</div>

<style>
    .initiative-tracker-table {
        padding: 0.5rem;
        display: grid;
        grid-template-columns: auto /* 12px */ 1fr auto auto auto;
        align-items: center;
        gap: 0.5rem;
        width: 100%;
    }

    .tracker-table-header {
        display: contents;
    }
    .initiative-tracker-table.no-creatures {
        align-items: center;
    }
</style>
