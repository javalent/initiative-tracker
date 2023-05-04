<script lang="ts">
    import Creature from "./Creature.svelte";
    import { getContext } from "svelte";
    import Filters from "../filters/Filters.svelte";
    import type { SRDMonster } from "index";
    import { prepareSimpleSearch, setIcon } from "obsidian";
    import Pagination from "./Pagination.svelte";
    import { BuiltFilterStore, name } from "../../stores/filter";

    import { BuiltTableStore, SettingsModal } from "../../stores/table";

    const table = getContext<BuiltTableStore>("table");
    const { creatures, sortDir, allHeaders } = table;
    const filters = getContext<BuiltFilterStore>("filters");
    const { filtered } = filters;

    let slice = 50;

    const sortUp = (node: HTMLElement) => {
        setIcon(node, "chevron-up");
    };
    const sortDown = (node: HTMLElement) => {
        setIcon(node, "chevron-down");
    };

    name.subscribe((n) => {
        if (!$table.length) return;
        if (!n || !n.length) {
            const header = $table.find((h) => h.active) ?? $table[0];
            if (!header.active) header.active = true;
            table.reset();
        } else {
            const search = prepareSimpleSearch(n);
            const results: SRDMonster[] = [];
            for (const monster of $creatures) {
                if (search(monster.name)) {
                    results.push(monster);
                }
            }
            $creatures = results;
        }
    });

    const openSettingsModal = () => {
        const modal = new SettingsModal($table.map((t) => t.toState()));
        modal.open();
        modal.onClose = () => {
            if (modal.canceled) return;
            if (modal.reset) {
                table.resetToDefault();
                return;
            }
            table.setHeadersFromState(modal.headers);
        };
    };

    let page = 1;
    $: pages = Math.ceil($filtered.length / slice);
</script>

<div class="filters">
    <Filters on:settings={() => openSettingsModal()} />
</div>

{#if $allHeaders.length}
    <table>
        <thead>
            {#each $allHeaders as header (header.text)}
                <th
                    on:click={() => {
                        table.sort(header);
                    }}
                >
                    <div class="table-header">
                        <span class="table-header-content">{header.text}</span>
                        {#if header.active}
                            {#if $sortDir}
                                <div class="has-icon" use:sortUp />
                            {:else}
                                <div class="has-icon" use:sortDown />
                            {/if}
                        {/if}
                    </div>
                </th>
            {/each}
        </thead>
        <tbody>
            {#each $filtered.slice($name?.length ? 0 : (page - 1) * slice, page * slice) as creature}
                <Creature {creature} />
            {/each}
        </tbody>
    </table>
{/if}

<Pagination
    {slice}
    {page}
    {pages}
    on:slice={(evt) => (slice = evt.detail)}
    on:previous={() => (page = page - 1)}
    on:next={() => (page = Math.min(page + 1, pages))}
    on:page={(evt) => (page = evt.detail)}
/>

<style scoped>
    .filters {
        margin: 1rem 0;
    }
    .table-header {
        display: flex;
        gap: 0.25rem;
    }

    .has-icon {
        display: flex;
        align-items: center;
    }

    table {
        width: 100%;
    }
</style>
