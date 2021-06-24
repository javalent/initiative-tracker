<script lang="ts">
    import Controls from "./Controls.svelte";
    import Table from "./Table.svelte";
    import Create from "./Create.svelte";

    import store from "./store";
    import type TrackerView from "src/view";

    export let creatures: any[] = [];
    export let view: TrackerView;

    store.creatures.set(creatures);
    store.view.set(view);
    let show = view.contentEl.getBoundingClientRect().width < 210;
    store.show.subscribe((value) => {
        show = value;
    });
    store.show.set(show);

    view.onResize = () => {
        console.log();

        if (view.contentEl.getBoundingClientRect().width < 210 && !show) {
            store.show.set(true);
        } else if (
            view.contentEl.getBoundingClientRect().width >= 210 &&
            show
        ) {
            store.show.set(false);
        }

        /* Panel Resized */
    };
</script>

<div class="obsidian-initiative-tracker">
    <Controls />
    <Table />
    <Create />
</div>

<style>
    .obsidian-initiative-tracker {
        margin: 0.5rem;
        min-width: 180px;
    }
</style>
