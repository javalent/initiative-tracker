import { Creature } from "../../utils/creature";
import type InitiativeTracker from "../../main";
import { derived, get, Updater, writable } from "svelte/store";
import { equivalent } from "../../encounter";
import { Platform } from "obsidian";
import type {
    Condition,
    InitiativeTrackerData,
    InitiativeViewState,
    UpdateLogMessage
} from "../../../@types";
import { OVERFLOW_TYPE } from "../../utils";
import type Logger from "../../logger/logger";
import type { StackRoller } from "../../../../obsidian-dice-roller/src/roller";

type HPUpdate = {
    saved: boolean;
    resist: boolean;
    customMod: "2" | "1";
};
type CreatureUpdate = {
    hp?: number;
    ac?: number | string;
    initiative?: number;
    name?: string;
    marker?: string;
    temp?: number;
    max?: number;
    status?: Condition[];
    hidden?: boolean;
    enabled?: boolean;
};
type CreatureUpdates = { creature: Creature; change: CreatureUpdate };
const modifier = Platform.isMacOS ? "Meta" : "Control";
function createTracker() {
    const creatures = writable<Creature[]>([]);
    const updating = writable<Map<Creature, HPUpdate>>(new Map());
    const { subscribe, set, update } = creatures;

    let _logger: Logger;

    const $round = writable<number>(1);
    const $state = writable<boolean>(false);
    const setState = (state: boolean) => {
        $state.set(state);
        if (state) {
            if (!_logger?.logging) {
                _logger?.new({
                    name: get($name),
                    players: current_order.filter((c) => c.player),
                    creatures: current_order.filter((c) => !c.player),
                    round: get($round)
                });
            } else {
                _logger?.log(`Combat re-started`);
            }
        } else {
            _logger?.log("Combat stopped");
        }
        updateAndSave((creatures) => {
            if (creatures.length && !creatures.find((c) => c.active)) {
                current_order[0].active = true;
            }
            return creatures;
        });
    };
    const $name = writable<string | null>();
    const $party = writable<string | null>();

    const data = writable<InitiativeTrackerData>();
    let _settings: InitiativeTrackerData;

    const condensed = derived(creatures, (values) => {
        if (_settings.condense) {
            values.forEach((creature, _, arr) => {
                const equiv = arr.filter((c) => equivalent(c, creature));
                equiv.forEach((eq) => {
                    eq.initiative = Math.max(...equiv.map((i) => i.initiative));
                });
            });
        }
        return values;
    });

    let current_order: Creature[] = [];
    const ordered = derived(condensed, (values) => {
        const sort = [...values];
        sort.sort((a, b) => {
            return b.initiative - a.initiative;
        });
        current_order = sort;
        return sort;
    });

    const updateCreatures = (...updates: CreatureUpdates[]) =>
        update((creatures) => {
            for (const { creature, change } of updates) {
                if (change.initiative) {
                    creature.initiative = Number(change.initiative);
                }
                if (change.name) {
                    creature.name = change.name;
                    creature.number = 0;
                }
                if (change.hp) {
                    // Reduce temp HP first
                    change.hp = Number(change.hp);
                    if (change.hp < 0 && creature.temp > 0) {
                        const remaining = creature.temp + change.hp;
                        creature.temp = Math.max(0, remaining);
                        change.hp = Math.min(0, remaining);
                    }
                    // Clamp HP at 0 if clamp is enabled in settings
                    if (_settings.clamp && creature.hp + change.hp < 0) {
                        change.hp = -creature.hp;
                    }
                    // Handle overflow healing according to settings
                    if (
                        change.hp > 0 &&
                        change.hp + creature.hp > creature.max
                    ) {
                        switch (_settings.hpOverflow) {
                            case OVERFLOW_TYPE.ignore:
                                change.hp = Math.max(
                                    creature.max - creature.hp,
                                    0
                                );
                                break;
                            case OVERFLOW_TYPE.temp:
                                // Gives temp a value, such that it will be set later
                                change.temp =
                                    change.hp -
                                    Math.min(creature.max - creature.hp, 0);
                                change.hp -= change.temp;
                                break;
                            case OVERFLOW_TYPE.current:
                                break;
                        }
                    }
                    creature.hp += change.hp;
                    if (_settings.autoStatus && creature.hp <= 0) {
                        creature.status.add(
                            _settings.statuses.find(
                                (s) => s.name == "Unconscious"
                            )
                        );
                    }
                }
                if (change.max) {
                    if (creature.hp == creature.max) {
                        creature.hp = Number(change.max);
                    }
                    creature.max = Number(change.max);
                }
                if (change.ac) {
                    creature.ac = change.ac;
                }
                if (change.temp) {
                    let baseline = 0;
                    if (_settings.additiveTemp) {
                        baseline = creature.temp;
                    }
                    creature.temp = Math.max(
                        creature.temp,
                        baseline + change.temp
                    );
                }
                if (change.marker) {
                    creature.marker = change.marker;
                }
                if (change.status?.length) {
                    for (const status of change.status) {
                        if (creature.status.has(status)) {
                            creature.status.delete(status);
                            _logger?.log(
                                `${creature.name} relieved of status ${status.name}`
                            );
                        } else {
                            creature.status.add(status);
                        }
                    }
                }
                if ("hidden" in change) {
                    creature.hidden = change.hidden;
                }
                if ("enabled" in change) {
                    creature.enabled = change.enabled;
                }
                if (!creatures.includes(creature)) {
                    creatures.push(creature);
                }
            }
            return creatures;
        });

    const getEncounterState = (): InitiativeViewState => {
        return {
            creatures: get(creatures).map((c) => c.toJSON()),
            state: get($state),
            name: get($name),
            round: get($round),
            logFile: _logger?.getLogFile() ?? null
        };
    };

    const trySave = () => {
        app.workspace.trigger(
            "initiative-tracker:save-state",
            getEncounterState()
        );
    };

    function updateAndSave(updater: Updater<Creature[]>): void {
        update(updater);
        trySave();
    }

    const setNumbers = (list: Creature[], sublist: Creature[] = list) => {
        for (let i = 0; i < sublist.length; i++) {
            const creature = sublist[i];
            if (
                creature.player ||
                list.filter((c) => c.name == creature.name).length == 1
            ) {
                continue;
            }
            if (creature.number > 0) continue;
            const prior = list
                .filter((c) =>
                    c.display
                        ? c.display == creature.display
                        : c.name == creature.name
                )
                .map((c) => c.number);
            creature.number = prior?.length ? Math.max(...prior) + 1 : 1;
        }
    };

    return {
        subscribe,
        set,

        data,
        setData: (settings: InitiativeTrackerData) => {
            data.set(settings);
            _settings = settings;
        },

        getLogger: () => _logger,

        setLogger: (logger: Logger) => {
            _logger = logger;
        },

        updating,
        updateCreatures,

        setUpdate: (creature: Creature, evt: MouseEvent) =>
            updating.update((creatures) => {
                if (creatures.has(creature)) {
                    creatures.delete(creature);
                } else {
                    creatures.set(creature, {
                        saved: evt.getModifierState("Shift"),
                        resist: evt.getModifierState(modifier),
                        customMod: evt.getModifierState("Alt") ? "2" : "1"
                    });
                }
                return creatures;
            }),
        doUpdate: (toAddString: string, tag: Condition) =>
            updating.update((updatingCreatures) => {
                const messages: UpdateLogMessage[] = [];
                const updates: CreatureUpdates[] = [];

                updatingCreatures.forEach((entry, creature) => {
                    const roundHalf = !toAddString.includes(".");
                    const change: CreatureUpdate = {};
                    const modifier =
                        (entry.saved ? 0.5 : 1) *
                        (entry.resist ? 0.5 : 1) *
                        Number(entry.customMod);
                    const name = [creature.name];
                    if (creature.number > 0) {
                        name.push(`${creature.number}`);
                    }
                    const message: UpdateLogMessage = {
                        name: name.join(" "),
                        hp: null,
                        temp: false,
                        status: null,
                        saved: false,
                        unc: false
                    };

                    if (toAddString.charAt(0) == "t") {
                        let toAdd = Number(toAddString.slice(1));
                        message.hp = toAdd;
                        message.temp = true;
                        change.temp = toAdd;
                    } else {
                        let toAdd = Number(toAddString);
                        toAdd =
                            -1 *
                            Math.sign(toAdd) *
                            Math.max(Math.abs(toAdd) * modifier, 1);
                        toAdd = roundHalf ? Math.trunc(toAdd) : toAdd;
                        message.hp = toAdd;
                        if (creature.hp <= 0) {
                            message.unc = true;
                        }
                        change.hp = toAdd;
                    }
                    if (tag) {
                        message.status = tag.name;
                        if (!entry.saved) {
                            change.status = [tag];
                        } else {
                            message.saved = true;
                        }
                    }
                    messages.push(message);
                    updates.push({ creature, change });
                });
                _logger?.logUpdate(messages);
                updateCreatures(...updates);
                updatingCreatures.clear();
                return updatingCreatures;
            }),
        clearUpdate: () =>
            updating.update((updates) => {
                updates.clear();
                return updates;
            }),

        round: $round,

        name: $name,

        party: $party,
        setParty: (party: string, plugin: InitiativeTracker) =>
            updateAndSave((creatures) => {
                const players = plugin.getPlayersForParty(party);
                $party.set(party);
                creatures = [...creatures.filter((c) => !c.player), ...players];
                return creatures;
            }),

        state: $state,
        getState: () => get($state),
        toggleState: () => {
            setState(!get($state));
        },
        setState,

        goToNext: () =>
            updateAndSave((creatures) => {
                const current = current_order.findIndex((c) => {
                    return c.active;
                });
                if (current == -1) {
                    current_order[0].active = true;
                } else {
                    let enabled = current_order.filter((c) => c.enabled);

                    let nextIndex =
                        (((current + 1) % enabled.length) + enabled.length) %
                        enabled.length;
                    const next =
                        current_order[
                            current_order.findIndex(
                                (c) => c == enabled[nextIndex]
                            )
                        ];
                    if (next) {
                        current_order[current].active = false;
                        if (nextIndex < current) {
                            const round = get($round) + 1;
                            $round.set(round);
                            _logger?.log("###", `Round ${round}`);
                        }
                        _logger?.log("#####", `${next.name}'s turn`);
                        next.active = true;
                    }
                }
                return creatures;
            }),
        goToPrevious: () =>
            updateAndSave((creatures) => {
                const current = current_order.findIndex((c) => {
                    return c.active;
                });
                if (current == 0 && get($round) == 1) return creatures;
                if (current == -1) {
                    current_order[0].active = true;
                } else {
                    let enabled = current_order.filter((c) => c.enabled);

                    let nextIndex =
                        (((current - 1) % enabled.length) + enabled.length) %
                        enabled.length;

                    const next =
                        current_order[
                            current_order.findIndex(
                                (c) => c == enabled[nextIndex]
                            )
                        ];
                    if (next) {
                        current_order[current].active = false;
                        if (nextIndex > current) {
                            const round = get($round) - 1;
                            $round.set(round);
                            _logger?.log("###", `Round ${round}`);
                        }
                        _logger?.log("#####", `${next.name}'s turn`);
                        next.active = true;
                    }
                }
                return creatures;
            }),

        ordered,

        add: async (
            plugin: InitiativeTracker,
            roll: boolean = plugin.data.rollHP,
            ...items: Creature[]
        ) =>
            updateAndSave((creatures) => {
                if (plugin.canUseDiceRoller && roll) {
                    for (const creature of items) {
                        if (!creature?.hit_dice?.length) continue;
                        let roller = plugin.getRoller(
                            creature.hit_dice
                        ) as StackRoller;
                        creature.hp = creature.max = roller.rollSync();
                    }
                }
                creatures.push(...items);
                _logger?.log(
                    _logger?.join(items.map((c) => c.name)),
                    "added to the combat."
                );
                setNumbers(creatures, items);
                return creatures;
            }),
        remove: (...items: Creature[]) =>
            updateAndSave((creatures) => {
                creatures = creatures.filter((m) => !items.includes(m));

                _logger?.log(
                    _logger?.join(items.map((c) => c.name)),
                    "removed from the combat."
                );
                return creatures;
            }),
        replace: (old: Creature, replacer: Creature) => {
            updateAndSave((creatures) => {
                creatures.splice(creatures.indexOf(old), 1, replacer);
                setNumbers(creatures);
                return creatures;
            });
        },
        update: () => update((c) => c),
        roll: (plugin: InitiativeTracker) =>
            updateAndSave((creatures) => {
                for (let creature of creatures) {
                    creature.initiative = plugin.getInitiativeValue(
                        creature.modifier
                    );
                    creature.active = false;
                }
                return creatures;
            }),
        new: (plugin: InitiativeTracker, state?: InitiativeViewState) =>
            updateAndSave((creatures) => {
                $round.set(state?.round ?? 1);
                $state.set(state?.state ?? false);
                $name.set(state?.name ?? null);
                creatures = state?.creatures
                    ? state.creatures.map((c) => Creature.from(plugin, c))
                    : creatures.filter((c) => c.player);
                if (!state || state?.roll) {
                    for (let creature of creatures) {
                        creature.initiative = plugin.getInitiativeValue(
                            creature.modifier
                        );
                        creature.active = false;
                    }
                }
                setNumbers(creatures);
                if (
                    plugin.canUseDiceRoller &&
                    (state?.rollHP ?? plugin.data.rollHP)
                ) {
                    for (const creature of creatures) {
                        if (creature.hit_dice?.length) {
                            let roller = plugin.getRoller(
                                creature.hit_dice
                            ) as StackRoller;
                            creature.hp = creature.max = roller.rollSync();
                        }
                    }
                }

                if (state?.logFile) _logger?.new(state.logFile);
                if (!state && _logger) _logger.logging = false;
                return creatures;
            }),
        reset: () =>
            updateAndSave((creatures) => {
                for (let creature of creatures) {
                    creature.hp = creature.max;
                    creature.enabled = true;
                    creature.hidden = false;
                    creature.status.clear();
                    creature.active = false;
                }
                _logger?.log("Encounter HP & Statuses reset");
                return creatures;
            }),

        getOrderedCreatures: () => get(ordered),
        logUpdate: (messages: UpdateLogMessage[]) => {
            const toLog: string[] = [];
            for (const message of messages) {
                const perCreature: string[] = [];
                if (message.hp) {
                    if (message.temp) {
                        perCreature.push(
                            `${
                                message.name
                            } gained ${message.hp.toString()} temporary HP`
                        );
                    } else if (message.hp < 0) {
                        perCreature.push(
                            `${message.name} took ${(
                                -1 * message.hp
                            ).toString()} damage${
                                message.unc
                                    ? " and was knocked unconscious"
                                    : ""
                            }`
                        );
                    } else if (message.hp > 0) {
                        perCreature.push(
                            `${
                                message.name
                            } was healed for ${message.hp.toString()} HP`
                        );
                    }
                }
                if (message.status) {
                    if (perCreature.length) {
                        perCreature.push("and");
                    } else {
                        perCreature.push(message.name);
                    }
                    if (message.saved) {
                        perCreature.push(`saved against ${message.status}`);
                    } else {
                        perCreature.push(`took ${message.status} status`);
                    }
                }
                toLog.push(perCreature.join(" "));
            }
            _logger?.log(`${toLog.join(". ")}.`);
        },

        getEncounterState,

        updateState: () => update((c) => c)
    };
}

export const tracker = createTracker();
