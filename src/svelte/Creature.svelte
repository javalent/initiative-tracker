<script lang="ts">
    import { createEventDispatcher, getContext } from "svelte";

    import { DEFAULT_UNDEFINED } from "src/utils";
    import type { Creature } from "src/utils/creature";
    import type TrackerView from "src/view";
    import Initiative from "./Initiative.svelte";
    import CreatureControls from "./CreatureControls.svelte";
    import Status from "./Status.svelte";

    export let creature: Creature;
    console.log(
        "🚀 ~ file: Creature.svelte ~ line 12 ~ creature",
        creature.number
    );
    $: statuses = creature.status;

    const dispatch = createEventDispatcher();

    const updateName = (evt: FocusEvent) => {
        view.updateCreature(creature, {
            name: (evt.target as HTMLSpanElement).textContent
        });
    };

    let view = getContext<TrackerView>("view");

    const name = () => {
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
            <span class="name">{creature.name}</span>
        {:else}
            <span
                contenteditable
                class="editable name"
                type="text"
                on:click={(e) => e.stopPropagation()}
                on:blur={updateName}
                on:keydown={function (evt) {
                    if (evt.key === "Enter" || evt.key === "Tab") {
                        evt.preventDefault();
                        this.blur();
                        return;
                    }
                }}>{name()}</span
            >
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

<td class="center hp-container">
    <span
        class="editable"
        on:click={(e) => {
            dispatch("hp", creature);
            e.stopPropagation();
        }}>{creature.hpDisplay}</span
    >
</td>

<td class="center ac-container">{creature.ac ?? DEFAULT_UNDEFINED}</td>

<td class="controls-container">
    <CreatureControls
        on:click={(e) => e.stopPropagation()}
        on:tag
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
</style>
