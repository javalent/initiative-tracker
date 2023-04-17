<script lang="ts">
    import { DEFAULT_UNDEFINED, FRIENDLY, HIDDEN } from "src/utils";
    import type { Creature } from "src/utils/creature";
    import Initiative from "./Initiative.svelte";
    import CreatureControls from "./CreatureControls.svelte";
    import Status from "./Status.svelte";
    import { setIcon } from "obsidian";
    import { tracker } from "../../stores/tracker";
    import { createEventDispatcher } from "svelte";

    const dispatch = createEventDispatcher();

    export let creature: Creature;
    $: statuses = creature.status;

    const name = () => creature.getName();
    const statblockLink = () => creature.getStatblockLink();
    const hiddenIcon = (div: HTMLElement) => {
        setIcon(div, HIDDEN);
    };
    const friendlyIcon = (div: HTMLElement) => {
        setIcon(div, FRIENDLY);
    };

    let hoverTimeout: NodeJS.Timeout = null;
    const tryHover = (evt: MouseEvent) => {
        hoverTimeout = setTimeout(() => {
            if (creature["statblock-link"]) {
                let link = statblockLink();
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

<!-- svelte-ignore a11y-click-events-have-key-events -->
<td class="initiative-container" on:click={(e) => e.stopPropagation()}>
    <Initiative
        initiative={creature.initiative}
        modifier={creature.modifier}
        on:click={(e) => e.stopPropagation()}
        on:initiative={(e) => {
            tracker.updateCreatures({
                creature,
                change: { initiative: Number(e.detail) }
            });
        }}
    />
</td>
<td class="name-container">
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div
        class="name-holder"
        on:click|stopPropagation={(evt) => {
            dispatch("open-combatant", creature);
        }}
        on:mouseenter={tryHover}
        on:mouseleave={cancelHover}
    >
        {#if creature.hidden}
            <div class="centered-icon" use:hiddenIcon />
        {/if}
        {#if creature.friendly}
            <div class="centered-icon" use:friendlyIcon />
        {/if}
        {#if creature.player}
            <strong class="name player">{creature.name}</strong>
        {:else}
            <span class="name">{name()}</span>
        {/if}
    </div>
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div class="statuses" on:click={(e) => e.stopPropagation()}>
        {#if statuses.size}
            {#each [...statuses] as status}
                <Status
                    {status}
                    on:remove={() => {
                        tracker.updateCreatures({
                            creature,
                            change: { status: [status] }
                        });
                    }}
                />
            {/each}
        {/if}
    </div>
</td>

<td class="center hp-container creature-adder" 
    on:click|stopPropagation={(evt) => {
    tracker.setUpdate(creature, evt);
}}>
    <div>
        {@html creature.hpDisplay}
    </div>
</td>

<td class="center ac-container"
    on:click|stopPropagation={e => {
        const el = e.targetNode.firstChild ? e.targetNode.firstChild : e.targetNode;
        const range = document.createRange();
        range.selectNodeContents(el);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    }}
    on:focusout={(e) => {
        const sel = window.getSelection();
        sel.empty();
        if (e.targetNode.textContent == "") {
            e.targetNode.textContent = DEFAULT_UNDEFINED;
        }
}}>
    <div 
        contenteditable
        on:keydown={function (evt) {
            if (evt.key === "Enter" || evt.key === "Tab") {
                evt.preventDefault();
                this.blur();
                return;
            }
        }}
        on:input={v => {
            creature.current_ac = v.currentTarget.textContent;
        }}
        aria-label={creature.current_ac != creature.ac ? String(creature.ac) : ""}
        style={`font-weight: ${creature.current_ac != creature.ac ? "bold" : ""}`}
        >{creature.current_ac ? creature.current_ac : DEFAULT_UNDEFINED}</div>
</td>

<td class="controls-container">
    <CreatureControls
        on:click={(e) => e.stopPropagation()}
        on:tag
        on:edit
        on:hp
        {creature}
    />
</td>

<style scoped>
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
    .ac-container {
        cursor: text;
    }
</style>
