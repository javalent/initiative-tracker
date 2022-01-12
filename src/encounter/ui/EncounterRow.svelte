<script lang="ts">
    import { ExtraButtonComponent } from "obsidian";

    import type InitiativeTracker from "src/main";
    import { START_ENCOUNTER } from "src/utils";
    import { Creature } from "src/utils/creature";
    import {
        DifficultyReport,
        encounterDifficulty,
        formatDifficultyReport
    } from "src/utils/encounter-difficulty";

    import type { StackRoller } from "../../../../obsidian-dice-roller/src/roller";

    export let name: string = "Encounter";
    export let creatures: Map<Creature, number | string>;
    export let players: boolean | string[] = true;

    export let hide: string[] = [];
    export let xp: number;
    export let playerLevels: number[];
    export let plugin: InitiativeTracker;
    export let headers: string[];

    const creatureMap: Map<Creature, number> = new Map();
    const rollerMap: Map<Creature, StackRoller> = new Map();
    let totalXP = [...creatureMap].reduce((a, c) => a + c[0].xp * c[1], 0);

    for (let [creature, count] of creatures) {
        let number: number = Number(count);
        if (plugin.canUseDiceRoller) {
            let roller = plugin.getRoller(`${count}`) as StackRoller;
            roller.on("new-result", () => {
                creatureMap.set(creature, roller.result);
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
    let difficulty: DifficultyReport;
    $: {
        if (!isNaN(totalXP)) {
            difficulty = encounterDifficulty(
                playerLevels,
                [...creatures].map((creature) => creature[0].xp)
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
                const creatures: Creature[] = [...creatureMap]
                    .map(([creature, number]) => {
                        if (isNaN(Number(number)) || number < 1)
                            return [creature];
                        return [...Array(number).keys()].map((v) =>
                            Creature.from(creature)
                        );
                    })
                    .flat();

                view?.newEncounter({
                    name,
                    players,
                    creatures,
                    xp
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
                    Creature.from(creature)
                );
            })
            .flat();
        view.addCreatures(creatures, true);
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
</script>

<tr class="encounter-row">
    <td>{name}</td>
    {#if headers.includes("creatures")}
        <td>
            {#if !hide.includes("creatures") && creatures.size}
                {#each [...creatures] as [creature, count], index}
                    <span aria-label={label(creature)}>
                        {joiner(index, creatures.size)}
                        <strong
                            use:rollerEl={creature}
                        />&nbsp;{creature.name}{count == 1 ? "" : "s"}
                    </span>
                {/each}
            {:else}
                -
            {/if}
        </td>
    {/if}
    {#if headers.includes("players")}
        <td>
            {#if !hide.includes("players") && players instanceof Array && players.length}
                {#each players as player, index}
                    {joiner(index, players.length)}{player}
                {/each}
            {:else}
                -
            {/if}
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
</style>
