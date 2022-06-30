<script lang="ts">
    import { createEventDispatcher, getContext } from "svelte";

    import { DEFAULT_UNDEFINED } from "src/utils";
    import type { Creature } from "src/utils/creature";
    import type TrackerView from "src/view";
    import Initiative from "./Initiative.svelte";
    import CreatureControls from "./CreatureControls.svelte";
    import Status from "./Status.svelte";

    export let creature: Creature;
    export let updatingHP: Creature[] = [];
    $: statuses = creature.status;

    const dispatch = createEventDispatcher();

    let view = getContext<TrackerView>("view");

    const name = () => {
        if (creature.display) {
            return creature.display;
        }
        if (creature.number > 0) {
            return `${creature.name} ${creature.number}`;
        }
        return creature.name;
    };
</script>

<td class="initiative-container" on:click={(e) => e.stopPropagation()}>
    <Initiative
        initiative={creature.initiative}
        modifier={creature.modifier}
        on:click={(e) => e.stopPropagation()}
        on:initiative={(e) => {
            view.updateCreature(creature, { initiative: Number(e.detail) });
        }}
    />
</td>
<td class="name-container">
    <div class="name-holder">
        {#if creature.player}
            <strong class="name player">{creature.name}</strong>
        {:else}
            <span class="name">{name()}</span>
        {/if}
    </div>
    <div class="statuses" on:click={(e) => e.stopPropagation()}>
        {#if statuses.size}
            {#each [...statuses] as status}
                <Status
                    {status}
                    on:remove={() => {
                        creature.status.delete(status);
                        statuses = creature.status;
                    }}
                />
            {/each}
        {/if}
    </div>
</td>

<td class={`center hp-container ${updatingHP.find(
        (entry) => (
            entry.name == creature.name
            )
        ) ? "updating-this-hp" : ""}`}>
    <span
        class="editable"
        on:click={(e) => {
            dispatch(
                "hp", 
                {
                    creature: creature, 
                    ctrl: e.getModifierState('Control'), 
                    shift: e.getModifierState('Shift')
                }
            );
            e.stopPropagation();
        }}>{creature.hpDisplay}</span
    >
</td>

<td class="center ac-container">{creature.ac ?? DEFAULT_UNDEFINED}</td>

<td class="controls-container">
    <CreatureControls
        on:click={(e) => e.stopPropagation()}
        on:tag
        on:edit
        {view}
        {creature}
    />
</td>

<style>
    .name-holder {
        display: flex;
        gap: 0.25rem;
        font-size: small;
    }
    .name {
        display: block;
        text-align: left;
        background-color: inherit;
        border: 0;
        padding: 0;
        height: unset;
        word-break: keep-all;
    }
    .center {
        text-align: center;
    }
    .editable:not(.player) {
        cursor: pointer;
    }

    .statuses {
        display: flex;
        flex-flow: row wrap;
        column-gap: 0.25rem;
    }

    .initiative-container {
        border-top-left-radius: 0.25rem;
        border-bottom-left-radius: 0.25rem;
    }
    .controls-container {
        border-top-right-radius: 0.25rem;
        border-bottom-right-radius: 0.25rem;
    }

    .updating-this-hp {
        background-color: rgba(0, 0, 0, 0.1);
    }
    :global(.theme-dark) .updating-this-hp {
        background-color: rgba(255, 255, 255, 0.1);
    }
</style>
