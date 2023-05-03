<script lang="ts">
    import Creature from "./Creature.svelte";
    import { getContext } from "svelte";
    import Filters from "./Filters.svelte";
    import type { SRDMonster } from "index";
    import { prepareSimpleSearch, setIcon } from "obsidian";
    import Pagination from "./Pagination.svelte";
    import { cr, size, type, sources, name } from "../../stores/filter";
    import { convertFraction } from "src/utils";
    import { get } from "svelte/store";

    import { createTable, SettingsModal } from "../../stores/table";
    import { setContext } from "svelte/internal";
    const plugin = getContext("plugin");
    let original = plugin.bestiary as SRDMonster[];
    const table = createTable(plugin, [...original]);

    setContext<ReturnType<typeof createTable>>("table", table);
    const { creatures, sortDir, allHeaders } = table;

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
            $creatures = [...original];
        } else {
            const search = prepareSimpleSearch(n);
            const results: SRDMonster[] = [];
            console.log("🚀 ~ file: Creatures.svelte:40 ~ original:", original);
            for (const monster of original) {
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

    $: filtered = $creatures
        .filter(
            (c) =>
                get(cr.isDefault) ||
                (convertFraction(c.cr) >= $cr[0] &&
                    convertFraction(c.cr) <= $cr[1])
        )
        .filter(
            (c) =>
                !$size.length ||
                $size
                    .map((s) => s?.toLowerCase())
                    .includes(c.size?.toLowerCase())
        )
        .filter(
            (c) =>
                !$type.length ||
                $type
                    .map((s) => s?.toLowerCase())
                    .includes(c.type?.toLowerCase())
        )
        .filter((c) =>
            !$sources.length || typeof c.source == "string"
                ? !$sources.includes(c.source as string)
                : !c.source?.find((s) => $sources.includes(s))
        );
    let page = 1;
    $: pages = Math.ceil(filtered.length / slice);
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
            {#each filtered.slice($name?.length ? 0 : (page - 1) * slice, page * slice) as creature}
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
