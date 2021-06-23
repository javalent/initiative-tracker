<script lang="ts">
    import { creatures } from "./store";

    let numberOfCreatures: number = 0;
    let creaturesArray: any[] = [];

    creatures.subscribe((value) => {
        numberOfCreatures = value.length;
        creaturesArray = value;
    });
</script>

<div
    class="initiative-tracker-table"
    class:no-creatures={!creatures || numberOfCreatures == 0}
>
    {#each creaturesArray as creature}
        <div class="initiative-tracker-creature">
            <span>{creature.name}</span>
            <span>{creature.hp}</span>
            <span>{creature.initiative}</span>
        </div>
    {/each}
</div>

<style>
    .initiative-tracker-table {
        margin: 0.5rem;
        display: flex;
        justify-content: flex-start;
        align-items: flex-start;
        flex-flow: column nowrap;
    }

    .initiative-tracker-table.no-creatures {
        align-items: center;
    }

    .initiative-tracker-table .initiative-tracker-creature {
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem 0;
    }

    .initiative-tracker-table .initiative-tracker-creature:not(:last-child) {
        border-bottom: 1px solid var(--background-modifier-border-focus);
    }
</style>
