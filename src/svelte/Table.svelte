<script lang="ts">
    import { Notice, setIcon } from "obsidian";
    import { AC, HP } from "src/utils";
    import type { Creature } from "src/utils/creature";

    import CreatureTemplate from "./Creature.svelte";

    import store from "./store";

    let numberOfCreatures: number = 0;
    let creaturesArray: any[] = [];

    store.creatures.subscribe((value) => {
        numberOfCreatures = value.length;
        creaturesArray = [...value];

        creaturesArray.sort((a, b) => b.initiative - a.initiative);
    });

    const remove = (event: CustomEvent<Creature>) => {
        store.creatures.set([
            ...creaturesArray.filter((c) => c != event.detail)
        ]);
    };

    const updateInitiative = (creature: Creature, value: number) => {
        if (isNaN(Number(value)) || Number(value) < 1) {
            new Notice("Enter a valid initiative.");

            store.creatures.set([...creaturesArray]);

            return;
        }
        if (creature.initiative == Number(value)) {
            return;
        }

        creature.initiative = Number(value);
        store.creatures.set([...creaturesArray]);
    };

    const hpIcon = (node: HTMLElement) => {
        setIcon(node, HP);
    };
    const acIcon = (node: HTMLElement) => {
        setIcon(node, AC);
    };

    let updatingHP: Creature;
    const updateHP = (toAdd: number) => {
        updatingHP.hp -= Number(toAdd);
        updatingHP = null;
        store.creatures.set([...creaturesArray]);
    };

    let updatingStatus: Creature;
    const addStatus = (tag: string) => {
        updatingStatus.status.add(tag);
        updatingStatus = null;
        store.creatures.set([...creaturesArray]);
    };
</script>

<div>
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
        {#each creaturesArray as creature}
            <CreatureTemplate
                {creature}
                on:remove={remove}
                on:hp={(evt) => (updatingHP = evt.detail)}
                on:tag={(evt) => (updatingStatus = evt.detail)}
                on:initiative={(evt) =>
                    updateInitiative(evt.detail.creature, evt.detail.value)}
            />
        {/each}
    </div>
    {#if updatingHP}
        <div class="updating-hp">
            <span>Apply damage or healing:</span>
            <input
                type="number"
				autofocus
                on:blur={function (evt) {
                    updateHP(this.value);
                }}
            />
        </div>
    {/if}
    {#if updatingStatus}
        <div class="updating-hp">
            <span>Apply status:</span>
            <input
                type="text"
				autofocus
                on:blur={function (evt) {
                    addStatus(this.value);
                }}
            />
        </div>
    {/if}
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
