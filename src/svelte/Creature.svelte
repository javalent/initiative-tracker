<script lang="ts">
    import { createEventDispatcher, getContext } from "svelte";

    import { setIcon } from "obsidian";
    import { DEFAULT_UNDEFINED } from "src/utils";
    import type { Creature } from "src/utils/creature";
    import type TrackerView from "src/view";
    import Initiative from "./Initiative.svelte";
    import CreatureControls from "./CreatureControls.svelte";
    import Status from "./Status.svelte";

    import type { Condition } from "@types";

    export let creature: Creature;
    $: statuses = creature.status;

    const dispatch = createEventDispatcher();

    const updateName = (evt: FocusEvent) => {
        view.updateCreature(creature, {
            name: (evt.target as HTMLSpanElement).textContent
        });
    };

    let view = getContext<TrackerView>("view");
</script>

<!-- <td class="active-holder">
    {#if state && active}
        <div use:activeIcon />
    {/if}
</td> -->
<td class="initiative-container">
    <Initiative
        initiative={creature.initiative}
        modifier={creature.modifier}
        on:initiative={(e) => {
            view.updateCreature(creature, { initiative: Number(e.detail) });
        }}
    />
</td>
<td class="name-container">
    <div class="name-holder">
        {#if creature.player}
            <span class="name">{creature.name}</span>
        {:else}
            <span
                contenteditable
                class="editable name"
                type="text"
                on:blur={updateName}
                on:keydown={function (evt) {
                    if (evt.key === "Enter" || evt.key === "Tab") {
                        evt.preventDefault();
                        this.blur();
                        return;
                    }
                }}>{creature.name}</span
            >
        {/if}
    </div>
    <div class="statuses">
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

<td class="center hp-container">
    <span
        class="editable"
        on:click={() => {
            dispatch("hp", creature);
        }}>{creature.hpDisplay}</span
    >
</td>

<td class="center ac-container">{creature.ac ?? DEFAULT_UNDEFINED}</td>

<td class="controls-container">
    <CreatureControls on:tag {view} {creature} />
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
</style>
