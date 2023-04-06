<script lang="ts">
    import { ExtraButtonComponent, setIcon } from "obsidian";

    import type InitiativeTracker from "src/main";
    import { tracker } from "src/tracker/stores/tracker";
    import { RANDOM_HP, START_ENCOUNTER } from "src/utils";
    import { Creature } from "src/utils/creature";
    import CreatureComponent from "./Creature.svelte";
    import {
        DifficultyReport,
        encounterDifficulty,
        formatDifficultyReport
    } from "src/utils/encounter-difficulty";

    import type { StackRoller } from "../../../../obsidian-dice-roller/src/roller";

    export let name: string = "Encounter";
    export let creatures: Map<Creature, number | string>;
    export let players: string[];

    export let hide: string[] = [];
    export let playerLevels: number[];
    export let plugin: InitiativeTracker;
    export let headers: string[];
    export let rollHP: boolean = plugin.data.rollHP;

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
                    (a, c) => a + c[0].xp * c[1],
                    0
                );
            });
            rollerMap.set(creature, roller);
            roller.roll();
        } else {
            creatureMap.set(creature, number);
        }
    }
    totalXP = [...creatureMap].reduce((a, c) => a + c[0].xp * c[1], 0);
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

    const open = (node: HTMLElement) => {
        new ExtraButtonComponent(node)
            .setIcon(START_ENCOUNTER)
            .setTooltip("Begin Encounter")
            .onClick(async () => {
                if (!plugin.view) {
                    await plugin.addTrackerView();
                }

                const view = plugin.view;
                const creatures = [...creatureMap]
                    .map(([creature, number]) => {
                        if (isNaN(Number(number)) || number < 1)
                            return [creature.toJSON()];
                        return [...Array(number).keys()].map((v) =>
                            Creature.new(plugin, creature).toJSON()
                        );
                    })
                    .flat();
                const playerList = players.map((p) =>
                    plugin.getPlayerByName(p).toJSON()
                );

                tracker.new(plugin, {
                    creatures: [...playerList, ...creatures],
                    name,
                    round: 1,
                    state: false,
                    logFile: null,
                    roll: true,
                    rollHP
                });
                plugin.app.workspace.revealLeaf(view.leaf);
            });
    };

    const addButton = (node: HTMLElement) => {
        new ExtraButtonComponent(node).setIcon("plus-with-circle");
    };

    const add = async (evt: MouseEvent) => {
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

    const joiner = (index: number, length: number) => {
        if (length == 1 || index == 0) return "";
        const delim = length > 2 ? "," : "";
        if (index == length - 1) return `${delim} and `;
        return `${delim} `;
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

    const rollEl = (node: HTMLElement) => {
        setIcon(node, RANDOM_HP);
    };
</script>

<tr class="encounter-row">
    <td>{name}</td>
    {#if headers.includes("creatures")}
        <td>
            <ul class="encounter-creatures encounter-list">
                {#if !hide.includes("creatures") && creatures.size}
                    {#each [...creatures] as [creature, count]}
                        <li aria-label={label(creature)}>
                            <CreatureComponent
                                {creature}
                                xp={creature.xp * creatureMap.get(creature)}
                                shouldShowRoll={rollHP}
                                {count}
                            >
                                <strong
                                    class="creature-amount"
                                    use:rollerEl={creature}
                                />
                            </CreatureComponent>
                        </li>
                    {/each}
                {:else}
                    -
                {/if}
            </ul>
        </td>
    {/if}
    {#if headers.includes("players")}
        <td>
            <ul class="encounter-players encounter-list">
                {#if !hide.includes("players") && players instanceof Array && players.length}
                    {#each players as player}
                        <li>
                            {player}
                        </li>
                    {/each}
                {:else}
                    -
                {/if}
            </ul>
        </td>
    {/if}
    {#if plugin.data.displayDifficulty}
        <td>
            <div class="encounter-xp difficulty">
                {#if totalXP > 0 && difficulty}
                    <span
                        aria-label={formatDifficultyReport(difficulty)}
                        class={difficulty.difficulty.toLowerCase()}
                    >
                        <strong class="difficulty-label">
                            {difficulty.difficulty}
                        </strong>
                    </span>
                {:else}
                    -
                {/if}
            </div>
        </td>
    {/if}
    <td>
        <div class="icons">
            <div use:open />
            <div use:addButton on:click={add} aria-label="Add to Encounter" />
        </div>
    </td>
</tr>

<style>
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
    ul {
        margin: 0;
    }
</style>
