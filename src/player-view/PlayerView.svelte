<script lang="ts">
    import { setIcon } from "obsidian";
    import { fade } from "svelte/transition";
    import { SyncLoader } from "svelte-loading-spinners";

    import { HP, INITIATIVE } from "src/utils";
    import type { Creature } from "src/utils/creature";
    import { createEventDispatcher } from "svelte";

    const dispatch = createEventDispatcher();

    export let creatures: Creature[] = [];
    export let loaded = false;
    export let state = false;

    const hpIcon = (node: HTMLElement) => {
        setIcon(node, HP);
    };
    const iniIcon = (node: HTMLElement) => {
        setIcon(node, INITIATIVE);
    };

    const getHpStatus = (hp: number, max: number) => {
        if (!hp) return "";
        if (hp <= 0) return "Defeated";
        if (hp < max / 2) return "Bloodied";
        if (hp < max) return "Hurt";
        return "Healthy";
    };

    const timeout = setTimeout(() => {
        dispatch("try-load");
    }, 1000);
    $: {
        if (loaded) {
            clearTimeout(timeout);
        }
    }

    const amIActive = (creature: Creature) => {
        if (creature.hidden) return false;
        if (creature.active) return true;

        const active = creatures.findIndex((c) => c.active);
        const index = creatures.indexOf(creature);
        if (active == -1 || active < index) return false;

        const remaining = creatures.slice(index + 1, active + 1);
        if (remaining.every((c) => c.hidden)) return true;
        return false;
    };

    $: activeAndVisible = creatures.filter((c) => c.enabled && !c.hidden);
</script>

{#if !loaded}
    <div class="full-center">
        <SyncLoader />
    </div>
{:else}
    <table class="initiative-tracker-table" transition:fade>
        <thead class="tracker-table-header">
            <th style="width:5%"><strong use:iniIcon /></th>
            <th class="left" style="width:30%"><strong>Name</strong></th>
            <th style="width:15%" class="center"><strong use:hpIcon /></th>
            <th><strong> Statuses </strong></th>
        </thead>
        <tbody>
            {#each activeAndVisible as creature (creature.id)}
                <tr class:active={amIActive(creature) && state}>
                    <td class="center">{creature.initiative}</td>
                    <td
                        >{creature.name}{creature.number
                            ? ` ${creature.number}`
                            : ""}</td
                    >
                    <td
                        class:center={true}
                        class={getHpStatus(
                            creature.hp,
                            creature.max
                        ).toLowerCase()}
                    >
                        {#if creature.player}
                            <div class="center">{@html creature.hpDisplay}</div>
                        {:else}
                            <span>{getHpStatus(creature.hp, creature.max)}</span
                            >
                        {/if}
                    </td>
                    <td class="center">
                        {[...creature.status].map((s) => s.name).join(", ")}
                    </td>
                </tr>
            {/each}
        </tbody>
    </table>
{/if}

<style scoped>
    .full-center {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .initiative-tracker-table {
        padding: 0.5rem;
        align-items: center;
        gap: 0.25rem 0.5rem;
        width: 100%;
        margin-left: 0rem;
        table-layout: fixed;
        border-collapse: separate;
        border-spacing: 0 2px;
        font-size: larger;
    }
    .left {
        text-align: left;
    }
    .center {
        text-align: center;
    }
    .healthy {
        color: var(--text-success);
    }
    .hurt {
        color: var(--text-warning);
    }
    .bloodied {
        color: var(--text-error);
    }
    .defeated {
        color: var(--text-faint);
    }
    .active {
        background-color: rgba(0, 0, 0, 0.1);
    }
    :global(.theme-dark) .active {
        background-color: rgba(255, 255, 255, 0.1);
    }
</style>
