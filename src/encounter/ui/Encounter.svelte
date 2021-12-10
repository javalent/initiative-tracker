<script lang="ts">
    import { ExtraButtonComponent, Notice } from "obsidian";
    import { START_ENCOUNTER } from "src/utils";

    import { createEventDispatcher } from "svelte";

    const dispatch = createEventDispatcher();

    import { Creature } from "src/utils/creature";
    import {
        encounterDifficulty,
        formatDifficultyReport
    } from "src/utils/encounter-difficulty";
    import type InitiativeTracker from "src/main";
    import type { StackRoller } from "../../../../obsidian-dice-roller/src/roller";

    export let plugin: InitiativeTracker;
    export let name: string = "Encounter";
    export let creatures: [Creature, string | number][] = [];
    export let players: boolean | string[] = true;
    export let xp: number;

    let totalXP = xp ?? 0;
    export let playerLevels: number[];

    const creatureMap: Map<Creature, number> = new Map();
    const rollerMap: Map<Creature, StackRoller> = new Map();

    for (let [creature, count] of creatures) {
        let number: number = Number(count);
        if (plugin.canUseDiceRoller) {
            let roller = plugin.getRoller(`${count}`) as StackRoller;
            roller.on("new-result", () => {
                creatureMap.set(creature, roller.result);
            });
            rollerMap.set(creature, roller);
            roller.roll();
        } else {
            creatureMap.set(creature, number);
        }
        if (!xp) {
            totalXP += creature.xp * number;
        }
    }
    let difficulty = encounterDifficulty(
        playerLevels,
        creatures.map((creature) => creature[0].xp)
    );

    const open = (node: HTMLElement) => {
        new ExtraButtonComponent(node)
            .setIcon(START_ENCOUNTER)
            .setTooltip("Begin Encounter")
            .onClick(async () => {
                if (!plugin.view) {
                    await plugin.addTrackerView();
                }
                if (plugin.view) {
                    const creatures: Creature[] = [...creatureMap]
                        .map(([creature, number]) => {
                            if (isNaN(Number(number)) || number < 1)
                                return [creature];
                            return [...Array(number).keys()].map((v) =>
                                Creature.from(creature)
                            );
                        })
                        .flat();

                    plugin.view?.newEncounter({
                        name,
                        players,
                        creatures,
                        xp
                    });
                    plugin.app.workspace.revealLeaf(plugin.view.leaf);
                } else {
                    new Notice(
                        "Could not find the Initiative Tracker. Try reloading the note!"
                    );
                }
            });
    };

    /* onMount(async () => {
        if (roller) {
        }
    }); */
    const rollerEl = (node: HTMLElement, creature: Creature) => {
        console.log(
            "🚀 ~ file: Encounter.svelte ~ line 68 ~ rollerMap.get(creature)!.static",
            creature.name,
            rollerMap.get(creature)!.isStatic
        );
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
                    {#each creatures as [creature, count]}
                        <li aria-label={label(creature)} class="creature-li">
                            <strong use:rollerEl={creature} />
                            <span>
                                &nbsp;{creature.name}{count == 1 ? "" : "s"}
                            </span>
                            <!-- {#if creature.xp}
                                <span>
                                    ({creature.xp * number} XP)
                                </span>
                            {/if} -->
                        </li>
                    {/each}
                </ul>
            {:else}
                <strong>No creatures</strong>
            {/if}
        </div>

        <div class="encounter-xp">
            {#if totalXP > 0 && difficulty}
                <span aria-label={formatDifficultyReport(difficulty)}
                    >The encounter is <em
                        >{difficulty.difficulty}<em /> ({totalXP} XP)</em
                    ></span
                >
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
