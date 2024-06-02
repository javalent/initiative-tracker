<script lang="ts">
    import { ExtraButtonComponent, setIcon } from "obsidian";
    import { getRpgSystem, DICE, RANDOM_HP, START_ENCOUNTER } from "src/utils";

    import { Creature } from "src/utils/creature";
    import type InitiativeTracker from "src/main";
    import { tracker } from "src/tracker/stores/tracker";
    import type { CreatureState } from "src/types/creatures";
    import CreatureComponent from "./Creature.svelte";
    import { setContext } from "svelte";
    import type { StackRoller } from "@javalent/dice-roller";

    export let plugin: InitiativeTracker;

    setContext("plugin", plugin);

    export let name: string = "Encounter";
    export let creatures: Map<Creature, number | string> = new Map();
    export let players: string[];
    export let party: string = null;

    export let hide: string[] = [];

    export let rollHP: boolean = plugin.data.rollHP;

    export let playerLevels: number[];

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
                    Creature.new(creature)
                );
            })
            .flat();
        const transformedCreatures: CreatureState[] = [];
        const combinedPlayers = [
            ...(party ? plugin.getPlayerNamesForParty(party) : []),
            ...players
        ];

        const playersForEncounter: Creature[] = [];
        for (const name of new Set(combinedPlayers)) {
            playersForEncounter.push(plugin.getPlayerByName(name));
        }

        for (const creature of [...playersForEncounter, ...creatures]) {
            transformedCreatures.push(creature.toJSON());
        }
        tracker.new(plugin, {
            creatures: transformedCreatures,
            name,
            round: 1,
            state: false,
            logFile: null,
            roll: true,
            rollHP,
            newLog: true
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
                    Creature.new(creature)
                );
            })
            .flat();
        for (const player of players) {
            if (!$tracker.find((creature) => creature.name === player)) {
                creatures.push(plugin.getPlayerByName(player));
            }
        }
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
                                    xp={rpgSystem.getCreatureDifficulty(
                                        creature,
                                        playerLevels
                                    )}
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
                {#if difficulty}
                    <span
                        aria-label={difficulty.summary}
                        class={difficulty.cssClass}
                    >
                        <strong class="difficulty-label"
                            >{difficulty.displayName}</strong
                        >
                        <span class="xp-parent difficulty">
                            <span class="paren left">(</span>
                            <span class="xp-container">
                                {#if difficulty.value > 0}
                                    <span class="xp number"
                                        >{rpgSystem.formatDifficultyValue(
                                            difficulty.value
                                        )}</span
                                    >
                                    <span class="xp text"
                                        >{rpgSystem.valueUnit}</span
                                    >
                                {/if}
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
    .trivial .difficulty-label {
        color: #aaaaaa;
    }
    .icons {
        display: flex;
    }
    .icons > div:first-child :global(.clickable-icon) {
        margin-right: 0;
    }
    .creature-name {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
    }
    .has-icon {
        display: flex;
        align-items: center;
    }
</style>
