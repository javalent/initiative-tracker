<svelte:options accessors={true} />

<script lang="ts">
    import { beforeUpdate, createEventDispatcher } from "svelte";

    import Controls from "./Controls.svelte";
    import Table from "./Table.svelte";
    import Create from "./Create.svelte";

    import store from "./store";
    import type TrackerView from "src/view";
    import { MIN_WIDTH_FOR_HAMBURGER } from "src/utils";
    import type { Creature } from "src/utils/creature";

    export let creatures: Creature[] = [];
    export let view: TrackerView;

    const dispatch = createEventDispatcher();

    store.view.set(view);
    store.creatures.set(creatures);

    export let show: boolean;
    store.show.set(show);

    beforeUpdate(() => {
        store.creatures.set(creatures);
        show =
            view.parentEl.getBoundingClientRect().width <
            MIN_WIDTH_FOR_HAMBURGER;
    });
    view.onResize = () => {
        /* Panel Resized */
        if (
            view.parentEl.getBoundingClientRect().width <
                MIN_WIDTH_FOR_HAMBURGER &&
            !show
        ) {
            show = true;
            store.show.set(show);
        } else if (
            view.containerEl.getBoundingClientRect().width >=
                MIN_WIDTH_FOR_HAMBURGER &&
            show
        ) {
            show = false;
            store.show.set(show);
        }
    };
</script>

<div class="obsidian-initiative-tracker">
    <Controls on:new-encounter={() => dispatch("new-encounter")} />
    <Table />
    <Create />
</div>

<style>
    .obsidian-initiative-tracker {
        margin: 0.5rem;
        min-width: 180px;
    }
</style>
