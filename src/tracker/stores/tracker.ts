import type { Creature } from "../../utils/creature";
import type InitiativeTracker from "../../main";
import { derived, get, writable } from "svelte/store";
import { equivalent } from "../../encounter";

function createTracker() {
    const creatures = writable<Creature[]>([]);
    const { subscribe, set, update } = creatures;

    const $round = writable<number>(1);
    const $state = writable<boolean>(false);
    const $name = writable<string | null>("Test Name");
    const $party = writable<string | null>();

    let condense: boolean;

    const condensed = derived(creatures, (values) => {
        if (condense) {
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

    return {
        round: $round,

        name: $name,

        party: $party,
        setParty: (party: string, plugin: InitiativeTracker) =>
            update((creatures) => {
                const players = plugin.getPlayersForParty(party);
                $party.set(party);
                creatures = [...creatures.filter((c) => !c.player), ...players];
                return creatures;
            }),

        state: $state,
        setState: (state: boolean) => {
            $state.set(state);
            update((creatures) => {
                if (creatures.length && !creatures.find((c) => c.active)) {
                    current_order[0].active = true;
                }
                return creatures;
            });
        },

        goToNext: () =>
            update((creatures) => {
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
                            $round.set(get($round) + 1);
                        }
                        next.active = true;
                    }
                }
                return creatures;
            }),
        goToPrevious: () =>
            update((creatures) => {
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
                            $round.set(get($round) - 1);
                        }
                        next.active = true;
                    }
                }
                return creatures;
            }),

        setCondensed: (setting: boolean) => (condense = setting),

        ordered,

        subscribe,
        add: (...items: Creature[]) =>
            update((creatures) => {
                creatures.push(...items);
                return creatures;
            }),
        remove: (...items: Creature[]) =>
            update((creatures) => {
                creatures = creatures.filter((m) => !items.includes(m));
                return creatures;
            }),
        set,
        update: () => update((c) => c),
        roll: (plugin: InitiativeTracker) =>
            update((creatures) => {
                for (let creature of creatures) {
                    creature.initiative = plugin.getInitiativeValue(
                        creature.modifier
                    );
                    creature.active = false;
                }

                return creatures;
            }),
        new: () =>
            update((creatures) => {
                $round.set(1);
                $state.set(false);
                $name.set(null);
                creatures = creatures.filter((c) => c.player);
                return creatures;
            }),
        reset: () =>
            update((creatures) => {
                for (let creature of creatures) {
                    creature.hp = creature.max;
                    creature.enabled = true;
                    creature.hidden = false;
                    const statuses = Array.from(creature.status);
                    statuses.forEach((status) => {
                        this.removeStatus(creature, status);
                    });
                    creature.active = false;
                }
                return creatures;
            })
    };
}

export const tracker = createTracker();
