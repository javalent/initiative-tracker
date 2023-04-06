<script lang="ts">
    import { ExtraButtonComponent, setIcon } from "obsidian";
    import { DICE, RANDOM_HP, START_ENCOUNTER } from "src/utils";

    import { Creature } from "src/utils/creature";
    import {
        DifficultyReport,
        encounterDifficulty,
        formatDifficultyReport,
        getCreatureXP
    } from "src/utils/encounter-difficulty";
    import type InitiativeTracker from "src/main";
    import type { StackRoller } from "../../../../obsidian-dice-roller/src/roller";
    import { tracker } from "src/tracker/stores/tracker";
    import type { CreatureState } from "@types";
    import CreatureComponent from "./Creature.svelte";

    export let plugin: InitiativeTracker;

    export let name: string = "Encounter";
    export let creatures: Map<Creature, number | string>;
    export let players: string[];
    export let party: string = null;
    export let hide: string[] = [];

    export let rollHP: boolean = plugin.data.rollHP;

    export let playerLevels: number[];

    let totalXP: number;
    let creatureMap: Map<Creature, number> = new Map();
    const rollerMap: Map<Creature, StackRoller> = new Map();

    for (let [creature, count] of creatures) {
        let number: number = Number(count);
        if (plugin.canUseDiceRoller) {
            let roller = plugin.getRoller(`${count}`) as StackRoller;
            roller.on("new-result", () => {
                creatureMap.set(creature, roller.result);
                creatureMap = creatureMap;
                totalXP = [...creatureMap].reduce(
                    (a, c) => a + getCreatureXP(plugin, c[0]) * c[1],
                    0
                );
            });
            rollerMap.set(creature, roller);
            roller.roll();
        } else {
            creatureMap.set(creature, number);
        }
    }

    totalXP = [...creatureMap].reduce(
        (a, c) => a + getCreatureXP(plugin, c[0]) * c[1],
        0
    );
    let difficulty: DifficultyReport;
    $: {
        if (!isNaN(totalXP)) {
            difficulty = encounterDifficulty(
                playerLevels,
                totalXP,
                [...creatureMap.values()].reduce((acc, curr) => acc + curr)
            );
        }
    }

    const openButton = (node: HTMLElement) => {
        new ExtraButtonComponent(node).setIcon(START_ENCOUNTER);
    };

    const open = async () => {
        if (!plugin.view) {
            await plugin.addTrackerView();
        }

        const view = plugin.view;
        const creatures: Creature[] = [...creatureMap]
            .map(([creature, number]) => {
                if (isNaN(Number(number)) || number < 1) return [creature];
                return [...Array(number).keys()].map((v) =>
                    Creature.new(plugin, creature)
                );
            })
            .flat();
        const transformedCreatures: CreatureState[] = [];
        for (const creature of [
            ...plugin.getPlayersForParty(party),
            ...creatures
        ]) {
            transformedCreatures.push(creature.toJSON());
        }
        tracker.new(plugin, {
            creatures: transformedCreatures,
            name,
            round: 1,
            state: false,
            logFile: null,
            roll: true,
            rollHP
        });
        plugin.app.workspace.revealLeaf(view.leaf);
    };

    const addButton = (node: HTMLElement) => {
        new ExtraButtonComponent(node).setIcon("plus-with-circle");
    };

    const add = async (evt: MouseEvent) => {
        if (!plugin.view) {
            await plugin.addTrackerView();
        }
        const creatures: Creature[] = [...creatureMap]
            .map(([creature, number]) => {
                if (isNaN(Number(number)) || number < 1) return [creature];
                return [...Array(number).keys()].map((v) =>
                    Creature.new(plugin, creature)
                );
            })
            .flat();
        tracker.add(plugin, rollHP, ...creatures);
    };

    const rollerEl = (node: HTMLElement, creature: Creature) => {
        if (
            plugin.canUseDiceRoller &&
            rollerMap.has(creature) &&
            !rollerMap.get(creature)!.isStatic
        ) {
            node.appendChild(
                rollerMap.get(creature)?.containerEl ??
                    createSpan({ text: `${creatureMap.get(creature)}` })
            );
        } else {
            node.setText(`${creatureMap.get(creature)}`);
        }
    };

    const label = (creature: Creature) => {
        if (!creature) return;
        let label = [];
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

    $: allRolling =
        rollHP &&
        [...creatures.keys()].filter((c) => c.hit_dice?.length).length ==
            creatures.size;

    const rollEl = (node: HTMLElement) => {
        setIcon(node, RANDOM_HP);
    };
</script>

<div class="encounter-instance">
    <div class="encounter-name">
        <h3 data-heading={name} class="initiative-tracker-name">{name}</h3>
        <div class="icons">
            <div use:openButton on:click={open} aria-label="Start Encounter" />
            <div use:addButton on:click={add} aria-label="Add to Encounter" />
        </div>
    </div>
    <div class="creatures-container">
        {#if !hide.includes("players")}
            {#if players instanceof Array && players.length}
                <div class="encounter-creatures encounter-players">
                    <h4>{party ? party : "Players"}</h4>
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
        {/if}
        <div class="encounter-creatures">
            {#if !hide.includes("creatures")}
                <h4 class="creatures-header">
                    Creatures
                    {#if allRolling}
                        <span
                            class="has-icon"
                            aria-label="Rolling for HP"
                            use:rollEl
                        />
                    {/if}
                </h4>
                {#if creatures.size}
                    <ul>
                        {#each [...creatures] as [creature, count]}
                            <li
                                aria-label={label(creature)}
                                class="creature-li"
                            >
                                <CreatureComponent
                                    {creature}
                                    xp={creature.xp * creatureMap.get(creature)}
                                    shouldShowRoll={!allRolling && rollHP}
                                    {count}
                                >
                                    <strong
                                        class="creature-amount"
                                        use:rollerEl={creature}
                                    />
                                </CreatureComponent>
                            </li>
                        {/each}
                    </ul>
                {:else}
                    <strong>No creatures</strong>
                {/if}
            {/if}
        </div>
        {#if plugin.data.displayDifficulty}
            <div class="encounter-xp difficulty">
                {#if totalXP > 0 && difficulty}
                    <span
                        aria-label={formatDifficultyReport(difficulty)}
                        class={difficulty.difficulty.toLowerCase()}
                    >
                        <strong class="difficulty-label"
                            >{difficulty.difficulty}</strong
                        >
                        <span class="xp-parent difficulty">
                            <span class="paren left">(</span>
                            <span class="xp-container">
                                <span class="xp number">
                                    {totalXP}
                                </span>
                                <span class="xp text">XP</span>
                            </span>
                            <span class="paren right">)</span>
                        </span>
                    </span>
                {/if}
            </div>
        {/if}
    </div>
</div>

<style>
    .encounter-name {
        display: flex;
        justify-content: flex-start;
        align-items: center;
    }
    .encounter-name .initiative-tracker-name {
        margin: 0;
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
    .xp-parent {
        display: inline-flex;
    }
    .difficulty {
        width: fit-content;
    }
    .deadly .difficulty-label {
        color: red;
    }
    .hard .difficulty-label {
        color: orange;
    }
    .medium .difficulty-label {
        color: yellow;
    }
    .easy .difficulty-label {
        color: green;
    }
    .icons {
        display: flex;
    }
    .icons > div:first-child :global(.clickable-icon) {
        margin-right: 0;
    }
    .creature-name,
    .creatures-header {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
    }
    .has-icon {
        display: flex;
        align-items: center;
    }
</style>
