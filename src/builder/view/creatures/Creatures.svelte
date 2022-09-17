<script lang="ts">
    import Creature from "./Creature.svelte";
    import { getContext } from "svelte";
    import Filters from "./Filters.svelte";
    import type { SRDMonster } from "@types";
    import { prepareFuzzySearch, prepareSimpleSearch, setIcon } from "obsidian";
    import Pagination from "./Pagination.svelte";
    import {
        cr,
        alignment,
        size,
        type,
        sources,
        name
    } from "../../stores/filter";
    import { convertFraction } from "src/utils";
    import { get } from "svelte/store";

    interface TableHeader {
        text: string;
        active: boolean;
        sortAsc: (a: SRDMonster, b: SRDMonster) => number;
        sortDesc: (a: SRDMonster, b: SRDMonster) => number;
    }

    const plugin = getContext("plugin");

    let slice = 50;

    let sortDir = true; //true == asc, false == des
    const sort = (field: TableHeader) => {
        if (field.active) {
            sortDir = !sortDir;
        } else {
            headers = headers.map((h) => {
                h.active = false;
                return h;
            });
            field.active = true;
            sortDir = true;
        }

        creatures.sort(sortDir ? field.sortAsc : field.sortDesc);
        creatures = creatures;
    };
    const sortIcon = (node: HTMLElement) => {
        setIcon(node, sortDir ? "chevron-up" : "chevron-down");
    };
    let headers: TableHeader[] = [
        {
            text: "Name",
            active: true,
            sortAsc: (a, b) => a.name.localeCompare(b.name),
            sortDesc: (a, b) => b.name.localeCompare(a.name)
        },
        {
            text: "CR",
            active: false,
            sortAsc: (a, b) =>
                convertFraction(a.cr ?? 0) - convertFraction(b.cr ?? 0),
            sortDesc: (a, b) =>
                convertFraction(b.cr ?? 0) - convertFraction(a.cr ?? 0)
        },
        {
            text: "Type",
            active: false,
            sortAsc: (a, b) => a.type?.localeCompare(b.type),
            sortDesc: (a, b) => b.type?.localeCompare(a.type)
        },
        {
            text: "Size",
            active: false,
            sortAsc: (a, b) => a.size?.localeCompare(b.size),
            sortDesc: (a, b) => b.size?.localeCompare(a.size)
        },
        {
            text: "Alignment",
            active: false,
            sortAsc: (a, b) => a.alignment?.localeCompare(b.alignment),
            sortDesc: (a, b) => b.alignment?.localeCompare(a.alignment)
        }
    ];

    let original = plugin.bestiary as SRDMonster[];

    let creatures = [...original];

    name.subscribe((n) => {
        if (!n || !n.length) {
            const header = headers.find((h) => h.active) ?? headers[0];
            if (!header.active) header.active = true;
            const active = sortDir ? header.sortAsc : header.sortDesc;
            creatures = [...original].sort(active);
        } else {
            const search = prepareSimpleSearch(n);
            const results: SRDMonster[] = [];
            for (const monster of original) {
                if (search(monster.name)) {
                    results.push(monster);
                }
            }
            creatures = results;
        }
    });

    $: filtered = creatures
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
    <Filters />
</div>

<table>
    <thead>
        {#each headers as header (header.text)}
            <th on:click={() => sort(header)}>
                <div class="table-header">
                    <span class="table-header-content">{header.text}</span>
                    {#key sortDir}
                        <div use:sortIcon class:invisible={!header.active} />
                    {/key}
                </div>
            </th>
        {/each}
    </thead>
    <tbody>
        {#each filtered.slice((page - 1) * slice, page * slice) as creature}
            <Creature {creature} />
        {/each}
    </tbody>
</table>

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

    .invisible {
        color: transparent;
    }

    table {
        width: 100%;
    }
</style>
