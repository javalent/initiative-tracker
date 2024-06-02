<script lang="ts">
    import { ExtraButtonComponent, setIcon } from "obsidian";

    import type InitiativeTracker from "src/main";
    import { tracker } from "src/tracker/stores/tracker";
    import {
        DEFAULT_UNDEFINED,
        getRpgSystem,
        RANDOM_HP,
        START_ENCOUNTER
    } from "src/utils";
    import { Creature } from "src/utils/creature";
    import CreatureComponent from "./Creature.svelte";
    import type { StackRoller } from "@javalent/dice-roller";
    import { setContext } from "svelte";

    export let name: string = "Encounter";
    export let creatures: Map<Creature, number | string>;
    export let players: string[];

    export let hide: string[] = [];
    export let playerLevels: number[];
    export let plugin: InitiativeTracker;

    setContext("plugin", plugin);
    export let headers: string[];
    export let rollHP: boolean = plugin.data.rollHP;

    let creatureMap: Map<Creature, number> = new Map();
    const rollerMap: Map<Creature, StackRoller> = new Map();
    const rpgSystem = getRpgSystem(plugin);

    for (let [creature, count] of creatures) {
        let number: number = Number(count);
        if (plugin.canUseDiceRoller) {
            let roller = plugin.getRoller(`${count}`) as StackRoller;
            roller.on("new-result", () => {
                creatureMap.set(creature, roller.result);
                creatureMap = creatureMap;
            });
            rollerMap.set(creature, roller);
            roller.rollSync();
        } else {
            creatureMap.set(creature, number);
        }
    }

    $: difficulty = rpgSystem.getEncounterDifficulty(creatureMap, playerLevels);

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
                            Creature.new(creature).toJSON()
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
                    newLog: true,
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
                    Creature.new(creature)
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
                                xp={rpgSystem.getCreatureDifficulty(
                                    creature,
                                    playerLevels
                                )}
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
                {#if difficulty.value}
                    <span
                        aria-label={difficulty.summary}
                        class={difficulty.cssClass}
                    >
                        <strong class="difficulty-label">
                            {difficulty.displayName}
                        </strong>
                    </span>
                {:else}
                    {DEFAULT_UNDEFINED}
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
    .trivial .difficulty-label {
        color: #aaaaaa;
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
