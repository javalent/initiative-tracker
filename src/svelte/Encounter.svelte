<script lang="ts">
    import { ExtraButtonComponent } from "obsidian";
    import { START_ENCOUNTER } from "src/utils";

    import { createEventDispatcher } from "svelte";

    const dispatch = createEventDispatcher();

    import type { Creature } from "src/utils/creature";

    export let name: string = "Encounter";
    export let creatures: Creature[] = [];
    export let players: boolean | string[] = true;
    const display: Map<string, number> = new Map();
    const creatureMap: Map<string, Creature> = new Map(
        creatures.map((c) => [c.name, c])
    );
    for (let creature of creatures) {
        display.set(creature.name, (display.get(creature.name) ?? 0) + 1);
    }

    const open = (node: HTMLElement) => {
        new ExtraButtonComponent(node)
            .setIcon(START_ENCOUNTER)
            .setTooltip("Begin Encounter")
            .onClick(() => {
                dispatch("begin-encounter");
            });
    };
    const label = (name: string) => {
        if (!name || !creatureMap.get(name)) return;
        let label = [],
            creature = creatureMap.get(name);
        if (creature.hp) {
            label.push(`HP: ${creature.hp}`);
        }
        if (creature.ac) {
            label.push(`AC: ${creature.ac}`);
        }
        if (creature.modifier) {
            label.push(`MOD: ${creature.modifier}`);
        }
        return `${label.join(", ")}`;
    };
</script>

<div class="encounter-instance">
    <div class="encounter-name">
        <div use:open />
        <h3 data-heading={name} class="initiative-tracker-name">{name}</h3>
    </div>
    <div class="creatures-container">
        {#if players instanceof Array && players.length}
            <div class="encounter-creatures encounter-players">
                <h4>Players</h4>
                <ul>
                    {#each players as player}
                        <li>
                            <span>{player}</span>
                        </li>
                    {/each}
                </ul>
            </div>
        {:else if !players}
            <div class="encounter-creatures encounter-players">
                <h4>No Players</h4>
            </div>
        {/if}

        <div class="encounter-creatures">
            <h4>Creatures</h4>
            {#if creatures.length}
                <ul>
                    {#each Array.from(display) as creature}
                        <li aria-label={label(creature[0])} class="creature-li">
                            <strong>{creature[1]}</strong><span
                                >&nbsp;{creature[0]}{creature[1] == 1
                                    ? ""
                                    : "s"}</span
                            >
                        </li>
                    {/each}
                </ul>
            {:else}
                <strong>No creatures</strong>
            {/if}
        </div>
    </div>
</div>

<style>
    .encounter-name {
        display: flex;
        justify-content: flex-start;
        align-items: center;
    }
    .encounter-instance
        > .creatures-container
        > .encounter-creatures:first-of-type
        h4,
    .encounter-creatures > ul {
        margin-top: 0;
    }
    .creature-li {
        width: fit-content;
    }
</style>
