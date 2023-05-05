<script lang="ts">
    import type InitiativeTracker from "src/main";
    import { onDestroy, setContext } from "svelte";
    import { players } from "../stores/players";

    import Creatures from "./creatures/Creatures.svelte";
    import Encounter from "./encounter/Encounter.svelte";
    import PartyExperience from "./party/PartyExperience.svelte";
    import {
        BuiltFilterStore,
        DEFAULT_FILTERS,
        createFilterStore
    } from "../stores/filter/filter";
    import { BuiltTableStore, createTable } from "../stores/table/table";
    import type { BuilderState, SRDMonster } from "index";
    import { writable } from "svelte/store";

    export let plugin: InitiativeTracker;
    let original = plugin.bestiary as SRDMonster[];
    const table = createTable(plugin, [...original]);

    setContext<BuiltTableStore>("table", table);

    const filterStore = createFilterStore(table.creatures, plugin);
    setContext<BuiltFilterStore>("filters", filterStore);

    if (!plugin.data.builder) {
        plugin.data.builder = {
            sidebarIcon: true,
            showParty: true,
            showXP: true
        };
    }
    setContext("plugin", plugin);

    onDestroy(() => {
        players.empty();
    });
</script>

<div class="initiative-tracker encounter-builder markdown-rendered">
    <PartyExperience />
    <Encounter />
    <Creatures />
</div>

<style>
    .encounter-builder {
        margin: 1rem;
    }
</style>
