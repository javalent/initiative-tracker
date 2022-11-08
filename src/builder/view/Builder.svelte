<script lang="ts">
    import type InitiativeTracker from "src/main";
    import { onDestroy, setContext } from "svelte";
    import { players } from "../stores/players";

    import Creatures from "./creatures/Creatures.svelte";
    import Encounter from "./encounter/Encounter.svelte";
    import Party from "./party/Party.svelte";

    export let plugin: InitiativeTracker;

    setContext("plugin", plugin);

    onDestroy(() => {
        players.empty();
    });
</script>

<div class="initiative-tracker encounter-builder markdown-rendered">
    <Party />
    <Encounter />
    <Creatures />
</div>

<style>
    .encounter-builder {
        margin: 1rem;
    }
</style>
