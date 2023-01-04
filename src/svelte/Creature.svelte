<script lang="ts">
    import { createEventDispatcher, getContext } from "svelte";

    import { DEFAULT_UNDEFINED } from "src/utils";
    import type { Creature } from "src/utils/creature";
    import type TrackerView from "src/view";
    import Initiative from "./Initiative.svelte";
    import CreatureControls from "./CreatureControls.svelte";
    import Status from "./Status.svelte";
    import { setIcon } from "obsidian";

    export let creature: Creature;
    $: statuses = creature.status;

    const dispatch = createEventDispatcher();

    let view = getContext<TrackerView>("view");

    const name = () => {
        let name = creature.display ?? creature.name;
        if (creature.number > 0) {
            return `${name} ${creature.number}`;
        }
        return name;
    };
    const hiddenIcon = (div: HTMLElement) => {
        setIcon(div, "eye-off");
    };

    var hoverTimeout = null;
    const tryHover = (evt: MouseEvent) => {
        hoverTimeout = setTimeout(() => {
            if (creature["statblock-link"]) {
                let link = creature["statblock-link"];
                if (/\[.+\]\(.+\)/.test(link)) {
                    //md
                    [, link] = link.match(/\[.+?\]\((.+?)\)/);
                } else if (/\[\[.+\]\]/.test(link)) {
                    //wiki
                    [, link] = link.match(/\[\[(.+?)(?:\|.+?)?\]\]/);
                }

                app.workspace.trigger(
                    "link-hover",
                    {}, //hover popover, but don't need
                    evt.target, //targetEl
                    link, //linkText
                    "initiative-tracker " //source
                );
            }
        }, 1000);
    };
    
    const cancelHover = (evt: MouseEvent) => {
        clearTimeout(hoverTimeout);
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
    <div
        class="name-holder"
        on:click={() => view.openCombatant(creature)}
        on:mouseenter={tryHover}
        on:mouseleave={cancelHover}
    >
        {#if creature.hidden}
            <div class="centered-icon" use:hiddenIcon />
        {/if}
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
                        view.removeStatus(creature, status);
                        /* creature.status.delete(status);
                        statuses = creature.status; */
                    }}
                />
            {/each}
        {/if}
    </div>
</td>

<td class="center hp-container creature-adder">
    <div>
        {@html creature.hpDisplay}
    </div>
</td>

<td class="center ac-container creature-adder"
    >{creature.ac ?? DEFAULT_UNDEFINED}</td
>

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
        align-items: center;
        gap: 0.25rem;
        font-size: small;
    }
    .centered-icon {
        display: flex;
        align-items: center;
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
    .creature-adder {
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
