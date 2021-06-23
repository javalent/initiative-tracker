<script lang="ts">
    import Controls from "./Controls.svelte";
    import Table from "./Table.svelte";
    import Create from "./Create.svelte";

    import store from "./store";

    export let creatures: any[] = [];

    store.creatures.set(creatures);
    
</script>

<div class="obsidian-initiative-tracker">
    <Controls />
    <Table />
    <Create />
</div>

<style>
    .obsidian-initiative-tracker {
        margin: 0.5rem;
    }
</style>
