<svelte:options accessors={true} />

<script lang="ts">
    import Controls from "./Controls.svelte";
    import Table from "./Table.svelte";
    import Create from "./Create.svelte";

    import store from "./store";
    import type TrackerView from "src/view";
    import { MIN_WIDTH_FOR_HAMBURGER } from "src/utils";
    import type { Creature } from "src/utils/creature";

    export let creatures: Creature[] = [];
    export let view: TrackerView;

    store.creatures.set(creatures);

    export let show =
        view.parentEl.getBoundingClientRect().width < MIN_WIDTH_FOR_HAMBURGER;
    console.log("🚀 ~ file: App.svelte ~ line 17 ~ show", show);
    store.show.set(show);
    store.show.subscribe((value) => {
        console.log("🚀 ~ file: App.svelte ~ line 19 ~ value", value);
        show = value;
    });
    console.log("🚀 ~ file: App.svelte ~ line 24 ~ show", show);

    view.onResize = () => {
        console.log(
            " resize ",
            view.parentEl.getBoundingClientRect().width <
                MIN_WIDTH_FOR_HAMBURGER
        );

        if (
            view.parentEl.getBoundingClientRect().width <
                MIN_WIDTH_FOR_HAMBURGER &&
            !show
        ) {
            store.show.set(true);
        } else if (
            view.containerEl.getBoundingClientRect().width >=
                MIN_WIDTH_FOR_HAMBURGER &&
            show
        ) {
            store.show.set(false);
        }

        /* Panel Resized */
    };
</script>

<div class="obsidian-initiative-tracker">
    <Controls />
    <Table {show} />
    <Create />
</div>

<style>
    .obsidian-initiative-tracker {
        margin: 0.5rem;
        min-width: 180px;
    }
</style>
