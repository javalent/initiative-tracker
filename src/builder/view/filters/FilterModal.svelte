<script lang="ts">
    import { ButtonComponent } from "obsidian";
    import type InitiativeTracker from "src/main";
    import { sources } from "../../stores/filter";

    export let plugin: InitiativeTracker;
    const allSources = [...new Set(plugin.bestiary.map((c) => c.source).flat())]
        .filter((s) => s)
        .sort();
    const all = (node: HTMLElement) => {
        new ButtonComponent(node).setButtonText("Select All").onClick(() => {
            $sources = [];
        });
    };
    const none = (node: HTMLElement) => {
        new ButtonComponent(node).setButtonText("Deselect All").onClick(() => {
            $sources = [...allSources];
        });
    };
</script>

<div
    class="initiative-tracker intiative-tracker-modal encounter-builder-modal filter-sources-modal"
>
    <h3>Sources</h3>
    <div class="buttons">
        <div use:all />
        <div use:none />
    </div>
    <div class="sources-list">
        {#each allSources as source}
            <div class="source">
                <input
                    type="checkbox"
                    name={source}
                    id={`ID_source_${source}`}
                    checked={!$sources.includes(source)}
                />
                <label for={`ID_source_${source}`}>{source}</label>
            </div>
        {/each}
    </div>
</div>

<style scoped>
    .buttons {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1rem;
    }

    .sources-list {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 1rem;
    }
</style>
