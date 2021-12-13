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
    export let state: boolean;

    const dispatch = createEventDispatcher();

    const updateName = (evt: FocusEvent) => {
        view.updateCreature(creature, {
            name: (evt.target as HTMLSpanElement).textContent
        });
    };

    let view = getContext<TrackerView>("view");
    let statuses: Condition[] = [];
    export let active: boolean = false;

    const activeIcon = (node: HTMLElement) =>
        setIcon(node, "initiative-tracker-active");
</script>

<td class="active-holder">
    {#if state && active}
        <div use:activeIcon />
    {/if}
</td>
<td class="initiative-container">
    <Initiative
        initiative={creature.initiative}
        modifier={creature.modifier}
        on:initiative={(e) => {
            console.log(e.detail);
            view.updateCreature(creature, { initiative: Number(e.detail) });
        }}
    />
</td>
<td class="name-container">
    {#if creature.player}
        <small class="name">{creature.name}</small>
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
    <div class="statuses">
        {#each statuses as status}
            <Status
                {status}
                on:remove={() => {
                    /* view.removeStatus(creature, status); */
                }}
            />
        {/each}
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
    <CreatureControls {view} {creature} />
</td>

<td />

<!-- </div> -->
<style>
    .active-holder {
        margin-left: -0.5rem;
    }

    .name {
        display: block;
        text-align: left;
        background-color: inherit;
        border: 0;
        font-size: smaller;
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
    /* .controls {
        display: flex;
        justify-content: flex-end;
    } */
    /* .add-button {
        display: none;
    } */

    .statuses {
        display: flex;
        gap: 0.25rem;
    }
</style>
