<script lang="ts">
    import { TextComponent, debounce } from "obsidian";
    import type { StringFilterStore } from "src/builder/stores/filter/filter";

    export let filter: StringFilterStore;
    const search = (node: HTMLElement) => {
        new TextComponent(node).setPlaceholder(filter.text).onChange(
            debounce((v) => {
                $filter = v;
            }, 10)
        );
    };
</script>

<div class="search" use:search />

<style scoped>
    .search,
    .search :global(input) {
        width: 100%;
    }
</style>
