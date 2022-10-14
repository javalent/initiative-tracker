<script lang="ts">
    import type InitiativeTracker from "src/main";
    import { setContext } from "svelte";
    import Controls from "./Controls.svelte";
    import Table from "./creatures/Table.svelte";
    import Metadata from "./Metadata.svelte";
    import Create from "./Create.svelte";
    import SaveEncounter from "./SaveEncounter.svelte";
    import LoadEncounter from "./LoadEncounter.svelte";

    import { tracker } from "../stores/tracker";
    import { Creature } from "src/utils/creature";
    import { ExtraButtonComponent } from "obsidian";
    import { ADD, COPY } from "src/utils";
    import Updating from "./Updating.svelte";
    import Logger from "src/logger/logger";

    export let plugin: InitiativeTracker;

    tracker.setData(plugin.data);
    tracker.setLogger(new Logger(plugin));
    if (plugin.data.state) {
        tracker.new(plugin.data.state);
    } else {
        tracker.setParty(plugin.data.defaultParty, plugin);
        tracker.roll(plugin);

    }

    setContext<InitiativeTracker>("plugin", plugin);

    let saving = false;
    let loading = false;

    let addNew = false;
    export let addNewAsync = false;
    let editCreature: Creature = null;
    const addButton = (node: HTMLElement) => {
        new ExtraButtonComponent(node)
            .setTooltip("Add Creature")
            .setIcon(ADD)
            .onClick(() => {
                addNew = true;
            });
    };
    const copyButton = (node: HTMLElement) => {
        new ExtraButtonComponent(node)
            .setTooltip("Copy Initiative Order")
            .setIcon(COPY)
            .onClick(async () => {
                const contents = $tracker
                    .map(
                        (creature) => `${creature.initiative} ${creature.name}`
                    )
                    .join("\n");
                await navigator.clipboard.writeText(contents);
            });
    };
</script>

<div class="obsidian-initiative-tracker">
    <Controls
        on:save={() => (saving = true)}
        on:load={() => (loading = true)}
        on:player-view
        on:open-map
    />

    <Metadata />
    <Table />
    <Updating />
    {#if saving}
        <SaveEncounter on:cancel={() => (saving = false)} />
    {:else if loading}
        <LoadEncounter on:cancel={() => (loading = false)} />
    {:else}
        <div class="add-creature-container">
            {#if editCreature || addNew || addNewAsync}
                <Create
                    editing={editCreature != null}
                    name={editCreature?.name}
                    display={editCreature?.display}
                    hp={`${editCreature?.hp}`}
                    initiative={editCreature?.initiative}
                    modifier={editCreature?.modifier}
                    ac={`${editCreature?.ac}`}
                    on:cancel={() => {
                        addNew = false;
                        addNewAsync = false;
                        editCreature = null;
                    }}
                    on:save={(evt) => {
                        const creature = evt.detail;
                        const newCreature = new Creature(
                            {
                                name: creature.name,
                                display: creature.display,
                                hp: creature.hp,
                                ac: creature.ac,
                                modifier: creature.modifier,
                                marker: plugin.data.monsterMarker,
                                xp: creature.xp,
                                player: creature.player,
                                level: creature.level,
                                hidden: creature.hidden
                            },
                            creature.initiative
                        );
                        if (addNewAsync) {
                        } else if (editCreature) {
                            editCreature.name = creature.name;
                            editCreature.ac = creature.ac;
                            editCreature.display = creature.display;
                            editCreature.initiative = creature.initiative;
                            editCreature.modifier = creature.modifier;
                            editCreature.hidden = creature.hidden;
                            /* view.updateCreature(editCreature, {
                                name: creature.name
                            }); */
                        } else {
                            const number = Math.max(
                                isNaN(creature.number) ? 1 : creature.number,
                                1
                            );
                            tracker.add(
                                ...[...Array(number).keys()].map((k) =>
                                    Creature.new(newCreature)
                                )
                            );
                        }
                        addNew = false;
                        addNewAsync = false;
                        editCreature = null;
                    }}
                />
            {:else}
                <div class="context-container">
                    <div use:copyButton class="copy-button" />
                    <div use:addButton class="add-button" />
                </div>
            {/if}
        </div>
    {/if}
</div>

<style scoped>
    .obsidian-initiative-tracker {
        margin: 0 0.5rem;
        min-width: 180px;
    }
    .add-creature-container {
        display: flex;
        flex-flow: column nowrap;
        justify-content: flex-start;
        margin-right: 0.5rem;
    }
    .context-container {
        display: flex;
        flex-flow: row nowrap;
        justify-content: space-between;
    }
    .copy-button {
        width: min-content;
        opacity: 0.25;
    }
    .copy-button:hover {
        opacity: 1;
    }
    .add-button {
        width: min-content;
    }
    .add-button :global(.clickable-icon) {
        margin: 0;
    }
</style>
